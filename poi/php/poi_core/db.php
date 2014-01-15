<?php

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
            $core_component["location"] = array("wsg84" => array("latitude" => $row['lat'], "longitude" => $row['lon']));
            
            if ($row['timestamp'] != NULL)
            {
//                 if ($row['userid'] != NULL) {
//                     $core_component['last_update'] = array('timestamp' => $row['timestamp'], 'user_id' => $row['userid']);
//                 }
//                 else {
                    $core_component['last_update'] = array('timestamp' => $row['timestamp']);
//                 }
            }
            
            foreach (array_keys($row) as $key)
            {
                #Skip these attributes, as they are handled differently
                if ($key == 'uuid' or $key == 'lat' or $key == 'lon' or $key == 'timestamp' or $key == 'userid')
                    continue;
                    
                if ($row[$key] != NULL)
                    $core_component[$key] = $row[$key];
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

function escape_csv($csv_string)
{
    $esc_str = pg_escape_string($csv_string);
    $str_values = explode(",", $esc_str);
    foreach ($str_values as &$val)
    {
        $val = "'".$val."'";
    }
    $esc_csv = implode(",", $str_values);
    return $esc_csv;
}

function get_supported_components()
{
    $components = array();
    $components[] = "fw_core";
    
    return $components;
}

?>