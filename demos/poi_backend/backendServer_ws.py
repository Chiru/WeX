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
import poi_data_manager as pdm

class MessageBasedHashServerProtocol(WebSocketServerProtocol):
    def onOpen(self):
        print ("onOpen")

    def onMessage(self, searchParams, binary):
        class ActionThread(threading.Thread):
            def __init__(self, protocol):
                threading.Thread.__init__(self)
                self.protocol = protocol

            def run(self):
                # print searchFromCache(searchParams)

                #responseMessage, queryID = pdm.doPoiSearch(searchParams)
                responseMessage, queryID = pdm.searchFromLocalDB(searchParams)
                #parsedResponse = pdm.parseXmlDocument(responseMessage, queryID)
                # print (parsedResponse)
                reactor.callFromThread(self.protocol.sendMessage, json.dumps(responseMessage))

                #pdm.updateCacheDatabase(parsedResponse)

        ActionThread(self).start()


        # Used for development since searching from OpenPOIS database was so slow
        # with open ("poiquery.xml", "r") as myfile:
        #     data=myfile.read().replace('\n', '')
        # parsedResponse = parseXmlDocument(data)


if __name__ == '__main__':
    #log.startLogging(sys.stdout)

    pdm.initializeDatabase()

    factory = WebSocketServerFactory("ws://localhost:9000", debug=False)
    factory.protocol = MessageBasedHashServerProtocol
    factory.setProtocolOptions(allowHixie76=True)
    listenWS(factory)

    reactor.run()
