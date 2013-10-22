/* Local POI database indexed by UUID */

var miwi_poi_pois = {}; // ["UUID": {<POI data>},...]

/**/

/*  str2html - convert any string for safe display in html
    ========
   
    This converts characters not allowed in html strings to well behaving
    html character entities.           
    
    str2html(rawstr: string): string;
        rawstr - string not controlled for contents
        
        *result - safe, well behaving html representation of the input string
        
    Example: "Rat & Arms" -> "Rat &amp; Arms"    
*/        
        
var str2html_table = {
	"<": "&lt;",
	"&": "&amp;",
	"\"": "&quot;",
	"'": "&apos;",
	">": "&gt;",
};

function str2html (rawstr) {
	var result = "";
	for (var i = 0; i < rawstr.length; i++) {
		result = result + (str2html_table[rawstr[i]] ? 
				(str2html_table[rawstr[i]]) : (rawstr[i]));
	}
	return result;
}
/**/

(function ( namespace ) {
    var log = wex.Util.log, map, geocoder, homeMarker, positionMarker, 
        poiWindow,
        poiStorage = {},
        markers = [],
        oldSearchPoints = {},
        queries = {},
        queryID = 0, //Running number to identify POI search areas, and to 
                     //track search success
        webSocket = null,
        centerChangedTimeout,
        oldMapCenter,
        CENTER_CHANGED_THRESHOLD = 130,
		BACKEND_ADDRESS = "ws://130.231.12.82:9000",

        searchRadius = 300;

    window.WebSocket = (window.WebSocket || window.MozWebSocket);

    /*function loadScript() {
     var script = document.createElement( "script" );
     script.type = "text/javascript";
     script.src = "https://maps.googleapis.com/maps/api/js?v=3.exp&" + 
            "sensor=true&callback=demo4.initialize";
     document.body.appendChild( script );

     log( "Loading Google Maps API V3." );

     }*/

    // This function is called by Google API when it has been loaded
    // Initialises the demo
    namespace.initialize = function () {
        log( "Initialising the demo." );

        document.querySelector( '#button1' ).onclick = locate;
        document.querySelector( '#button2' ).onclick = codeAddress;
        document.querySelector( '#button4' ).onclick = updateMap;

        geocoder = new google.maps.Geocoder();

        var mapOptions = {
            zoom: 16,
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            center: new google.maps.LatLng( 65.0610432, 25.468170099999952 ) 
                //Initial location Oulu University
        };

        map = new google.maps.Map( document.getElementById( 'map-canvas' ),
            mapOptions );

        homeMarker = new google.maps.Marker( {
            icon: "http://chart.apis.google.com/chart?chst=d_map_pin_icon&" + 
                "chld=home|FEFE00",
            title: "Current position"
        } );

        positionMarker = new google.maps.Marker( {
            icon: "http://chart.apis.google.com/chart?chst=d_map_pin_letter&" + 
                "chld=L|00FFFF",
            title: "Found location"
        } );

        poiWindow = new google.maps.InfoWindow( {
            content: '<div class="infoTitle">DefaultName</div>' +
                '<div class="infoText">' +
                "<p>Category: DefaultCategory </p>" +
                '</div>'
        } );

        oldMapCenter = map.getCenter();

        google.maps.event.addListener( map, 'zoom_changed', function () {
            var zoomLevel = map.getZoom();

            if ( zoomLevel <= 10 ) {
                searchRadius = 5000;
            } else if ( zoomLevel <= 14 && zoomLevel > 10 ) {
                searchRadius = 5000 + (10 - zoomLevel) * 1000;
            } else if ( zoomLevel > 5 && zoomLevel < 20 ) {
                searchRadius = 1000 - (zoomLevel - 10) * 100;
            } else if ( zoomLevel >= 20 ) {
                searchRadius = 50;
            }

            log( "Zoom level: " + zoomLevel + " Search radius: " + 
                    searchRadius );
        } );

        google.maps.event.addListener( map, 'center_changed', function () {
            var mapCenter = map.getCenter(), dist, minDist = Infinity, i, len,
                searchPoints = oldSearchPoints[searchRadius + ''];

            //TODO: Experimental feature. Reducing amount of queries to backend.
            // (wip)
            dist = distHaversine( mapCenter, oldMapCenter );
            //console.log(dist)

            // Center has to move enough before looking through old search 
            // points. Reduces processing amount.
            if ( dist > CENTER_CHANGED_THRESHOLD ) {
                //console.log("Map center moved above threshold. Dist:", dist, 
                // "meters.");

                // Now we check if the new search point is far enough from old 
                // query points.
                if ( searchPoints ) {
                    len = searchPoints.length;

                    for ( i = len; i--; ) {
                        dist = distHaversine( mapCenter, 
                                searchPoints[i]['center'] );
                        //console.log(dist);
                        if ( dist < minDist ) {
                            minDist = dist;
                        }

                    }

                    if ( minDist <= searchRadius * 0.8 ) {
                        return;
                    }
                    console.log( "No old query points near. Threshold:", 
                            searchRadius, "meters. Min dist:", minDist );
                }

                // Initiate new search after small timeout, so the search is 
                // not constantly triggered while moving the map
                clearTimeout( centerChangedTimeout );
                centerChangedTimeout = window.setTimeout( 
                        function ( lat, lng ) { searchPOIs( lat, lng );
                }, 800, mapCenter.lat(), mapCenter.lng() );

                oldMapCenter = mapCenter;

            }
        } );

        // HTML5 Geolocation
        locate();

        // Open connection to backend server
        connectBackend();

    };

    function rad( x ) {
        return x * Math.PI / 180;
    }

    // Distance between two points on a sphere
    function distHaversine( p1, p2 ) {
        var R, dLat, dLong, a, c;

        R = 6378137; // earth's mean radius in m
        dLat = rad( p2.lat() - p1.lat() );
        dLong = rad( p2.lng() - p1.lng() );

        a = Math.sin( dLat / 2 ) * Math.sin( dLat / 2 ) +
            Math.cos( rad( p1.lat() ) ) * Math.cos( rad( p2.lat() ) ) * 
            Math.sin( dLong / 2 ) * Math.sin( dLong / 2 );
        c = 2 * Math.atan2( Math.sqrt( a ), Math.sqrt( 1 - a ) );

        return R * c;
    }

/*
    Live and Blank choices to query the data. Use Blank, if back-end is not
    available, or when experimenting new kind of data.
*/
/* Live ... */
    function connectBackend() {
        try {
            if ( window.WebSocket !== undefined ) {
                webSocket = new window.WebSocket( BACKEND_ADDRESS );
            }
            else {
                alert( "This Browser does not support WebSockets." );
                return;
            }
        } catch (e) {
            log( 'ERROR:', e.stack );
            return;
        }

        webSocket.onopen = function () {
            console.log( "WebSocket opened" );
            searchPOIs();
        }.bind( this );

        webSocket.onmessage = function ( msg ) {
            console.log("Got msg: " + msg.data);
            parseMsg( msg.data );
        }.bind( this );

        webSocket.onclose = function () {
            setTimeout( function () {
                connectBackend();
            }, 5000 );
        };
    }
/* Blank ... 
    function connectBackend() {
        webSocket = {};
        webSocket.onopen = function () {
            console.log( "WebSocket dummy opened" );
            searchPOIs();
        }.bind( this );

        webSocket.onmessage = function ( msg ) {
            //console.log("Got msg: " + msg.data);
            parseMsg( msg.data );
        }.bind( this );

        webSocket.onclose = function () {
            setTimeout( function () {
                connectBackend();
            }, 5000 );
        };
		webSocket.send = function (query) {
		    console.log("Sending: " + query);
			// create immediate response with constant data
			webSocket.onmessage({data: JSON.stringify(
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
                         },
                         "e2845369-57ed-47e6-822a-b09cc247fff6": {
                             "location": {
                 			    "type": "wsg84",
                                 "lat": "65.01089",
                                 "lon": "25.466"
                             },
                             "geometry": "POINT(65.01089 25.466)",
                             "category": "cinema",
                             "name": "Finnkino Plaza",
                 			 "label": "",
                             "description": "Marraskuussa 2006 avatun " +
                             "elokuvakeskuksen kaikki salit on varustettu " +
                             "alan uusimmilla ja parhaimmilla kuva- ja " + 
                             "ääniratkaisuilla.",
                 			 "url": "http://www.finnkino.fi/movies/oulu/"
                         }
                     },
                     "queryID": "testi_id"
                 }
			    )	 
			
			});
		};
		
		webSocket.onopen();
    }
 
 ... end Blank */

    function parseMsg( msg ) {
	    console.log("msg=\"" + msg + "\"");
        var json = JSON.parse( msg );

        if ( json["Error"] ) {
            log( "Error: " + json["Error"]["msg"] + encodeURIComponent( 
                    json["Error"]["query"] ) );
        } else {
            parsePoiData( json );
        }
    }

    function searchPOIs( lat, lng ) {
        var center, searchPoint;

        if ( !lat || !lng ) {
            center = map.getCenter();
            lat = center.lat();
            lng = center.lng();
        }

        log( "Doing search from OpenPOIS database, this can take several " + 
                "minutes." );
        log( "Map center: lat=" + lat + " lon=" + lng );

        webSocket.send( JSON.stringify( {lat: lat, lon: lng, 
                radius: searchRadius, id: queryID} ) );

        searchPoint = new google.maps.LatLng( lat, lng );


        var circle = new google.maps.Circle( {
            strokeWeight: 1,
            fillColor: '#FF0000',
            fillOpacity: 0.10,
            radius: searchRadius,
            center: searchPoint,
            map: map
        } );

        if ( !oldSearchPoints.hasOwnProperty( searchRadius + '' ) ) {
            oldSearchPoints[searchRadius + ''] = [];
        }

        queries[queryID + ''] = {id: queryID, center: searchPoint, 
                radius: searchRadius, ready: false, debugShape: circle};
        oldSearchPoints[searchRadius + ''].push( queries[queryID + ''] );

        queryID++;

        console.log( oldSearchPoints )

    }

    function findSearchPoint( id ) {
        //console.log( "searching spoint, id", id );
        if ( queries.hasOwnProperty( id + '' ) ) {
            return queries[id + ''];
        }

        return false;
    }

    function storePoi( uuid, poiData ) {
        if ( !poiStorage.hasOwnProperty( uuid ) ) {
            poiStorage[uuid] = poiData;
        }
    }

    function updateMarker( pos, marker ) {

        var markerOptions =
        {
            //zIndex: 200,
            optimized: false
        };

        marker.setMap( map );
        marker.setPosition( pos );
        marker.setOptions( markerOptions );
    }


    // Geolocation
    function locate() {
        if ( navigator.geolocation ) {
            log( "Getting current position..." );
            navigator.geolocation.getCurrentPosition( handleFoundLocation, 
                function () {
                    handleNoGeolocation( true );
                } );
        } else {
            // Browser doesn't support Geolocation
            handleNoGeolocation( false );
        }
    }

    function handleFoundLocation( position ) {
        var pos = new google.maps.LatLng( position.coords.latitude,
            position.coords.longitude );

        updateMarker( pos, homeMarker );
        // console.log(pos)
        map.setCenter( pos );

        log( "Location found." );
    }

    function handleNoGeolocation( errorFlag ) {
        if ( errorFlag ) {
            alert( 'Error: The Geolocation service failed.' );
        } else {
            alert( 'Error: Your browser doesn\'t support geolocation.' );
        }
        map.setCenter( new google.maps.LatLng( 65.0610432, 
                25.468170099999952 ) );
    }

    function codeAddress() {
        log( "Finding address/coordinate..." );

        var address = document.querySelector( '#address' ).value;
        geocoder.geocode( { 'address': address}, function ( results, status ) {
            if ( status === google.maps.GeocoderStatus.OK ) {
                map.setCenter( results[0].geometry.location );
                updateMarker( results[0].geometry.location, positionMarker );
                log( "Location found." );
            } else {
                alert( 'Geocode was not successful: ' + status );
            }
        } );
    }

    function parsePoiData( data ) {

        var counter = 0, jsonData, poiData, pos, i, uuid, pois,
            contents, locations, location, searchPoint;

        if ( !data ) {
            return;
        }

        log( "Parsing POI data..." );

        if ( !data.hasOwnProperty( "pois" ) ) {
            log( "Error: Invalid POI data." );
            return;
        }

        pois = data['pois'];

        for ( uuid in pois ) {
            poiData = pois[uuid];
            if ( poiData.hasOwnProperty( "location" ) ) {
                location = poiData['location'];

               if ( location['type'] === 'wsg84' ) {
                 pos = new google.maps.LatLng( location['lat'], 
                        location['lon'] );
                 miwi_poi_pois[uuid] = poiData;
                 addPOI_UUID_ToMap( pos, poiData, uuid );
                 counter++;
               }
            }

            //console.log( poiData );

            storePoi( uuid, poiData );
        }

        if ( data.hasOwnProperty( "queryID" ) ) {
            searchPoint = findSearchPoint( data['queryID'] );
            searchPoint['debugShape'].setOptions( {fillColor: "#76EE00"} );
            searchPoint['ready'] = true;
        }

        log( "Ready." );
        log( counter + " pois added on the map." );

        console.log( poiStorage );
    }

    function findPOIs( pos, radius ) {
        var posString = pos.lat() + "," + pos.lng();

        //TODO: Find POIs from client POI storage using location and radius
    }


    function getPOI( uuid ) {
        if ( poiStorage.hasOwnProperty( uuid ) ) {
            return poiStorage[uuid];
        } else {
            return false;
        }
    }

    function POI_onClick(poiMarker, uuid) {
        var data, name, label, category, icon_string, description, link;
 
console.log("uuid: " + uuid);
        
        data = miwi_poi_pois[uuid] || {"label": "No information available"};
        name = data["name"] || "A Point of Interest";
        category = data["category"] || "";
        label = data["label"] || "";
        description = data["description"] || "";
        url = data["url"] || "";
        // Default icon is star !
        icon_string = miwi_poi_icon_strings[category] || "star";

        //map.setZoom(15);
        poiWindow.content = '<div id="infoTitle">' + str2html(name) + '</div>' +
                '<div id="infoText">' + 
                ((label != "") ? ("<p>" + str2html(label) + "</p>") : "") +
                ((description != "") ? 
                    ("<p>" + str2html(description) + "</p>") : "") +
                ((url != "") ?
                    ("<p><a target=\"_blank\" href=\"" + str2html(url) + "\">" +
                    str2html(url) + "</a></p>") : "") +
                '</div>';
	
//console.log(poiWindow.content);
        poiWindow.open( map, poiMarker );

    }


    function addPOI_UUID_ToMap_addListener(poiMarker, op, uuid) {
        /* Anonymous function declaration here creates a closure that binds
           the data in the call stack. An attempt is made to keep the amount of 
           data bound to the closure small.
        */
        google.maps.event.addListener( poiMarker, op, function () {
            POI_onClick(poiMarker, uuid);
        });
    }	
        
    function addPOI_UUID_ToMap( pos, data, uuid ) {
        var poiMarker, contents, content, i, len,
            name, label, category, icon_string, description;

        data = data || {};
        name = data["name"] || "N.N.";
        category = data["category"] || "Point of interest - maybe";
        // Default icon is star !
        icon_string = miwi_poi_icon_strings[category] || "star";
        poiMarker = new google.maps.Marker(
            {
                icon: (icon_string == "") ? ("http://" + 
	            "chart.apis.google.com/chart?chst=d_map_pin_letter&" + 
		        "chld=P|7CFF00|000000") : 
		        ("http://chart.apis.google.com/chart?chst=" + 
		        "d_map_pin_icon&chld=" + icon_string + 
		        "|7CFF00|000000"),
                title: category + ": " + name
            } );

        addPOI_UUID_ToMap_addListener(poiMarker, 'click', uuid);					

        updateMarker( pos, poiMarker );

    }
    
 
    function updateMap() {
        searchPOIs();
    }


    //window.onload = loadScript;


}( window['demo4'] = window.demo4 || {} ));
