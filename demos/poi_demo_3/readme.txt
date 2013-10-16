POI demo 3                   2013-10-16

This POI demo displays POI information on Google Maps.
POI information is queried from POI back-end. The format of POI information
is textual json data.

When a POI tag is clicked, the 3D server is queried for associated 3D data.
The 3D data is logged to web console, only

NEW: Changed from using websocket connection to REST.

POI query:
----------
Example:
  http://130.231.12.82:8080/?lat=65.059181&lon=25.468712&id=testi_id&radius=150

Response in JSON format:

 {
     "pois": {
         "<uuid>": {
             "location": {
 			    "type": "wsg84",
                 "lat": "<latitude in degrees>",
                 "lon": "<longitude in degrees>"
             },
             "geometry": "<Well Known Text>",
             "category": "<category label>",
             "name": "<short name>",
 			"label": "<longer name>",
             "description": "<abstract>",
 			"url": "<url of more information>"
         }
     },
     "queryID": "<id to indentify the query>"
 }
 
Full example:
 {
     "pois": {
         "e2845369-57ed-47e6-822a-b09cc247fff5": {
             "location": {
 			    "type": "wsg84",
                 "lat": "65.0593340",
                 "lon": "25.4664775"
             },
             "geometry": "POINT(65.0593340 25.4664775)",
             "category": "cafe",
             "name": "Aulakahvila",
 			"label": "some more info",
             "description": "Cafe at the University of Oulu",
 			"url": "http://www.aulakahvila.com/"
         }
     },
     "queryID": "testi_id"
 }
 
3D data query:
--------------
Example:
  http://130.231.12.82:8081/?points=30ddf703-59f5-4448-8918-0f625a7e1122&
      points=30ddf703-59f5-4448-8918-0f625a7e1123&id=1235
      
Parameters:
    points=<UUID> - Several points can be included in the query.
    id=<query ID>      
      
Response in JSON format:

    {
        "xml3d_models": {
            "<uuid>": [ // entities
                { // entity 1
                    transform: <url>,
                    materials: [
                        { // material 1
                            shader: <url>,
                            meshes: [
                                <url>,...
                            ]
                        } // end material 1
                    ] // end materials
                } // end entity 1
            ] // end entities and object
        } // end xml3d_models
    }

Full example
    {
        "xml3d_models": {
            "30ddf703-59f5-4448-8918-0f625a7e1123": [ // entities
                { // entity 1
                    transform: "http://ransformaattio1",
                    materials: [
                        { // material 1
                            shader: "http://sheideri1",
                            meshes: [
                                "http://mesh1",
                                "http://mesh2"
                            ]
                        } // end material 1
                    ] // end materials
                } // end entity 1
            ] // end entities and object
        } // end xml3d_models
        "queryID": "1235"
    }

