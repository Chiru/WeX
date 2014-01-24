<?php

function handle_common_search_params()
{
    $params = array();
    
    $params['max_results'] = 9999;
    $params['components'] = get_supported_components();
    
    if (isset($_GET['category']))
    {
        $category = $_GET['category'];
        $esc_categories = escape_csv($category);
        $params['categories'] = $esc_categories;
    }
  
    if (isset($_GET['component']))
    {
        $component = $_GET['component'];
        $esc_components = pg_escape_string($component);
        $components = explode(",", $esc_components);
        $params['components'] = $components;
        
    }
  
    if (isset($_GET['max_results']))
    {
        $max_res = $_GET['max_results'];
        if (!is_numeric($max_res))
        {
            header("HTTP/1.0 400 Bad Request");
            die("'max_results' must be a positive integer value!");
        }
        $max_results = intval($max_res);
        if ($max_results < 1)
        {
            header("HTTP/1.0 400 Bad Request");
            die("'max_results' must be a positive integer value!");
        }
        $params['max_results'] = $max_results;
    }
    
    if (isset($_GET['begin_time']) and isset($_GET['end_time']))
    {
        if (isset($_GET['min_minutes']))
        {
            $min_minutes = $_GET['min_minutes'];
            if (!is_numeric($min_minutes))
            {
                header("HTTP/1.0 400 Bad Request");
                die("'min_minutes' must be a positive integer value1!");
            }
            
            $min_minutes = intval($min_minutes);
            
            if ($min_minutes < 1)
            {
                header("HTTP/1.0 400 Bad Request");
                die("'min_minutes' must be a positive integer value2!");
            }
            $params['min_minutes'] = $min_minutes;
        }
        
        $begin_time = $_GET['begin_time'];
        $end_time = $_GET['end_time'];
        $begin_time_obj = date_parse($begin_time);
        $end_time_obj = date_parse($end_time);
        
        if ($begin_time_obj['error_count'] != 0) {
            header("HTTP/1.0 400 Bad Request");
            die("Error parsing 'begin_time'!");
        }
        
        if ($end_time_obj['error_count'] != 0) {
            header("HTTP/1.0 400 Bad Request");
            die("Error parsing 'end_time'!");
        }
        
    }
    
    return $params;
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


?>