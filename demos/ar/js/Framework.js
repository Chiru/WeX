// For conditions of distribution and use, see copyright notice in LICENSE

/**
 * @author Toni Dahl
 */

(function ( namespace, undefined ) {

    var Framework, util, AR;

    AR = namespace.AR; // Namespace for this application
    util = namespace.util;


    Framework = AR.Framework = {

        sensorManager: null, // Sensor manager for creating sensor listeners
        inputManager: null, // Manages video/audio input streams from device camera/microphone
        connection: null, // WebSocket connection manager
        syncManager: null, // Sync manager for synching data through WebSocket
        assetManager: null, // Asset manager stores & manages AR application related 3D/2D asset data

        options: {sensors: {}, inputStream: {}, connection: {}, assets: {}, sync: {}},

        // API

        createConnection: function ( options ) {
            this.connection = new AR.WSManager( this, options );
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

        createSyncManager: function ( options ) {
            this.syncManager = new AR.SyncManager( this, options );
            return this.syncManager;
        },

        createAssetManager: function ( options ) {
            this.assetManager = new AR.AssetManager( this, options );
            return this.assetManager;
        }

    };


}( window['wex'] = window['wex'] || {} ));
