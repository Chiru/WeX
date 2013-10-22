"use strict";
var recordLen = 0,
    recordBuffersL = [],
    recordBuffersR = [],
    sampleRate;

function init(rate) {
    sampleRate = rate;
}

function mergeBuffers(recordBuffer, recordLength) {
    var result,
        offset = 0,
        length = recordBuffer.length,
        i;
        
    result = new Float32Array( recordLength );

    for (i = 0; i < length; i += 1) {
        result.set( recordBuffer[i], offset );
        offset += recordBuffer[i].length;
    }

    return result;
}

function record(inputBuffer) {
    recordBuffersR.push( inputBuffer[0] );
    recordBuffersL.push( inputBuffer[1] );
    recordLen += inputBuffer[0].length;
}

function interleave(inputL, inputR){
    var length,
        result,
        index = 0,
        inputIndex = 0;

    length = inputL.length + inputR.length;
    result = new Float32Array(length);

    while (index < length){
        result[index += 1] = inputL[inputIndex];
        result[index += 1] = inputR[inputIndex];
        inputIndex += 1;
    }
    return result;
}

function exportWAV(type) {
    var bufferL = mergeBuffers( recordBuffersL, recordLen ),
        bufferR = mergeBuffers( recordBuffersR, recordLen ),
        interleaved = interleave( bufferL, bufferR ),
        dataview = encodeWAV( interleaved ),
        audioBlob = new Blob( [dataview], { 'type': type } );

    postMessage( audioBlob );
}

function clear() {
    recordLen = 0;
    recordBuffersL.length = 0;
    recordBuffersR.length = 0;
}

function floatTo16BitPCM(output, offset, input) {
    var i,
        s;

    for (i = 0; i < input.length; i += 1, offset += 2){
        s = Math.max(-1, Math.min(1, input[i]));
        output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
}

function writeString(view, offset, string) {
    var i;

    for (i = 0; i < string.length; i += 1) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
}

function encodeWAV(samples) {
    var buffer,
        view;

    buffer = new ArrayBuffer(44 + samples.length * 2);
    view = new DataView(buffer);

    /* RIFF identifier */
    writeString(view, 0, 'RIFF');
    /* file length */
    view.setUint32(4, 32 + samples.length * 2, true);
    /* RIFF type */
    writeString(view, 8, 'WAVE');
    /* format chunk identifier */
    writeString(view, 12, 'fmt ');
    /* format chunk length */
    view.setUint32(16, 16, true);
    /* sample format (raw) */
    view.setUint16(20, 1, true);
    /* channel count */
    view.setUint16(22, 2, true);
    /* sample rate */
    view.setUint32(24, sampleRate, true);
    /* byte rate (sample rate * block align) */
    view.setUint32(28, sampleRate * 4, true);
    /* block align (channel count * bytes per sample) */
    view.setUint16(32, 4, true);
    /* bits per sample */
    view.setUint16(34, 16, true);
    /* data chunk identifier */
    writeString(view, 36, 'data');
    /* data chunk length */
    view.setUint32(40, samples.length * 2, true);

    floatTo16BitPCM(view, 44, samples);

    return view;
}

self.addEventListener('message', function (e) {
    var data = e.data;

    switch ( data['cmd'] ) {
        case 'init':
            init(data['sampleRate']);
            break;

        case 'record':
            record( data['buffer'] );
            break;

        case 'exportWAV':
            exportWAV( data['type'] );
            break;

        case 'clear':
            clear();
            break;
    }
}, false);

