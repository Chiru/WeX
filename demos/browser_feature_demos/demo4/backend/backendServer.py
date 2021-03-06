#!/usr/bin/python
# -*- coding: utf-8 -*-

import sys
import httplib2
import threading
import json

from xml.etree import ElementTree as ET
from twisted.internet import reactor
#from twisted.python import log
from autobahn.websocket import WebSocketServerFactory, WebSocketServerProtocol, listenWS

RequestBaseURL = "http://openpois.net/poiquery.php?"


def doPoiSearch(request):
    global RequestBaseURL
    http = httplib2.Http()

    parameters = json.loads(request)

    if not parameters["lat"] or not parameters["lon"]:
        return

    queryID = parameters["id"]

    if not parameters["radius"]:
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

class MessageBasedHashServerProtocol(WebSocketServerProtocol):
    def onOpen(self):
        print ("onOpen")

    def onMessage(self, searchParams, binary):
        class ActionThread(threading.Thread):
            def __init__(self, protocol):
                threading.Thread.__init__(self)
                self.protocol = protocol

            def run(self):
                responseMessage, queryID = doPoiSearch(searchParams)
                parsedResponse = parseXmlDocument(responseMessage, queryID)
                print (parsedResponse)
                reactor.callFromThread(self.protocol.sendMessage, parsedResponse)

        ActionThread(self).start()


        # Used for development since searching from OpenPOIS database was so slow
        # with open ("poiquery.xml", "r") as myfile:
        #     data=myfile.read().replace('\n', '')
        # parsedResponse = parseXmlDocument(data)


if __name__ == '__main__':
    #log.startLogging(sys.stdout)

    factory = WebSocketServerFactory("ws://localhost:9000", debug=False)
    factory.protocol = MessageBasedHashServerProtocol
    factory.setProtocolOptions(allowHixie76=True)
    listenWS(factory)

    reactor.run()
