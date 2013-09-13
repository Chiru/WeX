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


    var AssetManager = AR.AssetManager = function ( framework, options ) {

        var defaults = {},
            opts;

        // Setting options
        opts = extend( {}, defaults, options );

        var meshAssets = {}, textureAssets = {}, materialAssets = {},
            requestQueue = { queue: [], requests: {}},
            storageURL;


        this.setRemoteStorageUrl = function (url){
            //TODO: Should check if url is properly formatted
            if(typeof url === "string"){
                storageURL = url;
                return true;
            }
            return false;
        };

        this.getRemoteStorageUrl = function () {
            return storageURL;
        };

    };


}( window['wex'] = window['wex'] || {} ));