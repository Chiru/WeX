// For conditions of distribution and use, see copyright notice in LICENSE

/**
 * @author Toni Dahl
 */


(function ( namespace, undefined ) {

    // Util shortcuts
    var extend = namespace.Util.extend,
        log = namespace.Util.log,

        AR = namespace.AR;


    var ARManager = AR.ARManager = function ( framework, options ) {

        var defaults = {}, opts;

        // Setting options
        opts = extend( {}, defaults, options );

        var flowAnalysers, observers, background, bgCtx;

        flowAnalysers = {
            'QRAnalyser': false
        };

        observers = {
            'QRAnalyser': QRObserver()
        };


        function QRObserver() {
            return new XML3DDataObserver( function ( records, observer ) {
                //var flipvideo = records[0].result.getValue( "flipvideo" );
                var arvideo = records[0].result.getValue( "arvideo" );

                //TODO: QR tag related flow processing using video feed as the data source can be added here

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
        }

        function initFlowAnalysers() {
            var id, xflowEl;

            for(id in flowAnalysers){
                xflowEl = document.querySelector( '#' + id );
                flowAnalysers[id] = xflowEl ? xflowEl : false;
            }

        }

        function initObservers() {
            var id;
            for ( id in flowAnalysers ) {
                if ( flowAnalysers[id] ) {
                    log("ARManager: Found " + id +" XFlow element.");
                    if ( id === 'QRAnalyser' ) {
                        log("ARManager: Observing QR tags from the camera feed.");
                        observers[id].observe( flowAnalysers[id], {names: ["arvideo"]} );
                    }
                }
            }
        }

        this.init = function () {
            log("ARManager: Initialising...");

            background = document.getElementById( 'background' );
            bgCtx = background.getContext( '2d' );

            initFlowAnalysers();
            initObservers();

            log("ARManager: Done.");

        };

        this.init();


    };


}( window['wex'] = window['wex'] || {} ));