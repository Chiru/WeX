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

        var flowAnalysers, observers, background, bgCtx, callBackFunctions = [], maxMarkersToTrack;

         flowAnalysers = {
            'ARBase': false,
        };

        observers = {
            'ARBase': VideoStreamObserver(),
            'MarkerAnalyser': MarkerObserver(),
        };
        
        var video, localVideoStream, alvar, numMarkers = 63;


        var noCameraFeedError = function () {
            log( "ARManager: ERROR: No camera feed available." );
        };

        var noUserMediaError = function () {
            log( "ARManager: ERROR: No navigator.getUserMedia method available, check if your browser supports WebRTC." );
        };


        function VideoStreamObserver() {
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
                var i, transforms = records[0].result.getValue("basicMarkerTransforms");
                var visibilities = records[0].result.getValue("basicMarkerVisibilities");
                
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
                 if( id === 'ARBase' ) {
                     observers['ARBase'].observe( flowAnalysers[id], {names: ["arvideo"]} );
                     log( "ARManager: Observing Marker tags from the camera feed." );
                     observers['MarkerAnalyser'].observe( flowAnalysers[id], {names: ["basicMarkerTransforms", "basicMarkerVisibilities"]} );
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
                log( "ARManager: ERROR: No <video> tag was found." );
                return;
            }

            this.getCameraFeed();

            background = document.getElementById( 'background' );
            
            if(background)
                bgCtx = background.getContext( '2d' );

            initFlowAnalysers();
            alvar = new AR.Alvar(framework);
            initObservers();
            maxMarkersToTrack = document.getElementById('basicMarkers').value.length;
            log( "ARManager: Max number of markers to track " + maxMarkersToTrack);
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
        
        this.addMarker = function (markerId) {
        
            if(markerId < 0 && markerId > numMarkers)
                log("ARManager: Incorrect marker id " +markerId+ ". Markers must be between 0 - 63");
            
            var i, markers = document.getElementById('basicMarkers').value;
            
            for(i = 0; i < markers.length; ++i)
            {
                if(markers[i] === -1) {
                    markers[i] = markerId;
                    return;
                }
            }
           
           log("ARManager: Could not add marker id " + markerId + " to objects to track");
        };

        this.init();

    };


}( window['wex'] = window['wex'] || {} ));
