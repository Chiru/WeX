// For conditions of distribution and use, see copyright notice in LICENSE

/**
 * @author Toni Dahl
 */


(function ( namespace, undefined ) {

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


        function noCameraFeedError () {

        }

        function noUserMediaError () {

        }



        this.init = function () {
            window.URL = window.URL || window.webkitURL;
            navigator.getUserMedia =  navigator.getUserMedia || navigator.webkitGetUserMedia ||
                    navigator.mozGetUserMedia || navigator.msGetUserMedia;

            video = document.getElementsByTagName( "video" )[0];

        };

        this.hasGetUserMedia = function (){
            return !!(navigator.getUserMedia);
        };

        this.getCameraFeed = function () {
            if ( this.hasGetUserMedia() ) {
                log( "Requesting Camera feed." );
                // Not showing vendor prefixes.
                navigator.getUserMedia( {video: true, audio: true}, function ( stream ) {
                    video.src = window.URL.createObjectURL( stream );
                    localVideoStream = stream;

                }, noCameraFeedError() );
            } else {

                noUserMediaError();
            }
        };

        this.switchCamera = function () {

        };

        this.stopStream = function () {
            if(video){
                video.pause();
            }
            if(localVideoStream){
                localVideoStream.stop();
                localVideoStream = null;
            }
        };

        this.startStream = function () {

        };

        this.setVideoElement = function (el) {
            if(el.nodeName && el.nodeName === 'video' ){
               this.stopStream();
               video = el;
            }
        };

        this.takeSnapShot = function () {

        };


        this.init();

    };


}( window['wex'] = window['wex'] || {} ));