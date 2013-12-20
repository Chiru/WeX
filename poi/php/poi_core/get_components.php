<?php

$components = array("fw_core");

$json_struct = array("components" => $components);
$return_val = json_encode($json_struct);

header("Content-type: application/json");
echo $return_val;

?>