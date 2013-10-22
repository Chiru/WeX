(function () {
    "use strict";
    navigator.getUserMedia = (navigator.getUserMedia ||
        navigator.webkitGetUserMedia ||
        navigator.mozGetUserMedia ||
        navigator.msGetUserMedia);

    window.AudioContext = (window.AudioContext || 
        window.webkitAudioContext);


    
    window.requestAnimationFrame = (window.requestAnimationFrame || 
        window.mozRequestAnimationFrame || 
        window.webkitRequestAnimationFrame);

    window.cancelAnimationFrame = (window.cancelAnimationFrame ||
        window.mozCancelAnimationFrame);

    var audio = document.querySelector( 'audio' ),
        button1 = document.querySelector( '#button1' ),
        button2 = document.querySelector( '#button2' ),
        button3 = document.querySelector( '#button3' ),
        button4 = document.querySelector( '#button4' ),

        log = wex.Util.log,

        audioContext = null,
        analyserNode = null,
        analyserContext = null,
        audioRecorder = null,
        gainNode = null,
        requestID = null,

        recording = false,
        audioStream = null,
        
        canvas,
        canvasWidth,
        canvasHeight;


    if(!window.AudioContext) {
        log("ERROR: AudioContext not available/or activated on your browser!");
        return;
    }

    function hasGetUserMedia() {
        return !!(navigator.getUserMedia);
    }

    function getAudioFeed() {
        if (hasGetUserMedia()) {
            log("Requesting userMedia");
            navigator.getUserMedia({video:false, audio:true}, gotAudioStream, 
                function(e) {
                    log(e.toString());
                });
        }
        else {
            log("ERROR: getUserMedia is not available!");
        }
    }

    function gotAudioStream(stream) {
        var inputPoint;

        log("Got userMedia");
        
        audioContext = new AudioContext();
        audioContext.createGain = audioContext.createGain || audioContext.createGainNode; //createGainNode is deprecated

        if(!audioContext.createGain) {
            log("Error: WebAudio: GainNode not supported.");
            return;
        }

        inputPoint = audioContext.createGain();

        // Create an AudioNode from the stream.
        if(!audioContext.createMediaStreamSource){
            log("Error: WebAudio: createMediaStreamSource not supported. " +
                "If using FireFox follow the development <a href='https://bugzilla.mozilla.org/show_bug.cgi?id=856361'>here</a>");
            return;
        }

        audioStream = audioContext.createMediaStreamSource( stream );
        audioStream.connect( inputPoint );

        analyserNode = audioContext.createAnalyser();
        analyserNode.fftSize = 2048;
        inputPoint.connect( analyserNode );

        if ( button1 ) {
            button1.onclick = toggleRecording;
        }

        gainNode = audioContext.createGain();
        gainNode.gain.value = 0.0;

        inputPoint.connect( gainNode );
        gainNode.connect(audioContext.destination);
        updateAnalysers();

        audioRecorder = new Recorder( audioStream );
    }

    function toggleAnalyzer() {
        if ( requestID !== null ) {
            log("Stop analyzer");
            window.cancelAnimationFrame( requestID );
            requestID = null;
        }
        else {
            log("Start analyzer");
            updateAnalysers();
        }
    }

    function saveAudio() {
        audioRecorder.exportWAV('myRecording.wav');
    }

    function toggleRecording( e ) {
        if ( recording ) {
            log("Stop recording");

            audioRecorder.stop();
            recording = false;
            //audioRecorder.getBuffers( drawWave );
            
        } else {
            if ( !audioRecorder ) {
                return;
            }
            log("Start recording");
            recording = true;
            audioRecorder.clear();
            audioRecorder.record();
        }
        button1.innerHTML = button1.innerHTML === "Start recording" ? "Stop recording" : "Start recording";
    }

    function toggleMute() {
        if (button4.innerHTML === "Unmute") {
            button4.innerHTML = "Mute";
            gainNode.gain.value = 1.0;
            log("Unmuted audio");
        }
        else {
            button4.innerHTML = "Unmute";
            gainNode.gain.value = 0.0;
            log("Muted audio");
        }
    }

    function updateAnalysers(time) {
        if (!analyserContext) {
            canvas = document.getElementById("analyzerCanvas");
            canvasWidth = canvas.width;
            canvasHeight = canvas.height;
            log("canvas width: " + canvasWidth + " canvas height: " + canvasHeight);
            analyserContext = canvas.getContext('2d');
        }

        var i, j,
            numBars = 70,
            barWidth = Math.floor(canvasWidth / numBars),
            freqByteData = new Uint8Array(analyserNode.frequencyBinCount),
            multiplier,
            magnitude,
            magnitude2,
            offset;

        // analyzer draw code here    
        analyserNode.getByteFrequencyData(freqByteData); 

        analyserContext.clearRect(0, 0, canvasWidth, canvasHeight);
        analyserContext.fillStyle = '#F6D565';
        analyserContext.lineCap = 'round';
        multiplier = analyserNode.frequencyBinCount / numBars;

        // Draw rectangle for each frequency bin.
        for (i = 0; i < numBars; ++i) {
            magnitude = 0;
            offset = Math.floor( i * multiplier );
            // gotta sum/average the block, or we miss narrow-bandwidth spikes
            for (j = 0; j< multiplier; j += 1) {
                magnitude += freqByteData[offset + j];
            }
            magnitude = magnitude / multiplier;
            magnitude2 = freqByteData[i * multiplier];
            analyserContext.fillStyle = "hsl( " + Math.round((i*360)/numBars) + ", 100%, 50%)";
            analyserContext.fillRect(i * barWidth, canvasHeight, barWidth, -magnitude);
        }
        
        requestID = window.requestAnimationFrame( updateAnalysers );
    }

    if ( button2 ) {
         button2.onclick = saveAudio;
    }
    if ( button3 ) {
        button3.onclick = toggleAnalyzer;
    }
    if ( button4 ) {
        button4.onclick = toggleMute;
    }

    // Initializing microphone
    getAudioFeed();

}());