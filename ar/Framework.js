// For conditions of distribution and use, see copyright notice in LICENSE

/**
 * @author Toni Dahl
 */

(function ( namespace, undefined ) {
    "use strict";

    var Framework, util, AR;

    AR = namespace.AR; // Namespace for this application
    util = namespace.util;


    Framework = AR.Framework = {

        sensorManager: null, // Sensor manager for creating sensor listeners
        inputManager: null, // Manages video/audio input streams from device camera/microphone
        connection: null, // Communication layer for communication with remote services.
        arManager: null, // AR manager is responsible for creating observers for AR related XFlow elements
        sceneManager: null,
        options: {connection: {}, sensors: {}, input: {}, ar: {}, scene: {}},


        // API

        setOptions: function ( options, type ) {
            if ( this.options.hasOwnProperty( type ) ) {
                util.extend( this.options[type], options );
                return true;
            }
            return false;
        },

        createConnection: function ( options ) {
            this.connection = new AR.Communication( this, options );
            return this.connection;
        },

        createSensorManager: function ( options ) {
            this.sensorManager = new AR.SensorManager( this, options );
            return this.sensorManager;
        },

        createInputManager: function ( options ) {
            this.inputManager = new AR.InputManager( this, options );
            return this.inputManager;
        },

        createARManager: function ( options ) {
            this.assetManager = new AR.ARManager( this, options );
            return this.assetManager;
        },

        createSceneManager: function ( options ) {
            this.sceneManager = new AR.SceneManager( this, options );
            return this.sceneManager;
        },


        start: function() {

            //this.connection.connect();
        }

    };


}( window['wex'] = window['wex'] || {} ));
