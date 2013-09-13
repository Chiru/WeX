// For conditions of distribution and use, see copyright notice in LICENSE

/**
 * @author Toni Dahl
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

        var scene, visibleObjects = [];

        this.init = function () {

        };


        // TODO: These methods are subject to change, until we know for sure what is the best way to add 3d object
        // dynamically to xml3d scene

        this.addToScene = function (object3D){

        };

        this.removeFromScene = function (object3D) {

        };

        this.getSceneObjects = function(){

        };

        this.toggleVisibility = function () {

        };

        this.getObjectByID = function(id){

        };

        this.getObjectByType = function (type){

        };

        this.initCamera = function(){

        };

        this.getCamera = function(){

        };


        this.init();


    };


}( window['wex'] = window['wex'] || {} ));