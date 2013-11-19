// For conditions of distribution and use, see copyright notice in LICENSE

(function ( namespace, undefined ) {
    "use strict";

    // Util shortcuts
    var extend = namespace.Util.extend,
        log = namespace.Util.log,

        AR = namespace.AR;


    var SceneManager = AR.SceneManager = function ( framework, options ) {

        var defaults = {}, opts;

        // Setting options
        opts = extend( {}, defaults, options );

        var scene, visibleObjects = [], activeCamera, xml3d, cameraVerticalPlane = 65, billboardSet = [], 
            maxDistance = 50, transIndex = 0, up = new XML3DVec3(0,1,0);

        this.init = function () {
            log( "SceneManager: Initialising..." );
            xml3d = document.querySelector("xml3d");
            this.initCamera();
        };


        this.addToScene = function (Poi_fw_xml3d_component) {

            if (!Poi_fw_xml3d_component) {
                return null;
            }
                         
            if(Poi_fw_xml3d_component.hasOwnProperty( "model" )) {
                $("xml3d").append(Poi_fw_xml3d_component['model']);
            }
        };

        this.addObjetcToBillboardSet = function(xml3dElement) {
            billboardSet.push(xml3dElement);
        };

        this.initCamera = function(){
            activeCamera = XML3D.URIResolver.resolveLocal(xml3d.getAttribute("activeView"), xml3d.ownerDocument);
        };

        this.getActiveCamera = function(){
            return activeCamera;
        };
        
        this.setPositionFromGeoLocation = function (curLoc, elemLoc, xml3dElement) {

            var transform, radius;
            transform = XML3D.URIResolver.resolveLocal(xml3dElement.getAttribute("transform"), xml3dElement.ownerDocument);

            if(transform === null) {
                 transform = XML3D.createElement("transform");
                 transform.setAttribute("id", "transform" + transIndex);
                 xml3d.appendChild(transform);
                 xml3dElement.setAttribute("transform", "#transform" + transIndex);
                 transIndex++;
            }
            
            var geolocation = distanceBetween(curLoc, elemLoc);
            
            radius = Math.min(geolocation.distance, maxDistance);

            transform.translation.z = activeCamera.position.z + radius * Math.cos(Math.PI - geolocation.bearing);
            transform.translation.x = activeCamera.position.x + radius * Math.sin(Math.PI - geolocation.bearing);
            //log("distance: " + geolocation.distance.toFixed( 2 ) + " meters,  radius: " + radius);
            log("bearing: " + geolocation.bearing * (180 / Math.PI) + " degrees");
            log("location x: " + transform.translation.x + "  z: " + transform.translation.z);

        };
        
        this.setTransformFromMarker = function(markerTransform, xml3dElement) {
        
            var transform, mat3x3 = [], quat = XML3D.math.quat.create();
            
            if(!markerTransform || !xml3dElement)
                return;

            transform = XML3D.URIResolver.resolveLocal(xml3dElement.getAttribute("transform"), xml3dElement.ownerDocument);

            if(transform === null)
                return;
                
            //XML3D.math.mat4.toMat3(transforms, mat3x3);
            mat3x3[0] = markerTransform[0], mat3x3[1] = markerTransform[4], mat3x3[2] = markerTransform[8],
            mat3x3[3] = markerTransform[1], mat3x3[4] = markerTransform[5], mat3x3[5] = markerTransform[9],
            mat3x3[6] = markerTransform[2], mat3x3[7] = markerTransform[6], mat3x3[8] = markerTransform[10];
            XML3D.math.quat.setFromMat3(mat3x3, quat);
            
            transform.rotation._setQuaternion(XML3D.math.quat.multiply(quat, activeCamera.orientation.getQuaternion(), quat));
            transform.translation.set(activeCamera.orientation.rotateVec3(new XML3DVec3(markerTransform[12], markerTransform[13], markerTransform[14])));

        };
        
        this.setCameraOrientation = function (deviceOrientationEvent) {

            if(!activeCamera)
                return;

            var x = cameraVerticalPlane + deviceOrientationEvent.beta,  // In degree in the range [-180,180]
            z = deviceOrientationEvent.gamma, // In degree in the range [-90,90]
            y = deviceOrientationEvent.alpha;
         
            var degToRad2 = Math.PI/360;
               
            //convert to quaternion
            var cosX = Math.cos( -x * degToRad2 ),
		    cosY = Math.cos( -y * degToRad2 ),
		    cosZ = Math.cos( -z * degToRad2 ),
		    sinX = Math.sin( -x * degToRad2 ),
		    sinY = Math.sin( -y * degToRad2 ),
		    sinZ = Math.sin( -z * degToRad2 );

	        var rotX = sinX * cosY * cosZ - cosX * sinY * sinZ,
		    rotY = cosX * sinY * cosZ + sinX * cosY * sinZ,
		    rotZ = cosX * cosY * sinZ - sinX * sinY * cosZ,
		    rotW = cosX * cosY * cosZ + sinX * sinY * sinZ;
		    
		    activeCamera.orientation.setQuaternion(new XML3DVec3(rotX, rotY, rotZ), rotW);	
		    updateBillboardSet();
        };
        
        this.translateCamera = function (curLoc, gpsPoint) {

        };
        
        //Bearign(radians) and distance between two points(meters) on a sphere using the spherical law of cosines. 
        function distanceBetween(p1, p2) {
        
            var rad = Math.PI / 180;
            var dLonRad = (p2.longitude - p1.longitude) * rad;
            var p1LatRad = p1.latitude * rad;
            var p2LatRad = p2.latitude * rad;
            var distance = Math.acos(Math.sin(p1LatRad) * Math.sin(p2LatRad) + Math.cos(p1LatRad) * Math.cos(p2LatRad) * Math.cos(dLonRad)) * 6378137;
        
            var y = Math.sin(dLonRad) * Math.cos(p2LatRad);
            var x = Math.cos(p1LatRad) * Math.sin(p2LatRad) - Math.sin(p1LatRad) * Math.cos(p2LatRad) * Math.cos(dLonRad);
            var bearing = Math.atan2(y, x);
            var result = {
                'distance': distance,
                'bearing': bearing
            };

            return result;
        }

        function updateBillboardSet() {
       
            var billboard, transform, targetX, targetY, targetZ, upVector;
            
            if(billboardSet.length === 0)
                return;
            
            for(billboard in billboardSet) {
                
                transform = XML3D.URIResolver.resolveLocal(billboardSet[billboard].getAttribute("transform"), billboardSet[billboard].ownerDocument);    
                
                targetZ = activeCamera.position.subtract(transform.translation);
                targetZ = targetZ.normalize();
                
                targetX = up.cross(targetZ);
                targetX = targetX.normalize();
        
                targetY = targetZ.cross(targetX);
                targetY = targetY.normalize();
                transform.rotation.setFromBasis(targetX, targetY, targetZ);
                
            }
        }

        this.init();
    };


}( window['wex'] = window['wex'] || {} ));
