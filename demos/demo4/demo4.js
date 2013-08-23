(function ( namespace ) {
    var map, geocoder, homeMarker, positionMarker, poiWindow, poiStorage = {}, markers = [],
        webSocket = null,
        centerChangedTimeout,
        BACKEND_ADDRESS = "ws://localhost:9000";

        window.WebSocket = (window.WebSocket || window.MozWebSocket);

    function loadScript() {
        var script = document.createElement( "script" );
        script.type = "text/javascript";
        script.src = "https://maps.googleapis.com/maps/api/js?v=3.exp&sensor=true&callback=demo4.initialize";
        document.body.appendChild( script );

        wex.Util.log( "Loading Google Maps API V3." );

    }

    namespace.initialize = function () {
        wex.Util.log( "Initialising the demo." );

        document.querySelector( '#button1' ).onclick = locate;
        document.querySelector( '#button2' ).onclick = codeAddress;
        document.querySelector( '#button4' ).onclick = updateMap;
        //document.querySelector( '#button5' ).onclick = searchPOIs;

        geocoder = new google.maps.Geocoder();

        var mapOptions = {
            zoom: 15,
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            center: new google.maps.LatLng(65.0610432, 25.468170099999952) //Initial location Oulu University
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

        poiWindow = new google.maps.InfoWindow({
            content: "asda"
        });


        google.maps.event.addListener(map, 'zoom_changed', function() {
            var zoomLevel = map.getZoom();

            console.log("Zoom level: " + zoomLevel);
        });

        google.maps.event.addListener(map, 'center_changed', function() {
            // Initiate new search after timeout
            clearTimeout(centerChangedTimeout);
            centerChangedTimeout = window.setTimeout(searchPOIs, 2000);
        });

        // HTML5 Geolocation
        locate();

        // Open connection to backend server
        connectBackend();

        // Adding example POIs to the map, please remove after implementing POI back-end.
        // parsePoiData();
    };

    function connectBackend() {
        try {
            if (window.WebSocket !== undefined) {
                webSocket = new window.WebSocket( BACKEND_ADDRESS );
            }
            else {
                alert( "This Browser does not support WebSockets." );
                return;
            }
        } catch (e) {
            console.error( 'ERROR:', e.stack );
            return;
        }

        webSocket.onopen = function () {
            console.log("WebSocket opened");
        }.bind( this );

        webSocket.onmessage = function ( msg ) {
            //console.log("Got msg: " + msg.data);
            parsePoiData(msg.data);
        }.bind( this );

        webSocket.onclose = function () {
            setTimeout (function () { connectBackend }, 5000)
        }

    }

    function searchPOIs() {
        wex.Util.log("Doing search from OpenPOIS database, this can take several minutes.");
        wex.Util.log("Map center: lat=" + map.getCenter().lat() + " lon=" + map.getCenter().lng());

        webSocket.send("lat=" + map.getCenter().lat() + "&lon=" + map.getCenter().lng() + "&radius=500&format=application/xml");

        // this will return error message (No POIs found)
        //webSocket.send("lat=42.349433712876&lon=-71.040894451933&maxfeatures=9&format=application/xml");

    }

    function storeMarker(marker){

    }

    function updateMarker( pos, marker ) {

        var markerOptions = 
        {
            //zIndex: 200,
            optimized: false
        };

        marker.setMap( map );
        marker.setPosition( pos );
        marker.setOptions(markerOptions);
    }


    // Geolocation
    function locate() {
        if ( navigator.geolocation ) {
            wex.Util.log( "Getting current position..." );
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

        wex.Util.log( "Location found." );
    }

    function handleNoGeolocation( errorFlag ) {
        if ( errorFlag ) {
            alert( 'Error: The Geolocation service failed.' );
        } else {
            alert( 'Error: Your browser doesn\'t support geolocation.' );
        }
        map.setCenter(  new google.maps.LatLng(65.0610432, 25.468170099999952) );
    }

    function codeAddress() {
        wex.Util.log( "Finding address/coordinate..." );

        var address = document.querySelector( '#address' ).value;
        geocoder.geocode( { 'address': address}, function ( results, status ) {
            if ( status === google.maps.GeocoderStatus.OK ) {
                map.setCenter( results[0].geometry.location );
                updateMarker( results[0].geometry.location, positionMarker );
                wex.Util.log( "Location found." );
            } else {
                alert( 'Geocode was not successful: ' + status );
            }
        } );
    }


    // POI handling
    function fetchPoiData() {
        wex.Util.log( "Fetching POI data..." );

        parsePoiData();
    }

    function parsePoiData( data ) {
        // var exampleData = {
        //     "65.0620455,25.46816549999994": {"name": "POI1", "info": "Point of interest number 1.", "icon":""},
        //     "65.0620455,25.467165499999965": {"name": "POI2", "info": "Point of interest number 2.", "icon":""},
        //     "65.0620455,25.469165499999917": {"name": "POI3", "info": "Point of interest number 3.", "icon":""},
        //     "65.06004549999999,25.46816549999994": {"name": "POI4", "info": "Point of interest number 4.", "icon":""}
        // };

        var jsonData, poiData, coord, coords, pos, i, length;

        wex.Util.log("Parsing POI data...");
        console.log(data)

        jsonData = JSON.parse(data)
        console.log(jsonData);
        length = jsonData.pois.length

        for (i = 0; i < length; i+=1) {
            
            poiData = jsonData['pois'][i];
            console.log(poiData);
            pos = new google.maps.LatLng( poiData['location']['lat'], poiData['location']['lon'] );
            addPOIToMap(pos, poiData)
        }

        wex.Util.log("Ready.");
    }

    function findPOI( pos ) {
        var posString = pos.lat() + "," + pos.lng(), poiMarker, poiData, poiIcon;

        if(poiStorage.hasOwnProperty(posString)){
            return poiStorage[posString];
        } else {
            return false;
        }
    }

    function addPOIToMap( pos, data ) {
        var posString = pos.lat() + "," + pos.lng(), poiMarker, poiData, poiIcon;

        if ( !poiStorage.hasOwnProperty( pos ) ) {

            data = data || {};
            data = wex.Util.extend({name: "Unknown", info: "NaN", icon: ""}, data);

            if(data.icon && typeof data.icon === 'string'){
                poiIcon = "http://chart.apis.google.com/chart?chst=d_map_pin_icon&chld="+data.icon+"|7CFF00|000000";
            }else{
                poiIcon = "http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=P|7CFF00|000000";
            }

            poiMarker = new google.maps.Marker(
                {
                 icon: poiIcon,
                 title: "Click to view data"
                } );


            poiData = {name: data.name, info: data.info, marker: poiMarker};

            google.maps.event.addListener(poiMarker, 'click', function() {
                map.setZoom(15);
                poiWindow.content = '<div class="infoTitle">' + data.name + '</div>' +
                    '<div class="infoText">' + data.info + '</div>';
                poiWindow.open(map, poiMarker);

            });

            poiStorage[posString] = poiData;

            updateMarker( pos, poiMarker );

            console.log(poiStorage);
        }
    }


    function updateMap() {
        fetchPoiData();        
    }


    window.onload = loadScript;


}( window['demo4'] = window.demo4 || {} ));
