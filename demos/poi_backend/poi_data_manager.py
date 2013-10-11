#!/usr/bin/python
# -*- coding: utf-8 -*-

import sys
import httplib2
import threading
import json
import psycopg2

from xml.etree import ElementTree as ET
from twisted.internet import reactor
#from twisted.python import log
from autobahn.websocket import WebSocketServerFactory, WebSocketServerProtocol, listenWS

import time
import BaseHTTPServer
import urlparse
import thread
import psycopg2.extras

PORT_NUMBER = 8080 # Maybe set this to 9000.

RequestBaseURL = "http://openpois.net/poiquery.php?"

def initializeDatabase():
    print "Initializing database"
    con = None

    try:
        con = psycopg2.connect(database='poidatabase', user='gisuser')
        cur = con.cursor()
        
        #cur.execute('CREATE TABLE IF NOT EXISTS global_points ( uuid uuid PRIMARY KEY, name VARCHAR(64), location GEOGRAPHY(POINT,4326) );')
        cur.execute('SELECT count(*) FROM core_pois;')
        num_pois = cur.fetchone()[0]
        print num_pois, "POIs found on local database..."
        con.commit()

    except psycopg2.DatabaseError, e:
        print 'Error %s' % e

    finally:
        if con:
            con.close()


def updateCacheDatabase(searchResult):
    print "Updating cache"
    con = None

    result = json.loads(searchResult)
    try:
        con = psycopg2.connect(database='poidatabase', user='gisuser')
        cur = con.cursor()

        updated = 0

        if 'pois' not in result:
            return

        for uuid in result['pois']:
            poi = result['pois'][uuid]
            locatio = poi['locations'][0]

            #if not cur.execute('SELECT 1 FROM global_points WHERE uuid = \'' + uuid + '\''):
            #print cur.execute('SELECT EXISTS(SELECT 1 FROM global_points WHERE uuid = \'' + uuid + '\');')
            
            cur.execute('SELECT 1 FROM global_points WHERE uuid = \'' + uuid + '\';')
            if cur.fetchone() is None:
                print str(locatio['lat']) + " " + str(locatio['lon']) + " " + poi['contents'][0]['value']

                cur.execute('INSERT INTO global_points (uuid, name, location) VALUES (%s, %s, ST_SetSRID(ST_MakePoint(%s, %s), 4326));',\
                            (uuid, poi['contents'][0]['value'], locatio['lat'], locatio['lon']) )
                updated += 1

        con.commit()
        print "Updated " + str(updated) + " records to cache"

    except psycopg2.DatabaseError, e:
        print 'Error %s' % e
    finally:
        if con:
            con.close()


#def searchFromCache(request):
    #print "Searching from cache"
    #parameters = json.loads(request)

    #if not parameters["lat"] or not parameters["lon"]:
        #return

    #queryID = parameters["id"]

    #if not parameters["radius"]:
        #parameters["radius"] = 300

    #con = None
    #try:
        #con = psycopg2.connect(database='poidatabase', user='gisuser')
        #cur = con.cursor()
        #cur.execute("SELECT * FROM global_points WHERE \
            #ST_DWithin(location, POINT(%s %s), %s);", parameters['lat'], parameters['lon'], parameters['radius'])
        
        ## SELECT * FROM geotable 
        ## WHERE ST_DWithin(geocolumn, 'POINT(1000 1000)', 100.0);

    #except psycopg2.DatabaseError, e:
        #print 'Error %s' %e
    #finally:
        #if con:
            #con.close()

