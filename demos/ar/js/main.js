// Application configuration


(function ( namespace, undefined ) {
    var log = namespace.Util.log, AR = namespace.AR,
        sensorManager, inputManager, assetManager, ARManager;

    window.onload = function () {

        var orientationListener;

        sensorManager = AR.setupSensors();

        orientationListener = sensorManager.listenSensor( 'orientation' );
        orientationListener.signal.add( AR.GUI.showOrientation );

        inputManager = AR.setupInputManager();
        assetManager = AR.setupAssetManager();
        ARManager = AR.setupARManager();

    };

}( window['wex'] = window['wex'] || {} ));