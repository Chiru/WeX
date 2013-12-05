(function ( namespace, undefined ) {
    var log = namespace.Util.log, AR = namespace.AR,
        sensorManager, communication, ARManager, sceneManager;

    var orientationListener, gpsPoints = [], remoteControls = {};
    var miwi_ar_pois = {}; // ["UUID": {<POI data>},...]
    
    //hard coded gps point. If there is no POIs found using real gps coordinates, comment the sensorManager.getCurrentPosition(gpsHandler); line and use these coordinates.
    var currentLoc = {
        'latitude' : 65.06095172267227,
        'longitude' : 25.468234419822693
    }
    
    window.onload = function () {

        document.querySelector( '#button_res' ).onclick = get_res;
        document.querySelector( '#button_caf' ).onclick = get_caf;
        document.querySelector( '#button_rdv' ).onclick = get_rdv;
        document.querySelector( '#button_sen' ).onclick = get_sen;
            
        sensorManager = AR.setupSensors();
        communication = AR.setupConnection();
        ARManager = AR.setupARManager();
        sceneManager = AR.setupSceneManager();

        orientationListener = sensorManager.listenSensor( 'orientation' );
        sensorManager.getCurrentPosition(gpsHandler);

        communication.addRemoteService("remoteDevicePOI", null, "http://chiru.cie.fi:8085");
        AR.GUI.init();
        AR.GUI.observeOrientation(orientationListener.signal);
        orientationListener.signal.add(sceneManager.setCameraOrientation);
        sceneManager.setCameraVerticalPlane(65);
    };

    function get_res() {
        getPOIsByCategory(currentLoc, "restaurant");
    }

    function get_caf() {
        getPOIsByCategory(currentLoc, "cafe");
    }

    function get_rdv() {
        getPOIsByCategory(currentLoc, "remote_device");
    }

    function get_sen() {
        getPOIsByCategory(currentLoc, "sensor");
    }
   
    function gpsHandler (position) {
        currentLoc = position.coords;
    }
    
    function getPOIsByCategory(gpsCoordinates, category) {
        var result;
        var restOptions = {
            'function' : "radial_search",
            'lat' : gpsCoordinates.latitude,
            'lon' : gpsCoordinates.longitude,
            'category' : category,
            'query_id' : "testi_id",
            'radius' : 1500 
        }
        log("Requesting POIs...");
        communication.queryData("remoteDevicePOI", restOptions, handlePoi, null);   
    }
    
     function handlePoi(data) {
    
        var uuid, pois, poiData;
        if ( !data ) {
            return null;
        }

        log( "Parsing POI data..." );

        if ( !data.hasOwnProperty( "pois" ) ) {
            log( "Error: Invalid POI data." );
            return null;
        }

        pois = data['pois'];

        AR.GUI.clearData();
        for ( uuid in pois ) {
            //console.log("got " + uuid);
            poiData = pois[uuid];
            
            miwi_ar_pois[uuid] = poiData;
            
            if ( poiData.hasOwnProperty( "fw_core" )) {
                handleCoreComponent( poiData['fw_core'], uuid );
                
            }
            
            if(poiData.hasOwnProperty( "fw_xml3d" )) {
                handleXml3dComponent( poiData['fw_xml3d'], uuid );
            }
            
            if(poiData.hasOwnProperty( "fw_remote_device" )) {
                handleRemoteDeviceComponent(poiData['fw_remote_device'], poiData['fw_xml3d']['model_id']);
            }
            
            if(poiData.hasOwnProperty( "fw_rvi" )) {
                AR.GUI.showData(miwi_ar_pois[uuid], uuid);
            }
        }
    }
    
    function handleCoreComponent(data , uuid) {

        var location;

        if ( data.hasOwnProperty( "location" )) {
            location = data['location'];

            if ( location['type'] === 'wsg84' ) {
                gpsPoints[uuid] = location;
            }
        }
    }
    
    function handleRemoteDeviceComponent(data , modelID) {
        
        var controls;
        if(data.hasOwnProperty('control_urls')) {
            controls = data['control_urls'];
            remoteControls['on'] = controls['set_state_on_url'];
            remoteControls['off'] = controls['set_state_off_url'];
            remoteControls['state'] = controls['get_state_url'];
            
            var xml3dElement = sceneManager.getObjectByID(modelID);
            xml3dElement.addEventListener("click", function(){toggleButton(xml3dElement.childNodes[0]);}); 
        }
    }
    
    function handleXml3dComponent(data, uuid) {
    
        sceneManager.addToScene(data);
        if(data.hasOwnProperty( "model" )) {
            var xml3dElement = document.getElementById(data['model_id']);
            sceneManager.setPositionFromGeoLocation(currentLoc, gpsPoints[uuid], xml3dElement);
            sceneManager.addObjetcToBillboardSet(xml3dElement);
            xml3dElement.addEventListener("click", function(){
                AR.GUI.clearData();AR.GUI.showData(miwi_ar_pois[uuid], uuid);
            });  
        }     
    }
    
    function toggleButton(xml3dElement) {
        var shaderName = xml3dElement.shader;
        
        if(shaderName.indexOf("green") !=-1) {
            shaderName = shaderName.replace("green","red");
            communication.sendMessage(remoteControls['off']);
        }
        else {
            shaderName = shaderName.replace("red","green");
            communication.sendMessage(remoteControls['on']);
        }
       
       xml3dElement.setAttribute('shader', shaderName);
    }
}( window['wex'] = window['wex'] || {} ));
