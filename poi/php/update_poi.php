<?php

/*
* Project: FI-WARE
* Copyright (c) 2014 Center for Internet Excellence, University of Oulu, All Rights Reserved
* For conditions of distribution and use, see copyright notice in LICENCE
*/

require 'db.php';
if ($_SERVER['REQUEST_METHOD'] == 'POST' )
{
    $request_body = file_get_contents('php://input');
//     print $request_body;
    
    $request_array = json_decode($request_body, true);
    
    if ($request_array != NULL)
    {
        $uuid = pg_escape_string(key($request_array));
        $poi_data = $request_array[$uuid];
        
        $pgcon = connectPostgreSQL("poidatabase");
        $uuid_exists_query = "SELECT count(*) FROM core_pois WHERE uuid='".$uuid."'";
        $uuid_exists_result = pg_query($uuid_exists_query);
            
        if (!$uuid_exists_result)
        {
            header("HTTP/1.0 500 Internal Server Error");
            $error = pg_last_error();
            die($error);
        }
        
        $row = pg_fetch_row($uuid_exists_result);
        $uuid_exists = $row[0];
        if ($uuid_exists != 1)
        {
            header("HTTP/1.0 400 Bad Request");
            die("The specified UUID was not found!");
        }
        
        //process fw_core component
        if ($poi_data["fw_core"])
        {
            $description = NULL;
            $label = NULL;
            $url = NULL;
            $thumbnail = NULL;
            
//             print "fw_core found!";
            $fw_core = $poi_data["fw_core"];
            
            if (!isset($fw_core['name']) or !isset($fw_core['category']) or !isset($fw_core['location']))
            {
                die ("Error: 'name', 'category' and 'location' are mandatory fields in fw_core!");
            }
            
            $update_timestamp = 0;
            
            if (isset($fw_core['last_update']))
            {
                $last_update = $fw_core['last_update'];
                if (isset($last_update['timestamp']))
                {
                    $update_timestamp = intval($last_update['timestamp']);
                }
                    
            }
            
            if ($update_timestamp == 0)
            {
                header("HTTP/1.0 400 Bad Request");
                die("No valid 'last_update:timestamp' value was found for 'fw_core' component!");
            }
            
            //....
            $curr_timestamp_query = "SELECT timestamp FROM core_pois WHERE uuid='".$uuid."'";
            $curr_timestamp_result = pg_query($curr_timestamp_query);
        
            if (!$curr_timestamp_result)
            {
                header("HTTP/1.0 500 Internal Server Error");
                $error = pg_last_error();
                die($error);
            }
        
            $row = pg_fetch_row($curr_timestamp_result);
            $curr_timestamp = $row[0];
            if ($curr_timestamp != NULL)
            {
                if ($curr_timestamp != $update_timestamp) {
                    header("HTTP/1.0 400 Bad Request");
                    die("The given last_update:timestamp (". $update_timestamp .") does not match the value in the database (". $curr_timestamp .") in fw_core!");
                }
                
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
            
            $new_timestamp = time();
            
            $replace = "UPDATE core_pois SET name='$name', category='$category', location=ST_GeogFromText('POINT($lon $lat)'), description='$description', " .
            "label='$label', url='$url', thumbnail='$thumbnail', timestamp=$new_timestamp WHERE uuid='$uuid';";
            
            //(uuid, name, category, location, description, label, url, thumbnail, timestamp) " . 
            //"VALUES('$uuid', '$name', '$category', ST_GeogFromText('POINT($lon $lat)'), '$description', '$label', '$url', '$thumbnail', $update_timestamp);";
            
            $replace_result = pg_query($replace);
            if (!$replace_result)
            {
                echo "A database error has occured!";
                echo pg_last_error();
                exit;
            }

        
        }
        
        $supported_components = get_supported_components();
        
        //Handle other components from MongoDB...
        $mongodb = connectMongoDB("poi_db");
        foreach($poi_data as $comp_name => $comp_data) 
        {
            if ($comp_name == "fw_core")
            {
                continue;
            }
            if (in_array($comp_name, $supported_components))
            {
                $collection = $mongodb->$comp_name;
                
                $existing_component = getComponentMongoDB($mongodb, $comp_name, $uuid);
                if ($existing_component != NULL)
                {
                    $update_timestamp = 0;
                    
                    if (isset($comp_data['last_update']))
                    {
                        $last_update = $comp_data['last_update'];
                        if (isset($last_update['timestamp']))
                        {
                            $update_timestamp = intval($last_update['timestamp']);
                        }
                    }
                    
                    if ($update_timestamp == 0)
                    {
                        header("HTTP/1.0 400 Bad Request");
                        die("No valid 'last_update:timestamp' value was found for '$comp_name' component!");
                    }
                    
                    
                    if (isset($existing_component['last_update']))
                    {
                        if (isset($existing_component['last_update']['timestamp']))
                        {
                            $curr_timestamp = $existing_component['last_update']['timestamp'];
                            if ($curr_timestamp != $update_timestamp) {
                                header("HTTP/1.0 400 Bad Request");
                                die("The given last_update:timestamp (". $update_timestamp .") does not match the value in the database (". $curr_timestamp .") in fw_core!");
                            }
                        }   
                    }
                }
                
                //TODO: Luo/päivitä timestamp arvo!
                
                if (!isset($comp_data['last_update']))
                {
                    $comp_data['last_update'] = array();
                }
                $comp_data['last_update']['timestamp'] = time();
                
                $comp_data["_id"] = $uuid;               
                $upd_criteria = array("_id" => $uuid);
                $collection->update($upd_criteria, $comp_data, array("upsert" => true));
            }
        }
        
        header("Access-Control-Allow-Origin: *");
        print "POI data updated succesfully!";
    }
    
    else
    {
        header("HTTP/1.0 400 Bad Request");
        die("Error decoding request payload as JSON!");
    }
    
}

else {
     header("HTTP/1.0 400 Bad Request");
     die("You must use HTTP POST for updating data!");
}

?>