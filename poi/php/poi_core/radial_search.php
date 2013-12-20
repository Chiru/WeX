<?php

require 'db.php';

$radius = 300;
$max_results = 9999;

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
  
    if (isset($_GET['category']))
    {
        $category = $_GET['category'];
        $esc_category = pg_escape_string($category);
        $category_values = explode(",", $esc_category);
        foreach ($category_values as &$val)
        {
            $val = "'".$val."'";
        }
        $esc_categories = implode(",", $category_values);
    }
  
    if (isset($_GET['max_results']))
    {
        $max_res = $_GET['max_results'];
        if (!is_numeric($max_res))
        {
            header("HTTP/1.0 400 Bad Request");
            echo "'max_results' must be a numeric value!";
            return;
        }
        $max_results = intval($max_res);
    }  
  
    $pgcon = connectPostgreSQL("poidatabase");
    
    if (isset($esc_categories))
    {
        $query = "SELECT uuid, name, category, description, label, url, thumbnail, st_x(location::geometry) as lon, st_y(location::geometry) as lat, st_astext(geometry) as geometry " .
        "FROM core_pois WHERE ST_DWithin(location, ST_GeogFromText('POINT($lon $lat)'), $radius) AND category in ($esc_categories) LIMIT $max_results";
    }
    
    else {
        $query = "SELECT uuid, name, category, description, label, url, thumbnail, st_x(location::geometry) as lon, st_y(location::geometry) as lat, st_astext(geometry) as geometry " .
        "FROM core_pois WHERE ST_DWithin(location, ST_GeogFromText('POINT($lon $lat)'), $radius) LIMIT $max_results";
    }
//     echo "<br>" . $query;

    $core_result = pg_query($query);
    
    if (!$core_result)
    {
        header("HTTP/1.0 500 Internal Server Error");
        $error = pg_last_error();
        die($error);
    }
    
    $json_struct = fw_core_pgsql2array($core_result);
    $return_val = json_encode($json_struct);
    header("Content-type: application/json");
    echo $return_val;
}

else {
    header("HTTP/1.0 400 Bad Request");
    echo "'lat' and 'lon' parameters must be specified!";
    return;
}

?>