<?php
require 'db.php';

if (isset ($_GET['poi_id']))
{
    $poi_id = $_GET['poi_id'];
    $esc_poi_id = pg_escape_string($poi_id);
    $id_values = explode(",", $esc_poi_id);
    foreach ($id_values as &$val)
    {
        $val = "'".$val."'";
    }
    $esc_ids = implode(",", $id_values);

    $pgcon = connectPostgreSQL("poidatabase");
    
    $query = "SELECT uuid, name, category, description, label, url, thumbnail, st_x(location::geometry) as lon, st_y(location::geometry) as lat, st_astext(geometry) as geometry " .
        "FROM core_pois WHERE uuid IN ($esc_ids)";

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
    echo "'poi_id' parameter must be specified!";
    return;
}


?>