def searchFromLocalDB(request):
    print "Searching from local POI database"
    parameters = json.loads(request)  

    if not parameters["lat"] or not parameters["lon"]:
        return

    queryID = parameters["id"]
    
    pois = {}
    response_dict = {"pois": pois, "queryID": queryID}


    if not "radius" in parameters:
        parameters["radius"] = 300

    con = None
    try:
        con = psycopg2.connect(database='poidatabase', user='gisuser')
        #cur = con.cursor()
        cur = con.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cur.execute("SELECT uuid, name, category, description, label, url, st_x(location::geometry) as lon, st_y(location::geometry) as lat, st_astext(geometry) as geometry \
        FROM core_pois WHERE ST_DWithin(location, ST_GeogFromText(\'POINT(%s %s)\'), %s);", (parameters['lon'], parameters['lat'], parameters['radius']))

        for record in cur:
          #print record["uuid"], record["name"], record["st_y"]
          poi = {}
          
          uuid = record['uuid']
          poi["location"] = {"type": "wsg84", "lat": record['lat'], "lon": record['lon']}
          
          for key in record.keys():
            
            #Skip these attributes, as they are handled differently
            if key == 'uuid' or key == 'lat' or key == 'lon':
              continue
              
            if record[key] != None:
              poi[key] = record[key]
          
          if uuid != None:
            pois[uuid] = poi

    except psycopg2.DatabaseError, e:
        print 'Error %s' %e
    finally:
        if con:
            con.close()
    
    return response_dict, queryID


def doPoiSearch(request):
    global RequestBaseURL
    http = httplib2.Http()

    parameters = json.loads(request)

    if not parameters["lat"] or not parameters["lon"]:
        return

    queryID = parameters["id"]

    if not 'radius' in parameters:
        parameters["radius"] = 300

    # OpenPOIs db restrictions: max search radius: 5000, max returned POIs: 25
    requestUrl = RequestBaseURL + "lat=" + str(parameters["lat"]) + "&lon=" + str(parameters["lon"]) + \
                 "&radius="+ str(parameters["radius"]) + "&maxfeatures=25&format=application/xml"

    print ("Doing search with requestUrl: " + requestUrl)
    response, content = http.request(requestUrl, 'POST')

    return content, queryID


def parseXmlDocument(document, queryID):
    el = ET.fromstring(document)
    data = {}

    #print ET.dump(el)

    if el.tag == "Error":
        print "Error in search"
        message = {"msg": el.find("msg").text, "query": el.find("query").text}
        return json.dumps({"Error": message})
    elif el.tag =="pois":
        # Iterating through POI elements in the XML and mapping the data into JSON object
        for poiElement in el.findall("poi"):
            uuid, poi = parseXmlPOIElement(poiElement)
            if uuid is not None:
                data[uuid] = poi
    elif el.tag =="poi":
        # Open poi seems to return only one <poi> element, instead of <pois> if there is only one poi found
        uuid, poi = parseXmlPOIElement(el)
        if uuid is not None:
            data[uuid] = poi
    else:
        print "Error in search response"
        message = {"msg": "Invalid response from OpenPOI database.", "query": el.find("query").text}
        return json.dumps({"Error": message})

    # Return query response in JSON. Modified separators for compressing the JSON data a bit.
    # Use indent=2 for pretty print on console.
    return json.dumps({"queryID":queryID, "pois": data}, separators=(',',':')) #indent=2)


def parseXmlPOIElement(el):
    uuid = el.get("id")
    if uuid is None:
        return None

    poi = {}
    contents = []
    locations = []

    poi["source"] = el.get("base", "")

    # Parsing contents
    label = el.find("label")
    if label is not None:
        tmp = {"type": "name", "lang": "en-UK", "value": label.find("value").text}

        if label.get("term") is not None:
            tmp["term"] = label.get("term")

        contents.append(tmp)

    category = el.find("category")
    if category is not None:

        tmp = {"type": "category", "lang": "en-UK", "value":""}
        # Line below has a hack to remove unneeded ' characters from result string,
        # since data format in OpenPOI's database have changed after original code was written
        if category.find("value") is not None:
            tmp["value"] = category.find("value").text.replace("'", "")

        if category.get("scheme") is not None:
            tmp["scheme"] = category.get("scheme")

        contents.append(tmp)

    # Parsing locations
    location = el.find("location")
    if location is not None:
        lat, lon = location.find("point").find("Point").find("posList").text.split()
        locations.append({"type": "wsg84", "lat": lat, "lon": lon})

    # Map POI to JSON
    poi["contents"] = contents
    poi["locations"] = locations

    return uuid, poi
