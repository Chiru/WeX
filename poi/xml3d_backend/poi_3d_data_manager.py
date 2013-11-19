#!/usr/bin/python
# -*- coding: utf-8 -*-

import sys
import httplib2
import threading
import json
import psycopg2

import time
import BaseHTTPServer
import urlparse
import thread
import psycopg2.extras

import StringIO
import gzip

def initializeDatabase():
    print "Initializing database"
    con = None

    try:
        con = psycopg2.connect(database='poidatabase', user='gisuser')
        cur = con.cursor()
        
        cur.execute('SELECT count(*) FROM poi_3d_entities;')
        num_pois = cur.fetchone()[0]
        print num_pois, "3D models (fw_xml3d) found in local database..."
        con.commit()

    except psycopg2.DatabaseError, e:
        print 'Error %s' % e

    finally:
        if con:
            con.close()

def getPOI3D(parameters):
    con = None
    
    pois = {}
    response_dict = {"pois": pois}
    
    if not "poi_ids" in parameters:
        return
        
    queryID = None
    if "query_id" in parameters:
        response_dict["queryID"] = parameters["query_id"]
    
    try:
        con = psycopg2.connect(database='poidatabase', user='gisuser')
        #cur = con.cursor()
        poi_3d_entity_cur = con.cursor(cursor_factory=psycopg2.extras.DictCursor)
        entity_cur = con.cursor(cursor_factory=psycopg2.extras.DictCursor)
        group_cur = con.cursor(cursor_factory=psycopg2.extras.DictCursor)
        mesh_cur = con.cursor(cursor_factory=psycopg2.extras.DictCursor)
    
        for uuid in parameters["poi_ids"]:
            #print uuid
            component = {}
            pois[uuid] = component

            poi_3d_entity_cur.execute("SELECT entity_id, model_id, model FROM poi_3d_entities WHERE uuid=%s;", (uuid,))
            
            ent = poi_3d_entity_cur.fetchone()
            if ent == None:
                continue
            
            entity = {}
            component["fw_xml3d"] = entity
            
            if ent["model_id"] != None:
                entity["model_id"] = ent["model_id"]
            
            if ent["model"] != None:
                entity["model"] = ent["model"]

            ent_id = ent["entity_id"]
            if ent_id == None:
                continue
            
            entity_cur.execute("SELECT transform_url FROM entities_3d WHERE entity_id=%s;", (ent_id,))
            entity["transform"] = entity_cur.fetchone()["transform_url"]
            
            smgs = []
            entity["shader_mesh_groups"] = smgs
            
            entity_cur.execute("SELECT group_id FROM entity_shader_mesh_groups WHERE entity_id=%s;", (ent_id,))
            for esmg in entity_cur:
                g_id = esmg["group_id"]
                smg = {}
                smgs.append(smg)
                
                group_cur.execute("SELECT shader_id FROM shader_mesh_groups WHERE group_id=%s;", (g_id,))
                shader_id = group_cur.fetchone()["shader_id"]
                
                group_cur.execute("SELECT shader_url FROM shaders WHERE shader_id=%s;", (shader_id,))
                shader_url = group_cur.fetchone()["shader_url"]
                smg["shader"] = shader_url
                
                meshes = []
                smg["meshes"] = meshes
                group_cur.execute("SELECT mesh_id FROM smg_meshes WHERE group_id=%s;", (g_id,))
                for mesh in group_cur:
                    mesh_id = mesh["mesh_id"]
                    mesh_cur.execute("SELECT mesh_url FROM meshes WHERE mesh_id=%s;", (mesh_id,))
                    mesh_url = mesh_cur.fetchone()["mesh_url"]
                    meshes.append(mesh_url)   

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
  