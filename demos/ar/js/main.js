// Application configuration


(function ( namespace, undefined ) {
    window.URL = window.URL || window.webkitURL;
    navigator.getUserMedia =
        navigator.getUserMedia || navigator.webkitGetUserMedia ||
            navigator.mozGetUserMedia || navigator.msGetUserMedia;


    var videoElement = document.getElementsByTagName( "video" )[0];

    function enableWebcam() {
        if ( !navigator.getUserMedia ) {
            enableVideo();
            return;
        }
        navigator.getUserMedia(
            {video: true, audio: false},
            function ( stream ) {
                var url = window.URL.createObjectURL( stream );
                videoElement.autoplay = true;
                videoElement.src = url;

                document.querySelector( '#button1' ).checked = true;

            },
            function ( err ) {
                console.log( "The following error occured: " + err );
                enableVideo();
            } );
    }

    function enableVideo() {
        videoElement.autoplay = true;
        videoElement.src = "../../../resources/ar_marker.ogg";
        document.querySelector( '#button1' ).checked = false;
    }


    function initialise() {
        // setup video element to be streamed into canvas
        var ardata = document.getElementById( 'arBase' );
        var background = document.getElementById( 'background' );
        var bgCtx = null;

        var ballXfm = document.getElementById( 't_square_ar' );
        var ballLocalXfm = document.getElementById( 't_square_local' );

        var lastTime = Date.now();
        var matrices = [];

        var m3x3 = math.mat3.create();
        var dir = math.vec3.create();
        var p1 = math.vec3.create();
        var p2 = math.vec3.create();
        var tv = math.vec3.create();
        var upVector = math.vec3.create();
        var quat1 = math.quat4.create();
        var quat2 = math.quat4.create();
        var aa = math.quat4.create();
        var axis = new XML3DVec3();
        var matrixIndex = [0, 0]; // index of two matrices for interpolation


        enableWebcam();

        // Initialise data observers
        var observer = new XML3DDataObserver( function ( records, observer ) {
            var flipvideo = records[0].result.getValue( "flipvideo" );

            //TODO: AR related flow processing using video feed as the data source can be added here


            if ( flipvideo ) {
                var data = Xflow.toImageData( flipvideo );
                var width = data.width;
                var height = data.height;

                // Setup background canvas
                if ( width !== background.width || height !== background.height || !bgCtx ) {
                    background.width = width;
                    background.height = height;
                    bgCtx = background.getContext( '2d' );
                }
                bgCtx.putImageData( data, 0, 0 );
            }
        } );

        observer.observe( ardata, {names: ["flipvideo"]} );


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

            window.addEventListener( 'deviceorientation', handleOrientation );

        }() );

        initialise();
    };

}( window['wex'] = window['wex'] || {} ));