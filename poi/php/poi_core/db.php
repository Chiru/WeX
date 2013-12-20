<?php

function connectPostgreSQL($db_name)
{
    $pgcon = pg_connect("dbname=".$db_name." user=gisuser");
    
    if (!$pgcon) {
        die("Error connecting to PostgreSQL database: " . $db_name);
    }
    
    return $pgcon;
}

function fw_core_pgsql2array($core_result)
{
    $json_struct = array();
    $pois = array();
    
    while ($row = pg_fetch_assoc($core_result)) {
        //var_dump($row);
        $uuid = $row['uuid'];
        if ($uuid == NULL)
            continue;
        $poi = array();
        $core_component = array();
        $core_component["location"] = array("wsg84" => array("latitude" => $row['lat'], "longitude" => $row['lon']));
        
        foreach (array_keys($row) as $key)
        {
            #Skip these attributes, as they are handled differently
            if ($key == 'uuid' or $key == 'lat' or $key == 'lon')
                continue;
                
            if ($row[$key] != NULL)
                $core_component[$key] = $row[$key];
        }
        
        $poi['fw_core'] = $core_component;
        $pois[$uuid] = $poi;
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

?>