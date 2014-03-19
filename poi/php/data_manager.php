<?php

// Dependency: JSON Schema validator, 
// https://github.com/justinrainbow/json-schema
require 'vendor/autoload.php';

function validate_poi_data($poi_data, $poi_schema_file = 'poi_schema_3.3.json')
{
    $result = false;
    
    $retriever = new JsonSchema\Uri\UriRetriever;
    $poi_schema = $retriever->retrieve('file://' . realpath($poi_schema_file));
    
    $refResolver = new JsonSchema\RefResolver($retriever);
    $refResolver->resolve($poi_schema, 'file://' .realpath($poi_schema_file));    
    
    $temp = json_encode($poi_data);
    $poi_data = json_decode($temp);
    
    // Validate
    $validator = new JsonSchema\Validator();
    $validator->check($poi_data, $poi_schema);

    if ($validator->isValid()) {
//         echo "The supplied JSON validates against the schema.\n";
        $result = true;
    } else {
        echo "JSON does not validate. Violations:\n";
        foreach ($validator->getErrors() as $error) {
            echo sprintf("[%s] %s\n", $error['property'], $error['message']);
        }
    }
    
    return $result;
}

?>