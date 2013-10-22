POI demo 1                   2013-10-09

This POI demo displays POI information on Google Maps.
POI information is queried from POI back-end. The format of POI information
is textual json data.

Edit the URL of the POI back-end to demo4.js at about line 52.

POI data format below:

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
 
