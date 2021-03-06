/**
 *  Project: FI-WARE  
 *  Copyright (c) 2014 Center for Internet Excellence, University of Oulu, All Rights Reserved
 *  For conditions of distribution and use, see copyright notice in license.txt
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

        var remoteServices = {}, webSocketListeners = {};
        
        this.init = function () {
            log( "Communication: Initialising..." );
        };
        
        this.addRemoteService = function(serviceName, dataFormat, sourceURL) {

            remoteServices[serviceName] = {'dataFormat' : dataFormat, 'source' : sourceURL};
        };
        
        this.queryData = function(serviceName, restOptions, succesCallback, errorCallback) {
            var remoteService, restQueryURL, key, value, i, xhr;
            
            remoteService = remoteServices[serviceName];
            
            if(restOptions.hasOwnProperty('function'))
            {
                restQueryURL = remoteService['source'] + "/" + restOptions['function'] + "?";
                delete restOptions['function'];
                //key = 1;
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
            
            var parsedResponse = function(response) {
                var json = JSON.parse(response);
                succesCallback(json);
            };
            
            this.queryDataRequest(restQueryURL, parsedResponse, errorCallback);
        };
        
        this.sendData = function(serviceName, message, succesCallback, errorCallback) {
            
            var remoteService, xhr, restURL;
            remoteService = remoteServices[serviceName];
            restURL = remoteService['source'];
            
            this.sendDataRequest(restURL, succesCallback, errorCallback, message);
        };
        
        this.queryDataRequest = function(url, succesCallback ,errorCallback) {
            this.sendMessage(createHTTPRequest(url, "GET"), succesCallback, errorCallback, null);
        };
        
        this.sendDataRequest = function(url, succesCallback , errorCallback, message) {
            this.sendMessage(createHTTPRequest(url, "POST"), succesCallback, errorCallback, message);
        };
        
        this.sendMessage = function(request, succesCallback, errorCallback, message) {
        
            if(!request.xhr)
                log("Communication: no XMLHttpRequest created");
            
            if(message)    
                request.xhr.send(message);
            else
                request.xhr.send();
                
            //console.log("url: " + url);
            request.xhr.onreadystatechange = function () {
                if(request.xhr.readyState === 4) {
                    if(request.xhr.status  === 200) { 
                        succesCallback(request.xhr.responseText);
                    }
                    else if (request.xhr.status === 404) { 
                        log("Communication: 404: " + request.url + " not found");
                    }
                }
            };

            request.xhr.onerror = function (e) {
                log("Communication: failed to send request to " + request.url);
            };
        
        };
        
        function createHTTPRequest(url, requestMethod) {
        
            var request = {};
            if(requestMethod === "GET" || requestMethod === "POST")
            {
                var xhr = new XMLHttpRequest();
                xhr.open(requestMethod, url, true);
                request = {xhr: xhr, url: url};
                return request;
            }
            else
            {
                log("Communication: request method: " + requestMethod + " not supported");
            } 
        }
        
        this.listenWebsocket = function(url) {
            webSocketListeners[url] = new AR.WebSocketListener(framework);
            webSocketListeners[url].connect(url);
            
            return webSocketListeners[url];
        }
        

        this.init();

    };

}( window['wex'] = window['wex'] || {} ));
