// For conditions of distribution and use, see copyright notice in LICENSE


(function ( namespace, undefined ) {
    "use strict";

    // Util shortcuts
    var extend = namespace.Util.extend,
        log = namespace.Util.log,

        AR = namespace.AR;


    var ARManager = AR.ARManager = function ( framework, options ) {

        var defaults = {}, opts;

        // Setting options
        opts = extend( {}, defaults, options );

        var flowAnalysers, observers, background, bgCtx, callBackFunctions = [];

        flowAnalysers = {
            'ARBase': false,
            'MarkerAnalyser': false
        };

        observers = {
            'ARBase': videoStreamObserver(),
            'MarkerAnalyser': MarkerObserver()
        };
        
        var video, localVideoStream, alvar;


        var noCameraFeedError = function () {
            log( "ARManager: ERROR: No camera feed available." );
        };

        var noUserMediaError = function () {
            log( "ARManager: ERROR: No navigator.getUserMedia method available, check if your browser supports WebRTC." );
        };


        function videoStreamObserver() {
            return new XML3DDataObserver( function ( records, observer ) {
                var arVideo = records[0].result.getValue( "arvideo" ),
                    imageData, i, dataLen, width, height;
                    
                if ( arVideo && bgCtx) {
                
                    width = arVideo.width;
                    height = arVideo.height;
         
                    // Setup background canvas
                    if ( width !== background.width || height !== background.height ) {
                        background.width = width;
                        background.height = height;
                    }
                    bgCtx.putImageData( arVideo, 0, 0 );
                }
            } );
        }

        function MarkerObserver() {
            return new XML3DDataObserver( function ( records, observer ) {
                var i, transforms = records[0].result.getValue("transforms");
                var visibilities = records[0].result.getValue("visibilities");
                
                    if(callBackFunctions.length === 0)
                        return;
                        
                    for(i in callBackFunctions) {
                        callBackFunctions[i](transforms, visibilities);
                    }
            } );
        }

        function initFlowAnalysers() {
            var id, xflowEl;

            for ( id in flowAnalysers ) {
                xflowEl = document.getElementById( id );
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
                    else if ( id === 'MarkerAnalyser' ) {
                        log( "ARManager: Observing Marker tags from the camera feed." );
                        observers[id].observe( flowAnalysers[id], {names: ["transforms", "visibilities"]} );
                    }
                }
            }
        }

        this.init = function () {
            log( "ARManager: Initialising..." );

            window.URL = window.URL || window.webkitURL;
            navigator.getUserMedia = (navigator.getUserMedia ||
                navigator.webkitGetUserMedia ||
                navigator.mozGetUserMedia ||
                navigator.msGetUserMedia);

            video = document.querySelector( 'video' );

            if ( !video ) {
                log( "ARManager: ERROR: No video tag was found." );
                return;
            }

            this.getCameraFeed();

            background = document.getElementById( 'background' );
            
            if(background)
                bgCtx = background.getContext( '2d' );

            initFlowAnalysers();
            alvar = new AR.Alvar(framework);
            initObservers();

            log( "ARManager: Done." );

        };
        
        this.hasGetUserMedia = function () {
            return (navigator.getUserMedia);
        };

        this.getCameraFeed = function () {
            if ( this.hasGetUserMedia() ) {
                log( "ARManager: Requesting Camera feed." );

                navigator.getUserMedia( {video: true, audio: false}, function ( stream ) {
                    video.src = window.URL.createObjectURL( stream );
                    localVideoStream = stream;
                    log( "ARManager: Got camera feed. url: " + video.src);
                    video.play();
                    
                }, noCameraFeedError );
            } else {

                noUserMediaError();
            }
        };
        
        this.setMarkerCallback = function(callback) {
            callBackFunctions.push(callback);
        }

        this.init();


    };


}( window['wex'] = window['wex'] || {} ));
