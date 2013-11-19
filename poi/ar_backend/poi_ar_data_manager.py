#!/usr/bin/python
# -*- coding: utf-8 -*-

import sys
import json
import psycopg2
import psycopg2.extras
import time
import StringIO
import gzip
import requests

fw_core_baseurl = "http://chiru.cie.fi:8080"
fw_xml3d_baseurl = "http://chiru.cie.fi:8081"
fw_remote_device_baseurl = "http://chiru.cie.fi:8090"
fw_rvi_baseurl = "http://dev.cyberlightning.com:44446"


def getPOIsFromRemoteBE(parameters):
    ar_pois = {}
    response_dict = {"pois": ar_pois}
    
    if "query_id" in parameters:
        response_dict["query_id"] = parameters["query_id"]
    
    try:
        fw_core_resp = requests.get(fw_core_baseurl+"/get_pois", params=parameters)
    except requests.ConnectionError:
        print "Error connecting to fw_core backend: " + fw_core_baseurl
        fw_core_resp = None
    try:
        fw_xml3d_resp = requests.get(fw_xml3d_baseurl+"/get_pois", params=parameters)
    except requests.ConnectionError:
        print "Error connecting to fw_xml3d backend: " + fw_xml3d_baseurl
        fw_xml3d_resp = None
    try:
        fw_rd_resp = requests.get(fw_remote_device_baseurl+"/get_pois", params=parameters)
    except requests.ConnectionError:
        print "Error connecting to fw_rd backend: " + fw_remote_device_baseurl
        fw_rd_resp = None

    if fw_core_resp != None:
        fw_core_data = json.loads(fw_core_resp.content)
        fw_core_pois = fw_core_data["pois"]
        ar_pois.update(fw_core_pois)
    
    #for poi in fw_core_pois:
      #print poi
      #ar_pois.update(fw_core_pois[poi])
      
    if fw_xml3d_resp != None:
        fw_xml3d_data = json.loads(fw_xml3d_resp.content)
        fw_xml3d_pois = fw_xml3d_data["pois"]
        for poi in fw_xml3d_pois:
            if poi in ar_pois:
                ar_pois[poi].update(fw_xml3d_pois[poi])
            else:
                ar_pois[poi] = fw_xml3d_pois[poi]

    if fw_rd_resp != None:
        fw_rd_data = json.loads(fw_rd_resp.content)
        fw_rd_pois = fw_rd_data["pois"]
        for poi in fw_rd_pois:
            if poi in ar_pois:
                ar_pois[poi].update(fw_rd_pois[poi])
            else:
                ar_pois[poi] = fw_rd_pois[poi]
	
    return response_dict

def radialSearchFromRemoteBE(parameters):
    ar_pois = {}
    response_dict = {"pois": ar_pois}
    
    if "query_id" in parameters:
        response_dict["query_id"] = parameters["query_id"]
    
    try:
        fw_core_resp = requests.get(fw_core_baseurl+"/radial_search", params=parameters)
    except requests.ConnectionError:
        print "Error connecting to fw_core backend: " + fw_core_baseurl
        return ar_pois
        
    fw_core_data = json.loads(fw_core_resp.content)
    fw_core_pois = fw_core_data["pois"]
    
    ar_pois.update(fw_core_pois)
    
    if len(fw_core_pois.keys()) > 0:
        poi_ids = {"poi_id": fw_core_pois.keys()}
        try:
            fw_xml3d_resp = requests.get(fw_xml3d_baseurl+"/get_pois", params=poi_ids)
        except requests.ConnectionError:
            print "Error connecting to fw_xml3d backend: " + fw_xml3d_baseurl
            fw_xml3d_resp = None
        
        try:
            fw_rd_resp = requests.get(fw_remote_device_baseurl+"/get_pois", params=poi_ids)
        except requests.ConnectionError:
            print "Error connecting to fw_rd backend: " + fw_remote_device_baseurl
            fw_rd_resp = None
        
        if fw_xml3d_resp != None:
            #print fw_xml3d_resp.content
            fw_xml3d_data = json.loads(fw_xml3d_resp.content)
            fw_xml3d_pois = fw_xml3d_data["pois"]
            for poi in fw_xml3d_pois:
                if poi in ar_pois:
                    ar_pois[poi].update(fw_xml3d_pois[poi])

        if fw_rd_resp != None:
            fw_rd_data = json.loads(fw_rd_resp.content)
            fw_rd_pois = fw_rd_data["pois"]
            for poi in fw_rd_pois:
                if poi in ar_pois:
                    ar_pois[poi].update(fw_rd_pois[poi])

    if "category" in parameters:
        if "sensor" in parameters["category"]:
            #fw_rvi_resp = requests.get(fw_rvi_baseurl+"/?action=loadBySpatial&lat=65&lon=25&radius=50000")
            try:
                fw_rvi_resp = requests.get(fw_rvi_baseurl+"/?action=loadBySpatial", params=parameters)
            except requests.ConnectionError:
                print "Error connecting to fw_rvi backend: " + fw_rvi_baseurl
                fw_rvi_resp = None
            #print fw_rvi_resp.url
            #print fw_rvi_resp.content
            
            if fw_rvi_resp != None:
                fw_rvi_data = json.loads(fw_rvi_resp.content)
                #fw_rvi_devices = fw_rvi_data["devices"]
                for uuid in fw_rvi_data:
                    rvi_uuid = uuid
                    device=fw_rvi_data[uuid]
                    rvi_container = {"fw_rvi": device}
                    ar_pois[rvi_uuid] = rvi_container
                    break
            
            #with open('rvi_example_data.json', 'r') as f:
                #rvi_example_poi_str = f.read()
            #rvi_example_poi = json.loads(rvi_example_poi_str)
            #ar_pois["77c30fbd-7dc0-4998-a042-03b2a28ea927"] = rvi_example_poi
 
	
    return response_dict

    
def gzipencode(content):
    out = StringIO.StringIO()
    f = gzip.GzipFile(fileobj=out, mode='w', compresslevel=5)
    f.write(content)
    f.close()
    return out.getvalue()    
        