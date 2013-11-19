(function ( namespace, undefined ) {
    var log = namespace.Util.log, AR = namespace.AR,
        sensorManager, communication, ARManager, sceneManager;

    var teapot, twitter, camera, curElement;
    
    window.onload = function () {

        ARManager = AR.setupARManager();
        sceneManager = AR.setupSceneManager();
        sensorManager = AR.setupSensors();
        ARManager.setMarkerCallback(drawMesh);
        orientationListener = sensorManager.listenSensor( 'orientation' );
        orientationListener.signal.add(sceneManager.setCameraOrientation);

        teapot = document.getElementById('teapot');
        twitter = document.getElementById('coffee');
        curElement = teapot;
        
        teapot.addEventListener("click", changeElement);
        twitter.addEventListener("click", changeElement);   
        camera = sceneManager.getActiveCamera();
        camera.fieldOfView = 40 * Math.PI/180;
        
    };
    
    function drawMesh(transforms, visibilities) {
    
        if(!transforms || !visibilities)
            return;
            
        curElement.visible = visibilities[0];
        sceneManager.setTransformFromMarker(transforms, curElement);    
    }
    
    function changeElement() {
        if(curElement.id === "teapot") {
            teapot.visible = false;
            curElement = twitter;
        }
        else {
            twitter.visible = false;
            curElement = teapot;
        }
    }


}( window['wex'] = window['wex'] || {} ));
