(function () {
    navigator.getUserMedia = (navigator.getUserMedia ||
        navigator.webkitGetUserMedia ||
        navigator.mozGetUserMedia ||
        navigator.msGetUserMedia);
        
    window.requestAnimationFrame =  (window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame);



    var video = document.querySelector( 'video' ),
        button1 = document.querySelector( '#button1' ),
        canvas = document.querySelector( 'canvas' ),
        ctx2D = canvas.getContext( '2d' ),
        log = wex.Util.log,
        requestId = 0,
        alvarInitialized = false,
        markerDetectionOn = false;
        buffer,
        alvarInitWidth = 640,
        alvarInitHeight = 480;
        
   
    function hasGetUserMedia() {
        return !!(navigator.getUserMedia);
    }

    function getCameraFeed() {
        if(hasGetUserMedia()) {
            log( "Requesting Camera feed." );
            // Not showing vendor prefixes.
            navigator.getUserMedia( {video: true, audio: true}, function ( stream ) {
                video.src = window.URL.createObjectURL( stream );
            }, function () {log("navigator.getUserMedia not supported")});
        }
    }

    function initAlvar(width, height) {    
        if(width === 0 && height === 0)
        {
            width = alvarInitWidth;
            height = alvarInitHeight;
        }
           
        var channels = 4;
        buffer = Module._malloc(width*height*channels);
        Module.ccall('init', 'number', ['number', 'number', 'number', 'number'], [width, height, channels, buffer]);
        alvarInitialized = true;
        //log("ALVAR: init  " + height + "  " + width);
    }

    function startMarkerDetection() {
        if(!alvarInitialized)
            initAlvar(video.videoWidth, video.videoHeight);
            
        button1.innerHTML = "Stop Detection";
        detectMarkers();
        markerDetectionOn = true;
    }
    
    function stoptMarkerDetection() {
        if(requestId)
            window.cancelAnimationFrame(requestId);
  
        requestId = 0;
        button1.innerHTML = "Start Detection";
        markerDetectionOn = false;
    }
    
    function detectMarkers() {
        if(video.paused || video.ended) 
            return;
            
        var w = video.videoWidth;
        var h = video.videoHeight;
        canvas.width = w;
        canvas.height = h;
        ctx2D.drawImage( video, 0, 0);
        var imData = ctx2D.getImageData(0, 0, canvas.width, canvas.height);
        var arr = new Uint8Array(imData.data);
        Module.HEAPU8.set(arr, buffer);
        var markers = Module.ccall('process_image', 'string');
        log("ALVAR: markers " + markers);
        
        requestId = window.requestAnimationFrame(detectMarkers);
    }

    function toggleMarkerDetection() {
        if(!markerDetectionOn) {
           startMarkerDetection();
        } else {
           stoptMarkerDetection();
        }
    }
    
    if(button1) {
        button1.onclick = toggleMarkerDetection;
    }
    
    video.addEventListener( "loadstart", function () {
        log( "Loading video stream." );
    }, false );

    video.addEventListener( "loadedmetadata", function () {
        log( "Video metadata loaded." );
    }, false );

    video.addEventListener( "canplay", function () {
        log( "Video data loaded." );
    }, false );

    // Initializing camera
    getCameraFeed();
    
}());
