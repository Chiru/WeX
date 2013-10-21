// For conditions of distribution and use, see copyright notice in LICENSE

/**
 * @author Toni Dahl, Antti Karhu
 */


(function ( namespace, undefined ) {
    "use strict";

    // Util shortcuts
    var extend = namespace.Util.extend,
        log = namespace.Util.log,

        AR = namespace.AR;


    var SceneManager = AR.SceneManager = function ( framework, options ) {

        var defaults = {},
            opts;

        // Setting options
        opts = extend( {}, defaults, options );

        var scene, visibleObjects = [], activeCamera, xml3d, cameraVerticalPlane = 90;

        this.init = function () {
            log( "SceneManager: Initialising..." );
            this.initCamera();
        };


        // TODO: These methods are subject to change, until we know for sure what is the best way to add 3d object
        // dynamically to xml3d scene

        this.addToScene = function (object3D){

        };

    
        this.removeFromScene = function (object3D) {

        };


        this.getObjectByID = function(id){

        };


        this.initCamera = function(){
            xml3d = document.querySelector("xml3d");
            activeCamera = XML3D.URIResolver.resolveLocal(xml3d.getAttribute("activeView"), xml3d.ownerDocument);
        };

        this.getActiveCamera = function(){
            return activeCamera;
        };
        
         this.setPositionFromGeoLocation = function (curLoc, elemLoc, xml3dElement) {

            var transformURL, transform, radius, maxDistance = 100;
            transform = XML3D.URIResolver.resolveLocal(xml3dElement.getAttribute("transform"), xml3dElement.ownerDocument);

            if(transform === null)
                return;
            
            var geolocation = distanceBetween(curLoc, elemLoc);
            
            radius = 10;//Math.min(geolocation.distance, maxDistance);
            log("distance: " + geolocation.distance.toFixed( 2 ) + " meters,  radius: " + radius);
            log("bearing: " + geolocation.bearing * (180 / Math.PI) + " degrees");

            transform.translation.z = radius * Math.cos(geolocation.bearing);
            transform.translation.x = radius * Math.sin(geolocation.bearing);
            //log("location x: " + transform.translation.x + "  z: " + transform.translation.z);
        }
        
        this.setCameraOrientation = function (deviceOrientationEvent) {

            if(!activeCamera)
                return;

            var x = cameraVerticalPlane + deviceOrientationEvent.beta,  // In degree in the range [-180,180]
            z = deviceOrientationEvent.gamma, // In degree in the range [-90,90]
            y = deviceOrientationEvent.alpha;

            //convert to quaternion
            var cosX = Math.cos( -x * (Math.PI/360) );
		    var cosY = Math.cos( -y * (Math.PI/360) );
		    var cosZ = Math.cos( -z * (Math.PI/360) );
		    var sinX = Math.sin( -x * (Math.PI/360) );
		    var sinY = Math.sin( -y * (Math.PI/360) );
		    var sinZ = Math.sin( -z * (Math.PI/360) );

	        var rotX = sinX * cosY * cosZ - cosX * sinY * sinZ;
		    var rotY = cosX * sinY * cosZ + sinX * cosY * sinZ;
		    var rotZ = cosX * cosY * sinZ - sinX * sinY * cosZ;
		    var rotW = cosX * cosY * cosZ + sinX * sinY * sinZ;
		    	
		    activeCamera.orientation.setQuaternion(new XML3DVec3(rotX, rotY, rotZ), rotW);	
        }
        
        this.translateCamera = function (curLoc, gpsPoint) {
            //var delta = distanceBetween(curLoc, gpsPoint);
            //var str = 10 + " " + activeCamera.position.y + " " + activeCamera.position.z;
            //activeCamera.setAttribute("position", str);
            //activeCamera.position = activeCamera.position.add(new XML3DVec3(delta, 0.0, 0.0));
            //log("cameraPos: x: " + activeCamera.position.x + " y: " + activeCamera.position.y + " z: " + activeCamera.position.z);
        }
        
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


        this.init();


    };


}( window['wex'] = window['wex'] || {} ));
