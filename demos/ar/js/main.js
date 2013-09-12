// Application configuration


(function ( namespace, undefined ) {
    window.URL = window.URL || window.webkitURL;
    navigator.getUserMedia =
        navigator.getUserMedia || navigator.webkitGetUserMedia ||
            navigator.mozGetUserMedia || navigator.msGetUserMedia;


    var log = namespace.Util.log,
        videoElement = document.getElementsByTagName( "video" )[0];

    function enableWebcam() {
        if ( !navigator.getUserMedia ) {
            enableVideo();
            return;
        }
        navigator.getUserMedia(
            {video: true, audio: false},
            function ( stream ) {
                if ( videoElement ) {
                    var url = window.URL.createObjectURL( stream );
                    videoElement.autoplay = true;
                    videoElement.src = url;

                    document.querySelector( '#button1' ).checked = true;
                }
            },
            function ( err ) {
                console.log( "The following error occured: " + err );
                enableVideo();
            } );
    }

    function enableVideo() {
        if ( videoElement ) {
            videoElement.autoplay = true;
            videoElement.src = "../../../resources/ar_marker.ogg";
            document.querySelector( '#button1' ).checked = false;
        }
    }


    function initialise() {
        XML3D.debug.loglevel = 3;

        // setup video element to be streamed into canvas
        var ardata = document.getElementById( 'arBase' );
        var background = document.getElementById( 'background' );
        var bgCtx = background.getContext( '2d' );

        var ballXfm = document.getElementById( 't_square_ar' );
        var ballLocalXfm = document.getElementById( 't_square_local' );


        enableWebcam();

        // Initialise data observers
        var observer = new XML3DDataObserver( function ( records, observer ) {
            //var flipvideo = records[0].result.getValue( "flipvideo" );
            var arvideo = records[0].result.getValue( "arvideo" );

            //TODO: AR related flow processing using video feed as the data source can be added here


            if ( arvideo ) {
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

        // Initialising event listeners
        ( function () {
            var button = document.querySelector( '#button1' ),
                infoPanel = document.querySelector( '#infoPanel' );

            button.addEventListener( 'click', function ( e ) {
                if ( e.target.checked ) {
                    enableWebcam();
                } else {
                    enableVideo();
                }

            }, false );

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

        }() );

        initialise();
    };

}( window['wex'] = window['wex'] || {} ));