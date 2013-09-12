// Application configuration


(function ( namespace, undefined ) {
    var log = namespace.Util.log;

    window.onload = function () {
        // Initialising event listeners
        var button = document.querySelector( '#button1' ),
            infoPanel = document.querySelector( '#infoPanel' );

        function handleOrientation( event ) {
            var x = event.beta,  // In degree in the range [-180,180]
                y = event.gamma, // In degree in the range [-90,90]
                z = event.alpha;
            if ( x === null || y === null || z === null ) {
                infoPanel.innerHTML = "No orientation data available.";
                return;
            }

            // Because we don't want to have the device upside down
            // We constrain the x value to the range [-90,90]
            if ( x > 90 ) {
                x = 90;
            }
            if ( x < -90 ) {
                x = -90;
            }

            infoPanel.innerHTML = "x : " + x.toFixed( 2 ) + "\n";
            infoPanel.innerHTML += "y: " + y.toFixed( 2 ) + "\n";
            infoPanel.innerHTML += "z: " + z.toFixed( 2 ) + "\n";
        }

        var sensorManager = namespace.AR.setupSensors(),
            orientationListener = sensorManager.listenSensor( 'orientation' );
        orientationListener.signal.add( handleOrientation );
        var inputManager = namespace.AR.setupInputManager();
        var assetManager = namespace.AR.setupAssetManager();
        var ARManager = namespace.AR.setupARManager();



    };

}( window['wex'] = window['wex'] || {} ));