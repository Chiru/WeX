<?php

/*
* Project: FI-WARE
* Copyright (c) 2014 Center for Internet Excellence, University of Oulu, All Rights Reserved
* For conditions of distribution and use, see copyright notice in LICENCE
*/

require 'db.php';
require 'util.php';

if ($_SERVER['REQUEST_METHOD'] == 'DELETE' )
{
    if (isset ($_GET['poi_id']))
    {
        $uuid = pg_escape_string($_GET['poi_id']);
        $pgcon = connectPostgreSQL("poidatabase");
        
        $del_stmt = "DELETE FROM core_pois WHERE uuid='$uuid'";

        $del_result = pg_query($del_stmt);
        
        if (!$del_result)
        {
            header("HTTP/1.0 500 Internal Server Error");
            $error = pg_last_error();
            die($error);
        }
        
        $rows_deleted = pg_affected_rows($del_result);
        
        if ($rows_deleted != 1)
        {
            header("HTTP/1.0 400 Bad Request");
            die("The specified UUID was not found from the database!");
        }
        
        $components = get_supported_components();
        $m_db = connectMongoDB("poi_db");
        foreach($components as $component)
        {
            if ($component == "fw_core")
            {
                continue;
            }
            
            $collection = $m_db->$component;
            $collection->remove(array("_id" => $uuid));
        }
        
        echo "POI deleted succesfully";
        
    }
    
    else {
        header("HTTP/1.0 400 Bad Request");
        die("'poi_id' parameter must be specified!");
    }
 
}

else {
     header("HTTP/1.0 400 Bad Request");
     die("You must use HTTP DELETE for deleting data!");
}

?>