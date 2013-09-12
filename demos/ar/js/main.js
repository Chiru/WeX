// Application configuration


(function ( namespace, undefined ) {
    var log = namespace.Util.log;

    function initialise() {

        // setup video element to be streamed into canvas
        var ardata = document.getElementById( 'arBase' );
        var background = document.getElementById( 'background' );
        var bgCtx = background.getContext( '2d' );

       // var ballXfm = document.getElementById( 't_square_ar' );
        //var ballLocalXfm = document.getElementById( 't_square_local' );

        // Initialise data observers
        var observer = new XML3DDataObserver( function ( records, observer ) {
            //var flipvideo = records[0].result.getValue( "flipvideo" );
            var arvideo = records[0].result.getValue( "arvideo" );

            //TODO: AR related flow processing using video feed as the data source can be added here

           // log("observing");

            if ( arvideo ) {
                //log("observing");
                var data = Xflow.toImageData( arvideo );
                var width = data.width;
                var height = data.height;

                // Setup background canvas
                if ( width !== background.width || height !== background.height ) {
                    background.width = width;
                    background.height = height;
                }

                bgCtx.putImageData( data, 0, 0 );
            }
        } );

        observer.observe( ardata, {names: ["arvideo"]} );


    }

    window.onload = function () {

        XML3D.debug.loglevel = 5;

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


        initialise();
        var inputManager = namespace.AR.setupInputManager();


    };

}( window['wex'] = window['wex'] || {} ));