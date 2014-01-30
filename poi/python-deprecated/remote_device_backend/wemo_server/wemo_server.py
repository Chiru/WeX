#!/usr/bin/python
# -*- coding: utf-8 -*-

#Uses the ouimeaux library for controlling the WeMo remote power switch: 
#https://github.com/iancmcc/ouimeaux

import urlparse
import os
from ouimeaux.environment import Environment
from BaseHTTPServer import BaseHTTPRequestHandler, HTTPServer

def on_switch(switch):
    print "We have found a switch called", switch.name

def turn_on(switch):
    switch.basicevent.SetBinaryState(BinaryState=1)

def turn_off(switch):
    switch.basicevent.SetBinaryState(BinaryState=0)

def get_status(switch):
    switch_state = sw.basicevent.GetBinaryState()
    return switch_state

class MyHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        print("Just received a GET request")
        self.send_response(200)
        self.send_header("Content-type", "text/html")
        self.end_headers()

	device_state = get_status(sw)['BinaryState']
        path = self.path
        if 'set_state_on' in path:
	  turn_on(sw)
	elif 'set_state_off' in path:
	  turn_off(sw)
	elif 'get_state' in path:
	  self.wfile.write(device_state)

    def log_request(self, code=None, size=None):
        print('Request')

    def log_message(self, format, *args):
        print('Message')


if __name__ == "__main__":
    env = Environment(on_switch)
    try:
        env.start()
    except TypeError:
        pass


    sw = env.get_switch('WeMo Switch')

    try:
        server = HTTPServer(('', 8091), MyHandler)
        print('Started http server')
        server.serve_forever()
    except KeyboardInterrupt:
        print('^C received, shutting down server')
        server.socket.close()
