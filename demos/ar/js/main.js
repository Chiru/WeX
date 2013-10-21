// Application configuration


(function ( namespace, undefined ) {
    var log = namespace.Util.log, AR = namespace.AR,
        sensorManager, inputManager, communication, ARManager, sceneManager;

    var currentLoc, gpsPoints = [];

    window.onload = function () {

        var orientationListener, gpsPosition;

        sensorManager = AR.setupSensors();
        inputManager = AR.setupInputManager();
        communication = AR.setupConnection();
        ARManager = AR.setupARManager();
        sceneManager = AR.setupSceneManager();

        orientationListener = sensorManager.listenSensor( 'orientation' );
        gpsPosition = sensorManager.getCurrentPosition(gpsHandler);
        //gpsPosition = sensorManager.watchPosition(function(e) {sceneManager.translateCamera(currentLoc, e.coords); currentLoc = e.coords;  log("------------lat: " + e.coords.latitude + "  lon: " + e.coords.longitude);});  
        communication.addRemoteService("corePOI", null, "http://130.231.12.82:8080");
        communication.addRemoteService("3DPOI", null, "http://130.231.12.82:8081");

        AR.GUI.init();
        AR.GUI.observeOrientation(orientationListener.signal);
        orientationListener.signal.add(sceneManager.setCameraOrientation);

    };

    function gpsHandler (position) {
        
        currentLoc = position.coords;
        setTimeout(function(){getPOIs(currentLoc);},3000);
        //getPOIs(currentLoc);
    }

    function getPOIs(gpsCoordinates) {
        var result;
        var restOptions = {
            'function' : "radial_search",
            'lat' : gpsCoordinates.latitude,
            'lon' : gpsCoordinates.longitude,
            'query_id' : "testi_id",
            'radius' : 150 
        }
        
        communication.queryData("corePOI", restOptions, handleCorePoi, null);
    }
    
    function handleCorePoi( data ) {

        var uuid, pois, poiData, coreComponent, location;

        if ( !data ) {
            return null;
        }

        log( "Parsing POI data..." );

        if ( !data.hasOwnProperty( "pois" ) ) {
            log( "Error: Invalid POI data." );
            return null;
        }

        pois = data['pois'];

        for ( uuid in pois ) {
            poiData = pois[uuid];
            
            if ( poiData.hasOwnProperty( "fw_core" )) {
                coreComponent = poiData['fw_core'];
            
                if ( coreComponent.hasOwnProperty( "location" )) {
                    location = coreComponent['location'];

                    if ( location['type'] === 'wsg84' ) {
                    
                        gpsPoints[uuid] = location;
                    }
                }
            }
        }
        
        if(gpsPoints) {
            var restOptions = {};
            
            for(uuid in gpsPoints) {
                if(gpsPoints.hasOwnProperty(uuid)) {
                    restOptions['points'] = Object.keys(gpsPoints);
                }
            }
            
            restOptions['id'] = "testi_id";
            communication.queryData("3DPOI", restOptions, handle3DPoi, null);
        }
    }
    
    function handle3DPoi(data) {
        
        var uuid, xml3dModels, entities, entity, xml3dGroup, subGroup, shader_mesh_groups, xml3dMesh, group, shader, meshes, mesh;
        if ( !data ) {
            return null;
        }

        log( "Parsing 3D POI data..." );

        if ( !data.hasOwnProperty( "xml3d_models" ) ) {
            log( "Error: Invalid xml3d data." );
            return null;
        }

        xml3dModels = data['xml3d_models'];
        //log( "xml3dModels: " + data['xml3d_models']);
        var i = 0;
        for ( uuid in xml3dModels ) {
        
            entities = xml3dModels[uuid];
            
            //log( "uuid: " + uuid);
            if(Object.keys(entities).length === 0)
                continue;
                
            //log( "xml3dModelData: " + entities);    
            
            for(entity in entities) {
                xml3dGroup = XML3D.createElement("group");
                //log( "entity: " + entities[entity]);
                 
                if( entities[entity].hasOwnProperty( "transform" )) {
                    //log( "transform: " + entities[entity]['transform']);
                    xml3dGroup.setAttribute("transform", "#dummy_trans" + i);
                    i+=1;
                    //xml3dGroup.setAttribute("transform", entities[entity]['transform']);
                }
            
                if( entities[entity].hasOwnProperty( "shader_mesh_groups" )) {
                    shader_mesh_groups = entities[entity]['shader_mesh_groups'];
                    
                    for ( group in  shader_mesh_groups ) {
                        subGroup = XML3D.createElement("group");
                        
                        if(shader_mesh_groups[group].hasOwnProperty( "shader" )) {
                        
                            //log( "shader: " + shader_mesh_groups[group]['shader']);
                            subGroup.setAttribute("shader", shader_mesh_groups[group]['shader']);
                        }
                        if( shader_mesh_groups[group].hasOwnProperty( "meshes" )) {
                            meshes = shader_mesh_groups[group]['meshes'];
                        
                            for ( mesh in  meshes ) {
                                xml3dMesh = XML3D.createElement("mesh");
                                //log( "mesh: " + meshes[mesh]);
                                xml3dMesh.setAttribute("src", meshes[mesh]);
                                subGroup.appendChild(xml3dMesh);
                            }  
                        }
                        xml3dGroup.appendChild(subGroup);
                    }
                }
                if(xml3dGroup) {
                    document.querySelector("xml3d").appendChild(xml3dGroup);
                    sceneManager.setPositionFromGeoLocation(currentLoc, gpsPoints[uuid], xml3dGroup);
                }
            }
        }
    }
    this.toggleButton = function(xml3dElement) {
        var shaderName = xml3dElement.shader;
        
        if(shaderName.indexOf("green") !=-1) {
            shaderName = shaderName.replace("green","red");
        }
        else {
            shaderName = shaderName.replace("red","green");
        }
        
       
       xml3dElement.setAttribute('shader', shaderName);
    }

}( window['wex'] = window['wex'] || {} ));
