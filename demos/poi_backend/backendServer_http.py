#!/usr/bin/python
# -*- coding: utf-8 -*-

import sys
import httplib2
import threading
import json
import psycopg2
import psycopg2.extras

from xml.etree import ElementTree as ET
from twisted.internet import reactor
#from twisted.python import log
from autobahn.websocket import WebSocketServerFactory, WebSocketServerProtocol, listenWS

import time
import BaseHTTPServer
import urlparse
import thread
import poi_data_manager as pdm
import SocketServer

PORT_NUMBER = 8080 # This is where the HTTP server listens at
default_headers = [('Content-Type', 'application/json'), ('Access-Control-Allow-Origin', '*'), ('Access-Control-Allow-Headers', 'Content-Type')]

class myWebServer(SocketServer.ThreadingMixIn, BaseHTTPServer.HTTPServer): 
  pass

class MyHandler(BaseHTTPServer.BaseHTTPRequestHandler):
    def do_HEAD(s):
        s.send_response(200)
        s.send_header("Content-type", "text/html")
        s.end_headers()
    def do_GET(s):
        """Respond to a GET request."""
	qs = {}
	sp = {}
	path = s.path
	if '?' in path:
	  path, tmp = path.split('?', 1)
	  qs = urlparse.parse_qs(tmp)
	  #print path, qs
	  
	  if not 'id' in qs:
	    s.wfile.write("'id' parameter missing!")
	    return
	  else:
	    sp['id'] = qs['id'][0]
	    
	  if not 'lat' in qs:
	    s.wfile.write("'lat' parameter missing!")
	    return
	  else:
	    sp['lat'] = float(qs['lat'][0])
	  
	  if not 'lon' in qs:
	    s.wfile.write("'lon' parameter missing!")
	    return
	  else:
	    sp['lon'] = float(qs['lon'][0])
	  if 'radius' in qs:
	    sp['radius'] = float(qs['radius'][0])
	      
	  
	else:
	  s.wfile.write("Required parameters missing!")
	  return

	searchParams = json.dumps(sp)
	response, queryID = pdm.searchFromLocalDB(searchParams)
	#parsedResponse = pdm.parseXmlDocument(responseMessage, queryID)
	# print (parsedResponse)

	#pdm.updateCacheDatabase(parsedResponse)


        #parameters: id, lat, lon, radius
        s.send_response(200)
        s.send_header("Content-type", "application/json; charset=utf-8")
        s.send_header("Access-Control-Allow-Origin", "*")
        s.end_headers()
        s.wfile.write(json.dumps(response))

if __name__ == '__main__':
    #log.startLogging(sys.stdout)

    pdm.initializeDatabase()

    #server_class = BaseHTTPServer.HTTPServer
    httpd = myWebServer(("", PORT_NUMBER), MyHandler)
    print time.asctime(), "Server Starts - %s:%s" % ("localhost", PORT_NUMBER)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    httpd.server_close()
    print time.asctime(), "Server Stops - %s:%s" % ("localhost", PORT_NUMBER)
    
    
