#!/usr/bin/python
# -*- coding: utf-8 -*-

import sys
import httplib2
import json

from xml.etree import ElementTree as ET
from twisted.internet import reactor
#from twisted.python import log
from autobahn.websocket import WebSocketServerFactory, \
                               WebSocketServerProtocol, \
                               listenWS

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
    data = []

    if etree.tag == "Error":
        print "Error in search"
        message = dict()
        message["msg"] = etree.find("msg").text
        message["query"] = etree.find("query").text

        data["error"] = message
        return json.dumps(str(data).replace('\'', '"'))

    for poiElement in etree.findall("poi"):
        poi = dict()

        label = poiElement.find("label")
        if label is not None:
            poi["name"] = label.find("value").text

        info = poiElement.find("category")
        if info is not None:
            poi["info"] = info.find("value").text

        location = poiElement.find("location")
        if location is not None:
            poiLocation = dict()
            poiLocation["lat"], poiLocation["lon"] = location.find("point").find("Point").find("posList").text.split()
            poi["location"] = poiLocation
 
        #print poi

        data.append(poi)

    return '{"pois":' + str(data).replace('\'', '"') + '}'


class MessageBasedHashServerProtocol(WebSocketServerProtocol):
    def onMessage(self, search, binary):
        # self.sendMessage(msg, binary)

        responseMessage = doPoiSearch(search)
        parsedResponse = parseXmlDocument(responseMessage)

        # Used for development since searching from OpenPOIS database was so slow
        # with open ("poiquery.xml", "r") as myfile:
        #     data=myfile.read().replace('\n', '')
        # parsedResponse = parseXmlDocument(data)
        
        print (parsedResponse)
        self.sendMessage(parsedResponse)

    

if __name__ == '__main__':
 
    #log.startLogging(sys.stdout)
 
    factory = WebSocketServerFactory("ws://localhost:9000", debug = False)
    factory.protocol = MessageBasedHashServerProtocol
    listenWS(factory)
 
    reactor.run()
