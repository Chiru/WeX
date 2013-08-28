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


def doPoiSearch(search):
    global RequestBaseURL
    http = httplib2.Http()
    requestUrl = RequestBaseURL + search

    print ("Doing search with requestUrl: " + requestUrl)
    response, content = http.request(requestUrl, 'POST')

    return content


def parseXmlDocument(document):
    etree = ET.fromstring(document)
    data = dict()

    if etree.tag == "Error":
        print "Error in search"
        message = dict()
        message["msg"] = etree.find("msg").text
        message["query"] = etree.find("query").text

        return '{"Error":' + (str(message).replace('\'', '"')) + '}'

    # Iterating through POI elements in the XML and mapping the data into JSON object
    for poiElement in etree.findall("poi"):
        uuid = poiElement.get("id")
        if uuid is None:
            continue

        poi = dict()
        contents = []
        locations = []

        poi["source"] = poiElement.get("base", "")

        # Parsing contents
        label = poiElement.find("label")
        if label is not None:
            tmp = dict(type="name", lang="en-UK")

            if label.get("term") is not None:
                tmp["term"] = label.get("term")

            contents.append(tmp)

        category = poiElement.find("category")
        if category is not None:
            # Line below has a hack to remove unneeded ' characters from result string,
            # since data format in OpenPOI's database have changed after original code was written
            tmp = dict(type="category", lang="en-UK", value=category.find("value").text.replace("'", ""))
            if category.get("scheme") is not None:
                tmp["scheme"] = category.get("scheme")

            contents.append(tmp)

        # Parsing locations
        location = poiElement.find("location")
        if location is not None:
            lat, lon = location.find("point").find("Point").find("posList").text.split()
            locations.append(dict(type="wsg84", lat=lat, lon=lon))

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
