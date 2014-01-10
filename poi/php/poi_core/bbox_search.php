<?php

require 'db.php';

$max_results = 9999;

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
        "FROM core_pois WHERE ST_Intersects(ST_Geogfromtext('POLYGON(($west $south, $east $south, $east $north, $west $north, $west $south))'), location) " .
        "AND category in ($esc_categories) LIMIT $max_results";
    }
    
    else {
        $query = "SELECT uuid, name, category, description, label, url, thumbnail, st_x(location::geometry) as lon, st_y(location::geometry) as lat, st_astext(geometry) as geometry " .
        "FROM core_pois WHERE ST_Intersects(ST_Geogfromtext('POLYGON(($west $south, $east $south, $east $north, $west $north, $west $south))'), location) LIMIT $max_results";
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
    echo "'north' and 'south' and 'east' and 'west' parameters must be specified!";
    return;
}

?>