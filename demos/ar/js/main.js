// Application configuration


(function ( namespace, undefined ) {
    var log = namespace.Util.log, AR = namespace.AR,
        sensorManager, inputManager, assetManager, ARManager;

    window.onload = function () {

        var orientationListener;

        sensorManager = AR.setupSensors();

        orientationListener = sensorManager.listenSensor( 'orientation' );

        inputManager = AR.setupInputManager();
        assetManager = AR.setupAssetManager();
        ARManager = AR.setupARManager();

        AR.GUI.init();
        AR.GUI.observeOrientation(orientationListener.signal);

    };

}( window['wex'] = window['wex'] || {} ));