<?php
require 'db.php';
if ($_SERVER['REQUEST_METHOD'] == 'POST' )
{
    $request_body = file_get_contents('php://input');
//     print $request_body;
    
    $request_array = json_decode($request_body, true);
    
    if ($request_array != NULL)
    {
//         print "JSON decoded succesfully!";
        
        $pgcon = connectPostgreSQL("poidatabase");
        $uuid_generate_query = "SELECT uuid_generate_v4()";
        $uuid_result = pg_query($uuid_generate_query);
        
        if (!$uuid_result)
        {
            header("HTTP/1.0 500 Internal Server Error");
            $error = pg_last_error();
            die($error);
        }
        $row = pg_fetch_row($uuid_result);
        $uuid = $row[0];
//         print "Generated UUID: ". $uuid;
        
        //process fw_core component
        if ($request_array["fw_core"])
        {
            $description = NULL;
            $label = NULL;
            $url = NULL;
            $thumbnail = NULL;
            
//             print "fw_core found!";
            $fw_core = $request_array["fw_core"];
            
            if (!isset($fw_core['name']) or !isset($fw_core['category']) or !isset($fw_core['location']))
            {
                die ("Error: 'name', 'category' and 'location' are mandatory fields in fw_core!");
            }
            
            $name = pg_escape_string($fw_core['name']);
            $category = pg_escape_string($fw_core['category']);
            
            $location = $fw_core['location'];
            $lat = NULL;
            $lon = NULL;
            if ($location['wsg84'])
            {
                $lat = pg_escape_string($location['wsg84']['latitude']);
                $lon = pg_escape_string($location['wsg84']['longitude']);
            }
            if ($lat == NULL or $lon == NULL)
            {
                header("HTTP/1.0 400 Bad Request");
                die ("Failed to parse location: lat or lon is NULL!");
            }
            
            if (isset($fw_core['description']))
                $description = pg_escape_string($fw_core['description']);
            if (isset($fw_core['label']))
                $label = pg_escape_string($fw_core['label']);
            if (isset($fw_core['url']))
                $url = pg_escape_string($fw_core['url']);
            if (isset($fw_core['thumbnail']))
                $thumbnail = pg_escape_string($fw_core['thumbnail']);
            $timestamp = time();
            $insert = "INSERT INTO core_pois (uuid, name, category, location, description, label, url, thumbnail, timestamp) " . 
            "VALUES('$uuid', '$name', '$category', ST_GeogFromText('POINT($lon $lat)'), '$description', '$label', '$url', '$thumbnail', $timestamp);";
            
            $insert_result = pg_query($insert);
            if (!$insert_result)
            {
                header("HTTP/1.0 500 Internal Server Error");
                echo "A database error has occured!";
                echo pg_last_error();
                exit;
            }
            
            $new_poi_info = array();
            $new_poi_info['uuid'] = $uuid;
            $new_poi_info['timestamp'] = $timestamp;
            $ret_val_arr = array("created_poi" => $new_poi_info);
            $ret_val = json_encode($ret_val_arr);
            
            header("Access-Control-Allow-Origin: *");
            print $ret_val;
        }
        
        //TODO: handle other components from MongoDB...
        
        else
        {
            print "fw_core NOT found!";
        }
    }
    
    else
    {
        header("HTTP/1.0 400 Bad Request");
        die("Error decoding request payload as JSON!");
    }
    
}

else {
     header("HTTP/1.0 400 Bad Request");
     echo "You must use HTTP POST for adding a new POI!";
     return;
}

?>