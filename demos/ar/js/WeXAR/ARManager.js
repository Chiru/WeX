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
            'ARBase': false,
            'QRAnalyser': false
        };

        observers = {
            'ARBase': videoStreamObserver(),
            'QRAnalyser': QRObserver()
        };

        function videoStreamObserver() {
            return new XML3DDataObserver( function ( records, observer ) {
                var arVideo = records[0].result.getValue( "arvideo" );

                if ( arVideo ) {
                    var data = Xflow.toImageData( arVideo );
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

        function QRObserver() {
            return new XML3DDataObserver( function ( records, observer ) {
                var transforms = records[0].result.getValue( "transforms" );
                //TODO: QR tag related processing using video feed as the data source can be added here
            } );
        }

        function initFlowAnalysers() {
            var id, xflowEl;

            for ( id in flowAnalysers ) {
                xflowEl = document.querySelector( '#' + id );
                flowAnalysers[id] = xflowEl ? xflowEl : false;
            }

        }

        function initObservers() {
            var id;
            for ( id in flowAnalysers ) {
                if ( flowAnalysers[id] ) {
                    log( "ARManager: Found " + id + " XFlow element." );
                    if ( id === 'ARBase' ) {
                        observers[id].observe( flowAnalysers[id], {names: ["arvideo"]} );
                    }
                    else if ( id === 'QRAnalyser' ) {
                        log( "ARManager: Observing QR tags from the camera feed." );
                        observers[id].observe( flowAnalysers[id], {names: ["transforms"]} );
                    }
                }
            }
        }

        this.init = function () {
            log( "ARManager: Initialising..." );

            background = document.getElementById( 'background' );
            bgCtx = background.getContext( '2d' );

            initFlowAnalysers();
            initObservers();

            log( "ARManager: Done." );

        };

        this.init();


    };


}( window['wex'] = window['wex'] || {} ));