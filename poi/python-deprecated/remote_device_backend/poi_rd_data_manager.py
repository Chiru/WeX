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
        
        cur.execute('SELECT count(*) FROM fw_remote_devices;')
        num_pois = cur.fetchone()[0]
        print num_pois, "remote devices (fw_remote_device) found on local database..."
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
        cur.execute("SELECT uuid, get_state_url, set_state_on_url, set_state_off_url \
        FROM fw_remote_devices WHERE uuid IN %s LIMIT %s", 
        (uuids, max_results))

        for record in cur:
            #print record["uuid"], record["name"], record["st_y"]
            poi = {}
            core_poi = {"fw_remote_device": poi}
            
            uuid = record['uuid']
            ctrl_urls = {}
            poi["control_urls"] = ctrl_urls
            
            for key in record.keys():
                
                #Skip these attributes, as they are handled differently
                if key == 'uuid':
                    continue
                
                if record[key] != None:
                    ctrl_urls[key] = record[key]
            
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
    
