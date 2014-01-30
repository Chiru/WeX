<?php

/*
* Project: FI-WARE
* Copyright (c) 2014 Center for Internet Excellence, University of Oulu, All Rights Reserved
* For conditions of distribution and use, see copyright notice in LICENCE
*/

require 'db.php';
require 'util.php';

if (isset ($_GET['north']) and isset ($_GET['south']) and isset ($_GET['east']) and isset ($_GET['west']))
{
    $north = $_GET['north'];
    $south = $_GET['south'];
    $east = $_GET['east'];
    $west = $_GET['west'];
             
    if (!is_numeric($north) or !is_numeric($south) or !is_numeric($east) or !is_numeric($west))
    {
        header("HTTP/1.0 400 Bad Request");
        echo "'north' and 'south' and 'east' and 'west' must be numeric values!";
        return;
    }
    
    if ($east < -180 or $east > 180 or $west < -180 or $west > 180 or $north < -90 or $north > 90 or $south < -90 or $south > 90)
    {
        header("HTTP/1.0 400 Bad Request");
        die("Coordinate values are out of range: east and west [-180, 180], north and south [-90, 90]");
    }
  
    $common_params = handle_common_search_params();
  
    $pgcon = connectPostgreSQL("poidatabase");
    
    if (isset($esc_categories))
    {
        $query = "SELECT uuid, name, category, description, label, url, thumbnail, st_x(location::geometry) as lon, st_y(location::geometry) as lat, st_astext(geometry) as geometry, timestamp " .
        "FROM core_pois WHERE ST_Intersects(ST_Geogfromtext('POLYGON(($west $south, $east $south, $east $north, $west $north, $west $south))'), location) " .
        "AND category in (" . $common_params['categories'] . ") LIMIT " . $common_params['max_results'];
    }
    
    else {
        $query = "SELECT uuid, name, category, description, label, url, thumbnail, st_x(location::geometry) as lon, st_y(location::geometry) as lat, st_astext(geometry) as geometry, timestamp " .
        "FROM core_pois WHERE ST_Intersects(ST_Geogfromtext('POLYGON(($west $south, $east $south, $east $north, $west $north, $west $south))'), location) LIMIT " . $common_params['max_results'];
    }
//     echo "<br>" . $query;

    $core_result = pg_query($query);
    
    if (!$core_result)
    {
        header("HTTP/1.0 500 Internal Server Error");
        $error = pg_last_error();
        die($error);
    }
    
    $incl_fw_core = FALSE;
    if (in_array("fw_core", $common_params['components']))
    {
        $incl_fw_core = TRUE;
    }
  
    $json_struct = fw_core_pgsql2array($core_result, $incl_fw_core);
    
    //TODO: handle other components from MongoDB...
    
    $mongodb = connectMongoDB("poi_db");
    
    foreach ($common_params['components'] as $component)
    {
        //skip fw_core, as it hase been already handled...
        if ($component == "fw_core")
        {
            continue;
        }
        foreach(array_keys($json_struct["pois"]) as $uuid)
        {
//             print $uuid;
            $comp_data = getComponentMongoDB($mongodb, $component, $uuid);
            if ($comp_data != NULL)
            {
                $json_struct["pois"][$uuid][$component] = $comp_data;
            }
        }
        
    }    
    
    
    $return_val = json_encode($json_struct);
    header("Content-type: application/json");
    header("Access-Control-Allow-Origin: *");
    echo $return_val;
}

else {
    header("HTTP/1.0 400 Bad Request");
    echo "'north' and 'south' and 'east' and 'west' parameters must be specified!";
    return;
}

?>