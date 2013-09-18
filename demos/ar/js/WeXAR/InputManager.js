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


    var InputManager = AR.InputManager = function ( framework, options ) {

        var defaults = {},
            opts;

        // Setting options
        opts = extend( {}, defaults, options );

        var video, localVideoStream;


        var noCameraFeedError = function () {
            log( "InputManager: ERROR: No camera feed available." );
        };

        var noUserMediaError = function () {
            log( "InputManager: ERROR: No navigator.getUserMedia method available, check if your browser supports WebRTC." );
        };


        this.init = function () {
            log( "InputManager: Initialising..." );

            window.URL = window.URL || window.webkitURL;
            navigator.getUserMedia = (navigator.getUserMedia ||
                navigator.webkitGetUserMedia ||
                navigator.mozGetUserMedia ||
                navigator.msGetUserMedia);

            video = document.querySelector( 'video' );

            if ( !video ) {
                log( "InputManager: ERROR: No <video> tag was found." );
                return;
            }

            this.getCameraFeed();

            log( "InputManager: Done." );

        };

        this.hasGetUserMedia = function () {
            return (navigator.getUserMedia);
        };

        this.getCameraFeed = function () {
            if ( this.hasGetUserMedia() ) {
                log( "Requesting Camera feed." );

                navigator.getUserMedia( {video: true, audio: false}, function ( stream ) {
                    video.src = window.URL.createObjectURL( stream );
                    localVideoStream = stream;
                    log( "InputManager: Got camera feed. url: " + video.src);
                    video.play();

                }, noCameraFeedError );
            } else {

                noUserMediaError();
            }
        };

        this.switchCamera = function () {
            this.stopStream();
            // Requesting the camera feed again, user can then choose correct camera
            // Changing camera directly trough the JavaScript API is not possible at the moment
            this.getCameraFeed();
        };

        this.stopStream = function () {
            if ( video ) {
                video.pause();
            }
            if ( localVideoStream ) {
                localVideoStream.stop();
                localVideoStream = null;
            }
        };

        this.setVideoElement = function ( el ) {
            if ( el.nodeName && el.nodeName === 'video' ) {
                this.stopStream();
                video = el;
                return video;
            }
            return false;
        };

        this.getVideoStream = function () {
            if ( localVideoStream ) {
                return localVideoStream;
            }
            return false;
        };

        this.getActiveVideo = function () {
            if ( video ) {
                return video;
            }
            return false;
        };

        this.init();

    };


}( window['wex'] = window['wex'] || {} ));
