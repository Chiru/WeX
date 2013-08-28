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

    if not parameters["radius"]:
        parameters["radius"] = 300
    requestUrl = RequestBaseURL + "lat=" + str(parameters["lat"]) + "&lon=" + str(parameters["lon"]) + \
                 "&radius="+ str(parameters["radius"]) + "&format=application/xml"

    print ("Doing search with requestUrl: " + requestUrl)
    response, content = http.request(requestUrl, 'POST')

    return content


def parseXmlDocument(document):
    etree = ET.fromstring(document)
    data = {}

    if etree.tag == "Error":
        print "Error in search"
        message = {"msg": etree.find("msg").text, "query": etree.find("query").text}

        return json.dumps({"Error": message})

    # Iterating through POI elements in the XML and mapping the data into JSON object
    for poiElement in etree.findall("poi"):
        uuid = poiElement.get("id")
        if uuid is None:
            continue

        poi = {}
        contents = []
        locations = []

        poi["source"] = poiElement.get("base", "")

        # Parsing contents
        label = poiElement.find("label")
        if label is not None:
            tmp = {"type": "name", "lang": "en-UK", "value": label.find("value").text}

            if label.get("term") is not None:
                tmp["term"] = label.get("term")

            contents.append(tmp)

        category = poiElement.find("category")
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
        location = poiElement.find("location")
        if location is not None:
            lat, lon = location.find("point").find("Point").find("posList").text.split()
            locations.append({"type": "wsg84", "lat": lat, "lon": lon})

        # Map POI to JSON
        poi["contents"] = contents
        poi["locations"] = locations
        data[uuid] = poi

    return json.dumps({"pois": data}, indent=2)


class MessageBasedHashServerProtocol(WebSocketServerProtocol):
    def onOpen(self):
        print ("onOpen")

    def onMessage(self, search, binary):
        class ActionThread(threading.Thread):
            def __init__(self, protocol):
                threading.Thread.__init__(self)
                self.protocol = protocol

            def run(self):
                responseMessage = doPoiSearch(search)
                parsedResponse = parseXmlDocument(responseMessage)
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
