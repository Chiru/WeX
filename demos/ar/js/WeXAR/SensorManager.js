// For conditions of distribution and use, see copyright notice in LICENSE

/**
 * @author Toni Dahl
 */


(function ( namespace, undefined ) {

    // Util shortcuts
    var extend = namespace.Util.extend,
        log = namespace.Util.log,

        AR = namespace.AR;



    var SensorListener = function ( type ) {

        var signal = new namespace.Signal(),
            eventType;

        function callBack( e ) {
            signal.dispatch( e );
        }

        if ( type === 'orientation' ) {
            eventType = "deviceorientation";
        } else if ( type === 'motion' ) {
            eventType = "devicemotion";
        } else if ( type === 'light' ) {
            eventType = "devicelight";
        } else if ( type === 'proximity' ) {
            eventType = "deviceproximity";
        }

        window.addEventListener( eventType, callBack, false );

        return {
            stop: function () {
                window.removeEventListener( eventType, callBack, false );
                signal.dispose();
            },
            signal: signal
        };
    };

    var SensorManager = AR.SensorManager = function ( framework, options ) {

        var defaults = {},
            opts;

        // Setting options
        opts = extend( {}, defaults, options );

        var SENSOR_TYPES = this.sensorTypes = namespace.Util.createEnum( 'orientation', 'motion', 'light', 'proximity' ),
            availableSensors = [],
            listeners = {},
            hasGPS = false;



        this.init = function () {
            // Checking available sensors and GPS
            log( "SensorManager: Initialising..." );

            log( "SensorManager: Checking sensors..." );

            if ( navigator.geolocation ) {
                hasGPS = true;
                log( "SensorManager: GPS available." );
            }

            if ( window.DeviceOrientationEvent ) {
                availableSensors.push( 'orientation' );
                log( "SensorManager: Orientation available." );
            }

            if ( window.DeviceMotionEvent ) {
                availableSensors.push( 'motion' );
                log( "SensorManager: Acceleration available." );
            }

            if ( window.DeviceLightEvent ) {
                availableSensors.push( 'light' );
                log( "SensorManager: Ambient light available." );
            }

            if ( window.DeviceProximityEvent ) {
                availableSensors.push( 'proximity' );
                log( "SensorManager: Proximity available." );
            }

            log( "SensorManager: Done." );
        };

        this.listenSensor = function ( type ) {
            if ( SENSOR_TYPES.hasOwnProperty( type ) && availableSensors.indexOf( type ) === -1 ) {
                return false;
            }
            var listener = new SensorListener( type );

            if ( !listeners.hasOwnProperty( type ) ) {
                listeners[type] = listener;
            }

            return listeners[type];
        };


        this.hasGPS = function () {
            return hasGPS;
        };

        this.getGPSLocation = function ( success, error, options ) {
            if ( hasGPS ) {
                navigator.geolocation.getCurrentPosition( success, error, options );
                return true;
            }

            return false;

        };

        this.getAvailableSensors = function () {
            return availableSensors;
        };

        this.getSensorListeners = function () {
            return listeners;
        };

        this.getListener = function(sensorType){
            if (typeof sensorType === "string" && listeners.hasOwnProperty(sensorType)){
                return listeners[sensorType];
            }

            return false;
        };


        // Initialise when created
        this.init();

    };


}( window['wex'] = window['wex'] || {} ));