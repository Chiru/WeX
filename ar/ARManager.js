/**
 *  Project: FI-WARE  
 *  Copyright (c) 2014 Center for Internet Excellence, University of Oulu, All Rights Reserved
 *  For conditions of distribution and use, see copyright notice in license.txt
 */
 
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
            'ALVAR': false,
        };

        observers = {
            'ALVAR': VideoStreamObserver(),
            'MarkerAnalyser': MarkerObserver(),
        };
        
        var alvar, numMarkers = 63;

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
                var i, j, k, transforms = records[0].result.getValue("basicMarkerTransforms");
                var visibilities = records[0].result.getValue("basicMarkerVisibilities");
                
                    if(!transforms || callBackFunctions.length === 0)
                        return;
                      
                    var mat4x4Array = [];        
                    for(i = 0; i < transforms.length/16; ++i) {
                        if(visibilities[i]) {
                            var mat4x4 = [];
                            for(j = 0; j < 16; ++j) {
                                mat4x4[j] = transforms[i * 16 + j];
                            }
                            mat4x4Array[i] = mat4x4;
                        }
                    }
                    for(k in callBackFunctions) {
                        callBackFunctions[k](mat4x4Array, visibilities);
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
                 if( id === 'ALVAR' ) {
                     observers['ALVAR'].observe( flowAnalysers[id], {names: ["arvideo"]} );
                     log( "ARManager: Observing Marker tags from the camera feed." );
                     observers['MarkerAnalyser'].observe( flowAnalysers[id], {names: ["basicMarkerTransforms", "basicMarkerVisibilities"]} );
                 }
            }
        }

        this.init = function () {
            log( "ARManager: Initialising..." );

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
    
        this.setMarkerCallback = function(callback) {
            callBackFunctions.push(callback);
        };
        
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
