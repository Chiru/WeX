#!/usr/bin/python
# -*- coding: utf-8 -*-

import sys
import httplib2
import threading
import json
from multiprocessing import Process, current_process, cpu_count
import time
import BaseHTTPServer
import urlparse
import thread
import poi_data_manager as pdm
import SocketServer


PORT_NUMBER = 8080 # This is where the HTTP server listens at
NUMBER_OF_PROCESSES = cpu_count()

def handle_common_query_parameters(query_string):
    common_params = {}
    if 'query_id' in query_string:
        common_params['query_id'] = query_string['query_id'][0]
    if 'category' in query_string:
        common_params['categories'] = []
        for cat in query_string['category']:
            common_params['categories'].append(cat)
    if 'max_results' in query_string:
        common_params['max_results'] = query_string['max_results'][0]
    return common_params

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

        acceptGzip = False
        if "Accept-Encoding" in s.headers:
            if "gzip" in s.headers.get("Accept-Encoding"):
                acceptGzip = True

        if "radial_search" in path:
            if '?' in path:
                path, tmp = path.split('?', 1)
                qs = urlparse.parse_qs(tmp)
                
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
                
                common_params = handle_common_query_parameters(qs)
                sp.update(common_params)

                response = pdm.radialSearchFromLocalDB(sp)

            else:
                s.wfile.write("Required parameters missing!")
                return
            
        elif "get_pois" in path:
            if '?' in path:
                path, tmp = path.split('?', 1)
                qs = urlparse.parse_qs(tmp)
                #print path, qs

                if not 'poi_id' in qs:
                    s.wfile.write("'poi_id' parameter missing!")
                    return
                else:
                    sp['poi_ids'] = qs['poi_id']

                common_params = handle_common_query_parameters(qs)
                sp.update(common_params)
                
                response = pdm.getPOIsFromLocalDB(sp)

            else:
                s.wfile.write("Required parameters missing!")
                return
        
        elif 'get_components' in path:
            response = {"components": ["fw_core"]}
        
        else:
            s.wfile.write("No supported method defined!")
            return

        s.send_response(200)
        s.send_header("Content-type", "application/json; charset=utf-8")
        s.send_header("Access-Control-Allow-Origin", "*")
        
        resp = json.dumps(response)
            
        if acceptGzip:
            resp = pdm.gzipencode(resp)
            s.send_header("Content-length", str(len(str(resp))))
            s.send_header("Content-Encoding", "gzip")
            
        s.end_headers()
        s.wfile.write(resp)
        s.wfile.flush()

def serve_forever(server):
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass

def runpool(number_of_processes):
    print "starting process pool, num_processes:", number_of_processes
    # create a single server object -- children will each inherit a copy
    httpd = myWebServer(("", PORT_NUMBER), MyHandler)

    # create child processes to act as workers
    for i in range(number_of_processes-1):
        Process(target=serve_forever, args=(httpd,)).start()
 
    # main process also acts as a worker
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    httpd.server_close()      
      
if __name__ == '__main__':
    #log.startLogging(sys.stdout)

    pdm.initializeDatabase()

    #server_class = BaseHTTPServer.HTTPServer
    print time.asctime(), "Server Starts - %s:%s" % ("localhost", PORT_NUMBER)
    runpool(NUMBER_OF_PROCESSES)
    print time.asctime(), "Server Stops - %s:%s" % ("localhost", PORT_NUMBER)
    
    
