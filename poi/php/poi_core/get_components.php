<?php
require 'db.php';

$components = get_supported_components();

$json_struct = array("components" => $components);
$return_val = json_encode($json_struct);

header("Content-type: application/json");
header("Access-Control-Allow-Origin: *");
echo $return_val;

?>