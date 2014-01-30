#!/usr/bin/python
# -*- coding: utf-8 -*-

import sys
import json
import psycopg2
import psycopg2.extras
import time
import StringIO
import gzip

def initializeDatabase():
    print "Initializing database"
    con = None

    try:
        con = psycopg2.connect(database='poidatabase', user='gisuser')
        cur = con.cursor()
        
        cur.execute('SELECT count(*) FROM core_pois;')
        num_pois = cur.fetchone()[0]
        print num_pois, "Core POIs (fw_core) found in local database..."
        con.commit()

    except psycopg2.DatabaseError, e:
        print 'Error %s' % e

    finally:
        if con:
            con.close()

def getPOIsFromLocalDB(parameters):
    pois = {}
    response_dict = {"pois": pois}
    
    if not "poi_ids" in parameters:
        return
        
    queryID = None
    if "query_id" in parameters:
        response_dict["queryID"] = parameters["query_id"]

    con = None
    try:
        con = psycopg2.connect(database='poidatabase', user='gisuser')
        #cur = con.cursor()
        cur = con.cursor(cursor_factory=psycopg2.extras.DictCursor)
        
        max_results = 99999
        if "max_results" in parameters:
            max_results = parameters["max_results"]
        
        uuids = tuple(parameters["poi_ids"])
        cur.execute("SELECT uuid, name, category, description, label, url, thumbnail, st_x(location::geometry) as lon, st_y(location::geometry) as lat, st_astext(geometry) as geometry \
        FROM core_pois WHERE uuid IN %s LIMIT %s", 
        (uuids, max_results))

        for record in cur:
            #print record["uuid"], record["name"], record["st_y"]
            poi = {}
            core_poi = {"fw_core": poi}
            
            uuid = record['uuid']
            poi["location"] = {"type": "wsg84", "latitude": record['lat'], "longitude": record['lon']}
            
            for key in record.keys():
            
                #Skip these attributes, as they are handled differently
                if key == 'uuid' or key == 'lat' or key == 'lon':
                    continue
                
                if record[key] != None:
                    poi[key] = record[key]
            
            if uuid != None:
                pois[uuid] = core_poi

    except psycopg2.DatabaseError, e:
        print 'Error %s' %e
    finally:
        if con:
            con.close()
    
    return response_dict
  
            
            
def radialSearchFromLocalDB(parameters):
    pois = {}
    response_dict = {"pois": pois}
    
    if not "lat" in parameters or not "lon" in parameters:
        return
        
    queryID = None
    if "query_id" in parameters:
        response_dict["queryID"] = parameters["query_id"]

    if not "radius" in parameters:
        parameters["radius"] = 300

    con = None
    try:
        con = psycopg2.connect(database='poidatabase', user='gisuser')
        #cur = con.cursor()
        cur = con.cursor(cursor_factory=psycopg2.extras.DictCursor)
        
        max_results = 99999
        if "max_results" in parameters:
            max_results = parameters["max_results"]
        
        if "categories" in parameters:
            cats = tuple(parameters["categories"])
            cur.execute("SELECT uuid, name, category, description, label, url, thumbnail, st_x(location::geometry) as lon, st_y(location::geometry) as lat, st_astext(geometry) as geometry \
            FROM core_pois WHERE ST_DWithin(location, ST_GeogFromText(\'POINT(%s %s)\'), %s) AND category IN %s LIMIT %s", 
            (parameters['lon'], parameters['lat'], parameters['radius'], cats, max_results))
        else:
            cur.execute("SELECT uuid, name, category, description, label, url, thumbnail, st_x(location::geometry) as lon, st_y(location::geometry) as lat, st_astext(geometry) as geometry \
            FROM core_pois WHERE ST_DWithin(location, ST_GeogFromText(\'POINT(%s %s)\'), %s) LIMIT %s", 
            (parameters['lon'], parameters['lat'], parameters['radius'], max_results))

        for record in cur:
            #print record["uuid"], record["name"], record["st_y"]
            poi = {}
            core_poi = {"fw_core": poi}
            
            uuid = record['uuid']
            poi["location"] = {"type": "wsg84", "latitude": record['lat'], "longitude": record['lon']}
            
            for key in record.keys():
                
                #Skip these attributes, as they are handled differently
                if key == 'uuid' or key == 'lat' or key == 'lon':
                    continue
                
                if record[key] != None:
                    poi[key] = record[key]
            
            if uuid != None:
                pois[uuid] = core_poi

    except psycopg2.DatabaseError, e:
        print 'Error %s' %e
    finally:
        if con:
            con.close()
    
    return response_dict

def gzipencode(content):
    out = StringIO.StringIO()
    f = gzip.GzipFile(fileobj=out, mode='w', compresslevel=5)
    f.write(content)
    f.close()
    return out.getvalue()    
      

#def updateCacheDatabase(searchResult):
    #print "Updating cache"
    #con = None

    #result = json.loads(searchResult)
    #try:
        #con = psycopg2.connect(database='poidatabase', user='gisuser')
        #cur = con.cursor()

        #updated = 0

        #if 'pois' not in result:
            #return

        #for uuid in result['pois']:
            #poi = result['pois'][uuid]
            #locatio = poi['locations'][0]

            ##if not cur.execute('SELECT 1 FROM global_points WHERE uuid = \'' + uuid + '\''):
            ##print cur.execute('SELECT EXISTS(SELECT 1 FROM global_points WHERE uuid = \'' + uuid + '\');')
            
            #cur.execute('SELECT 1 FROM global_points WHERE uuid = \'' + uuid + '\';')
            #if cur.fetchone() is None:
                #print str(locatio['lat']) + " " + str(locatio['lon']) + " " + poi['contents'][0]['value']

                #cur.execute('INSERT INTO global_points (uuid, name, location) VALUES (%s, %s, ST_SetSRID(ST_MakePoint(%s, %s), 4326));',\
                            #(uuid, poi['contents'][0]['value'], locatio['lat'], locatio['lon']) )
                #updated += 1

        #con.commit()
        #print "Updated " + str(updated) + " records to cache"

    #except psycopg2.DatabaseError, e:
        #print 'Error %s' % e
    #finally:
        #if con:
            #con.close()