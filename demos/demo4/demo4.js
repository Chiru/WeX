(function ( namespace ) {
    var log = wex.Util.log, map, geocoder, homeMarker, positionMarker, poiWindow,
        poiStorage = {},
        markers = [],
        oldSearchPoints = [],
        webSocket = null,
        centerChangedTimeout,
        oldMapCenter,
        CENTER_CHANGED_THRESHOLD = 130,
        BACKEND_ADDRESS = "ws://localhost:9000",

        searchRadius = 300;

    window.WebSocket = (window.WebSocket || window.MozWebSocket);

    /*function loadScript() {
     var script = document.createElement( "script" );
     script.type = "text/javascript";
     script.src = "https://maps.googleapis.com/maps/api/js?v=3.exp&sensor=true&callback=demo4.initialize";
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
            zoom: 15,
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            center: new google.maps.LatLng( 65.0610432, 25.468170099999952 ) //Initial location Oulu University
        };

        map = new google.maps.Map( document.getElementById( 'map-canvas' ),
            mapOptions );

        homeMarker = new google.maps.Marker( {
            icon: "http://chart.apis.google.com/chart?chst=d_map_pin_icon&chld=home|FEFE00",
            title: "Current position"
        } );

        positionMarker = new google.maps.Marker( {
            icon: "http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=L|00FFFF",
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

            if ( zoomLevel <= 14 ) {
                searchRadius = 1000;
            } else if ( zoomLevel >= 18 ) {
                searchRadius = 200;
            } else if ( zoomLevel > 14 && zoomLevel < 18 ) {
                searchRadius = 1000 - (zoomLevel - 10) * 100;
            }

            log( "Zoom level: " + zoomLevel + " Search radius: " + searchRadius );
        } );

        google.maps.event.addListener( map, 'center_changed', function () {
            var mapCenter = map.getCenter(), dist, minDist = Infinity, i, len;

            //TODO: Experimental feature. Reducing amount of queries to backend. (wip)
            dist = distHaversine( mapCenter, oldMapCenter );
            //console.log(dist)

            // Center has to move enough before looking through old search points. Reduces processing amount.
            if ( dist > CENTER_CHANGED_THRESHOLD ) {
                console.log("Map center moved above threshold. Dist:", dist, "meters.");

                // Now we check if the new search point is far enough from old query points.
                len = oldSearchPoints.length;
                for (i=len; i--;){
                    dist = distHaversine(mapCenter, oldSearchPoints[i]['center']);
                    console.log(dist);
                    if(dist < minDist){
                        minDist = dist;
                    }
                }
                if(minDist <= searchRadius/2){
                    return;
                }
                console.log("No old query points near. Threshold:", searchRadius/2, "meters. Min dist:", minDist);

                // Initiate new search after timeout
                clearTimeout( centerChangedTimeout );
                centerChangedTimeout = window.setTimeout( function () {
                    searchPOIs();
                }, 1000 );

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
        var R = 6378137; // earth's mean radius in m
        var dLat = rad( p2.lat() - p1.lat() );
        var dLong = rad( p2.lng() - p1.lng() );

        var a = Math.sin( dLat / 2 ) * Math.sin( dLat / 2 ) +
            Math.cos( rad( p1.lat() ) ) * Math.cos( rad( p2.lat() ) ) * Math.sin( dLong / 2 ) * Math.sin( dLong / 2 );
        var c = 2 * Math.atan2( Math.sqrt( a ), Math.sqrt( 1 - a ) );
        var d = R * c;

        return d.toFixed( 3 );
    }


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
            //console.log("Got msg: " + msg.data);
            parseMsg( msg.data );
        }.bind( this );

        webSocket.onclose = function () {
            setTimeout( function () {
                connectBackend();
            }, 5000 );
        };
    }

    function parseMsg( msg ) {
        var json = JSON.parse( msg );

        if ( json["Error"] ) {
            log( "Error: " + json["Error"]["msg"] + encodeURIComponent( json["Error"]["query"] ) );
        } else {
            parsePoiData( json );
        }
    }

    function searchPOIs() {
        var mapCenter = map.getCenter();
        log( "Doing search from OpenPOIS database, this can take several minutes." );
        log( "Map center: lat=" + mapCenter.lat() + " lon=" + mapCenter.lng() );

        webSocket.send( JSON.stringify( {lat: mapCenter.lat(), lon: mapCenter.lng(), radius: searchRadius} ) );

        oldSearchPoints.push({center: mapCenter, radius: searchRadius});

        var circle = new google.maps.Circle({
            strokeWeight: 1,
            fillColor: '#FF0000',
            fillOpacity: 0.10,
            radius: searchRadius,
            center: mapCenter,
            map: map
        });

        console.log(oldSearchPoints)

        // this will return error message (No POIs found)
        //webSocket.send("lat=42.349433712876&lon=-71.040894451933&maxfeatures=9&format=application/xml");

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
            navigator.geolocation.getCurrentPosition( handleFoundLocation, function () {
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
        map.setCenter( new google.maps.LatLng( 65.0610432, 25.468170099999952 ) );
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

        var jsonData, poiData, coord, coords, pos, i, uuid, pois,
            contents, locations, location;

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

            if ( poiData.hasOwnProperty( "locations" ) ) {
                locations = poiData['locations'];

                for ( i = locations.length; i--; ) {
                    location = locations[i];
                    if ( location['type'] === 'wsg84' ) {
                        pos = new google.maps.LatLng( location['lat'], location['lon'] );
                        addPOIToMap( pos, poiData );
                    }
                }

            }

            console.log( poiData );

            storePoi( uuid, poiData );
        }

        log( "Ready." );

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

    function addPOIToMap( pos, data ) {
        var poiMarker, contents, content, i, len,
            name, category;

        if ( !poiStorage.hasOwnProperty( pos ) ) {

            data = data || {};
            //data = wex.Util.extend({name: "Unknown", info: "NaN", icon: ""}, data);

            contents = data['contents'] || [];
            len = contents.length;

            for ( i = len; i--; ) {
                content = contents[i];

                if ( content['type'] === 'name' ) {
                    if ( content['term'] === 'primary' ) {
                        name = content['value'];
                    }
                } else if ( content['type'] === 'category' ) {
                    category = content['value'];
                }
            }

            poiMarker = new google.maps.Marker(
                {
                    icon: "http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=P|7CFF00|000000",
                    title: "Click to view data"
                } );

            google.maps.event.addListener( poiMarker, 'click', function () {
                //map.setZoom(15);
                poiWindow.content = '<div id="infoTitle">' + name + '</div>' +
                    '<div id="infoText">' +
                    "<p>Source: " + data["source"] + "</p>" +
                    "<p>Category: " + category + "</p>" +
                    "<p>Description: - </p>" +
                    '</div>';
                poiWindow.open( map, poiMarker );

            } );

            updateMarker( pos, poiMarker );

        }
    }


    function updateMap() {
        searchPOIs();
    }


    //window.onload = loadScript;


}( window['demo4'] = window.demo4 || {} ));
