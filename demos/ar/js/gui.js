(function ( namespace, undefined ) {

    // Util shortcuts
    var extend = namespace.Util.extend,
        log = namespace.Util.log,

        AR = namespace.AR;

    AR.GUI = (function () {

        var infoPanel, bChangeCamera;

        var handleOrientation = function ( e ) {

            if ( !infoPanel ) {
                return;
            }

            var x = e.beta,  // In degree in the range [-180,180]
                y = e.gamma, // In degree in the range [-90,90]
                z = e.alpha;

            if ( x === null || y === null || z === null ) {
                infoPanel.innerHTML = "No orientation data available.";
                return;
            }

            infoPanel.innerHTML = "x : " + x.toFixed( 2 ) + "\n";
            infoPanel.innerHTML += "y: " + y.toFixed( 2 ) + "\n";
            infoPanel.innerHTML += "z: " + z.toFixed( 2 ) + "\n";
        };

        function observeOrientation( signal ) {
            signal.add( handleOrientation );

        }


        function changeCamera() {
            AR.Framework.inputManager.switchCamera();
        }

        function init() {
            bChangeCamera = document.querySelector( "#button1" );
            if ( bChangeCamera ) {
                bChangeCamera.onclick = changeCamera;
            }

            infoPanel = document.querySelector( '#infoPanel' );
            if ( !infoPanel ) {
                handleOrientation = function () {};
            }
        }

        return {
            init: init,
            observeOrientation: observeOrientation
        };

    }());


}( window['wex'] = window['wex'] || {} ));