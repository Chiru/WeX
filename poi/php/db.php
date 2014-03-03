<?php

/*
* Project: FI-WARE
* Copyright (c) 2014 Center for Internet Excellence, University of Oulu, All Rights Reserved
* For conditions of distribution and use, see copyright notice in LICENCE
*/


function get_supported_components()
{
    $components = array("fw_core", "fw_contact", "fw_xml3d", "fw_media", "fw_time", "fw_sensor", "fw_marker", "fw_testComponent");

    return $components;
}

function connectPostgreSQL($db_name)
{
    $pgcon = pg_connect("dbname=".$db_name." user=gisuser");
    
    if (!$pgcon) {
        die("Error connecting to PostgreSQL database: " . $db_name);
    }
    
    return $pgcon;
}

function fw_core_pgsql2array($core_result, $incl_fw_core)
{
    $json_struct = array();
    $pois = array();
    
    while ($row = pg_fetch_assoc($core_result)) {
        //var_dump($row);
        $uuid = $row['uuid'];
        if ($uuid == NULL)
            continue;
        $poi = array();
        
        //fw_core component is included in the request...
        if ($incl_fw_core == TRUE) {
            $core_component = array();
            $core_component["location"] = array("wgs84" => array("latitude" => intval($row['lat']), "longitude" => intval($row['lon'])));
            
            if ($row['timestamp'] != NULL)
            {
//                 if ($row['userid'] != NULL) {
//                     $core_component['last_update'] = array('timestamp' => $row['timestamp'], 'user_id' => $row['userid']);
//                 }
//                 else {
                    $core_component['last_update'] = array('timestamp' => intval($row['timestamp']));
//                 }
            }
            
            foreach (array_keys($row) as $key)
            {
                #Skip these attributes, as they are handled differently
                if ($key == 'uuid' or $key == 'lat' or $key == 'lon' or $key == 'timestamp' or $key == 'userid')
                    continue;
                    
                if ($row[$key] != NULL)
                {
                    if ($key == 'name' or $key == 'label' or $key == 'description' or $key == 'url')
                    {
                        $core_component[$key] = array("" => $row[$key]);
                    }
                    else
                    {
                        $core_component[$key] = $row[$key];
                    }
                }
            }
            
            $poi['fw_core'] = $core_component;
            $pois[$uuid] = $poi;
        }
        else {
            $pois[$uuid] = (object) null;
        }
        
    }
    $json_struct["pois"] = $pois;
    return $json_struct;
}



function connectMongoDB($db_name)
{
    try {
        $m = new MongoClient();
        $m_db = $m->selectDB($db_name);
        return $m_db;
    } catch (MongoConnectionException $e)
    {
        die("Error connecting to MongoDB server");
    }
}

function getComponentMongoDB($db, $component_name, $uuid)
{
    $collection = $db->$component_name;
    $component = $collection->findOne(array("_id" => $uuid), array("_id" => false));
    return $component;
}

?>