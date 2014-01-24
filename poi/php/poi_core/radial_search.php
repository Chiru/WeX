<?php

require 'db.php';
require 'util.php';

$radius = 300;

if (isset ($_GET['lat']) and isset ($_GET['lon']))
{
    $lat = $_GET['lat'];
    $lon = $_GET['lon'];
             
    if (!is_numeric($lat) or !is_numeric($lon))
    {
        header("HTTP/1.0 400 Bad Request");
        echo "'lat' and 'lon' must be numeric values!";
        return;
    }
    
    if ($lon < -180 or $lon > 180 or $lat < -90 or $lat > 90)
    {
        header("HTTP/1.0 400 Bad Request");
        die("Coordinate values are out of range [-180 -90, 180 90]");
    }
  
    if (isset($_GET['radius']))
    {
        $radius = $_GET['radius'];
        if (!is_numeric($radius))
        {
            header("HTTP/1.0 400 Bad Request");
            echo "'radius' must be a numeric value!";
            return;
        }
    }
  
    $common_params = handle_common_search_params();
    
    $pgcon = connectPostgreSQL("poidatabase");
    
    if (isset($common_params['categories']))
    {
        $query = "SELECT uuid, name, category, description, label, url, thumbnail, st_x(location::geometry) as lon, st_y(location::geometry) as lat, st_astext(geometry) as geometry, timestamp " .
        "FROM core_pois WHERE ST_DWithin(location, ST_GeogFromText('POINT($lon $lat)'), $radius) AND category in (" . $common_params['categories'] . ") LIMIT " . $common_params['max_results'];
    }
    
    else {
        $query = "SELECT uuid, name, category, description, label, url, thumbnail, st_x(location::geometry) as lon, st_y(location::geometry) as lat, st_astext(geometry) as geometry, timestamp " .
        "FROM core_pois WHERE ST_DWithin(location, ST_GeogFromText('POINT($lon $lat)'), $radius) LIMIT " . $common_params['max_results'];
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
    
    
    $return_val = json_encode($json_struct);
    header("Content-type: application/json");
    header("Access-Control-Allow-Origin: *");
    echo $return_val;
}

else {
    header("HTTP/1.0 400 Bad Request");
    echo "'lat' and 'lon' parameters must be specified!";
    return;
}

?>