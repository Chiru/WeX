// For conditions of distribution and use, see copyright notice in LICENSE

/**
 * @author Toni Dahl
 */

(function ( namespace, undefined ) {
    "use strict";

    var extend = namespace.Util.extend,
        AR = namespace.AR;

    var WSManager = AR.WSManager = function ( framework, options ) {
        var defaults = {
                host: "127.0.0.1",
                port: "9002",
                reconnectInterval: 8000,
                timeout: 8000,
                allowReconnect: true,
                msgType: 'json'
            }, opts = extend( {}, defaults, options );

        var processUserData;


        this.ws = null;
        this.url = "ws://" + opts.host + ":" + opts.port;
        this.host = opts.host;
        this.port = opts.port;
        this.msgType = opts.msgType;

        this.reconnecting = false;
        this.connectTimer = null;
        this.reconnectTimer = null;
        this.reconnAttempt = 0;

        this.allowReconnect = opts.allowReconnect;

        //Reconnection interval time (milliseconds)
        this.reconnectInterval = opts.reconnectInterval;

        //Connection attempt timeout (milliseconds)
        this.timeout = opts.timeout;

        //Storage for bound callback events
        this.callbacks = {};

        // Storage for connection spesific user data
        this.userData = {UserID: null};

        // Hack for firefox
        window.addEventListener( "beforeunload", function () {
            this.ws.onclose = function () {
            }; // disable onclose handler
            this.ws.close();
            this.ws = null;
        }.bind( this ), false );


        processUserData = function ( data ){
            if(data['UserID']){
                this.userData['UserID'] = data['UserID'];
            }
        }.bind(this);

        this.bindEvent("UserData", processUserData);

    };


    WSManager.prototype = {

        /**
         *
         */

        connect: function () {
            this.ws = null;

            try {
                if ( window.WebSocket !== undefined ) {
                    this.ws = new window.WebSocket( this.url );
                } else if ( window.MozWebSocket !== undefined ) {
                    this.ws = new window.MozWebSocket( this.url );
                } else {
                    alert( "This Browser does not support WebSockets.  Use newest version of Google Chrome, FireFox or Opera. " );
                    return;
                }
            } catch (e) {
                console.error( 'ERROR:', e.stack );
                return;
            }

            if(this.msgType === 'knet'){
                this.ws.binaryType = 'arraybuffer';
            }

            //Timeout for connection attempt NOTE: Disabled due abnormal behaviour with Firefox on Android
            /*
             this.connectTimer = setTimeout(function() {
             if(this.ws != null)
             if(this.ws.readyState != this.ws.OPEN)
             this.ws.close()
             }.bind(this), this.timeout)
             */

            this.ws.onopen = function () {
                //clearTimeout(this.connectTimer)
                //this.connectTimer = null

                clearTimeout( this.reconnectTimer );
                this.reconnectTimer = null;

                this.reconnAttempt = 0;
                this.reconnecting = false;

                this.triggerEvent( "connected", this.host + ":" + this.port );

            }.bind( this );

            this.ws.onmessage = function ( evt ) {
                //console.log("Got msg: " + evt.data);
                this.parseMessage( evt.data );
            }.bind( this );

            this.ws.onclose = function ( evt ) {
                //clearTimeout(this.connectTimer)
                //this.connectTimer = null

                clearTimeout( this.reconnectTimer );
                this.reconnectTimer = null;

                if ( !this.reconnecting ) {
                    var reason = "failed";
                    if ( evt.wasClean ) {
                        reason = "closed";
                    }

                    this.triggerEvent( "disconnected", {url: this.host + ":" + this.port, reason: reason, code: evt.code} );
                }

                // Reconnect if the  connection was not closed cleanly (network error/abnormal server close etc.)
                if ( !evt.wasClean && this.allowReconnect ) {
                    this.reconnecting = true;

                    console.log( "Reconnecting in " + this.reconnectInterval / 1000 + " seconds..." );

                    this.reconnectTimer = setTimeout( function () {
                        if ( this.ws !== null ) {
                            if ( this.ws.readyState !== this.ws.OPEN || this.ws.readyState !== this.ws.CONNECTING ) {
                                this.reconnAttempt = this.reconnAttempt + 1;
                                this.triggerEvent( "reconnecting", {host: this.url, attempt: this.reconnAttempt} );

                                this.connect( this.url );
                            }
                        }
                    }.bind( this ), this.reconnectInterval );
                }

            }.bind( this );

            this.ws.onerror = function ( e ) {
                this.triggerEvent( "error", e );
            };
        },

        /**
         *
         */

        stopReconnect: function () {
            if ( this.reconnectTimer !== null ) {
                clearTimeout( this.reconnectTimer );
            }

            if ( this.connectTimer !== null ) {
                clearTimeout( this.connectTimer );
            }
            this.reconnecting = false;
        },

        /**
         *
         * @param message
         */

        parseMessage: function ( message ) {
            var parsed = JSON.parse( message );
            this.processEvent( parsed );
        },


        /**
         *
         *
         * @param json
         */

        processEvent: function ( json ) {
            if ( json['event'] ) {
                //console.log("Got event: "+json['event'])
                if ( json['data'] ) {

                    // Triggering the event
                    this.triggerEvent( json['event'], json['data'] );
                }
            }
        },

        /**
         * A function for binding custom event callbacks for Connection
         *
         * @param eventName
         * @param callback
         * @returns {*}
         */
        bindEvent: function ( eventName, callback ) {
            this.callbacks[eventName] = this.callbacks[eventName] || [];
            this.callbacks[eventName].push( callback );
            return this;
        },

        /**
         * Triggers the bound event and gives it some data as argument if it has a callback function
         *
         * @param eventName
         * @param message
         */
        triggerEvent: function ( eventName, message ) {
            var eventChain = this.callbacks[eventName], i;

            if ( eventChain === undefined ) {
                console.warn( "WSManager: Received an unknown event: " + eventName );
                return;
            }
            for ( i = 0; i < eventChain.length; i++ ) {
                eventChain[i]( message );
            }
        },

        /**
         *
         * @param msg
         */
        sendMessage: function (msg) {
            if(typeof msg === 'string'){
                this.ws.send(msg);
            }
        }
    };


}( window['wex'] = window['wex'] || {} ));