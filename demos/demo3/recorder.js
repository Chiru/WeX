"use strict";
(function () {
    var Recorder = function(source) {
        var recording = false,
            bufferLen = 4096,
            currentCallback = null,
            worker = null,
            filename = null;

        this.context = source.context;
        this.context.createScriptProcessor = this.context.createScriptProcessor ||
            this.context.createJavaScriptNode; //CreateJavaScriptNode is deprecated;
        this.node = this.context.createScriptProcessor(bufferLen, 2, 2);

        worker = new Worker('recorderWorker.js');
        worker.postMessage({'cmd': 'init', 'sampleRate': this.context.sampleRate});

        this.node.onaudioprocess = function(e) {
            if (!recording) {
                return;
            }

            console.log(e.inputBuffer);
            
            worker.postMessage( {'cmd':'record', 
                'buffer':[e.inputBuffer.getChannelData(0),
                        e.inputBuffer.getChannelData(1)]
            });
        };

        this.record = function() {
            recording = true;
        };

        this.stop = function() {
            recording = false;
        };

        this.clear = function() {
            worker.postMessage( {'cmd':'clear'} );
        };

        this.exportWAV = function( name ) {
            var type = 'audio/wav';
            filename = name;
            
            currentCallback = this.download;

            if (!currentCallback) {
                throw new Error('callback not set');
            }

            // wex.Util.log("Exporting audio, callback: " + currentCallback + "type: " + type);
            worker.postMessage( {'cmd':'exportWAV', 'type':type} );
        };

        this.download = function( blob ) {
            //wex.Util.log("forceDownloading blob as file: " + filename);
            console.log(blob);

            var url = (window.URL || window.webkitURL).createObjectURL(blob),
                link = window.document.createElement('a'),
                click;

            link.href = url;
            link.download = filename || 'output.wav';
            click = document.createEvent("MouseEvents");
            click.initEvent("click", true, true);
            link.dispatchEvent(click);
        };

        worker.addEventListener('message', function (e) {
            currentCallback(e.data);
            },
            false);

        source.connect( this.node );
        this.node.connect( this.context.destination );
    };

window.Recorder = Recorder;

}());

