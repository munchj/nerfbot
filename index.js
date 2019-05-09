const $ = require("jquery");
const WSAvcPlayer = require('h264-live-player');
const nerfbot = require('./assets/js/nerfbot');
const utils = require('./assets/js/utils');
const settings = require('./assets/js/settings');

window.initCameraStreams = () =>  {
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
        $('#stream_02_overlay').width($('#stream_02').width()) ;
        $('#stream_02_overlay').height($('#stream_02').height());
        
    };
    stream_02.ws.onopen = (ev) => {
        stream_02.playStream();
        $('#stream_02_overlay').width($('#stream_02').width()) ;
        $('#stream_02_overlay').height($('#stream_02').height());
    }
    $('#stream_02_overlay').width($('#stream_02').width()) ;
    $('#stream_02_overlay').height($('#stream_02').height());
}

$(document).ready(function () {
    initCameraStreams();
});
