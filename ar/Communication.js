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
            
            remoteService = remoteServices[serviceName];
            
            if(restOptions.hasOwnProperty('function'))
            {
                restQueryURL = remoteService['source'] + "?" + restOptions['function'];
                delete restOptions['function'];
            }
            else
                restQueryURL = remoteService['source'] + "?";
            
            for(key in restOptions) {
            
                if(restOptions.hasOwnProperty(key) && restOptions[key])
                {
                    value = restOptions[key];
                    
                    if(typeof(value) === 'object') {
                        for(i in value) {
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
                        var json = JSON.parse(xhr.responseText);
                        succesCallback(json);
                    }
                    else if (xhr.status === 404) { 
                        log("failed: " + xhr.responseText);
                    }
                }
            }

            xhr.onerror = function (e) {
                log("failed to query data from " + serviceName);
            };
        }
        

        this.init();

    };


}( window['wex'] = window['wex'] || {} ));
