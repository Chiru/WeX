// For conditions of distribution and use, see copyright notice in LICENSE

/**
 * @author Toni Dahl
 */

(function ( namespace, undefined ) {

    // Namespace for this application
    var AR = namespace.AR = {},
        util = namespace.Util;

    // Attributes
    AR.VERSION = 'v0.0.5';
    AR.NAME = 'Wex AR';
    AR.ENUMS = {};


    //XML3D Settings
    XML3D.debug.loglevel = 3;


    // Top Level API

    AR.setupSensors = function ( options ) {
        return AR.Framework.createSensorManager( options );

    };

    AR.setupInputManager = function ( options ) {
        return AR.Framework.createInputManager( options );

    };

    AR.setupAssetManager = function ( options ) {
        return AR.Framework.createAssetManager( options );

    };

    AR.setupARManager = function ( options ) {
        return AR.Framework.createARManager( options );

    };

    AR.setupConnection = function ( options ) {
        return AR.Framework.createConnection( options );

    };



    AR.start = function () {

    };


    util.log( "Loading " + AR.NAME + " " + AR.VERSION + " application..." );


}( window['wex'] = window['wex'] || {} ));
