(function ( namespace, undefined ) {

    // Util shortcuts
    var extend = namespace.Util.extend,
        log = namespace.Util.log,

        AR = namespace.AR;

    AR.GUI = {
        showOrientation: function (e) {
            var infoPanel = document.querySelector( '#infoPanel' );

            if(!infoPanel){
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
        }


    };


}( window['wex'] = window['wex'] || {} ));