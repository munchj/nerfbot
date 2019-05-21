const $ = require("jquery");
const WSAvcPlayer = require('h264-live-player');
const nerfbot = require('./assets/js/nerfbot');
const utils = require('./assets/js/utils');
const c = require('./assets/js/constants');
const settings = require('./assets/js/settings');
require('tracking');
require('tracking/build/data/face-min');

window.initCameraStreams = () => {
    var stream_01_canvas = document.getElementById("stream_01");
    var stream_01 = new WSAvcPlayer(stream_01_canvas, "webgl", 1, 35);
    stream_01.connect(settings.ws_base_camera);
    stream_01.initCanvas(640, 480);
    stream_01.ws.onerror = (ev) => {
        console.log(ev);


    };
    stream_01.ws.onopen = (ev) => {
        stream_01.playStream();
    }

    var stream_02_canvas = document.getElementById("stream_02");
    var stream_02 = new WSAvcPlayer(stream_02_canvas, "webgl", 1, 35);
    stream_02.connect(settings.ws_turret_camera);
    stream_02.initCanvas(640, 480);
    stream_02.ws.onerror = (ev) => {
        //console.log(ev);
        $('#stream_02_overlay').width($('#stream_02').width());
        $('#stream_02_overlay').height($('#stream_02').height());

    };
    stream_02.ws.onopen = (ev) => {
        stream_02.playStream();
        $('#stream_02_overlay').width($('#stream_02').width());
        $('#stream_02_overlay').height($('#stream_02').height());
    }
    $('#stream_02_overlay').width($('#stream_02').width());
    $('#stream_02_overlay').height($('#stream_02').height());
}

window.YUVtoGreyscale = function () {
    var width = 640;
    var height = 480;

    var canvas = document.getElementById("stream_02_test");
    var canvasCtx = canvas.getContext("2d");
    window.canvasBuffer = canvasCtx.createImageData(width, height);

    if (!window.buffer)
        return;

    var lumaSize = width * height;
    var chromaSize = lumaSize >> 2;

    var ybuf = window.buffer.subarray(0, lumaSize);
    //var ubuf = window.buffer.subarray(lumaSize, lumaSize + chromaSize);
    //var vbuf = window.buffer.subarray(lumaSize + chromaSize, lumaSize + 2 * chromaSize);

    for (var y = 0; y < height; y++) {
        for (var x = 0; x < width; x++) {
            var yIndex = x + y * width;
            //var uIndex = ~~(y / 2) * ~~(width / 2) + ~~(x / 2);
            //var vIndex = ~~(y / 2) * ~~(width / 2) + ~~(x / 2);
            //var R = 1.164 * (ybuf[yIndex] - 16) + 1.596 * (vbuf[vIndex] - 128);
            //var G = 1.164 * (ybuf[yIndex] - 16) - 0.813 * (vbuf[vIndex] - 128) - 0.391 * (ubuf[uIndex] - 128);
            //var B = 1.164 * (ybuf[yIndex] - 16) + 2.018 * (ubuf[uIndex] - 128);

            var rgbIndex = yIndex * 4;
            window.canvasBuffer.data[rgbIndex + 0] = ybuf[yIndex];
            window.canvasBuffer.data[rgbIndex + 1] = ybuf[yIndex];
            window.canvasBuffer.data[rgbIndex + 2] = ybuf[yIndex];
            window.canvasBuffer.data[rgbIndex + 3] = 0xff;
        }
    }
    canvasCtx.putImageData(window.canvasBuffer, 0, 0);
}

$(document).ready(function () {
    initCameraStreams();
    // console.log("init face tracking");

    // window.tracker = new tracking.ObjectTracker('face');
    // tracker.setInitialScale(4);
    // tracker.setStepSize(2);
    // tracker.setEdgesDensity(0.1);
    // tracker.on('track', function (event) {
    //     var canvas = document.getElementById('stream_02_detect');
    //     canvas.width = 640;
    //     canvas.height = 480;
    //     var context = canvas.getContext('2d');
    //     context.clearRect(0, 0, canvas.width, canvas.height);
    //     event.data.forEach(function (rect, i) {
    //         context.strokeStyle = '#a64ceb';
    //         context.strokeRect(rect.x, rect.y, rect.width, rect.height);
    //         //context.font = '11px Helvetica';
    //         //context.fillStyle = "#fff";
    //         //context.fillText('x: ' + rect.x + 'px', rect.x + rect.width + 5, rect.y + 11);
    //         //context.fillText('y: ' + rect.y + 'px', rect.x + rect.width + 5, rect.y + 22);

    //         var clickPosX =  640 / 2 - (rect.x + rect.width / 2);
    //         var clickPosY = 480 / 2 - (rect.y + rect.height / 2);


    //         console.log(clickPosX, clickPosY);

    //         var fovX = 32.8;
    //         var fovY = 43.5;

    //         var angleX = -fovX / 640 * clickPosX;
    //         var angleY = fovY / 480 * clickPosY;

    //         var speedX = 6;
    //         var speedY = 12;
    //         if (i == 0) {
    //             window.turretMoveAngle(angleX >= 0 ? c.RIGHT : c.LEFT, angleY >= 0 ? c.UP : c.DOWN, Math.abs(angleX), Math.abs(angleY), speedX, speedY);
    //         }

    //     });

    //});

    // setInterval(function () {
    //     window.YUVtoGreyscale();
    //     tracking.track('#stream_02_test', tracker);



    // }, 100);


});
