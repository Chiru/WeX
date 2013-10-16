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

    var Communication = AR.Communication = function ( framework, options ) {

        var defaults = {},
            opts;

        // Setting options
        opts = extend( {}, defaults, options );

        var remoteServices = {};

        this.init = function () {
            log( "Communication: Initialising..." );
        };
        
        this.addRemoteService = function(serviceName, dataFormat, sourceURL) {

            remoteServices[serviceName] = {'dataFormat' : dataFormat, 'source' : sourceURL};
        }
        
        this.queryData = function(serviceName, restOptions, succesCallback ,errorCallback) {
            var remoteService, restQueryURL, key, value, i, xhr;
            
            remoteService = remoteServices[serviceName]
            restQueryURL = remoteService['source'] + "?";
            
            for(key in restOptions) {
            
                if(restOptions.hasOwnProperty(key) && restOptions[key])
                {
                    value = restOptions[key];
                    log("key: " + key + " value: " + value);
                    
                    if(typeof(value) === 'object') {
                        for(i in value) {
                            //log("-------------key: " + key + " value: " + value[i]);
                            restQueryURL += "&" + key + "=" + value[i];
                        }
                    }
                    else {
                        restQueryURL += "&" + key + "=" + value;
                    }
                }
            }
            
            console.log("restQueryURL: " + restQueryURL);
            xhr = new XMLHttpRequest();
            xhr.open("GET", restQueryURL, true);
            xhr.send();

            xhr.onreadystatechange = function () {
                if(xhr.readyState === 4) {
                    if(xhr.status  === 200) { 
                        //console.log( "succes: " + xhr.responseText);
                        var json = JSON.parse(xhr.responseText);
                        succesCallback(json);
                    }
                    else if (xhr.status === 404) { 
                        log("failed: " + xhr.responseText);
                    }
                }
            }

            xhr.onerror = function (e) {
                log("failed to get POIs");
            };
        }
        

        this.init();

    };


}( window['wex'] = window['wex'] || {} ));
