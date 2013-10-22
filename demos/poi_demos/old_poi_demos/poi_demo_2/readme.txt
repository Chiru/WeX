POI demo 2                   2013-10-09

This POI demo displays POI information on Google Maps.
POI information is queried from POI back-end. The format of POI information
is textual json data.

NEW:
When a POI tag is clicked, the 3D server is queried for associated 3D data.
The 3D data is logged to web console, only

Edit the URL of the POI back-end to demo4.js at about line 52.

Websocket is used for communication with database servers.

POI query:
----------
    {
        lat: <centre latitude deg>, 
        lon: <centre longitude deg>, 
        radius: <search radius m>, 
        id: <query ID>
    } 
    
Example:
 {lat: 65.059181, lon: 25.468712, radius: 150, id: 1234} 

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

    {
        points: [<uuid>,...], 
        id: <query ID>
    }
    	
Example:
    {points: ["e2845369-57ed-47e6-822a-b09cc247fff5"], id: "1235"}	

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
            "e2845369-57ed-47e6-822a-b09cc247fff5": [ // entities
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

 
