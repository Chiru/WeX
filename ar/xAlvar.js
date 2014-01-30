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


    var Alvar = AR.Alvar = function (framework, options) {

        var defaults = {},
            opts;

        // Setting options
        opts = extend( {}, defaults, options );

        var imageBuffer, projectionMatrix, markersJson, width, height, channels = 4, alvarInitialized = false;
        
        function initAlvar(videoWidth, videoHeight, markers) {
            log( "Alvar: initializing..." );
            var markersU8, markerIdBuffer, projection;
            
            width = videoWidth;
	        height = videoHeight;
            log( "Alvar: width: " + width + " height: " + height);
	        imageBuffer = Module._malloc(width*height*channels*Uint8Array.BYTES_PER_ELEMENT);
	        // Memory for shared markers IDs
	        markersU8 = new Uint8Array(markers);
	        markerIdBuffer = Module._malloc(markers.length*markersU8.BYTES_PER_ELEMENT);
	        Module.HEAPU8.set(markersU8, markerIdBuffer);
	        // Not working for some reason: Module.HEAP32.set(markers, markerIdBuffer);
	
	        // Init Alvar
	        projection = Module.ccall(
			    'init', // Function 
			    'string', // Return value
			    // Parameters
			    ['number', 		'number', 		'number',			'number',		    'number'], 
			    [width, 	     height, 	     imageBuffer,	     markers.length,	 markerIdBuffer]);
	
	        // Set projection matrix
	        projectionMatrix = JSON.parse(projection);
	        // Free marker ID buffer memory
	        Module._free(markerIdBuffer);
        }
       
        function getProjectionMatrix() {
	       return projectionMatrix;
        }
        
        function detectMarkers(imageData) {
            var arr, markers, length;
	        // Set image data
	        arr = new Uint8Array(imageData.data);
	        Module.HEAPU8.set(arr, imageBuffer);
	        // Call Alvar
	        markers = Module.ccall('process_image', 'string');
	        // Get markers
	        markersJson = JSON.parse(markers);
	        // Return the number of detected markers
	        length = (markersJson) ? markersJson.length : 0;
	
	        return length;
        }
        
        function getMarkerId(index) {
	        return markersJson[index].id;
        }
        
        function getPose(index) {
	        return markersJson[index].transform;
        }
        
        this.registerXFlowOperators = function() {
            //marker detection operator
            Xflow.registerOperator("alvar.detect", {
                outputs: [ {type: 'float4x4', name : 'basicMarkerTransforms', customAlloc: true},
                           {type: 'bool', name: 'basicMarkerVisibilities', customAlloc: true},
                           {type: 'float4x4', name : 'perspective', customAlloc: true}
                         ],
                params:  [ {type: 'texture', source : 'imageData'},
                           {type: 'int', source: 'basicMarkers'},
                           {type: 'bool', source: 'flip', optional: true}
                         ],
                alloc: function(sizes, imageData, basicMarkers) {
                    var len = basicMarkers.length;
                    sizes['basicMarkerTransforms'] = len;
                    sizes['basicMarkerVisibilities'] = len;
                    sizes['perspective'] = 1;
                },
                
                evaluate: function(basicMarkerTransforms, basicMarkerVisibilities, perspective, imageData, basicMarkers, flip) {
                    var projectionMatrix, detected, index;
                     
                	if(!imageData || !imageData.data || imageData.length == 0)
                		return;
                	
                	if(!alvarInitialized){
                		initAlvar(imageData.width, imageData.height, basicMarkers);
                		alvarInitialized = true;
                	}

                	// Clone perpective matrix
                	projectionMatrix = getProjectionMatrix();
                    for (index in projectionMatrix) {
                        perspective[index] = projectionMatrix[index];
                    }

                    // Detect markers from frame
                    detected = detectMarkers(imageData);
                    index = 0;
                    
                    for (index in basicMarkerTransforms) {
                    	// Initialize markers visibility by marker index
                        basicMarkerVisibilities[index] = false;
                        
                        // Initialize transform matrices to identity matrices for each requested marker
                        var mi = 16*index;
			            basicMarkerTransforms[mi+0] = 1; basicMarkerTransforms[mi+1] = 0; basicMarkerTransforms[mi+2] = 0; basicMarkerTransforms[mi+3] = 0;
			            basicMarkerTransforms[mi+4] = 0; basicMarkerTransforms[mi+5] = 1; basicMarkerTransforms[mi+6] = 0; basicMarkerTransforms[mi+7] = 0;
			            basicMarkerTransforms[mi+8] = 0; basicMarkerTransforms[mi+9] = 0; basicMarkerTransforms[mi+10] = 1; basicMarkerTransforms[mi+11] = 0;
			            basicMarkerTransforms[mi+12] = 0; basicMarkerTransforms[mi+13] = 0; basicMarkerTransforms[mi+14] = 0; basicMarkerTransforms[mi+15] = 1;
                    }

                    // Loop all detected markers
                    index = 0;
                    for (index = 0; index < detected; ++index) {
                    	// Get marker ID
                    	var id = getMarkerId(index);

                    	// Update
                    	var markerIndex = 0;
                        for (; markerIndex < basicMarkers.length; ++markerIndex) {
                            if (basicMarkers[markerIndex] == id) {
                                basicMarkerVisibilities[markerIndex] = true;
                                break;
                            }
                        }

                        // Get the transform matrix for the marker
                        var pose = getPose(index);

                        var mOffset = 16*markerIndex;

                        if (flip && flip[0]) {
                            // webcam (we show mirrored picture on the screen)
                            basicMarkerTransforms[mOffset+0]  = pose[0];
                            basicMarkerTransforms[mOffset+1]  = -pose[1];
                            basicMarkerTransforms[mOffset+2]  = -pose[2];
                            //transforms[mOffset+3]  = 0;
                            basicMarkerTransforms[mOffset+4]  = -pose[4];
                            basicMarkerTransforms[mOffset+5]  = pose[5];
                            basicMarkerTransforms[mOffset+6]  = pose[6];
                            //transforms[mOffset+7]  = 0;
                            basicMarkerTransforms[mOffset+8]  = -pose[8];
                            basicMarkerTransforms[mOffset+9]  = pose[9];
                            basicMarkerTransforms[mOffset+10] = pose[10];
                            //transforms[mOffset+11] = 0;
                            basicMarkerTransforms[mOffset+12] = -pose[12];
                            basicMarkerTransforms[mOffset+13] = pose[13];
                            basicMarkerTransforms[mOffset+14] = pose[14];
                            //transforms[mOffset+15] = 1;
                        } else {
                            basicMarkerTransforms[mOffset+0]  = pose[0];
                            basicMarkerTransforms[mOffset+1]  = pose[1];
                            basicMarkerTransforms[mOffset+2]  = pose[2];
                            //transforms[mOffset+3]  = 0;
                            basicMarkerTransforms[mOffset+4]  = pose[4];
                            basicMarkerTransforms[mOffset+5]  = pose[5];
                            basicMarkerTransforms[mOffset+6]  = pose[6];
                            //transforms[mOffset+7]  = 0;
                            basicMarkerTransforms[mOffset+8]  = pose[8];
                            basicMarkerTransforms[mOffset+9]  = pose[9];
                            basicMarkerTransforms[mOffset+10] = pose[10];
                            //transforms[mOffset+11] = 0;
                            basicMarkerTransforms[mOffset+12] = pose[12];
                            basicMarkerTransforms[mOffset+13] = pose[13];
                            basicMarkerTransforms[mOffset+14] = pose[14];
                            //transforms[mOffset+15] = 1;
                    	}
                    }
                    
                    return true;
                }
            });
            
            Xflow.registerOperator('alvar.selectTransform', {
                outputs: [ {type: 'float4x4', name : 'result', customAlloc: true} ],
                params:  [ {type: 'int', source : 'index'},
                           {type: 'float4x4', source: 'transform'} ],
                alloc: function(sizes, index, transform) {
                    sizes['result'] = 1;
                },
                evaluate: function(result, index, transform) {
                    var i = 16 * index[0];
                    if (i < transform.length && i+15 < transform.length) {
			            result[0] = transform[i+0]; result[1] = transform[i+1]; result[2] = transform[i+2]; result[3] = transform[i+3];
			            result[4] = transform[i+4]; result[5] = transform[i+5]; result[6] = transform[i+6]; result[7] = transform[i+7];
			            result[8] = transform[i+8]; result[9] = transform[i+9]; result[10] = transform[i+10]; result[11] = transform[i+11];
			            result[12] = transform[i+12]; result[13] = transform[i+13]; result[14] = transform[i+14]; result[15] = transform[i+15];
                    } else {
			            result[0] = 1; result[1] = 0; result[2] = 0; result[3] = 0;
			            result[4] = 0; result[5] = 1; result[6] = 0; result[7] = 0;
			            result[8] = 0; result[9] = 0; result[10] = 1; result[11] = 0;
			            result[12] = 0; result[13] = 0; result[14] = 0; result[15] = 1;
                    }
                }
            });
        }

        this.registerXFlowOperators();
    };


}( window['wex'] = window['wex'] || {} ));
