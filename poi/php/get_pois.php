<?php

/*
* Project: FI-WARE
* Copyright (c) 2014 Center for Internet Excellence, University of Oulu, All Rights Reserved
* For conditions of distribution and use, see copyright notice in LICENCE
*/

require 'db.php';
require 'util.php';

$components = get_supported_components();

if (isset ($_GET['poi_id']))
{
    $poi_id = $_GET['poi_id'];
    $esc_ids = escape_csv($poi_id);
    
    if (isset($_GET['component']))
    {
        $component = $_GET['component'];
        $esc_components = pg_escape_string($component);
        $components = explode(",", $esc_components);
    }

    $data = array();
    $esc_ids_arr = explode(",", $esc_ids);
    foreach($esc_ids_arr as $poi_uuid)
    {
        $poi_uuid = str_replace("'", "", $poi_uuid);
        $data[$poi_uuid] = (object) null;
    }
    
    //Include fw_core in result data...
    if (in_array("fw_core", $components))
    {
        $pgcon = connectPostgreSQL("poidatabase");
        
        $query = "SELECT uuid, name, category, description, label, url, thumbnail, st_x(location::geometry) as lon, st_y(location::geometry) as lat, st_astext(geometry) as geometry, timestamp " .
            "FROM core_pois WHERE uuid IN ($esc_ids)";

        $core_result = pg_query($query);
        
        if (!$core_result)
        {
            header("HTTP/1.0 500 Internal Server Error");
            $error = pg_last_error();
            die($error);
        }
        
        $core_json_struct = fw_core_pgsql2array($core_result, TRUE);
        
        $core_pois = $core_json_struct['pois'];
        foreach ($core_pois as $core_poi_uuid => $fw_core_content)
        {
            $data[$core_poi_uuid] = $core_pois[$core_poi_uuid];
        }
    }
    
    //TODO: handle other components from MongoDB...
    
    $mongodb = connectMongoDB("poi_db");
    
    foreach ($components as $component)
    {
        //skip fw_core, as it hase been already handled...
        if ($component == "fw_core")
        {
            continue;
        }
        foreach(array_keys($data) as $uuid)
        {
//             print $uuid;
            $comp_data = getComponentMongoDB($mongodb, $component, $uuid);
            if ($comp_data != NULL)
            {
                $data[$uuid][$component] = $comp_data;
            }
        }
        
    }            
    
    $return_val = json_encode(array("pois" => $data));
    header("Content-type: application/json");
    header("Access-Control-Allow-Origin: *");
    echo $return_val;
    
}

else {
    header("HTTP/1.0 400 Bad Request");
    echo "'poi_id' parameter must be specified!";
    return;
}


?>