(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var $ = require("jquery");

var c = require('../constants');

module.exports =
/*#__PURE__*/
function () {
  function Magazine(container_id, number_of_darts) {
    _classCallCheck(this, Magazine);

    this.container = container_id;
    this.n_darts = number_of_darts;
    this.current_darts = number_of_darts;
  }

  _createClass(Magazine, [{
    key: "refresh",
    value: function refresh() {
      console.log("Magazine::refresh()" + this.n_darts);
      var html = $("<div class='darts-container'/>");
      html.append($("<div>" + this.current_darts + "/" + this.n_darts + "</div>"));

      for (var i = 0; i < this.n_darts; i++) {
        html.append($("<img src='images/dart.png'></img>"));
      }

      $(this.container).html(html);
    }
  }]);

  return Magazine;
}();

},{"../constants":2,"jquery":24}],2:[function(require,module,exports){
"use strict";

module.exports = {
  ARDUINO: {
    FORWARD: 1,
    BACKWARDS: 0,
    MSG_ROTATE: 1,
    MSG_SHOOT: 2
  },
  MSG_PING: "ping",
  MSG_MOVE: "move",
  MSG_MOVE_TURRET: "move_turret",
  MSG_SHOOT: "shoot",
  MSG_TEST_MOTORS: "test_motors",
  MSG_ROTATE: "rotate",
  MSG_SET_SPEED: "set_speed",
  MSG_SET_DIRECTION: "set_direction",
  MOTOR_FL: "motor_fl",
  MOTOR_FR: "motor_fr",
  MOTOR_BL: "motor_bl",
  MOTOR_BR: "motor_br",
  FORWARD: "fw",
  BACKWARDS: "bw",
  FRONT: "front",
  BACK: "back",
  LEFT: "left",
  RIGHT: "right",
  HIGH: 255,
  LOW: 0,
  TIMEOUT_MS: 200,
  MAX_TILT_RPM: 200,
  MAX_PAN_RPM: 200
};

},{}],3:[function(require,module,exports){
"use strict";

var _nipplejs = _interopRequireDefault(require("nipplejs"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var $ = require("jquery");

var c = require('./constants');

var settings = require('./settings');

var Magazine = require('./classes/Magazine');

var updateRate = 10; //number of updates by second

var baseMinSpeed = 80;
var maxSpeed = 150;
var keyMapMovement = {
  'w': false,
  'a': false,
  's': false,
  'd': false
};
var keyMapTurret = {
  'i': false,
  'k': false,
  'j': false,
  'l': false
};
var keyMapShooting = {
  'u': false,
  'o': false
};
var baseUpdateMap = {
  'speedX': 0,
  'speedY': 0
};
var turretUpdateMap = {
  'speedX': 0,
  'speedY': 0
}; ///////////////////////////////////////////////
////////////// websocket client  //////////////
///////////////////////////////////////////////

var nerfbotBaseServer = new WebSocket(settings.ws_base_handling);
var nerfbotTurretServer = new WebSocket(settings.ws_turret_handling);
window.nerfbotBaseServer = nerfbotBaseServer;
window.nerfbotTurretServer = nerfbotTurretServer;

nerfbotBaseServer.onopen = function () {
  console.log("[WebSocket] connected");
  $("#nerfbot_base_ws_status").text("base connected to " + settings.ws_base_handling);
};

nerfbotBaseServer.onerror = function (evt) {
  console.log("[WebSocket] error");
  $("#nerfbot_base_ws_status").text("base communication error " + evt);
};

nerfbotBaseServer.onclose = function () {
  console.log("[WebSocket] disconnected");
  $("#nerfbot_base_ws_status").text("base disconnected from " + settings.ws_base_handling);
};

nerfbotTurretServer.onopen = function () {
  console.log("[WebSocket] connected");
  $("#nerfbot_turret_ws_status").text("turret connected to " + settings.ws_turret_handling);
};

nerfbotTurretServer.onerror = function (evt) {
  console.log("[WebSocket] error");
  $("#nerfbot_turret_ws_status").text("turret communication error " + evt);
};

nerfbotTurretServer.onclose = function () {
  console.log("[WebSocket] disconnected");
  $("#nerfbot_turret_ws_status").text("turret disconnected from " + settings.ws_turret_handling);
};

var sendCommandToBase = function sendCommandToBase(command) {
  if (nerfbotBaseServer.readyState === nerfbotBaseServer.OPEN) {
    //console.log("sending " + command);
    nerfbotBaseServer.send(command);
  } else {//console.log("[websocket offline] " + command);
  }
};

var sendCommandToTurret = function sendCommandToTurret(command) {
  if (nerfbotTurretServer.readyState === nerfbotTurretServer.OPEN) {
    //console.log("sending " + command);
    nerfbotTurretServer.send(command);
  } else {//console.log("[websocket offline] " + command);
  }
};

nerfbotBaseServer.onmessage = function (event) {//console.log("[WebSocket] >>" + event.data);
};

nerfbotTurretServer.onmessage = function (event) {} //console.log("[WebSocket] >>" + event.data);
///////////////////////////////////////////////////////
////////////// send packets to websocket //////////////
///////////////////////////////////////////////////////
;

function wsUpdate() {
  var baseObj = {
    type: c.MSG_MOVE,
    linearSpeed: baseUpdateMap.speedX,
    angularSpeed: baseUpdateMap.speedY
  };
  var turretObj = {
    type: c.MSG_MOVE_TURRET,
    speedX: turretUpdateMap.speedX,
    speedY: turretUpdateMap.speedY
  };
  $("#nerfbot_horizontal_movement").text("speedX:" + baseUpdateMap.speedX + " speedY:" + baseUpdateMap.speedY);
  $("#nerfbot_vertical_movement").text("speedX:" + turretUpdateMap.speedX + " speedY:" + turretUpdateMap.speedY);
  sendCommandToBase(JSON.stringify(baseObj));
  sendCommandToTurret(JSON.stringify(turretObj));
  setTimeout(wsUpdate, 1000 / updateRate);
}

$(document).ready(wsUpdate);

function moveBase(speedX, speedY) {
  baseUpdateMap.speedX = speedX;
  baseUpdateMap.speedY = speedY;
}

function moveTurret(speedX, speedY) {
  console.log(speedX, speedY);
  turretUpdateMap.speedX = speedX;
  turretUpdateMap.speedY = speedY;
}

function shoot(speed) {
  var obj = {
    type: c.MSG_SHOOT
  };
  sendCommandToTurret(JSON.stringify(obj));
} //////////////////////////////////////////////////
////////////// keyboard management ///////////////
//////////////////////////////////////////////////


var fcnHandleMapChangeMovement = function fcnHandleMapChangeMovement() {
  if (keyMapMovement.w && keyMapMovement.s) {
    return;
  }

  if (keyMapMovement.a && keyMapMovement.s) {
    return;
  }

  if (keyMapMovement.w && !keyMapMovement.a && !keyMapMovement.d) {
    moveBase(maxSpeed, 0);
    return;
  }

  if (keyMapMovement.w && keyMapMovement.a && !keyMapMovement.d) {
    moveBase(maxSpeed, -maxSpeed);
    return;
  }

  if (keyMapMovement.w && !keyMapMovement.a && keyMapMovement.d) {
    moveBase(maxSpeed, maxSpeed);
    return;
  }

  if (keyMapMovement.s && !keyMapMovement.a && !keyMapMovement.d) {
    moveBase(-maxSpeed, 0);
    return;
  }

  if (keyMapMovement.s && keyMapMovement.a && !keyMapMovement.d) {
    moveBase(-maxSpeed, -maxSpeed);
    return;
  }

  if (keyMapMovement.s && !keyMapMovement.a && keyMapMovement.d) {
    moveBase(-maxSpeed, maxSpeed);
    return;
  }

  if (keyMapMovement.a) {
    moveBase(0, -maxSpeed);
    return;
  }

  if (keyMapMovement.d) {
    moveBase(0, maxSpeed);
    return;
  }

  if (!keyMapMovement.w && !keyMapMovement.a && !keyMapMovement.s && !keyMapMovement.d) {
    moveBase(0, 0);
    return;
  }
};

var fcnHandleMapChangeTurret = function fcnHandleMapChangeTurret() {
  if (keyMapTurret.i && keyMapTurret.k) {
    return;
  }

  if (keyMapTurret.j && keyMapTurret.k) {
    return;
  }

  if (keyMapTurret.i && !keyMapTurret.j && !keyMapTurret.l) {
    moveTurret(c.MAX_PAN_RPM, 0);
    return;
  }

  if (keyMapTurret.i && keyMapTurret.j && !keyMapTurret.l) {
    moveTurret(c.MAX_PAN_RPM, -c.MAX_TILT_RPM);
    return;
  }

  if (keyMapTurret.i && !keyMapTurret.j && keyMapTurret.l) {
    moveTurret(c.MAX_PAN_RPM, c.MAX_TILT_RPM);
    return;
  }

  if (keyMapTurret.k && !keyMapTurret.j && !keyMapTurret.l) {
    moveTurret(-c.MAX_PAN_RPM, 0);
    return;
  }

  if (keyMapTurret.k && keyMapTurret.j && !keyMapTurret.l) {
    moveTurret(-c.MAX_PAN_RPM, -c.MAX_TILT_RPM);
    return;
  }

  if (keyMapTurret.k && !keyMapTurret.j && keyMapTurret.l) {
    moveTurret(-c.MAX_PAN_RPM, c.MAX_TILT_RPM);
    return;
  }

  if (keyMapTurret.j) {
    moveTurret(0, -c.MAX_TILT_RPM);
    return;
  }

  if (keyMapTurret.l) {
    moveTurret(0, c.MAX_TILT_RPM);
    return;
  }

  if (!keyMapTurret.i && !keyMapTurret.j && !keyMapTurret.k && !keyMapTurret.l) {
    moveTurret(0, 0);
    return;
  }
};

var fcnHandleMapChangeShooting = function fcnHandleMapChangeShooting() {};

$(document).keyup(function (event) {
  var oldMapMovement = JSON.stringify(keyMapMovement);
  var oldMapVertical = JSON.stringify(keyMapTurret);
  var oldMapShooting = JSON.stringify(keyMapShooting);

  switch (event.key) {
    case 'w':
      keyMapMovement.w = false;
      break;

    case 'a':
      keyMapMovement.a = false;
      break;

    case 's':
      keyMapMovement.s = false;
      break;

    case 'd':
      keyMapMovement.d = false;
      break;

    case 'i':
      keyMapTurret.i = false;
      break;

    case 'j':
      keyMapTurret.j = false;
      break;

    case 'k':
      keyMapTurret.k = false;
      break;

    case 'l':
      keyMapTurret.l = false;
      break;

    default:
      {
        break;
      }
  }

  var newMapMovement = JSON.stringify(keyMapMovement);
  var newMapVertical = JSON.stringify(keyMapTurret);
  var newMapShooting = JSON.stringify(keyMapShooting);

  if (newMapMovement != oldMapMovement) {
    fcnHandleMapChangeMovement();
  }

  if (newMapVertical != oldMapVertical) {
    fcnHandleMapChangeTurret();
  }

  if (newMapShooting != oldMapShooting) {
    fcnHandleMapChangeShooting();
  }
});
$(document).keydown(function (event) {
  var oldMapMovement = JSON.stringify(keyMapMovement);
  var oldMapTurret = JSON.stringify(keyMapTurret);
  var oldMapShooting = JSON.stringify(keyMapShooting);

  switch (event.key) {
    case 'w':
      keyMapMovement.w = true;
      break;

    case 'a':
      keyMapMovement.a = true;
      break;

    case 's':
      keyMapMovement.s = true;
      break;

    case 'd':
      keyMapMovement.d = true;
      break;

    case 'i':
      keyMapTurret.i = true;
      break;

    case 'j':
      keyMapTurret.j = true;
      break;

    case 'k':
      keyMapTurret.k = true;
      break;

    case 'l':
      keyMapTurret.l = true;
      break;

    default:
      {
        break;
      }
  }

  var newMapMovement = JSON.stringify(keyMapMovement);
  var newMapVertical = JSON.stringify(keyMapTurret);
  var newMapShooting = JSON.stringify(keyMapShooting);

  if (newMapMovement != oldMapMovement) {
    fcnHandleMapChangeMovement();
  }

  if (newMapVertical != oldMapTurret) {
    fcnHandleMapChangeTurret();
  }

  if (newMapShooting != oldMapShooting) {
    fcnHandleMapChangeShooting();
  }
}); ///////////////////////////////////////
////////////// nipplejs ///////////////
///////////////////////////////////////

var readjustSpeed = function readjustSpeed(speed) {
  var tmp = 0;

  if (speed <= 10 && speed >= -10) {
    tmp = 0;
  } else if (speed > 10) {
    tmp = (speed - 10) * maxSpeed / 90;
  } else if (speed < -10) {
    tmp = (speed + 10) * maxSpeed / 90;
  }

  return Math.round(tmp);
};

var remapBaseSpeed = function remapBaseSpeed(speed) {
  var delta = maxSpeed - baseMinSpeed;

  if (speed > 0) {
    return Math.round(baseMinSpeed + speed / maxSpeed * delta);
  } else if (speed < 0) {
    return Math.round(-baseMinSpeed + speed / maxSpeed * delta);
  }

  return 0;
};

$(document).ready(function () {
  var leftJoystickOptions = {
    zone: document.getElementById('nerfbot_left_joystick_container'),
    mode: "static",
    position: {
      bottom: 150,
      left: 150
    },
    color: "white",
    size: 200
  };

  var leftJoystick = _nipplejs["default"].create(leftJoystickOptions);

  leftJoystick.get(0).on("move", function (evt, data) {
    var speed = data.distance;
    var speedX = speed * Math.sin(data.angle.radian);
    var speedY = speed * Math.cos(data.angle.radian); //avoid moving immediately

    speedX = remapBaseSpeed(readjustSpeed(speedX));
    speedY = remapBaseSpeed(readjustSpeed(speedY));
    moveBase(speedX, speedY);
  });
  leftJoystick.get(0).on("end", function (evt) {
    moveBase(0, 0);
  });
  var rightJoystickOptions = {
    zone: document.getElementById('nerfbot_right_joystick_container'),
    mode: "static",
    position: {
      bottom: 150,
      right: 150
    },
    color: "white",
    size: 200 //lockX: true

  };

  var rightJoystick = _nipplejs["default"].create(rightJoystickOptions);

  rightJoystick.get(1).on("move", function (evt, data) {
    var rpm = data.distance;
    var rpmX = rpm * Math.sin(data.angle.radian);
    var rpmY = rpm * Math.cos(data.angle.radian);
    rpmX = Math.round(rpmX / 100 * c.MAX_PAN_RPM);
    rpmY = Math.round(rpmY / 100 * c.MAX_TILT_RPM);
    moveTurret(rpmX, rpmY);
  });
  rightJoystick.get(1).on("end", function (evt) {
    moveTurret(0, 0);
  });
  var magazine = new Magazine("#magazine", 12);
  magazine.refresh();
});

},{"./classes/Magazine":1,"./constants":2,"./settings":4,"jquery":24,"nipplejs":46}],4:[function(require,module,exports){
"use strict";

module.exports = {
  ws_base_handling: "ws:\/\/192.168.1.24:1337",
  ws_base_camera: "ws:\/\/192.168.1.24:1338",
  //ws_turret_handling : "ws:\/\/192.168.1.22:1339",
  ws_turret_handling: "ws:\/\/localhost:1339",
  ws_turret_camera: "ws:\/\/192.168.1.22:1340",
  ws_tilt_stepper_port: 1341,
  ws_pan_stepper_port: 1342
};

},{}],5:[function(require,module,exports){
"use strict";

module.exports = {
  writeCanvas: function writeCanvas(id, text) {
    var canvas = document.getElementById(id);
    var ctx = canvas.getContext("2d");
    ctx.font = "16px Arial";
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);
  }
};

},{}],6:[function(require,module,exports){
"use strict";

var $ = require("jquery");

var WSAvcPlayer = require('h264-live-player');

var nerfbot = require('./assets/js/nerfbot');

var utils = require('./assets/js/utils');

var settings = require('./assets/js/settings');

window.initCameraStreams = function () {
  var stream_01_canvas = document.getElementById("stream_01");
  var stream_01 = new WSAvcPlayer(stream_01_canvas, "webgl", 1, 35);
  stream_01.connect(settings.ws_base_camera);
  stream_01.initCanvas(640, 480);

  stream_01.ws.onerror = function (ev) {//console.log(ev);
  };

  stream_01.ws.onopen = function (ev) {
    stream_01.playStream();
  };

  var stream_02_canvas = document.getElementById("stream_02");
  var stream_02 = new WSAvcPlayer(stream_02_canvas, "webgl", 1, 35);
  stream_02.connect(settings.ws_turret_camera);
  stream_02.initCanvas(640, 480);

  stream_02.ws.onerror = function (ev) {//console.log(ev);
  };

  stream_02.ws.onopen = function (ev) {
    stream_02.playStream();
  };
};

$(document).ready(function () {
  initCameraStreams();
});

},{"./assets/js/nerfbot":3,"./assets/js/settings":4,"./assets/js/utils":5,"h264-live-player":23,"jquery":24}],7:[function(require,module,exports){

},{}],8:[function(require,module,exports){
(function (process,__dirname){
// universal module definition
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define([], factory);
    } else if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory();
    } else {
        // Browser globals (root is window)
        root.Decoder = factory();
    }
}(this, function () {
  
  var global;
  
  function initglobal(){
    global = this;
    if (!global){
      if (typeof window != "undefined"){
        global = window;
      }else if (typeof self != "undefined"){
        global = self;
      };
    };
  };
  initglobal();
  
  
  function error(message) {
    console.error(message);
    console.trace();
  };

  
  function assert(condition, message) {
    if (!condition) {
      error(message);
    };
  };
  
  
  return (function(){
    "use strict";



  
  var getModule = function(_broadwayOnHeadersDecoded, _broadwayOnPictureDecoded){
    
    var window = this;
    //console.log(typeof window);
    
    window._broadwayOnHeadersDecoded = _broadwayOnHeadersDecoded;
    window._broadwayOnPictureDecoded = _broadwayOnPictureDecoded;
    
    var Module = {
      'print': function(text) { console.log('stdout: ' + text); },
      'printErr': function(text) { console.log('stderr: ' + text); }
    };
    
    
    /*
    
      The reason why this is all packed into one file is that this file can also function as worker.
      you can integrate the file into your build system and provide the original file to be loaded into a worker.
    
    */
    
function d(a){throw a;}var g=void 0,i=!0,k=null,m=!1;function n(){return function(){}}var p;p||(p=eval("(function() { try { return Module || {} } catch(e) { return {} } })()"));var aa={},r;for(r in p)p.hasOwnProperty(r)&&(aa[r]=p[r]);var t="object"===typeof process&&"function"===typeof null,ba="object"===typeof window,ca="function"===typeof importScripts,da=!ba&&!t&&!ca;
if(t){p.print||(p.print=function(a){process.stdout.write(a+"\n")});p.printErr||(p.printErr=function(a){process.stderr.write(a+"\n")});var fa=(null)("fs"),ga=(null)("path");p.read=function(a,b){var a=ga.normalize(a),c=fa.readFileSync(a);!c&&a!=ga.resolve(a)&&(a=path.join(__dirname,"..","src",a),c=fa.readFileSync(a));c&&!b&&(c=c.toString());return c};p.readBinary=function(a){return p.read(a,i)};p.load=function(a){ha(read(a))};p.thisProgram=1<process.argv.length?process.argv[1].replace(/\\/g,"/"):
"unknown-program";p.arguments=process.argv.slice(2);"undefined"!==typeof module&&(module.exports=p);process.on("uncaughtException",function(a){a instanceof ia||d(a)})}else da?(p.print||(p.print=print),"undefined"!=typeof printErr&&(p.printErr=printErr),p.read="undefined"!=typeof read?read:function(){d("no read() available (jsc?)")},p.readBinary=function(a){if("function"===typeof readbuffer)return new Uint8Array(readbuffer(a));a=read(a,"binary");w("object"===typeof a);return a},"undefined"!=typeof scriptArgs?
p.arguments=scriptArgs:"undefined"!=typeof arguments&&(p.arguments=arguments),this.Module=p,eval("if (typeof gc === 'function' && gc.toString().indexOf('[native code]') > 0) var gc = undefined")):ba||ca?(p.read=function(a){var b=new XMLHttpRequest;b.open("GET",a,m);b.send(k);return b.responseText},"undefined"!=typeof arguments&&(p.arguments=arguments),"undefined"!==typeof console?(p.print||(p.print=function(a){console.log(a)}),p.printErr||(p.printErr=function(a){console.log(a)})):p.print||(p.print=
n()),ba?window.Module=p:p.load=importScripts):d("Unknown runtime environment. Where are we?");function ha(a){eval.call(k,a)}!p.load&&p.read&&(p.load=function(a){ha(p.read(a))});p.print||(p.print=n());p.printErr||(p.printErr=p.print);p.arguments||(p.arguments=[]);p.thisProgram||(p.thisProgram="./this.program");p.print=p.print;p.fa=p.printErr;p.preRun=[];p.postRun=[];for(r in aa)aa.hasOwnProperty(r)&&(p[r]=aa[r]);
var z={Yd:function(a){ja=a},xd:function(){return ja},Tb:function(){return y},Sb:function(a){y=a},oc:function(a){switch(a){case "i1":case "i8":return 1;case "i16":return 2;case "i32":return 4;case "i64":return 8;case "float":return 4;case "double":return 8;default:return"*"===a[a.length-1]?z.ia:"i"===a[0]?(a=parseInt(a.substr(1)),w(0===a%8),a/8):0}},vd:function(a){return Math.max(z.oc(a),z.ia)},Qf:16,ng:function(a,b,c){return!c&&("i64"==a||"double"==a)?8:!a?Math.min(b,8):Math.min(b||(a?z.vd(a):0),
z.ia)},Fa:function(a,b,c){return c&&c.length?(c.splice||(c=Array.prototype.slice.call(c)),c.splice(0,0,b),p["dynCall_"+a].apply(k,c)):p["dynCall_"+a].call(k,b)},eb:[],Vc:function(a){for(var b=0;b<z.eb.length;b++)if(!z.eb[b])return z.eb[b]=a,2*(1+b);d("Finished up all reserved function pointers. Use a higher value for RESERVED_FUNCTION_POINTERS.")},Sd:function(a){z.eb[(a-2)/2]=k},og:function(a,b){z.wb||(z.wb={});var c=z.wb[a];if(c)return c;for(var c=[],e=0;e<b;e++)c.push(String.fromCharCode(36)+e);
e=ka(a);'"'===e[0]&&(e.indexOf('"',1)===e.length-1?e=e.substr(1,e.length-2):A("invalid EM_ASM input |"+e+"|. Please use EM_ASM(..code..) (no quotes) or EM_ASM({ ..code($0).. }, input) (to input values)"));try{var f=eval("(function(Module, FS) { return function("+c.join(",")+"){ "+e+" } })")(p,"undefined"!==typeof B?B:k)}catch(h){p.fa("error in executing inline EM_ASM code: "+h+" on: \n\n"+e+"\n\nwith args |"+c+"| (make sure to use the right one out of EM_ASM, EM_ASM_ARGS, etc.)"),d(h)}return z.wb[a]=
f},Aa:function(a){z.Aa.Rb||(z.Aa.Rb={});z.Aa.Rb[a]||(z.Aa.Rb[a]=1,p.fa(a))},Cb:{},rg:function(a,b){w(b);z.Cb[b]||(z.Cb[b]={});var c=z.Cb[b];c[a]||(c[a]=function(){return z.Fa(b,a,arguments)});return c[a]},Da:function(){var a=[],b=0;this.nb=function(c){c&=255;if(0==a.length){if(0==(c&128))return String.fromCharCode(c);a.push(c);b=192==(c&224)?1:224==(c&240)?2:3;return""}if(b&&(a.push(c),b--,0<b))return"";var c=a[0],e=a[1],f=a[2],h=a[3];2==a.length?c=String.fromCharCode((c&31)<<6|e&63):3==a.length?
c=String.fromCharCode((c&15)<<12|(e&63)<<6|f&63):(c=(c&7)<<18|(e&63)<<12|(f&63)<<6|h&63,c=String.fromCharCode(((c-65536)/1024|0)+55296,(c-65536)%1024+56320));a.length=0;return c};this.Ac=function(a){for(var a=unescape(encodeURIComponent(a)),b=[],f=0;f<a.length;f++)b.push(a.charCodeAt(f));return b}},pg:function(){d("You must build with -s RETAIN_COMPILER_SETTINGS=1 for Runtime.getCompilerSetting or emscripten_get_compiler_setting to work")},pb:function(a){var b=y;y=y+a|0;y=y+15&-16;return b},Ec:function(a){var b=
D;D=D+a|0;D=D+15&-16;return b},bb:function(a){var b=E;E=E+a|0;E=E+15&-16;E>=F&&A("Cannot enlarge memory arrays. Either (1) compile with -s TOTAL_MEMORY=X with X higher than the current value "+F+", (2) compile with ALLOW_MEMORY_GROWTH which adjusts the size at runtime but prevents some optimizations, or (3) set Module.TOTAL_MEMORY before the program runs.");return b},ub:function(a,b){return Math.ceil(a/(b?b:16))*(b?b:16)},Fg:function(a,b,c){return c?+(a>>>0)+4294967296*+(b>>>0):+(a>>>0)+4294967296*
+(b|0)},Pc:8,ia:4,Rf:0};p.Runtime=z;z.addFunction=z.Vc;z.removeFunction=z.Sd;var H=m,la,ma,ja;function w(a,b){a||A("Assertion failed: "+b)}function na(a){var b=p["_"+a];if(!b)try{b=eval("_"+a)}catch(c){}w(b,"Cannot call unknown function "+a+" (perhaps LLVM optimizations or closure removed it?)");return b}var oa,pa;
(function(){function a(a){a=a.toString().match(e).slice(1);return{arguments:a[0],body:a[1],returnValue:a[2]}}var b={stackSave:function(){z.Tb()},stackRestore:function(){z.Sb()},arrayToC:function(a){var b=z.pb(a.length);qa(a,b);return b},stringToC:function(a){var b=0;a!==k&&(a!==g&&0!==a)&&(b=z.pb((a.length<<2)+1),ra(a,b));return b}},c={string:b.stringToC,array:b.arrayToC};pa=function(a,b,e,f){var h=na(a),s=[],a=0;if(f)for(var v=0;v<f.length;v++){var G=c[e[v]];G?(0===a&&(a=z.Tb()),s[v]=G(f[v])):s[v]=
f[v]}e=h.apply(k,s);"string"===b&&(e=ka(e));0!==a&&z.Sb(a);return e};var e=/^function\s*\(([^)]*)\)\s*{\s*([^*]*?)[\s;]*(?:return\s*(.*?)[;\s]*)?}$/,f={},h;for(h in b)b.hasOwnProperty(h)&&(f[h]=a(b[h]));oa=function(b,c,e){var e=e||[],h=na(b),b=e.every(function(a){return"number"===a}),x="string"!==c;if(x&&b)return h;var s=e.map(function(a,b){return"$"+b}),c="(function("+s.join(",")+") {",v=e.length;if(!b)for(var c=c+("var stack = "+f.stackSave.body+";"),G=0;G<v;G++){var ua=s[G],ea=e[G];"number"!==
ea&&(ea=f[ea+"ToC"],c+="var "+ea.arguments+" = "+ua+";",c+=ea.body+";",c+=ua+"="+ea.returnValue+";")}e=a(function(){return h}).returnValue;c+="var ret = "+e+"("+s.join(",")+");";x||(e=a(function(){return ka}).returnValue,c+="ret = "+e+"(ret);");b||(c+=f.stackRestore.body.replace("()","(stack)")+";");return eval(c+"return ret})")}})();p.cwrap=oa;p.ccall=pa;
function sa(a,b,c){c=c||"i8";"*"===c.charAt(c.length-1)&&(c="i32");switch(c){case "i1":I[a>>0]=b;break;case "i8":I[a>>0]=b;break;case "i16":J[a>>1]=b;break;case "i32":K[a>>2]=b;break;case "i64":ma=[b>>>0,(la=b,1<=+ta(la)?0<la?(va(+wa(la/4294967296),4294967295)|0)>>>0:~~+xa((la-+(~~la>>>0))/4294967296)>>>0:0)];K[a>>2]=ma[0];K[a+4>>2]=ma[1];break;case "float":ya[a>>2]=b;break;case "double":za[a>>3]=b;break;default:A("invalid type for setValue: "+c)}}p.setValue=sa;
function Aa(a,b){b=b||"i8";"*"===b.charAt(b.length-1)&&(b="i32");switch(b){case "i1":return I[a>>0];case "i8":return I[a>>0];case "i16":return J[a>>1];case "i32":return K[a>>2];case "i64":return K[a>>2];case "float":return ya[a>>2];case "double":return za[a>>3];default:A("invalid type for setValue: "+b)}return k}p.getValue=Aa;var L=2,Ba=4;p.ALLOC_NORMAL=0;p.ALLOC_STACK=1;p.ALLOC_STATIC=L;p.ALLOC_DYNAMIC=3;p.ALLOC_NONE=Ba;
function M(a,b,c,e){var f,h;"number"===typeof a?(f=i,h=a):(f=m,h=a.length);var j="string"===typeof b?b:k,c=c==Ba?e:[Ca,z.pb,z.Ec,z.bb][c===g?L:c](Math.max(h,j?1:b.length));if(f){e=c;w(0==(c&3));for(a=c+(h&-4);e<a;e+=4)K[e>>2]=0;for(a=c+h;e<a;)I[e++>>0]=0;return c}if("i8"===j)return a.subarray||a.slice?N.set(a,c):N.set(new Uint8Array(a),c),c;for(var e=0,l,u;e<h;){var q=a[e];"function"===typeof q&&(q=z.sg(q));f=j||b[e];0===f?e++:("i64"==f&&(f="i32"),sa(c+e,q,f),u!==f&&(l=z.oc(f),u=f),e+=l)}return c}
p.allocate=M;function ka(a,b){if(0===b||!a)return"";for(var c=m,e,f=0;;){e=N[a+f>>0];if(128<=e)c=i;else if(0==e&&!b)break;f++;if(b&&f==b)break}b||(b=f);var h="";if(!c){for(;0<b;)e=String.fromCharCode.apply(String,N.subarray(a,a+Math.min(b,1024))),h=h?h+e:e,a+=1024,b-=1024;return h}c=new z.Da;for(f=0;f<b;f++)e=N[a+f>>0],h+=c.nb(e);return h}p.Pointer_stringify=ka;p.UTF16ToString=function(a){for(var b=0,c="";;){var e=J[a+2*b>>1];if(0==e)return c;++b;c+=String.fromCharCode(e)}};
p.stringToUTF16=function(a,b){for(var c=0;c<a.length;++c)J[b+2*c>>1]=a.charCodeAt(c);J[b+2*a.length>>1]=0};p.UTF32ToString=function(a){for(var b=0,c="";;){var e=K[a+4*b>>2];if(0==e)return c;++b;65536<=e?(e-=65536,c+=String.fromCharCode(55296|e>>10,56320|e&1023)):c+=String.fromCharCode(e)}};p.stringToUTF32=function(a,b){for(var c=0,e=0;e<a.length;++e){var f=a.charCodeAt(e);if(55296<=f&&57343>=f)var h=a.charCodeAt(++e),f=65536+((f&1023)<<10)|h&1023;K[b+4*c>>2]=f;++c}K[b+4*c>>2]=0};
function Da(a){function b(c,e,f){var e=e||Infinity,h="",j=[],s;if("N"===a[l]){l++;"K"===a[l]&&l++;for(s=[];"E"!==a[l];)if("S"===a[l]){l++;var C=a.indexOf("_",l);s.push(q[a.substring(l,C)||0]||"?");l=C+1}else if("C"===a[l])s.push(s[s.length-1]),l+=2;else{var C=parseInt(a.substr(l)),P=C.toString().length;if(!C||!P){l--;break}var sb=a.substr(l+P,C);s.push(sb);q.push(sb);l+=P+C}l++;s=s.join("::");e--;if(0===e)return c?[s]:s}else if(("K"===a[l]||x&&"L"===a[l])&&l++,C=parseInt(a.substr(l)))P=C.toString().length,
s=a.substr(l+P,C),l+=P+C;x=m;"I"===a[l]?(l++,C=b(i),P=b(i,1,i),h+=P[0]+" "+s+"<"+C.join(", ")+">"):h=s;a:for(;l<a.length&&0<e--;)if(s=a[l++],s in u)j.push(u[s]);else switch(s){case "P":j.push(b(i,1,i)[0]+"*");break;case "R":j.push(b(i,1,i)[0]+"&");break;case "L":l++;C=a.indexOf("E",l)-l;j.push(a.substr(l,C));l+=C+2;break;case "A":C=parseInt(a.substr(l));l+=C.toString().length;"_"!==a[l]&&d("?");l++;j.push(b(i,1,i)[0]+" ["+C+"]");break;case "E":break a;default:h+="?"+s;break a}!f&&(1===j.length&&"void"===
j[0])&&(j=[]);return c?(h&&j.push(h+"?"),j):h+("("+j.join(", ")+")")}var c=!!p.___cxa_demangle;if(c)try{var e=Ca(a.length);ra(a.substr(1),e);var f=Ca(4),h=p.___cxa_demangle(e,0,0,f);if(0===Aa(f,"i32")&&h)return ka(h)}catch(j){}finally{e&&Ea(e),f&&Ea(f),h&&Ea(h)}var l=3,u={v:"void",b:"bool",c:"char",s:"short",i:"int",l:"long",f:"float",d:"double",w:"wchar_t",a:"signed char",h:"unsigned char",t:"unsigned short",j:"unsigned int",m:"unsigned long",x:"long long",y:"unsigned long long",z:"..."},q=[],x=
i,e=a;try{if("Object._main"==a||"_main"==a)return"main()";"number"===typeof a&&(a=ka(a));if("_"!==a[0]||"_"!==a[1]||"Z"!==a[2])return a;switch(a[3]){case "n":return"operator new()";case "d":return"operator delete()"}e=b()}catch(s){e+="?"}0<=e.indexOf("?")&&!c&&z.Aa("warning: a problem occurred in builtin C++ name demangling; build with  -s DEMANGLE_SUPPORT=1  to link in libcxxabi demangling");return e}
function Fa(){var a;a:{a=Error();if(!a.stack){try{d(Error(0))}catch(b){a=b}if(!a.stack){a="(no stack trace available)";break a}}a=a.stack.toString()}return a.replace(/__Z[\w\d_]+/g,function(a){var b=Da(a);return a===b?a:a+" ["+b+"]"})}p.stackTrace=function(){return Fa()};for(var I,N,J,Ga,K,Ha,ya,za,Ia=0,D=0,Ja=0,y=0,Ka=0,La=0,E=0,Ma=p.TOTAL_STACK||5242880,F=p.TOTAL_MEMORY||52428800,O=65536;O<F||O<2*Ma;)O=16777216>O?2*O:O+16777216;
O!==F&&(p.fa("increasing TOTAL_MEMORY to "+O+" to be compliant with the asm.js spec"),F=O);w("undefined"!==typeof Int32Array&&"undefined"!==typeof Float64Array&&!!(new Int32Array(1)).subarray&&!!(new Int32Array(1)).set,"JS engine does not provide full typed array support");var Q=new ArrayBuffer(F);I=new Int8Array(Q);J=new Int16Array(Q);K=new Int32Array(Q);N=new Uint8Array(Q);Ga=new Uint16Array(Q);Ha=new Uint32Array(Q);ya=new Float32Array(Q);za=new Float64Array(Q);K[0]=255;w(255===N[0]&&0===N[3],"Typed arrays 2 must be run on a little-endian system");
p.HEAP=g;p.buffer=Q;p.HEAP8=I;p.HEAP16=J;p.HEAP32=K;p.HEAPU8=N;p.HEAPU16=Ga;p.HEAPU32=Ha;p.HEAPF32=ya;p.HEAPF64=za;function Na(a){for(;0<a.length;){var b=a.shift();if("function"==typeof b)b();else{var c=b.ja;"number"===typeof c?b.Xa===g?z.Fa("v",c):z.Fa("vi",c,[b.Xa]):c(b.Xa===g?k:b.Xa)}}}var Oa=[],R=[],Pa=[],Qa=[],Ra=[],Sa=m;function Ta(a){Oa.unshift(a)}p.addOnPreRun=p.Xf=Ta;p.addOnInit=p.Uf=function(a){R.unshift(a)};p.addOnPreMain=p.Wf=function(a){Pa.unshift(a)};p.addOnExit=p.Tf=function(a){Qa.unshift(a)};
function Ua(a){Ra.unshift(a)}p.addOnPostRun=p.Vf=Ua;function Va(a,b,c){a=(new z.Da).Ac(a);c&&(a.length=c);b||a.push(0);return a}p.intArrayFromString=Va;p.intArrayToString=function(a){for(var b=[],c=0;c<a.length;c++){var e=a[c];255<e&&(e&=255);b.push(String.fromCharCode(e))}return b.join("")};function ra(a,b,c){a=Va(a,c);for(c=0;c<a.length;)I[b+c>>0]=a[c],c+=1}p.writeStringToMemory=ra;function qa(a,b){for(var c=0;c<a.length;c++)I[b+c>>0]=a[c]}p.writeArrayToMemory=qa;
p.writeAsciiToMemory=function(a,b,c){for(var e=0;e<a.length;e++)I[b+e>>0]=a.charCodeAt(e);c||(I[b+a.length>>0]=0)};if(!Math.imul||-5!==Math.imul(4294967295,5))Math.imul=function(a,b){var c=a&65535,e=b&65535;return c*e+((a>>>16)*e+c*(b>>>16)<<16)|0};Math.vg=Math.imul;var ta=Math.abs,xa=Math.ceil,wa=Math.floor,va=Math.min,S=0,Wa=k,Xa=k;function Ya(){S++;p.monitorRunDependencies&&p.monitorRunDependencies(S)}p.addRunDependency=Ya;
function Za(){S--;p.monitorRunDependencies&&p.monitorRunDependencies(S);if(0==S&&(Wa!==k&&(clearInterval(Wa),Wa=k),Xa)){var a=Xa;Xa=k;a()}}p.removeRunDependency=Za;p.preloadedImages={};p.preloadedAudios={};var T=k,Ia=8,D=Ia+7808;R.push();
M([0,0,0,0,0,0,1,1,1,1,1,1,2,2,2,2,2,2,3,3,3,3,3,3,4,4,4,4,4,4,5,5,5,5,5,5,6,6,6,6,6,6,7,7,7,7,7,7,8,8,8,8,0,0,0,0,0,1,2,3,4,5,0,1,2,3,4,5,0,1,2,3,4,5,0,1,2,3,4,5,0,1,2,3,4,5,0,1,2,3,4,5,0,1,2,3,4,5,0,1,2,3,4,5,0,1,2,3,0,0,0,0,10,0,0,0,13,0,0,0,16,0,0,0,11,0,0,0,14,0,0,0,18,0,0,0,13,0,0,0,16,0,0,0,20,0,0,0,14,0,0,0,18,0,0,0,23,0,0,0,16,0,0,0,20,0,0,0,25,0,0,0,18,0,0,0,23,0,0,0,29,0,0,0,0,0,0,0,1,0,0,0,2,0,0,0,3,0,0,0,4,0,0,0,5,0,0,0,6,0,0,0,7,0,0,0,8,0,0,0,9,0,0,0,10,0,0,0,11,0,0,0,12,0,0,0,13,0,
0,0,14,0,0,0,15,0,0,0,16,0,0,0,17,0,0,0,18,0,0,0,19,0,0,0,20,0,0,0,21,0,0,0,22,0,0,0,23,0,0,0,24,0,0,0,25,0,0,0,26,0,0,0,27,0,0,0,28,0,0,0,29,0,0,0,29,0,0,0,30,0,0,0,31,0,0,0,32,0,0,0,32,0,0,0,33,0,0,0,34,0,0,0,34,0,0,0,35,0,0,0,35,0,0,0,36,0,0,0,36,0,0,0,37,0,0,0,37,0,0,0,37,0,0,0,38,0,0,0,38,0,0,0,38,0,0,0,39,0,0,0,39,0,0,0,39,0,0,0,39,0,0,0,1,0,0,0,2,0,0,0,4,0,0,0,8,0,0,0,16,0,0,0,32,0,0,0,64,0,0,0,128,0,0,0,1,0,0,0,1,0,0,0,2,0,0,0,2,0,0,0,3,0,0,0,3,0,0,0,3,0,0,0,3,0,0,0,0,0,0,0,1,0,0,0,4,0,0,
0,5,0,0,0,2,0,0,0,3,0,0,0,6,0,0,0,7,0,0,0,8,0,0,0,9,0,0,0,12,0,0,0,13,0,0,0,10,0,0,0,11,0,0,0,14,0,0,0,15,0,0,0,47,31,15,0,23,27,29,30,7,11,13,14,39,43,45,46,16,3,5,10,12,19,21,26,28,35,37,42,44,1,2,4,8,17,18,20,24,6,9,22,25,32,33,34,36,40,38,41,0,16,1,2,4,8,32,3,5,10,12,15,47,7,11,13,14,6,9,31,35,37,42,44,33,34,36,40,39,43,45,46,17,18,20,24,19,21,26,28,23,27,29,30,22,25,38,41,17,1,0,0,0,0,0,0,34,18,1,1,0,0,0,0,50,34,18,2,0,0,0,0,67,51,34,34,18,18,2,2,83,67,51,35,18,18,2,2,19,35,67,51,99,83,2,2,0,
0,101,85,68,68,52,52,35,35,35,35,19,19,19,19,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,249,233,217,200,200,184,184,167,167,167,167,151,151,151,151,134,134,134,134,134,134,134,134,118,118,118,118,118,118,118,118,230,214,198,182,165,165,149,149,132,132,132,132,116,116,116,116,100,100,100,100,84,84,84,84,67,67,67,67,67,67,67,67,51,51,51,51,51,51,51,51,35,35,35,35,35,35,35,35,19,19,19,19,19,19,19,19,3,3,3,3,3,3,3,3,214,182,197,197,165,165,149,149,132,132,132,132,84,84,84,84,68,68,68,68,4,4,4,4,115,115,115,115,
115,115,115,115,99,99,99,99,99,99,99,99,51,51,51,51,51,51,51,51,35,35,35,35,35,35,35,35,19,19,19,19,19,19,19,19,197,181,165,5,148,148,116,116,52,52,36,36,131,131,131,131,99,99,99,99,83,83,83,83,67,67,67,67,19,19,19,19,181,149,164,164,132,132,36,36,20,20,4,4,115,115,115,115,99,99,99,99,83,83,83,83,67,67,67,67,51,51,51,51,166,6,21,21,132,132,132,132,147,147,147,147,147,147,147,147,115,115,115,115,115,115,115,115,99,99,99,99,99,99,99,99,83,83,83,83,83,83,83,83,67,67,67,67,67,67,67,67,51,51,51,51,51,
51,51,51,35,35,35,35,35,35,35,35,150,6,21,21,116,116,116,116,131,131,131,131,131,131,131,131,99,99,99,99,99,99,99,99,67,67,67,67,67,67,67,67,51,51,51,51,51,51,51,51,35,35,35,35,35,35,35,35,82,82,82,82,82,82,82,82,82,82,82,82,82,82,82,82,134,6,37,37,20,20,20,20,115,115,115,115,115,115,115,115,99,99,99,99,99,99,99,99,51,51,51,51,51,51,51,51,82,82,82,82,82,82,82,82,82,82,82,82,82,82,82,82,66,66,66,66,66,66,66,66,66,66,66,66,66,66,66,66,22,6,117,117,36,36,36,36,83,83,83,83,83,83,83,83,98,98,98,98,98,
98,98,98,98,98,98,98,98,98,98,98,66,66,66,66,66,66,66,66,66,66,66,66,66,66,66,66,50,50,50,50,50,50,50,50,50,50,50,50,50,50,50,50,21,5,100,100,35,35,35,35,82,82,82,82,82,82,82,82,66,66,66,66,66,66,66,66,50,50,50,50,50,50,50,50,4,20,35,35,51,51,83,83,65,65,65,65,65,65,65,65,4,20,67,67,34,34,34,34,49,49,49,49,49,49,49,49,3,19,50,50,33,33,33,33,2,18,33,33,0,0,0,0,0,0,0,0,0,0,102,32,38,16,6,8,101,24,101,24,67,16,67,16,67,16,67,16,67,16,67,16,67,16,67,16,34,8,34,8,34,8,34,8,34,8,34,8,34,8,34,8,34,8,34,
8,34,8,34,8,34,8,34,8,34,8,34,8,0,0,0,0,0,0,0,0,106,64,74,48,42,40,10,32,105,56,105,56,73,40,73,40,41,32,41,32,9,24,9,24,104,48,104,48,104,48,104,48,72,32,72,32,72,32,72,32,40,24,40,24,40,24,40,24,8,16,8,16,8,16,8,16,103,40,103,40,103,40,103,40,103,40,103,40,103,40,103,40,71,24,71,24,71,24,71,24,71,24,71,24,71,24,71,24,110,96,78,88,46,80,14,80,110,88,78,80,46,72,14,72,13,64,13,64,77,72,77,72,45,64,45,64,13,56,13,56,109,80,109,80,77,64,77,64,45,56,45,56,13,48,13,48,107,72,107,72,107,72,107,72,107,
72,107,72,107,72,107,72,75,56,75,56,75,56,75,56,75,56,75,56,75,56,75,56,43,48,43,48,43,48,43,48,43,48,43,48,43,48,43,48,11,40,11,40,11,40,11,40,11,40,11,40,11,40,11,40,0,0,0,0,47,104,47,104,16,128,80,128,48,128,16,120,112,128,80,120,48,120,16,112,112,120,80,112,48,112,16,104,111,112,111,112,79,104,79,104,47,96,47,96,15,96,15,96,111,104,111,104,79,96,79,96,47,88,47,88,15,88,15,88,0,0,0,0,0,0,0,0,102,56,70,32,38,32,6,16,102,48,70,24,38,24,6,8,101,40,101,40,37,16,37,16,100,32,100,32,100,32,100,32,100,
24,100,24,100,24,100,24,67,16,67,16,67,16,67,16,67,16,67,16,67,16,67,16,0,0,0,0,0,0,0,0,105,72,73,56,41,56,9,48,8,40,8,40,72,48,72,48,40,48,40,48,8,32,8,32,103,64,103,64,103,64,103,64,71,40,71,40,71,40,71,40,39,40,39,40,39,40,39,40,7,24,7,24,7,24,7,24,0,0,0,0,109,120,109,120,110,128,78,128,46,128,14,128,46,120,14,120,78,120,46,112,77,112,77,112,13,112,13,112,109,112,109,112,77,104,77,104,45,104,45,104,13,104,13,104,109,104,109,104,77,96,77,96,45,96,45,96,13,96,13,96,12,88,12,88,12,88,12,88,76,88,
76,88,76,88,76,88,44,88,44,88,44,88,44,88,12,80,12,80,12,80,12,80,108,96,108,96,108,96,108,96,76,80,76,80,76,80,76,80,44,80,44,80,44,80,44,80,12,72,12,72,12,72,12,72,107,88,107,88,107,88,107,88,107,88,107,88,107,88,107,88,75,72,75,72,75,72,75,72,75,72,75,72,75,72,75,72,43,72,43,72,43,72,43,72,43,72,43,72,43,72,43,72,11,64,11,64,11,64,11,64,11,64,11,64,11,64,11,64,107,80,107,80,107,80,107,80,107,80,107,80,107,80,107,80,75,64,75,64,75,64,75,64,75,64,75,64,75,64,75,64,43,64,43,64,43,64,43,64,43,64,43,
64,43,64,43,64,11,56,11,56,11,56,11,56,11,56,11,56,11,56,11,56,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6,24,70,56,38,56,6,16,102,72,70,48,38,48,6,8,37,40,37,40,69,40,69,40,37,32,37,32,69,32,69,32,37,24,37,24,101,64,101,64,69,24,69,24,37,16,37,16,100,56,100,56,100,56,100,56,100,48,100,48,100,48,100,48,100,40,100,40,100,40,100,40,100,32,100,32,100,32,100,32,100,24,100,24,100,24,100,24,68,16,68,16,68,16,68,16,36,8,36,8,36,8,36,8,4,0,4,0,4,0,4,0,0,0,10,128,106,128,74,128,42,128,10,120,106,120,74,120,42,120,10,
112,106,112,74,112,42,112,10,104,41,104,41,104,9,96,9,96,73,104,73,104,41,96,41,96,9,88,9,88,105,104,105,104,73,96,73,96,41,88,41,88,9,80,9,80,104,96,104,96,104,96,104,96,72,88,72,88,72,88,72,88,40,80,40,80,40,80,40,80,8,72,8,72,8,72,8,72,104,88,104,88,104,88,104,88,72,80,72,80,72,80,72,80,40,72,40,72,40,72,40,72,8,64,8,64,8,64,8,64,7,56,7,56,7,56,7,56,7,56,7,56,7,56,7,56,7,48,7,48,7,48,7,48,7,48,7,48,7,48,7,48,71,72,71,72,71,72,71,72,71,72,71,72,71,72,71,72,7,40,7,40,7,40,7,40,7,40,7,40,7,40,7,40,
103,80,103,80,103,80,103,80,103,80,103,80,103,80,103,80,71,64,71,64,71,64,71,64,71,64,71,64,71,64,71,64,39,64,39,64,39,64,39,64,39,64,39,64,39,64,39,64,7,32,7,32,7,32,7,32,7,32,7,32,7,32,7,32,6,8,38,8,0,0,6,0,6,16,38,16,70,16,0,0,6,24,38,24,70,24,102,24,6,32,38,32,70,32,102,32,6,40,38,40,70,40,102,40,6,48,38,48,70,48,102,48,6,56,38,56,70,56,102,56,6,64,38,64,70,64,102,64,6,72,38,72,70,72,102,72,6,80,38,80,70,80,102,80,6,88,38,88,70,88,102,88,6,96,38,96,70,96,102,96,6,104,38,104,70,104,102,104,6,112,
38,112,70,112,102,112,6,120,38,120,70,120,102,120,6,128,38,128,70,128,102,128,0,0,67,16,2,0,2,0,33,8,33,8,33,8,33,8,103,32,103,32,72,32,40,32,71,24,71,24,39,24,39,24,6,32,6,32,6,32,6,32,6,24,6,24,6,24,6,24,6,16,6,16,6,16,6,16,102,24,102,24,102,24,102,24,38,16,38,16,38,16,38,16,6,8,6,8,6,8,6,8,3,0,0,0,15,0,0,0,1,0,0,0,10,0,0,0,0,0,0,0,5,0,0,0,4,0,0,0,0,0,0,0,1,0,0,0,11,0,0,0,1,0,0,0,14,0,0,0,4,0,0,0,1,0,0,0,4,0,0,0,4,0,0,0,0,0,0,0,7,0,0,0,4,0,0,0,2,0,0,0,0,0,0,0,13,0,0,0,4,0,0,0,8,0,0,0,4,0,0,0,3,
0,0,0,4,0,0,0,6,0,0,0,4,0,0,0,9,0,0,0,4,0,0,0,12,0,0,0,3,0,0,0,19,0,0,0,1,0,0,0,18,0,0,0,0,0,0,0,17,0,0,0,4,0,0,0,16,0,0,0,3,0,0,0,23,0,0,0,1,0,0,0,22,0,0,0,0,0,0,0,21,0,0,0,4,0,0,0,20,0,0,0,1,0,0,0,11,0,0,0,1,0,0,0,14,0,0,0,4,0,0,0,1,0,0,0,255,0,0,0,4,0,0,0,1,0,0,0,15,0,0,0,2,0,0,0,10,0,0,0,4,0,0,0,5,0,0,0,255,0,0,0,0,0,0,0,4,0,0,0,3,0,0,0,4,0,0,0,6,0,0,0,4,0,0,0,9,0,0,0,255,0,0,0,12,0,0,0,4,0,0,0,7,0,0,0,255,0,0,0,2,0,0,0,4,0,0,0,13,0,0,0,255,0,0,0,8,0,0,0,1,0,0,0,19,0,0,0,2,0,0,0,18,0,0,0,4,0,
0,0,17,0,0,0,255,0,0,0,16,0,0,0,1,0,0,0,23,0,0,0,2,0,0,0,22,0,0,0,4,0,0,0,21,0,0,0,255,0,0,0,20,0,0,0,1,0,0,0,10,0,0,0,1,0,0,0,11,0,0,0,4,0,0,0,0,0,0,0,4,0,0,0,1,0,0,0,1,0,0,0,14,0,0,0,1,0,0,0,15,0,0,0,4,0,0,0,4,0,0,0,4,0,0,0,5,0,0,0,4,0,0,0,2,0,0,0,4,0,0,0,3,0,0,0,4,0,0,0,8,0,0,0,4,0,0,0,9,0,0,0,4,0,0,0,6,0,0,0,4,0,0,0,7,0,0,0,4,0,0,0,12,0,0,0,4,0,0,0,13,0,0,0,1,0,0,0,18,0,0,0,1,0,0,0,19,0,0,0,4,0,0,0,16,0,0,0,4,0,0,0,17,0,0,0,1,0,0,0,22,0,0,0,1,0,0,0,23,0,0,0,4,0,0,0,20,0,0,0,4,0,0,0,21,0,0,0,0,
0,0,0,5,0,0,0,4,0,0,0,0,0,0,0,0,0,0,0,7,0,0,0,4,0,0,0,2,0,0,0,4,0,0,0,1,0,0,0,4,0,0,0,4,0,0,0,4,0,0,0,3,0,0,0,4,0,0,0,6,0,0,0,0,0,0,0,13,0,0,0,4,0,0,0,8,0,0,0,0,0,0,0,15,0,0,0,4,0,0,0,10,0,0,0,4,0,0,0,9,0,0,0,4,0,0,0,12,0,0,0,4,0,0,0,11,0,0,0,4,0,0,0,14,0,0,0,0,0,0,0,17,0,0,0,4,0,0,0,16,0,0,0,0,0,0,0,19,0,0,0,4,0,0,0,18,0,0,0,0,0,0,0,21,0,0,0,4,0,0,0,20,0,0,0,0,0,0,0,23,0,0,0,4,0,0,0,22,0,0,0,0,0,0,0,4,0,0,0,0,0,0,0,4,0,0,0,8,0,0,0,12,0,0,0,8,0,0,0,12,0,0,0,0,0,0,0,4,0,0,0,0,0,0,0,4,0,0,0,8,0,0,0,
12,0,0,0,8,0,0,0,12,0,0,0,0,0,0,0,0,0,0,0,4,0,0,0,4,0,0,0,0,0,0,0,0,0,0,0,4,0,0,0,4,0,0,0,8,0,0,0,8,0,0,0,12,0,0,0,12,0,0,0,8,0,0,0,8,0,0,0,12,0,0,0,12,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,93,94,95,96,97,98,99,100,101,102,103,104,105,106,107,108,
109,110,111,112,113,114,115,116,117,118,119,120,121,122,123,124,125,126,127,128,129,130,131,132,133,134,135,136,137,138,139,140,141,142,143,144,145,146,147,148,149,150,151,152,153,154,155,156,157,158,159,160,161,162,163,164,165,166,167,168,169,170,171,172,173,174,175,176,177,178,179,180,181,182,183,184,185,186,187,188,189,190,191,192,193,194,195,196,197,198,199,200,201,202,203,204,205,206,207,208,209,210,211,212,213,214,215,216,217,218,219,220,221,222,223,224,225,226,227,228,229,230,231,232,233,234,
235,236,237,238,239,240,241,242,243,244,245,246,247,248,249,250,251,252,253,254,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,
255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,
255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,
255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,
255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,3,0,0,0,15,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,3,0,0,0,15,0,0,0,0,0,0,0,5,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,3,0,0,0,15,0,0,0,1,0,0,0,10,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,3,0,0,0,15,0,0,0,1,0,0,0,10,0,0,0,0,0,0,0,5,0,0,0,4,0,0,0,0,0,0,0,1,0,0,0,11,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,1,0,0,0,11,0,0,0,4,0,0,0,1,0,0,0,255,0,
0,0,0,0,0,0,255,0,0,0,0,0,0,0,1,0,0,0,11,0,0,0,1,0,0,0,14,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,1,0,0,0,11,0,0,0,1,0,0,0,14,0,0,0,4,0,0,0,1,0,0,0,4,0,0,0,4,0,0,0,0,0,0,0,7,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,0,0,0,0,7,0,0,0,0,0,0,0,13,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,0,0,0,0,7,0,0,0,4,0,0,0,2,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,0,0,0,0,7,0,0,0,4,0,0,0,2,0,0,0,0,0,0,0,13,0,0,0,4,0,0,0,8,0,0,0,4,0,0,0,3,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,
0,0,0,4,0,0,0,3,0,0,0,4,0,0,0,9,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,4,0,0,0,3,0,0,0,4,0,0,0,6,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,4,0,0,0,3,0,0,0,4,0,0,0,6,0,0,0,4,0,0,0,9,0,0,0,4,0,0,0,12,0,0,0,1,0,0,0,14,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,1,0,0,0,14,0,0,0,255,0,0,0,4,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,1,0,0,0,11,0,0,0,1,0,0,0,14,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,1,0,0,0,11,0,0,0,1,0,0,0,14,0,0,0,4,0,0,0,1,0,0,0,255,0,0,0,4,0,0,0,2,0,0,0,10,0,0,
0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,2,0,0,0,10,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,1,0,0,0,15,0,0,0,2,0,0,0,10,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,1,0,0,0,15,0,0,0,2,0,0,0,10,0,0,0,4,0,0,0,5,0,0,0,255,0,0,0,0,0,0,0,4,0,0,0,6,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,4,0,0,0,6,0,0,0,255,0,0,0,12,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,4,0,0,0,3,0,0,0,4,0,0,0,6,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,4,0,0,0,3,0,0,0,4,0,0,0,6,0,
0,0,4,0,0,0,9,0,0,0,255,0,0,0,12,0,0,0,255,0,0,0,2,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,2,0,0,0,255,0,0,0,8,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,4,0,0,0,7,0,0,0,255,0,0,0,2,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,4,0,0,0,7,0,0,0,255,0,0,0,2,0,0,0,4,0,0,0,13,0,0,0,255,0,0,0,8,0,0,0,1,0,0,0,10,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,1,0,0,0,10,0,0,0,4,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,1,0,0,0,10,0,0,0,1,0,0,0,11,0,0,0,255,0,
0,0,0,0,0,0,255,0,0,0,0,0,0,0,1,0,0,0,10,0,0,0,1,0,0,0,11,0,0,0,4,0,0,0,0,0,0,0,4,0,0,0,1,0,0,0,1,0,0,0,14,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,1,0,0,0,14,0,0,0,4,0,0,0,4,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,1,0,0,0,14,0,0,0,1,0,0,0,15,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,1,0,0,0,14,0,0,0,1,0,0,0,15,0,0,0,4,0,0,0,4,0,0,0,4,0,0,0,5,0,0,0,4,0,0,0,2,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,4,0,0,0,2,0,0,0,4,0,0,0,8,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,
0,0,0,0,4,0,0,0,2,0,0,0,4,0,0,0,3,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,4,0,0,0,2,0,0,0,4,0,0,0,3,0,0,0,4,0,0,0,8,0,0,0,4,0,0,0,9,0,0,0,4,0,0,0,6,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,4,0,0,0,6,0,0,0,4,0,0,0,12,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,4,0,0,0,6,0,0,0,4,0,0,0,7,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,4,0,0,0,6,0,0,0,4,0,0,0,7,0,0,0,4,0,0,0,12,0,0,0,4,0,0,0,13,0,0,0,0,0,0,0,5,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,0,0,0,0,5,0,0,0,0,
0,0,0,7,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,0,0,0,0,5,0,0,0,4,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,0,0,0,0,5,0,0,0,4,0,0,0,0,0,0,0,0,0,0,0,7,0,0,0,4,0,0,0,2,0,0,0,4,0,0,0,1,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,4,0,0,0,1,0,0,0,4,0,0,0,3,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,4,0,0,0,1,0,0,0,4,0,0,0,4,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,4,0,0,0,1,0,0,0,4,0,0,0,4,0,0,0,4,0,0,0,3,0,0,0,4,0,0,0,6,0,0,0,0,0,0,0,13,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,
0,0,255,0,0,0,0,0,0,0,0,0,0,0,13,0,0,0,0,0,0,0,15,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,0,0,0,0,13,0,0,0,4,0,0,0,8,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,0,0,0,0,13,0,0,0,4,0,0,0,8,0,0,0,0,0,0,0,15,0,0,0,4,0,0,0,10,0,0,0,4,0,0,0,9,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,4,0,0,0,9,0,0,0,4,0,0,0,11,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,4,0,0,0,9,0,0,0,4,0,0,0,12,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,4,0,0,0,9,0,0,0,4,0,0,0,12,0,0,0,4,0,0,0,11,0,0,0,4,0,0,0,14,0,0,
0,0,0,0,0,1,0,0,0,2,0,0,0,3,0,0,0,4,0,0,0,5,0,0,0,6,0,0,0,7,0,0,0,8,0,0,0,9,0,0,0,10,0,0,0,11,0,0,0,12,0,0,0,13,0,0,0,14,0,0,0,15,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,4,5,6,7,8,9,10,12,13,15,17,20,22,25,28,32,36,40,45,50,56,63,71,80,90,101,113,127,144,162,182,203,226,255,255,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,2,2,3,3,3,3,4,4,4,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13,14,14,15,15,16,16,17,17,18,18,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,0,1,0,0,1,0,0,1,0,0,1,0,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,1,1,2,1,1,2,1,1,2,1,2,3,1,2,3,2,2,3,2,2,4,2,3,4,2,3,4,3,3,5,3,4,6,3,4,6,4,5,7,4,5,8,4,6,9,5,7,10,6,8,11,6,8,13,7,10,14,8,11,16,9,12,18,10,13,20,11,15,23,13,17,25,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,68,69,67,79,68,69,82,32,73,78,73,84,73,65,76,73,90,65,84,73,79,78,32,70,65,73,76,69,68,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],"i8",Ba,z.Pc);var $a=z.ub(M(12,"i8",L),8);w(0==$a%8);
var U={O:1,Q:2,Ef:3,De:4,ha:5,Zb:6,be:7,$e:8,V:9,oe:10,Ca:11,Of:11,Mc:12,qb:13,ye:14,mf:15,ga:16,Xb:17,Oc:18,Qa:19,Sa:20,pa:21,B:22,Ve:23,Lc:24,Nc:25,Lf:26,ze:27,hf:28,Ua:29,Bf:30,Oe:31,uf:32,ve:33,yf:34,df:42,Be:43,pe:44,Fe:45,Ge:46,He:47,Ne:48,Mf:49,Ye:50,Ee:51,te:35,af:37,ge:52,je:53,Pf:54,We:55,ke:56,le:57,ue:35,me:59,kf:60,Ze:61,If:62,jf:63,ef:64,ff:65,Af:66,bf:67,ee:68,Ff:69,qe:70,vf:71,Qe:72,we:73,ie:74,qf:76,he:77,zf:78,Ie:79,Je:80,Me:81,Le:82,Ke:83,lf:38,sb:39,Re:36,rb:40,Ta:95,tf:96,se:104,
Xe:105,fe:97,xf:91,of:88,gf:92,Cf:108,Wb:111,ce:98,re:103,Ue:101,Se:100,Jf:110,Ae:112,Yb:113,Jc:115,Hc:114,Ic:89,Pe:90,wf:93,Df:94,de:99,Te:102,Kc:106,Ra:107,Kf:109,Nf:87,xe:122,Gf:116,pf:95,cf:123,Ce:84,rf:75,ne:125,nf:131,sf:130,Hf:86},ab={"0":"Success",1:"Not super-user",2:"No such file or directory",3:"No such process",4:"Interrupted system call",5:"I/O error",6:"No such device or address",7:"Arg list too long",8:"Exec format error",9:"Bad file number",10:"No children",11:"No more processes",
12:"Not enough core",13:"Permission denied",14:"Bad address",15:"Block device required",16:"Mount device busy",17:"File exists",18:"Cross-device link",19:"No such device",20:"Not a directory",21:"Is a directory",22:"Invalid argument",23:"Too many open files in system",24:"Too many open files",25:"Not a typewriter",26:"Text file busy",27:"File too large",28:"No space left on device",29:"Illegal seek",30:"Read only file system",31:"Too many links",32:"Broken pipe",33:"Math arg out of domain of func",
34:"Math result not representable",35:"File locking deadlock error",36:"File or path name too long",37:"No record locks available",38:"Function not implemented",39:"Directory not empty",40:"Too many symbolic links",42:"No message of desired type",43:"Identifier removed",44:"Channel number out of range",45:"Level 2 not synchronized",46:"Level 3 halted",47:"Level 3 reset",48:"Link number out of range",49:"Protocol driver not attached",50:"No CSI structure available",51:"Level 2 halted",52:"Invalid exchange",
53:"Invalid request descriptor",54:"Exchange full",55:"No anode",56:"Invalid request code",57:"Invalid slot",59:"Bad font file fmt",60:"Device not a stream",61:"No data (for no delay io)",62:"Timer expired",63:"Out of streams resources",64:"Machine is not on the network",65:"Package not installed",66:"The object is remote",67:"The link has been severed",68:"Advertise error",69:"Srmount error",70:"Communication error on send",71:"Protocol error",72:"Multihop attempted",73:"Cross mount point (not really error)",
74:"Trying to read unreadable message",75:"Value too large for defined data type",76:"Given log. name not unique",77:"f.d. invalid for this operation",78:"Remote address changed",79:"Can   access a needed shared lib",80:"Accessing a corrupted shared lib",81:".lib section in a.out corrupted",82:"Attempting to link in too many libs",83:"Attempting to exec a shared library",84:"Illegal byte sequence",86:"Streams pipe error",87:"Too many users",88:"Socket operation on non-socket",89:"Destination address required",
90:"Message too long",91:"Protocol wrong type for socket",92:"Protocol not available",93:"Unknown protocol",94:"Socket type not supported",95:"Not supported",96:"Protocol family not supported",97:"Address family not supported by protocol family",98:"Address already in use",99:"Address not available",100:"Network interface is not configured",101:"Network is unreachable",102:"Connection reset by network",103:"Connection aborted",104:"Connection reset by peer",105:"No buffer space available",106:"Socket is already connected",
107:"Socket is not connected",108:"Can't send after socket shutdown",109:"Too many references",110:"Connection timed out",111:"Connection refused",112:"Host is down",113:"Host is unreachable",114:"Socket already connected",115:"Connection already in progress",116:"Stale file handle",122:"Quota exceeded",123:"No medium (in tape drive)",125:"Operation canceled",130:"Previous owner died",131:"State not recoverable"},bb=0;function V(a){return K[bb>>2]=a}
function cb(a,b){for(var c=0,e=a.length-1;0<=e;e--){var f=a[e];"."===f?a.splice(e,1):".."===f?(a.splice(e,1),c++):c&&(a.splice(e,1),c--)}if(b)for(;c--;c)a.unshift("..");return a}function db(a){var b="/"===a.charAt(0),c="/"===a.substr(-1),a=cb(a.split("/").filter(function(a){return!!a}),!b).join("/");!a&&!b&&(a=".");a&&c&&(a+="/");return(b?"/":"")+a}
function eb(a){var b=/^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/.exec(a).slice(1),a=b[0],b=b[1];if(!a&&!b)return".";b&&(b=b.substr(0,b.length-1));return a+b}function W(a){if("/"===a)return"/";var b=a.lastIndexOf("/");return-1===b?a:a.substr(b+1)}function fb(){var a=Array.prototype.slice.call(arguments,0);return db(a.join("/"))}function X(a,b){return db(a+"/"+b)}
function gb(){for(var a="",b=m,c=arguments.length-1;-1<=c&&!b;c--){b=0<=c?arguments[c]:B.yb();"string"!==typeof b&&d(new TypeError("Arguments to path.resolve must be strings"));if(!b)return"";a=b+"/"+a;b="/"===b.charAt(0)}a=cb(a.split("/").filter(function(a){return!!a}),!b).join("/");return(b?"/":"")+a||"."}
function hb(a,b){function c(a){for(var b=0;b<a.length&&""===a[b];b++);for(var c=a.length-1;0<=c&&""===a[c];c--);return b>c?[]:a.slice(b,c-b+1)}for(var a=gb(a).substr(1),b=gb(b).substr(1),e=c(a.split("/")),f=c(b.split("/")),h=Math.min(e.length,f.length),j=h,l=0;l<h;l++)if(e[l]!==f[l]){j=l;break}h=[];for(l=j;l<e.length;l++)h.push("..");h=h.concat(f.slice(j));return h.join("/")}var ib=[];function jb(a,b){ib[a]={input:[],K:[],sa:b};B.Ob(a,kb)}
var kb={open:function(a){var b=ib[a.g.ob];b||d(new B.e(U.Qa));a.N=b;a.seekable=m},close:function(a){a.N.sa.flush(a.N)},flush:function(a){a.N.sa.flush(a.N)},M:function(a,b,c,e){(!a.N||!a.N.sa.rc)&&d(new B.e(U.Zb));for(var f=0,h=0;h<e;h++){var j;try{j=a.N.sa.rc(a.N)}catch(l){d(new B.e(U.ha))}j===g&&0===f&&d(new B.e(U.Ca));if(j===k||j===g)break;f++;b[c+h]=j}f&&(a.g.timestamp=Date.now());return f},write:function(a,b,c,e){(!a.N||!a.N.sa.Lb)&&d(new B.e(U.Zb));for(var f=0;f<e;f++)try{a.N.sa.Lb(a.N,b[c+f])}catch(h){d(new B.e(U.ha))}e&&
(a.g.timestamp=Date.now());return f}},mb={rc:function(a){if(!a.input.length){var b=k;if(t){if(b=process.stdin.read(),!b){if(process.stdin._readableState&&process.stdin._readableState.ended)return k;return}}else"undefined"!=typeof window&&"function"==typeof window.prompt?(b=window.prompt("Input: "),b!==k&&(b+="\n")):"function"==typeof readline&&(b=readline(),b!==k&&(b+="\n"));if(!b)return k;a.input=Va(b,i)}return a.input.shift()},flush:function(a){a.K&&0<a.K.length&&(p.print(a.K.join("")),a.K=[])},
Lb:function(a,b){b===k||10===b?(p.print(a.K.join("")),a.K=[]):a.K.push(lb.nb(b))}},nb={Lb:function(a,b){b===k||10===b?(p.printErr(a.K.join("")),a.K=[]):a.K.push(lb.nb(b))},flush:function(a){a.K&&0<a.K.length&&(p.printErr(a.K.join("")),a.K=[])}},Y={U:k,F:function(){return Y.createNode(k,"/",16895,0)},createNode:function(a,b,c,e){(B.Bd(c)||B.Cd(c))&&d(new B.e(U.O));Y.U||(Y.U={dir:{g:{S:Y.n.S,I:Y.n.I,ra:Y.n.ra,ba:Y.n.ba,rename:Y.n.rename,za:Y.n.za,Oa:Y.n.Oa,Na:Y.n.Na,ca:Y.n.ca},A:{$:Y.p.$}},file:{g:{S:Y.n.S,
I:Y.n.I},A:{$:Y.p.$,M:Y.p.M,write:Y.p.write,Ea:Y.p.Ea,Ja:Y.p.Ja}},link:{g:{S:Y.n.S,I:Y.n.I,ta:Y.n.ta},A:{}},ec:{g:{S:Y.n.S,I:Y.n.I},A:B.bd}});c=B.createNode(a,b,c,e);B.J(c.mode)?(c.n=Y.U.dir.g,c.p=Y.U.dir.A,c.k={}):B.isFile(c.mode)?(c.n=Y.U.file.g,c.p=Y.U.file.A,c.q=0,c.k=k):B.Ia(c.mode)?(c.n=Y.U.link.g,c.p=Y.U.link.A):B.ib(c.mode)&&(c.n=Y.U.ec.g,c.p=Y.U.ec.A);c.timestamp=Date.now();a&&(a.k[b]=c);return c},ud:function(a){if(a.k&&a.k.subarray){for(var b=[],c=0;c<a.q;++c)b.push(a.k[c]);return b}return a.k},
qg:function(a){return!a.k?new Uint8Array:a.k.subarray?a.k.subarray(0,a.q):new Uint8Array(a.k)},lc:function(a,b){a.k&&(a.k.subarray&&b>a.k.length)&&(a.k=Y.ud(a),a.q=a.k.length);if(!a.k||a.k.subarray){var c=a.k?a.k.buffer.byteLength:0;c>=b||(b=Math.max(b,c*(1048576>c?2:1.125)|0),0!=c&&(b=Math.max(b,256)),c=a.k,a.k=new Uint8Array(b),0<a.q&&a.k.set(c.subarray(0,a.q),0))}else{!a.k&&0<b&&(a.k=[]);for(;a.k.length<b;)a.k.push(0)}},Ud:function(a,b){if(a.q!=b)if(0==b)a.k=k,a.q=0;else{if(!a.k||a.k.subarray){var c=
a.k;a.k=new Uint8Array(new ArrayBuffer(b));c&&a.k.set(c.subarray(0,Math.min(b,a.q)))}else if(a.k||(a.k=[]),a.k.length>b)a.k.length=b;else for(;a.k.length<b;)a.k.push(0);a.q=b}},n:{S:function(a){var b={};b.gg=B.ib(a.mode)?a.id:1;b.wg=a.id;b.mode=a.mode;b.Ig=1;b.uid=0;b.ug=0;b.ob=a.ob;b.size=B.J(a.mode)?4096:B.isFile(a.mode)?a.q:B.Ia(a.mode)?a.link.length:0;b.Zf=new Date(a.timestamp);b.Hg=new Date(a.timestamp);b.eg=new Date(a.timestamp);b.Zc=4096;b.$f=Math.ceil(b.size/b.Zc);return b},I:function(a,b){b.mode!==
g&&(a.mode=b.mode);b.timestamp!==g&&(a.timestamp=b.timestamp);b.size!==g&&Y.Ud(a,b.size)},ra:function(){d(B.Db[U.Q])},ba:function(a,b,c,e){return Y.createNode(a,b,c,e)},rename:function(a,b,c){if(B.J(a.mode)){var e;try{e=B.aa(b,c)}catch(f){}if(e)for(var h in e.k)d(new B.e(U.sb))}delete a.parent.k[a.name];a.name=c;b.k[c]=a;a.parent=b},za:function(a,b){delete a.k[b]},Oa:function(a,b){var c=B.aa(a,b),e;for(e in c.k)d(new B.e(U.sb));delete a.k[b]},Na:function(a){var b=[".",".."],c;for(c in a.k)a.k.hasOwnProperty(c)&&
b.push(c);return b},ca:function(a,b,c){a=Y.createNode(a,b,41471,0);a.link=c;return a},ta:function(a){B.Ia(a.mode)||d(new B.e(U.B));return a.link}},p:{M:function(a,b,c,e,f){var h=a.g.k;if(f>=a.g.q)return 0;a=Math.min(a.g.q-f,e);w(0<=a);if(8<a&&h.subarray)b.set(h.subarray(f,f+a),c);else for(e=0;e<a;e++)b[c+e]=h[f+e];return a},write:function(a,b,c,e,f,h){if(!e)return 0;a=a.g;a.timestamp=Date.now();if(b.subarray&&(!a.k||a.k.subarray)){if(h)return a.k=b.subarray(c,c+e),a.q=e;if(0===a.q&&0===f)return a.k=
new Uint8Array(b.subarray(c,c+e)),a.q=e;if(f+e<=a.q)return a.k.set(b.subarray(c,c+e),f),e}Y.lc(a,f+e);if(a.k.subarray&&b.subarray)a.k.set(b.subarray(c,c+e),f);else for(h=0;h<e;h++)a.k[f+h]=b[c+h];a.q=Math.max(a.q,f+e);return e},$:function(a,b,c){1===c?b+=a.position:2===c&&B.isFile(a.g.mode)&&(b+=a.g.q);0>b&&d(new B.e(U.B));return b},Ea:function(a,b,c){Y.lc(a.g,b+c);a.g.q=Math.max(a.g.q,b+c)},Ja:function(a,b,c,e,f,h,j){B.isFile(a.g.mode)||d(new B.e(U.Qa));c=a.g.k;if(!(j&2)&&(c.buffer===b||c.buffer===
b.buffer))a=m,e=c.byteOffset;else{if(0<f||f+e<a.g.q)c=c.subarray?c.subarray(f,f+e):Array.prototype.slice.call(c,f,f+e);a=i;(e=Ca(e))||d(new B.e(U.Mc));b.set(c,e)}return{Lg:e,Yf:a}}}},ob=M(1,"i32*",L),pb=M(1,"i32*",L),qb=M(1,"i32*",L),B={root:k,La:[],ic:[k],oa:[],Jd:1,T:k,hc:"/",hb:m,vc:i,H:{},Gc:{yc:{Rc:1,Sc:2}},e:k,Db:{},sc:function(a){a instanceof B.e||d(a+" : "+Fa());return V(a.cb)},u:function(a,b){a=gb(B.yb(),a);b=b||{};if(!a)return{path:"",g:k};var c={Bb:i,Nb:0},e;for(e in c)b[e]===g&&(b[e]=
c[e]);8<b.Nb&&d(new B.e(U.rb));var c=cb(a.split("/").filter(function(a){return!!a}),m),f=B.root;e="/";for(var h=0;h<c.length;h++){var j=h===c.length-1;if(j&&b.parent)break;f=B.aa(f,c[h]);e=X(e,c[h]);if(B.ka(f)&&(!j||j&&b.Bb))f=f.Ka.root;if(!j||b.R)for(j=0;B.Ia(f.mode);)f=B.ta(e),e=gb(eb(e),f),f=B.u(e,{Nb:b.Nb}).g,40<j++&&d(new B.e(U.rb))}return{path:e,g:f}},da:function(a){for(var b;;){if(B.jb(a))return a=a.F.Id,!b?a:"/"!==a[a.length-1]?a+"/"+b:a+b;b=b?a.name+"/"+b:a.name;a=a.parent}},Fb:function(a,
b){for(var c=0,e=0;e<b.length;e++)c=(c<<5)-c+b.charCodeAt(e)|0;return(a+c>>>0)%B.T.length},tc:function(a){var b=B.Fb(a.parent.id,a.name);a.ma=B.T[b];B.T[b]=a},uc:function(a){var b=B.Fb(a.parent.id,a.name);if(B.T[b]===a)B.T[b]=a.ma;else for(b=B.T[b];b;){if(b.ma===a){b.ma=a.ma;break}b=b.ma}},aa:function(a,b){var c=B.Gd(a);c&&d(new B.e(c,a));for(c=B.T[B.Fb(a.id,b)];c;c=c.ma){var e=c.name;if(c.parent.id===a.id&&e===b)return c}return B.ra(a,b)},createNode:function(a,b,c,e){B.Va||(B.Va=function(a,b,c,e){a||
(a=this);this.parent=a;this.F=a.F;this.Ka=k;this.id=B.Jd++;this.name=b;this.mode=c;this.n={};this.p={};this.ob=e},B.Va.prototype={},Object.defineProperties(B.Va.prototype,{M:{get:function(){return 365===(this.mode&365)},set:function(a){a?this.mode|=365:this.mode&=-366}},write:{get:function(){return 146===(this.mode&146)},set:function(a){a?this.mode|=146:this.mode&=-147}},Dd:{get:function(){return B.J(this.mode)}},Gb:{get:function(){return B.ib(this.mode)}}}));a=new B.Va(a,b,c,e);B.tc(a);return a},
zb:function(a){B.uc(a)},jb:function(a){return a===a.parent},ka:function(a){return!!a.Ka},isFile:function(a){return 32768===(a&61440)},J:function(a){return 16384===(a&61440)},Ia:function(a){return 40960===(a&61440)},ib:function(a){return 8192===(a&61440)},Bd:function(a){return 24576===(a&61440)},Cd:function(a){return 4096===(a&61440)},Ed:function(a){return 49152===(a&49152)},rd:{r:0,rs:1052672,"r+":2,w:577,wx:705,xw:705,"w+":578,"wx+":706,"xw+":706,a:1089,ax:1217,xa:1217,"a+":1090,"ax+":1218,"xa+":1218},
wc:function(a){var b=B.rd[a];"undefined"===typeof b&&d(Error("Unknown file open mode: "+a));return b},sd:function(a){var b=["r","w","rw"][a&2097155];a&512&&(b+="w");return b},na:function(a,b){return B.vc?0:-1!==b.indexOf("r")&&!(a.mode&292)||-1!==b.indexOf("w")&&!(a.mode&146)||-1!==b.indexOf("x")&&!(a.mode&73)?U.qb:0},Gd:function(a){var b=B.na(a,"x");return b?b:!a.n.ra?U.qb:0},Jb:function(a,b){try{return B.aa(a,b),U.Xb}catch(c){}return B.na(a,"wx")},kb:function(a,b,c){var e;try{e=B.aa(a,b)}catch(f){return f.cb}if(a=
B.na(a,"wx"))return a;if(c){if(!B.J(e.mode))return U.Sa;if(B.jb(e)||B.da(e)===B.yb())return U.ga}else if(B.J(e.mode))return U.pa;return 0},Hd:function(a,b){return!a?U.Q:B.Ia(a.mode)?U.rb:B.J(a.mode)&&(0!==(b&2097155)||b&512)?U.pa:B.na(a,B.sd(b))},Qc:4096,Kd:function(a,b){for(var b=b||B.Qc,c=a||0;c<=b;c++)if(!B.oa[c])return c;d(new B.e(U.Lc))},qa:function(a){return B.oa[a]},fc:function(a,b,c){B.Wa||(B.Wa=n(),B.Wa.prototype={},Object.defineProperties(B.Wa.prototype,{object:{get:function(){return this.g},
set:function(a){this.g=a}},yg:{get:function(){return 1!==(this.D&2097155)}},zg:{get:function(){return 0!==(this.D&2097155)}},xg:{get:function(){return this.D&1024}}}));var e=new B.Wa,f;for(f in a)e[f]=a[f];a=e;b=B.Kd(b,c);a.C=b;return B.oa[b]=a},dd:function(a){B.oa[a]=k},pc:function(a){return B.oa[a-1]},Eb:function(a){return a?a.C+1:0},bd:{open:function(a){a.p=B.td(a.g.ob).p;a.p.open&&a.p.open(a)},$:function(){d(new B.e(U.Ua))}},Ib:function(a){return a>>8},Gg:function(a){return a&255},la:function(a,
b){return a<<8|b},Ob:function(a,b){B.ic[a]={p:b}},td:function(a){return B.ic[a]},nc:function(a){for(var b=[],a=[a];a.length;){var c=a.pop();b.push(c);a.push.apply(a,c.La)}return b},Fc:function(a,b){function c(a){if(a){if(!c.pd)return c.pd=i,b(a)}else++f>=e.length&&b(k)}"function"===typeof a&&(b=a,a=m);var e=B.nc(B.root.F),f=0;e.forEach(function(b){if(!b.type.Fc)return c(k);b.type.Fc(b,a,c)})},F:function(a,b,c){var e="/"===c,f=!c,h;e&&B.root&&d(new B.e(U.ga));!e&&!f&&(h=B.u(c,{Bb:m}),c=h.path,h=h.g,
B.ka(h)&&d(new B.e(U.ga)),B.J(h.mode)||d(new B.e(U.Sa)));b={type:a,Kg:b,Id:c,La:[]};a=a.F(b);a.F=b;b.root=a;e?B.root=a:h&&(h.Ka=b,h.F&&h.F.La.push(b));return a},Qg:function(a){a=B.u(a,{Bb:m});B.ka(a.g)||d(new B.e(U.B));var a=a.g,b=a.Ka,c=B.nc(b);Object.keys(B.T).forEach(function(a){for(a=B.T[a];a;){var b=a.ma;-1!==c.indexOf(a.F)&&B.zb(a);a=b}});a.Ka=k;b=a.F.La.indexOf(b);w(-1!==b);a.F.La.splice(b,1)},ra:function(a,b){return a.n.ra(a,b)},ba:function(a,b,c){var e=B.u(a,{parent:i}).g,a=W(a);(!a||"."===
a||".."===a)&&d(new B.e(U.B));var f=B.Jb(e,a);f&&d(new B.e(f));e.n.ba||d(new B.e(U.O));return e.n.ba(e,a,b,c)},create:function(a,b){b=(b!==g?b:438)&4095;b|=32768;return B.ba(a,b,0)},ea:function(a,b){b=(b!==g?b:511)&1023;b|=16384;return B.ba(a,b,0)},lb:function(a,b,c){"undefined"===typeof c&&(c=b,b=438);return B.ba(a,b|8192,c)},ca:function(a,b){gb(a)||d(new B.e(U.Q));var c=B.u(b,{parent:i}).g;c||d(new B.e(U.Q));var e=W(b),f=B.Jb(c,e);f&&d(new B.e(f));c.n.ca||d(new B.e(U.O));return c.n.ca(c,e,a)},rename:function(a,
b){var c=eb(a),e=eb(b),f=W(a),h=W(b),j,l,u;try{j=B.u(a,{parent:i}),l=j.g,j=B.u(b,{parent:i}),u=j.g}catch(q){d(new B.e(U.ga))}(!l||!u)&&d(new B.e(U.Q));l.F!==u.F&&d(new B.e(U.Oc));j=B.aa(l,f);e=hb(a,e);"."!==e.charAt(0)&&d(new B.e(U.B));e=hb(b,c);"."!==e.charAt(0)&&d(new B.e(U.sb));var x;try{x=B.aa(u,h)}catch(s){}if(j!==x){c=B.J(j.mode);(f=B.kb(l,f,c))&&d(new B.e(f));(f=x?B.kb(u,h,c):B.Jb(u,h))&&d(new B.e(f));l.n.rename||d(new B.e(U.O));(B.ka(j)||x&&B.ka(x))&&d(new B.e(U.ga));u!==l&&(f=B.na(l,"w"))&&
d(new B.e(f));try{B.H.willMovePath&&B.H.willMovePath(a,b)}catch(v){console.log("FS.trackingDelegate['willMovePath']('"+a+"', '"+b+"') threw an exception: "+v.message)}B.uc(j);try{l.n.rename(j,u,h)}catch(G){d(G)}finally{B.tc(j)}try{if(B.H.onMovePath)B.H.onMovePath(a,b)}catch(ua){console.log("FS.trackingDelegate['onMovePath']('"+a+"', '"+b+"') threw an exception: "+ua.message)}}},Oa:function(a){var b=B.u(a,{parent:i}).g,c=W(a),e=B.aa(b,c),f=B.kb(b,c,i);f&&d(new B.e(f));b.n.Oa||d(new B.e(U.O));B.ka(e)&&
d(new B.e(U.ga));try{B.H.willDeletePath&&B.H.willDeletePath(a)}catch(h){console.log("FS.trackingDelegate['willDeletePath']('"+a+"') threw an exception: "+h.message)}b.n.Oa(b,c);B.zb(e);try{if(B.H.onDeletePath)B.H.onDeletePath(a)}catch(j){console.log("FS.trackingDelegate['onDeletePath']('"+a+"') threw an exception: "+j.message)}},Na:function(a){a=B.u(a,{R:i}).g;a.n.Na||d(new B.e(U.Sa));return a.n.Na(a)},za:function(a){var b=B.u(a,{parent:i}).g,c=W(a),e=B.aa(b,c),f=B.kb(b,c,m);f&&(f===U.pa&&(f=U.O),
d(new B.e(f)));b.n.za||d(new B.e(U.O));B.ka(e)&&d(new B.e(U.ga));try{B.H.willDeletePath&&B.H.willDeletePath(a)}catch(h){console.log("FS.trackingDelegate['willDeletePath']('"+a+"') threw an exception: "+h.message)}b.n.za(b,c);B.zb(e);try{if(B.H.onDeletePath)B.H.onDeletePath(a)}catch(j){console.log("FS.trackingDelegate['onDeletePath']('"+a+"') threw an exception: "+j.message)}},ta:function(a){(a=B.u(a).g)||d(new B.e(U.Q));a.n.ta||d(new B.e(U.B));return a.n.ta(a)},Dc:function(a,b){var c=B.u(a,{R:!b}).g;
c||d(new B.e(U.Q));c.n.S||d(new B.e(U.O));return c.n.S(c)},Eg:function(a){return B.Dc(a,i)},Ya:function(a,b,c){a="string"===typeof a?B.u(a,{R:!c}).g:a;a.n.I||d(new B.e(U.O));a.n.I(a,{mode:b&4095|a.mode&-4096,timestamp:Date.now()})},Bg:function(a,b){B.Ya(a,b,i)},jg:function(a,b){var c=B.qa(a);c||d(new B.e(U.V));B.Ya(c.g,b)},dc:function(a,b,c,e){a="string"===typeof a?B.u(a,{R:!e}).g:a;a.n.I||d(new B.e(U.O));a.n.I(a,{timestamp:Date.now()})},Cg:function(a,b,c){B.dc(a,b,c,i)},kg:function(a,b,c){(a=B.qa(a))||
d(new B.e(U.V));B.dc(a.g,b,c)},truncate:function(a,b){0>b&&d(new B.e(U.B));var c;c="string"===typeof a?B.u(a,{R:i}).g:a;c.n.I||d(new B.e(U.O));B.J(c.mode)&&d(new B.e(U.pa));B.isFile(c.mode)||d(new B.e(U.B));var e=B.na(c,"w");e&&d(new B.e(e));c.n.I(c,{size:b,timestamp:Date.now()})},mg:function(a,b){var c=B.qa(a);c||d(new B.e(U.V));0===(c.D&2097155)&&d(new B.e(U.B));B.truncate(c.g,b)},Rg:function(a,b,c){a=B.u(a,{R:i}).g;a.n.I(a,{timestamp:Math.max(b,c)})},open:function(a,b,c,e,f){""===a&&d(new B.e(U.Q));
var b="string"===typeof b?B.wc(b):b,c=b&64?("undefined"===typeof c?438:c)&4095|32768:0,h;if("object"===typeof a)h=a;else{a=db(a);try{h=B.u(a,{R:!(b&131072)}).g}catch(j){}}var l=m;b&64&&(h?b&128&&d(new B.e(U.Xb)):(h=B.ba(a,c,0),l=i));h||d(new B.e(U.Q));B.ib(h.mode)&&(b&=-513);l||(c=B.Hd(h,b))&&d(new B.e(c));b&512&&B.truncate(h,0);b&=-641;e=B.fc({g:h,path:B.da(h),D:b,seekable:i,position:0,p:h.p,$d:[],error:m},e,f);e.p.open&&e.p.open(e);p.logReadFiles&&!(b&1)&&(B.Mb||(B.Mb={}),a in B.Mb||(B.Mb[a]=1,
p.printErr("read file: "+a)));try{B.H.onOpenFile&&(f=0,1!==(b&2097155)&&(f|=B.Gc.yc.Rc),0!==(b&2097155)&&(f|=B.Gc.yc.Sc),B.H.onOpenFile(a,f))}catch(u){console.log("FS.trackingDelegate['onOpenFile']('"+a+"', flags) threw an exception: "+u.message)}return e},close:function(a){try{a.p.close&&a.p.close(a)}catch(b){d(b)}finally{B.dd(a.C)}},$:function(a,b,c){(!a.seekable||!a.p.$)&&d(new B.e(U.Ua));a.position=a.p.$(a,b,c);a.$d=[];return a.position},M:function(a,b,c,e,f){(0>e||0>f)&&d(new B.e(U.B));1===(a.D&
2097155)&&d(new B.e(U.V));B.J(a.g.mode)&&d(new B.e(U.pa));a.p.M||d(new B.e(U.B));var h=i;"undefined"===typeof f?(f=a.position,h=m):a.seekable||d(new B.e(U.Ua));b=a.p.M(a,b,c,e,f);h||(a.position+=b);return b},write:function(a,b,c,e,f,h){(0>e||0>f)&&d(new B.e(U.B));0===(a.D&2097155)&&d(new B.e(U.V));B.J(a.g.mode)&&d(new B.e(U.pa));a.p.write||d(new B.e(U.B));a.D&1024&&B.$(a,0,2);var j=i;"undefined"===typeof f?(f=a.position,j=m):a.seekable||d(new B.e(U.Ua));b=a.p.write(a,b,c,e,f,h);j||(a.position+=b);
try{if(a.path&&B.H.onWriteToFile)B.H.onWriteToFile(a.path)}catch(l){console.log("FS.trackingDelegate['onWriteToFile']('"+path+"') threw an exception: "+l.message)}return b},Ea:function(a,b,c){(0>b||0>=c)&&d(new B.e(U.B));0===(a.D&2097155)&&d(new B.e(U.V));!B.isFile(a.g.mode)&&!B.J(node.mode)&&d(new B.e(U.Qa));a.p.Ea||d(new B.e(U.Ta));a.p.Ea(a,b,c)},Ja:function(a,b,c,e,f,h,j){1===(a.D&2097155)&&d(new B.e(U.qb));a.p.Ja||d(new B.e(U.Qa));return a.p.Ja(a,b,c,e,f,h,j)},Ha:function(a,b,c){a.p.Ha||d(new B.e(U.Nc));
return a.p.Ha(a,b,c)},Mg:function(a,b){b=b||{};b.D=b.D||"r";b.encoding=b.encoding||"binary";"utf8"!==b.encoding&&"binary"!==b.encoding&&d(Error('Invalid encoding type "'+b.encoding+'"'));var c,e=B.open(a,b.D),f=B.Dc(a).size,h=new Uint8Array(f);B.M(e,h,0,f,0);if("utf8"===b.encoding){c="";for(var j=new z.Da,l=0;l<f;l++)c+=j.nb(h[l])}else"binary"===b.encoding&&(c=h);B.close(e);return c},Sg:function(a,b,c){c=c||{};c.D=c.D||"w";c.encoding=c.encoding||"utf8";"utf8"!==c.encoding&&"binary"!==c.encoding&&
d(Error('Invalid encoding type "'+c.encoding+'"'));a=B.open(a,c.D,c.mode);"utf8"===c.encoding?(b=new Uint8Array((new z.Da).Ac(b)),B.write(a,b,0,b.length,0,c.ad)):"binary"===c.encoding&&B.write(a,b,0,b.length,0,c.ad);B.close(a)},yb:function(){return B.hc},bg:function(a){a=B.u(a,{R:i});B.J(a.g.mode)||d(new B.e(U.Sa));var b=B.na(a.g,"x");b&&d(new B.e(b));B.hc=a.path},fd:function(){B.ea("/tmp");B.ea("/home");B.ea("/home/web_user")},ed:function(){B.ea("/dev");B.Ob(B.la(1,3),{M:function(){return 0},write:function(){return 0}});
B.lb("/dev/null",B.la(1,3));jb(B.la(5,0),mb);jb(B.la(6,0),nb);B.lb("/dev/tty",B.la(5,0));B.lb("/dev/tty1",B.la(6,0));var a;if("undefined"!==typeof crypto){var b=new Uint8Array(1);a=function(){crypto.getRandomValues(b);return b[0]}}else a=t?function(){return (null)("crypto").randomBytes(1)[0]}:function(){return 256*Math.random()|0};B.X("/dev","random",a);B.X("/dev","urandom",a);B.ea("/dev/shm");B.ea("/dev/shm/tmp")},od:function(){p.stdin?B.X("/dev","stdin",p.stdin):B.ca("/dev/tty","/dev/stdin");p.stdout?
B.X("/dev","stdout",k,p.stdout):B.ca("/dev/tty","/dev/stdout");p.stderr?B.X("/dev","stderr",k,p.stderr):B.ca("/dev/tty1","/dev/stderr");var a=B.open("/dev/stdin","r");K[ob>>2]=B.Eb(a);w(0===a.C,"invalid handle for stdin ("+a.C+")");a=B.open("/dev/stdout","w");K[pb>>2]=B.Eb(a);w(1===a.C,"invalid handle for stdout ("+a.C+")");a=B.open("/dev/stderr","w");K[qb>>2]=B.Eb(a);w(2===a.C,"invalid handle for stderr ("+a.C+")")},jc:function(){B.e||(B.e=function(a,b){this.g=b;this.Xd=function(a){this.cb=a;for(var b in U)if(U[b]===
a){this.code=b;break}};this.Xd(a);this.message=ab[a]},B.e.prototype=Error(),[U.Q].forEach(function(a){B.Db[a]=new B.e(a);B.Db[a].stack="<generic error, no stack>"}))},Zd:function(){B.jc();B.T=Array(4096);B.F(Y,{},"/");B.fd();B.ed()},Ga:function(a,b,c){w(!B.Ga.hb,"FS.init was previously called. If you want to initialize later with custom parameters, remove any earlier calls (note that one is automatically added to the generated code)");B.Ga.hb=i;B.jc();p.stdin=a||p.stdin;p.stdout=b||p.stdout;p.stderr=
c||p.stderr;B.od()},Qd:function(){B.Ga.hb=m;for(var a=0;a<B.oa.length;a++){var b=B.oa[a];b&&B.close(b)}},fb:function(a,b){var c=0;a&&(c|=365);b&&(c|=146);return c},Ag:function(a,b){var c=fb.apply(k,a);b&&"/"==c[0]&&(c=c.substr(1));return c},Sf:function(a,b){return gb(b,a)},Pg:function(a){return db(a)},lg:function(a,b){var c=B.vb(a,b);if(c.Ab)return c.object;V(c.error);return k},vb:function(a,b){try{var c=B.u(a,{R:!b}),a=c.path}catch(e){}var f={jb:m,Ab:m,error:0,name:k,path:k,object:k,Md:m,Od:k,Nd:k};
try{c=B.u(a,{parent:i}),f.Md=i,f.Od=c.path,f.Nd=c.g,f.name=W(a),c=B.u(a,{R:!b}),f.Ab=i,f.path=c.path,f.object=c.g,f.name=c.g.name,f.jb="/"===c.path}catch(h){f.error=h.cb}return f},hd:function(a,b,c,e){a=X("string"===typeof a?a:B.da(a),b);return B.ea(a,B.fb(c,e))},ld:function(a,b){for(var a="string"===typeof a?a:B.da(a),c=b.split("/").reverse();c.length;){var e=c.pop();if(e){var f=X(a,e);try{B.ea(f)}catch(h){}a=f}}return f},gd:function(a,b,c,e,f){a=X("string"===typeof a?a:B.da(a),b);return B.create(a,
B.fb(e,f))},xb:function(a,b,c,e,f,h){a=b?X("string"===typeof a?a:B.da(a),b):a;e=B.fb(e,f);f=B.create(a,e);if(c){if("string"===typeof c){for(var a=Array(c.length),b=0,j=c.length;b<j;++b)a[b]=c.charCodeAt(b);c=a}B.Ya(f,e|146);a=B.open(f,"w");B.write(a,c,0,c.length,0,h);B.close(a);B.Ya(f,e)}return f},X:function(a,b,c,e){a=X("string"===typeof a?a:B.da(a),b);b=B.fb(!!c,!!e);B.X.Ib||(B.X.Ib=64);var f=B.la(B.X.Ib++,0);B.Ob(f,{open:function(a){a.seekable=m},close:function(){e&&(e.buffer&&e.buffer.length)&&
e(10)},M:function(a,b,e,f){for(var q=0,x=0;x<f;x++){var s;try{s=c()}catch(v){d(new B.e(U.ha))}s===g&&0===q&&d(new B.e(U.Ca));if(s===k||s===g)break;q++;b[e+x]=s}q&&(a.g.timestamp=Date.now());return q},write:function(a,b,c,f){for(var q=0;q<f;q++)try{e(b[c+q])}catch(x){d(new B.e(U.ha))}f&&(a.g.timestamp=Date.now());return q}});return B.lb(a,b,f)},kd:function(a,b,c){a=X("string"===typeof a?a:B.da(a),b);return B.ca(c,a)},mc:function(a){if(a.Gb||a.Dd||a.link||a.k)return i;var b=i;"undefined"!==typeof XMLHttpRequest&&
d(Error("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread."));if(p.read)try{a.k=Va(p.read(a.url),i),a.q=a.k.length}catch(c){b=m}else d(Error("Cannot load without read() or XMLHttpRequest."));b||V(U.ha);return b},jd:function(a,b,c,e,f){function h(){this.Hb=m;this.Za=[]}h.prototype.get=function(a){if(!(a>this.length-1||0>a)){var b=a%this.cd;return this.yd(a/
this.cd|0)[b]}};h.prototype.Wd=function(a){this.yd=a};h.prototype.bc=function(){var a=new XMLHttpRequest;a.open("HEAD",c,m);a.send(k);200<=a.status&&300>a.status||304===a.status||d(Error("Couldn't load "+c+". Status: "+a.status));var b=Number(a.getResponseHeader("Content-length")),e,f=1048576;if(!((e=a.getResponseHeader("Accept-Ranges"))&&"bytes"===e))f=b;var h=this;h.Wd(function(a){var e=a*f,j=(a+1)*f-1,j=Math.min(j,b-1);if("undefined"===typeof h.Za[a]){var l=h.Za;e>j&&d(Error("invalid range ("+
e+", "+j+") or no bytes requested!"));j>b-1&&d(Error("only "+b+" bytes available! programmer error!"));var q=new XMLHttpRequest;q.open("GET",c,m);b!==f&&q.setRequestHeader("Range","bytes="+e+"-"+j);"undefined"!=typeof Uint8Array&&(q.responseType="arraybuffer");q.overrideMimeType&&q.overrideMimeType("text/plain; charset=x-user-defined");q.send(k);200<=q.status&&300>q.status||304===q.status||d(Error("Couldn't load "+c+". Status: "+q.status));e=q.response!==g?new Uint8Array(q.response||[]):Va(q.responseText||
"",i);l[a]=e}"undefined"===typeof h.Za[a]&&d(Error("doXHR failed!"));return h.Za[a]});this.Uc=b;this.Tc=f;this.Hb=i};if("undefined"!==typeof XMLHttpRequest){ca||d("Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc");var j=new h;Object.defineProperty(j,"length",{get:function(){this.Hb||this.bc();return this.Uc}});Object.defineProperty(j,"chunkSize",{get:function(){this.Hb||this.bc();return this.Tc}});j={Gb:m,k:j}}else j={Gb:m,url:c};
var l=B.gd(a,b,j,e,f);j.k?l.k=j.k:j.url&&(l.k=k,l.url=j.url);Object.defineProperty(l,"usedBytes",{get:function(){return this.k.length}});var u={};Object.keys(l.p).forEach(function(a){var b=l.p[a];u[a]=function(){B.mc(l)||d(new B.e(U.ha));return b.apply(k,arguments)}});u.M=function(a,b,c,e,f){B.mc(l)||d(new B.e(U.ha));a=a.g.k;if(f>=a.length)return 0;e=Math.min(a.length-f,e);w(0<=e);if(a.slice)for(var h=0;h<e;h++)b[c+h]=a[f+h];else for(h=0;h<e;h++)b[c+h]=a.get(f+h);return e};l.p=u;return l},md:function(a,
b,c,e,f,h,j,l,u){function q(){rb=document.pointerLockElement===v||document.mozPointerLockElement===v||document.webkitPointerLockElement===v||document.msPointerLockElement===v}function x(c){function q(c){l||B.xb(a,b,c,e,f,u);h&&h();Za()}var s=m;p.preloadPlugins.forEach(function(a){!s&&a.canHandle(G)&&(a.handle(c,G,q,function(){j&&j();Za()}),s=i)});s||q(c)}p.preloadPlugins||(p.preloadPlugins=[]);if(!tb){tb=i;try{new Blob,ub=i}catch(s){ub=m,console.log("warning: no blob constructor, cannot create blobs with mimetypes")}vb=
"undefined"!=typeof MozBlobBuilder?MozBlobBuilder:"undefined"!=typeof WebKitBlobBuilder?WebKitBlobBuilder:!ub?console.log("warning: no BlobBuilder"):k;wb="undefined"!=typeof window?window.URL?window.URL:window.webkitURL:g;!p.xc&&"undefined"===typeof wb&&(console.log("warning: Browser does not support creating object URLs. Built-in browser image decoding will not be available."),p.xc=i);p.preloadPlugins.push({canHandle:function(a){return!p.xc&&/\.(jpg|jpeg|png|bmp)$/i.test(a)},handle:function(a,b,
c,e){var f=k;if(ub)try{f=new Blob([a],{type:xb(b)}),f.size!==a.length&&(f=new Blob([(new Uint8Array(a)).buffer],{type:xb(b)}))}catch(h){z.Aa("Blob constructor present but fails: "+h+"; falling back to blob builder")}f||(f=new vb,f.append((new Uint8Array(a)).buffer),f=f.getBlob());var j=wb.createObjectURL(f),l=new Image;l.onload=function(){w(l.complete,"Image "+b+" could not be decoded");var e=document.createElement("canvas");e.width=l.width;e.height=l.height;e.getContext("2d").drawImage(l,0,0);p.preloadedImages[b]=
e;wb.revokeObjectURL(j);c&&c(a)};l.onerror=function(){console.log("Image "+j+" could not be decoded");e&&e()};l.src=j}});p.preloadPlugins.push({canHandle:function(a){return!p.Jg&&a.substr(-4)in{".ogg":1,".wav":1,".mp3":1}},handle:function(a,b,c,e){function f(e){j||(j=i,p.preloadedAudios[b]=e,c&&c(a))}function h(){j||(j=i,p.preloadedAudios[b]=new Audio,e&&e())}var j=m;if(ub){try{var l=new Blob([a],{type:xb(b)})}catch(q){return h()}var l=wb.createObjectURL(l),s=new Audio;s.addEventListener("canplaythrough",
function(){f(s)},m);s.onerror=function(){if(!j){console.log("warning: browser could not fully decode audio "+b+", trying slower base64 approach");for(var c="",e=0,h=0,l=0;l<a.length;l++){e=e<<8|a[l];for(h+=8;6<=h;)var q=e>>h-6&63,h=h-6,c=c+"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"[q]}2==h?(c+="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"[(e&3)<<4],c+="=="):4==h&&(c+="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"[(e&15)<<2],c+="=");
s.src="data:audio/x-"+b.substr(-3)+";base64,"+c;f(s)}};s.src=l;p.noExitRuntime=i;setTimeout(function(){H||f(s)},1E4)}else return h()}});var v=p.canvas;v&&(v.Pb=v.requestPointerLock||v.mozRequestPointerLock||v.webkitRequestPointerLock||v.msRequestPointerLock||n(),v.kc=document.exitPointerLock||document.mozExitPointerLock||document.webkitExitPointerLock||document.msExitPointerLock||n(),v.kc=v.kc.bind(document),document.addEventListener("pointerlockchange",q,m),document.addEventListener("mozpointerlockchange",
q,m),document.addEventListener("webkitpointerlockchange",q,m),document.addEventListener("mspointerlockchange",q,m),p.elementPointerLock&&v.addEventListener("click",function(a){!rb&&v.Pb&&(v.Pb(),a.preventDefault())},m))}var G=b?gb(X(a,b)):a;Ya();"string"==typeof c?yb(c,function(a){x(a)},j):x(c)},indexedDB:function(){return window.indexedDB||window.mozIndexedDB||window.webkitIndexedDB||window.msIndexedDB},Ub:function(){return"EM_FS_"+window.location.pathname},Vb:20,Ba:"FILE_DATA",Og:function(a,b,c){var b=
b||n(),c=c||n(),e=B.indexedDB();try{var f=e.open(B.Ub(),B.Vb)}catch(h){return c(h)}f.Ld=function(){console.log("creating db");f.result.createObjectStore(B.Ba)};f.onsuccess=function(){var e=f.result.transaction([B.Ba],"readwrite"),h=e.objectStore(B.Ba),u=0,q=0,x=a.length;a.forEach(function(a){a=h.put(B.vb(a).object.k,a);a.onsuccess=function(){u++;u+q==x&&(0==q?b():c())};a.onerror=function(){q++;u+q==x&&(0==q?b():c())}});e.onerror=c};f.onerror=c},Dg:function(a,b,c){var b=b||n(),c=c||n(),e=B.indexedDB();
try{var f=e.open(B.Ub(),B.Vb)}catch(h){return c(h)}f.Ld=c;f.onsuccess=function(){var e=f.result;try{var h=e.transaction([B.Ba],"readonly")}catch(u){c(u);return}var q=h.objectStore(B.Ba),x=0,s=0,v=a.length;a.forEach(function(a){var e=q.get(a);e.onsuccess=function(){B.vb(a).Ab&&B.za(a);B.xb(eb(a),W(a),e.result,i,i,i);x++;x+s==v&&(0==s?b():c())};e.onerror=function(){s++;x+s==v&&(0==s?b():c())}});h.onerror=c};f.onerror=c}};function zb(){d("TODO")}
var Z={F:function(){p.websocket=p.websocket&&"object"===typeof p.websocket?p.websocket:{};p.websocket.tb={};p.websocket.on=function(a,b){"function"===typeof b&&(this.tb[a]=b);return this};p.websocket.P=function(a,b){"function"===typeof this.tb[a]&&this.tb[a].call(this,b)};return B.createNode(k,"/",16895,0)},nd:function(a,b,c){c&&w(1==b==(6==c));a={qd:a,type:b,protocol:c,G:k,error:k,Ma:{},Kb:[],ua:[],wa:Z.L};b=Z.mb();c=B.createNode(Z.root,b,49152,0);c.va=a;b=B.fc({path:b,g:c,D:B.wc("r+"),seekable:m,
p:Z.p});a.A=b;return a},wd:function(a){a=B.qa(a);return!a||!B.Ed(a.g.mode)?k:a.g.va},p:{zc:function(a){a=a.g.va;return a.wa.zc(a)},Ha:function(a,b,c){a=a.g.va;return a.wa.Ha(a,b,c)},M:function(a,b,c,e){a=a.g.va;e=a.wa.Rd(a,e);if(!e)return 0;b.set(e.buffer,c);return e.buffer.length},write:function(a,b,c,e){a=a.g.va;return a.wa.Vd(a,b,c,e)},close:function(a){a=a.g.va;a.wa.close(a)}},mb:function(){Z.mb.gc||(Z.mb.gc=0);return"socket["+Z.mb.gc++ +"]"},L:{$a:function(a,b,c){var e;"object"===typeof b&&(e=
b,c=b=k);if(e)e._socket?(b=e._socket.remoteAddress,c=e._socket.remotePort):((c=/ws[s]?:\/\/([^:]+):(\d+)/.exec(e.url))||d(Error("WebSocket URL must be in the format ws(s)://address:port")),b=c[1],c=parseInt(c[2],10));else try{var f=p.websocket&&"object"===typeof p.websocket,h="ws:#".replace("#","//");f&&"string"===typeof p.websocket.url&&(h=p.websocket.url);if("ws://"===h||"wss://"===h)var j=b.split("/"),h=h+j[0]+":"+c+"/"+j.slice(1).join("/");j="binary";f&&"string"===typeof p.websocket.subprotocol&&
(j=p.websocket.subprotocol);var j=j.replace(/^ +| +$/g,"").split(/ *, */),l=t?{protocol:j.toString()}:j;e=new (t?(null)("ws"):window.WebSocket)(h,l);e.binaryType="arraybuffer"}catch(u){d(new B.e(U.Yb))}b={W:b,port:c,o:e,ab:[]};Z.L.$b(a,b);Z.L.zd(a,b);2===a.type&&"undefined"!==typeof a.ya&&b.ab.push(new Uint8Array([255,255,255,255,112,111,114,116,(a.ya&65280)>>8,a.ya&255]));return b},gb:function(a,b,c){return a.Ma[b+":"+c]},$b:function(a,b){a.Ma[b.W+":"+b.port]=b},Bc:function(a,b){delete a.Ma[b.W+
":"+b.port]},zd:function(a,b){function c(){p.websocket.P("open",a.A.C);try{for(var c=b.ab.shift();c;)b.o.send(c),c=b.ab.shift()}catch(e){b.o.close()}}function e(c){w("string"!==typeof c&&c.byteLength!==g);var c=new Uint8Array(c),e=f;f=m;e&&10===c.length&&255===c[0]&&255===c[1]&&255===c[2]&&255===c[3]&&112===c[4]&&111===c[5]&&114===c[6]&&116===c[7]?(c=c[8]<<8|c[9],Z.L.Bc(a,b),b.port=c,Z.L.$b(a,b)):(a.ua.push({W:b.W,port:b.port,data:c}),p.websocket.P("message",a.A.C))}var f=i;t?(b.o.on("open",c),b.o.on("message",
function(a,b){b.binary&&e((new Uint8Array(a)).buffer)}),b.o.on("close",function(){p.websocket.P("close",a.A.C)}),b.o.on("error",function(){a.error=U.Wb;p.websocket.P("error",[a.A.C,a.error,"ECONNREFUSED: Connection refused"])})):(b.o.onopen=c,b.o.onclose=function(){p.websocket.P("close",a.A.C)},b.o.onmessage=function(a){e(a.data)},b.o.onerror=function(){a.error=U.Wb;p.websocket.P("error",[a.A.C,a.error,"ECONNREFUSED: Connection refused"])})},zc:function(a){if(1===a.type&&a.G)return a.Kb.length?65:
0;var b=0,c=1===a.type?Z.L.gb(a,a.Y,a.Z):k;if(a.ua.length||!c||c&&c.o.readyState===c.o.Pa||c&&c.o.readyState===c.o.CLOSED)b|=65;if(!c||c&&c.o.readyState===c.o.OPEN)b|=4;if(c&&c.o.readyState===c.o.Pa||c&&c.o.readyState===c.o.CLOSED)b|=16;return b},Ha:function(a,b,c){switch(b){case 21531:return b=0,a.ua.length&&(b=a.ua[0].data.length),K[c>>2]=b,0;default:return U.B}},close:function(a){if(a.G){try{a.G.close()}catch(b){}a.G=k}for(var c=Object.keys(a.Ma),e=0;e<c.length;e++){var f=a.Ma[c[e]];try{f.o.close()}catch(h){}Z.L.Bc(a,
f)}return 0},bind:function(a,b,c){("undefined"!==typeof a.Qb||"undefined"!==typeof a.ya)&&d(new B.e(U.B));a.Qb=b;a.ya=c||zb();if(2===a.type){a.G&&(a.G.close(),a.G=k);try{a.wa.Fd(a,0)}catch(e){e instanceof B.e||d(e),e.cb!==U.Ta&&d(e)}}},cg:function(a,b,c){a.G&&d(new B.e(U.Ta));if("undefined"!==typeof a.Y&&"undefined"!==typeof a.Z){var e=Z.L.gb(a,a.Y,a.Z);e&&(e.o.readyState===e.o.CONNECTING&&d(new B.e(U.Hc)),d(new B.e(U.Kc)))}b=Z.L.$a(a,b,c);a.Y=b.W;a.Z=b.port;d(new B.e(U.Jc))},Fd:function(a){t||d(new B.e(U.Ta));
a.G&&d(new B.e(U.B));var b=(null)("ws").Server;a.G=new b({host:a.Qb,port:a.ya});p.websocket.P("listen",a.A.C);a.G.on("connection",function(b){if(1===a.type){var e=Z.nd(a.qd,a.type,a.protocol),b=Z.L.$a(e,b);e.Y=b.W;e.Z=b.port;a.Kb.push(e);p.websocket.P("connection",e.A.C)}else Z.L.$a(a,b),p.websocket.P("connection",a.A.C)});a.G.on("closed",function(){p.websocket.P("close",a.A.C);a.G=k});a.G.on("error",function(){a.error=U.Yb;p.websocket.P("error",[a.A.C,a.error,"EHOSTUNREACH: Host is unreachable"])})},
accept:function(a){a.G||d(new B.e(U.B));var b=a.Kb.shift();b.A.D=a.A.D;return b},tg:function(a,b){var c,e;b?((a.Y===g||a.Z===g)&&d(new B.e(U.Ra)),c=a.Y,e=a.Z):(c=a.Qb||0,e=a.ya||0);return{W:c,port:e}},Vd:function(a,b,c,e,f,h){if(2===a.type){if(f===g||h===g)f=a.Y,h=a.Z;(f===g||h===g)&&d(new B.e(U.Ic))}else f=a.Y,h=a.Z;var j=Z.L.gb(a,f,h);1===a.type&&((!j||j.o.readyState===j.o.Pa||j.o.readyState===j.o.CLOSED)&&d(new B.e(U.Ra)),j.o.readyState===j.o.CONNECTING&&d(new B.e(U.Ca)));b=b instanceof Array||
b instanceof ArrayBuffer?b.slice(c,c+e):b.buffer.slice(b.byteOffset+c,b.byteOffset+c+e);if(2===a.type&&(!j||j.o.readyState!==j.o.OPEN)){if(!j||j.o.readyState===j.o.Pa||j.o.readyState===j.o.CLOSED)j=Z.L.$a(a,f,h);j.ab.push(b);return e}try{return j.o.send(b),e}catch(l){d(new B.e(U.B))}},Rd:function(a,b){1===a.type&&a.G&&d(new B.e(U.Ra));var c=a.ua.shift();if(!c){if(1===a.type){var e=Z.L.gb(a,a.Y,a.Z);if(e){if(e.o.readyState===e.o.Pa||e.o.readyState===e.o.CLOSED)return k;d(new B.e(U.Ca))}d(new B.e(U.Ra))}d(new B.e(U.Ca))}var e=
c.data.byteLength||c.data.length,f=c.data.byteOffset||0,h=c.data.buffer||c.data,j=Math.min(b,e),l={buffer:new Uint8Array(h,f,j),W:c.W,port:c.port};1===a.type&&j<e&&(c.data=new Uint8Array(h,f+j,e-j),a.ua.unshift(c));return l}}};function Ab(a,b,c){a=B.qa(a);if(!a)return V(U.V),-1;try{return B.write(a,I,b,c)}catch(e){return B.sc(e),-1}}p._strlen=Bb;function Cb(a){a=B.pc(a);return!a?-1:a.C}function Db(a,b){return Ab(Cb(b),a,Bb(a))}
function Eb(a,b){var c;c=a&255;c=0<=c?c:Math.pow(2,g)+c;I[Eb.Cc>>0]=c;if(-1==Ab(Cb(b),Eb.Cc,1)){if(c=B.pc(b))c.error=i;return-1}return c}function Fb(a){Fb.$c||(E=E+4095&-4096,Fb.$c=i,w(z.bb),Fb.Wc=z.bb,z.bb=function(){A("cannot dynamically allocate, sbrk now has control")});var b=E;0!=a&&Fb.Wc(a);return b}p._memset=Gb;function Hb(a,b,c){window._broadwayOnPictureDecoded(a,b,c)}p._broadwayOnPictureDecoded=Hb;function Ib(){window._broadwayOnHeadersDecoded()}p._broadwayOnHeadersDecoded=Ib;
function Jb(a,b){Kb=a;Lb=b;if(!Mb)return 1;0==a?(Nb=function(){setTimeout(Ob,b)},Pb="timeout"):1==a&&(Nb=function(){Qb(Ob)},Pb="rAF");return 0}
function Rb(a,b,c,e){p.noExitRuntime=i;w(!Mb,"emscripten_set_main_loop: there can only be one main loop function at once: call emscripten_cancel_main_loop to cancel the previous one before setting a new one with different parameters.");Mb=a;Sb=e;var f=Tb;Ob=function(){if(!H)if(0<Ub.length){var b=Date.now(),c=Ub.shift();c.ja(c.Xa);if(Vb){var l=Vb,u=0==l%1?l-1:Math.floor(l);Vb=c.dg?u:(8*l+(u+0.5))/9}console.log('main loop blocker "'+c.name+'" took '+(Date.now()-b)+" ms");p.setStatus&&(b=p.statusMessage||
"Please wait...",c=Vb,l=Wb.ig,c?c<l?p.setStatus(b+" ("+(l-c)+"/"+l+")"):p.setStatus(b):p.setStatus(""));setTimeout(Ob,0)}else if(!(f<Tb))if(Xb=Xb+1|0,1==Kb&&1<Lb&&0!=Xb%Lb)Nb();else{"timeout"===Pb&&p.fg&&(p.fa("Looks like you are rendering without using requestAnimationFrame for the main loop. You should use 0 for the frame rate in emscripten_set_main_loop in order to use requestAnimationFrame, as that can greatly improve your frame rates!"),Pb="");a:if(!H&&!(p.preMainLoop&&p.preMainLoop()===m)){try{"undefined"!==
typeof e?z.Fa("vi",a,[e]):z.Fa("v",a)}catch(q){if(q instanceof ia)break a;q&&("object"===typeof q&&q.stack)&&p.fa("exception thrown: "+[q,q.stack]);d(q)}p.postMainLoop&&p.postMainLoop()}f<Tb||("object"===typeof SDL&&(SDL.ac&&SDL.ac.Pd)&&SDL.ac.Pd(),Nb())}};b&&0<b?Jb(0,1E3/b):Jb(1,1);Nb();c&&d("SimulateInfiniteLoop")}var Nb=k,Pb="",Tb=0,Mb=k,Sb=0,Kb=0,Lb=0,Xb=0,Ub=[],Wb={},Ob,Vb,Yb=m,rb=m,Zb=m,$b=g,ac=g,bc=0;
function cc(a){var b=Date.now();if(0===bc)bc=b+1E3/60;else for(;b+2>=bc;)bc+=1E3/60;b=Math.max(bc-b,0);setTimeout(a,b)}function Qb(a){"undefined"===typeof window?cc(a):(window.requestAnimationFrame||(window.requestAnimationFrame=window.requestAnimationFrame||window.mozRequestAnimationFrame||window.webkitRequestAnimationFrame||window.msRequestAnimationFrame||window.oRequestAnimationFrame||cc),window.requestAnimationFrame(a))}
function xb(a){return{jpg:"image/jpeg",jpeg:"image/jpeg",png:"image/png",bmp:"image/bmp",ogg:"audio/ogg",wav:"audio/wav",mp3:"audio/mpeg"}[a.substr(a.lastIndexOf(".")+1)]}
function yb(a,b,c){function e(){c?c():d('Loading data file "'+a+'" failed.')}var f=new XMLHttpRequest;f.open("GET",a,i);f.responseType="arraybuffer";f.onload=function(){if(200==f.status||0==f.status&&f.response){var c=f.response;w(c,'Loading data file "'+a+'" failed (no arrayBuffer).');b(new Uint8Array(c));Za()}else e()};f.onerror=e;f.send(k);Ya()}var dc=[];function ec(){var a=p.canvas;dc.forEach(function(b){b(a.width,a.height)})}
function fc(a,b,c){b&&c?(a.ae=b,a.Ad=c):(b=a.ae,c=a.Ad);var e=b,f=c;p.forcedAspectRatio&&0<p.forcedAspectRatio&&(e/f<p.forcedAspectRatio?e=Math.round(f*p.forcedAspectRatio):f=Math.round(e/p.forcedAspectRatio));if((document.webkitFullScreenElement||document.webkitFullscreenElement||document.mozFullScreenElement||document.mozFullscreenElement||document.fullScreenElement||document.fullscreenElement||document.msFullScreenElement||document.msFullscreenElement||document.webkitCurrentFullScreenElement)===
a.parentNode&&"undefined"!=typeof screen)var h=Math.min(screen.width/e,screen.height/f),e=Math.round(e*h),f=Math.round(f*h);ac?(a.width!=e&&(a.width=e),a.height!=f&&(a.height=f),"undefined"!=typeof a.style&&(a.style.removeProperty("width"),a.style.removeProperty("height"))):(a.width!=b&&(a.width=b),a.height!=c&&(a.height=c),"undefined"!=typeof a.style&&(e!=b||f!=c?(a.style.setProperty("width",e+"px","important"),a.style.setProperty("height",f+"px","important")):(a.style.removeProperty("width"),a.style.removeProperty("height"))))}
var tb,ub,vb,wb;p._memcpy=gc;B.Zd();R.unshift({ja:function(){!p.noFSInit&&!B.Ga.hb&&B.Ga()}});Pa.push({ja:function(){B.vc=m}});Qa.push({ja:function(){B.Qd()}});p.FS_createFolder=B.hd;p.FS_createPath=B.ld;p.FS_createDataFile=B.xb;p.FS_createPreloadedFile=B.md;p.FS_createLazyFile=B.jd;p.FS_createLink=B.kd;p.FS_createDevice=B.X;bb=z.Ec(4);K[bb>>2]=0;R.unshift({ja:n()});Qa.push({ja:n()});var lb=new z.Da;t&&((null)("fs"),process.platform.match(/^win/));R.push({ja:function(){Z.root=B.F(Z,{},k)}});
Eb.Cc=M([0],"i8",L);
p.requestFullScreen=function(a,b){function c(){Yb=m;var a=e.parentNode;(document.webkitFullScreenElement||document.webkitFullscreenElement||document.mozFullScreenElement||document.mozFullscreenElement||document.fullScreenElement||document.fullscreenElement||document.msFullScreenElement||document.msFullscreenElement||document.webkitCurrentFullScreenElement)===a?(e.cc=document.cancelFullScreen||document.mozCancelFullScreen||document.webkitCancelFullScreen||document.msExitFullscreen||document.exitFullscreen||
n(),e.cc=e.cc.bind(document),$b&&e.Pb(),Yb=i,ac&&("undefined"!=typeof SDL&&(a=Ha[SDL.screen+0*z.ia>>2],K[SDL.screen+0*z.ia>>2]=a|8388608),ec())):(a.parentNode.insertBefore(e,a),a.parentNode.removeChild(a),ac&&("undefined"!=typeof SDL&&(a=Ha[SDL.screen+0*z.ia>>2],K[SDL.screen+0*z.ia>>2]=a&-8388609),ec()));if(p.onFullScreen)p.onFullScreen(Yb);fc(e)}$b=a;ac=b;"undefined"===typeof $b&&($b=i);"undefined"===typeof ac&&(ac=m);var e=p.canvas;Zb||(Zb=i,document.addEventListener("fullscreenchange",c,m),document.addEventListener("mozfullscreenchange",
c,m),document.addEventListener("webkitfullscreenchange",c,m),document.addEventListener("MSFullscreenChange",c,m));var f=document.createElement("div");e.parentNode.insertBefore(f,e);f.appendChild(e);f.Td=f.requestFullScreen||f.mozRequestFullScreen||f.msRequestFullscreen||(f.webkitRequestFullScreen?function(){f.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT)}:k);f.Td()};p.requestAnimationFrame=function(a){Qb(a)};p.setCanvasSize=function(a,b,c){fc(p.canvas,a,b);c||ec()};
p.pauseMainLoop=function(){Nb=k;Tb++};p.resumeMainLoop=function(){Tb++;var a=Kb,b=Lb,c=Mb;Mb=k;Rb(c,0,m,Sb);Jb(a,b)};p.getUserMedia=function(){window.qc||(window.qc=navigator.getUserMedia||navigator.mozGetUserMedia);window.qc(g)};Ja=y=z.ub(D);Ka=Ja+Ma;La=E=z.ub(Ka);w(La<F,"TOTAL_MEMORY not big enough for stack");p.Xc={Math:Math,Int8Array:Int8Array,Int16Array:Int16Array,Int32Array:Int32Array,Uint8Array:Uint8Array,Uint16Array:Uint16Array,Uint32Array:Uint32Array,Float32Array:Float32Array,Float64Array:Float64Array};
p.Yc={abort:A,assert:w,min:va,invoke_viiiii:function(a,b,c,e,f,h){try{p.dynCall_viiiii(a,b,c,e,f,h)}catch(j){"number"!==typeof j&&"longjmp"!==j&&d(j),$.setThrew(1,0)}},_broadwayOnPictureDecoded:Hb,_puts:function(a){var b=K[pb>>2],a=Db(a,b);return 0>a?a:0>Eb(10,b)?-1:a+1},_fflush:n(),_fputc:Eb,_send:function(a,b,c){return!Z.wd(a)?(V(U.V),-1):Ab(a,b,c)},_pwrite:function(a,b,c,e){a=B.qa(a);if(!a)return V(U.V),-1;try{return B.write(a,I,b,c,e)}catch(f){return B.sc(f),-1}},_fputs:Db,_emscripten_set_main_loop:Rb,
_abort:function(){p.abort()},___setErrNo:V,_sbrk:Fb,_mkport:zb,_emscripten_set_main_loop_timing:Jb,_emscripten_memcpy_big:function(a,b,c){N.set(N.subarray(b,b+c),a);return a},_fileno:Cb,_broadwayOnHeadersDecoded:Ib,_write:Ab,_time:function(a){var b=Date.now()/1E3|0;a&&(K[a>>2]=b);return b},_sysconf:function(a){switch(a){case 30:return 4096;case 132:case 133:case 12:case 137:case 138:case 15:case 235:case 16:case 17:case 18:case 19:case 20:case 149:case 13:case 10:case 236:case 153:case 9:case 21:case 22:case 159:case 154:case 14:case 77:case 78:case 139:case 80:case 81:case 79:case 82:case 68:case 67:case 164:case 11:case 29:case 47:case 48:case 95:case 52:case 51:case 46:return 200809;
case 27:case 246:case 127:case 128:case 23:case 24:case 160:case 161:case 181:case 182:case 242:case 183:case 184:case 243:case 244:case 245:case 165:case 178:case 179:case 49:case 50:case 168:case 169:case 175:case 170:case 171:case 172:case 97:case 76:case 32:case 173:case 35:return-1;case 176:case 177:case 7:case 155:case 8:case 157:case 125:case 126:case 92:case 93:case 129:case 130:case 131:case 94:case 91:return 1;case 74:case 60:case 69:case 70:case 4:return 1024;case 31:case 42:case 72:return 32;
case 87:case 26:case 33:return 2147483647;case 34:case 1:return 47839;case 38:case 36:return 99;case 43:case 37:return 2048;case 0:return 2097152;case 3:return 65536;case 28:return 32768;case 44:return 32767;case 75:return 16384;case 39:return 1E3;case 89:return 700;case 71:return 256;case 40:return 255;case 2:return 100;case 180:return 64;case 25:return 20;case 5:return 16;case 6:return 6;case 73:return 4;case 84:return"object"===typeof navigator?navigator.hardwareConcurrency||1:1}V(U.B);return-1},
___errno_location:function(){return bb},STACKTOP:y,STACK_MAX:Ka,tempDoublePtr:$a,ABORT:H,NaN:NaN,Infinity:Infinity};// EMSCRIPTEN_START_ASM
var $=(function(global,env,buffer) {
"use asm";var a=new global.Int8Array(buffer);var b=new global.Int16Array(buffer);var c=new global.Int32Array(buffer);var d=new global.Uint8Array(buffer);var e=new global.Uint16Array(buffer);var f=new global.Uint32Array(buffer);var g=new global.Float32Array(buffer);var h=new global.Float64Array(buffer);var i=env.STACKTOP|0;var j=env.STACK_MAX|0;var k=env.tempDoublePtr|0;var l=env.ABORT|0;var m=0;var n=0;var o=0;var p=0;var q=+env.NaN,r=+env.Infinity;var s=0,t=0,u=0,v=0,w=0.0,x=0,y=0,z=0,A=0.0;var B=0;var C=0;var D=0;var E=0;var F=0;var G=0;var H=0;var I=0;var J=0;var K=0;var L=global.Math.floor;var M=global.Math.abs;var N=global.Math.sqrt;var O=global.Math.pow;var P=global.Math.cos;var Q=global.Math.sin;var R=global.Math.tan;var S=global.Math.acos;var T=global.Math.asin;var U=global.Math.atan;var V=global.Math.atan2;var W=global.Math.exp;var X=global.Math.log;var Y=global.Math.ceil;var Z=global.Math.imul;var _=env.abort;var $=env.assert;var aa=env.min;var ba=env.invoke_viiiii;var ca=env._broadwayOnPictureDecoded;var da=env._puts;var ea=env._fflush;var fa=env._fputc;var ga=env._send;var ha=env._pwrite;var ia=env._fputs;var ja=env._emscripten_set_main_loop;var ka=env._abort;var la=env.___setErrNo;var ma=env._sbrk;var na=env._mkport;var oa=env._emscripten_set_main_loop_timing;var pa=env._emscripten_memcpy_big;var qa=env._fileno;var ra=env._broadwayOnHeadersDecoded;var sa=env._write;var ta=env._time;var ua=env._sysconf;var va=env.___errno_location;var wa=0.0;
// EMSCRIPTEN_START_FUNCS
function Sb(a,f,g,h,j,k){a=a|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0;X=i;i=i+32|0;W=X;p=c[j+4>>2]|0;V=(h>>>0)/(p>>>0)|0;U=V<<4;V=h-(Z(V,p)|0)<<4;c[W+4>>2]=p;c[W+8>>2]=c[j+8>>2];p=c[a>>2]|0;do if((p|0)==1|(p|0)==0){A=c[f+144>>2]|0;l=a+4|0;n=c[a+200>>2]|0;if((n|0)!=0?(c[n+4>>2]|0)==(c[l>>2]|0):0)if((c[n>>2]|0)>>>0<6){o=n+152|0;o=e[o>>1]|e[o+2>>1]<<16;m=1;v=o&65535;o=o>>>16&65535;s=c[n+104>>2]|0}else{m=1;v=0;o=0;s=-1}else{m=0;v=0;o=0;s=-1}n=c[a+204>>2]|0;if((n|0)!=0?(c[n+4>>2]|0)==(c[l>>2]|0):0)if((c[n>>2]|0)>>>0<6){w=n+172|0;w=e[w>>1]|e[w+2>>1]<<16;u=w&65535;q=1;r=c[n+108>>2]|0;w=w>>>16&65535}else{u=0;q=1;r=-1;w=0}else{u=0;q=0;r=-1;w=0}do if(!p)if(!((m|0)==0|(q|0)==0)){if((s|0)==0?((o&65535)<<16|v&65535|0)==0:0){n=0;o=0;break}if((r|0)==0?((w&65535)<<16|u&65535|0)==0:0){n=0;o=0}else T=16}else{n=0;o=0}else T=16;while(0);if((T|0)==16){y=b[f+160>>1]|0;z=b[f+162>>1]|0;n=c[a+208>>2]|0;if((n|0)!=0?(c[n+4>>2]|0)==(c[l>>2]|0):0)if((c[n>>2]|0)>>>0<6){t=n+172|0;p=c[n+108>>2]|0;t=e[t>>1]|e[t+2>>1]<<16;T=25}else{p=-1;t=0;T=25}else T=20;do if((T|0)==20){p=c[a+212>>2]|0;if((p|0)!=0?(c[p+4>>2]|0)==(c[l>>2]|0):0){if((c[p>>2]|0)>>>0>=6){p=-1;t=0;T=25;break}t=p+192|0;p=c[p+112>>2]|0;t=e[t>>1]|e[t+2>>1]<<16;T=25;break}if((m|0)==0|(q|0)!=0){p=-1;t=0;T=25}else n=v}while(0);do if((T|0)==25){m=(s|0)==(A|0);n=(r|0)==(A|0);if(((n&1)+(m&1)+((p|0)==(A|0)&1)|0)==1){if(m|n){n=m?v:u;o=m?o:w;break}n=t&65535;o=t>>>16&65535;break}n=v<<16>>16;l=u<<16>>16;p=t<<16>>16;if(u<<16>>16>v<<16>>16)m=l;else{m=n;n=(l|0)<(n|0)?l:n}if((m|0)<(p|0))p=m;else p=(n|0)>(p|0)?n:p;n=o<<16>>16;m=w<<16>>16;l=t>>16;if(w<<16>>16>o<<16>>16)o=m;else{o=n;n=(m|0)<(n|0)?m:n}if((o|0)>=(l|0))o=(n|0)>(l|0)?n:l;n=p&65535;o=o&65535}while(0);n=(n&65535)+(y&65535)|0;o=(o&65535)+(z&65535)|0;if(((n<<16>>16)+8192|0)>>>0>16383){G=1;i=X;return G|0}if(((o<<16>>16)+2048|0)>>>0>4095){G=1;i=X;return G|0}else{n=n&65535;o=o&65535}}l=ic(g,A)|0;if(!l){G=1;i=X;return G|0}else{G=a+132|0;E=a+136|0;D=a+140|0;C=a+144|0;B=a+148|0;z=a+152|0;y=a+156|0;x=a+160|0;w=a+164|0;v=a+168|0;m=a+172|0;p=a+176|0;q=a+180|0;r=a+184|0;s=a+188|0;F=a+192|0;b[a+192>>1]=n;b[a+194>>1]=o;F=e[F>>1]|e[F+2>>1]<<16;b[s>>1]=F;b[s+2>>1]=F>>>16;b[r>>1]=F;b[r+2>>1]=F>>>16;b[q>>1]=F;b[q+2>>1]=F>>>16;b[p>>1]=F;b[p+2>>1]=F>>>16;b[m>>1]=F;b[m+2>>1]=F>>>16;b[v>>1]=F;b[v+2>>1]=F>>>16;b[w>>1]=F;b[w+2>>1]=F>>>16;b[x>>1]=F;b[x+2>>1]=F>>>16;b[y>>1]=F;b[y+2>>1]=F>>>16;b[z>>1]=F;b[z+2>>1]=F>>>16;b[B>>1]=F;b[B+2>>1]=F>>>16;b[C>>1]=F;b[C+2>>1]=F>>>16;b[D>>1]=F;b[D+2>>1]=F>>>16;b[E>>1]=F;b[E+2>>1]=F>>>16;b[G>>1]=F;b[G+2>>1]=F>>>16;c[a+100>>2]=A;c[a+104>>2]=A;c[a+108>>2]=A;c[a+112>>2]=A;c[a+116>>2]=l;c[a+120>>2]=l;c[a+124>>2]=l;c[a+128>>2]=l;c[W>>2]=l;dc(k,a+132|0,W,V,U,0,0,16,16);break}}else if((p|0)==3){x=b[f+160>>1]|0;y=b[f+162>>1]|0;C=c[f+144>>2]|0;u=a+4|0;o=c[a+200>>2]|0;if((o|0)!=0?(c[o+4>>2]|0)==(c[u>>2]|0):0)if((c[o>>2]|0)>>>0<6){w=o+152|0;w=e[w>>1]|e[w+2>>1]<<16;n=1;s=w&65535;w=w>>>16&65535;o=c[o+104>>2]|0}else{n=1;s=0;w=0;o=-1}else{n=0;s=0;w=0;o=-1}a:do if((o|0)==(C|0)){n=s;o=w}else{o=c[a+204>>2]|0;if((o|0)!=0?(c[o+4>>2]|0)==(c[u>>2]|0):0)if((c[o>>2]|0)>>>0<6){G=o+172|0;G=e[G>>1]|e[G+2>>1]<<16;t=o+188|0;p=c[o+108>>2]|0;l=c[o+112>>2]|0;n=G&65535;o=G>>>16&65535;t=e[t>>1]|e[t+2>>1]<<16}else{p=-1;l=-1;n=0;o=0;t=0}else T=107;do if((T|0)==107){o=c[a+212>>2]|0;if((o|0)!=0?(c[o+4>>2]|0)==(c[u>>2]|0):0){if((c[o>>2]|0)>>>0>=6){p=-1;l=-1;n=0;o=0;t=0;break}t=o+192|0;p=-1;l=c[o+112>>2]|0;n=0;o=0;t=e[t>>1]|e[t+2>>1]<<16;break}if(!n){p=-1;l=-1;n=0;o=0;t=0}else{n=s;o=w;break a}}while(0);m=(p|0)==(C|0);if(((m&1)+((l|0)==(C|0)&1)|0)==1){if(m)break;n=t&65535;o=t>>>16&65535;break}l=s<<16>>16;p=n<<16>>16;q=t<<16>>16;if(n<<16>>16>s<<16>>16){m=p;n=l}else{m=l;n=(p|0)<(l|0)?p:l}if((m|0)<(q|0))q=m;else q=(n|0)>(q|0)?n:q;n=w<<16>>16;m=o<<16>>16;l=t>>16;if(o<<16>>16>w<<16>>16)o=m;else{o=n;n=(m|0)<(n|0)?m:n}if((o|0)>=(l|0))o=(n|0)>(l|0)?n:l;n=q&65535;o=o&65535}while(0);n=(n&65535)+(x&65535)|0;o=(o&65535)+(y&65535)|0;if(((n<<16>>16)+8192|0)>>>0>16383){G=1;i=X;return G|0}if(((o<<16>>16)+2048|0)>>>0>4095){G=1;i=X;return G|0}m=ic(g,C)|0;if(!m){G=1;i=X;return G|0}x=a+132|0;z=a+136|0;A=a+140|0;y=a+144|0;G=a+164|0;F=a+168|0;E=a+172|0;w=a+176|0;b[a+176>>1]=n;b[a+178>>1]=o;w=e[w>>1]|e[w+2>>1]<<16;b[E>>1]=w;b[E+2>>1]=w>>>16;b[F>>1]=w;b[F+2>>1]=w>>>16;b[G>>1]=w;b[G+2>>1]=w>>>16;b[y>>1]=w;b[y+2>>1]=w>>>16;b[A>>1]=w;b[A+2>>1]=w>>>16;b[z>>1]=w;b[z+2>>1]=w>>>16;b[x>>1]=w;b[x+2>>1]=w>>>16;c[a+100>>2]=C;c[a+108>>2]=C;x=a+116|0;c[x>>2]=m;c[a+124>>2]=m;z=b[f+164>>1]|0;A=b[f+166>>1]|0;y=c[f+148>>2]|0;o=c[a+208>>2]|0;if((o|0)!=0?(c[o+4>>2]|0)==(c[u>>2]|0):0)if((c[o>>2]|0)>>>0<6){r=o+172|0;o=c[o+108>>2]|0;p=1;r=e[r>>1]|e[r+2>>1]<<16}else{o=-1;p=1;r=0}else{o=c[a+204>>2]|0;if((o|0)!=0?(c[o+4>>2]|0)==(c[u>>2]|0):0)if((c[o>>2]|0)>>>0<6){r=o+176|0;o=c[o+108>>2]|0;p=1;r=e[r>>1]|e[r+2>>1]<<16}else{o=-1;p=1;r=0}else{o=-1;p=0;r=0}}do if((o|0)!=(y|0)){s=w&65535;o=w>>>16;v=o&65535;n=c[a+204>>2]|0;if((n|0)!=0?(c[n+4>>2]|0)==(c[u>>2]|0):0)if((c[n>>2]|0)>>>0<6){u=n+188|0;u=e[u>>1]|e[u+2>>1]<<16;p=c[n+112>>2]|0;l=u&65535;u=u>>>16&65535}else{p=-1;l=0;u=0}else if(!p){m=w;break}else{p=-1;l=0;u=0}m=(C|0)==(y|0);n=(p|0)==(y|0);if(((n&1)+(m&1)|0)==1){if(m){m=w;break}if(n){o=u&65535;m=o<<16|l&65535;break}else{m=r;o=r>>>16;break}}o=w<<16>>16;p=l<<16>>16;q=r<<16>>16;if(l<<16>>16>s<<16>>16)m=p;else{m=o;o=(p|0)<(o|0)?p:o}if((m|0)>=(q|0))m=(o|0)>(q|0)?o:q;n=w>>16;l=u<<16>>16;p=r>>16;if(u<<16>>16>v<<16>>16)o=l;else{o=n;n=(l|0)<(n|0)?l:n}if((o|0)>=(p|0))o=(n|0)>(p|0)?n:p}else{m=r;o=r>>>16}while(0);m=(m&65535)+(z&65535)|0;n=(o&65535)+(A&65535)|0;if(((m<<16>>16)+8192|0)>>>0>16383){G=1;i=X;return G|0}if(((n<<16>>16)+2048|0)>>>0>4095){G=1;i=X;return G|0}o=ic(g,y)|0;if(!o){G=1;i=X;return G|0}else{G=a+148|0;E=a+152|0;D=a+156|0;C=a+160|0;B=a+180|0;A=a+184|0;z=a+188|0;F=a+192|0;b[a+192>>1]=m;b[a+194>>1]=n;F=e[F>>1]|e[F+2>>1]<<16;b[z>>1]=F;b[z+2>>1]=F>>>16;b[A>>1]=F;b[A+2>>1]=F>>>16;b[B>>1]=F;b[B+2>>1]=F>>>16;b[C>>1]=F;b[C+2>>1]=F>>>16;b[D>>1]=F;b[D+2>>1]=F>>>16;b[E>>1]=F;b[E+2>>1]=F>>>16;b[G>>1]=F;b[G+2>>1]=F>>>16;c[a+104>>2]=y;c[a+112>>2]=y;F=a+120|0;c[F>>2]=o;c[a+128>>2]=o;c[W>>2]=c[x>>2];dc(k,a+132|0,W,V,U,0,0,8,16);c[W>>2]=c[F>>2];dc(k,G,W,V,U,8,0,8,16);break}}else if((p|0)==2){z=b[f+160>>1]|0;A=b[f+162>>1]|0;C=c[f+144>>2]|0;B=a+4|0;o=c[a+204>>2]|0;if((o|0)!=0?(c[o+4>>2]|0)==(c[B>>2]|0):0)if((c[o>>2]|0)>>>0<6){w=o+172|0;w=e[w>>1]|e[w+2>>1]<<16;m=1;o=c[o+108>>2]|0;r=w&65535;w=w>>>16&65535}else{m=1;o=-1;r=0;w=0}else{m=0;o=-1;r=0;w=0}b:do if((o|0)==(C|0)){n=r;o=w}else{n=c[a+200>>2]|0;if((n|0)!=0?(c[n+4>>2]|0)==(c[B>>2]|0):0)if((c[n>>2]|0)>>>0<6){o=n+152|0;o=e[o>>1]|e[o+2>>1]<<16;q=1;s=o&65535;o=o>>>16&65535;p=c[n+104>>2]|0}else{q=1;s=0;o=0;p=-1}else{q=0;s=0;o=0;p=-1}n=c[a+208>>2]|0;if((n|0)!=0?(c[n+4>>2]|0)==(c[B>>2]|0):0)if((c[n>>2]|0)>>>0<6){t=n+172|0;n=c[n+108>>2]|0;t=e[t>>1]|e[t+2>>1]<<16}else{n=-1;t=0}else T=54;do if((T|0)==54){n=c[a+212>>2]|0;if((n|0)!=0?(c[n+4>>2]|0)==(c[B>>2]|0):0){if((c[n>>2]|0)>>>0>=6){n=-1;t=0;break}t=n+192|0;n=c[n+112>>2]|0;t=e[t>>1]|e[t+2>>1]<<16;break}if((q|0)==0|(m|0)!=0){n=-1;t=0}else{n=s;break b}}while(0);m=(p|0)==(C|0);if((((n|0)==(C|0)&1)+(m&1)|0)==1){if(m){n=m?s:r;o=m?o:w;break}n=t&65535;o=t>>>16&65535;break}n=s<<16>>16;l=r<<16>>16;p=t<<16>>16;if(r<<16>>16>s<<16>>16)m=l;else{m=n;n=(l|0)<(n|0)?l:n}if((m|0)<(p|0))q=m;else q=(n|0)>(p|0)?n:p;n=o<<16>>16;m=w<<16>>16;l=t>>16;if(w<<16>>16>o<<16>>16)o=m;else{o=n;n=(m|0)<(n|0)?m:n}if((o|0)>=(l|0))o=(n|0)>(l|0)?n:l;n=q&65535;o=o&65535}while(0);n=(n&65535)+(z&65535)|0;o=(o&65535)+(A&65535)|0;if(((n<<16>>16)+8192|0)>>>0>16383){G=1;i=X;return G|0}if(((o<<16>>16)+2048|0)>>>0>4095){G=1;i=X;return G|0}m=ic(g,C)|0;if(!m){G=1;i=X;return G|0}A=a+132|0;x=a+136|0;y=a+140|0;z=a+144|0;q=a+148|0;p=a+152|0;G=a+156|0;v=a+160|0;b[a+160>>1]=n;b[a+162>>1]=o;v=e[v>>1]|e[v+2>>1]<<16;b[G>>1]=v;b[G+2>>1]=v>>>16;b[p>>1]=v;b[p+2>>1]=v>>>16;b[q>>1]=v;b[q+2>>1]=v>>>16;b[z>>1]=v;b[z+2>>1]=v>>>16;b[y>>1]=v;b[y+2>>1]=v>>>16;b[x>>1]=v;b[x+2>>1]=v>>>16;b[A>>1]=v;b[A+2>>1]=v>>>16;c[a+100>>2]=C;c[a+104>>2]=C;A=a+116|0;c[A>>2]=m;c[a+120>>2]=m;x=b[f+164>>1]|0;y=b[f+166>>1]|0;z=c[f+148>>2]|0;q=c[a+200>>2]|0;p=(q|0)==0;if((!p?(c[q+4>>2]|0)==(c[B>>2]|0):0)?(c[q>>2]|0)>>>0<6:0){w=q+184|0;w=e[w>>1]|e[w+2>>1]<<16;r=w&65535;w=w>>>16&65535;o=c[q+112>>2]|0}else{r=0;w=0;o=-1}do if((o|0)!=(z|0)){s=v&65535;n=v>>>16;u=n&65535;if((!p?(c[q+4>>2]|0)==(c[B>>2]|0):0)?(c[q>>2]|0)>>>0<6:0){t=q+160|0;p=c[q+104>>2]|0;t=e[t>>1]|e[t+2>>1]<<16}else{p=-1;t=0}o=(C|0)==(z|0);if((((p|0)==(z|0)&1)+(o&1)|0)==1){m=o?v:t;o=o?n:t>>>16;break}o=r<<16>>16;p=v<<16>>16;q=t<<16>>16;if(s<<16>>16>r<<16>>16)m=p;else{m=o;o=(p|0)<(o|0)?p:o}if((m|0)>=(q|0))m=(o|0)>(q|0)?o:q;n=w<<16>>16;l=v>>16;p=t>>16;if(u<<16>>16>w<<16>>16)o=l;else{o=n;n=(l|0)<(n|0)?l:n}if((o|0)>=(p|0))o=(n|0)>(p|0)?n:p}else{o=w&65535;m=o<<16|r&65535}while(0);m=(m&65535)+(x&65535)|0;n=(o&65535)+(y&65535)|0;if(((m<<16>>16)+8192|0)>>>0>16383){G=1;i=X;return G|0}if(((n<<16>>16)+2048|0)>>>0>4095){G=1;i=X;return G|0}o=ic(g,z)|0;if(!o){G=1;i=X;return G|0}else{G=a+164|0;E=a+168|0;D=a+172|0;C=a+176|0;B=a+180|0;y=a+184|0;x=a+188|0;F=a+192|0;b[a+192>>1]=m;b[a+194>>1]=n;F=e[F>>1]|e[F+2>>1]<<16;b[x>>1]=F;b[x+2>>1]=F>>>16;b[y>>1]=F;b[y+2>>1]=F>>>16;b[B>>1]=F;b[B+2>>1]=F>>>16;b[C>>1]=F;b[C+2>>1]=F>>>16;b[D>>1]=F;b[D+2>>1]=F>>>16;b[E>>1]=F;b[E+2>>1]=F>>>16;b[G>>1]=F;b[G+2>>1]=F>>>16;c[a+108>>2]=z;c[a+112>>2]=z;F=a+124|0;c[F>>2]=o;c[a+128>>2]=o;c[W>>2]=c[A>>2];dc(k,a+132|0,W,V,U,0,0,16,8);c[W>>2]=c[F>>2];dc(k,G,W,V,U,0,8,16,8);break}}else{S=a+4|0;H=0;c:while(1){D=f+(H<<2)+176|0;G=eb(c[D>>2]|0)|0;E=f+(H<<2)+192|0;c[a+(H<<2)+100>>2]=c[E>>2];F=ic(g,c[E>>2]|0)|0;c[a+(H<<2)+116>>2]=F;if(!F){l=1;T=212;break}if(G){J=H<<2;K=a+(J<<2)+132|0;O=a+(J<<2)+134|0;P=J|1;L=a+(P<<2)+132|0;P=a+(P<<2)+134|0;Q=J|2;M=a+(Q<<2)+132|0;Q=a+(Q<<2)+134|0;R=J|3;N=a+(R<<2)+132|0;R=a+(R<<2)+134|0;I=0;do{C=b[f+(H<<4)+(I<<2)+208>>1]|0;B=b[f+(H<<4)+(I<<2)+210>>1]|0;F=hb(c[D>>2]|0)|0;n=c[E>>2]|0;s=ub(a,c[6288+(H<<7)+(F<<5)+(I<<3)>>2]|0)|0;r=d[6288+(H<<7)+(F<<5)+(I<<3)+4>>0]|0;if((s|0)!=0?(c[s+4>>2]|0)==(c[S>>2]|0):0)if((c[s>>2]|0)>>>0<6){q=s+(r<<2)+132|0;q=e[q>>1]|e[q+2>>1]<<16;A=c[s+(r>>>2<<2)+100>>2]|0;o=q&65535;z=1;q=q>>>16&65535}else{A=-1;o=0;z=1;q=0}else{A=-1;o=0;z=0;q=0}v=ub(a,c[5776+(H<<7)+(F<<5)+(I<<3)>>2]|0)|0;l=d[5776+(H<<7)+(F<<5)+(I<<3)+4>>0]|0;if((v|0)!=0?(c[v+4>>2]|0)==(c[S>>2]|0):0)if((c[v>>2]|0)>>>0<6){p=v+(l<<2)+132|0;p=e[p>>1]|e[p+2>>1]<<16;y=1;x=c[v+(l>>>2<<2)+100>>2]|0;m=p&65535;p=p>>>16&65535}else{y=1;x=-1;m=0;p=0}else{y=0;x=-1;m=0;p=0}w=ub(a,c[5264+(H<<7)+(F<<5)+(I<<3)>>2]|0)|0;v=d[5264+(H<<7)+(F<<5)+(I<<3)+4>>0]|0;if((w|0)!=0?(c[w+4>>2]|0)==(c[S>>2]|0):0)if((c[w>>2]|0)>>>0<6){z=w+(v<<2)+132|0;z=e[z>>1]|e[z+2>>1]<<16;v=c[w+(v>>>2<<2)+100>>2]|0;T=180}else{z=0;v=-1;T=180}else T=175;do if((T|0)==175){T=0;w=ub(a,c[4752+(H<<7)+(F<<5)+(I<<3)>>2]|0)|0;v=d[4752+(H<<7)+(F<<5)+(I<<3)+4>>0]|0;if((w|0)!=0?(c[w+4>>2]|0)==(c[S>>2]|0):0){if((c[w>>2]|0)>>>0>=6){z=0;v=-1;T=180;break}z=w+(v<<2)+132|0;z=e[z>>1]|e[z+2>>1]<<16;v=c[w+(v>>>2<<2)+100>>2]|0;T=180;break}if((z|0)==0|(y|0)!=0){z=0;v=-1;T=180}else{v=o;t=q}}while(0);do if((T|0)==180){l=(A|0)==(n|0);w=(x|0)==(n|0);if(((w&1)+(l&1)+((v|0)==(n|0)&1)|0)==1){if(l|w){v=l?o:m;t=l?q:p;break}v=z&65535;t=z>>>16&65535;break}u=o<<16>>16;w=m<<16>>16;l=z<<16>>16;if(m<<16>>16>o<<16>>16)v=w;else{v=u;u=(w|0)<(u|0)?w:u}if((v|0)<(l|0))w=v;else w=(u|0)>(l|0)?u:l;t=q<<16>>16;v=p<<16>>16;l=z>>16;if(p<<16>>16>q<<16>>16)s=v;else{s=t;t=(v|0)<(t|0)?v:t}if((s|0)>=(l|0))s=(t|0)>(l|0)?t:l;v=w&65535;t=s&65535}while(0);C=(v&65535)+(C&65535)|0;q=C&65535;s=(t&65535)+(B&65535)|0;r=s&65535;if(((C<<16>>16)+8192|0)>>>0>16383){l=1;T=212;break c}if(((s<<16>>16)+2048|0)>>>0>4095){l=1;T=212;break c}if(!F){b[K>>1]=q;b[O>>1]=r;b[L>>1]=q;b[P>>1]=r;b[M>>1]=q;b[Q>>1]=r;b[N>>1]=q;b[R>>1]=r}else if((F|0)==1){F=(I<<1)+J|0;b[a+(F<<2)+132>>1]=q;b[a+(F<<2)+134>>1]=r;F=F|1;b[a+(F<<2)+132>>1]=q;b[a+(F<<2)+134>>1]=r}else if((F|0)==2){F=I+J|0;b[a+(F<<2)+132>>1]=q;b[a+(F<<2)+134>>1]=r;F=F+2|0;b[a+(F<<2)+132>>1]=q;b[a+(F<<2)+134>>1]=r}else if((F|0)==3){F=I+J|0;b[a+(F<<2)+132>>1]=q;b[a+(F<<2)+134>>1]=r}I=I+1|0}while(I>>>0<G>>>0)}H=H+1|0;if(H>>>0>=4){T=201;break}}if((T|0)==201){o=0;do{c[W>>2]=c[a+(o<<2)+116>>2];m=hb(c[f+(o<<2)+176>>2]|0)|0;l=o<<3&8;n=o>>>0<2?0:8;if(!m)dc(k,a+(o<<2<<2)+132|0,W,V,U,l,n,8,8);else if((m|0)==1){G=o<<2;dc(k,a+(G<<2)+132|0,W,V,U,l,n,8,4);dc(k,a+((G|2)<<2)+132|0,W,V,U,l,n|4,8,4)}else if((m|0)==2){G=o<<2;dc(k,a+(G<<2)+132|0,W,V,U,l,n,4,8);dc(k,a+((G|1)<<2)+132|0,W,V,U,l|4,n,4,8)}else{E=o<<2;dc(k,a+(E<<2)+132|0,W,V,U,l,n,4,4);F=l|4;dc(k,a+((E|1)<<2)+132|0,W,V,U,F,n,4,4);G=n|4;dc(k,a+((E|2)<<2)+132|0,W,V,U,l,G,4,4);dc(k,a+((E|3)<<2)+132|0,W,V,U,F,G,4,4)}o=o+1|0}while((o|0)!=4)}else if((T|0)==212){i=X;return l|0}}while(0);if((c[a+196>>2]|0)>>>0>1){G=0;i=X;return G|0}if(!(c[a>>2]|0)){sc(j,k);G=0;i=X;return G|0}else{tc(j,h,k,f+328|0);G=0;i=X;return G|0}return 0}function Tb(b,c,e,f,g,h,j,k,l){b=b|0;c=c|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0;B=i;i=i+144|0;m=B;if((e|0)>=0?!((e+1+k|0)>>>0>g>>>0|(f|0)<0|(l+f|0)>>>0>h>>>0):0)m=b;else{A=k+1|0;Ub(b,m,e,f,g,h,A,l,A);Ub(b+(Z(h,g)|0)|0,m+(Z(A,l)|0)|0,e,f,g,h,A,l,A);h=l;g=A;e=0;f=0}A=8-j|0;v=l>>>1;z=(v|0)==0;w=k>>>1;y=(w|0)==0;x=16-k|0;u=(g<<1)-k|0;s=g+1|0;t=g+2|0;p=w<<1;r=0;do{l=m+((Z((Z(r,h)|0)+f|0,g)|0)+e)|0;if(!(z|y)){q=c+(r<<6)|0;o=v;while(1){k=q;b=l;n=w;while(1){D=d[b>>0]|0;E=d[b+s>>0]|0;F=b;b=b+2|0;C=d[F+1>>0]|0;a[k+8>>0]=(((Z(E,j)|0)+(Z(d[F+g>>0]|0,A)|0)<<3)+32|0)>>>6;a[k>>0]=(((Z(C,j)|0)+(Z(D,A)|0)<<3)+32|0)>>>6;D=d[b>>0]|0;a[k+9>>0]=(((Z(d[F+t>>0]|0,j)|0)+(Z(E,A)|0)<<3)+32|0)>>>6;a[k+1>>0]=(((Z(D,j)|0)+(Z(C,A)|0)<<3)+32|0)>>>6;n=n+-1|0;if(!n)break;else k=k+2|0}o=o+-1|0;if(!o)break;else{q=q+(p+x)|0;l=l+(p+u)|0}}}r=r+1|0}while((r|0)!=2);i=B;return}function Ub(a,b,c,d,e,f,g,h,j){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;t=i;k=g+c|0;o=h+d|0;s=(c|0)<0|(k|0)>(e|0)?2:1;m=(o|0)<0?0-h|0:d;d=(k|0)<0?0-g|0:c;m=(m|0)>(f|0)?f:m;d=(d|0)>(e|0)?e:d;k=d+g|0;l=m+h|0;if((d|0)>0)a=a+d|0;if((m|0)>0)a=a+(Z(m,e)|0)|0;r=(d|0)<0?0-d|0:0;q=(k|0)>(e|0)?k-e|0:0;p=g-r-q|0;g=0-m|0;m=(m|0)<0?g:0;c=l-f|0;n=(l|0)>(f|0)?c:0;k=h-m|0;d=k-n|0;if(m){m=h+-1-((o|0)>0?o:0)|0;l=~f;l=(m|0)>(l|0)?m:l;m=~l;m=Z(l+((m|0)>0?m:0)+1|0,j)|0;l=b;while(1){xa[s&3](a,l,r,p,q);g=g+-1|0;if(!g)break;else l=l+j|0}b=b+m|0}if((k|0)!=(n|0)){l=h+-1|0;g=l-((o|0)>0?o:0)|0;k=~f;k=(g|0)>(k|0)?g:k;l=l-k|0;g=~k;g=h+f+-1-((l|0)<(f|0)?f:l)-k-((g|0)>0?g:0)|0;k=Z(g,j)|0;g=Z(g,e)|0;l=b;m=a;while(1){xa[s&3](m,l,r,p,q);d=d+-1|0;if(!d)break;else{l=l+j|0;m=m+e|0}}b=b+k|0;a=a+g|0}a=a+(0-e)|0;if(!n){i=t;return}while(1){xa[s&3](a,b,r,p,q);c=c+-1|0;if(!c)break;else b=b+j|0}i=t;return}function Vb(b,c,e,f,g,h,j,k,l){b=b|0;c=c|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0;C=i;i=i+144|0;m=C;if(((e|0)>=0?!((k+e|0)>>>0>g>>>0|(f|0)<0):0)?(f+1+l|0)>>>0<=h>>>0:0)m=b;else{A=l+1|0;Ub(b,m,e,f,g,h,k,A,k);Ub(b+(Z(h,g)|0)|0,m+(Z(A,k)|0)|0,e,f,g,h,k,A,k);h=A;g=k;e=0;f=0}B=8-j|0;w=l>>>1;A=(w|0)==0;x=k>>>1;z=(x|0)==0;y=16-k|0;v=g<<1;u=v-k|0;t=v|1;s=g+1|0;p=x<<1;r=0;do{l=m+((Z((Z(r,h)|0)+f|0,g)|0)+e)|0;if(!(A|z)){q=c+(r<<6)|0;o=w;while(1){k=q;b=l;n=x;while(1){D=d[b+g>>0]|0;E=d[b>>0]|0;a[k+8>>0]=(((Z(D,B)|0)+(Z(d[b+v>>0]|0,j)|0)<<3)+32|0)>>>6;a[k>>0]=(((Z(E,B)|0)+(Z(D,j)|0)<<3)+32|0)>>>6;D=d[b+s>>0]|0;E=d[b+1>>0]|0;a[k+9>>0]=(((Z(D,B)|0)+(Z(d[b+t>>0]|0,j)|0)<<3)+32|0)>>>6;a[k+1>>0]=(((Z(E,B)|0)+(Z(D,j)|0)<<3)+32|0)>>>6;n=n+-1|0;if(!n)break;else{k=k+2|0;b=b+2|0}}o=o+-1|0;if(!o)break;else{q=q+(p+y)|0;l=l+(p+u)|0}}}r=r+1|0}while((r|0)!=2);i=C;return}function Wb(b,c,e,f,g,h,j,k,l,m){b=b|0;c=c|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;m=m|0;var n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0;I=i;i=i+176|0;n=I;if(((e|0)>=0?!((e+1+l|0)>>>0>g>>>0|(f|0)<0):0)?(f+1+m|0)>>>0<=h>>>0:0)n=b;else{B=l+1|0;A=m+1|0;Ub(b,n,e,f,g,h,B,A,B);Ub(b+(Z(h,g)|0)|0,n+(Z(A,B)|0)|0,e,f,g,h,B,A,B);h=A;g=B;e=0;f=0}G=8-j|0;H=8-k|0;B=m>>>1;E=(B|0)==0;A=g<<1;C=l>>>1;F=(C|0)==0;D=16-l|0;z=A-l|0;v=g+1|0;w=A|1;x=g+2|0;y=A+2|0;s=C<<1;u=0;do{l=n+((Z((Z(u,h)|0)+f|0,g)|0)+e)|0;if(!(E|F)){t=c+(u<<6)|0;r=B;while(1){p=d[l+g>>0]|0;m=t;b=l;o=(Z(p,k)|0)+(Z(d[l>>0]|0,H)|0)|0;p=(Z(d[l+A>>0]|0,k)|0)+(Z(p,H)|0)|0;q=C;while(1){K=d[b+v>>0]|0;J=(Z(K,k)|0)+(Z(d[b+1>>0]|0,H)|0)|0;K=(Z(d[b+w>>0]|0,k)|0)+(Z(K,H)|0)|0;M=((Z(o,G)|0)+32+(Z(J,j)|0)|0)>>>6;a[m+8>>0]=((Z(p,G)|0)+32+(Z(K,j)|0)|0)>>>6;a[m>>0]=M;M=b;b=b+2|0;L=d[M+x>>0]|0;o=(Z(L,k)|0)+(Z(d[b>>0]|0,H)|0)|0;p=(Z(d[M+y>>0]|0,k)|0)+(Z(L,H)|0)|0;J=((Z(J,G)|0)+32+(Z(o,j)|0)|0)>>>6;a[m+9>>0]=((Z(K,G)|0)+32+(Z(p,j)|0)|0)>>>6;a[m+1>>0]=J;q=q+-1|0;if(!q)break;else m=m+2|0}r=r+-1|0;if(!r)break;else{t=t+(s+D)|0;l=l+(s+z)|0}}}u=u+1|0}while((u|0)!=2);i=I;return}function Xb(b,c,e,f,g,h,j,k){b=b|0;c=c|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0;r=i;i=i+448|0;l=r;if(((e|0)>=0?!((j+e|0)>>>0>g>>>0|(f|0)<0):0)?(f+5+k|0)>>>0<=h>>>0:0)l=b;else{Ub(b,l,e,f,g,h,j,k+5|0,j);g=j;e=0;f=0}h=e+g+(Z(f,g)|0)|0;b=k>>>2;if(!b){i=r;return}n=g<<2;q=0-g|0;o=q<<1;p=g<<1;if(!j){i=r;return}else{m=l+h|0;e=l+(h+(g*5|0))|0}while(1){l=j;h=c;k=m;f=e;while(1){u=d[f+o>>0]|0;v=d[f+q>>0]|0;w=d[f+g>>0]|0;y=d[f>>0]|0;x=w+u|0;s=d[k+p>>0]|0;a[h+48>>0]=a[((d[f+p>>0]|0)+16-x-(x<<2)+s+((y+v|0)*20|0)>>5)+3984>>0]|0;x=s+y|0;t=d[k+g>>0]|0;a[h+32>>0]=a[(w+16-x-(x<<2)+t+((v+u|0)*20|0)>>5)+3984>>0]|0;x=t+v|0;w=d[k>>0]|0;a[h+16>>0]=a[(y+16-x-(x<<2)+w+((s+u|0)*20|0)>>5)+3984>>0]|0;u=w+u|0;a[h>>0]=a[(v+16-u-(u<<2)+(d[k+q>>0]|0)+((t+s|0)*20|0)>>5)+3984>>0]|0;l=l+-1|0;if(!l)break;else{h=h+1|0;k=k+1|0;f=f+1|0}}b=b+-1|0;if(!b)break;else{c=c+64|0;m=m+n|0;e=e+n|0}}i=r;return}function Yb(b,c,e,f,g,h,j,k,l){b=b|0;c=c|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0;v=i;i=i+448|0;m=v;if(((e|0)>=0?!((j+e|0)>>>0>g>>>0|(f|0)<0):0)?(f+5+k|0)>>>0<=h>>>0:0)m=b;else{Ub(b,m,e,f,g,h,j,k+5|0,j);g=j;e=0;f=0}h=e+g+(Z(f,g)|0)|0;b=k>>>2;if(!b){i=v;return}u=(j|0)==0;s=(g<<2)-j|0;t=64-j|0;r=0-g|0;p=r<<1;q=g<<1;e=m+h|0;f=m+(h+(Z(g,l+2|0)|0))|0;m=m+(h+(g*5|0))|0;while(1){if(u){h=c;k=f}else{k=f+j|0;h=c+j|0;l=j;o=e;n=m;while(1){y=d[n+p>>0]|0;z=d[n+r>>0]|0;A=d[n+g>>0]|0;C=d[n>>0]|0;B=A+y|0;w=d[o+q>>0]|0;a[c+48>>0]=((d[((d[n+q>>0]|0)+16-B-(B<<2)+w+((C+z|0)*20|0)>>5)+3984>>0]|0)+1+(d[f+q>>0]|0)|0)>>>1;B=w+C|0;x=d[o+g>>0]|0;a[c+32>>0]=((d[(A+16-B-(B<<2)+x+((z+y|0)*20|0)>>5)+3984>>0]|0)+1+(d[f+g>>0]|0)|0)>>>1;B=x+z|0;A=d[o>>0]|0;a[c+16>>0]=((d[(C+16-B-(B<<2)+A+((w+y|0)*20|0)>>5)+3984>>0]|0)+1+(d[f>>0]|0)|0)>>>1;y=A+y|0;a[c>>0]=((d[(z+16-y-(y<<2)+(d[o+r>>0]|0)+((x+w|0)*20|0)>>5)+3984>>0]|0)+1+(d[f+r>>0]|0)|0)>>>1;l=l+-1|0;if(!l)break;else{c=c+1|0;o=o+1|0;f=f+1|0;n=n+1|0}}e=e+j|0;m=m+j|0}b=b+-1|0;if(!b)break;else{c=h+t|0;e=e+s|0;f=k+s|0;m=m+s|0}}i=v;return}function Zb(b,c,e,f,g,h,j,k){b=b|0;c=c|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;u=i;i=i+448|0;l=u;if((e|0)>=0?!((e+5+j|0)>>>0>g>>>0|(f|0)<0|(k+f|0)>>>0>h>>>0):0)l=b;else{n=j+5|0;Ub(b,l,e,f,g,h,n,k,n);g=n;e=0;f=0}if(!k){i=u;return}r=j>>>2;t=(r|0)==0;s=g-j|0;q=16-j|0;p=r<<2;b=c;l=l+(e+5+(Z(f,g)|0))|0;o=k;while(1){if(t)h=b;else{h=b+p|0;e=l;g=d[l+-1>>0]|0;k=d[l+-2>>0]|0;m=d[l+-3>>0]|0;n=d[l+-4>>0]|0;j=d[l+-5>>0]|0;c=r;while(1){f=n+g|0;v=n;n=d[e>>0]|0;a[b>>0]=a[(j+16-f-(f<<2)+n+((m+k|0)*20|0)>>5)+3984>>0]|0;j=n+m|0;f=m;m=d[e+1>>0]|0;a[b+1>>0]=a[(v+16-j-(j<<2)+m+((k+g|0)*20|0)>>5)+3984>>0]|0;j=m+k|0;v=k;k=d[e+2>>0]|0;a[b+2>>0]=a[(f+16-j-(j<<2)+k+((n+g|0)*20|0)>>5)+3984>>0]|0;j=k+g|0;f=d[e+3>>0]|0;a[b+3>>0]=a[(v+16-j-(j<<2)+f+((m+n|0)*20|0)>>5)+3984>>0]|0;c=c+-1|0;if(!c)break;else{j=g;b=b+4|0;e=e+4|0;g=f}}l=l+p|0}o=o+-1|0;if(!o)break;else{b=h+q|0;l=l+s|0}}i=u;return}function _b(b,c,e,f,g,h,j,k,l){b=b|0;c=c|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;v=i;i=i+448|0;m=v;if((e|0)>=0?!((e+5+j|0)>>>0>g>>>0|(f|0)<0|(k+f|0)>>>0>h>>>0):0)m=b;else{o=j+5|0;Ub(b,m,e,f,g,h,o,k,o);g=o;e=0;f=0}if(!k){i=v;return}s=j>>>2;u=(s|0)==0;t=g-j|0;r=16-j|0;q=(l|0)!=0;p=s<<2;b=c;m=m+(e+5+(Z(f,g)|0))|0;while(1){if(u)h=b;else{h=b+p|0;l=m;e=d[m+-1>>0]|0;g=d[m+-2>>0]|0;n=d[m+-3>>0]|0;o=d[m+-4>>0]|0;j=d[m+-5>>0]|0;c=s;while(1){f=o+e|0;w=o;o=d[l>>0]|0;a[b>>0]=((q?g:n)+1+(d[(j+16-f-(f<<2)+o+((n+g|0)*20|0)>>5)+3984>>0]|0)|0)>>>1;j=o+n|0;f=n;n=d[l+1>>0]|0;a[b+1>>0]=((q?e:g)+1+(d[(w+16-j-(j<<2)+n+((g+e|0)*20|0)>>5)+3984>>0]|0)|0)>>>1;j=n+g|0;w=g;g=d[l+2>>0]|0;a[b+2>>0]=((q?o:e)+1+(d[(f+16-j-(j<<2)+g+((o+e|0)*20|0)>>5)+3984>>0]|0)|0)>>>1;j=g+e|0;f=d[l+3>>0]|0;a[b+3>>0]=((q?n:o)+1+(d[(w+16-j-(j<<2)+f+((n+o|0)*20|0)>>5)+3984>>0]|0)|0)>>>1;c=c+-1|0;if(!c)break;else{j=e;b=b+4|0;l=l+4|0;e=f}}m=m+p|0}k=k+-1|0;if(!k)break;else{b=h+r|0;m=m+t|0}}i=v;return}function $b(b,c,e,f,g,h,j,k,l){b=b|0;c=c|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0;z=i;i=i+448|0;m=z;if(((e|0)>=0?!((e+5+j|0)>>>0>g>>>0|(f|0)<0):0)?(f+5+k|0)>>>0<=h>>>0:0)m=b;else{y=j+5|0;Ub(b,m,e,f,g,h,y,k+5|0,y);g=y;e=0;f=0}b=(Z(f,g)|0)+e|0;y=(l&1|2)+g+b|0;n=m+y|0;if(!k){i=z;return}u=j>>>2;w=(u|0)==0;v=g-j|0;x=16-j|0;t=u<<2;b=m+((Z(g,l>>>1&1|2)|0)+5+b)|0;s=k;while(1){if(!w){r=c+t|0;h=b;e=d[b+-1>>0]|0;f=d[b+-2>>0]|0;o=d[b+-3>>0]|0;p=d[b+-4>>0]|0;l=d[b+-5>>0]|0;q=u;while(1){A=p+e|0;B=p;p=d[h>>0]|0;a[c>>0]=a[(l+16-A-(A<<2)+p+((o+f|0)*20|0)>>5)+3984>>0]|0;A=p+o|0;l=o;o=d[h+1>>0]|0;a[c+1>>0]=a[(B+16-A-(A<<2)+o+((f+e|0)*20|0)>>5)+3984>>0]|0;A=o+f|0;B=f;f=d[h+2>>0]|0;a[c+2>>0]=a[(l+16-A-(A<<2)+f+((p+e|0)*20|0)>>5)+3984>>0]|0;A=f+e|0;l=d[h+3>>0]|0;a[c+3>>0]=a[(B+16-A-(A<<2)+l+((o+p|0)*20|0)>>5)+3984>>0]|0;q=q+-1|0;if(!q)break;else{A=e;c=c+4|0;h=h+4|0;e=l;l=A}}c=r;b=b+t|0}s=s+-1|0;if(!s)break;else{c=c+x|0;b=b+v|0}}b=k>>>2;if(!b){i=z;return}t=(j|0)==0;p=(g<<2)-j|0;o=64-j|0;q=0-g|0;s=q<<1;r=g<<1;c=c+(x-(k<<4))|0;h=m+(y+(g*5|0))|0;l=b;while(1){if(t){b=c;m=n}else{b=c+j|0;m=c;e=n;f=h;c=j;while(1){x=d[f+s>>0]|0;w=d[f+q>>0]|0;u=d[f+g>>0]|0;B=d[f>>0]|0;y=u+x|0;k=d[e+r>>0]|0;A=m+48|0;a[A>>0]=((d[((d[f+r>>0]|0)+16-y-(y<<2)+k+((B+w|0)*20|0)>>5)+3984>>0]|0)+1+(d[A>>0]|0)|0)>>>1;A=k+B|0;y=d[e+g>>0]|0;v=m+32|0;a[v>>0]=((d[(u+16-A-(A<<2)+y+((w+x|0)*20|0)>>5)+3984>>0]|0)+1+(d[v>>0]|0)|0)>>>1;v=d[e>>0]|0;A=y+w|0;u=m+16|0;a[u>>0]=((d[(B+16-A-(A<<2)+v+((k+x|0)*20|0)>>5)+3984>>0]|0)+1+(d[u>>0]|0)|0)>>>1;x=v+x|0;a[m>>0]=((d[(w+16-x-(x<<2)+(d[e+q>>0]|0)+((y+k|0)*20|0)>>5)+3984>>0]|0)+1+(d[m>>0]|0)|0)>>>1;c=c+-1|0;if(!c)break;else{m=m+1|0;e=e+1|0;f=f+1|0}}m=n+j|0;h=h+j|0}l=l+-1|0;if(!l)break;else{c=b+o|0;n=m+p|0;h=h+p|0}}i=z;return}function ac(b,e,f,g,h,j,k,l){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0;x=i;i=i+1792|0;m=x+1344|0;w=x;if(((f|0)>=0?!((f+5+k|0)>>>0>h>>>0|(g|0)<0):0)?(g+5+l|0)>>>0<=j>>>0:0){o=l+5|0;m=b;n=f+5|0}else{n=k+5|0;o=l+5|0;Ub(b,m,f,g,h,j,n,o,n);h=n;n=5;g=0}if(o){t=k>>>2;v=(t|0)==0;s=h-k|0;u=t<<2;f=w;m=m+(n+(Z(g,h)|0))|0;while(1){if(v)b=f;else{b=f+(u<<2)|0;g=m;h=d[m+-1>>0]|0;j=d[m+-2>>0]|0;p=d[m+-3>>0]|0;q=d[m+-4>>0]|0;n=d[m+-5>>0]|0;r=t;while(1){y=q+h|0;z=q;q=d[g>>0]|0;c[f>>2]=n-y-(y<<2)+q+((p+j|0)*20|0);y=q+p|0;n=p;p=d[g+1>>0]|0;c[f+4>>2]=z-y+p-(y<<2)+((j+h|0)*20|0);y=p+j|0;z=j;j=d[g+2>>0]|0;c[f+8>>2]=n-y+j-(y<<2)+((q+h|0)*20|0);y=j+h|0;n=d[g+3>>0]|0;c[f+12>>2]=z-y+n-(y<<2)+((p+q|0)*20|0);r=r+-1|0;if(!r)break;else{y=h;f=f+16|0;g=g+4|0;h=n;n=y}}m=m+u|0}o=o+-1|0;if(!o)break;else{f=b;m=m+s|0}}}h=l>>>2;if(!h){i=x;return}u=(k|0)==0;s=64-k|0;p=k*3|0;t=0-k|0;q=t<<1;r=k<<1;g=e;b=w+(k<<2)|0;m=w+(k*6<<2)|0;o=h;while(1){if(u)h=g;else{h=g+k|0;f=b;j=m;n=k;while(1){e=c[j+(q<<2)>>2]|0;w=c[j+(t<<2)>>2]|0;z=c[j+(k<<2)>>2]|0;A=c[j>>2]|0;y=z+e|0;v=c[f+(r<<2)>>2]|0;a[g+48>>0]=a[((c[j+(r<<2)>>2]|0)+512-y-(y<<2)+v+((A+w|0)*20|0)>>10)+3984>>0]|0;y=v+A|0;l=c[f+(k<<2)>>2]|0;a[g+32>>0]=a[(z+512-y-(y<<2)+l+((w+e|0)*20|0)>>10)+3984>>0]|0;y=c[f>>2]|0;z=l+w|0;a[g+16>>0]=a[(A+512-z-(z<<2)+y+((v+e|0)*20|0)>>10)+3984>>0]|0;e=y+e|0;a[g>>0]=a[(w+512-e-(e<<2)+(c[f+(t<<2)>>2]|0)+((l+v|0)*20|0)>>10)+3984>>0]|0;n=n+-1|0;if(!n)break;else{g=g+1|0;f=f+4|0;j=j+4|0}}b=b+(k<<2)|0;m=m+(k<<2)|0}o=o+-1|0;if(!o)break;else{g=h+s|0;b=b+(p<<2)|0;m=m+(p<<2)|0}}i=x;return}function bc(b,e,f,g,h,j,k,l,m){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;m=m|0;var n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0;y=i;i=i+1792|0;n=y+1344|0;x=y;if(((f|0)>=0?!((f+5+k|0)>>>0>h>>>0|(g|0)<0):0)?(g+5+l|0)>>>0<=j>>>0:0){o=l+5|0;n=b;f=f+5|0}else{q=k+5|0;o=l+5|0;Ub(b,n,f,g,h,j,q,o,q);h=q;f=5;g=0}if(o){v=k>>>2;t=(v|0)==0;u=h-k|0;w=v<<2;p=x;n=n+(f+(Z(g,h)|0))|0;s=o;while(1){if(t)b=p;else{b=p+(w<<2)|0;g=n;f=d[n+-1>>0]|0;h=d[n+-2>>0]|0;j=d[n+-3>>0]|0;q=d[n+-4>>0]|0;o=d[n+-5>>0]|0;r=v;while(1){z=q+f|0;A=q;q=d[g>>0]|0;c[p>>2]=o-z-(z<<2)+q+((j+h|0)*20|0);z=q+j|0;o=j;j=d[g+1>>0]|0;c[p+4>>2]=A-z+j-(z<<2)+((h+f|0)*20|0);z=j+h|0;A=h;h=d[g+2>>0]|0;c[p+8>>2]=o-z+h-(z<<2)+((q+f|0)*20|0);z=h+f|0;o=d[g+3>>0]|0;c[p+12>>2]=A-z+o-(z<<2)+((j+q|0)*20|0);r=r+-1|0;if(!r)break;else{z=f;p=p+16|0;g=g+4|0;f=o;o=z}}n=n+w|0}s=s+-1|0;if(!s)break;else{p=b;n=n+u|0}}}f=l>>>2;if(!f){i=y;return}w=(k|0)==0;u=64-k|0;q=k*3|0;v=0-k|0;t=v<<1;s=k<<1;b=x+(k<<2)|0;n=x+((Z(m+2|0,k)|0)+k<<2)|0;h=x+(k*6<<2)|0;r=f;while(1){if(w){g=e;f=n}else{f=n+(k<<2)|0;g=e+k|0;p=b;j=h;o=k;while(1){m=c[j+(t<<2)>>2]|0;l=c[j+(v<<2)>>2]|0;B=c[j+(k<<2)>>2]|0;C=c[j>>2]|0;A=B+m|0;z=c[p+(s<<2)>>2]|0;a[e+48>>0]=((d[((c[j+(s<<2)>>2]|0)+512-A-(A<<2)+z+((C+l|0)*20|0)>>10)+3984>>0]|0)+1+(d[((c[n+(s<<2)>>2]|0)+16>>5)+3984>>0]|0)|0)>>>1;A=z+C|0;x=c[p+(k<<2)>>2]|0;a[e+32>>0]=((d[(B+512-A-(A<<2)+x+((l+m|0)*20|0)>>10)+3984>>0]|0)+1+(d[((c[n+(k<<2)>>2]|0)+16>>5)+3984>>0]|0)|0)>>>1;A=c[p>>2]|0;B=x+l|0;a[e+16>>0]=((d[(C+512-B-(B<<2)+A+((z+m|0)*20|0)>>10)+3984>>0]|0)+1+(d[((c[n>>2]|0)+16>>5)+3984>>0]|0)|0)>>>1;m=A+m|0;a[e>>0]=((d[(l+512-m-(m<<2)+(c[p+(v<<2)>>2]|0)+((x+z|0)*20|0)>>10)+3984>>0]|0)+1+(d[((c[n+(v<<2)>>2]|0)+16>>5)+3984>>0]|0)|0)>>>1;o=o+-1|0;if(!o)break;else{e=e+1|0;p=p+4|0;n=n+4|0;j=j+4|0}}b=b+(k<<2)|0;h=h+(k<<2)|0}r=r+-1|0;if(!r)break;else{e=g+u|0;b=b+(q<<2)|0;n=f+(q<<2)|0;h=h+(q<<2)|0}}i=y;return}function cc(b,e,f,g,h,j,k,l,m){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;m=m|0;var n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0;B=i;i=i+1792|0;n=B+1344|0;A=B;z=k+5|0;if(((f|0)>=0?!((f+5+k|0)>>>0>h>>>0|(g|0)<0):0)?(g+5+l|0)>>>0<=j>>>0:0)n=b;else{Ub(b,n,f,g,h,j,z,l+5|0,z);h=z;f=0;g=0}s=f+h+(Z(g,h)|0)|0;g=l>>>2;if(g){y=(z|0)==0;x=(h<<2)-k+-5|0;t=z*3|0;p=0-h|0;w=p<<1;v=h<<1;u=z<<1;q=-5-k|0;j=A+(z<<2)|0;r=n+s|0;f=n+(s+(h*5|0))|0;while(1){if(y)s=j;else{s=j+(z<<2)|0;n=r;b=f;o=z;while(1){E=d[b+w>>0]|0;F=d[b+p>>0]|0;H=d[b+h>>0]|0;I=d[b>>0]|0;G=H+E|0;C=d[n+v>>0]|0;c[j+(u<<2)>>2]=(d[b+v>>0]|0)-G-(G<<2)+C+((I+F|0)*20|0);G=C+I|0;D=d[n+h>>0]|0;c[j+(z<<2)>>2]=H-G+D-(G<<2)+((F+E|0)*20|0);G=d[n>>0]|0;H=D+F|0;c[j>>2]=I-H+G-(H<<2)+((C+E|0)*20|0);E=G+E|0;c[j+(q<<2)>>2]=F-E+(d[n+p>>0]|0)-(E<<2)+((D+C|0)*20|0);o=o+-1|0;if(!o)break;else{j=j+4|0;n=n+1|0;b=b+1|0}}r=r+z|0;f=f+z|0}g=g+-1|0;if(!g)break;else{j=s+(t<<2)|0;r=r+x|0;f=f+x|0}}}if(!l){i=B;return}v=k>>>2;w=(v|0)==0;u=16-k|0;t=v<<2;h=A+(m+2<<2)|0;g=A+20|0;while(1){if(w)f=h;else{f=h+(t<<2)|0;s=e;n=g;j=c[g+-4>>2]|0;o=c[g+-8>>2]|0;p=c[g+-12>>2]|0;q=c[g+-16>>2]|0;b=c[g+-20>>2]|0;r=v;while(1){m=q+j|0;k=q;q=c[n>>2]|0;a[s>>0]=((d[(b+512-m-(m<<2)+q+((p+o|0)*20|0)>>10)+3984>>0]|0)+1+(d[((c[h>>2]|0)+16>>5)+3984>>0]|0)|0)>>>1;m=q+p|0;b=p;p=c[n+4>>2]|0;a[s+1>>0]=((d[(k+512-m-(m<<2)+p+((o+j|0)*20|0)>>10)+3984>>0]|0)+1+(d[((c[h+4>>2]|0)+16>>5)+3984>>0]|0)|0)>>>1;m=p+o|0;k=o;o=c[n+8>>2]|0;a[s+2>>0]=((d[(b+512-m-(m<<2)+o+((q+j|0)*20|0)>>10)+3984>>0]|0)+1+(d[((c[h+8>>2]|0)+16>>5)+3984>>0]|0)|0)>>>1;m=o+j|0;b=c[n+12>>2]|0;a[s+3>>0]=((d[(k+512-m-(m<<2)+b+((p+q|0)*20|0)>>10)+3984>>0]|0)+1+(d[((c[h+12>>2]|0)+16>>5)+3984>>0]|0)|0)>>>1;r=r+-1|0;if(!r)break;else{m=j;s=s+4|0;h=h+16|0;n=n+16|0;j=b;b=m}}e=e+t|0;g=g+(t<<2)|0}l=l+-1|0;if(!l)break;else{e=e+u|0;h=f+20|0;g=g+20|0}}i=B;return}function dc(a,d,e,f,g,h,j,k,l){a=a|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;x=i;q=a+((j<<4)+h)|0;u=b[d>>1]|0;w=d+2|0;t=b[w>>1]|0;s=e+4|0;p=c[s>>2]<<4;r=e+8|0;o=c[r>>2]<<4;f=h+f|0;m=f+(u>>2)|0;g=j+g|0;n=g+(t>>2)|0;do switch(c[6800+((u&3)<<4)+((t&3)<<2)>>2]|0){case 10:{ac(c[e>>2]|0,q,m+-2|0,n+-2|0,p,o,k,l);break}case 6:{cc(c[e>>2]|0,q,m+-2|0,n+-2|0,p,o,k,l,0);break}case 4:{_b(c[e>>2]|0,q,m+-2|0,n,p,o,k,l,0);break}case 1:{Yb(c[e>>2]|0,q,m,n+-2|0,p,o,k,l,0);break}case 2:{Xb(c[e>>2]|0,q,m,n+-2|0,p,o,k,l);break}case 12:{_b(c[e>>2]|0,q,m+-2|0,n,p,o,k,l,1);break}case 14:{cc(c[e>>2]|0,q,m+-2|0,n+-2|0,p,o,k,l,1);break}case 7:{$b(c[e>>2]|0,q,m+-2|0,n+-2|0,p,o,k,l,2);break}case 13:{$b(c[e>>2]|0,q,m+-2|0,n+-2|0,p,o,k,l,1);break}case 5:{$b(c[e>>2]|0,q,m+-2|0,n+-2|0,p,o,k,l,0);break}case 0:{Ub(c[e>>2]|0,q,m,n,p,o,k,l,16);break}case 9:{bc(c[e>>2]|0,q,m+-2|0,n+-2|0,p,o,k,l,0);break}case 8:{Zb(c[e>>2]|0,q,m+-2|0,n,p,o,k,l);break}case 3:{Yb(c[e>>2]|0,q,m,n+-2|0,p,o,k,l,1);break}case 11:{bc(c[e>>2]|0,q,m+-2|0,n+-2|0,p,o,k,l,1);break}default:$b(c[e>>2]|0,q,m+-2|0,n+-2|0,p,o,k,l,3)}while(0);u=(h>>>1)+256+(j>>>1<<3)|0;v=a+u|0;t=c[e>>2]|0;m=c[s>>2]|0;j=c[r>>2]|0;r=m<<3;s=j<<3;p=b[d>>1]|0;e=(p>>3)+(f>>>1)|0;q=b[w>>1]|0;o=(q>>3)+(g>>>1)|0;p=p&7;q=q&7;g=k>>>1;h=l>>>1;j=Z(m<<8,j)|0;f=t+j|0;m=(p|0)!=0;n=(q|0)!=0;if(m&n){Wb(f,v,e,o,r,s,p,q,g,h);i=x;return}if(m){Tb(f,v,e,o,r,s,p,g,h);i=x;return}if(n){Vb(f,v,e,o,r,s,q,g,h);i=x;return}else{Ub(f,v,e,o,r,s,g,h,8);Ub(t+((Z(s,r)|0)+j)|0,a+(u+64)|0,e,o,r,s,g,h,8);i=x;return}}function ec(b,c,d,e,f){b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0;j=i;if(d){nd(c|0,a[b>>0]|0,d|0)|0;c=c+d|0}if(e){h=c+e|0;g=e;d=b;while(1){a[c>>0]=a[d>>0]|0;g=g+-1|0;if(!g)break;else{c=c+1|0;d=d+1|0}}c=h;b=b+e|0}if(!f){i=j;return}nd(c|0,a[b+-1>>0]|0,f|0)|0;i=j;return}function fc(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;c=i;hd(b,a,d);i=c;return}function gc(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;q=i;f=c[a+40>>2]|0;if(f){h=c[a>>2]|0;k=a+32|0;j=0;do{if(((c[h+(j*40|0)+20>>2]|0)+-1|0)>>>0<2){g=c[h+(j*40|0)+12>>2]|0;if(g>>>0>d>>>0)g=g-(c[k>>2]|0)|0;c[h+(j*40|0)+8>>2]=g}j=j+1|0}while((j|0)!=(f|0))}if(!(c[b>>2]|0)){p=0;i=q;return p|0}g=c[b+4>>2]|0;if(g>>>0>=3){p=0;i=q;return p|0}o=a+32|0;p=a+24|0;n=a+4|0;f=d;m=0;a:while(1){b:do if(g>>>0<2){k=c[b+(m*12|0)+8>>2]|0;if(!g){g=f-k|0;if((g|0)<0)g=(c[o>>2]|0)+g|0}else{l=k+f|0;g=c[o>>2]|0;g=l-((l|0)<(g|0)?0:g)|0}if(g>>>0>d>>>0)f=g-(c[o>>2]|0)|0;else f=g;j=c[p>>2]|0;if(!j){f=1;g=37;break a}k=c[a>>2]|0;l=0;while(1){h=c[k+(l*40|0)+20>>2]|0;if((h+-1|0)>>>0<2?(c[k+(l*40|0)+8>>2]|0)==(f|0):0){f=g;break b}l=l+1|0;if(l>>>0>=j>>>0){f=1;g=37;break a}}}else{j=c[b+(m*12|0)+12>>2]|0;h=c[p>>2]|0;if(!h){f=1;g=37;break a}k=c[a>>2]|0;g=0;while(1){if((c[k+(g*40|0)+20>>2]|0)==3?(c[k+(g*40|0)+8>>2]|0)==(j|0):0){h=3;l=g;break b}g=g+1|0;if(g>>>0>=h>>>0){f=1;g=37;break a}}}while(0);if(!((l|0)>-1&h>>>0>1)){f=1;g=37;break}if(m>>>0<e>>>0){k=e;do{j=k;k=k+-1|0;h=c[n>>2]|0;c[h+(j<<2)>>2]=c[h+(k<<2)>>2]}while(k>>>0>m>>>0);k=c[a>>2]|0}c[(c[n>>2]|0)+(m<<2)>>2]=k+(l*40|0);m=m+1|0;if(m>>>0<=e>>>0){g=m;k=m;do{j=c[n>>2]|0;h=c[j+(g<<2)>>2]|0;if((h|0)!=((c[a>>2]|0)+(l*40|0)|0)){c[j+(k<<2)>>2]=h;k=k+1|0}g=g+1|0}while(g>>>0<=e>>>0)}g=c[b+(m*12|0)+4>>2]|0;if(g>>>0>=3){f=0;g=37;break}}if((g|0)==37){i=q;return f|0}return 0}function hc(a,b,d,e,f,g,h,j){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0;K=i;I=c[d>>2]|0;J=c[a+8>>2]|0;if((I|0)!=(c[J>>2]|0)){D=1;i=K;return D|0}B=a+52|0;c[B>>2]=0;G=c[a+56>>2]|0;o=(G|0)==0;H=o&1;do if(!b){c[J+20>>2]=0;c[J+12>>2]=e;c[J+8>>2]=e;c[J+16>>2]=f;c[J+24>>2]=H;if(o){d=a+44|0;c[d>>2]=(c[d>>2]|0)+1;d=0;r=0}else{d=G;r=0}}else{if(g){k=a+20|0;c[k>>2]=0;l=a+16|0;c[l>>2]=0;r=c[a>>2]|0;s=a+44|0;q=0;do{p=r+(q*40|0)+20|0;if((c[p>>2]|0)!=0?(c[p>>2]=0,(c[r+(q*40|0)+24>>2]|0)==0):0)c[s>>2]=(c[s>>2]|0)+-1;q=q+1|0}while((q|0)!=16);a:do if(o){n=c[a+28>>2]|0;m=a+12|0;q=0;while(1){e=0;p=2147483647;o=0;do{if(c[r+(e*40|0)+24>>2]|0){C=c[r+(e*40|0)+16>>2]|0;D=(C|0)<(p|0);p=D?C:p;o=D?r+(e*40|0)|0:o}e=e+1|0}while(e>>>0<=n>>>0);if(!o){d=0;break a}D=c[m>>2]|0;c[D+(q<<4)>>2]=c[o>>2];c[D+(q<<4)+12>>2]=c[o+36>>2];c[D+(q<<4)+4>>2]=c[o+28>>2];c[D+(q<<4)+8>>2]=c[o+32>>2];q=q+1|0;c[l>>2]=q;c[o+24>>2]=0;if(c[o+20>>2]|0)continue;c[s>>2]=(c[s>>2]|0)+-1}}else d=G;while(0);p=a+40|0;c[p>>2]=0;o=a+36|0;c[o>>2]=65535;c[a+48>>2]=0;if(!(c[b>>2]|d))d=0;else{c[l>>2]=0;c[k>>2]=0}r=(c[b+4>>2]|0)==0;c[J+20>>2]=r?2:3;c[o>>2]=r?65535:0;c[J+12>>2]=0;c[J+8>>2]=0;c[J+16>>2]=0;c[J+24>>2]=H;c[s>>2]=1;c[p>>2]=1;r=0;break}if(!(c[b+8>>2]|0)){d=a+40|0;q=c[d>>2]|0;p=c[a+24>>2]|0;if(q>>>0>=p>>>0)if(q){l=c[a>>2]|0;m=0;o=-1;n=0;do{if(((c[l+(m*40|0)+20>>2]|0)+-1|0)>>>0<2){D=c[l+(m*40|0)+8>>2]|0;C=(D|0)<(n|0)|(o|0)==-1;o=C?m:o;n=C?D:n}m=m+1|0}while((m|0)!=(q|0));if((o|0)>-1){q=q+-1|0;c[l+(o*40|0)+20>>2]=0;c[d>>2]=q;if(!(c[l+(o*40|0)+24>>2]|0)){d=a+44|0;c[d>>2]=(c[d>>2]|0)+-1;d=G;n=0}else{d=G;n=0}}else{d=G;n=1}}else{q=0;d=G;n=1}else{d=G;n=0}}else{E=a+24|0;C=a+40|0;v=a+44|0;x=a+36|0;A=a+48|0;u=a+28|0;y=a+16|0;z=a+12|0;r=G;d=G;t=0;w=0;b:while(1){switch(c[b+(t*20|0)+12>>2]|0){case 4:{l=c[b+(t*20|0)+28>>2]|0;c[x>>2]=l;m=c[E>>2]|0;if(!m)s=w;else{n=c[a>>2]|0;s=l;o=0;do{k=n+(o*40|0)+20|0;do if((c[k>>2]|0)==3){if((c[n+(o*40|0)+8>>2]|0)>>>0<=l>>>0)if((s|0)==65535)s=65535;else break;c[k>>2]=0;c[C>>2]=(c[C>>2]|0)+-1;if(!(c[n+(o*40|0)+24>>2]|0))c[v>>2]=(c[v>>2]|0)+-1}while(0);o=o+1|0}while((o|0)!=(m|0));s=w}break}case 1:{n=e-(c[b+(t*20|0)+16>>2]|0)|0;l=c[E>>2]|0;if(!l){n=1;break b}m=c[a>>2]|0;s=0;while(1){k=m+(s*40|0)+20|0;if(((c[k>>2]|0)+-1|0)>>>0<2?(c[m+(s*40|0)+8>>2]|0)==(n|0):0)break;s=s+1|0;if(s>>>0>=l>>>0){n=1;break b}}if((s|0)<0){n=1;break b}c[k>>2]=0;c[C>>2]=(c[C>>2]|0)+-1;if(!(c[m+(s*40|0)+24>>2]|0)){c[v>>2]=(c[v>>2]|0)+-1;s=w}else s=w;break}case 6:{m=c[b+(t*20|0)+24>>2]|0;s=c[x>>2]|0;if((s|0)==65535|s>>>0<m>>>0){n=1;F=101;break b}r=c[E>>2]|0;c:do if(r){l=c[a>>2]|0;s=0;while(1){k=l+(s*40|0)+20|0;if((c[k>>2]|0)==3?(c[l+(s*40|0)+8>>2]|0)==(m|0):0)break;s=s+1|0;if(s>>>0>=r>>>0){F=88;break c}}c[k>>2]=0;k=(c[C>>2]|0)+-1|0;c[C>>2]=k;if(!(c[l+(s*40|0)+24>>2]|0)){c[v>>2]=(c[v>>2]|0)+-1;s=k}else s=k}else{r=0;F=88}while(0);if((F|0)==88){F=0;s=c[C>>2]|0}if(s>>>0>=r>>>0){n=1;F=101;break b}c[J+12>>2]=e;c[J+8>>2]=m;c[J+16>>2]=f;c[J+20>>2]=3;c[J+24>>2]=H;c[C>>2]=s+1;c[v>>2]=(c[v>>2]|0)+1;r=G;d=G;s=1;break}case 2:{l=c[b+(t*20|0)+20>>2]|0;m=c[E>>2]|0;if(!m){n=1;break b}n=c[a>>2]|0;s=0;while(1){k=n+(s*40|0)+20|0;if((c[k>>2]|0)==3?(c[n+(s*40|0)+8>>2]|0)==(l|0):0)break;s=s+1|0;if(s>>>0>=m>>>0){n=1;break b}}if((s|0)<0){n=1;break b}c[k>>2]=0;c[C>>2]=(c[C>>2]|0)+-1;if(!(c[n+(s*40|0)+24>>2]|0)){c[v>>2]=(c[v>>2]|0)+-1;s=w}else s=w;break}case 3:{s=c[b+(t*20|0)+16>>2]|0;n=c[b+(t*20|0)+24>>2]|0;k=c[x>>2]|0;if((k|0)==65535|k>>>0<n>>>0){n=1;break b}o=c[E>>2]|0;if(!o){n=1;break b}p=c[a>>2]|0;k=0;while(1){m=p+(k*40|0)+20|0;if((c[m>>2]|0)==3?(c[p+(k*40|0)+8>>2]|0)==(n|0):0){F=47;break}l=k+1|0;if(l>>>0<o>>>0)k=l;else break}if((F|0)==47?(F=0,c[m>>2]=0,c[C>>2]=(c[C>>2]|0)+-1,(c[p+(k*40|0)+24>>2]|0)==0):0)c[v>>2]=(c[v>>2]|0)+-1;m=e-s|0;s=0;while(1){l=p+(s*40|0)+20|0;k=c[l>>2]|0;if((k+-1|0)>>>0<2?(D=p+(s*40|0)+8|0,(c[D>>2]|0)==(m|0)):0)break;s=s+1|0;if(s>>>0>=o>>>0){n=1;break b}}if(!((s|0)>-1&k>>>0>1)){n=1;break b}c[l>>2]=3;c[D>>2]=n;s=w;break}case 5:{n=c[a>>2]|0;q=0;do{p=n+(q*40|0)+20|0;if((c[p>>2]|0)!=0?(c[p>>2]=0,(c[n+(q*40|0)+24>>2]|0)==0):0)c[v>>2]=(c[v>>2]|0)+-1;q=q+1|0}while((q|0)!=16);d:do if(!d){l=c[u>>2]|0;m=r;while(1){d=0;s=2147483647;k=0;do{if(c[n+(d*40|0)+24>>2]|0){o=c[n+(d*40|0)+16>>2]|0;e=(o|0)<(s|0);s=e?o:s;k=e?n+(d*40|0)|0:k}d=d+1|0}while(d>>>0<=l>>>0);if(!k){r=m;d=0;break d}s=c[y>>2]|0;d=c[z>>2]|0;c[d+(s<<4)>>2]=c[k>>2];c[d+(s<<4)+12>>2]=c[k+36>>2];c[d+(s<<4)+4>>2]=c[k+28>>2];c[d+(s<<4)+8>>2]=c[k+32>>2];c[y>>2]=s+1;c[k+24>>2]=0;if(!(c[k+20>>2]|0))c[v>>2]=(c[v>>2]|0)+-1;if(!m)m=0;else{r=m;d=m;break}}}while(0);c[C>>2]=0;c[x>>2]=65535;c[A>>2]=0;c[B>>2]=1;e=0;s=w;break}case 0:{n=0;F=101;break b}default:{n=1;break b}}t=t+1|0;w=s}if(w){r=n;break}q=c[C>>2]|0;p=c[E>>2]|0}if(q>>>0<p>>>0){c[J+12>>2]=e;c[J+8>>2]=e;c[J+16>>2]=f;c[J+20>>2]=2;c[J+24>>2]=H;r=a+44|0;c[r>>2]=(c[r>>2]|0)+1;c[a+40>>2]=q+1;r=n}else r=1}while(0);c[J+36>>2]=g;c[J+28>>2]=h;c[J+32>>2]=j;if(!d){o=a+44|0;d=c[o>>2]|0;k=c[a+28>>2]|0;if(d>>>0>k>>>0){p=a+16|0;q=a+12|0;do{n=c[a>>2]|0;e=0;l=2147483647;m=0;do{if(c[n+(e*40|0)+24>>2]|0){C=c[n+(e*40|0)+16>>2]|0;D=(C|0)<(l|0);l=D?C:l;m=D?n+(e*40|0)|0:m}e=e+1|0}while(e>>>0<=k>>>0);if((m|0)!=0?(D=c[p>>2]|0,C=c[q>>2]|0,c[C+(D<<4)>>2]=c[m>>2],c[C+(D<<4)+12>>2]=c[m+36>>2],c[C+(D<<4)+4>>2]=c[m+28>>2],c[C+(D<<4)+8>>2]=c[m+32>>2],c[p>>2]=D+1,c[m+24>>2]=0,(c[m+20>>2]|0)==0):0){d=d+-1|0;c[o>>2]=d}}while(d>>>0>k>>>0)}}else{k=a+16|0;D=c[k>>2]|0;C=c[a+12>>2]|0;c[C+(D<<4)>>2]=I;c[C+(D<<4)+12>>2]=g;c[C+(D<<4)+4>>2]=h;c[C+(D<<4)+8>>2]=j;c[k>>2]=D+1;k=c[a+28>>2]|0}rc(c[a>>2]|0,k+1|0);D=r;i=K;return D|0}function ic(a,b){a=a|0;b=b|0;var d=0,e=0;e=i;if((b>>>0<=16?(d=c[(c[a+4>>2]|0)+(b<<2)>>2]|0,(d|0)!=0):0)?(c[d+20>>2]|0)>>>0>1:0)d=c[d>>2]|0;else d=0;i=e;return d|0}function jc(a){a=a|0;var b=0;b=(c[a>>2]|0)+((c[a+28>>2]|0)*40|0)|0;c[a+8>>2]=b;return c[b>>2]|0}function kc(a,b,d,e,f,g){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,j=0;j=i;c[a+36>>2]=65535;e=e>>>0>1?e:1;c[a+24>>2]=e;h=a+28|0;c[h>>2]=(g|0)==0?d:e;c[a+32>>2]=f;c[a+56>>2]=g;c[a+44>>2]=0;c[a+40>>2]=0;c[a+48>>2]=0;g=fd(680)|0;c[a>>2]=g;if(!g){g=65535;i=j;return g|0}id(g,0,680);a:do if((c[h>>2]|0)!=-1){f=b*384|47;e=0;while(1){d=fd(f)|0;g=c[a>>2]|0;c[g+(e*40|0)+4>>2]=d;if(!d){g=65535;break}c[g+(e*40|0)>>2]=d+(0-d&15);e=e+1|0;if(e>>>0>=((c[h>>2]|0)+1|0)>>>0)break a}i=j;return g|0}while(0);g=a+4|0;c[g>>2]=fd(68)|0;f=fd((c[h>>2]<<4)+16|0)|0;c[a+12>>2]=f;g=c[g>>2]|0;if((g|0)==0|(f|0)==0){g=65535;i=j;return g|0}id(g,0,68);c[a+20>>2]=0;c[a+16>>2]=0;g=0;i=j;return g|0}function lc(a,b,d,e,f,g){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0;l=i;h=c[a>>2]|0;if(h){k=a+28|0;if((c[k>>2]|0)!=-1){j=0;do{gd(c[h+(j*40|0)+4>>2]|0);h=c[a>>2]|0;c[h+(j*40|0)+4>>2]=0;j=j+1|0}while(j>>>0<((c[k>>2]|0)+1|0)>>>0)}}else h=0;gd(h);c[a>>2]=0;h=a+4|0;gd(c[h>>2]|0);c[h>>2]=0;h=a+12|0;gd(c[h>>2]|0);c[h>>2]=0;h=kc(a,b,d,e,f,g)|0;i=l;return h|0}function mc(a){a=a|0;var b=0,d=0,e=0,f=0;f=i;b=c[a>>2]|0;if(b){e=a+28|0;if((c[e>>2]|0)!=-1){d=0;do{gd(c[b+(d*40|0)+4>>2]|0);b=c[a>>2]|0;c[b+(d*40|0)+4>>2]=0;d=d+1|0}while(d>>>0<((c[e>>2]|0)+1|0)>>>0)}}else b=0;gd(b);c[a>>2]=0;b=a+4|0;gd(c[b>>2]|0);c[b>>2]=0;b=a+12|0;gd(c[b>>2]|0);c[b>>2]=0;i=f;return}function nc(a){a=a|0;var b=0,d=0,e=0,f=0;f=i;b=c[a+40>>2]|0;if(!b){i=f;return}e=a+4|0;d=0;do{c[(c[e>>2]|0)+(d<<2)>>2]=(c[a>>2]|0)+(d*40|0);d=d+1|0}while(d>>>0<b>>>0);i=f;return}function oc(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0;y=i;v=a+16|0;c[v>>2]=0;c[a+20>>2]=0;if(!e){b=0;i=y;return b|0}x=a+48|0;e=c[x>>2]|0;f=(e|0)==(b|0);a:do if(!f?(u=a+32|0,l=c[u>>2]|0,k=((e+1|0)>>>0)%(l>>>0)|0,(k|0)!=(b|0)):0){t=a+28|0;w=c[(c[a>>2]|0)+((c[t>>2]|0)*40|0)>>2]|0;r=a+40|0;p=a+24|0;o=a+44|0;q=a+56|0;s=a+12|0;n=k;while(1){k=c[r>>2]|0;if(!k)k=0;else{j=c[a>>2]|0;h=0;do{if(((c[j+(h*40|0)+20>>2]|0)+-1|0)>>>0<2){e=c[j+(h*40|0)+12>>2]|0;c[j+(h*40|0)+8>>2]=e-(e>>>0>n>>>0?l:0)}h=h+1|0}while((h|0)!=(k|0))}if(k>>>0>=(c[p>>2]|0)>>>0){if(!k){e=1;g=46;break}f=c[a>>2]|0;h=0;l=-1;j=0;while(1){if(((c[f+(h*40|0)+20>>2]|0)+-1|0)>>>0<2){e=c[f+(h*40|0)+8>>2]|0;m=(e|0)<(j|0)|(l|0)==-1;g=m?h:l;j=m?e:j}else g=l;h=h+1|0;if((h|0)==(k|0))break;else l=g}if((g|0)<=-1){e=1;g=46;break}l=k+-1|0;c[f+(g*40|0)+20>>2]=0;c[r>>2]=l;if(!(c[f+(g*40|0)+24>>2]|0)){c[o>>2]=(c[o>>2]|0)+-1;k=l}else k=l}l=c[o>>2]|0;m=c[t>>2]|0;if(l>>>0>=m>>>0){e=(c[q>>2]|0)==0;do if(e){g=c[a>>2]|0;f=0;j=2147483647;h=0;do{if(c[g+(f*40|0)+24>>2]|0){A=c[g+(f*40|0)+16>>2]|0;z=(A|0)<(j|0);j=z?A:j;h=z?g+(f*40|0)|0:h}f=f+1|0}while(f>>>0<=m>>>0);if((h|0)!=0?(f=c[v>>2]|0,g=c[s>>2]|0,c[g+(f<<4)>>2]=c[h>>2],c[g+(f<<4)+12>>2]=c[h+36>>2],c[g+(f<<4)+4>>2]=c[h+28>>2],c[g+(f<<4)+8>>2]=c[h+32>>2],c[v>>2]=f+1,c[h+24>>2]=0,(c[h+20>>2]|0)==0):0){l=l+-1|0;c[o>>2]=l}}while(l>>>0>=m>>>0)}e=c[a>>2]|0;c[e+(m*40|0)+20>>2]=1;c[e+(m*40|0)+12>>2]=n;c[e+(m*40|0)+8>>2]=n;c[e+(m*40|0)+16>>2]=0;c[e+(m*40|0)+24>>2]=0;c[o>>2]=l+1;c[r>>2]=k+1;rc(e,m+1|0);l=c[u>>2]|0;n=((n+1|0)>>>0)%(l>>>0)|0;if((n|0)==(b|0)){g=31;break}}if((g|0)==31){g=c[v>>2]|0;if(!g){g=41;break}e=c[s>>2]|0;h=c[t>>2]|0;j=c[a>>2]|0;l=j+(h*40|0)|0;k=c[l>>2]|0;f=0;while(1){if((c[e+(f<<4)>>2]|0)==(k|0))break;f=f+1|0;if(f>>>0>=g>>>0){g=41;break a}}if(!h){g=41;break}else e=0;while(1){f=j+(e*40|0)|0;e=e+1|0;if((c[f>>2]|0)==(w|0))break;if(e>>>0>=h>>>0){g=41;break a}}c[f>>2]=k;c[l>>2]=w;g=41;break}else if((g|0)==46){i=y;return e|0}}else g=39;while(0);if((g|0)==39)if(d)if(f){b=1;i=y;return b|0}else g=41;do if((g|0)==41){if(!d){e=c[x>>2]|0;break}c[x>>2]=b;b=0;i=y;return b|0}while(0);if((e|0)==(b|0)){b=0;i=y;return b|0}a=c[a+32>>2]|0;c[x>>2]=((b+-1+a|0)>>>0)%(a>>>0)|0;b=0;i=y;return b|0}function pc(a){a=a|0;var b=0,d=0,e=0;e=i;d=a+20|0;b=c[d>>2]|0;if(b>>>0>=(c[a+16>>2]|0)>>>0){b=0;i=e;return b|0}a=c[a+12>>2]|0;c[d>>2]=b+1;b=a+(b<<4)|0;i=e;return b|0}function qc(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0;k=i;f=c[a>>2]|0;if(!f){i=k;return}c[a+60>>2]=1;if(c[a+56>>2]|0){i=k;return}g=c[a+28>>2]|0;h=a+16|0;j=a+12|0;e=a+44|0;a=0;b=2147483647;d=0;while(1){if(c[f+(a*40|0)+24>>2]|0){m=c[f+(a*40|0)+16>>2]|0;l=(m|0)<(b|0);b=l?m:b;d=l?f+(a*40|0)|0:d}a=a+1|0;if(a>>>0<=g>>>0)continue;if(!d)break;l=c[h>>2]|0;b=c[j>>2]|0;c[b+(l<<4)>>2]=c[d>>2];c[b+(l<<4)+12>>2]=c[d+36>>2];c[b+(l<<4)+4>>2]=c[d+28>>2];c[b+(l<<4)+8>>2]=c[d+32>>2];c[h>>2]=l+1;c[d+24>>2]=0;if(c[d+20>>2]|0){a=0;b=2147483647;d=0;continue}c[e>>2]=(c[e>>2]|0)+-1;a=0;b=2147483647;d=0}i=k;return}function rc(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;v=i;i=i+32|0;q=v+16|0;t=v;o=7;do{if(o>>>0<b>>>0){n=o;do{m=a+(n*40|0)|0;l=c[m>>2]|0;m=c[m+4>>2]|0;p=c[a+(n*40|0)+8>>2]|0;k=a+(n*40|0)+12|0;s=c[k+4>>2]|0;r=q;c[r>>2]=c[k>>2];c[r+4>>2]=s;r=c[a+(n*40|0)+20>>2]|0;s=c[a+(n*40|0)+24>>2]|0;k=a+(n*40|0)+28|0;c[t+0>>2]=c[k+0>>2];c[t+4>>2]=c[k+4>>2];c[t+8>>2]=c[k+8>>2];a:do if(n>>>0<o>>>0){d=n;u=8}else{f=(s|0)==0;j=r+-1|0;k=j>>>0<2;b:do if(!r){e=n;while(1){d=e-o|0;if(c[a+(d*40|0)+20>>2]|0){d=e;break b}if((c[a+(d*40|0)+24>>2]|0)!=0|f){d=e;break b}e=a+(e*40|0)+0|0;g=a+(d*40|0)+0|0;h=e+40|0;do{c[e>>2]=c[g>>2];e=e+4|0;g=g+4|0}while((e|0)<(h|0));if(d>>>0<o>>>0){u=8;break a}else e=d}}else{d=n;while(1){f=d-o|0;e=c[a+(f*40|0)+20>>2]|0;do if(e){e=e+-1|0;if((e|j)>>>0<2){e=c[a+(f*40|0)+8>>2]|0;if((e|0)>(p|0))break b;d=a+(d*40|0)|0;if((e|0)<(p|0))break;else break a}if(e>>>0<2)break b;if(!k?(c[a+(f*40|0)+8>>2]|0)<=(p|0):0)break b;else u=16}else u=16;while(0);if((u|0)==16){u=0;d=a+(d*40|0)|0}e=d+0|0;g=a+(f*40|0)+0|0;h=e+40|0;do{c[e>>2]=c[g>>2];e=e+4|0;g=g+4|0}while((e|0)<(h|0));if(f>>>0<o>>>0){d=f;u=8;break a}else d=f}}while(0);d=a+(d*40|0)|0}while(0);if((u|0)==8){u=0;d=a+(d*40|0)|0}k=d;c[k>>2]=l;c[k+4>>2]=m;c[d+8>>2]=p;k=q;l=c[k+4>>2]|0;m=d+12|0;c[m>>2]=c[k>>2];c[m+4>>2]=l;c[d+20>>2]=r;c[d+24>>2]=s;m=d+28|0;c[m+0>>2]=c[t+0>>2];c[m+4>>2]=c[t+4>>2];c[m+8>>2]=c[t+8>>2];n=n+1|0}while((n|0)!=(b|0))}o=o>>>1}while((o|0)!=0);i=v;return}function sc(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0;l=i;e=c[a+4>>2]|0;f=c[a+16>>2]|0;g=c[a+20>>2]|0;j=e<<2;k=b+256|0;h=16;a=c[a+12>>2]|0;d=b;while(1){m=c[d+4>>2]|0;c[a>>2]=c[d>>2];c[a+4>>2]=m;m=c[d+12>>2]|0;c[a+8>>2]=c[d+8>>2];c[a+12>>2]=m;h=h+-1|0;if(!h)break;else{a=a+(j<<2)|0;d=d+16|0}}j=e<<1&2147483646;h=c[b+260>>2]|0;c[f>>2]=c[k>>2];c[f+4>>2]=h;k=c[b+268>>2]|0;c[f+(j<<2)>>2]=c[b+264>>2];c[f+((j|1)<<2)>>2]=k;k=e<<2;h=c[b+276>>2]|0;c[f+(k<<2)>>2]=c[b+272>>2];c[f+((k|1)<<2)>>2]=h;k=k+j|0;h=c[b+284>>2]|0;c[f+(k<<2)>>2]=c[b+280>>2];c[f+((k|1)<<2)>>2]=h;k=k+j|0;h=c[b+292>>2]|0;c[f+(k<<2)>>2]=c[b+288>>2];c[f+((k|1)<<2)>>2]=h;k=k+j|0;h=c[b+300>>2]|0;c[f+(k<<2)>>2]=c[b+296>>2];c[f+((k|1)<<2)>>2]=h;k=k+j|0;h=c[b+308>>2]|0;c[f+(k<<2)>>2]=c[b+304>>2];c[f+((k|1)<<2)>>2]=h;k=k+j|0;h=c[b+316>>2]|0;c[f+(k<<2)>>2]=c[b+312>>2];c[f+((k|1)<<2)>>2]=h;k=c[b+324>>2]|0;c[g>>2]=c[b+320>>2];c[g+4>>2]=k;k=c[b+332>>2]|0;c[g+(j<<2)>>2]=c[b+328>>2];c[g+((j|1)<<2)>>2]=k;k=e<<2;h=c[b+340>>2]|0;c[g+(k<<2)>>2]=c[b+336>>2];c[g+((k|1)<<2)>>2]=h;k=k+j|0;h=c[b+348>>2]|0;c[g+(k<<2)>>2]=c[b+344>>2];c[g+((k|1)<<2)>>2]=h;k=k+j|0;h=c[b+356>>2]|0;c[g+(k<<2)>>2]=c[b+352>>2];c[g+((k|1)<<2)>>2]=h;k=k+j|0;h=c[b+364>>2]|0;c[g+(k<<2)>>2]=c[b+360>>2];c[g+((k|1)<<2)>>2]=h;k=k+j|0;h=c[b+372>>2]|0;c[g+(k<<2)>>2]=c[b+368>>2];c[g+((k|1)<<2)>>2]=h;k=k+j|0;j=c[b+380>>2]|0;c[g+(k<<2)>>2]=c[b+376>>2];c[g+((k|1)<<2)>>2]=j;i=l;return}function tc(b,e,f,g){b=b|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0;y=i;r=c[b+4>>2]|0;s=Z(c[b+8>>2]|0,r)|0;w=(e>>>0)%(r>>>0)|0;x=c[b>>2]|0;u=e-w|0;b=(u<<8)+(w<<4)|0;v=s<<8;w=w<<3;p=r<<4;o=r<<2&1073741820;l=o<<1;m=l+o|0;n=0;do{k=c[3344+(n<<2)>>2]|0;j=c[3408+(n<<2)>>2]|0;e=(j<<4)+k|0;h=f+e|0;j=b+k+(Z(j,p)|0)|0;k=x+j|0;q=c[g+(n<<6)>>2]|0;if((q|0)==16777215){j=c[f+(e+16)>>2]|0;c[k>>2]=c[h>>2];c[k+(o<<2)>>2]=j;j=c[f+(e+48)>>2]|0;c[k+(l<<2)>>2]=c[f+(e+32)>>2];c[k+(m<<2)>>2]=j}else{A=d[f+(e+1)>>0]|0;z=c[g+(n<<6)+4>>2]|0;a[k>>0]=a[3472+(q+512+(d[h>>0]|0))>>0]|0;q=d[f+(e+2)>>0]|0;t=c[g+(n<<6)+8>>2]|0;a[x+(j+1)>>0]=a[3472+((A|512)+z)>>0]|0;k=d[f+(e+3)>>0]|0;h=c[g+(n<<6)+12>>2]|0;a[x+(j+2)>>0]=a[3472+(t+512+q)>>0]|0;a[x+(j+3)>>0]=a[3472+(h+512+k)>>0]|0;k=j+p|0;h=d[f+(e+17)>>0]|0;j=c[g+(n<<6)+20>>2]|0;a[x+k>>0]=a[3472+((c[g+(n<<6)+16>>2]|0)+512+(d[f+(e+16)>>0]|0))>>0]|0;q=d[f+(e+18)>>0]|0;t=c[g+(n<<6)+24>>2]|0;a[x+(k+1)>>0]=a[3472+((h|512)+j)>>0]|0;j=d[f+(e+19)>>0]|0;h=c[g+(n<<6)+28>>2]|0;a[x+(k+2)>>0]=a[3472+(t+512+q)>>0]|0;a[x+(k+3)>>0]=a[3472+(h+512+j)>>0]|0;k=k+p|0;j=d[f+(e+33)>>0]|0;h=c[g+(n<<6)+36>>2]|0;a[x+k>>0]=a[3472+((c[g+(n<<6)+32>>2]|0)+512+(d[f+(e+32)>>0]|0))>>0]|0;q=d[f+(e+34)>>0]|0;t=c[g+(n<<6)+40>>2]|0;a[x+(k+1)>>0]=a[3472+((j|512)+h)>>0]|0;h=d[f+(e+35)>>0]|0;j=c[g+(n<<6)+44>>2]|0;a[x+(k+2)>>0]=a[3472+(t+512+q)>>0]|0;a[x+(k+3)>>0]=a[3472+(j+512+h)>>0]|0;k=k+p|0;h=d[f+(e+49)>>0]|0;j=c[g+(n<<6)+52>>2]|0;a[x+k>>0]=a[3472+((c[g+(n<<6)+48>>2]|0)+512+(d[f+(e+48)>>0]|0))>>0]|0;q=d[f+(e+50)>>0]|0;t=c[g+(n<<6)+56>>2]|0;a[x+(k+1)>>0]=a[3472+((h|512)+j)>>0]|0;j=d[f+(e+51)>>0]|0;h=c[g+(n<<6)+60>>2]|0;a[x+(k+2)>>0]=a[3472+(t+512+q)>>0]|0;a[x+(k+3)>>0]=a[3472+(h+512+j)>>0]|0}n=n+1|0}while((n|0)!=16);t=s<<6;s=r<<3&2147483640;r=f+256|0;f=f+320|0;l=w+v+(u<<6)|0;p=s>>>2;j=s>>>1;k=j+p|0;o=16;do{q=o&3;h=c[3344+(q<<2)>>2]|0;q=c[3408+(q<<2)>>2]|0;e=o>>>0>19;m=e?f:r;n=(q<<3)+h|0;b=m+n|0;q=l+(e?t:0)+h+(Z(q,s)|0)|0;h=x+q|0;e=c[g+(o<<6)>>2]|0;if((e|0)==16777215){z=c[m+(n+8)>>2]|0;c[h>>2]=c[b>>2];c[h+(p<<2)>>2]=z;z=c[m+(n+24)>>2]|0;c[h+(j<<2)>>2]=c[m+(n+16)>>2];c[h+(k<<2)>>2]=z}else{v=d[m+(n+1)>>0]|0;z=c[g+(o<<6)+4>>2]|0;a[h>>0]=a[3472+(e+512+(d[b>>0]|0))>>0]|0;w=d[m+(n+2)>>0]|0;u=c[g+(o<<6)+8>>2]|0;a[x+(q+1)>>0]=a[3472+((v|512)+z)>>0]|0;z=d[m+(n+3)>>0]|0;v=c[g+(o<<6)+12>>2]|0;a[x+(q+2)>>0]=a[3472+(u+512+w)>>0]|0;a[x+(q+3)>>0]=a[3472+(v+512+z)>>0]|0;z=q+s|0;v=d[m+(n+9)>>0]|0;w=c[g+(o<<6)+20>>2]|0;a[x+z>>0]=a[3472+((c[g+(o<<6)+16>>2]|0)+512+(d[m+(n+8)>>0]|0))>>0]|0;u=d[m+(n+10)>>0]|0;q=c[g+(o<<6)+24>>2]|0;a[x+(z+1)>>0]=a[3472+((v|512)+w)>>0]|0;w=d[m+(n+11)>>0]|0;v=c[g+(o<<6)+28>>2]|0;a[x+(z+2)>>0]=a[3472+(q+512+u)>>0]|0;a[x+(z+3)>>0]=a[3472+(v+512+w)>>0]|0;z=z+s|0;w=d[m+(n+17)>>0]|0;v=c[g+(o<<6)+36>>2]|0;a[x+z>>0]=a[3472+((c[g+(o<<6)+32>>2]|0)+512+(d[m+(n+16)>>0]|0))>>0]|0;u=d[m+(n+18)>>0]|0;q=c[g+(o<<6)+40>>2]|0;a[x+(z+1)>>0]=a[3472+((w|512)+v)>>0]|0;v=d[m+(n+19)>>0]|0;w=c[g+(o<<6)+44>>2]|0;a[x+(z+2)>>0]=a[3472+(q+512+u)>>0]|0;a[x+(z+3)>>0]=a[3472+(w+512+v)>>0]|0;z=z+s|0;v=d[m+(n+25)>>0]|0;w=c[g+(o<<6)+52>>2]|0;a[x+z>>0]=a[3472+((c[g+(o<<6)+48>>2]|0)+512+(d[m+(n+24)>>0]|0))>>0]|0;u=d[m+(n+26)>>0]|0;q=c[g+(o<<6)+56>>2]|0;a[x+(z+1)>>0]=a[3472+((v|512)+w)>>0]|0;w=d[m+(n+27)>>0]|0;v=c[g+(o<<6)+60>>2]|0;a[x+(z+2)>>0]=a[3472+(q+512+u)>>0]|0;a[x+(z+3)>>0]=a[3472+(v+512+w)>>0]|0}o=o+1|0}while((o|0)!=24);i=y;return}function uc(e,f){e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,_=0,$=0,aa=0,ba=0,ca=0,da=0,ea=0,fa=0,ga=0,ha=0,ia=0,ja=0,ka=0,la=0,ma=0,na=0,oa=0,pa=0,qa=0,ra=0,sa=0,ta=0,ua=0,va=0,wa=0,xa=0,ya=0,za=0,Aa=0,Ba=0,Ca=0,Da=0,Ea=0,Fa=0,Ga=0,Ha=0,Ia=0,Ja=0,Ka=0,La=0,Ma=0,Na=0,Pa=0,Qa=0,Ra=0,Sa=0,Ta=0,Ua=0,Va=0,Wa=0,Xa=0,Ya=0,Za=0,_a=0,$a=0,ab=0,bb=0;bb=i;i=i+176|0;ia=bb+40|0;La=bb;ea=c[e+4>>2]|0;ka=e+8|0;Wa=c[ka>>2]|0;g=Z(Wa,ea)|0;if(!Wa){i=bb;return}Za=ia+24|0;_a=ia+16|0;$a=ia+8|0;la=ia+100|0;ma=ia+68|0;na=ia+36|0;oa=ia+4|0;Ma=ia+120|0;Na=ia+112|0;Pa=ia+104|0;Qa=ia+96|0;Ra=ia+88|0;Sa=ia+80|0;Ta=ia+72|0;Ua=ia+64|0;Va=ia+56|0;Wa=ia+48|0;Xa=ia+40|0;Ya=ia+32|0;pa=ia+124|0;qa=ia+116|0;ra=ia+108|0;sa=ia+92|0;ta=ia+84|0;ua=ia+76|0;va=ia+60|0;wa=ia+52|0;xa=ia+44|0;ya=ia+28|0;za=ia+20|0;Aa=ia+12|0;ha=La+28|0;ja=La+32|0;Ka=La+24|0;Da=ea<<4;Ja=0-Da|0;Ca=Ja<<1;Ha=Z(ea,-48)|0;Ia=ea<<5;Ea=Ja<<2;Ga=ea*48|0;Ba=ea<<6;ga=La+24|0;fa=La+12|0;Fa=g<<8;ba=g<<6;ca=ea<<3;W=Da|4;Y=La+16|0;$=La+20|0;da=La+12|0;X=La+4|0;_=La+8|0;U=0;aa=0;V=f;while(1){f=c[V+8>>2]|0;do if((f|0)!=1){T=V+200|0;n=c[T>>2]|0;do if(!n)g=1;else{if((f|0)==2?(c[V+4>>2]|0)!=(c[n+4>>2]|0):0){g=1;break}g=5}while(0);S=V+204|0;l=c[S>>2]|0;do if(l){if((f|0)==2?(c[V+4>>2]|0)!=(c[l+4>>2]|0):0)break;g=g|2}while(0);R=(g&2|0)==0;do if(R){c[Za>>2]=0;c[_a>>2]=0;c[$a>>2]=0;c[ia>>2]=0;m=0}else{if((c[V>>2]|0)>>>0<=5?(c[l>>2]|0)>>>0<=5:0){if((b[V+28>>1]|0)==0?(b[l+48>>1]|0)==0:0)if((c[V+116>>2]|0)==(c[l+124>>2]|0)?(B=(b[V+132>>1]|0)-(b[l+172>>1]|0)|0,(((B|0)>-1?B:0-B|0)|0)<=3):0){h=(b[V+134>>1]|0)-(b[l+174>>1]|0)|0;h=(((h|0)>-1?h:0-h|0)|0)>3&1}else h=1;else h=2;c[ia>>2]=h;if((b[V+30>>1]|0)==0?(b[l+50>>1]|0)==0:0)if((c[V+116>>2]|0)==(c[l+124>>2]|0)?(B=(b[V+136>>1]|0)-(b[l+176>>1]|0)|0,(((B|0)>-1?B:0-B|0)|0)<=3):0){j=(b[V+138>>1]|0)-(b[l+178>>1]|0)|0;j=(((j|0)>-1?j:0-j|0)|0)>3&1}else j=1;else j=2;c[$a>>2]=j;if((b[V+36>>1]|0)==0?(b[l+56>>1]|0)==0:0)if((c[V+120>>2]|0)==(c[l+128>>2]|0)?(B=(b[V+148>>1]|0)-(b[l+188>>1]|0)|0,(((B|0)>-1?B:0-B|0)|0)<=3):0){k=(b[V+150>>1]|0)-(b[l+190>>1]|0)|0;k=(((k|0)>-1?k:0-k|0)|0)>3&1}else k=1;else k=2;c[_a>>2]=k;if((b[V+38>>1]|0)==0?(b[l+58>>1]|0)==0:0)if((c[V+120>>2]|0)==(c[l+128>>2]|0)?(B=(b[V+152>>1]|0)-(b[l+192>>1]|0)|0,(((B|0)>-1?B:0-B|0)|0)<=3):0){f=(b[V+154>>1]|0)-(b[l+194>>1]|0)|0;f=(((f|0)>-1?f:0-f|0)|0)>3&1}else f=1;else f=2;c[Za>>2]=f;m=(j|h|k|f|0)!=0&1;break}c[Za>>2]=4;c[_a>>2]=4;c[$a>>2]=4;c[ia>>2]=4;m=1}while(0);Q=(g&4|0)==0;do if(Q){c[la>>2]=0;c[ma>>2]=0;c[na>>2]=0;c[oa>>2]=0;k=c[V>>2]|0}else{k=c[V>>2]|0;if(k>>>0<=5?(c[n>>2]|0)>>>0<=5:0){if((b[V+28>>1]|0)==0?(b[n+38>>1]|0)==0:0)if((c[V+116>>2]|0)==(c[n+120>>2]|0)?(B=(b[V+132>>1]|0)-(b[n+152>>1]|0)|0,(((B|0)>-1?B:0-B|0)|0)<=3):0){j=(b[V+134>>1]|0)-(b[n+154>>1]|0)|0;j=(((j|0)>-1?j:0-j|0)|0)>3&1}else j=1;else j=2;c[oa>>2]=j;if((b[V+32>>1]|0)==0?(b[n+42>>1]|0)==0:0)if((c[V+116>>2]|0)==(c[n+120>>2]|0)?(B=(b[V+140>>1]|0)-(b[n+160>>1]|0)|0,(((B|0)>-1?B:0-B|0)|0)<=3):0){h=(b[V+142>>1]|0)-(b[n+162>>1]|0)|0;h=(((h|0)>-1?h:0-h|0)|0)>3&1}else h=1;else h=2;c[na>>2]=h;if((b[V+44>>1]|0)==0?(b[n+54>>1]|0)==0:0)if((c[V+124>>2]|0)==(c[n+128>>2]|0)?(B=(b[V+164>>1]|0)-(b[n+184>>1]|0)|0,(((B|0)>-1?B:0-B|0)|0)<=3):0){f=(b[V+166>>1]|0)-(b[n+186>>1]|0)|0;f=(((f|0)>-1?f:0-f|0)|0)>3&1}else f=1;else f=2;c[ma>>2]=f;if((b[V+48>>1]|0)==0?(b[n+58>>1]|0)==0:0)if((c[V+124>>2]|0)==(c[n+128>>2]|0)?(B=(b[V+172>>1]|0)-(b[n+192>>1]|0)|0,(((B|0)>-1?B:0-B|0)|0)<=3):0){l=(b[V+174>>1]|0)-(b[n+194>>1]|0)|0;l=(((l|0)>-1?l:0-l|0)|0)>3&1}else l=1;else l=2;c[la>>2]=l;if(m)break;m=(h|j|f|l|0)!=0&1;break}c[la>>2]=4;c[ma>>2]=4;c[na>>2]=4;c[oa>>2]=4;m=1}while(0);if(k>>>0<=5){do if((db(k)|0)!=1){f=c[V>>2]|0;if((f|0)==2){w=V+28|0;x=b[V+32>>1]|0;if(!(x<<16>>16))f=(b[w>>1]|0)!=0?2:0;else f=2;c[Ya>>2]=f;q=b[V+34>>1]|0;A=q<<16>>16==0;if(A)f=(b[V+30>>1]|0)!=0?2:0;else f=2;c[Xa>>2]=f;g=b[V+40>>1]|0;z=g<<16>>16==0;if(z)l=(b[V+36>>1]|0)!=0?2:0;else l=2;c[Wa>>2]=l;v=b[V+42>>1]|0;y=v<<16>>16==0;if(y)l=(b[V+38>>1]|0)!=0?2:0;else l=2;c[Va>>2]=l;h=b[V+48>>1]|0;if(!(h<<16>>16))l=(b[V+44>>1]|0)!=0?2:0;else l=2;c[Qa>>2]=l;k=b[V+50>>1]|0;B=k<<16>>16==0;if(B)l=(b[V+46>>1]|0)!=0?2:0;else l=2;c[Pa>>2]=l;p=b[V+56>>1]|0;f=p<<16>>16==0;if(f)n=(b[V+52>>1]|0)!=0?2:0;else n=2;c[Na>>2]=n;j=(b[V+58>>1]|0)==0;if(j)n=(b[V+54>>1]|0)!=0?2:0;else n=2;c[Ma>>2]=n;r=b[V+44>>1]|0;o=b[V+166>>1]|0;n=b[V+142>>1]|0;do if(!((r|x)<<16>>16)){u=(b[V+164>>1]|0)-(b[V+140>>1]|0)|0;if((((u|0)>-1?u:0-u|0)|0)>3){n=1;break}u=o-n|0;if((((u|0)>-1?u:0-u|0)|0)>3){n=1;break}n=(c[V+124>>2]|0)!=(c[V+116>>2]|0)&1}else n=2;while(0);c[Ua>>2]=n;s=b[V+46>>1]|0;o=b[V+170>>1]|0;n=b[V+146>>1]|0;do if(!((s|q)<<16>>16)){u=(b[V+168>>1]|0)-(b[V+144>>1]|0)|0;if((((u|0)>-1?u:0-u|0)|0)>3){o=1;break}u=o-n|0;if((((u|0)>-1?u:0-u|0)|0)>3){o=1;break}o=(c[V+124>>2]|0)!=(c[V+116>>2]|0)&1}else o=2;while(0);c[Ta>>2]=o;t=b[V+52>>1]|0;o=b[V+182>>1]|0;n=b[V+158>>1]|0;do if(!((t|g)<<16>>16)){u=(b[V+180>>1]|0)-(b[V+156>>1]|0)|0;if((((u|0)>-1?u:0-u|0)|0)>3){o=1;break}u=o-n|0;if((((u|0)>-1?u:0-u|0)|0)>3){o=1;break}o=(c[V+128>>2]|0)!=(c[V+120>>2]|0)&1}else o=2;while(0);c[Sa>>2]=o;u=b[V+54>>1]|0;o=b[V+186>>1]|0;n=b[V+162>>1]|0;do if(!((u|v)<<16>>16)){v=(b[V+184>>1]|0)-(b[V+160>>1]|0)|0;if((((v|0)>-1?v:0-v|0)|0)>3){o=1;break}v=o-n|0;if((((v|0)>-1?v:0-v|0)|0)>3){o=1;break}o=(c[V+128>>2]|0)!=(c[V+120>>2]|0)&1}else o=2;while(0);c[Ra>>2]=o;l=b[V+30>>1]|0;if(!(l<<16>>16))o=(b[w>>1]|0)!=0?2:0;else o=2;c[Aa>>2]=o;n=b[V+36>>1]|0;if(!(n<<16>>16))o=l<<16>>16!=0?2:0;else o=2;c[za>>2]=o;if(!(b[V+38>>1]|0))o=n<<16>>16!=0?2:0;else o=2;c[ya>>2]=o;if(A)n=x<<16>>16!=0?2:0;else n=2;c[xa>>2]=n;if(z)l=q<<16>>16!=0?2:0;else l=2;c[wa>>2]=l;if(y)l=g<<16>>16!=0?2:0;else l=2;c[va>>2]=l;if(!(s<<16>>16))l=r<<16>>16!=0?2:0;else l=2;c[ua>>2]=l;if(!(t<<16>>16))l=s<<16>>16!=0?2:0;else l=2;c[ta>>2]=l;if(!(u<<16>>16))l=t<<16>>16!=0?2:0;else l=2;c[sa>>2]=l;if(B)h=h<<16>>16!=0?2:0;else h=2;c[ra>>2]=h;if(f)f=k<<16>>16!=0?2:0;else f=2;c[qa>>2]=f;if(j)f=p<<16>>16!=0?2:0;else f=2;c[pa>>2]=f;break}else if((f|0)==3){j=V+28|0;v=b[V+32>>1]|0;if(!(v<<16>>16))f=(b[j>>1]|0)!=0?2:0;else f=2;c[Ya>>2]=f;B=b[V+34>>1]|0;p=B<<16>>16==0;if(p)h=(b[V+30>>1]|0)!=0?2:0;else h=2;c[Xa>>2]=h;z=b[V+40>>1]|0;if(!(z<<16>>16))k=(b[V+36>>1]|0)!=0?2:0;else k=2;c[Wa>>2]=k;o=b[V+42>>1]|0;h=o<<16>>16==0;if(h)l=(b[V+38>>1]|0)!=0?2:0;else l=2;c[Va>>2]=l;f=b[V+44>>1]|0;if(!(f<<16>>16))l=v<<16>>16!=0?2:0;else l=2;c[Ua>>2]=l;A=b[V+46>>1]|0;g=A<<16>>16==0;if(g)l=B<<16>>16!=0?2:0;else l=2;c[Ta>>2]=l;y=b[V+52>>1]|0;if(!(y<<16>>16))l=z<<16>>16!=0?2:0;else l=2;c[Sa>>2]=l;k=b[V+54>>1]|0;q=k<<16>>16==0;if(q)l=o<<16>>16!=0?2:0;else l=2;c[Ra>>2]=l;r=b[V+48>>1]|0;if(!(r<<16>>16))n=f<<16>>16!=0?2:0;else n=2;c[Qa>>2]=n;x=b[V+50>>1]|0;s=x<<16>>16==0;if(s)n=A<<16>>16!=0?2:0;else n=2;c[Pa>>2]=n;w=b[V+56>>1]|0;if(!(w<<16>>16))o=y<<16>>16!=0?2:0;else o=2;c[Na>>2]=o;u=(b[V+58>>1]|0)==0;if(u)o=k<<16>>16!=0?2:0;else o=2;c[Ma>>2]=o;t=b[V+30>>1]|0;if(!(t<<16>>16))o=(b[j>>1]|0)!=0?2:0;else o=2;c[Aa>>2]=o;if(!(b[V+38>>1]|0))o=(b[V+36>>1]|0)!=0?2:0;else o=2;c[ya>>2]=o;if(p)n=v<<16>>16!=0?2:0;else n=2;c[xa>>2]=n;if(h)n=z<<16>>16!=0?2:0;else n=2;c[va>>2]=n;if(g)l=f<<16>>16!=0?2:0;else l=2;c[ua>>2]=l;if(q)l=y<<16>>16!=0?2:0;else l=2;c[sa>>2]=l;if(s)l=r<<16>>16!=0?2:0;else l=2;c[ra>>2]=l;if(u)l=w<<16>>16!=0?2:0;else l=2;c[pa>>2]=l;l=b[V+150>>1]|0;k=b[V+138>>1]|0;do if(!((b[V+36>>1]|t)<<16>>16)){v=(b[V+148>>1]|0)-(b[V+136>>1]|0)|0;if((((v|0)>-1?v:0-v|0)|0)>3){l=1;break}v=l-k|0;if((((v|0)>-1?v:0-v|0)|0)>3){l=1;break}l=(c[V+120>>2]|0)!=(c[V+116>>2]|0)&1}else l=2;while(0);c[za>>2]=l;l=b[V+158>>1]|0;k=b[V+146>>1]|0;do if(!((z|B)<<16>>16)){B=(b[V+156>>1]|0)-(b[V+144>>1]|0)|0;if((((B|0)>-1?B:0-B|0)|0)>3){k=1;break}B=l-k|0;if((((B|0)>-1?B:0-B|0)|0)>3){k=1;break}k=(c[V+120>>2]|0)!=(c[V+116>>2]|0)&1}else k=2;while(0);c[wa>>2]=k;l=b[V+182>>1]|0;k=b[V+170>>1]|0;do if(!((y|A)<<16>>16)){B=(b[V+180>>1]|0)-(b[V+168>>1]|0)|0;if((((B|0)>-1?B:0-B|0)|0)>3){f=1;break}B=l-k|0;if((((B|0)>-1?B:0-B|0)|0)>3){f=1;break}f=(c[V+128>>2]|0)!=(c[V+124>>2]|0)&1}else f=2;while(0);c[ta>>2]=f;f=b[V+190>>1]|0;g=b[V+178>>1]|0;do if(!((w|x)<<16>>16)){B=(b[V+188>>1]|0)-(b[V+176>>1]|0)|0;if((((B|0)>-1?B:0-B|0)|0)>3){f=1;break}B=f-g|0;if((((B|0)>-1?B:0-B|0)|0)>3){f=1;break}f=(c[V+128>>2]|0)!=(c[V+124>>2]|0)&1}else f=2;while(0);c[qa>>2]=f;break}else{K=b[V+32>>1]|0;z=b[V+28>>1]|0;P=b[V+142>>1]|0;q=b[V+134>>1]|0;if(!((z|K)<<16>>16)){B=(b[V+140>>1]|0)-(b[V+132>>1]|0)|0;if((((B|0)>-1?B:0-B|0)|0)>3)k=1;else{k=P-q|0;k=(((k|0)>-1?k:0-k|0)|0)>3&1}}else k=2;c[Ya>>2]=k;L=b[V+34>>1]|0;y=b[V+30>>1]|0;O=b[V+146>>1]|0;r=b[V+138>>1]|0;if(!((y|L)<<16>>16)){B=(b[V+144>>1]|0)-(b[V+136>>1]|0)|0;if((((B|0)>-1?B:0-B|0)|0)>3)l=1;else{l=O-r|0;l=(((l|0)>-1?l:0-l|0)|0)>3&1}}else l=2;c[Xa>>2]=l;M=b[V+40>>1]|0;x=b[V+36>>1]|0;N=b[V+158>>1]|0;s=b[V+150>>1]|0;if(!((x|M)<<16>>16)){B=(b[V+156>>1]|0)-(b[V+148>>1]|0)|0;if((((B|0)>-1?B:0-B|0)|0)>3)n=1;else{n=N-s|0;n=(((n|0)>-1?n:0-n|0)|0)>3&1}}else n=2;c[Wa>>2]=n;n=b[V+42>>1]|0;B=b[V+38>>1]|0;J=b[V+162>>1]|0;A=b[V+154>>1]|0;if(!((B|n)<<16>>16)){w=(b[V+160>>1]|0)-(b[V+152>>1]|0)|0;if((((w|0)>-1?w:0-w|0)|0)>3)o=1;else{o=J-A|0;o=(((o|0)>-1?o:0-o|0)|0)>3&1}}else o=2;c[Va>>2]=o;D=b[V+44>>1]|0;I=b[V+166>>1]|0;do if(!((D|K)<<16>>16)){w=(b[V+164>>1]|0)-(b[V+140>>1]|0)|0;if((((w|0)>-1?w:0-w|0)|0)>3)o=1;else{w=I-P|0;if((((w|0)>-1?w:0-w|0)|0)>3){o=1;break}o=(c[V+124>>2]|0)!=(c[V+116>>2]|0)&1}}else o=2;while(0);c[Ua>>2]=o;E=b[V+46>>1]|0;H=b[V+170>>1]|0;do if(!((E|L)<<16>>16)){w=(b[V+168>>1]|0)-(b[V+144>>1]|0)|0;if((((w|0)>-1?w:0-w|0)|0)>3){o=1;break}w=H-O|0;if((((w|0)>-1?w:0-w|0)|0)>3){o=1;break}o=(c[V+124>>2]|0)!=(c[V+116>>2]|0)&1}else o=2;while(0);c[Ta>>2]=o;F=b[V+52>>1]|0;G=b[V+182>>1]|0;do if(!((F|M)<<16>>16)){w=(b[V+180>>1]|0)-(b[V+156>>1]|0)|0;if((((w|0)>-1?w:0-w|0)|0)>3){o=1;break}w=G-N|0;if((((w|0)>-1?w:0-w|0)|0)>3){o=1;break}o=(c[V+128>>2]|0)!=(c[V+120>>2]|0)&1}else o=2;while(0);c[Sa>>2]=o;g=b[V+54>>1]|0;l=b[V+186>>1]|0;do if(!((g|n)<<16>>16)){w=(b[V+184>>1]|0)-(b[V+160>>1]|0)|0;if((((w|0)>-1?w:0-w|0)|0)>3){u=1;break}w=l-J|0;if((((w|0)>-1?w:0-w|0)|0)>3){u=1;break}u=(c[V+128>>2]|0)!=(c[V+120>>2]|0)&1}else u=2;while(0);c[Ra>>2]=u;f=b[V+48>>1]|0;C=b[V+174>>1]|0;do if(!((f|D)<<16>>16)){w=(b[V+172>>1]|0)-(b[V+164>>1]|0)|0;if((((w|0)>-1?w:0-w|0)|0)>3){u=1;break}u=C-I|0;u=(((u|0)>-1?u:0-u|0)|0)>3&1}else u=2;while(0);c[Qa>>2]=u;h=b[V+50>>1]|0;k=b[V+178>>1]|0;do if(!((h|E)<<16>>16)){w=(b[V+176>>1]|0)-(b[V+168>>1]|0)|0;if((((w|0)>-1?w:0-w|0)|0)>3){u=1;break}u=k-H|0;u=(((u|0)>-1?u:0-u|0)|0)>3&1}else u=2;while(0);c[Pa>>2]=u;j=b[V+56>>1]|0;p=b[V+190>>1]|0;do if(!((j|F)<<16>>16)){w=(b[V+188>>1]|0)-(b[V+180>>1]|0)|0;if((((w|0)>-1?w:0-w|0)|0)>3){u=1;break}u=p-G|0;u=(((u|0)>-1?u:0-u|0)|0)>3&1}else u=2;while(0);c[Na>>2]=u;w=b[V+58>>1]|0;t=b[V+194>>1]|0;do if(!((w|g)<<16>>16)){v=(b[V+192>>1]|0)-(b[V+184>>1]|0)|0;if((((v|0)>-1?v:0-v|0)|0)>3){v=1;break}v=t-l|0;v=(((v|0)>-1?v:0-v|0)|0)>3&1}else v=2;while(0);c[Ma>>2]=v;do if(!((y|z)<<16>>16)){z=(b[V+136>>1]|0)-(b[V+132>>1]|0)|0;if((((z|0)>-1?z:0-z|0)|0)>3){u=1;break}u=r-q|0;u=(((u|0)>-1?u:0-u|0)|0)>3&1}else u=2;while(0);c[Aa>>2]=u;do if(!((x|y)<<16>>16)){z=(b[V+148>>1]|0)-(b[V+136>>1]|0)|0;if((((z|0)>-1?z:0-z|0)|0)>3){u=1;break}z=s-r|0;if((((z|0)>-1?z:0-z|0)|0)>3){u=1;break}u=(c[V+120>>2]|0)!=(c[V+116>>2]|0)&1}else u=2;while(0);c[za>>2]=u;do if(!((B|x)<<16>>16)){B=(b[V+152>>1]|0)-(b[V+148>>1]|0)|0;if((((B|0)>-1?B:0-B|0)|0)>3){u=1;break}u=A-s|0;u=(((u|0)>-1?u:0-u|0)|0)>3&1}else u=2;while(0);c[ya>>2]=u;do if(!((L|K)<<16>>16)){B=(b[V+144>>1]|0)-(b[V+140>>1]|0)|0;if((((B|0)>-1?B:0-B|0)|0)>3){o=1;break}o=O-P|0;o=(((o|0)>-1?o:0-o|0)|0)>3&1}else o=2;while(0);c[xa>>2]=o;do if(!((M|L)<<16>>16)){B=(b[V+156>>1]|0)-(b[V+144>>1]|0)|0;if((((B|0)>-1?B:0-B|0)|0)>3){o=1;break}B=N-O|0;if((((B|0)>-1?B:0-B|0)|0)>3){o=1;break}o=(c[V+120>>2]|0)!=(c[V+116>>2]|0)&1}else o=2;while(0);c[wa>>2]=o;do if(!((n|M)<<16>>16)){B=(b[V+160>>1]|0)-(b[V+156>>1]|0)|0;if((((B|0)>-1?B:0-B|0)|0)>3){o=1;break}o=J-N|0;o=(((o|0)>-1?o:0-o|0)|0)>3&1}else o=2;while(0);c[va>>2]=o;do if(!((E|D)<<16>>16)){B=(b[V+168>>1]|0)-(b[V+164>>1]|0)|0;if((((B|0)>-1?B:0-B|0)|0)>3){n=1;break}n=H-I|0;n=(((n|0)>-1?n:0-n|0)|0)>3&1}else n=2;while(0);c[ua>>2]=n;do if(!((F|E)<<16>>16)){B=(b[V+180>>1]|0)-(b[V+168>>1]|0)|0;if((((B|0)>-1?B:0-B|0)|0)>3){n=1;break}B=G-H|0;if((((B|0)>-1?B:0-B|0)|0)>3){n=1;break}n=(c[V+128>>2]|0)!=(c[V+124>>2]|0)&1}else n=2;while(0);c[ta>>2]=n;do if(!((g|F)<<16>>16)){B=(b[V+184>>1]|0)-(b[V+180>>1]|0)|0;if((((B|0)>-1?B:0-B|0)|0)>3){l=1;break}l=l-G|0;l=(((l|0)>-1?l:0-l|0)|0)>3&1}else l=2;while(0);c[sa>>2]=l;do if(!((h|f)<<16>>16)){B=(b[V+176>>1]|0)-(b[V+172>>1]|0)|0;if((((B|0)>-1?B:0-B|0)|0)>3){l=1;break}l=k-C|0;l=(((l|0)>-1?l:0-l|0)|0)>3&1}else l=2;while(0);c[ra>>2]=l;do if(!((j|h)<<16>>16)){B=(b[V+188>>1]|0)-(b[V+176>>1]|0)|0;if((((B|0)>-1?B:0-B|0)|0)>3){k=1;break}B=p-k|0;if((((B|0)>-1?B:0-B|0)|0)>3){k=1;break}k=(c[V+128>>2]|0)!=(c[V+124>>2]|0)&1}else k=2;while(0);c[qa>>2]=k;do if(!((w|j)<<16>>16)){B=(b[V+192>>1]|0)-(b[V+188>>1]|0)|0;if((((B|0)>-1?B:0-B|0)|0)>3){f=1;break}f=t-p|0;f=(((f|0)>-1?f:0-f|0)|0)>3&1}else f=2;while(0);c[pa>>2]=f;break}}else vc(V,ia);while(0);if(!(m|c[Ya>>2]|c[Xa>>2]|c[Wa>>2]|c[Va>>2]|c[Ua>>2]|c[Ta>>2]|c[Sa>>2]|c[Ra>>2]|c[Qa>>2]|c[Pa>>2]|c[Na>>2]|c[Ma>>2]|c[Aa>>2]|c[za>>2]|c[ya>>2]|c[xa>>2]|c[wa>>2]|c[va>>2]|c[ua>>2]|c[ta>>2]|c[sa>>2]|c[ra>>2]|c[qa>>2]|c[pa>>2]))break}else{c[Ma>>2]=3;c[Na>>2]=3;c[Pa>>2]=3;c[Qa>>2]=3;c[Ra>>2]=3;c[Sa>>2]=3;c[Ta>>2]=3;c[Ua>>2]=3;c[Va>>2]=3;c[Wa>>2]=3;c[Xa>>2]=3;c[Ya>>2]=3;c[pa>>2]=3;c[qa>>2]=3;c[ra>>2]=3;c[sa>>2]=3;c[ta>>2]=3;c[ua>>2]=3;c[va>>2]=3;c[wa>>2]=3;c[xa>>2]=3;c[ya>>2]=3;c[za>>2]=3;c[Aa>>2]=3}J=V+20|0;g=c[J>>2]|0;L=V+12|0;k=Oa(0,51,(c[L>>2]|0)+g|0)|0;K=V+16|0;h=Oa(0,51,(c[K>>2]|0)+g|0)|0;j=d[6864+k>>0]|0;c[ha>>2]=j;h=d[6920+h>>0]|0;c[ja>>2]=h;k=6976+(k*3|0)|0;c[Ka>>2]=k;do if(!R){l=c[(c[S>>2]|0)+20>>2]|0;if((l|0)==(g|0)){c[X>>2]=j;c[_>>2]=h;c[La>>2]=k;break}else{A=(g+1+l|0)>>>1;B=Oa(0,51,(c[L>>2]|0)+A|0)|0;A=Oa(0,51,(c[K>>2]|0)+A|0)|0;c[X>>2]=d[6864+B>>0];c[_>>2]=d[6920+A>>0];c[La>>2]=6976+(B*3|0);break}}while(0);do if(!Q){f=c[(c[T>>2]|0)+20>>2]|0;if((f|0)==(g|0)){c[Y>>2]=c[ha>>2];c[$>>2]=c[ja>>2];c[da>>2]=c[Ka>>2];break}else{A=(g+1+f|0)>>>1;B=Oa(0,51,(c[L>>2]|0)+A|0)|0;A=Oa(0,51,(c[K>>2]|0)+A|0)|0;c[Y>>2]=d[6864+B>>0];c[$>>2]=d[6920+A>>0];c[da>>2]=6976+(B*3|0);break}}while(0);M=Z(aa,ea)|0;P=3;o=0;O=(c[e>>2]|0)+((M<<8)+(U<<4))|0;N=ia;while(1){l=c[N+4>>2]|0;if(l)wc(O,l,fa,Da);l=c[N+12>>2]|0;if(l)wc(O+4|0,l,ga,Da);k=N+16|0;m=c[N+20>>2]|0;if(m)wc(O+8|0,m,ga,Da);j=N+24|0;m=c[N+28>>2]|0;if(m)wc(O+12|0,m,ga,Da);n=c[N>>2]|0;l=N+8|0;m=c[l>>2]|0;a:do if(((n|0)==(m|0)?(n|0)==(c[k>>2]|0):0)?(n|0)==(c[j>>2]|0):0){if(!n)break;y=c[La+(o*12|0)+4>>2]|0;x=c[La+(o*12|0)+8>>2]|0;if(n>>>0<4){t=d[(c[La+(o*12|0)>>2]|0)+(n+-1)>>0]|0;k=0-t|0;j=t+1|0;f=O;h=16;while(1){o=f+Ca|0;s=d[o>>0]|0;u=f+Ja|0;r=d[u>>0]|0;q=d[f>>0]|0;m=f+Da|0;g=d[m>>0]|0;B=r-q|0;do if(((B|0)>-1?B:0-B|0)>>>0<y>>>0){B=s-r|0;if(((B|0)>-1?B:0-B|0)>>>0>=x>>>0)break;B=g-q|0;if(((B|0)>-1?B:0-B|0)>>>0>=x>>>0)break;n=d[f+Ha>>0]|0;B=n-r|0;if(((B|0)>-1?B:0-B|0)>>>0<x>>>0){a[o>>0]=(Oa(k,t,((r+1+q|0)>>>1)-(s<<1)+n>>1)|0)+s;o=j}else o=t;n=d[f+Ia>>0]|0;B=n-q|0;if(((B|0)>-1?B:0-B|0)>>>0<x>>>0){a[m>>0]=(Oa(k,t,((r+1+q|0)>>>1)-(g<<1)+n>>1)|0)+g;o=o+1|0}A=Oa(0-o|0,o,s+4-g+(q-r<<2)>>3)|0;B=a[3472+((q|512)-A)>>0]|0;a[u>>0]=a[3472+(A+(r|512))>>0]|0;a[f>>0]=B}while(0);h=h+-1|0;if(!h)break a;else f=f+1|0}}n=(y>>>2)+2|0;t=O;u=16;while(1){m=t+Ca|0;f=d[m>>0]|0;l=t+Ja|0;g=d[l>>0]|0;p=d[t>>0]|0;k=t+Da|0;q=d[k>>0]|0;o=g-p|0;o=(o|0)>-1?o:0-o|0;b:do if(o>>>0<y>>>0){B=f-g|0;if(((B|0)>-1?B:0-B|0)>>>0>=x>>>0)break;B=q-p|0;if(((B|0)>-1?B:0-B|0)>>>0>=x>>>0)break;j=t+Ha|0;r=d[j>>0]|0;h=t+Ia|0;s=d[h>>0]|0;do if(o>>>0<n>>>0){B=r-g|0;if(((B|0)>-1?B:0-B|0)>>>0<x>>>0){B=g+f+p|0;a[l>>0]=(q+4+(B<<1)+r|0)>>>3;a[m>>0]=(B+2+r|0)>>>2;a[j>>0]=(B+4+(r*3|0)+(d[t+Ea>>0]<<1)|0)>>>3}else a[l>>0]=(g+2+(f<<1)+q|0)>>>2;B=s-p|0;if(((B|0)>-1?B:0-B|0)>>>0>=x>>>0)break;B=p+g+q|0;a[t>>0]=(f+4+(B<<1)+s|0)>>>3;a[k>>0]=(B+2+s|0)>>>2;a[h>>0]=(B+4+(s*3|0)+(d[t+Ga>>0]<<1)|0)>>>3;break b}else a[l>>0]=(g+2+(f<<1)+q|0)>>>2;while(0);a[t>>0]=(f+2+p+(q<<1)|0)>>>2}while(0);u=u+-1|0;if(!u)break;else t=t+1|0}}else ab=311;while(0);do if((ab|0)==311){ab=0;if(n){xc(O,n,La+(o*12|0)|0,Da);m=c[l>>2]|0}if(m)xc(O+4|0,m,La+(o*12|0)|0,Da);m=c[k>>2]|0;if(m)xc(O+8|0,m,La+(o*12|0)|0,Da);l=c[j>>2]|0;if(!l)break;xc(O+12|0,l,La+(o*12|0)|0,Da)}while(0);if(!P)break;else{P=P+-1|0;o=2;O=O+Ba|0;N=N+32|0}}h=c[V+24>>2]|0;g=c[192+((Oa(0,51,(c[J>>2]|0)+h|0)|0)<<2)>>2]|0;m=Oa(0,51,(c[L>>2]|0)+g|0)|0;j=Oa(0,51,(c[K>>2]|0)+g|0)|0;k=d[6864+m>>0]|0;c[ha>>2]=k;j=d[6920+j>>0]|0;c[ja>>2]=j;m=6976+(m*3|0)|0;c[Ka>>2]=m;do if(!R){l=c[(c[S>>2]|0)+20>>2]|0;if((l|0)==(c[J>>2]|0)){c[X>>2]=k;c[_>>2]=j;c[La>>2]=m;break}else{A=(g+1+(c[192+((Oa(0,51,l+h|0)|0)<<2)>>2]|0)|0)>>>1;B=Oa(0,51,A+(c[L>>2]|0)|0)|0;A=Oa(0,51,(c[K>>2]|0)+A|0)|0;c[X>>2]=d[6864+B>>0];c[_>>2]=d[6920+A>>0];c[La>>2]=6976+(B*3|0);break}}while(0);do if(!Q){f=c[(c[T>>2]|0)+20>>2]|0;if((f|0)==(c[J>>2]|0)){c[Y>>2]=c[ha>>2];c[$>>2]=c[ja>>2];c[da>>2]=c[Ka>>2];break}else{A=(g+1+(c[192+((Oa(0,51,f+h|0)|0)<<2)>>2]|0)|0)>>>1;B=Oa(0,51,A+(c[L>>2]|0)|0)|0;A=Oa(0,51,(c[K>>2]|0)+A|0)|0;c[Y>>2]=d[6864+B>>0];c[$>>2]=d[6920+A>>0];c[da>>2]=6976+(B*3|0);break}}while(0);j=c[e>>2]|0;l=(U<<3)+Fa+(M<<6)|0;n=j+l|0;l=j+(l+ba)|0;j=0;h=ia;o=0;while(1){g=h+4|0;f=c[g>>2]|0;if(f){yc(n,f,fa,ca);yc(l,c[g>>2]|0,fa,ca)}g=h+36|0;f=c[g>>2]|0;if(f){yc(n+Da|0,f,fa,ca);yc(l+Da|0,c[g>>2]|0,fa,ca)}m=h+16|0;g=h+20|0;f=c[g>>2]|0;if(f){yc(n+4|0,f,ga,ca);yc(l+4|0,c[g>>2]|0,ga,ca)}g=h+52|0;f=c[g>>2]|0;if(f){yc(n+W|0,f,ga,ca);yc(l+W|0,c[g>>2]|0,ga,ca)}g=c[h>>2]|0;k=h+8|0;f=c[k>>2]|0;do if((g|0)==(f|0)){if((g|0)!=(c[m>>2]|0)){ab=342;break}if((g|0)!=(c[h+24>>2]|0)){ab=342;break}if(!g)break;B=La+(j*12|0)|0;zc(n,g,B,ca);zc(l,c[h>>2]|0,B,ca)}else ab=342;while(0);do if((ab|0)==342){ab=0;if(g){f=La+(j*12|0)|0;Ac(n,g,f,ca);Ac(l,c[h>>2]|0,f,ca);f=c[k>>2]|0}if(f){B=La+(j*12|0)|0;Ac(n+2|0,f,B,ca);Ac(l+2|0,c[k>>2]|0,B,ca)}f=c[m>>2]|0;if(f){B=La+(j*12|0)|0;Ac(n+4|0,f,B,ca);Ac(l+4|0,c[m>>2]|0,B,ca)}g=h+24|0;f=c[g>>2]|0;if(!f)break;B=La+(j*12|0)|0;Ac(n+6|0,f,B,ca);Ac(l+6|0,c[g>>2]|0,B,ca)}while(0);o=o+1|0;if((o|0)==2)break;else{n=n+Ia|0;l=l+Ia|0;j=2;h=h+64|0}}}while(0);f=U+1|0;g=(f|0)==(ea|0);aa=(g&1)+aa|0;if(aa>>>0>=(c[ka>>2]|0)>>>0)break;else{U=g?0:f;V=V+216|0}}i=bb;return}function vc(a,d){a=a|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0;B=i;l=a+28|0;y=b[a+32>>1]|0;if(!(y<<16>>16))e=(b[l>>1]|0)!=0?2:0;else e=2;c[d+32>>2]=e;z=b[a+34>>1]|0;x=z<<16>>16==0;if(x)e=(b[a+30>>1]|0)!=0?2:0;else e=2;c[d+40>>2]=e;A=b[a+40>>1]|0;v=A<<16>>16==0;if(v)e=(b[a+36>>1]|0)!=0?2:0;else e=2;c[d+48>>2]=e;f=b[a+42>>1]|0;w=f<<16>>16==0;if(w)e=(b[a+38>>1]|0)!=0?2:0;else e=2;c[d+56>>2]=e;s=b[a+44>>1]|0;if(!(s<<16>>16))e=y<<16>>16!=0?2:0;else e=2;c[d+64>>2]=e;t=b[a+46>>1]|0;p=t<<16>>16==0;if(p)e=z<<16>>16!=0?2:0;else e=2;c[d+72>>2]=e;u=b[a+52>>1]|0;q=u<<16>>16==0;if(q)e=A<<16>>16!=0?2:0;else e=2;c[d+80>>2]=e;g=b[a+54>>1]|0;r=g<<16>>16==0;if(r)e=f<<16>>16!=0?2:0;else e=2;c[d+88>>2]=e;m=b[a+48>>1]|0;if(!(m<<16>>16))e=s<<16>>16!=0?2:0;else e=2;c[d+96>>2]=e;n=b[a+50>>1]|0;h=n<<16>>16==0;if(h)e=t<<16>>16!=0?2:0;else e=2;c[d+104>>2]=e;o=b[a+56>>1]|0;j=o<<16>>16==0;if(j)f=u<<16>>16!=0?2:0;else f=2;c[d+112>>2]=f;k=(b[a+58>>1]|0)==0;if(k)f=g<<16>>16!=0?2:0;else f=2;c[d+120>>2]=f;g=b[a+30>>1]|0;if(!(g<<16>>16))f=(b[l>>1]|0)!=0?2:0;else f=2;c[d+12>>2]=f;e=b[a+36>>1]|0;if(!(e<<16>>16))f=g<<16>>16!=0?2:0;else f=2;c[d+20>>2]=f;if(!(b[a+38>>1]|0))e=e<<16>>16!=0?2:0;else e=2;c[d+28>>2]=e;if(x)e=y<<16>>16!=0?2:0;else e=2;c[d+44>>2]=e;if(v)e=z<<16>>16!=0?2:0;else e=2;c[d+52>>2]=e;if(w)e=A<<16>>16!=0?2:0;else e=2;c[d+60>>2]=e;if(p)e=s<<16>>16!=0?2:0;else e=2;c[d+76>>2]=e;if(q)e=t<<16>>16!=0?2:0;else e=2;c[d+84>>2]=e;if(r)e=u<<16>>16!=0?2:0;else e=2;c[d+92>>2]=e;if(h)e=m<<16>>16!=0?2:0;else e=2;c[d+108>>2]=e;if(j)e=n<<16>>16!=0?2:0;else e=2;c[d+116>>2]=e;if(!k){y=2;z=d+124|0;c[z>>2]=y;i=B;return}y=o<<16>>16!=0?2:0;z=d+124|0;c[z>>2]=y;i=B;return}function wc(b,e,f,g){b=b|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;w=i;u=c[f+4>>2]|0;v=c[f+8>>2]|0;if(e>>>0<4){l=d[(c[f>>2]|0)+(e+-1)>>0]|0;n=0-l|0;m=l+1|0;k=4;while(1){f=b+-2|0;s=d[f>>0]|0;t=b+-1|0;r=d[t>>0]|0;q=d[b>>0]|0;j=b+1|0;h=d[j>>0]|0;o=r-q|0;if((((o|0)>-1?o:0-o|0)>>>0<u>>>0?(o=s-r|0,((o|0)>-1?o:0-o|0)>>>0<v>>>0):0)?(o=h-q|0,((o|0)>-1?o:0-o|0)>>>0<v>>>0):0){e=d[b+-3>>0]|0;p=d[b+2>>0]|0;o=e-r|0;if(((o|0)>-1?o:0-o|0)>>>0<v>>>0){a[f>>0]=(Oa(n,l,((r+1+q|0)>>>1)-(s<<1)+e>>1)|0)+s;f=m}else f=l;o=p-q|0;if(((o|0)>-1?o:0-o|0)>>>0<v>>>0){a[j>>0]=(Oa(n,l,((r+1+q|0)>>>1)-(h<<1)+p>>1)|0)+h;f=f+1|0}j=Oa(0-f|0,f,s+4-h+(q-r<<2)>>3)|0;o=a[3472+((q|512)-j)>>0]|0;a[t>>0]=a[3472+((r|512)+j)>>0]|0;a[b>>0]=o}k=k+-1|0;if(!k)break;else b=b+g|0}i=w;return}t=(u>>>2)+2|0;s=4;while(1){k=b+-2|0;q=d[k>>0]|0;l=b+-1|0;r=d[l>>0]|0;m=d[b>>0]|0;e=b+1|0;n=d[e>>0]|0;f=r-m|0;f=(f|0)>-1?f:0-f|0;do if((f>>>0<u>>>0?(o=q-r|0,((o|0)>-1?o:0-o|0)>>>0<v>>>0):0)?(o=n-m|0,((o|0)>-1?o:0-o|0)>>>0<v>>>0):0){h=b+-3|0;o=d[h>>0]|0;j=b+2|0;p=d[j>>0]|0;if(f>>>0<t>>>0){f=o-r|0;if(((f|0)>-1?f:0-f|0)>>>0<v>>>0){f=r+q+m|0;a[l>>0]=(n+4+(f<<1)+o|0)>>>3;a[k>>0]=(f+2+o|0)>>>2;a[h>>0]=(f+4+(o*3|0)+((d[b+-4>>0]|0)<<1)|0)>>>3}else a[l>>0]=(r+2+(q<<1)+n|0)>>>2;o=p-m|0;if(((o|0)>-1?o:0-o|0)>>>0<v>>>0){o=m+r+n|0;a[b>>0]=(q+4+(o<<1)+p|0)>>>3;a[e>>0]=(o+2+p|0)>>>2;a[j>>0]=(o+4+(p*3|0)+((d[b+3>>0]|0)<<1)|0)>>>3;break}}else a[l>>0]=(r+2+(q<<1)+n|0)>>>2;a[b>>0]=(q+2+m+(n<<1)|0)>>>2}while(0);s=s+-1|0;if(!s)break;else b=b+g|0}i=w;return}function xc(b,e,f,g){b=b|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0;A=i;u=d[(c[f>>2]|0)+(e+-1)>>0]|0;w=0-g|0;v=w<<1;t=f+4|0;o=f+8|0;q=Z(g,-3)|0;s=0-u|0;p=u+1|0;r=g<<1;n=4;while(1){e=b+v|0;k=b+w|0;j=b+g|0;f=a[j>>0]|0;l=d[k>>0]|0;m=d[b>>0]|0;h=l-m|0;if((((h|0)>-1?h:0-h|0)>>>0<(c[t>>2]|0)>>>0?(y=d[e>>0]|0,h=y-l|0,x=c[o>>2]|0,((h|0)>-1?h:0-h|0)>>>0<x>>>0):0)?(z=f&255,f=z-m|0,((f|0)>-1?f:0-f|0)>>>0<x>>>0):0){f=d[b+q>>0]|0;h=f-l|0;if(((h|0)>-1?h:0-h|0)>>>0<x>>>0){a[e>>0]=(Oa(s,u,((l+1+m|0)>>>1)-(y<<1)+f>>1)|0)+y;e=c[o>>2]|0;f=p}else{e=x;f=u}h=d[b+r>>0]|0;B=h-m|0;if(((B|0)>-1?B:0-B|0)>>>0<e>>>0){a[j>>0]=(Oa(s,u,((l+1+m|0)>>>1)-(z<<1)+h>>1)|0)+z;f=f+1|0}f=Oa(0-f|0,f,4-z+(m-l<<2)+y>>3)|0;e=a[3472+((m|512)-f)>>0]|0;a[k>>0]=a[3472+((l|512)+f)>>0]|0;a[b>>0]=e}n=n+-1|0;if(!n)break;else b=b+1|0}i=A;return}
function ya(a){a=a|0;var b=0;b=i;i=i+a|0;i=i+15&-16;return b|0}function za(){return i|0}function Aa(a){a=a|0;i=a}function Ba(a,b){a=a|0;b=b|0;if(!m){m=a;n=b}}function Ca(b){b=b|0;a[k>>0]=a[b>>0];a[k+1>>0]=a[b+1>>0];a[k+2>>0]=a[b+2>>0];a[k+3>>0]=a[b+3>>0]}function Da(b){b=b|0;a[k>>0]=a[b>>0];a[k+1>>0]=a[b+1>>0];a[k+2>>0]=a[b+2>>0];a[k+3>>0]=a[b+3>>0];a[k+4>>0]=a[b+4>>0];a[k+5>>0]=a[b+5>>0];a[k+6>>0]=a[b+6>>0];a[k+7>>0]=a[b+7>>0]}function Ea(a){a=a|0;B=a}function Fa(){return B|0}function Ga(a,b,e,f){a=a|0;b=b|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0;k=i;g=d[8+b>>0]|0;j=d[64+b>>0]|0;b=c[120+(j*12|0)>>2]<<g;h=c[124+(j*12|0)>>2]<<g;g=c[128+(j*12|0)>>2]<<g;if(!e)c[a>>2]=Z(c[a>>2]|0,b)|0;a:do if(!(f&65436)){if(f&98){n=a+4|0;l=Z(c[n>>2]|0,h)|0;j=a+20|0;m=Z(c[j>>2]|0,b)|0;e=a+24|0;g=Z(c[e>>2]|0,h)|0;h=c[a>>2]|0;b=(l>>1)-g|0;g=l+(g>>1)|0;l=m+h+32|0;f=l+g>>6;c[a>>2]=f;m=h-m+32|0;h=m+b>>6;c[n>>2]=h;b=m-b>>6;c[a+8>>2]=b;g=l-g>>6;c[a+12>>2]=g;c[a+48>>2]=f;c[a+32>>2]=f;c[a+16>>2]=f;c[a+52>>2]=h;c[a+36>>2]=h;c[j>>2]=h;c[a+56>>2]=b;c[a+40>>2]=b;c[e>>2]=b;c[a+60>>2]=g;c[a+44>>2]=g;c[a+28>>2]=g;if((f+512|0)>>>0>1023|(h+512|0)>>>0>1023|(b+512|0)>>>0>1023|(g+512|0)>>>0>1023)g=1;else break;i=k;return g|0}g=(c[a>>2]|0)+32>>6;if((g+512|0)>>>0>1023){m=1;i=k;return m|0}else{c[a+60>>2]=g;c[a+56>>2]=g;c[a+52>>2]=g;c[a+48>>2]=g;c[a+44>>2]=g;c[a+40>>2]=g;c[a+36>>2]=g;c[a+32>>2]=g;c[a+28>>2]=g;c[a+24>>2]=g;c[a+20>>2]=g;c[a+16>>2]=g;c[a+12>>2]=g;c[a+8>>2]=g;c[a+4>>2]=g;c[a>>2]=g;break}}else{z=a+4|0;s=a+56|0;w=a+60|0;t=c[w>>2]|0;u=Z(c[z>>2]|0,h)|0;c[s>>2]=Z(c[s>>2]|0,h)|0;c[w>>2]=Z(t,g)|0;w=a+8|0;t=c[w>>2]|0;s=a+16|0;y=Z(c[a+20>>2]|0,b)|0;o=Z(c[s>>2]|0,g)|0;q=a+12|0;p=c[q>>2]|0;f=Z(c[a+32>>2]|0,h)|0;e=Z(c[a+24>>2]|0,h)|0;r=c[a+28>>2]|0;j=Z(c[a+48>>2]|0,g)|0;n=Z(c[a+36>>2]|0,h)|0;l=c[a+44>>2]|0;m=Z(c[a+40>>2]|0,g)|0;g=Z(c[a+52>>2]|0,h)|0;x=c[a>>2]|0;v=y+x|0;y=x-y|0;x=(u>>1)-e|0;u=(e>>1)+u|0;e=u+v|0;c[a>>2]=e;c[z>>2]=x+y;c[w>>2]=y-x;c[q>>2]=v-u;q=Z(h,r+t|0)|0;r=Z(t-r|0,h)|0;h=(o>>1)-j|0;o=(j>>1)+o|0;j=o+q|0;c[s>>2]=j;c[a+20>>2]=h+r;c[a+24>>2]=r-h;c[a+28>>2]=q-o;o=Z(b,l+p|0)|0;b=Z(p-l|0,b)|0;l=(f>>1)-g|0;f=(g>>1)+f|0;h=f+o|0;c[a+32>>2]=h;c[a+36>>2]=l+b;c[a+40>>2]=b-l;c[a+44>>2]=o-f;f=a+56|0;o=c[f>>2]|0;l=o+n|0;o=n-o|0;b=a+60|0;g=c[b>>2]|0;n=(m>>1)-g|0;m=(g>>1)+m|0;g=m+l|0;c[a+48>>2]=g;c[a+52>>2]=n+o;c[f>>2]=o-n;c[b>>2]=l-m;b=j;j=3;while(1){v=(b>>1)-g|0;g=(g>>1)+b|0;w=h+e+32|0;x=w+g>>6;c[a>>2]=x;b=e-h+32|0;y=b+v>>6;c[a+16>>2]=y;b=b-v>>6;c[a+32>>2]=b;g=w-g>>6;c[a+48>>2]=g;if((x+512|0)>>>0>1023|(y+512|0)>>>0>1023){g=1;b=14;break}if((b+512|0)>>>0>1023|(g+512|0)>>>0>1023){g=1;b=14;break}f=a+4|0;if(!j)break a;e=c[f>>2]|0;h=c[a+36>>2]|0;b=c[a+20>>2]|0;g=c[a+52>>2]|0;a=f;j=j+-1|0}if((b|0)==14){i=k;return g|0}}while(0);y=0;i=k;return y|0}function Ha(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0;B=i;e=a[64+d>>0]|0;s=a[8+d>>0]|0;D=b+8|0;u=c[D>>2]|0;j=c[b+20>>2]|0;q=b+16|0;y=c[q>>2]|0;r=b+32|0;z=c[r>>2]|0;E=b+12|0;v=c[E>>2]|0;f=c[b+24>>2]|0;m=c[b+28>>2]|0;o=b+48|0;g=c[o>>2]|0;C=c[b+36>>2]|0;A=c[b+40>>2]|0;F=c[b+44>>2]|0;h=c[b+52>>2]|0;p=c[b>>2]|0;l=j+p|0;j=p-j|0;p=b+4|0;x=c[p>>2]|0;t=x-f|0;x=f+x|0;f=x+l|0;c[b>>2]=f;k=t+j|0;c[p>>2]=k;t=j-t|0;c[D>>2]=t;x=l-x|0;c[E>>2]=x;E=m+u|0;m=u-m|0;u=y-g|0;y=g+y|0;g=y+E|0;c[q>>2]=g;l=u+m|0;c[b+20>>2]=l;u=m-u|0;c[b+24>>2]=u;y=E-y|0;c[b+28>>2]=y;E=F+v|0;F=v-F|0;v=z-h|0;z=h+z|0;h=z+E|0;c[b+32>>2]=h;m=v+F|0;c[b+36>>2]=m;v=F-v|0;c[b+40>>2]=v;z=E-z|0;c[b+44>>2]=z;E=b+56|0;F=c[E>>2]|0;D=F+C|0;F=C-F|0;C=b+60|0;j=c[C>>2]|0;w=A-j|0;A=j+A|0;j=A+D|0;c[b+48>>2]=j;n=w+F|0;c[b+52>>2]=n;w=F-w|0;c[E>>2]=w;A=D-A|0;c[C>>2]=A;s=s&255;e=c[120+((e&255)*12|0)>>2]|0;if(d>>>0>11){d=e<<s+-2;s=h+f|0;h=f-h|0;f=g-j|0;e=j+g|0;c[b>>2]=Z(e+s|0,d)|0;c[q>>2]=Z(f+h|0,d)|0;c[r>>2]=Z(h-f|0,d)|0;c[o>>2]=Z(s-e|0,d)|0;r=m+k|0;e=k-m|0;q=l-n|0;s=n+l|0;c[p>>2]=Z(s+r|0,d)|0;c[b+20>>2]=Z(q+e|0,d)|0;c[b+36>>2]=Z(e-q|0,d)|0;c[b+52>>2]=Z(r-s|0,d)|0;s=v+t|0;t=t-v|0;v=u-w|0;w=w+u|0;c[b+8>>2]=Z(w+s|0,d)|0;c[b+24>>2]=Z(v+t|0,d)|0;c[b+40>>2]=Z(t-v|0,d)|0;c[b+56>>2]=Z(s-w|0,d)|0;w=z+x|0;v=x-z|0;x=y-A|0;y=A+y|0;c[b+12>>2]=Z(y+w|0,d)|0;c[b+28>>2]=Z(x+v|0,d)|0;c[b+44>>2]=Z(v-x|0,d)|0;c[b+60>>2]=Z(w-y|0,d)|0;i=B;return}else{C=(d+-6|0)>>>0<6?1:2;d=2-s|0;s=h+f|0;D=f-h|0;h=g-j|0;f=j+g|0;c[b>>2]=(Z(f+s|0,e)|0)+C>>d;c[q>>2]=(Z(h+D|0,e)|0)+C>>d;c[r>>2]=(Z(D-h|0,e)|0)+C>>d;c[o>>2]=(Z(s-f|0,e)|0)+C>>d;r=m+k|0;f=k-m|0;q=l-n|0;s=n+l|0;c[p>>2]=(Z(s+r|0,e)|0)+C>>d;c[b+20>>2]=(Z(q+f|0,e)|0)+C>>d;c[b+36>>2]=(Z(f-q|0,e)|0)+C>>d;c[b+52>>2]=(Z(r-s|0,e)|0)+C>>d;s=v+t|0;t=t-v|0;v=u-w|0;w=w+u|0;c[b+8>>2]=(Z(w+s|0,e)|0)+C>>d;c[b+24>>2]=(Z(v+t|0,e)|0)+C>>d;c[b+40>>2]=(Z(t-v|0,e)|0)+C>>d;c[b+56>>2]=(Z(s-w|0,e)|0)+C>>d;w=z+x|0;v=x-z|0;x=y-A|0;y=A+y|0;c[b+12>>2]=(Z(y+w|0,e)|0)+C>>d;c[b+28>>2]=(Z(x+v|0,e)|0)+C>>d;c[b+44>>2]=(Z(v-x|0,e)|0)+C>>d;c[b+60>>2]=(Z(w-y|0,e)|0)+C>>d;i=B;return}}function Ia(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0;e=c[120+((d[64+b>>0]|0)*12|0)>>2]|0;if(b>>>0>5){e=e<<(d[8+b>>0]|0)+-1;b=0}else b=1;k=c[a>>2]|0;g=a+8|0;h=c[g>>2]|0;m=h+k|0;h=k-h|0;k=a+4|0;j=c[k>>2]|0;l=a+12|0;f=c[l>>2]|0;i=j-f|0;j=f+j|0;c[a>>2]=(Z(j+m|0,e)|0)>>b;c[k>>2]=(Z(m-j|0,e)|0)>>b;c[g>>2]=(Z(i+h|0,e)|0)>>b;c[l>>2]=(Z(h-i|0,e)|0)>>b;l=a+16|0;i=c[l>>2]|0;h=a+24|0;g=c[h>>2]|0;k=g+i|0;g=i-g|0;i=a+20|0;j=c[i>>2]|0;a=a+28|0;m=c[a>>2]|0;f=j-m|0;j=m+j|0;c[l>>2]=(Z(j+k|0,e)|0)>>b;c[i>>2]=(Z(k-j|0,e)|0)>>b;c[h>>2]=(Z(f+g|0,e)|0)>>b;c[a>>2]=(Z(g-f|0,e)|0)>>b;return}function Ja(a,b){a=a|0;b=b|0;var c=0,d=0;d=i;b=1<<b+-1;if(!(b&a)){c=b;b=0}else{b=0;i=d;return b|0}do{b=b+1|0;c=c>>>1}while((c|0)!=0&(c&a|0)==0);i=d;return b|0}function Ka(a){a=a|0;var b=0,d=0;d=i;b=8-(c[a+8>>2]|0)|0;a=jb(a,b)|0;if((a|0)==-1){a=1;i=d;return a|0}a=(a|0)!=(c[400+(b+-1<<2)>>2]|0)&1;i=d;return a|0}function La(a){a=a|0;var b=0,d=0,e=0,f=0;d=i;f=c[a+12>>2]<<3;e=c[a+16>>2]|0;b=f-e|0;if((f|0)==(e|0)){a=0;i=d;return a|0}if(b>>>0>8){a=1;i=d;return a|0}else{a=((kb(a)|0)>>>(32-b|0)|0)!=(1<<b+-1|0)&1;i=d;return a|0}return 0}function Ma(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0;f=i;e=c[a+(d<<2)>>2]|0;do{d=d+1|0;if(d>>>0>=b>>>0)break}while((c[a+(d<<2)>>2]|0)!=(e|0));i=f;return ((d|0)==(b|0)?0:d)|0}function Na(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;e=c[a+4>>2]|0;f=(b>>>0)%(e>>>0)|0;d=b-f|0;b=Z(c[a+8>>2]|0,e)|0;e=c[a>>2]|0;c[a+12>>2]=e+((d<<8)+(f<<4));d=(f<<3)+(b<<8)+(d<<6)|0;c[a+16>>2]=e+d;c[a+20>>2]=e+(d+(b<<6));return}function Oa(a,b,c){a=a|0;b=b|0;c=c|0;if((c|0)>=(a|0))a=(c|0)>(b|0)?b:c;return a|0}function Pa(b,e,f,g){b=b|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;s=i;a:do if(((e>>>0>3?(a[b>>0]|0)==0:0)?(a[b+1>>0]|0)==0:0)?(h=a[b+2>>0]|0,(h&255)<2):0){b:do if((e|0)!=3){p=-3;q=3;k=b+3|0;j=2;while(1){if(h<<24>>24)if(h<<24>>24==1&j>>>0>1){o=q;h=0;m=0;l=0;break}else j=0;else j=j+1|0;l=q+1|0;if((l|0)==(e|0))break b;h=a[k>>0]|0;p=~q;q=l;k=k+1|0}while(1){r=a[k>>0]|0;n=o+1|0;j=r<<24>>24!=0;l=(j&1^1)+l|0;h=r<<24>>24==3&(l|0)==2?1:h;if(r<<24>>24==1&l>>>0>1){r=14;break}if(j){m=l>>>0>2?1:m;l=0}if((n|0)==(e|0)){r=18;break}else{o=n;k=k+1|0}}if((r|0)==14){n=p+o-l|0;c[f+12>>2]=n;j=q;l=l-(l>>>0<3?l:3)|0;break a}else if((r|0)==18){n=p+e-l|0;c[f+12>>2]=n;j=q;break a}}while(0);c[g>>2]=e;q=1;i=s;return q|0}else r=19;while(0);if((r|0)==19){c[f+12>>2]=e;n=e;h=1;j=0;m=0;l=0}k=b+j|0;c[f>>2]=k;c[f+4>>2]=k;c[f+8>>2]=0;c[f+16>>2]=0;o=f+12|0;c[g>>2]=l+j+n;if(m){q=1;i=s;return q|0}if(!h){q=0;i=s;return q|0}l=c[o>>2]|0;h=k;m=k;j=0;c:while(1){while(1){q=l;l=l+-1|0;if(!q){r=31;break c}k=a[h>>0]|0;if((j|0)!=2)break;if(k<<24>>24!=3){r=29;break}if(!l){h=1;r=32;break c}h=h+1|0;if((d[h>>0]|0)>3){h=1;r=32;break c}else j=0}if((r|0)==29){r=0;if((k&255)<3){h=1;r=32;break}else j=2}a[m>>0]=k;h=h+1|0;m=m+1|0;j=k<<24>>24==0?j+1|0:0}if((r|0)==31){c[o>>2]=m-h+(c[o>>2]|0);q=0;i=s;return q|0}else if((r|0)==32){i=s;return h|0}return 0}function Qa(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0;o=i;i=i+16|0;n=o;id(b,0,92);f=jb(a,8)|0;a:do if((((f|0)!=-1?(c[b>>2]=f,jb(a,1)|0,jb(a,1)|0,(jb(a,1)|0)!=-1):0)?(jb(a,5)|0)!=-1:0)?(e=jb(a,8)|0,(e|0)!=-1):0){m=b+4|0;c[m>>2]=e;f=b+8|0;d=nb(a,f)|0;if(!d)if((c[f>>2]|0)>>>0<=31){d=nb(a,n)|0;if(!d){f=c[n>>2]|0;if(f>>>0<=12){c[b+12>>2]=1<<f+4;d=nb(a,n)|0;if(!d){f=c[n>>2]|0;if(f>>>0<=2){c[b+16>>2]=f;b:do if(!f){d=nb(a,n)|0;if(d)break a;f=c[n>>2]|0;if(f>>>0>12){d=1;break a}c[b+20>>2]=1<<f+4}else if((f|0)==1){f=jb(a,1)|0;if((f|0)==-1){d=1;break a}c[b+24>>2]=(f|0)==1&1;d=ob(a,b+28|0)|0;if(d)break a;d=ob(a,b+32|0)|0;if(d)break a;h=b+36|0;d=nb(a,h)|0;if(d)break a;f=c[h>>2]|0;if(f>>>0>255){d=1;break a}if(!f){c[b+40>>2]=0;break}f=fd(f<<2)|0;g=b+40|0;c[g>>2]=f;if(!f){d=65535;break a}if(c[h>>2]|0){e=0;while(1){d=ob(a,f+(e<<2)|0)|0;e=e+1|0;if(d)break a;if(e>>>0>=(c[h>>2]|0)>>>0)break b;f=c[g>>2]|0}}}while(0);l=b+44|0;d=nb(a,l)|0;if(!d)if((c[l>>2]|0)>>>0<=16?(k=jb(a,1)|0,(k|0)!=-1):0){c[b+48>>2]=(k|0)==1&1;d=nb(a,n)|0;if(!d){e=b+52|0;c[e>>2]=(c[n>>2]|0)+1;d=nb(a,n)|0;if(!d){k=b+56|0;c[k>>2]=(c[n>>2]|0)+1;h=jb(a,1)|0;if((!((h|0)==0|(h|0)==-1)?(jb(a,1)|0)!=-1:0)?(j=jb(a,1)|0,(j|0)!=-1):0){j=(j|0)==1;c[b+60>>2]=j&1;if(j){j=b+64|0;d=nb(a,j)|0;if(d)break;f=b+68|0;d=nb(a,f)|0;if(d)break;h=b+72|0;d=nb(a,h)|0;if(d)break;g=b+76|0;d=nb(a,g)|0;if(d)break;e=c[e>>2]|0;if((c[j>>2]|0)>((e<<3)+~c[f>>2]|0)){d=1;break}f=c[k>>2]|0;if((c[h>>2]|0)>((f<<3)+~c[g>>2]|0)){d=1;break}}else{e=c[e>>2]|0;f=c[k>>2]|0}d=Z(f,e)|0;do switch(c[m>>2]|0){case 11:{f=396;e=345600;g=58;break}case 12:{f=396;e=912384;g=58;break}case 13:{f=396;e=912384;g=58;break}case 20:{f=396;e=912384;g=58;break}case 21:{f=792;e=1824768;g=58;break}case 22:{f=1620;e=3110400;g=58;break}case 30:{f=1620;e=3110400;g=58;break}case 31:{f=3600;e=6912e3;g=58;break}case 32:{f=5120;e=7864320;g=58;break}case 40:{f=8192;e=12582912;g=58;break}case 41:{f=8192;e=12582912;g=58;break}case 42:{f=8704;e=13369344;g=58;break}case 50:{f=22080;e=42393600;g=58;break}case 51:{f=36864;e=70778880;g=58;break}case 10:{f=99;e=152064;g=58;break}default:g=60}while(0);do if((g|0)==58){if(f>>>0<d>>>0){g=60;break}e=(e>>>0)/((d*384|0)>>>0)|0;e=e>>>0<16?e:16;c[n>>2]=e;f=c[l>>2]|0;if(f>>>0>e>>>0){e=f;g=61}}while(0);if((g|0)==60){c[n>>2]=2147483647;e=c[l>>2]|0;g=61}if((g|0)==61)c[n>>2]=e;g=b+88|0;c[g>>2]=e;e=jb(a,1)|0;if((e|0)==-1){d=1;break}n=(e|0)==1;c[b+80>>2]=n&1;do if(n){e=fd(952)|0;f=b+84|0;c[f>>2]=e;if(!e){d=65535;break a}d=Ec(a,e)|0;if(d)break a;d=c[f>>2]|0;if(!(c[d+920>>2]|0))break;e=c[d+948>>2]|0;if((c[d+944>>2]|0)>>>0>e>>>0){d=1;break a}if(e>>>0<(c[l>>2]|0)>>>0){d=1;break a}if(e>>>0>(c[g>>2]|0)>>>0){d=1;break a}c[g>>2]=(e|0)==0?1:e}while(0);Ka(a)|0;d=0}else d=1}}}else d=1}else d=1}}else d=1}}else d=1}else d=1;while(0);i=o;return d|0}function Ra(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0;j=i;if((c[a>>2]|0)!=(c[b>>2]|0)){d=1;i=j;return d|0}if((c[a+4>>2]|0)!=(c[b+4>>2]|0)){d=1;i=j;return d|0}if((c[a+12>>2]|0)!=(c[b+12>>2]|0)){d=1;i=j;return d|0}d=c[a+16>>2]|0;if((d|0)!=(c[b+16>>2]|0)){d=1;i=j;return d|0}if((c[a+44>>2]|0)!=(c[b+44>>2]|0)){d=1;i=j;return d|0}if((c[a+48>>2]|0)!=(c[b+48>>2]|0)){d=1;i=j;return d|0}if((c[a+52>>2]|0)!=(c[b+52>>2]|0)){d=1;i=j;return d|0}if((c[a+56>>2]|0)!=(c[b+56>>2]|0)){d=1;i=j;return d|0}h=c[a+60>>2]|0;if((h|0)!=(c[b+60>>2]|0)){d=1;i=j;return d|0}if((c[a+80>>2]|0)!=(c[b+80>>2]|0)){d=1;i=j;return d|0}a:do if(!d){if((c[a+20>>2]|0)!=(c[b+20>>2]|0)){d=1;i=j;return d|0}}else if((d|0)==1){if((c[a+24>>2]|0)!=(c[b+24>>2]|0)){d=1;i=j;return d|0}if((c[a+28>>2]|0)!=(c[b+28>>2]|0)){d=1;i=j;return d|0}if((c[a+32>>2]|0)!=(c[b+32>>2]|0)){d=1;i=j;return d|0}d=c[a+36>>2]|0;if((d|0)!=(c[b+36>>2]|0)){d=1;i=j;return d|0}if(d){e=c[a+40>>2]|0;f=c[b+40>>2]|0;g=0;while(1){if((c[e+(g<<2)>>2]|0)!=(c[f+(g<<2)>>2]|0)){d=1;break}g=g+1|0;if(g>>>0>=d>>>0)break a}i=j;return d|0}}while(0);if(h){if((c[a+64>>2]|0)!=(c[b+64>>2]|0)){d=1;i=j;return d|0}if((c[a+68>>2]|0)!=(c[b+68>>2]|0)){d=1;i=j;return d|0}if((c[a+72>>2]|0)!=(c[b+72>>2]|0)){d=1;i=j;return d|0}if((c[a+76>>2]|0)!=(c[b+76>>2]|0)){d=1;i=j;return d|0}}d=0;i=j;return d|0}function Sa(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0;l=i;i=i+16|0;j=l+4|0;k=l;id(b,0,72);d=nb(a,b)|0;if(d){i=l;return d|0}if((c[b>>2]|0)>>>0>255){d=1;i=l;return d|0}e=b+4|0;d=nb(a,e)|0;if(d){i=l;return d|0}if((c[e>>2]|0)>>>0>31){d=1;i=l;return d|0}if(jb(a,1)|0){d=1;i=l;return d|0}d=jb(a,1)|0;if((d|0)==-1){d=1;i=l;return d|0}c[b+8>>2]=(d|0)==1&1;d=nb(a,j)|0;if(d){i=l;return d|0}d=(c[j>>2]|0)+1|0;h=b+12|0;c[h>>2]=d;if(d>>>0>8){d=1;i=l;return d|0}a:do if(d>>>0>1){d=b+16|0;e=nb(a,d)|0;if(e){d=e;i=l;return d|0}d=c[d>>2]|0;if(d>>>0>6){d=1;i=l;return d|0}switch(d|0){case 5:case 4:case 3:{d=jb(a,1)|0;if((d|0)==-1){d=1;i=l;return d|0}c[b+32>>2]=(d|0)==1&1;d=nb(a,j)|0;if(!d){c[b+36>>2]=(c[j>>2]|0)+1;break a}else{i=l;return d|0}}case 0:{d=fd(c[h>>2]<<2)|0;f=b+20|0;c[f>>2]=d;if(!d){d=65535;i=l;return d|0}if(!(c[h>>2]|0))break a;else e=0;while(1){d=nb(a,j)|0;if(d)break;c[(c[f>>2]|0)+(e<<2)>>2]=(c[j>>2]|0)+1;e=e+1|0;if(e>>>0>=(c[h>>2]|0)>>>0)break a}i=l;return d|0}case 2:{e=b+24|0;c[e>>2]=fd((c[h>>2]<<2)+-4|0)|0;d=fd((c[h>>2]<<2)+-4|0)|0;g=b+28|0;c[g>>2]=d;if((c[e>>2]|0)==0|(d|0)==0){d=65535;i=l;return d|0}if((c[h>>2]|0)==1)break a;else f=0;while(1){d=nb(a,j)|0;if(d){e=46;break}c[(c[e>>2]|0)+(f<<2)>>2]=c[j>>2];d=nb(a,j)|0;if(d){e=46;break}c[(c[g>>2]|0)+(f<<2)>>2]=c[j>>2];f=f+1|0;if(f>>>0>=((c[h>>2]|0)+-1|0)>>>0)break a}if((e|0)==46){i=l;return d|0}break}case 6:{d=nb(a,j)|0;if(d){i=l;return d|0}e=(c[j>>2]|0)+1|0;d=b+40|0;c[d>>2]=e;e=fd(e<<2)|0;g=b+44|0;c[g>>2]=e;if(!e){d=65535;i=l;return d|0}f=c[432+((c[h>>2]|0)+-1<<2)>>2]|0;if(!(c[d>>2]|0))break a;else e=0;while(1){m=jb(a,f)|0;c[(c[g>>2]|0)+(e<<2)>>2]=m;e=e+1|0;if(m>>>0>=(c[h>>2]|0)>>>0){d=1;break}if(e>>>0>=(c[d>>2]|0)>>>0)break a}i=l;return d|0}default:break a}}while(0);d=nb(a,j)|0;if(d){a=d;i=l;return a|0}d=c[j>>2]|0;if(d>>>0>31){a=1;i=l;return a|0}c[b+48>>2]=d+1;d=nb(a,j)|0;if(d){a=d;i=l;return a|0}if((c[j>>2]|0)>>>0>31){a=1;i=l;return a|0}if(jb(a,1)|0){a=1;i=l;return a|0}if((jb(a,2)|0)>>>0>2){a=1;i=l;return a|0}d=ob(a,k)|0;if(d){a=d;i=l;return a|0}d=(c[k>>2]|0)+26|0;if(d>>>0>51){a=1;i=l;return a|0}c[b+52>>2]=d;d=ob(a,k)|0;if(d){a=d;i=l;return a|0}if(((c[k>>2]|0)+26|0)>>>0>51){a=1;i=l;return a|0}d=ob(a,k)|0;if(d){a=d;i=l;return a|0}d=c[k>>2]|0;if((d+12|0)>>>0>24){a=1;i=l;return a|0}c[b+56>>2]=d;d=jb(a,1)|0;if((d|0)==-1){a=1;i=l;return a|0}c[b+60>>2]=(d|0)==1&1;d=jb(a,1)|0;if((d|0)==-1){a=1;i=l;return a|0}c[b+64>>2]=(d|0)==1&1;d=jb(a,1)|0;if((d|0)==-1){a=1;i=l;return a|0}c[b+68>>2]=(d|0)==1&1;Ka(a)|0;a=0;i=l;return a|0}function Ta(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;w=i;i=i+32|0;s=w+20|0;q=w+16|0;o=w+12|0;l=w+8|0;v=w+4|0;t=w;id(b,0,988);u=Z(c[d+56>>2]|0,c[d+52>>2]|0)|0;k=nb(a,v)|0;if(k){f=k;i=w;return f|0}n=c[v>>2]|0;c[b>>2]=n;if(n>>>0>=u>>>0){f=1;i=w;return f|0}k=nb(a,v)|0;if(k){f=k;i=w;return f|0}k=c[v>>2]|0;m=b+4|0;c[m>>2]=k;if((k|0)==5|(k|0)==0)j=5;else if(!((k|0)==7|(k|0)==2)){f=1;i=w;return f|0}if((j|0)==5){if((c[f>>2]|0)==5){f=1;i=w;return f|0}if(!(c[d+44>>2]|0)){f=1;i=w;return f|0}}k=nb(a,v)|0;if(k){f=k;i=w;return f|0}n=c[v>>2]|0;c[b+8>>2]=n;if((n|0)!=(c[e>>2]|0)){f=1;i=w;return f|0}n=d+12|0;k=c[n>>2]|0;j=0;while(1)if(!(k>>>j))break;else j=j+1|0;k=jb(a,j+-1|0)|0;if((k|0)==-1){f=1;i=w;return f|0}j=(c[f>>2]|0)==5;if(j&(k|0)!=0){f=1;i=w;return f|0}c[b+12>>2]=k;if(j){k=nb(a,v)|0;if(k){f=k;i=w;return f|0}k=c[v>>2]|0;c[b+16>>2]=k;if(k>>>0>65535){f=1;i=w;return f|0}}g=d+16|0;k=c[g>>2]|0;if(!k){h=d+20|0;k=c[h>>2]|0;j=0;while(1)if(!(k>>>j))break;else j=j+1|0;k=jb(a,j+-1|0)|0;if((k|0)==-1){f=1;i=w;return f|0}j=b+20|0;c[j>>2]=k;do if(c[e+8>>2]|0){k=ob(a,t)|0;if(!k){c[b+24>>2]=c[t>>2];break}else{f=k;i=w;return f|0}}while(0);if((c[f>>2]|0)==5){k=c[j>>2]|0;if(k>>>0>(c[h>>2]|0)>>>1>>>0){f=1;i=w;return f|0}j=c[b+24>>2]|0;if((k|0)!=(((j|0)>0?0:0-j|0)|0)){f=1;i=w;return f|0}}k=c[g>>2]|0}if((k|0)==1?(c[d+24>>2]|0)==0:0){k=ob(a,t)|0;if(k){f=k;i=w;return f|0}k=b+28|0;c[k>>2]=c[t>>2];do if(c[e+8>>2]|0){j=ob(a,t)|0;if(!j){c[b+32>>2]=c[t>>2];break}else{f=j;i=w;return f|0}}while(0);if((c[f>>2]|0)==5?(j=c[k>>2]|0,k=(c[d+32>>2]|0)+j+(c[b+32>>2]|0)|0,(((j|0)<(k|0)?j:k)|0)!=0):0){f=1;i=w;return f|0}}if(c[e+68>>2]|0){k=nb(a,v)|0;if(k){f=k;i=w;return f|0}k=c[v>>2]|0;c[b+36>>2]=k;if(k>>>0>127){f=1;i=w;return f|0}}k=c[m>>2]|0;if((k|0)==5|(k|0)==0){k=jb(a,1)|0;if((k|0)==-1){f=1;i=w;return f|0}c[b+40>>2]=k;do if(!k){k=c[e+48>>2]|0;if(k>>>0>16){f=1;i=w;return f|0}else{c[b+44>>2]=k;break}}else{k=nb(a,v)|0;if(k){f=k;i=w;return f|0}k=c[v>>2]|0;if(k>>>0>15){f=1;i=w;return f|0}else{c[b+44>>2]=k+1;break}}while(0);k=c[m>>2]|0}do if((k|0)==5|(k|0)==0){g=c[b+44>>2]|0;j=c[n>>2]|0;k=jb(a,1)|0;if((k|0)==-1){f=1;i=w;return f|0}c[b+68>>2]=k;if(k){h=0;a:while(1){if(h>>>0>g>>>0){r=1;j=110;break}k=nb(a,l)|0;if(k){r=k;j=110;break}k=c[l>>2]|0;if(k>>>0>3){r=1;j=110;break}c[b+(h*12|0)+72>>2]=k;do if(k>>>0<2){k=nb(a,o)|0;if(k){r=k;j=110;break a}k=c[o>>2]|0;if(k>>>0>=j>>>0){r=1;j=110;break a}c[b+(h*12|0)+76>>2]=k+1}else{if((k|0)!=2)break;k=nb(a,o)|0;if(k){r=k;j=110;break a}c[b+(h*12|0)+80>>2]=c[o>>2]}while(0);if((c[l>>2]|0)==3){j=61;break}else h=h+1|0}if((j|0)==61){if(!h)r=1;else break;i=w;return r|0}else if((j|0)==110){i=w;return r|0}}}while(0);do if(c[f+4>>2]|0){n=c[d+44>>2]|0;f=(c[f>>2]|0)==5;k=jb(a,1)|0;j=(k|0)==-1;if(f){if(j){f=1;i=w;return f|0}c[b+276>>2]=k;g=jb(a,1)|0;if((g|0)==-1){f=1;i=w;return f|0}c[b+280>>2]=g;if((n|0)!=0|(g|0)==0)break;else r=1;i=w;return r|0}if(j){f=1;i=w;return f|0}c[b+284>>2]=k;if(k){j=(n<<1)+2|0;h=0;d=0;g=0;l=0;m=0;while(1){if(h>>>0>j>>>0){r=1;j=110;break}k=nb(a,q)|0;if(k){r=k;j=110;break}k=c[q>>2]|0;if(k>>>0>6){r=1;j=110;break}c[b+(h*20|0)+288>>2]=k;if((k&-3|0)==1){k=nb(a,s)|0;if(k){r=k;j=110;break}c[b+(h*20|0)+292>>2]=(c[s>>2]|0)+1;k=c[q>>2]|0}if((k|0)==2){k=nb(a,s)|0;if(k){r=k;j=110;break}c[b+(h*20|0)+296>>2]=c[s>>2];k=c[q>>2]|0}if((k|0)==3|(k|0)==6){k=nb(a,s)|0;if(k){r=k;j=110;break}c[b+(h*20|0)+300>>2]=c[s>>2];k=c[q>>2]|0}if((k|0)==4){k=nb(a,s)|0;if(k){r=k;j=110;break}k=c[s>>2]|0;if(k>>>0>n>>>0){r=1;j=110;break}if(!k)c[b+(h*20|0)+304>>2]=65535;else c[b+(h*20|0)+304>>2]=k+-1;k=c[q>>2]|0;p=g+1|0}else p=g;l=((k|0)==5&1)+l|0;d=((k|0)!=0&k>>>0<4&1)+d|0;m=((k|0)==6&1)+m|0;if(!k){j=90;break}else{h=h+1|0;g=p}}if((j|0)==90){if(p>>>0>1|l>>>0>1|m>>>0>1){f=1;i=w;return f|0}if((d|0)!=0&(l|0)!=0)r=1;else break;i=w;return r|0}else if((j|0)==110){i=w;return r|0}}}while(0);g=ob(a,t)|0;if(g){f=g;i=w;return f|0}f=c[t>>2]|0;c[b+48>>2]=f;f=f+(c[e+52>>2]|0)|0;c[t>>2]=f;if(f>>>0>51){f=1;i=w;return f|0}do if(c[e+60>>2]|0){g=nb(a,v)|0;if(g){f=g;i=w;return f|0}g=c[v>>2]|0;c[b+52>>2]=g;if(g>>>0>2){f=1;i=w;return f|0}if((g|0)==1)break;g=ob(a,t)|0;if(g){f=g;i=w;return f|0}g=c[t>>2]|0;if((g+6|0)>>>0>12){f=1;i=w;return f|0}c[b+56>>2]=g<<1;g=ob(a,t)|0;if(g){f=g;i=w;return f|0}g=c[t>>2]|0;if((g+6|0)>>>0>12){f=1;i=w;return f|0}else{c[b+60>>2]=g<<1;break}}while(0);do if((c[e+12>>2]|0)>>>0>1?((c[e+16>>2]|0)+-3|0)>>>0<3:0){k=e+36|0;j=c[k>>2]|0;j=(((u>>>0)%(j>>>0)|0|0)==0?1:2)+((u>>>0)/(j>>>0)|0)|0;h=0;while(1){g=h+1|0;if(!(-1<<g&j))break;else h=g}g=jb(a,((1<<h)+-1&j|0)==0?h:g)|0;c[v>>2]=g;if((g|0)==-1){f=1;i=w;return f|0}c[b+64>>2]=g;f=c[k>>2]|0;if(g>>>0>(((u+-1+f|0)>>>0)/(f>>>0)|0)>>>0)r=1;else break;i=w;return r|0}while(0);f=0;i=w;return f|0}function Ua(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;f=i;i=i+32|0;e=f+20|0;d=f;c[d+0>>2]=c[a+0>>2];c[d+4>>2]=c[a+4>>2];c[d+8>>2]=c[a+8>>2];c[d+12>>2]=c[a+12>>2];c[d+16>>2]=c[a+16>>2];a=nb(d,e)|0;if(!a){a=nb(d,e)|0;if(!a){a=nb(d,e)|0;if(!a){a=c[e>>2]|0;if(a>>>0>255)a=1;else{c[b>>2]=a;a=0}}}}i=f;return a|0}function Va(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0;g=i;i=i+32|0;e=g+20|0;f=g;c[f+0>>2]=c[a+0>>2];c[f+4>>2]=c[a+4>>2];c[f+8>>2]=c[a+8>>2];c[f+12>>2]=c[a+12>>2];c[f+16>>2]=c[a+16>>2];a=nb(f,e)|0;if(a){i=g;return a|0}a=nb(f,e)|0;if(a){i=g;return a|0}a=nb(f,e)|0;if(!a)a=0;else{i=g;return a|0}while(1)if(!(b>>>a))break;else a=a+1|0;a=jb(f,a+-1|0)|0;if((a|0)==-1){a=1;i=g;return a|0}c[d>>2]=a;a=0;i=g;return a|0}function Wa(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0;h=i;i=i+32|0;f=h+20|0;g=h;if((d|0)!=5){d=1;i=h;return d|0};c[g+0>>2]=c[a+0>>2];c[g+4>>2]=c[a+4>>2];c[g+8>>2]=c[a+8>>2];c[g+12>>2]=c[a+12>>2];c[g+16>>2]=c[a+16>>2];d=nb(g,f)|0;if(d){i=h;return d|0}d=nb(g,f)|0;if(d){i=h;return d|0}d=nb(g,f)|0;if(!d)d=0;else{i=h;return d|0}while(1)if(!(b>>>d))break;else d=d+1|0;if((jb(g,d+-1|0)|0)==-1){d=1;i=h;return d|0}d=nb(g,e)|0;i=h;return d|0}function Xa(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0;k=i;i=i+32|0;h=k+20|0;j=k;c[j+0>>2]=c[a+0>>2];c[j+4>>2]=c[a+4>>2];c[j+8>>2]=c[a+8>>2];c[j+12>>2]=c[a+12>>2];c[j+16>>2]=c[a+16>>2];a=nb(j,h)|0;if(a){f=a;i=k;return f|0}a=nb(j,h)|0;if(a){f=a;i=k;return f|0}a=nb(j,h)|0;if(a){f=a;i=k;return f|0}a=c[b+12>>2]|0;f=0;while(1)if(!(a>>>f))break;else f=f+1|0;if((jb(j,f+-1|0)|0)==-1){f=1;i=k;return f|0}if((d|0)==5?(g=nb(j,h)|0,(g|0)!=0):0){f=g;i=k;return f|0}f=c[b+20>>2]|0;a=0;while(1)if(!(f>>>a))break;else a=a+1|0;f=jb(j,a+-1|0)|0;if((f|0)==-1){f=1;i=k;return f|0}c[e>>2]=f;f=0;i=k;return f|0}function Ya(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0;k=i;i=i+32|0;h=k+20|0;j=k;c[j+0>>2]=c[a+0>>2];c[j+4>>2]=c[a+4>>2];c[j+8>>2]=c[a+8>>2];c[j+12>>2]=c[a+12>>2];c[j+16>>2]=c[a+16>>2];a=nb(j,h)|0;if(a){f=a;i=k;return f|0}a=nb(j,h)|0;if(a){f=a;i=k;return f|0}a=nb(j,h)|0;if(a){f=a;i=k;return f|0}a=c[b+12>>2]|0;f=0;while(1)if(!(a>>>f))break;else f=f+1|0;if((jb(j,f+-1|0)|0)==-1){f=1;i=k;return f|0}if((d|0)==5?(g=nb(j,h)|0,(g|0)!=0):0){f=g;i=k;return f|0}f=c[b+20>>2]|0;a=0;while(1)if(!(f>>>a))break;else a=a+1|0;if((jb(j,a+-1|0)|0)==-1){f=1;i=k;return f|0}f=ob(j,e)|0;i=k;return f|0}function Za(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0;m=i;i=i+32|0;j=m+20|0;l=m;c[l+0>>2]=c[a+0>>2];c[l+4>>2]=c[a+4>>2];c[l+8>>2]=c[a+8>>2];c[l+12>>2]=c[a+12>>2];c[l+16>>2]=c[a+16>>2];g=nb(l,j)|0;if(g){l=g;i=m;return l|0}g=nb(l,j)|0;if(g){l=g;i=m;return l|0}g=nb(l,j)|0;if(g){l=g;i=m;return l|0}g=c[b+12>>2]|0;a=0;while(1)if(!(g>>>a))break;else a=a+1|0;if((jb(l,a+-1|0)|0)==-1){l=1;i=m;return l|0}if((d|0)==5?(h=nb(l,j)|0,(h|0)!=0):0){l=h;i=m;return l|0}g=ob(l,f)|0;if(g){l=g;i=m;return l|0}if((e|0)!=0?(k=ob(l,f+4|0)|0,(k|0)!=0):0){l=k;i=m;return l|0}l=0;i=m;return l|0}function _a(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0;m=i;i=i+32|0;l=m+24|0;j=m+20|0;k=m;c[k+0>>2]=c[b+0>>2];c[k+4>>2]=c[b+4>>2];c[k+8>>2]=c[b+8>>2];c[k+12>>2]=c[b+12>>2];c[k+16>>2]=c[b+16>>2];f=nb(k,l)|0;if(f){n=f;i=m;return n|0}f=nb(k,l)|0;if(f){n=f;i=m;return n|0}f=nb(k,l)|0;if(f){n=f;i=m;return n|0}f=c[d+12>>2]|0;b=0;while(1)if(!(f>>>b))break;else b=b+1|0;if((jb(k,b+-1|0)|0)==-1){n=1;i=m;return n|0}f=nb(k,l)|0;if(f){n=f;i=m;return n|0}g=d+16|0;f=c[g>>2]|0;if(!f){b=c[d+20>>2]|0;f=0;while(1)if(!(b>>>f))break;else f=f+1|0;if((jb(k,f+-1|0)|0)==-1){n=1;i=m;return n|0}if((c[e+8>>2]|0)!=0?(h=ob(k,j)|0,(h|0)!=0):0){n=h;i=m;return n|0}f=c[g>>2]|0}if((f|0)==1?(c[d+24>>2]|0)==0:0){f=ob(k,j)|0;if(f){n=f;i=m;return n|0}if((c[e+8>>2]|0)!=0?(n=ob(k,j)|0,(n|0)!=0):0){i=m;return n|0}}if((c[e+68>>2]|0)!=0?(o=nb(k,l)|0,(o|0)!=0):0){n=o;i=m;return n|0}n=jb(k,1)|0;c[a>>2]=n;n=(n|0)==-1&1;i=m;return n|0}function $a(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0;C=i;i=i+448|0;p=C+8|0;x=C+4|0;v=C;p=p+(0-p&15)|0;n=c[b+3376>>2]|0;j=c[e>>2]|0;c[x>>2]=0;y=b+1192|0;c[y>>2]=(c[y>>2]|0)+1;q=b+1200|0;c[q>>2]=0;o=b+12|0;c[v>>2]=(c[e+48>>2]|0)+(c[(c[o>>2]|0)+52>>2]|0);w=e+36|0;r=b+1212|0;s=e+52|0;t=e+56|0;u=e+60|0;z=e+4|0;l=e+44|0;h=b+1220|0;m=b+1172|0;B=b+1176|0;k=n+12|0;A=0;f=0;while(1){e=c[r>>2]|0;if((c[w>>2]|0)==0?(c[e+(j*216|0)+196>>2]|0)!=0:0){f=1;e=22;break}g=c[(c[o>>2]|0)+56>>2]|0;F=c[s>>2]|0;E=c[t>>2]|0;D=c[u>>2]|0;c[e+(j*216|0)+4>>2]=c[y>>2];c[e+(j*216|0)+8>>2]=F;c[e+(j*216|0)+12>>2]=E;c[e+(j*216|0)+16>>2]=D;c[e+(j*216|0)+24>>2]=g;e=c[z>>2]|0;if((e|0)!=2?!((e|0)==7|(f|0)!=0):0){f=nb(a,x)|0;if(f){e=22;break}e=c[x>>2]|0;if(e>>>0>((c[B>>2]|0)-j|0)>>>0){f=1;e=22;break}if(!e)f=0;else{id(k,0,164);c[n>>2]=0;f=1}}e=c[x>>2]|0;if(!e){f=bb(a,n,(c[r>>2]|0)+(j*216|0)|0,c[z>>2]|0,c[l>>2]|0)|0;if(!f)g=0;else{e=22;break}}else{c[x>>2]=e+-1;g=f}f=gb((c[r>>2]|0)+(j*216|0)|0,n,d,h,v,j,c[(c[o>>2]|0)+64>>2]|0,p)|0;if(f){e=22;break}A=((c[(c[r>>2]|0)+(j*216|0)+196>>2]|0)==1&1)+A|0;if(!(La(a)|0))e=(c[x>>2]|0)!=0;else e=1;f=c[z>>2]|0;if((f|0)==7|(f|0)==2)c[q>>2]=j;j=Ma(c[m>>2]|0,c[B>>2]|0,j)|0;if(!((j|0)!=0|e^1)){f=1;e=22;break}if(!e){e=20;break}else f=g}if((e|0)==20){e=b+1196|0;f=(c[e>>2]|0)+A|0;if(f>>>0>(c[B>>2]|0)>>>0){y=1;i=C;return y|0}c[e>>2]=f;y=0;i=C;return y|0}else if((e|0)==22){i=C;return f|0}return 0}function ab(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0;k=i;h=c[a+1192>>2]|0;d=c[a+1200>>2]|0;j=a+1212|0;a:do if(!d)d=b;else{e=a+16|0;f=0;do{do{d=d+-1|0;if(d>>>0<=b>>>0)break a}while((c[(c[j>>2]|0)+(d*216|0)+4>>2]|0)!=(h|0));f=f+1|0;g=c[(c[e>>2]|0)+52>>2]|0}while(f>>>0<(g>>>0>10?g:10)>>>0)}while(0);g=a+1172|0;b=a+1176|0;while(1){e=c[j>>2]|0;if((c[e+(d*216|0)+4>>2]|0)!=(h|0)){d=11;break}f=e+(d*216|0)+196|0;e=c[f>>2]|0;if(!e){d=11;break}c[f>>2]=e+-1;d=Ma(c[g>>2]|0,c[b>>2]|0,d)|0;if(!d){d=11;break}}if((d|0)==11){i=k;return}}function bb(a,d,e,f,g){a=a|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0;B=i;i=i+32|0;u=B+20|0;v=B+16|0;q=B+12|0;p=B+8|0;z=B+4|0;y=B;id(d,0,2088);l=nb(a,z)|0;m=c[z>>2]|0;do if((f|0)==2|(f|0)==7){m=m+6|0;if(m>>>0>31|(l|0)!=0){e=1;i=B;return e|0}else{c[d>>2]=m;o=m;break}}else{m=m+1|0;if(m>>>0>31|(l|0)!=0){e=1;i=B;return e|0}else{c[d>>2]=m;o=m;break}}while(0);a:do if((o|0)!=31){b:do if(o>>>0>=6){o=(o|0)!=6;p=o&1;if(!p){c[v>>2]=0;q=0;while(1){f=kb(a)|0;c[u>>2]=f;t=f>>>31;c[d+(q<<2)+12>>2]=t;if(!t){c[d+(q<<2)+76>>2]=f>>>28&7;m=f<<4;n=1}else{m=f<<1;n=0}f=q|1;t=m>>>31;c[d+(f<<2)+12>>2]=t;if(!t){c[d+(f<<2)+76>>2]=m>>>28&7;l=m<<4;n=n+1|0}else l=m<<1;m=f+1|0;t=l>>>31;c[d+(m<<2)+12>>2]=t;if(!t){c[d+(m<<2)+76>>2]=l>>>28&7;m=l<<4;n=n+1|0}else m=l<<1;l=q|3;t=m>>>31;c[d+(l<<2)+12>>2]=t;if(!t){c[d+(l<<2)+76>>2]=m>>>28&7;f=m<<4;n=n+1|0}else f=m<<1;m=l+1|0;t=f>>>31;c[d+(m<<2)+12>>2]=t;if(!t){c[d+(m<<2)+76>>2]=f>>>28&7;f=f<<4;n=n+1|0}else f=f<<1;m=l+2|0;t=f>>>31;c[d+(m<<2)+12>>2]=t;if(!t){c[d+(m<<2)+76>>2]=f>>>28&7;f=f<<4;n=n+1|0}else f=f<<1;m=l+3|0;t=f>>>31;c[d+(m<<2)+12>>2]=t;if(!t){c[d+(m<<2)+76>>2]=f>>>28&7;f=f<<4;n=n+1|0}else f=f<<1;m=q|7;t=f>>>31;c[d+(m<<2)+12>>2]=t;if(!t){c[d+(m<<2)+76>>2]=f>>>28&7;m=f<<4;n=n+1|0}else m=f<<1;c[u>>2]=m;if((lb(a,(n*3|0)+8|0)|0)==-1){w=1;t=68;break b}t=(c[v>>2]|0)+1|0;c[v>>2]=t;if((t|0)<2)q=q+8|0;else{t=52;break}}}else if((p|0)==1)t=52;if((t|0)==52){v=(nb(a,u)|0)!=0;l=c[u>>2]|0;if(v|l>>>0>3){w=1;t=68;break}c[d+140>>2]=l}if(o){v=c[d>>2]|0;s=v+-7|0;u=s>>>2;c[d+4>>2]=(s>>>0>11?u+268435453|0:u)<<4|(v>>>0>18?15:0)}else{x=p;t=70}}else{if((o|0)==0|(o|0)==1){r=v;s=u}else if(!((o|0)==3|(o|0)==2)){f=0;do{l=(nb(a,q)|0)!=0;m=c[q>>2]|0;if(l|m>>>0>3){n=1;t=96;break}c[d+(f<<2)+176>>2]=m;f=f+1|0}while(f>>>0<4);if((t|0)==96){i=B;return n|0}c:do if(g>>>0>1&(o|0)!=5){m=g>>>0>2&1;f=0;while(1){if(qb(a,q,m)|0){n=1;t=96;break}n=c[q>>2]|0;if(n>>>0>=g>>>0){n=1;t=96;break}c[d+(f<<2)+192>>2]=n;f=f+1|0;if(f>>>0>=4){h=0;break c}}if((t|0)==96){i=B;return n|0}}else h=0;while(0);d:while(1){n=c[d+(h<<2)+176>>2]|0;if(!n)n=0;else if((n|0)==2|(n|0)==1)n=1;else n=3;c[q>>2]=n;m=0;while(1){n=ob(a,p)|0;if(n){t=96;break d}b[d+(h<<4)+(m<<2)+208>>1]=c[p>>2];n=ob(a,p)|0;if(n){t=96;break d}b[d+(h<<4)+(m<<2)+210>>1]=c[p>>2];t=c[q>>2]|0;c[q>>2]=t+-1;if(!t)break;else m=m+1|0}h=h+1|0;if(h>>>0>=4){x=2;t=70;break b}}if((t|0)==96){i=B;return n|0}}else{r=v;s=u}if(g>>>0>1){if((o|0)==0|(o|0)==1)n=0;else if((o|0)==3|(o|0)==2)n=1;else n=3;l=g>>>0>2&1;f=0;while(1){if(qb(a,u,l)|0){w=1;t=68;break b}m=c[u>>2]|0;if(m>>>0>=g>>>0){w=1;t=68;break b}c[d+(f<<2)+144>>2]=m;if(!n)break;else{n=n+-1|0;f=f+1|0}}}if((o|0)==0|(o|0)==1){l=0;m=0}else if((o|0)==3|(o|0)==2){l=1;m=0}else{l=3;m=0}while(1){f=ob(a,v)|0;if(f){w=f;t=68;break b}b[d+(m<<2)+160>>1]=c[v>>2];f=ob(a,v)|0;if(f){w=f;t=68;break b}b[d+(m<<2)+162>>1]=c[v>>2];if(!l){x=2;t=70;break}else{l=l+-1|0;m=m+1|0}}}while(0);if((t|0)==68){e=w;i=B;return e|0}do if((t|0)==70){h=pb(a,z,(x|0)==0&1)|0;if(!h){z=c[z>>2]|0;c[d+4>>2]=z;if(!z)break a;else break}else{e=h;i=B;return e|0}}while(0);z=(ob(a,y)|0)!=0;h=c[y>>2]|0;if(z|(h|0)<-26|(h|0)>25){e=1;i=B;return e|0}c[d+8>>2]=h;l=c[d+4>>2]|0;o=d+272|0;e:do if((c[d>>2]|0)>>>0>=7){h=rb(a,d+1864|0,ib(e,0,o)|0,16)|0;if(!(h&15)){b[d+320>>1]=h>>>4&255;h=0;m=3;while(1){n=l>>>1;if(!(l&1))h=h+4|0;else{f=3;while(1){l=rb(a,d+(h<<6)+332|0,ib(e,h,o)|0,15)|0;c[d+(h<<2)+1992>>2]=l>>>15;if(l&15){j=l;break e}b[d+(h<<1)+272>>1]=l>>>4&255;h=h+1|0;if(!f)break;else f=f+-1|0}}if(!m){k=h;A=n;t=87;break}else{l=n;m=m+-1|0}}}else j=h}else{h=0;m=3;while(1){n=l>>>1;if(!(l&1))h=h+4|0;else{f=3;while(1){l=rb(a,d+(h<<6)+328|0,ib(e,h,o)|0,16)|0;c[d+(h<<2)+1992>>2]=l>>>16;if(l&15){j=l;break e}b[d+(h<<1)+272>>1]=l>>>4&255;h=h+1|0;if(!f)break;else f=f+-1|0}}if(!m){k=h;A=n;t=87;break}else{l=n;m=m+-1|0}}}while(0);f:do if((t|0)==87){if(A&3){j=rb(a,d+1928|0,-1,4)|0;if(j&15)break;b[d+322>>1]=j>>>4&255;j=rb(a,d+1944|0,-1,4)|0;if(j&15)break;b[d+324>>1]=j>>>4&255}if(!(A&2))j=0;else{h=7;while(1){j=rb(a,d+(k<<6)+332|0,ib(e,k,o)|0,15)|0;if(j&15)break f;b[d+(k<<1)+272>>1]=j>>>4&255;c[d+(k<<2)+1992>>2]=j>>>15;if(!h){j=0;break}else{k=k+1|0;h=h+-1|0}}}}while(0);c[a+16>>2]=((c[a+4>>2]|0)-(c[a>>2]|0)<<3)+(c[a+8>>2]|0);if(j){e=j;i=B;return e|0}}else{while(1){if(mb(a)|0)break;if(jb(a,1)|0){n=1;t=96;break}}if((t|0)==96){i=B;return n|0}k=0;j=d+328|0;while(1){h=jb(a,8)|0;c[z>>2]=h;if((h|0)==-1){n=1;break}c[j>>2]=h;k=k+1|0;if(k>>>0>=384)break a;else j=j+4|0}i=B;return n|0}while(0);e=0;i=B;return e|0}function cb(a){a=a|0;if(a>>>0<6)a=2;else a=(a|0)!=6&1;return a|0}function db(a){a=a|0;var b=0;b=i;if((a|0)==0|(a|0)==1)a=1;else if((a|0)==3|(a|0)==2)a=2;else a=4;i=b;return a|0}function eb(a){a=a|0;var b=0;b=i;if(!a)a=1;else if((a|0)==2|(a|0)==1)a=2;else a=4;i=b;return a|0}function fb(a){a=a|0;return a+1&3|0}function gb(d,e,f,g,h,j,k,l){d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;v=i;s=c[e>>2]|0;c[d>>2]=s;o=d+196|0;c[o>>2]=(c[o>>2]|0)+1;Na(f,j);if((s|0)==31){m=d+28|0;c[d+20>>2]=0;if((c[o>>2]|0)>>>0>1){b[m>>1]=16;b[d+30>>1]=16;b[d+32>>1]=16;b[d+34>>1]=16;b[d+36>>1]=16;b[d+38>>1]=16;b[d+40>>1]=16;b[d+42>>1]=16;b[d+44>>1]=16;b[d+46>>1]=16;b[d+48>>1]=16;b[d+50>>1]=16;b[d+52>>1]=16;b[d+54>>1]=16;b[d+56>>1]=16;b[d+58>>1]=16;b[d+60>>1]=16;b[d+62>>1]=16;b[d+64>>1]=16;b[d+66>>1]=16;b[d+68>>1]=16;b[d+70>>1]=16;b[d+72>>1]=16;b[d+74>>1]=16;t=0;i=v;return t|0}o=23;h=e+328|0;n=l;while(1){b[m>>1]=16;a[n>>0]=c[h>>2];a[n+1>>0]=c[h+4>>2];a[n+2>>0]=c[h+8>>2];a[n+3>>0]=c[h+12>>2];a[n+4>>0]=c[h+16>>2];a[n+5>>0]=c[h+20>>2];a[n+6>>0]=c[h+24>>2];a[n+7>>0]=c[h+28>>2];a[n+8>>0]=c[h+32>>2];a[n+9>>0]=c[h+36>>2];a[n+10>>0]=c[h+40>>2];a[n+11>>0]=c[h+44>>2];a[n+12>>0]=c[h+48>>2];a[n+13>>0]=c[h+52>>2];a[n+14>>0]=c[h+56>>2];a[n+15>>0]=c[h+60>>2];if(!o)break;else{o=o+-1|0;h=h+64|0;n=n+16|0;m=m+2|0}}sc(f,l);t=0;i=v;return t|0}m=d+28|0;if(s){hd(m,e+272|0,54);n=c[e+8>>2]|0;o=c[h>>2]|0;do if(n){o=o+n|0;c[h>>2]=o;if((o|0)<0){o=o+52|0;c[h>>2]=o;break}if((o|0)>51){o=o+-52|0;c[h>>2]=o}}while(0);r=d+20|0;c[r>>2]=o;n=e+328|0;h=e+1992|0;a:do if((c[d>>2]|0)>>>0<7){q=15;o=m;while(1){if(b[o>>1]|0){if(Ga(n,c[r>>2]|0,0,c[h>>2]|0)|0){m=1;break}}else c[n>>2]=16777215;n=n+64|0;o=o+2|0;h=h+4|0;if(!q)break a;else q=q+-1|0}i=v;return m|0}else{if(!(b[d+76>>1]|0)){q=464;p=15;o=m}else{Ha(e+1864|0,o);q=464;p=15;o=m}while(1){m=c[e+(c[q>>2]<<2)+1864>>2]|0;q=q+4|0;c[n>>2]=m;if((m|0)==0?(b[o>>1]|0)==0:0)c[n>>2]=16777215;else u=18;if((u|0)==18?(u=0,(Ga(n,c[r>>2]|0,1,c[h>>2]|0)|0)!=0):0){m=1;break}n=n+64|0;o=o+2|0;h=h+4|0;if(!p)break a;else p=p+-1|0}i=v;return m|0}while(0);q=c[192+((Oa(0,51,(c[d+24>>2]|0)+(c[r>>2]|0)|0)|0)<<2)>>2]|0;if((b[d+78>>1]|0)==0?(b[d+80>>1]|0)==0:0){p=e+1928|0;m=7}else{p=e+1928|0;Ia(p,q);m=7}while(1){r=c[p>>2]|0;p=p+4|0;c[n>>2]=r;if((r|0)==0?(b[o>>1]|0)==0:0)c[n>>2]=16777215;else u=31;if((u|0)==31?(u=0,(Ga(n,q,1,c[h>>2]|0)|0)!=0):0){m=1;u=39;break}if(!m)break;else{n=n+64|0;h=h+4|0;m=m+-1|0;o=o+2|0}}if((u|0)==39){i=v;return m|0}if(s>>>0>=6){o=Mb(d,e,f,j,k,l)|0;if(o){t=o;i=v;return t|0}}else u=37}else{id(m,0,54);c[d+20>>2]=c[h>>2];u=37}if((u|0)==37?(t=Sb(d,e,g,j,f,l)|0,(t|0)!=0):0){i=v;return t|0}t=0;i=v;return t|0}function hb(a){a=a|0;return a|0}function ib(d,e,f){d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0;k=i;l=vb(e)|0;g=wb(e)|0;h=a[l+4>>0]|0;j=a[g+4>>0]|0;g=(c[g>>2]|0)==4;if((c[l>>2]|0)==4){e=b[f+((h&255)<<1)>>1]|0;if(g){e=e+1+(b[f+((j&255)<<1)>>1]|0)>>1;i=k;return e|0}g=d+204|0;if(!(zb(d,c[g>>2]|0)|0)){i=k;return e|0}e=e+1+(b[(c[g>>2]|0)+((j&255)<<1)+28>>1]|0)>>1;i=k;return e|0}if(g){e=b[f+((j&255)<<1)>>1]|0;g=d+200|0;if(!(zb(d,c[g>>2]|0)|0)){i=k;return e|0}e=e+1+(b[(c[g>>2]|0)+((h&255)<<1)+28>>1]|0)>>1;i=k;return e|0}g=d+200|0;if(!(zb(d,c[g>>2]|0)|0)){h=0;f=0}else{h=b[(c[g>>2]|0)+((h&255)<<1)+28>>1]|0;f=1}g=d+204|0;if(!(zb(d,c[g>>2]|0)|0)){e=h;i=k;return e|0}e=b[(c[g>>2]|0)+((j&255)<<1)+28>>1]|0;if(!f){i=k;return e|0}e=h+1+e>>1;i=k;return e|0}function jb(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;p=i;n=a+4|0;j=c[n>>2]|0;m=c[a+12>>2]<<3;o=a+16|0;l=c[o>>2]|0;g=m-l|0;if((g|0)>31){e=a+8|0;g=c[e>>2]|0;f=(d[j+1>>0]|0)<<16|(d[j>>0]|0)<<24|(d[j+2>>0]|0)<<8|(d[j+3>>0]|0);if(!g)h=e;else{h=e;f=(d[j+4>>0]|0)>>>(8-g|0)|f<<g}}else{h=a+8|0;if((g|0)>0){e=c[h>>2]|0;k=e+24|0;f=(d[j>>0]|0)<<k;g=g+-8+e|0;if((g|0)>0){e=g;g=k;do{j=j+1|0;g=g+-8|0;f=(d[j>>0]|0)<<g|f;e=e+-8|0}while((e|0)>0)}}else f=0}e=l+b|0;c[o>>2]=e;c[h>>2]=e&7;if(e>>>0>m>>>0){n=-1;i=p;return n|0}c[n>>2]=(c[a>>2]|0)+(e>>>3);n=f>>>(32-b|0);i=p;return n|0}function kb(a){a=a|0;var b=0,e=0,f=0,g=0,h=0;g=i;f=c[a+4>>2]|0;e=(c[a+12>>2]<<3)-(c[a+16>>2]|0)|0;if((e|0)>31){b=c[a+8>>2]|0;a=(d[f+1>>0]|0)<<16|(d[f>>0]|0)<<24|(d[f+2>>0]|0)<<8|(d[f+3>>0]|0);if(!b){b=a;i=g;return b|0}b=(d[f+4>>0]|0)>>>(8-b|0)|a<<b;i=g;return b|0}if((e|0)<=0){b=0;i=g;return b|0}h=c[a+8>>2]|0;a=h+24|0;b=(d[f>>0]|0)<<a;e=e+-8+h|0;if((e|0)<=0){i=g;return b|0}do{f=f+1|0;a=a+-8|0;b=(d[f>>0]|0)<<a|b;e=e+-8|0}while((e|0)>0);i=g;return b|0}function lb(a,b){a=a|0;b=b|0;var d=0,e=0;d=i;e=a+16|0;b=(c[e>>2]|0)+b|0;c[e>>2]=b;c[a+8>>2]=b&7;if(b>>>0>c[a+12>>2]<<3>>>0){b=-1;i=d;return b|0}c[a+4>>2]=(c[a>>2]|0)+(b>>>3);b=0;i=d;return b|0}function mb(a){a=a|0;return (c[a+8>>2]|0)==0|0}function nb(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;g=i;d=kb(a)|0;do if((d|0)>=0){if(d>>>0>1073741823){if((lb(a,3)|0)==-1){d=1;break}c[b>>2]=(d>>>29&1)+1;d=0;break}if(d>>>0>536870911){if((lb(a,5)|0)==-1){d=1;break}c[b>>2]=(d>>>27&3)+3;d=0;break}if(d>>>0>268435455){if((lb(a,7)|0)==-1){d=1;break}c[b>>2]=(d>>>25&7)+7;d=0;break}d=Ja(d,28)|0;e=d+4|0;if((e|0)!=32){lb(a,d+5|0)|0;d=jb(a,e)|0;if((d|0)==-1){d=1;break}c[b>>2]=(1<<e)+-1+d;d=0;break}c[b>>2]=0;lb(a,32)|0;if((jb(a,1)|0)==1?(f=kb(a)|0,(lb(a,32)|0)!=-1):0)if((f|0)==1){c[b>>2]=-1;d=1;break}else if(!f){c[b>>2]=-1;d=0;break}else{d=1;break}else d=1}else{lb(a,1)|0;c[b>>2]=0;d=0}while(0);i=g;return d|0}function ob(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;e=i;i=i+16|0;f=e;c[f>>2]=0;d=nb(a,f)|0;a=c[f>>2]|0;d=(d|0)==0;if((a|0)==-1)if(d)a=1;else{c[b>>2]=-2147483648;a=0}else if(d){d=(a+1|0)>>>1;c[b>>2]=(a&1|0)!=0?d:0-d|0;a=0}else a=1;i=e;return a|0}function pb(a,b,e){a=a|0;b=b|0;e=e|0;var f=0,g=0;g=i;i=i+16|0;f=g;if(nb(a,f)|0){f=1;i=g;return f|0}f=c[f>>2]|0;if(f>>>0>47){f=1;i=g;return f|0}c[b>>2]=d[((e|0)==0?576:528)+f>>0];f=0;i=g;return f|0}function qb(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=i;if(!d){d=jb(a,1)|0;c[b>>2]=d;if((d|0)==-1)d=1;else{c[b>>2]=d^1;d=0}}else d=nb(a,b)|0;i=e;return d|0}function rb(a,b,f,g){a=a|0;b=b|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0;O=i;i=i+128|0;M=O+64|0;N=O;n=kb(a)|0;p=n>>>16;do if(f>>>0<2)if((n|0)>=0){if(n>>>0>201326591){o=e[1264+(n>>>26<<1)>>1]|0;k=25;break}if(n>>>0>16777215){o=e[1328+(n>>>22<<1)>>1]|0;k=25;break}if(n>>>0>2097151){o=e[1424+((n>>>18)+-8<<1)>>1]|0;k=25;break}else{o=e[1536+(p<<1)>>1]|0;k=25;break}}else q=1;else if(f>>>0<4){if((n|0)<0){q=(p&16384|0)!=0?2:2082;break}if(n>>>0>268435455){o=e[1600+(n>>>26<<1)>>1]|0;k=25;break}if(n>>>0>33554431){o=e[1664+(n>>>23<<1)>>1]|0;k=25;break}else{o=e[1728+(n>>>18<<1)>>1]|0;k=25;break}}else{if(f>>>0<8){f=n>>>26;if((f+-8|0)>>>0<56){o=e[1984+(f<<1)>>1]|0;k=25;break}o=e[2112+(n>>>22<<1)>>1]|0;k=25;break}if(f>>>0<17){o=e[2368+(n>>>26<<1)>>1]|0;k=25;break}f=n>>>29;if(f){o=e[2496+(f<<1)>>1]|0;k=25;break}o=e[2512+(n>>>24<<1)>>1]|0;k=25;break}while(0);if((k|0)==25)if(!o){C=1;i=O;return C|0}else q=o;o=q&31;f=n<<o;p=32-o|0;I=q>>>11&31;if(I>>>0>g>>>0){C=1;i=O;return C|0}v=q>>>5&63;do if(I){if(!v)o=0;else{do if(p>>>0<v>>>0)if((lb(a,o)|0)==-1){C=1;i=O;return C|0}else{p=32;f=kb(a)|0;break}while(0);n=f>>>(32-v|0);f=f<<v;k=0;o=1<<v+-1;do{c[M+(k<<2)>>2]=(o&n|0)!=0?-1:1;o=o>>>1;k=k+1|0}while((o|0)!=0);p=p-v|0;o=k}u=v>>>0<3;a:do if(o>>>0<I>>>0){t=o;s=I>>>0>10&u&1;b:while(1){if(p>>>0<16){if((lb(a,32-p|0)|0)==-1){J=1;k=127;break}r=32;f=kb(a)|0}else r=p;do if((f|0)>=0)if(f>>>0<=1073741823)if(f>>>0<=536870911)if(f>>>0<=268435455)if(f>>>0<=134217727)if(f>>>0<=67108863)if(f>>>0<=33554431)if(f>>>0<=16777215)if(f>>>0<=8388607)if(f>>>0>4194303){H=9;k=59}else{if(f>>>0>2097151){H=10;k=59;break}if(f>>>0>1048575){H=11;k=59;break}if(f>>>0>524287){H=12;k=59;break}if(f>>>0>262143){H=13;k=59;break}if(f>>>0>131071){p=14;o=f<<15;n=r+-15|0;q=s;k=(s|0)!=0?s:4}else{if(f>>>0<65536){J=1;k=127;break b}p=15;o=f<<16;n=r+-16|0;q=(s|0)!=0?s:1;k=12}G=p<<q;B=o;y=n;z=q;x=k;w=(q|0)==0;k=60}else{H=8;k=59}else{H=7;k=59}else{H=6;k=59}else{H=5;k=59}else{H=4;k=59}else{H=3;k=59}else{H=2;k=59}else{H=1;k=59}else{H=0;k=59}while(0);if((k|0)==59){k=0;p=H+1|0;o=f<<p;p=r-p|0;f=H<<s;if(!s){E=p;F=o;A=f;C=0;D=1}else{G=f;B=o;y=p;z=s;x=s;w=0;k=60}}if((k|0)==60){if(y>>>0<x>>>0){if((lb(a,32-y|0)|0)==-1){J=1;k=127;break}o=32;f=kb(a)|0}else{o=y;f=B}E=o-x|0;F=f<<x;A=(f>>>(32-x|0))+G|0;C=z;D=w}s=(t|0)==(v|0)&u?A+2|0:A;o=(s+2|0)>>>1;n=D?1:C;c[M+(t<<2)>>2]=(s&1|0)==0?o:0-o|0;t=t+1|0;if(t>>>0>=I>>>0){l=E;m=F;break a}else{p=E;f=F;s=((o|0)>(3<<n+-1|0)&n>>>0<6&1)+n|0}}if((k|0)==127){i=O;return J|0}}else{l=p;m=f}while(0);if(I>>>0<g>>>0){do if(l>>>0<9)if((lb(a,32-l|0)|0)==-1){C=1;i=O;return C|0}else{l=32;m=kb(a)|0;break}while(0);k=m>>>23;c:do if((g|0)==4)if((m|0)>=0)if((I|0)!=3)if(m>>>0<=1073741823)if((I|0)==2)k=34;else k=m>>>0>536870911?35:51;else k=18;else k=17;else k=1;else{do switch(I|0){case 8:{k=d[1056+(m>>>26)>>0]|0;break}case 9:{k=d[1120+(m>>>26)>>0]|0;break}case 2:{k=d[736+(m>>>26)>>0]|0;break}case 1:{if(m>>>0>268435455)k=d[672+(m>>>27)>>0]|0;else k=d[704+k>>0]|0;break}case 13:{k=d[1248+(m>>>29)>>0]|0;break}case 14:{k=d[1256+(m>>>30)>>0]|0;break}case 3:{k=d[800+(m>>>26)>>0]|0;break}case 4:{k=d[864+(m>>>27)>>0]|0;break}case 5:{k=d[896+(m>>>27)>>0]|0;break}case 10:{k=d[1184+(m>>>27)>>0]|0;break}case 6:{k=d[928+(m>>>26)>>0]|0;break}case 7:{k=d[992+(m>>>26)>>0]|0;break}case 11:{k=d[1216+(m>>>28)>>0]|0;break}case 12:{k=d[1232+(m>>>28)>>0]|0;break}default:{k=m>>31&16|1;break c}}while(0);if(!k){C=1;i=O;return C|0}}while(0);n=k&15;l=l-n|0;m=m<<n;n=k>>>4&15}else n=0;p=I+-1|0;f=(p|0)==0;if(f){c[b+(n<<2)>>2]=c[M+(p<<2)>>2];K=l;h=1<<n;break}else{k=m;o=0}d:while(1){if(!n){c[N+(o<<2)>>2]=1;L=l;j=0}else{if(l>>>0<11){if((lb(a,32-l|0)|0)==-1){J=1;k=127;break}l=32;k=kb(a)|0}switch(n|0){case 4:{m=d[648+(k>>>29)>>0]|0;break}case 5:{m=d[656+(k>>>29)>>0]|0;break}case 6:{m=d[664+(k>>>29)>>0]|0;break}case 1:{m=d[624+(k>>>31)>>0]|0;break}case 2:{m=d[632+(k>>>30)>>0]|0;break}case 3:{m=d[640+(k>>>30)>>0]|0;break}default:{do if(k>>>0<=536870911)if(k>>>0<=268435455)if(k>>>0<=134217727)if(k>>>0<=67108863)if(k>>>0<=33554431)if(k>>>0>16777215)m=184;else{if(k>>>0>8388607){m=201;break}if(k>>>0>4194303){m=218;break}m=k>>>0<2097152?0:235}else m=167;else m=150;else m=133;else m=116;else m=k>>>29<<4^115;while(0);if((m>>>4&15)>>>0>n>>>0){J=1;k=127;break d}}}if(!m){J=1;k=127;break}C=m&15;j=m>>>4&15;c[N+(o<<2)>>2]=j+1;L=l-C|0;k=k<<C;j=n-j|0}o=o+1|0;if(o>>>0>=p>>>0){k=122;break}else{l=L;n=j}}if((k|0)==122){c[b+(j<<2)>>2]=c[M+(p<<2)>>2];h=1<<j;if(f){K=L;break}k=I+-2|0;while(1){j=(c[N+(k<<2)>>2]|0)+j|0;h=1<<j|h;c[b+(j<<2)>>2]=c[M+(k<<2)>>2];if(!k){K=L;break}else k=k+-1|0}}else if((k|0)==127){i=O;return J|0}}else{K=p;h=0}while(0);if(lb(a,32-K|0)|0){C=1;i=O;return C|0}C=h<<16|I<<4;i=O;return C|0}function sb(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;f=i;a:do if((jb(a,1)|0)!=-1?(e=b+4|0,c[e>>2]=jb(a,2)|0,d=jb(a,5)|0,c[b>>2]=d,(d+-2|0)>>>0>=3):0){switch(d|0){case 6:case 9:case 10:case 11:case 12:{if(c[e>>2]|0){d=1;break a}break}case 5:case 7:case 8:{if(!(c[e>>2]|0)){d=1;break a}switch(d|0){case 6:case 9:case 10:case 11:case 12:{d=1;break a}default:{}}break}default:{}}d=0}else d=1;while(0);i=f;return d|0}function tb(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0;o=i;if(!d){i=o;return}m=b+-1|0;j=1-b|0;k=~b;g=0;h=0;l=0;while(1){f=(g|0)!=0;if(f)c[a+(h*216|0)+200>>2]=a+((h+-1|0)*216|0);else c[a+(h*216|0)+200>>2]=0;e=(l|0)!=0;if(e){c[a+(h*216|0)+204>>2]=a+((h-b|0)*216|0);if(g>>>0<m>>>0)c[a+(h*216|0)+208>>2]=a+((j+h|0)*216|0);else n=10}else{c[a+(h*216|0)+204>>2]=0;n=10}if((n|0)==10){n=0;c[a+(h*216|0)+208>>2]=0}if(e&f)c[a+(h*216|0)+212>>2]=a+((h+k|0)*216|0);else c[a+(h*216|0)+212>>2]=0;e=g+1|0;f=(e|0)==(b|0);h=h+1|0;if((h|0)==(d|0))break;else{g=f?0:e;l=(f&1)+l|0}}i=o;return}function ub(a,b){a=a|0;b=b|0;var d=0;d=i;switch(b|0){case 1:{a=c[a+204>>2]|0;break}case 3:{a=c[a+212>>2]|0;break}case 4:break;case 2:{a=c[a+208>>2]|0;break}case 0:{a=c[a+200>>2]|0;break}default:a=0}i=d;return a|0}function vb(a){a=a|0;return 3152+(a<<3)|0}function wb(a){a=a|0;return 2960+(a<<3)|0}function xb(a){a=a|0;return 2768+(a<<3)|0}function yb(a){a=a|0;return 2576+(a<<3)|0}function zb(a,b){a=a|0;b=b|0;var d=0;d=i;if(!b){i=d;return 0}else{i=d;return (c[a+4>>2]|0)==(c[b+4>>2]|0)|0}return 0}function Ab(a){a=a|0;var b=0;b=i;id(a,0,3388);c[a+8>>2]=32;c[a+4>>2]=256;c[a+1332>>2]=1;i=b;return}function Bb(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0;h=i;f=c[b+8>>2]|0;g=a+(f<<2)+20|0;e=c[g>>2]|0;do if(!e){d=fd(92)|0;c[g>>2]=d;if(!d){d=65535;i=h;return d|0}}else{d=a+8|0;if((f|0)!=(c[d>>2]|0)){gd(c[e+40>>2]|0);c[(c[g>>2]|0)+40>>2]=0;gd(c[(c[g>>2]|0)+84>>2]|0);c[(c[g>>2]|0)+84>>2]=0;break}f=a+16|0;if(Ra(b,c[f>>2]|0)|0){gd(c[(c[g>>2]|0)+40>>2]|0);c[(c[g>>2]|0)+40>>2]=0;gd(c[(c[g>>2]|0)+84>>2]|0);c[(c[g>>2]|0)+84>>2]=0;c[d>>2]=33;c[a+4>>2]=257;c[f>>2]=0;c[a+12>>2]=0;break}d=b+40|0;gd(c[d>>2]|0);c[d>>2]=0;d=b+84|0;gd(c[d>>2]|0);c[d>>2]=0;d=0;i=h;return d|0}while(0);f=(c[g>>2]|0)+0|0;d=b+0|0;e=f+92|0;do{c[f>>2]=c[d>>2];f=f+4|0;d=d+4|0}while((f|0)<(e|0));d=0;i=h;return d|0}function Cb(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0;h=i;f=c[b>>2]|0;g=a+(f<<2)+148|0;d=c[g>>2]|0;do if(!d){d=fd(72)|0;c[g>>2]=d;if(!d){d=65535;i=h;return d|0}}else{e=a+4|0;if((f|0)!=(c[e>>2]|0)){gd(c[d+20>>2]|0);c[(c[g>>2]|0)+20>>2]=0;gd(c[(c[g>>2]|0)+24>>2]|0);c[(c[g>>2]|0)+24>>2]=0;gd(c[(c[g>>2]|0)+28>>2]|0);c[(c[g>>2]|0)+28>>2]=0;gd(c[(c[g>>2]|0)+44>>2]|0);c[(c[g>>2]|0)+44>>2]=0;break}if((c[b+4>>2]|0)!=(c[a+8>>2]|0)){c[e>>2]=257;d=c[g>>2]|0}gd(c[d+20>>2]|0);c[(c[g>>2]|0)+20>>2]=0;gd(c[(c[g>>2]|0)+24>>2]|0);c[(c[g>>2]|0)+24>>2]=0;gd(c[(c[g>>2]|0)+28>>2]|0);c[(c[g>>2]|0)+28>>2]=0;gd(c[(c[g>>2]|0)+44>>2]|0);c[(c[g>>2]|0)+44>>2]=0}while(0);f=(c[g>>2]|0)+0|0;d=b+0|0;e=f+72|0;do{c[f>>2]=c[d>>2];f=f+4|0;d=d+4|0}while((f|0)<(e|0));d=0;i=h;return d|0}function Db(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;q=i;o=a+(b<<2)+148|0;f=c[o>>2]|0;if(!f){o=1;i=q;return o|0}n=c[f+4>>2]|0;g=c[a+(n<<2)+20>>2]|0;if(!g){o=1;i=q;return o|0}l=c[g+52>>2]|0;m=Z(c[g+56>>2]|0,l)|0;h=c[f+12>>2]|0;a:do if(h>>>0>1){g=c[f+16>>2]|0;if((g|0)==2){k=c[f+24>>2]|0;j=c[f+28>>2]|0;h=h+-1|0;e=0;while(1){f=c[k+(e<<2)>>2]|0;g=c[j+(e<<2)>>2]|0;if(!(f>>>0<=g>>>0&g>>>0<m>>>0)){e=1;g=33;break}e=e+1|0;if(((f>>>0)%(l>>>0)|0)>>>0>((g>>>0)%(l>>>0)|0)>>>0){e=1;g=33;break}if(e>>>0>=h>>>0)break a}if((g|0)==33){i=q;return e|0}}else if(!g){g=c[f+20>>2]|0;f=0;while(1){if((c[g+(f<<2)>>2]|0)>>>0>m>>>0){e=1;break}f=f+1|0;if(f>>>0>=h>>>0)break a}i=q;return e|0}else{if((g+-3|0)>>>0<3){if((c[f+36>>2]|0)>>>0>m>>>0)e=1;else break;i=q;return e|0}if((g|0)!=6)break;if((c[f+40>>2]|0)>>>0<m>>>0)e=1;else break;i=q;return e|0}}while(0);f=a+4|0;g=c[f>>2]|0;do if((g|0)!=256){e=a+3380|0;if(!(c[e>>2]|0)){if((g|0)==(b|0))break;g=a+8|0;if((n|0)==(c[g>>2]|0)){c[f>>2]=b;c[a+12>>2]=c[o>>2];break}if(!d){o=1;i=q;return o|0}else{c[f>>2]=b;o=c[o>>2]|0;c[a+12>>2]=o;o=c[o+4>>2]|0;c[g>>2]=o;o=c[a+(o<<2)+20>>2]|0;c[a+16>>2]=o;n=c[o+52>>2]|0;o=c[o+56>>2]|0;c[a+1176>>2]=Z(o,n)|0;c[a+1340>>2]=n;c[a+1344>>2]=o;c[e>>2]=1;break}}c[e>>2]=0;e=a+1212|0;gd(c[e>>2]|0);c[e>>2]=0;f=a+1172|0;gd(c[f>>2]|0);c[f>>2]=0;g=a+1176|0;c[e>>2]=fd((c[g>>2]|0)*216|0)|0;o=fd(c[g>>2]<<2)|0;c[f>>2]=o;f=c[e>>2]|0;if((f|0)==0|(o|0)==0){o=65535;i=q;return o|0}id(f,0,(c[g>>2]|0)*216|0);f=a+16|0;tb(c[e>>2]|0,c[(c[f>>2]|0)+52>>2]|0,c[g>>2]|0);f=c[f>>2]|0;do if((c[a+1216>>2]|0)==0?(c[f+16>>2]|0)!=2:0){if(((c[f+80>>2]|0)!=0?(p=c[f+84>>2]|0,(c[p+920>>2]|0)!=0):0)?(c[p+944>>2]|0)==0:0){e=1;break}e=0}else e=1;while(0);o=Z(c[f+56>>2]|0,c[f+52>>2]|0)|0;e=lc(a+1220|0,o,c[f+88>>2]|0,c[f+44>>2]|0,c[f+12>>2]|0,e)|0;if(e){o=e;i=q;return o|0}}else{c[f>>2]=b;o=c[o>>2]|0;c[a+12>>2]=o;o=c[o+4>>2]|0;c[a+8>>2]=o;o=c[a+(o<<2)+20>>2]|0;c[a+16>>2]=o;n=c[o+52>>2]|0;o=c[o+56>>2]|0;c[a+1176>>2]=Z(o,n)|0;c[a+1340>>2]=n;c[a+1344>>2]=o;c[a+3380>>2]=1}while(0);o=0;i=q;return o|0}function Eb(a){a=a|0;var b=0,d=0,e=0;e=i;c[a+1196>>2]=0;c[a+1192>>2]=0;d=c[a+1176>>2]|0;if(!d){i=e;return}a=c[a+1212>>2]|0;b=0;do{c[a+(b*216|0)+4>>2]=0;c[a+(b*216|0)+196>>2]=0;b=b+1|0}while(b>>>0<d>>>0);i=e;return}function Fb(a){a=a|0;return (c[a+1188>>2]|0)==0|0}function Gb(a){a=a|0;var b=0,d=0,e=0,f=0;f=i;if(!(c[a+1404>>2]|0)){if((c[a+1196>>2]|0)==(c[a+1176>>2]|0)){a=1;i=f;return a|0}}else{e=c[a+1176>>2]|0;if(!e){a=1;i=f;return a|0}a=c[a+1212>>2]|0;b=0;d=0;do{d=((c[a+(b*216|0)+196>>2]|0)!=0&1)+d|0;b=b+1|0}while(b>>>0<e>>>0);if((d|0)==(e|0)){a=1;i=f;return a|0}}a=0;i=f;return a|0}function Hb(a,b){a=a|0;b=b|0;var d=0,e=0;d=i;e=c[a+16>>2]|0;Kb(c[a+1172>>2]|0,c[a+12>>2]|0,b,c[e+52>>2]|0,c[e+56>>2]|0);i=d;return}function Ib(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;t=i;i=i+32|0;g=t+24|0;j=t+20|0;k=t+16|0;n=t+12|0;r=t+8|0;q=t;c[e>>2]=0;switch(c[b>>2]|0){case 5:case 1:{s=d+1300|0;h=d+1332|0;if(c[h>>2]|0){c[e>>2]=1;c[h>>2]=0}h=Ua(a,g)|0;if(h){o=h;i=t;return o|0}l=c[d+(c[g>>2]<<2)+148>>2]|0;if(!l){o=65520;i=t;return o|0}h=c[l+4>>2]|0;m=c[d+(h<<2)+20>>2]|0;if(!m){o=65520;i=t;return o|0}g=c[d+8>>2]|0;if(!((g|0)==32|(h|0)==(g|0))?(c[b>>2]|0)!=5:0){o=65520;i=t;return o|0}g=c[d+1304>>2]|0;h=c[b+4>>2]|0;if((g|0)!=(h|0)?(g|0)==0|(h|0)==0:0)c[e>>2]=1;h=(c[b>>2]|0)==5;if((c[s>>2]|0)==5){if(!h)f=16}else if(h)f=16;if((f|0)==16)c[e>>2]=1;g=m+12|0;if(Va(a,c[g>>2]|0,j)|0){o=1;i=t;return o|0}f=d+1308|0;h=c[j>>2]|0;if((c[f>>2]|0)!=(h|0)){c[f>>2]=h;c[e>>2]=1}if((c[b>>2]|0)==5){if(Wa(a,c[g>>2]|0,5,k)|0){o=1;i=t;return o|0}if((c[s>>2]|0)==5){h=d+1312|0;f=c[h>>2]|0;g=c[k>>2]|0;if((f|0)==(g|0))g=f;else c[e>>2]=1}else{g=c[k>>2]|0;h=d+1312|0}c[h>>2]=g}g=c[m+16>>2]|0;if((g|0)==1){if(!(c[m+24>>2]|0)){h=l+8|0;g=Za(a,m,c[b>>2]|0,c[h>>2]|0,q)|0;if(g){o=g;i=t;return o|0}f=d+1324|0;g=c[q>>2]|0;if((c[f>>2]|0)!=(g|0)){c[f>>2]=g;c[e>>2]=1}if((c[h>>2]|0)!=0?(p=d+1328|0,o=c[q+4>>2]|0,(c[p>>2]|0)!=(o|0)):0){c[p>>2]=o;c[e>>2]=1}}}else if(!g){if(Xa(a,m,c[b>>2]|0,n)|0){o=1;i=t;return o|0}f=d+1316|0;g=c[n>>2]|0;if((c[f>>2]|0)!=(g|0)){c[f>>2]=g;c[e>>2]=1}if(c[l+8>>2]|0){f=Ya(a,m,c[b>>2]|0,r)|0;if(f){o=f;i=t;return o|0}g=d+1320|0;f=c[r>>2]|0;if((c[g>>2]|0)!=(f|0)){c[g>>2]=f;c[e>>2]=1}}}n=b;a=c[n+4>>2]|0;o=s;c[o>>2]=c[n>>2];c[o+4>>2]=a;o=0;i=t;return o|0}case 6:case 7:case 8:case 9:case 10:case 11:case 13:case 14:case 15:case 16:case 17:case 18:{c[e>>2]=1;o=0;i=t;return o|0}default:{o=0;i=t;return o|0}}return 0}function Jb(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;n=i;l=0;a:while(1){b=c[a+(l<<2)+148>>2]|0;b:do if((b|0)!=0?(k=c[a+(c[b+4>>2]<<2)+20>>2]|0,(k|0)!=0):0){j=c[k+52>>2]|0;m=Z(c[k+56>>2]|0,j)|0;f=c[b+12>>2]|0;if(f>>>0<=1){b=0;d=18;break a}d=c[b+16>>2]|0;if((d|0)==2){h=c[b+24>>2]|0;g=c[b+28>>2]|0;f=f+-1|0;e=0;while(1){b=c[h+(e<<2)>>2]|0;d=c[g+(e<<2)>>2]|0;if(!(b>>>0<=d>>>0&d>>>0<m>>>0))break b;e=e+1|0;if(((b>>>0)%(j>>>0)|0)>>>0>((d>>>0)%(j>>>0)|0)>>>0)break b;if(e>>>0>=f>>>0){b=0;d=18;break a}}}else if(d){if((d+-3|0)>>>0<3)if((c[b+36>>2]|0)>>>0>m>>>0)break;else{b=0;d=18;break a}if((d|0)!=6){b=0;d=18;break a}if((c[b+40>>2]|0)>>>0<m>>>0)break;else{b=0;d=18;break a}}else{d=c[b+20>>2]|0;b=0;while(1){if((c[d+(b<<2)>>2]|0)>>>0>m>>>0)break b;b=b+1|0;if(b>>>0>=f>>>0){b=0;d=18;break a}}}}while(0);l=l+1|0;if(l>>>0>=256){b=1;d=18;break}}if((d|0)==18){i=n;return b|0}return 0}function Kb(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;v=i;t=Z(f,e)|0;o=c[b+12>>2]|0;if((o|0)==1){id(a,0,t<<2);i=v;return}k=c[b+16>>2]|0;if((k+-3|0)>>>0<3){d=Z(c[b+36>>2]|0,d)|0;d=d>>>0<t>>>0?d:t;if((k&-2|0)==4){n=(c[b+32>>2]|0)==0?d:t-d|0;u=d}else{n=0;u=d}}else{n=0;u=0}switch(k|0){case 0:{l=c[b+20>>2]|0;if(!t){i=v;return}else{h=0;j=0}while(1){while(1)if(h>>>0<o>>>0)break;else h=0;b=l+(h<<2)|0;d=c[b>>2]|0;a:do if(!d)d=0;else{k=0;do{g=k+j|0;if(g>>>0>=t>>>0)break a;c[a+(g<<2)>>2]=h;k=k+1|0;d=c[b>>2]|0}while(k>>>0<d>>>0)}while(0);j=d+j|0;if(j>>>0>=t>>>0)break;else h=h+1|0}i=v;return}case 4:{h=c[b+32>>2]|0;if(!t){i=v;return}d=1-h|0;g=0;do{c[a+(g<<2)>>2]=g>>>0<n>>>0?h:d;g=g+1|0}while((g|0)!=(t|0));i=v;return}case 1:{if(!t){i=v;return}else h=0;do{c[a+(h<<2)>>2]=((((Z((h>>>0)/(e>>>0)|0,o)|0)>>>1)+((h>>>0)%(e>>>0)|0)|0)>>>0)%(o>>>0)|0;h=h+1|0}while((h|0)!=(t|0));i=v;return}case 2:{n=c[b+24>>2]|0;m=c[b+28>>2]|0;h=o+-1|0;if(t){d=0;do{c[a+(d<<2)>>2]=h;d=d+1|0}while((d|0)!=(t|0))}if(!h){i=v;return}g=o+-2|0;while(1){j=c[n+(g<<2)>>2]|0;d=(j>>>0)/(e>>>0)|0;j=(j>>>0)%(e>>>0)|0;h=c[m+(g<<2)>>2]|0;l=(h>>>0)/(e>>>0)|0;h=(h>>>0)%(e>>>0)|0;b:do if(d>>>0<=l>>>0){if(j>>>0>h>>>0)while(1){d=d+1|0;if(d>>>0>l>>>0)break b}do{k=Z(d,e)|0;b=j;do{c[a+(b+k<<2)>>2]=g;b=b+1|0}while(b>>>0<=h>>>0);d=d+1|0}while(d>>>0<=l>>>0)}while(0);if(!g)break;else g=g+-1|0}i=v;return}case 5:{d=c[b+32>>2]|0;if(!e){i=v;return}k=1-d|0;if(!f){i=v;return}else{g=0;j=0}while(1){h=0;b=j;while(1){m=a+((Z(h,e)|0)+g<<2)|0;c[m>>2]=b>>>0<n>>>0?d:k;h=h+1|0;if((h|0)==(f|0))break;else b=b+1|0}g=g+1|0;if((g|0)==(e|0))break;else j=j+f|0}i=v;return}case 3:{m=c[b+32>>2]|0;if(t){d=0;do{c[a+(d<<2)>>2]=1;d=d+1|0}while((d|0)!=(t|0))}l=(e-m|0)>>>1;n=(f-m|0)>>>1;if(!u){i=v;return}t=m<<1;r=t+-1|0;s=e+-1|0;t=1-t|0;q=f+-1|0;o=n;p=0;g=l;f=l;k=n;b=l;j=m+-1|0;d=n;while(1){n=a+((Z(d,e)|0)+b<<2)|0;l=(c[n>>2]|0)==1;h=l&1;if(l)c[n>>2]=0;do if(!((j|0)==-1&(b|0)==(g|0))){if((j|0)==1&(b|0)==(f|0)){b=f+1|0;b=(b|0)<(s|0)?b:s;n=o;l=g;f=b;j=0;m=t;break}if((m|0)==-1&(d|0)==(k|0)){d=k+-1|0;d=(d|0)>0?d:0;n=o;l=g;k=d;j=t;m=0;break}if((m|0)==1&(d|0)==(o|0)){d=o+1|0;d=(d|0)<(q|0)?d:q;n=d;l=g;j=r;m=0;break}else{n=o;l=g;b=b+j|0;d=d+m|0;break}}else{b=g+-1|0;b=(b|0)>0?b:0;n=o;l=b;j=0;m=r}while(0);p=h+p|0;if(p>>>0>=u>>>0)break;else{o=n;g=l}}i=v;return}default:{if(!t){i=v;return}g=c[b+44>>2]|0;h=0;do{c[a+(h<<2)>>2]=c[g+(h<<2)>>2];h=h+1|0}while((h|0)!=(t|0));i=v;return}}}function Lb(){return 3472}function Mb(a,b,d,e,f,g){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0;k=i;i=i+80|0;h=k+32|0;j=k;Nb(d,h,j,e);if((cb(c[a>>2]|0)|0)==1){e=Ob(a,g,b+328|0,h,j,f)|0;if(e){i=k;return e|0}}else{e=Pb(a,g,b,h,j,f)|0;if(e){i=k;return e|0}}e=Qb(a,g+256|0,b+1352|0,h+21|0,j+16|0,c[b+140>>2]|0,f)|0;if(e){i=k;return e|0}if((c[a+196>>2]|0)>>>0>1){e=0;i=k;return e|0}sc(d,g);e=0;i=k;return e|0}function Nb(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;s=i;if(!f){i=s;return}p=c[b+4>>2]|0;q=Z(c[b+8>>2]|0,p)|0;n=(f>>>0)/(p>>>0)|0;g=Z(n,p)|0;o=f-g|0;k=p<<4;h=c[b>>2]|0;j=(o<<4)+(Z(p<<8,n)|0)|0;r=(n|0)!=0;if(r){m=j-(k|1)|0;a[d>>0]=a[h+m>>0]|0;a[d+1>>0]=a[h+(m+1)>>0]|0;a[d+2>>0]=a[h+(m+2)>>0]|0;a[d+3>>0]=a[h+(m+3)>>0]|0;a[d+4>>0]=a[h+(m+4)>>0]|0;a[d+5>>0]=a[h+(m+5)>>0]|0;a[d+6>>0]=a[h+(m+6)>>0]|0;a[d+7>>0]=a[h+(m+7)>>0]|0;a[d+8>>0]=a[h+(m+8)>>0]|0;a[d+9>>0]=a[h+(m+9)>>0]|0;a[d+10>>0]=a[h+(m+10)>>0]|0;a[d+11>>0]=a[h+(m+11)>>0]|0;a[d+12>>0]=a[h+(m+12)>>0]|0;a[d+13>>0]=a[h+(m+13)>>0]|0;a[d+14>>0]=a[h+(m+14)>>0]|0;a[d+15>>0]=a[h+(m+15)>>0]|0;a[d+16>>0]=a[h+(m+16)>>0]|0;a[d+17>>0]=a[h+(m+17)>>0]|0;a[d+18>>0]=a[h+(m+18)>>0]|0;a[d+19>>0]=a[h+(m+19)>>0]|0;a[d+20>>0]=a[h+(m+20)>>0]|0;m=d+21|0}else m=d;l=(g|0)!=(f|0);if(l){j=j+-1|0;a[e>>0]=a[h+j>>0]|0;j=j+k|0;a[e+1>>0]=a[h+j>>0]|0;j=j+k|0;a[e+2>>0]=a[h+j>>0]|0;j=j+k|0;a[e+3>>0]=a[h+j>>0]|0;j=j+k|0;a[e+4>>0]=a[h+j>>0]|0;j=j+k|0;a[e+5>>0]=a[h+j>>0]|0;j=j+k|0;a[e+6>>0]=a[h+j>>0]|0;j=j+k|0;a[e+7>>0]=a[h+j>>0]|0;j=j+k|0;a[e+8>>0]=a[h+j>>0]|0;j=j+k|0;a[e+9>>0]=a[h+j>>0]|0;j=j+k|0;a[e+10>>0]=a[h+j>>0]|0;j=j+k|0;a[e+11>>0]=a[h+j>>0]|0;j=j+k|0;a[e+12>>0]=a[h+j>>0]|0;j=j+k|0;a[e+13>>0]=a[h+j>>0]|0;j=j+k|0;a[e+14>>0]=a[h+j>>0]|0;a[e+15>>0]=a[h+(j+k)>>0]|0;e=e+16|0}d=p<<3&2147483640;f=c[b>>2]|0;g=(Z(n<<3,d)|0)+(q<<8)+(o<<3)|0;if(r){b=g-(d|1)|0;a[m>>0]=a[f+b>>0]|0;a[m+1>>0]=a[f+(b+1)>>0]|0;a[m+2>>0]=a[f+(b+2)>>0]|0;a[m+3>>0]=a[f+(b+3)>>0]|0;a[m+4>>0]=a[f+(b+4)>>0]|0;a[m+5>>0]=a[f+(b+5)>>0]|0;a[m+6>>0]=a[f+(b+6)>>0]|0;a[m+7>>0]=a[f+(b+7)>>0]|0;a[m+8>>0]=a[f+(b+8)>>0]|0;b=b+(q<<6)|0;a[m+9>>0]=a[f+b>>0]|0;a[m+10>>0]=a[f+(b+1)>>0]|0;a[m+11>>0]=a[f+(b+2)>>0]|0;a[m+12>>0]=a[f+(b+3)>>0]|0;a[m+13>>0]=a[f+(b+4)>>0]|0;a[m+14>>0]=a[f+(b+5)>>0]|0;a[m+15>>0]=a[f+(b+6)>>0]|0;a[m+16>>0]=a[f+(b+7)>>0]|0;a[m+17>>0]=a[f+(b+8)>>0]|0}if(!l){i=s;return}m=g+-1|0;a[e>>0]=a[f+m>>0]|0;m=m+d|0;a[e+1>>0]=a[f+m>>0]|0;m=m+d|0;a[e+2>>0]=a[f+m>>0]|0;m=m+d|0;a[e+3>>0]=a[f+m>>0]|0;m=m+d|0;a[e+4>>0]=a[f+m>>0]|0;m=m+d|0;a[e+5>>0]=a[f+m>>0]|0;m=m+d|0;a[e+6>>0]=a[f+m>>0]|0;m=m+d|0;a[e+7>>0]=a[f+m>>0]|0;m=m+(d+((q<<6)-(p<<6)))|0;a[e+8>>0]=a[f+m>>0]|0;m=m+d|0;a[e+9>>0]=a[f+m>>0]|0;m=m+d|0;a[e+10>>0]=a[f+m>>0]|0;m=m+d|0;a[e+11>>0]=a[f+m>>0]|0;m=m+d|0;a[e+12>>0]=a[f+m>>0]|0;m=m+d|0;a[e+13>>0]=a[f+m>>0]|0;m=m+d|0;a[e+14>>0]=a[f+m>>0]|0;a[e+15>>0]=a[f+(m+d)>>0]|0;i=s;return}function Ob(b,e,f,g,h,j){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0;z=i;k=b+200|0;l=zb(b,c[k>>2]|0)|0;o=(j|0)!=0;if((l|0)!=0&o){n=(cb(c[c[k>>2]>>2]|0)|0)==2;n=n?0:l}else n=l;j=b+204|0;l=zb(b,c[j>>2]|0)|0;if((l|0)!=0&o){p=(cb(c[c[j>>2]>>2]|0)|0)==2;p=p?0:l}else p=l;j=b+212|0;l=zb(b,c[j>>2]|0)|0;if((l|0)!=0&o){r=(cb(c[c[j>>2]>>2]|0)|0)==2;l=r?0:l}j=fb(c[b>>2]|0)|0;if(!j){if(!p){r=1;i=z;return r|0}b=g+1|0;m=g+2|0;s=g+3|0;t=g+4|0;u=g+5|0;v=g+6|0;w=g+7|0;x=g+8|0;y=g+9|0;h=g+10|0;l=g+11|0;j=g+12|0;k=g+13|0;q=g+14|0;r=g+15|0;p=g+16|0;o=e;n=0;while(1){a[o>>0]=a[b>>0]|0;a[o+1>>0]=a[m>>0]|0;a[o+2>>0]=a[s>>0]|0;a[o+3>>0]=a[t>>0]|0;a[o+4>>0]=a[u>>0]|0;a[o+5>>0]=a[v>>0]|0;a[o+6>>0]=a[w>>0]|0;a[o+7>>0]=a[x>>0]|0;a[o+8>>0]=a[y>>0]|0;a[o+9>>0]=a[h>>0]|0;a[o+10>>0]=a[l>>0]|0;a[o+11>>0]=a[j>>0]|0;a[o+12>>0]=a[k>>0]|0;a[o+13>>0]=a[q>>0]|0;a[o+14>>0]=a[r>>0]|0;a[o+15>>0]=a[p>>0]|0;n=n+1|0;if((n|0)==16)break;else o=o+16|0}}else if((j|0)==2){l=g+1|0;k=(n|0)!=0;j=(p|0)!=0;do if(!(k&j)){if(k){k=((d[h>>0]|0)+8+(d[h+1>>0]|0)+(d[h+2>>0]|0)+(d[h+3>>0]|0)+(d[h+4>>0]|0)+(d[h+5>>0]|0)+(d[h+6>>0]|0)+(d[h+7>>0]|0)+(d[h+8>>0]|0)+(d[h+9>>0]|0)+(d[h+10>>0]|0)+(d[h+11>>0]|0)+(d[h+12>>0]|0)+(d[h+13>>0]|0)+(d[h+14>>0]|0)+(d[h+15>>0]|0)|0)>>>4;break}if(j)k=((d[l>>0]|0)+8+(d[g+2>>0]|0)+(d[g+3>>0]|0)+(d[g+4>>0]|0)+(d[g+5>>0]|0)+(d[g+6>>0]|0)+(d[g+7>>0]|0)+(d[g+8>>0]|0)+(d[g+9>>0]|0)+(d[g+10>>0]|0)+(d[g+11>>0]|0)+(d[g+12>>0]|0)+(d[g+13>>0]|0)+(d[g+14>>0]|0)+(d[g+15>>0]|0)+(d[g+16>>0]|0)|0)>>>4;else k=128}else{j=0;k=0;do{r=j;j=j+1|0;k=(d[g+j>>0]|0)+k+(d[h+r>>0]|0)|0}while((j|0)!=16);k=(k+16|0)>>>5}while(0);nd(e|0,k&255|0,256)|0}else if((j|0)==1)if(!n){r=1;i=z;return r|0}else{k=e;j=0;while(1){r=h+j|0;a[k>>0]=a[r>>0]|0;a[k+1>>0]=a[r>>0]|0;a[k+2>>0]=a[r>>0]|0;a[k+3>>0]=a[r>>0]|0;a[k+4>>0]=a[r>>0]|0;a[k+5>>0]=a[r>>0]|0;a[k+6>>0]=a[r>>0]|0;a[k+7>>0]=a[r>>0]|0;a[k+8>>0]=a[r>>0]|0;a[k+9>>0]=a[r>>0]|0;a[k+10>>0]=a[r>>0]|0;a[k+11>>0]=a[r>>0]|0;a[k+12>>0]=a[r>>0]|0;a[k+13>>0]=a[r>>0]|0;a[k+14>>0]=a[r>>0]|0;a[k+15>>0]=a[r>>0]|0;j=j+1|0;if((j|0)==16)break;else k=k+16|0}}else{if(!((n|0)!=0&(p|0)!=0&(l|0)!=0)){r=1;i=z;return r|0}j=d[g+16>>0]|0;m=d[h+15>>0]|0;o=d[g>>0]|0;p=(((d[g+9>>0]|0)-(d[g+7>>0]|0)+((d[g+10>>0]|0)-(d[g+6>>0]|0)<<1)+(((d[g+11>>0]|0)-(d[g+5>>0]|0)|0)*3|0)+((d[g+12>>0]|0)-(d[g+4>>0]|0)<<2)+(((d[g+13>>0]|0)-(d[g+3>>0]|0)|0)*5|0)+(((d[g+14>>0]|0)-(d[g+2>>0]|0)|0)*6|0)+(((d[g+15>>0]|0)-(d[g+1>>0]|0)|0)*7|0)+(j-o<<3)|0)*5|0)+32>>6;o=(((d[h+8>>0]|0)-(d[h+6>>0]|0)+(m-o<<3)+((d[h+9>>0]|0)-(d[h+5>>0]|0)<<1)+(((d[h+10>>0]|0)-(d[h+4>>0]|0)|0)*3|0)+((d[h+11>>0]|0)-(d[h+3>>0]|0)<<2)+(((d[h+12>>0]|0)-(d[h+2>>0]|0)|0)*5|0)+(((d[h+13>>0]|0)-(d[h+1>>0]|0)|0)*6|0)+(((d[h+14>>0]|0)-(d[h>>0]|0)|0)*7|0)|0)*5|0)+32>>6;j=(m+j<<4)+16|0;m=0;do{k=j+(Z(m+-7|0,o)|0)|0;n=m<<4;b=0;do{l=k+(Z(b+-7|0,p)|0)>>5;if((l|0)<0)l=0;else l=(l|0)>255?-1:l&255;a[e+(b+n)>>0]=l;b=b+1|0}while((b|0)!=16);m=m+1|0}while((m|0)!=16)}Rb(e,f,0);Rb(e,f+64|0,1);Rb(e,f+128|0,2);Rb(e,f+192|0,3);Rb(e,f+256|0,4);Rb(e,f+320|0,5);Rb(e,f+384|0,6);Rb(e,f+448|0,7);Rb(e,f+512|0,8);Rb(e,f+576|0,9);Rb(e,f+640|0,10);Rb(e,f+704|0,11);Rb(e,f+768|0,12);Rb(e,f+832|0,13);Rb(e,f+896|0,14);Rb(e,f+960|0,15);r=0;i=z;return r|0}function Pb(b,e,f,g,h,j){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0;N=i;M=(j|0)!=0;L=0;a:while(1){l=vb(L)|0;n=c[l+4>>2]|0;l=ub(b,c[l>>2]|0)|0;j=zb(b,l)|0;if((j|0)!=0&M){E=(cb(c[l>>2]|0)|0)==2;j=E?0:j}o=wb(L)|0;m=c[o+4>>2]|0;o=ub(b,c[o>>2]|0)|0;k=zb(b,o)|0;if((k|0)!=0&M){E=(cb(c[o>>2]|0)|0)==2;k=E?0:k}G=(j|0)!=0;H=(k|0)!=0;I=G&H;if(I){if(!(cb(c[l>>2]|0)|0))n=d[l+(n&255)+82>>0]|0;else n=2;if(!(cb(c[o>>2]|0)|0))j=d[o+(m&255)+82>>0]|0;else j=2;j=n>>>0<j>>>0?n:j}else j=2;if(!(c[f+(L<<2)+12>>2]|0)){E=c[f+(L<<2)+76>>2]|0;j=(E>>>0>=j>>>0&1)+E|0}a[b+L+82>>0]=j;l=c[(xb(L)|0)>>2]|0;l=ub(b,l)|0;m=zb(b,l)|0;if((m|0)!=0&M){E=(cb(c[l>>2]|0)|0)==2;m=E?0:m}l=c[(yb(L)|0)>>2]|0;l=ub(b,l)|0;n=zb(b,l)|0;if((n|0)!=0&M){E=(cb(c[l>>2]|0)|0)==2;n=E?0:n}J=c[3344+(L<<2)>>2]|0;K=c[3408+(L<<2)>>2]|0;r=(1285>>>L&1|0)!=0;if(r){o=h+K|0;l=h+(K+1)|0;p=h+(K+2)|0;q=h+(K+3)|0}else{q=(K<<4)+J|0;o=e+(q+-1)|0;l=e+(q+15)|0;p=e+(q+31)|0;q=e+(q+47)|0}A=a[o>>0]|0;y=a[l>>0]|0;F=a[p>>0]|0;E=a[q>>0]|0;do if(!(51>>>L&1)){x=K+-1|0;w=(x<<4)+J|0;o=a[e+w>>0]|0;q=a[e+(w+1)>>0]|0;s=a[e+(w+2)>>0]|0;u=a[e+(w+3)>>0]|0;t=a[e+(w+4)>>0]|0;l=a[e+(w+5)>>0]|0;v=a[e+(w+6)>>0]|0;p=a[e+(w+7)>>0]|0;if(r){D=v;C=u;u=p;B=q;z=s;v=h+x|0;break}else{D=v;C=u;u=p;B=q;z=s;v=e+(w+-1)|0;break}}else{D=a[g+(J+7)>>0]|0;C=a[g+(J+4)>>0]|0;t=a[g+(J+5)>>0]|0;l=a[g+(J+6)>>0]|0;o=a[g+(J+1)>>0]|0;u=a[g+(J+8)>>0]|0;B=a[g+(J+2)>>0]|0;z=a[g+(J+3)>>0]|0;v=g+J|0}while(0);v=a[v>>0]|0;switch(j|0){case 4:{if(!(I&(n|0)!=0)){k=1;j=51;break a}j=o&255;o=v&255;q=A&255;s=j+2|0;D=(s+q+(o<<1)|0)>>>2;u=D&255;k=B&255;o=o+2|0;v=((j<<1)+k+o|0)>>>2&255;j=z&255;s=((k<<1)+j+s|0)>>>2&255;z=y&255;o=(z+(q<<1)+o|0)>>>2;t=o&255;A=F&255;B=(q+2+(z<<1)+A|0)>>>2;q=u;p=t;n=B&255;m=v;l=s;j=((C&255)+2+k+(j<<1)|0)>>>2&255;k=u;r=v;o=(z+2+(A<<1)+(E&255)|0)>>>2&255|B<<8&65280|D<<24|o<<16&16711680;break}case 6:{if(!(I&(n|0)!=0)){k=1;j=51;break a}l=v&255;s=A&255;u=s+1|0;r=(u+l|0)>>>1&255;C=y&255;v=((s<<1)+2+C+l|0)>>>2&255;u=(u+C|0)>>>1&255;D=F&255;s=s+2|0;y=(s+(C<<1)+D|0)>>>2;A=(C+1+D|0)>>>1;E=E&255;j=o&255;s=(s+j+(l<<1)|0)>>>2&255;k=B&255;q=r;p=u;n=A&255;m=s;l=(k+2+(j<<1)+l|0)>>>2&255;j=((z&255)+2+(k<<1)+j|0)>>>2&255;k=v;t=y&255;o=y<<24|A<<16&16711680|(D+1+E|0)>>>1&255|C+2+(D<<1)+E<<6&65280;break}case 2:{do if(!I){if(G){j=((A&255)+2+(y&255)+(F&255)+(E&255)|0)>>>2;break}if(H)j=((C&255)+2+(z&255)+(B&255)+(o&255)|0)>>>2;else j=128}else j=((A&255)+4+(y&255)+(F&255)+(E&255)+(C&255)+(z&255)+(B&255)+(o&255)|0)>>>3;while(0);o=Z(j&255,16843009)|0;n=o&255;t=o>>>8&255;u=o>>>16&255;v=o>>>24&255;q=n;p=n;m=t;l=u;j=v;k=t;r=u;s=v;break}case 0:{if(!k){k=1;j=51;break a}q=o;p=o;n=o;m=B;l=z;j=C;k=B;r=z;s=C;t=B;u=z;v=C;o=(z&255)<<16|(C&255)<<24|(B&255)<<8|o&255;break}case 1:{if(!G){k=1;j=51;break a}j=Z(A&255,16843009)|0;s=Z(y&255,16843009)|0;v=Z(F&255,16843009)|0;q=j&255;p=s&255;n=v&255;m=j>>>8&255;l=j>>>16&255;j=j>>>24&255;k=s>>>8&255;r=s>>>16&255;s=s>>>24&255;t=v>>>8&255;u=v>>>16&255;v=v>>>24&255;o=Z(E&255,16843009)|0;break}case 7:{if(!k){k=1;j=51;break a}A=(m|0)==0;n=o&255;p=B&255;z=z&255;m=(z+1+p|0)>>>1&255;o=C&255;u=o+1|0;v=(u+z|0)>>>1&255;B=(A?C:t)&255;u=(u+B|0)>>>1&255;j=z+2|0;y=o+2|0;z=(y+p+(z<<1)|0)>>>2;o=(j+(o<<1)+B|0)>>>2;E=(A?C:l)&255;y=(y+E+(B<<1)|0)>>>2;q=(p+1+n|0)>>>1&255;p=(j+n+(p<<1)|0)>>>2&255;n=m;l=v;j=u;k=z&255;r=o&255;s=y&255;t=v;v=(B+1+E|0)>>>1&255;o=y<<16&16711680|z&255|(B+2+((A?C:D)&255)+(E<<1)|0)>>>2<<24|o<<8&65280;break}case 3:{if(!k){k=1;j=51;break a}n=(m|0)==0;q=B&255;m=z&255;p=m+2|0;k=C&255;B=k+2|0;m=(B+q+(m<<1)|0)>>>2&255;v=(n?C:t)&255;k=(p+(k<<1)+v|0)>>>2&255;E=(n?C:l)&255;B=(B+E+(v<<1)|0)>>>2;t=B&255;A=(n?C:D)&255;D=(v+2+A+(E<<1)|0)>>>2;v=D&255;C=(n?C:u)&255;E=(E+2+C+(A<<1)|0)>>>2;q=(p+(o&255)+(q<<1)|0)>>>2&255;p=m;n=k;l=k;j=t;r=t;s=v;u=v;v=E&255;o=(A+2+(C*3|0)|0)>>>2<<24|B&255|D<<8&65280|E<<16&16711680;break}case 5:{if(!(I&(n|0)!=0)){k=1;j=51;break a}n=v&255;u=o&255;t=(u+1+n|0)>>>1&255;x=B&255;E=(x+2+(u<<1)+n|0)>>>2;B=A&255;A=u+2|0;o=(A+B+(n<<1)|0)>>>2;u=(x+1+u|0)>>>1&255;s=z&255;A=((x<<1)+s+A|0)>>>2;v=(s+1+x|0)>>>1&255;C=C&255;D=y&255;q=t;p=o&255;n=(D+2+(B<<1)+n|0)>>>2&255;m=u;l=v;j=(C+1+s|0)>>>1&255;k=E&255;r=A&255;s=(C+2+x+(s<<1)|0)>>>2&255;o=A<<24|(B+2+(F&255)+(D<<1)|0)>>>2&255|E<<16&16711680|o<<8&65280;break}default:{if(!G){k=1;j=51;break a}s=A&255;j=y&255;m=F&255;l=(j+1+m|0)>>>1&255;o=E&255;k=(j+2+(m<<1)+o|0)>>>2&255;r=(m+1+o|0)>>>1&255;t=(m+2+(o*3|0)|0)>>>2&255;q=(s+1+j|0)>>>1&255;p=l;n=r;m=(s+2+(j<<1)+m|0)>>>2&255;j=k;s=t;u=E;v=E;o=o<<8|o|o<<16|o<<24}}E=(K<<4)+J|0;c[e+E>>2]=(l&255)<<16|(j&255)<<24|(m&255)<<8|q&255;c[e+(E+16)>>2]=(r&255)<<16|(s&255)<<24|(k&255)<<8|p&255;c[e+(E+32)>>2]=(u&255)<<16|(v&255)<<24|(t&255)<<8|n&255;c[e+(E+48)>>2]=o;Rb(e,f+(L<<6)+328|0,L);L=L+1|0;if(L>>>0>=16){k=0;j=51;break}}if((j|0)==51){i=N;return k|0}return 0}function Qb(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0;y=i;m=b+200|0;l=zb(b,c[m>>2]|0)|0;n=(k|0)!=0;if((l|0)!=0&n){o=(cb(c[c[m>>2]>>2]|0)|0)==2;l=o?0:l}m=b+204|0;k=zb(b,c[m>>2]|0)|0;if((k|0)!=0&n){o=(cb(c[c[m>>2]>>2]|0)|0)==2;o=o?0:k}else o=k;m=b+212|0;k=zb(b,c[m>>2]|0)|0;if((k|0)!=0&n){n=(cb(c[c[m>>2]>>2]|0)|0)==2;k=n?0:k}w=(l|0)!=0;x=(o|0)!=0;v=w&x;u=v&(k|0)!=0;t=(l|0)==0;s=(o|0)==0;p=g;q=16;r=0;while(1){if((j|0)==1){if(t){l=1;k=29;break}else{n=e;b=8;m=h}while(1){b=b+-1|0;a[n>>0]=a[m>>0]|0;a[n+1>>0]=a[m>>0]|0;a[n+2>>0]=a[m>>0]|0;a[n+3>>0]=a[m>>0]|0;a[n+4>>0]=a[m>>0]|0;a[n+5>>0]=a[m>>0]|0;a[n+6>>0]=a[m>>0]|0;a[n+7>>0]=a[m>>0]|0;if(!b)break;else{n=n+8|0;m=m+1|0}}}else if((j|0)==2){if(s){l=1;k=29;break}else{n=p;b=e;m=8}while(1){n=n+1|0;m=m+-1|0;a[b>>0]=a[n>>0]|0;a[b+8>>0]=a[n>>0]|0;a[b+16>>0]=a[n>>0]|0;a[b+24>>0]=a[n>>0]|0;a[b+32>>0]=a[n>>0]|0;a[b+40>>0]=a[n>>0]|0;a[b+48>>0]=a[n>>0]|0;a[b+56>>0]=a[n>>0]|0;if(!m)break;else b=b+1|0}}else if(!j){m=p+1|0;do if(!v){if(x){n=((d[m>>0]|0)+2+(d[p+2>>0]|0)+(d[p+3>>0]|0)+(d[p+4>>0]|0)|0)>>>2;b=((d[p+5>>0]|0)+2+(d[p+6>>0]|0)+(d[p+7>>0]|0)+(d[p+8>>0]|0)|0)>>>2;break}if(w){b=((d[h>>0]|0)+2+(d[h+1>>0]|0)+(d[h+2>>0]|0)+(d[h+3>>0]|0)|0)>>>2;n=b}else{n=128;b=128}}else{n=((d[m>>0]|0)+4+(d[p+2>>0]|0)+(d[p+3>>0]|0)+(d[p+4>>0]|0)+(d[h>>0]|0)+(d[h+1>>0]|0)+(d[h+2>>0]|0)+(d[h+3>>0]|0)|0)>>>3;b=((d[p+5>>0]|0)+2+(d[p+6>>0]|0)+(d[p+7>>0]|0)+(d[p+8>>0]|0)|0)>>>2}while(0);n=n&255;o=b&255;nd(e|0,n|0,4)|0;nd(e+4|0,o|0,4)|0;nd(e+8|0,n|0,4)|0;nd(e+12|0,o|0,4)|0;nd(e+16|0,n|0,4)|0;nd(e+20|0,o|0,4)|0;g=e+32|0;nd(e+24|0,n|0,4)|0;nd(e+28|0,o|0,4)|0;if(w){o=d[h+4>>0]|0;n=d[h+5>>0]|0;b=d[h+6>>0]|0;m=d[h+7>>0]|0;k=(o+2+n+b+m|0)>>>2;if(x){l=k;n=(o+4+n+b+m+(d[p+5>>0]|0)+(d[p+6>>0]|0)+(d[p+7>>0]|0)+(d[p+8>>0]|0)|0)>>>3}else{l=k;n=k}}else if(x){l=((d[m>>0]|0)+2+(d[p+2>>0]|0)+(d[p+3>>0]|0)+(d[p+4>>0]|0)|0)>>>2;n=((d[p+5>>0]|0)+2+(d[p+6>>0]|0)+(d[p+7>>0]|0)+(d[p+8>>0]|0)|0)>>>2}else{l=128;n=128}b=l&255;o=n&255;nd(g|0,b|0,4)|0;nd(e+36|0,o|0,4)|0;nd(e+40|0,b|0,4)|0;nd(e+44|0,o|0,4)|0;nd(e+48|0,b|0,4)|0;nd(e+52|0,o|0,4)|0;nd(e+56|0,b|0,4)|0;nd(e+60|0,o|0,4)|0}else{if(!u){l=1;k=29;break}n=d[p+8>>0]|0;b=d[h+7>>0]|0;l=d[p>>0]|0;k=(((d[p+5>>0]|0)-(d[p+3>>0]|0)+((d[p+6>>0]|0)-(d[p+2>>0]|0)<<1)+(((d[p+7>>0]|0)-(d[p+1>>0]|0)|0)*3|0)+(n-l<<2)|0)*17|0)+16>>5;l=(((d[h+4>>0]|0)-(d[h+2>>0]|0)+(b-l<<2)+((d[h+5>>0]|0)-(d[h+1>>0]|0)<<1)+(((d[h+6>>0]|0)-(d[h>>0]|0)|0)*3|0)|0)*17|0)+16>>5;o=Z(k,-3)|0;n=(b+n<<4)+16+(Z(l,-3)|0)|0;b=e;m=8;while(1){m=m+-1|0;g=n+o|0;a[b>>0]=a[(g>>5)+3984>>0]|0;g=g+k|0;a[b+1>>0]=a[(g>>5)+3984>>0]|0;g=g+k|0;a[b+2>>0]=a[(g>>5)+3984>>0]|0;g=g+k|0;a[b+3>>0]=a[(g>>5)+3984>>0]|0;g=g+k|0;a[b+4>>0]=a[(g>>5)+3984>>0]|0;g=g+k|0;a[b+5>>0]=a[(g>>5)+3984>>0]|0;g=g+k|0;a[b+6>>0]=a[(g>>5)+3984>>0]|0;a[b+7>>0]=a[(g+k>>5)+3984>>0]|0;if(!m)break;else{n=n+l|0;b=b+8|0}}}Rb(e,f,q);g=q|1;Rb(e,f+64|0,g);Rb(e,f+128|0,g+1|0);Rb(e,f+192|0,q|3);r=r+1|0;if(r>>>0>=2){l=0;k=29;break}else{p=p+9|0;q=q+4|0;e=e+64|0;h=h+8|0;f=f+256|0}}if((k|0)==29){i=y;return l|0}return 0}function Rb(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;h=i;g=c[e>>2]|0;if((g|0)==16777215){i=h;return}m=f>>>0<16;l=m?16:8;m=m?f:f&3;m=(Z(c[3408+(m<<2)>>2]|0,l)|0)+(c[3344+(m<<2)>>2]|0)|0;n=b+m|0;p=c[e+4>>2]|0;j=b+(m+1)|0;f=d[j>>0]|0;a[n>>0]=a[3472+(g+512+(d[n>>0]|0))>>0]|0;n=c[e+8>>2]|0;k=b+(m+2)|0;o=d[k>>0]|0;a[j>>0]=a[3472+(p+512+f)>>0]|0;g=b+(m+3)|0;j=a[3472+((c[e+12>>2]|0)+512+(d[g>>0]|0))>>0]|0;a[k>>0]=a[3472+(n+512+o)>>0]|0;a[g>>0]=j;g=m+l|0;m=b+g|0;j=c[e+20>>2]|0;k=b+(g+1)|0;o=d[k>>0]|0;a[m>>0]=a[3472+((c[e+16>>2]|0)+512+(d[m>>0]|0))>>0]|0;m=c[e+24>>2]|0;n=b+(g+2)|0;f=d[n>>0]|0;a[k>>0]=a[3472+(j+512+o)>>0]|0;k=b+(g+3)|0;o=a[3472+((c[e+28>>2]|0)+512+(d[k>>0]|0))>>0]|0;a[n>>0]=a[3472+(m+512+f)>>0]|0;a[k>>0]=o;g=g+l|0;k=b+g|0;o=c[e+36>>2]|0;n=b+(g+1)|0;f=d[n>>0]|0;a[k>>0]=a[3472+((c[e+32>>2]|0)+512+(d[k>>0]|0))>>0]|0;k=c[e+40>>2]|0;m=b+(g+2)|0;j=d[m>>0]|0;a[n>>0]=a[3472+(o+512+f)>>0]|0;n=b+(g+3)|0;f=a[3472+((c[e+44>>2]|0)+512+(d[n>>0]|0))>>0]|0;a[m>>0]=a[3472+(k+512+j)>>0]|0;a[n>>0]=f;g=g+l|0;l=b+g|0;n=c[e+52>>2]|0;f=b+(g+1)|0;m=d[f>>0]|0;a[l>>0]=a[3472+((c[e+48>>2]|0)+512+(d[l>>0]|0))>>0]|0;l=c[e+56>>2]|0;j=b+(g+2)|0;k=d[j>>0]|0;a[f>>0]=a[3472+(n+512+m)>>0]|0;g=b+(g+3)|0;f=a[3472+((c[e+60>>2]|0)+512+(d[g>>0]|0))>>0]|0;a[j>>0]=a[3472+(l+512+k)>>0]|0;a[g>>0]=f;i=h;return}
function yc(b,e,f,g){b=b|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;q=i;l=b+-1|0;k=a[b+1>>0]|0;m=d[l>>0]|0;n=d[b>>0]|0;r=m-n|0;p=f+4|0;do if((((r|0)>-1?r:0-r|0)>>>0<(c[p>>2]|0)>>>0?(o=d[b+-2>>0]|0,r=o-m|0,j=c[f+8>>2]|0,((r|0)>-1?r:0-r|0)>>>0<j>>>0):0)?(h=k&255,k=h-n|0,((k|0)>-1?k:0-k|0)>>>0<j>>>0):0)if(e>>>0<4){k=d[(c[f>>2]|0)+(e+-1)>>0]|0;k=Oa(~k,k+1|0,4-h+(n-m<<2)+o>>3)|0;o=a[3472+((n|512)-k)>>0]|0;a[l>>0]=a[3472+((m|512)+k)>>0]|0;a[b>>0]=o;break}else{a[l>>0]=(m+2+h+(o<<1)|0)>>>2;a[b>>0]=(n+2+(h<<1)+o|0)>>>2;break}while(0);l=b+g|0;m=b+(g+-1)|0;o=d[m>>0]|0;n=d[l>>0]|0;k=o-n|0;if(((k|0)>-1?k:0-k|0)>>>0>=(c[p>>2]|0)>>>0){i=q;return}k=d[b+(g+-2)>>0]|0;p=k-o|0;j=c[f+8>>2]|0;if(((p|0)>-1?p:0-p|0)>>>0>=j>>>0){i=q;return}h=d[b+(g+1)>>0]|0;g=h-n|0;if(((g|0)>-1?g:0-g|0)>>>0>=j>>>0){i=q;return}if(e>>>0<4){b=d[(c[f>>2]|0)+(e+-1)>>0]|0;b=Oa(~b,b+1|0,4-h+(n-o<<2)+k>>3)|0;g=a[3472+((n|512)-b)>>0]|0;a[m>>0]=a[3472+((o|512)+b)>>0]|0;a[l>>0]=g;i=q;return}else{a[m>>0]=(o+2+h+(k<<1)|0)>>>2;a[l>>0]=(n+2+(h<<1)+k|0)>>>2;i=q;return}}function zc(b,e,f,g){b=b|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;v=i;if(e>>>0<4){n=d[(c[f>>2]|0)+(e+-1)>>0]|0;h=n+1|0;q=0-g|0;e=f+4|0;p=q<<1;o=f+8|0;n=~n;j=8;while(1){m=b+q|0;f=a[b+g>>0]|0;l=d[m>>0]|0;k=d[b>>0]|0;r=l-k|0;if((((r|0)>-1?r:0-r|0)>>>0<(c[e>>2]|0)>>>0?(t=d[b+p>>0]|0,r=t-l|0,s=c[o>>2]|0,((r|0)>-1?r:0-r|0)>>>0<s>>>0):0)?(u=f&255,f=u-k|0,((f|0)>-1?f:0-f|0)>>>0<s>>>0):0){r=Oa(n,h,4-u+(k-l<<2)+t>>3)|0;f=a[3472+((k|512)-r)>>0]|0;a[m>>0]=a[3472+((l|512)+r)>>0]|0;a[b>>0]=f}j=j+-1|0;if(!j)break;else b=b+1|0}i=v;return}else{o=0-g|0;m=f+4|0;n=o<<1;f=f+8|0;l=8;while(1){h=b+o|0;e=a[b+g>>0]|0;j=d[h>>0]|0;k=d[b>>0]|0;s=j-k|0;if((((s|0)>-1?s:0-s|0)>>>0<(c[m>>2]|0)>>>0?(p=d[b+n>>0]|0,s=p-j|0,q=c[f>>2]|0,((s|0)>-1?s:0-s|0)>>>0<q>>>0):0)?(r=e&255,e=r-k|0,((e|0)>-1?e:0-e|0)>>>0<q>>>0):0){a[h>>0]=(j+2+r+(p<<1)|0)>>>2;a[b>>0]=(k+2+(r<<1)+p|0)>>>2}l=l+-1|0;if(!l)break;else b=b+1|0}i=v;return}}function Ac(b,e,f,g){b=b|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;t=i;r=d[(c[f>>2]|0)+(e+-1)>>0]|0;s=r+1|0;l=0-g|0;h=f+4|0;q=l<<1;e=f+8|0;r=~r;l=b+l|0;m=a[b+g>>0]|0;k=d[l>>0]|0;j=d[b>>0]|0;u=k-j|0;f=c[h>>2]|0;if((((u|0)>-1?u:0-u|0)>>>0<f>>>0?(o=d[b+q>>0]|0,u=o-k|0,n=c[e>>2]|0,((u|0)>-1?u:0-u|0)>>>0<n>>>0):0)?(p=m&255,m=p-j|0,((m|0)>-1?m:0-m|0)>>>0<n>>>0):0){p=Oa(r,s,4-p+(j-k<<2)+o>>3)|0;f=a[3472+((j|512)-p)>>0]|0;a[l>>0]=a[3472+((k|512)+p)>>0]|0;a[b>>0]=f;f=c[h>>2]|0}m=b+1|0;j=b+(1-g)|0;k=d[j>>0]|0;l=d[m>>0]|0;p=k-l|0;if(((p|0)>-1?p:0-p|0)>>>0>=f>>>0){i=t;return}h=d[b+(q|1)>>0]|0;p=h-k|0;f=c[e>>2]|0;if(((p|0)>-1?p:0-p|0)>>>0>=f>>>0){i=t;return}e=d[b+(g+1)>>0]|0;p=e-l|0;if(((p|0)>-1?p:0-p|0)>>>0>=f>>>0){i=t;return}o=Oa(r,s,4-e+(l-k<<2)+h>>3)|0;p=a[3472+((l|512)-o)>>0]|0;a[j>>0]=a[3472+((k|512)+o)>>0]|0;a[m>>0]=p;i=t;return}function Bc(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;r=i;p=c[b+4>>2]|0;q=c[b+8>>2]|0;if(!((d|0)==0|(d|0)==5)?(c[a+3384>>2]|0)==0:0)f=0;else{g=a+1220|0;e=0;do{f=ic(g,e)|0;e=e+1|0}while(e>>>0<16&(f|0)==0)}l=a+1176|0;n=c[l>>2]|0;if(n){m=c[a+1212>>2]|0;e=0;j=0;g=0;do{if(c[m+(j*216|0)+196>>2]|0)break;j=j+1|0;e=e+1|0;o=(e|0)==(p|0);g=(o&1)+g|0;e=o?0:e}while(j>>>0<n>>>0);if((j|0)!=(n|0)){o=a+1212|0;n=c[o>>2]|0;j=Z(g,p)|0;if(e){l=a+1204|0;h=e;do{h=h+-1|0;m=h+j|0;Cc(n+(m*216|0)|0,b,g,h,d,f);c[n+(m*216|0)+196>>2]=1;c[l>>2]=(c[l>>2]|0)+1}while((h|0)!=0)}e=e+1|0;if(e>>>0<p>>>0){m=a+1204|0;do{l=e+j|0;k=n+(l*216|0)+196|0;if(!(c[k>>2]|0)){Cc(n+(l*216|0)|0,b,g,e,d,f);c[k>>2]=1;c[m>>2]=(c[m>>2]|0)+1}e=e+1|0}while((e|0)!=(p|0))}if(g){if(p){n=g+-1|0;h=Z(n,p)|0;e=a+1204|0;l=0-p|0;k=0;do{m=n;j=(c[o>>2]|0)+((k+h|0)*216|0)|0;while(1){Cc(j,b,m,k,d,f);c[j+196>>2]=1;c[e>>2]=(c[e>>2]|0)+1;if(!m)break;else{m=m+-1|0;j=j+(l*216|0)|0}}k=k+1|0}while((k|0)!=(p|0))}}else g=0;g=g+1|0;if(g>>>0>=q>>>0){i=r;return 0}m=a+1204|0;if(!p){i=r;return 0}do{e=c[o>>2]|0;l=Z(g,p)|0;k=0;do{h=k+l|0;j=e+(h*216|0)+196|0;if(!(c[j>>2]|0)){Cc(e+(h*216|0)|0,b,g,k,d,f);c[j>>2]=1;c[m>>2]=(c[m>>2]|0)+1}k=k+1|0}while((k|0)!=(p|0));g=g+1|0}while((g|0)!=(q|0));i=r;return 0}}if((d|0)==2|(d|0)==7)if((c[a+3384>>2]|0)==0|(f|0)==0)g=13;else g=14;else if(!f)g=13;else g=14;if((g|0)==13)id(c[b>>2]|0,128,Z(p*384|0,q)|0);else if((g|0)==14)hd(c[b>>2]|0,f,Z(p*384|0,q)|0);g=c[l>>2]|0;c[a+1204>>2]=g;if(!g){i=r;return 0}e=c[a+1212>>2]|0;f=0;do{c[e+(f*216|0)+8>>2]=1;f=f+1|0}while(f>>>0<g>>>0);i=r;return 0}function Cc(b,e,f,g,h,j){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,_=0,$=0,aa=0,ba=0,ca=0,da=0,ea=0,fa=0,ga=0,ha=0,ia=0,ja=0,ka=0,la=0,ma=0,na=0,oa=0,pa=0,qa=0,ra=0,sa=0,ta=0;sa=i;i=i+480|0;qa=sa+96|0;ra=sa+32|0;m=sa+24|0;n=sa;na=c[e+4>>2]|0;u=c[e+8>>2]|0;Na(e,(Z(na,f)|0)+g|0);p=c[e>>2]|0;k=f<<4;l=g<<4;o=(Z(f<<8,na)|0)+l|0;c[b+20>>2]=40;c[b+8>>2]=0;c[b>>2]=6;c[b+12>>2]=0;c[b+16>>2]=0;c[b+24>>2]=0;do if((h|0)==2|(h|0)==7)id(qa,0,384);else{c[m>>2]=0;c[n+4>>2]=na;c[n+8>>2]=u;c[n>>2]=j;if(!j){id(qa,0,384);break}dc(qa,m,n,l,k,0,0,16,16);sc(e,qa);i=sa;return}while(0);id(ra,0,64);if((f|0)!=0?(c[b+((0-na|0)*216|0)+196>>2]|0)!=0:0){v=o-(na<<4)|0;E=v|1;D=v|3;E=(d[p+E>>0]|0)+(d[p+v>>0]|0)+(d[p+(E+1)>>0]|0)+(d[p+D>>0]|0)|0;$=v|7;D=(d[p+(D+2)>>0]|0)+(d[p+(D+1)>>0]|0)+(d[p+(D+3)>>0]|0)+(d[p+$>>0]|0)|0;F=(d[p+($+2)>>0]|0)+(d[p+($+1)>>0]|0)+(d[p+($+3)>>0]|0)+(d[p+($+4)>>0]|0)|0;v=(d[p+($+6)>>0]|0)+(d[p+($+5)>>0]|0)+(d[p+($+7)>>0]|0)+(d[p+(v|15)>>0]|0)|0;$=D+E|0;c[ra>>2]=F+$+(c[ra>>2]|0)+v;s=ra+4|0;c[s>>2]=$-F-v+(c[s>>2]|0);s=1}else{E=0;D=0;F=0;v=0;s=0}if((u+-1|0)!=(f|0)?(c[b+(na*216|0)+196>>2]|0)!=0:0){z=o+(na<<8)|0;w=z|1;x=z|3;w=(d[p+w>>0]|0)+(d[p+z>>0]|0)+(d[p+(w+1)>>0]|0)+(d[p+x>>0]|0)|0;r=z|7;x=(d[p+(x+2)>>0]|0)+(d[p+(x+1)>>0]|0)+(d[p+(x+3)>>0]|0)+(d[p+r>>0]|0)|0;y=(d[p+(r+2)>>0]|0)+(d[p+(r+1)>>0]|0)+(d[p+(r+3)>>0]|0)+(d[p+(r+4)>>0]|0)|0;z=(d[p+(r+6)>>0]|0)+(d[p+(r+5)>>0]|0)+(d[p+(r+7)>>0]|0)+(d[p+(z|15)>>0]|0)|0;r=x+w|0;c[ra>>2]=y+r+(c[ra>>2]|0)+z;t=ra+4|0;c[t>>2]=r-y-z+(c[t>>2]|0);t=1;r=s+1|0}else{t=0;w=0;x=0;y=0;z=0;r=s}if((g|0)!=0?(c[b+-20>>2]|0)!=0:0){_=o+-1|0;$=na<<4;j=na<<5;ma=na*48|0;C=(d[p+(_+$)>>0]|0)+(d[p+_>>0]|0)+(d[p+(_+j)>>0]|0)+(d[p+(_+ma)>>0]|0)|0;h=na<<6;_=_+h|0;B=(d[p+(_+$)>>0]|0)+(d[p+_>>0]|0)+(d[p+(_+j)>>0]|0)+(d[p+(_+ma)>>0]|0)|0;_=_+h|0;A=(d[p+(_+$)>>0]|0)+(d[p+_>>0]|0)+(d[p+(_+j)>>0]|0)+(d[p+(_+ma)>>0]|0)|0;h=_+h|0;ma=(d[p+(h+$)>>0]|0)+(d[p+h>>0]|0)+(d[p+(h+j)>>0]|0)+(d[p+(h+ma)>>0]|0)|0;h=B+C|0;c[ra>>2]=A+h+(c[ra>>2]|0)+ma;j=ra+16|0;c[j>>2]=h-A-ma+(c[j>>2]|0);j=r+1|0;h=1}else{j=r;C=0;B=0;A=0;ma=0;h=0}do if((na+-1|0)!=(g|0)?(c[b+412>>2]|0)!=0:0){$=o+16|0;n=na<<4;m=na<<5;o=na*48|0;b=(d[p+($+n)>>0]|0)+(d[p+$>>0]|0)+(d[p+($+m)>>0]|0)+(d[p+($+o)>>0]|0)|0;q=na<<6;$=$+q|0;l=(d[p+($+n)>>0]|0)+(d[p+$>>0]|0)+(d[p+($+m)>>0]|0)+(d[p+($+o)>>0]|0)|0;$=$+q|0;k=(d[p+($+n)>>0]|0)+(d[p+$>>0]|0)+(d[p+($+m)>>0]|0)+(d[p+($+o)>>0]|0)|0;q=$+q|0;o=(d[p+(q+n)>>0]|0)+(d[p+q>>0]|0)+(d[p+(q+m)>>0]|0)+(d[p+(q+o)>>0]|0)|0;p=j+1|0;q=h+1|0;j=l+b|0;c[ra>>2]=k+j+(c[ra>>2]|0)+o;m=ra+16|0;j=j-k-o+(c[m>>2]|0)|0;c[m>>2]=j;m=(r|0)==0;n=(h|0)!=0;if(!(m&n)){if(!m){m=1;j=p;h=q;l=21;break}}else c[ra+4>>2]=A+ma+B+C-b-l-k-o>>5;m=1;o=(s|0)!=0;b=(t|0)!=0;h=q;l=27}else l=17;while(0);if((l|0)==17){n=(h|0)!=0;if(!r){m=0;p=j;l=23}else{m=0;l=21}}if((l|0)==21){p=ra+4|0;c[p>>2]=c[p>>2]>>r+3;p=j;l=23}do if((l|0)==23){j=(h|0)==0;o=(s|0)!=0;b=(t|0)!=0;if(j&o&b){c[ra+16>>2]=F+v+D+E-z-y-x-w>>5;pa=m;h=p;oa=n;o=1;b=1;break}if(j){pa=m;h=p;oa=n}else{j=c[ra+16>>2]|0;l=27}}while(0);if((l|0)==27){c[ra+16>>2]=j>>h+3;pa=m;h=p;oa=n}if((h|0)==1)c[ra>>2]=c[ra>>2]>>4;else if((h|0)==2)c[ra>>2]=c[ra>>2]>>5;else if((h|0)==3)c[ra>>2]=(c[ra>>2]|0)*21>>10;else c[ra>>2]=c[ra>>2]>>6;Dc(ra);n=0;j=qa;m=ra;while(1){h=c[m+((n>>>2&3)<<2)>>2]|0;if((h|0)<0)h=0;else h=(h|0)>255?-1:h&255;a[j>>0]=h;h=n+1|0;if((h|0)==256)break;else{n=h;j=j+1|0;m=(h&63|0)==0?m+16|0:m}}ta=Z(u,na)|0;V=na<<3;Y=0-V|0;G=Y|1;_=G+1|0;$=Y|3;aa=$+1|0;ba=$+2|0;ca=$+3|0;da=Y|7;W=ra+4|0;ka=na<<6;H=ka|1;ea=H+1|0;fa=ka|3;ga=fa+1|0;ha=fa+2|0;ia=fa+3|0;ja=ka|7;I=V+-1|0;U=na<<4;J=U+-1|0;K=J+V|0;L=J+U|0;M=L+V|0;N=L+U|0;O=N+V|0;X=ra+16|0;P=V+8|0;Q=U|8;R=Q+V|0;S=Q+U|0;T=S+V|0;U=S+U|0;V=U+V|0;la=ta<<6;q=E;p=D;h=F;t=v;n=w;j=x;l=y;u=z;F=0;m=C;k=B;r=A;s=ma;E=(c[e>>2]|0)+((Z(f<<6,na)|0)+(g<<3)+(ta<<8))|0;while(1){id(ra,0,64);if(o){q=(d[E+G>>0]|0)+(d[E+Y>>0]|0)|0;p=(d[E+$>>0]|0)+(d[E+_>>0]|0)|0;z=(d[E+ba>>0]|0)+(d[E+aa>>0]|0)|0;A=(d[E+da>>0]|0)+(d[E+ca>>0]|0)|0;t=p+q|0;c[ra>>2]=z+t+(c[ra>>2]|0)+A;c[W>>2]=t-z-A+(c[W>>2]|0);t=1}else{z=h;A=t;t=0}if(b){B=(d[E+H>>0]|0)+(d[E+ka>>0]|0)|0;C=(d[E+fa>>0]|0)+(d[E+ea>>0]|0)|0;D=(d[E+ha>>0]|0)+(d[E+ga>>0]|0)|0;u=(d[E+ja>>0]|0)+(d[E+ia>>0]|0)|0;h=C+B|0;c[ra>>2]=D+h+(c[ra>>2]|0)+u;c[W>>2]=h-D-u+(c[W>>2]|0);h=t+1|0}else{B=n;C=j;D=l;h=t}if(oa){v=(d[E+I>>0]|0)+(d[E+-1>>0]|0)|0;w=(d[E+K>>0]|0)+(d[E+J>>0]|0)|0;x=(d[E+M>>0]|0)+(d[E+L>>0]|0)|0;y=(d[E+O>>0]|0)+(d[E+N>>0]|0)|0;t=w+v|0;c[ra>>2]=x+t+(c[ra>>2]|0)+y;c[X>>2]=t-x-y+(c[X>>2]|0);t=h+1|0;s=1}else{t=h;v=m;w=k;x=r;y=s;s=0}do if(pa){l=(d[E+P>>0]|0)+(d[E+8>>0]|0)|0;m=(d[E+R>>0]|0)+(d[E+Q>>0]|0)|0;j=(d[E+T>>0]|0)+(d[E+S>>0]|0)|0;n=(d[E+V>>0]|0)+(d[E+U>>0]|0)|0;t=t+1|0;s=s+1|0;k=m+l|0;c[ra>>2]=j+k+(c[ra>>2]|0)+n;k=k-j-n+(c[X>>2]|0)|0;c[X>>2]=k;r=(h|0)==0;if(!(r&oa))if(r){l=54;break}else{l=49;break}else{c[W>>2]=x+y+w+v-l-m-j-n>>4;l=54;break}}else if(!h){r=s;l=50}else l=49;while(0);if((l|0)==49){c[W>>2]=c[W>>2]>>h+2;r=s;l=50}do if((l|0)==50){l=0;s=(r|0)==0;if(s&o&b){c[X>>2]=z+A+p+q-u-D-C-B>>4;break}if(!s){k=c[X>>2]|0;s=r;l=54}}while(0);if((l|0)==54)c[X>>2]=k>>s+2;if((t|0)==1)c[ra>>2]=c[ra>>2]>>3;else if((t|0)==2)c[ra>>2]=c[ra>>2]>>4;else if((t|0)==3)c[ra>>2]=(c[ra>>2]|0)*21>>9;else c[ra>>2]=c[ra>>2]>>5;Dc(ra);s=0;r=qa+((F<<6)+256)|0;k=ra;while(1){t=c[k+((s>>>1&3)<<2)>>2]|0;if((t|0)<0)t=0;else t=(t|0)>255?-1:t&255;a[r>>0]=t;t=s+1|0;if((t|0)==64)break;else{s=t;r=r+1|0;k=(t&15|0)==0?k+16|0:k}}F=F+1|0;if((F|0)==2)break;else{h=z;t=A;n=B;j=C;l=D;m=v;k=w;r=x;s=y;E=E+la|0}}sc(e,qa);i=sa;return}function Dc(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0;h=i;f=a+4|0;b=c[f>>2]|0;g=a+16|0;d=c[g>>2]|0;e=c[a>>2]|0;if(!(b|d)){c[a+60>>2]=e;c[a+56>>2]=e;c[a+52>>2]=e;c[a+48>>2]=e;c[a+44>>2]=e;c[a+40>>2]=e;c[a+36>>2]=e;c[a+32>>2]=e;c[a+28>>2]=e;c[a+24>>2]=e;c[a+20>>2]=e;c[g>>2]=e;c[a+12>>2]=e;c[a+8>>2]=e;c[f>>2]=e;i=h;return}else{k=b+e|0;g=b>>1;j=g+e|0;g=e-g|0;b=e-b|0;c[a>>2]=d+k;e=d>>1;c[a+16>>2]=e+k;c[a+32>>2]=k-e;c[a+48>>2]=k-d;c[f>>2]=d+j;c[a+20>>2]=e+j;c[a+36>>2]=j-e;c[a+52>>2]=j-d;c[a+8>>2]=d+g;c[a+24>>2]=e+g;c[a+40>>2]=g-e;c[a+56>>2]=g-d;c[a+12>>2]=d+b;c[a+28>>2]=e+b;c[a+44>>2]=b-e;c[a+60>>2]=b-d;i=h;return}}function Ec(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0;h=i;id(b,0,952);d=jb(a,1)|0;if((d|0)==-1){d=1;i=h;return d|0}d=(d|0)==1;c[b>>2]=d&1;do if(d){d=jb(a,8)|0;if((d|0)==-1){d=1;i=h;return d|0}c[b+4>>2]=d;if((d|0)==255){d=jb(a,16)|0;if((d|0)==-1){d=1;i=h;return d|0}c[b+8>>2]=d;d=jb(a,16)|0;if((d|0)==-1){d=1;i=h;return d|0}else{c[b+12>>2]=d;break}}}while(0);d=jb(a,1)|0;if((d|0)==-1){d=1;i=h;return d|0}d=(d|0)==1;c[b+16>>2]=d&1;do if(d){d=jb(a,1)|0;if((d|0)==-1){d=1;i=h;return d|0}else{c[b+20>>2]=(d|0)==1&1;break}}while(0);d=jb(a,1)|0;if((d|0)==-1){d=1;i=h;return d|0}d=(d|0)==1;c[b+24>>2]=d&1;do if(d){d=jb(a,3)|0;if((d|0)==-1){d=1;i=h;return d|0}c[b+28>>2]=d;d=jb(a,1)|0;if((d|0)==-1){d=1;i=h;return d|0}c[b+32>>2]=(d|0)==1&1;d=jb(a,1)|0;if((d|0)==-1){d=1;i=h;return d|0}d=(d|0)==1;c[b+36>>2]=d&1;if(!d){c[b+40>>2]=2;c[b+44>>2]=2;c[b+48>>2]=2;break}d=jb(a,8)|0;if((d|0)==-1){d=1;i=h;return d|0}c[b+40>>2]=d;d=jb(a,8)|0;if((d|0)==-1){d=1;i=h;return d|0}c[b+44>>2]=d;d=jb(a,8)|0;if((d|0)==-1){d=1;i=h;return d|0}else{c[b+48>>2]=d;break}}else{c[b+28>>2]=5;c[b+40>>2]=2;c[b+44>>2]=2;c[b+48>>2]=2}while(0);d=jb(a,1)|0;if((d|0)==-1){d=1;i=h;return d|0}d=(d|0)==1;c[b+52>>2]=d&1;if(d){d=b+56|0;e=nb(a,d)|0;if(e){d=e;i=h;return d|0}if((c[d>>2]|0)>>>0>5){d=1;i=h;return d|0}d=b+60|0;e=nb(a,d)|0;if(e){d=e;i=h;return d|0}if((c[d>>2]|0)>>>0>5){d=1;i=h;return d|0}}d=jb(a,1)|0;if((d|0)==-1){d=1;i=h;return d|0}d=(d|0)==1;c[b+64>>2]=d&1;do if(d){d=kb(a)|0;if((lb(a,32)|0)==-1|(d|0)==0){d=1;i=h;return d|0}c[b+68>>2]=d;d=kb(a)|0;if((lb(a,32)|0)==-1|(d|0)==0){d=1;i=h;return d|0}c[b+72>>2]=d;d=jb(a,1)|0;if((d|0)==-1){d=1;i=h;return d|0}else{c[b+76>>2]=(d|0)==1&1;break}}while(0);d=jb(a,1)|0;if((d|0)==-1){d=1;i=h;return d|0}d=(d|0)==1;f=b+80|0;c[f>>2]=d&1;if(d){e=Fc(a,b+84|0)|0;if(e){d=e;i=h;return d|0}}else{c[b+84>>2]=1;c[b+96>>2]=288000001;c[b+224>>2]=288000001;c[b+480>>2]=24;c[b+484>>2]=24;c[b+488>>2]=24;c[b+492>>2]=24}e=jb(a,1)|0;if((e|0)==-1){d=1;i=h;return d|0}e=(e|0)==1;d=b+496|0;c[d>>2]=e&1;if(e){e=Fc(a,b+500|0)|0;if(e){d=e;i=h;return d|0}}else{c[b+500>>2]=1;c[b+512>>2]=240000001;c[b+640>>2]=240000001;c[b+896>>2]=24;c[b+900>>2]=24;c[b+904>>2]=24;c[b+908>>2]=24}if(!((c[f>>2]|0)==0?(c[d>>2]|0)==0:0))g=46;do if((g|0)==46){d=jb(a,1)|0;if((d|0)==-1){d=1;i=h;return d|0}else{c[b+912>>2]=(d|0)==1&1;break}}while(0);d=jb(a,1)|0;if((d|0)==-1){d=1;i=h;return d|0}c[b+916>>2]=(d|0)==1&1;d=jb(a,1)|0;if((d|0)==-1){d=1;i=h;return d|0}d=(d|0)==1;c[b+920>>2]=d&1;do if(d){d=jb(a,1)|0;if((d|0)==-1){d=1;i=h;return d|0}c[b+924>>2]=(d|0)==1&1;e=b+928|0;d=nb(a,e)|0;if(d){i=h;return d|0}if((c[e>>2]|0)>>>0>16){d=1;i=h;return d|0}e=b+932|0;d=nb(a,e)|0;if(d){i=h;return d|0}if((c[e>>2]|0)>>>0>16){d=1;i=h;return d|0}e=b+936|0;d=nb(a,e)|0;if(d){i=h;return d|0}if((c[e>>2]|0)>>>0>16){d=1;i=h;return d|0}e=b+940|0;d=nb(a,e)|0;if(d){i=h;return d|0}if((c[e>>2]|0)>>>0>16){d=1;i=h;return d|0}d=nb(a,b+944|0)|0;if(d){i=h;return d|0}d=nb(a,b+948|0)|0;if(!d)break;i=h;return d|0}else{c[b+924>>2]=1;c[b+928>>2]=2;c[b+932>>2]=1;c[b+936>>2]=16;c[b+940>>2]=16;c[b+944>>2]=16;c[b+948>>2]=16}while(0);d=0;i=h;return d|0}function Fc(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0;k=i;d=nb(a,b)|0;if(d){i=k;return d|0}d=(c[b>>2]|0)+1|0;c[b>>2]=d;if(d>>>0>32){d=1;i=k;return d|0}d=jb(a,4)|0;if((d|0)==-1){d=1;i=k;return d|0}j=b+4|0;c[j>>2]=d;e=jb(a,4)|0;if((e|0)==-1){d=1;i=k;return d|0}h=b+8|0;c[h>>2]=e;a:do if(c[b>>2]|0){g=0;while(1){f=b+(g<<2)+12|0;d=nb(a,f)|0;if(d){e=17;break}e=c[f>>2]|0;if((e|0)==-1){d=1;e=17;break}d=e+1|0;c[f>>2]=d;c[f>>2]=d<<(c[j>>2]|0)+6;f=b+(g<<2)+140|0;d=nb(a,f)|0;if(d){e=17;break}e=c[f>>2]|0;if((e|0)==-1){d=1;e=17;break}e=e+1|0;c[f>>2]=e;c[f>>2]=e<<(c[h>>2]|0)+4;e=jb(a,1)|0;if((e|0)==-1){d=1;e=17;break}c[b+(g<<2)+268>>2]=(e|0)==1&1;g=g+1|0;if(g>>>0>=(c[b>>2]|0)>>>0)break a}if((e|0)==17){i=k;return d|0}}while(0);d=jb(a,5)|0;if((d|0)==-1){d=1;i=k;return d|0}c[b+396>>2]=d+1;d=jb(a,5)|0;if((d|0)==-1){d=1;i=k;return d|0}c[b+400>>2]=d+1;d=jb(a,5)|0;if((d|0)==-1){d=1;i=k;return d|0}c[b+404>>2]=d+1;d=jb(a,5)|0;if((d|0)==-1){d=1;i=k;return d|0}c[b+408>>2]=d;d=0;i=k;return d|0}function Gc(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;p=i;a:do if(!(c[d+284>>2]|0))o=0;else{h=0;while(1){j=c[d+(h*20|0)+288>>2]|0;if((j|0)==5){o=1;break a}else if(!j)break;h=h+1|0}o=0}while(0);j=c[b+16>>2]|0;if((j|0)==1){if((c[e>>2]|0)!=5){f=c[a+12>>2]|0;if((c[a+8>>2]|0)>>>0>(c[d+12>>2]|0)>>>0)f=(c[b+12>>2]|0)+f|0}else f=0;m=c[b+36>>2]|0;h=(m|0)==0;if(h)j=0;else j=(c[d+12>>2]|0)+f|0;e=(c[e+4>>2]|0)==0;k=((e&(j|0)!=0)<<31>>31)+j|0;l=(k|0)!=0;if(l){g=k+-1|0;n=(g>>>0)%(m>>>0)|0;g=(g>>>0)/(m>>>0)|0}else{n=0;g=0}if(h)j=0;else{k=c[b+40>>2]|0;j=0;h=0;do{j=(c[k+(h<<2)>>2]|0)+j|0;h=h+1|0}while(h>>>0<m>>>0)}if(l){g=Z(j,g)|0;k=c[b+40>>2]|0;j=0;do{g=(c[k+(j<<2)>>2]|0)+g|0;j=j+1|0}while(j>>>0<=n>>>0)}else g=0;if(e)j=(c[b+28>>2]|0)+g|0;else j=g;g=(c[d+32>>2]|0)+(c[b+32>>2]|0)|0;h=a+12|0;if(!o){b=((g|0)<0?g:0)+j+(c[d+28>>2]|0)|0;c[h>>2]=f;c[a+8>>2]=c[d+12>>2];i=p;return b|0}else{c[h>>2]=0;c[a+8>>2]=0;b=0;i=p;return b|0}}else if(!j){if((c[e>>2]|0)!=5){h=c[a>>2]|0;j=c[d+20>>2]|0;if(h>>>0>j>>>0?(k=c[b+20>>2]|0,(h-j|0)>>>0>=k>>>1>>>0):0){h=(c[a+4>>2]|0)+k|0;k=a}else{k=a;m=11}}else{c[a+4>>2]=0;c[a>>2]=0;j=c[d+20>>2]|0;h=0;k=a;m=11}do if((m|0)==11){if(j>>>0>h>>>0?(g=c[b+20>>2]|0,(j-h|0)>>>0>g>>>1>>>0):0){h=(c[a+4>>2]|0)-g|0;break}h=c[a+4>>2]|0}while(0);if(!(c[e+4>>2]|0)){b=c[d+24>>2]|0;b=j+h+((b|0)<0?b:0)|0;i=p;return b|0}c[a+4>>2]=h;f=c[d+24>>2]|0;g=(f|0)<0;if(!o){c[k>>2]=j;b=j+h+(g?f:0)|0;i=p;return b|0}else{c[a+4>>2]=0;c[k>>2]=g?0-f|0:0;b=0;i=p;return b|0}}else{if((c[e>>2]|0)==5){k=0;g=0;f=a+12|0}else{j=c[d+12>>2]|0;f=a+12|0;h=c[f>>2]|0;if((c[a+8>>2]|0)>>>0>j>>>0)h=(c[b+12>>2]|0)+h|0;k=h;g=(j+h<<1)+(((c[e+4>>2]|0)==0)<<31>>31)|0}if(!o){c[f>>2]=k;c[a+8>>2]=c[d+12>>2];b=g;i=p;return b|0}else{c[f>>2]=0;c[a+8>>2]=0;b=0;i=p;return b|0}}return 0}function Hc(a,b){a=a|0;b=b|0;var d=0,e=0;d=i;Ab(a);e=fd(2112)|0;c[a+3376>>2]=e;if(e)if(!b)b=0;else{c[a+1216>>2]=1;b=0}else b=1;i=d;return b|0}function Ic(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;r=i;i=i+208|0;l=r+204|0;p=r;g=r+112|0;h=r+40|0;q=r+16|0;j=r+12|0;n=r+8|0;c[j>>2]=0;o=a+3344|0;if((c[o>>2]|0)!=0?(c[a+3348>>2]|0)==(b|0):0){b=a+3356|0;c[q+0>>2]=c[b+0>>2];c[q+4>>2]=c[b+4>>2];c[q+8>>2]=c[b+8>>2];c[q+12>>2]=c[b+12>>2];c[q+4>>2]=c[q>>2];c[q+8>>2]=0;c[q+16>>2]=0;c[f>>2]=c[a+3352>>2]}else k=4;do if((k|0)==4)if(!(Pa(b,d,q,f)|0)){d=a+3356|0;c[d+0>>2]=c[q+0>>2];c[d+4>>2]=c[q+4>>2];c[d+8>>2]=c[q+8>>2];c[d+12>>2]=c[q+12>>2];c[d+16>>2]=c[q+16>>2];c[a+3352>>2]=c[f>>2];c[a+3348>>2]=b;break}else{n=3;i=r;return n|0}while(0);c[o>>2]=0;if(sb(q,p)|0){n=3;i=r;return n|0}if(((c[p>>2]|0)+-1|0)>>>0>11){n=0;i=r;return n|0}b=Ib(q,p,a,j)|0;if(!b){do if(!(c[j>>2]|0))k=19;else{if((c[a+1184>>2]|0)!=0?(c[a+16>>2]|0)!=0:0){if(c[a+3380>>2]|0){n=3;i=r;return n|0}if(!(c[a+1188>>2]|0)){m=a+1220|0;n=a+1336|0;c[n>>2]=jc(m)|0;nc(m);Bc(a,n,0)|0}else Bc(a,a+1336|0,c[a+1372>>2]|0)|0;c[f>>2]=0;c[o>>2]=1;c[a+1180>>2]=0;g=a+1336|0;b=a+1360|0;break}c[a+1188>>2]=0;c[a+1180>>2]=0;k=19}while(0);do if((k|0)==19){b=c[p>>2]|0;if((b|0)==7)if(!(Qa(q,g)|0)){Bb(a,g)|0;n=0;i=r;return n|0}else{n=g+40|0;gd(c[n>>2]|0);c[n>>2]=0;n=g+84|0;gd(c[n>>2]|0);c[n>>2]=0;n=3;i=r;return n|0}else if((b|0)==1|(b|0)==5){k=a+1180|0;if(c[a+1180>>2]|0){n=0;i=r;return n|0}c[a+1184>>2]=1;if(Fb(a)|0){c[a+1204>>2]=0;c[a+1208>>2]=e;Ua(q,l)|0;j=a+8|0;d=c[j>>2]|0;b=Db(a,c[l>>2]|0,(c[p>>2]|0)==5&1)|0;if(b){c[a+4>>2]=256;c[a+12>>2]=0;c[j>>2]=32;c[a+16>>2]=0;c[a+3380>>2]=0;n=(b|0)==65535?5:4;i=r;return n|0}if((d|0)!=(c[j>>2]|0)){d=c[a+16>>2]|0;c[n>>2]=1;b=c[a>>2]|0;if(b>>>0<32)b=c[a+(b<<2)+20>>2]|0;else b=0;c[f>>2]=0;c[o>>2]=1;if((((((c[p>>2]|0)==5?(l=_a(n,q,d,c[a+12>>2]|0,5)|0,(c[n>>2]|l|0)==0):0)?(m=a+1220|0,!((c[a+1276>>2]|0)!=0|(b|0)==0)):0)?(c[b+52>>2]|0)==(c[d+52>>2]|0):0)?(c[b+56>>2]|0)==(c[d+56>>2]|0):0)?(c[b+88>>2]|0)==(c[d+88>>2]|0):0)qc(m);else c[a+1280>>2]=0;c[a>>2]=c[j>>2];n=2;i=r;return n|0}}if(c[a+3380>>2]|0){n=3;i=r;return n|0}h=a+1368|0;j=a+2356|0;b=a+16|0;if(Ta(q,j,c[b>>2]|0,c[a+12>>2]|0,p)|0){n=3;i=r;return n|0}if(!(Fb(a)|0))d=a+1220|0;else{d=a+1220|0;if((c[p>>2]|0)!=5?(oc(d,c[a+2368>>2]|0,(c[p+4>>2]|0)!=0&1,c[(c[b>>2]|0)+48>>2]|0)|0)!=0:0){n=3;i=r;return n|0}c[a+1336>>2]=jc(d)|0}od(h|0,j|0,988)|0;c[a+1188>>2]=1;b=a+1360|0;l=p;m=c[l+4>>2]|0;n=b;c[n>>2]=c[l>>2];c[n+4>>2]=m;Hb(a,c[a+1432>>2]|0);nc(d);if(gc(d,a+1436|0,c[a+1380>>2]|0,c[a+1412>>2]|0)|0){n=3;i=r;return n|0}g=a+1336|0;if($a(q,a,g,h)|0){ab(a,c[h>>2]|0);n=3;i=r;return n|0}if(!(Gb(a)|0)){n=0;i=r;return n|0}else{c[k>>2]=1;break}}else if((b|0)==8)if(!(Sa(q,h)|0)){Cb(a,h)|0;n=0;i=r;return n|0}else{n=h+20|0;gd(c[n>>2]|0);c[n>>2]=0;n=h+24|0;gd(c[n>>2]|0);c[n>>2]=0;n=h+28|0;gd(c[n>>2]|0);c[n>>2]=0;n=h+44|0;gd(c[n>>2]|0);c[n>>2]=0;n=3;i=r;return n|0}else{n=0;i=r;return n|0}}while(0);uc(g,c[a+1212>>2]|0);Eb(a);j=Gc(a+1284|0,c[a+16>>2]|0,a+1368|0,b)|0;d=a+1188|0;do if(c[d>>2]|0){h=a+1220|0;if(!(c[a+1364>>2]|0)){hc(h,0,g,c[a+1380>>2]|0,j,(c[b>>2]|0)==5&1,c[a+1208>>2]|0,c[a+1204>>2]|0)|0;break}else{hc(h,a+1644|0,g,c[a+1380>>2]|0,j,(c[b>>2]|0)==5&1,c[a+1208>>2]|0,c[a+1204>>2]|0)|0;break}}while(0);c[a+1184>>2]=0;c[d>>2]=0;n=1;i=r;return n|0}else if((b|0)==65520){n=4;i=r;return n|0}else{n=3;i=r;return n|0}return 0}function Jc(a){a=a|0;var b=0,d=0,e=0,f=0;f=i;e=0;do{d=a+(e<<2)+20|0;b=c[d>>2]|0;if(b){gd(c[b+40>>2]|0);c[(c[d>>2]|0)+40>>2]=0;gd(c[(c[d>>2]|0)+84>>2]|0);c[(c[d>>2]|0)+84>>2]=0;gd(c[d>>2]|0);c[d>>2]=0}e=e+1|0}while((e|0)!=32);e=0;do{d=a+(e<<2)+148|0;b=c[d>>2]|0;if(b){gd(c[b+20>>2]|0);c[(c[d>>2]|0)+20>>2]=0;gd(c[(c[d>>2]|0)+24>>2]|0);c[(c[d>>2]|0)+24>>2]=0;gd(c[(c[d>>2]|0)+28>>2]|0);c[(c[d>>2]|0)+28>>2]=0;gd(c[(c[d>>2]|0)+44>>2]|0);c[(c[d>>2]|0)+44>>2]=0;gd(c[d>>2]|0);c[d>>2]=0}e=e+1|0}while((e|0)!=256);b=a+3376|0;gd(c[b>>2]|0);c[b>>2]=0;b=a+1212|0;gd(c[b>>2]|0);c[b>>2]=0;b=a+1172|0;gd(c[b>>2]|0);c[b>>2]=0;mc(a+1220|0);i=f;return}function Kc(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0;f=i;a=pc(a+1220|0)|0;if(!a){a=0;i=f;return a|0}c[b>>2]=c[a+4>>2];c[d>>2]=c[a+12>>2];c[e>>2]=c[a+8>>2];a=c[a>>2]|0;i=f;return a|0}function Lc(a){a=a|0;var b=0;b=i;a=c[a+16>>2]|0;if(!a){a=0;i=b;return a|0}a=c[a+52>>2]|0;i=b;return a|0}function Mc(a){a=a|0;var b=0;b=i;a=c[a+16>>2]|0;if(!a){a=0;i=b;return a|0}a=c[a+56>>2]|0;i=b;return a|0}function Nc(a){a=a|0;var b=0;b=i;qc(a+1220|0);i=b;return}function Oc(a){a=a|0;var b=0;b=i;a=(Jb(a)|0)==0&1;i=b;return a|0}function Pc(a){a=a|0;var b=0,d=0;d=i;a=c[a+16>>2]|0;if(((((a|0)!=0?(c[a+80>>2]|0)!=0:0)?(b=c[a+84>>2]|0,(b|0)!=0):0)?(c[b+24>>2]|0)!=0:0)?(c[b+32>>2]|0)!=0:0){a=1;i=d;return a|0}a=0;i=d;return a|0}function Qc(a){a=a|0;var b=0,d=0;d=i;a=c[a+16>>2]|0;if(((((a|0)!=0?(c[a+80>>2]|0)!=0:0)?(b=c[a+84>>2]|0,(b|0)!=0):0)?(c[b+24>>2]|0)!=0:0)?(c[b+36>>2]|0)!=0:0)a=c[b+48>>2]|0;else a=2;i=d;return a|0}function Rc(a,b,d,e,f,g){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0;h=i;a=c[a+16>>2]|0;if((a|0)!=0?(c[a+60>>2]|0)!=0:0){c[b>>2]=1;b=a+64|0;c[d>>2]=c[b>>2]<<1;c[e>>2]=(c[a+52>>2]<<4)-((c[a+68>>2]|0)+(c[b>>2]|0)<<1);b=a+72|0;c[f>>2]=c[b>>2]<<1;a=(c[a+56>>2]<<4)-((c[a+76>>2]|0)+(c[b>>2]|0)<<1)|0;c[g>>2]=a;i=h;return}c[b>>2]=0;c[d>>2]=0;c[e>>2]=0;c[f>>2]=0;a=0;c[g>>2]=a;i=h;return}function Sc(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0;f=i;a=c[a+16>>2]|0;a:do if((((a|0)!=0?(c[a+80>>2]|0)!=0:0)?(e=c[a+84>>2]|0,(e|0)!=0):0)?(c[e>>2]|0)!=0:0){a=c[e+4>>2]|0;do switch(a|0){case 8:{e=11;a=32;break a}case 13:{e=99;a=160;break a}case 12:{e=33;a=64;break a}case 6:{e=11;a=24;break a}case 7:{e=11;a=20;break a}case 255:{a=c[e+8>>2]|0;e=c[e+12>>2]|0;g=(a|0)==0|(e|0)==0;e=g?0:e;a=g?0:a;break a}case 5:{e=33;a=40;break a}case 4:{e=11;a=16;break a}case 3:{e=11;a=10;break a}case 1:case 0:{e=a;break a}case 2:{e=11;a=12;break a}case 10:{e=11;a=18;break a}case 9:{e=33;a=80;break a}case 11:{e=11;a=15;break a}default:{e=0;a=0;break a}}while(0)}else{e=1;a=1}while(0);c[b>>2]=a;c[d>>2]=e;i=f;return}function Tc(a){a=a|0;a=c[a+16>>2]|0;if(!a)a=0;else a=c[a>>2]|0;return a|0}function Uc(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;f=i;do if(a){d=fd(3396)|0;if(d){e=d+8|0;if(!(Hc(e,b)|0)){c[d>>2]=1;c[d+4>>2]=0;c[a>>2]=d;d=0;break}else{Jc(e);gd(d);d=-4;break}}else d=-4}else d=-1;while(0);i=f;return d|0}function Vc(a,b){a=a|0;b=b|0;var d=0,e=0;e=i;if((a|0)==0|(b|0)==0){a=-1;i=e;return a|0}d=a+8|0;if(!(c[a+24>>2]|0)){a=-6;i=e;return a|0}if(!(c[a+20>>2]|0)){a=-6;i=e;return a|0}c[b+4>>2]=(Lc(d)|0)<<4;c[b+8>>2]=(Mc(d)|0)<<4;c[b+12>>2]=Pc(d)|0;c[b+16>>2]=Qc(d)|0;Rc(d,b+28|0,b+32|0,b+36|0,b+40|0,b+44|0);Sc(d,b+20|0,b+24|0);c[b>>2]=Tc(d)|0;a=0;i=e;return a|0}function Wc(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;m=i;i=i+16|0;j=m;a:do if((!((b|0)==0|(d|0)==0)?(f=c[b>>2]|0,(f|0)!=0):0)?(g=c[b+4>>2]|0,(g|0)!=0):0)if((a|0)!=0?(e=c[a>>2]|0,(e|0)!=0):0){c[d>>2]=0;c[j>>2]=0;k=a+8|0;c[a+3392>>2]=c[b+12>>2];h=b+8|0;b=1;while(1){if((e|0)==2){l=8;break}e=Ic(k,f,g,c[h>>2]|0,j)|0;n=c[j>>2]|0;f=f+n|0;g=g-n|0;g=(g|0)<0?0:g;c[d>>2]=f;if((e|0)==5){b=-4;break a}else if((e|0)==4){e=(Oc(k)|0|g|0)==0;b=e?-2:b}else if((e|0)==2)break;else if((e|0)==1){l=13;break}if(!g)break a;e=c[a>>2]|0}if((l|0)==8){c[a>>2]=1;c[d>>2]=f+(c[j>>2]|0)}else if((l|0)==13){b=a+4|0;c[b>>2]=(c[b>>2]|0)+1;b=(g|0)==0?2:3;break}b=a+1288|0;if((c[b>>2]|0)!=0?(c[a+1244>>2]|0)!=(c[a+1248>>2]|0):0){c[b>>2]=0;c[a>>2]=2;b=3}else b=4}else b=-3;else b=-1;while(0);i=m;return b|0}function Xc(a){a=a|0;c[a>>2]=2;c[a+4>>2]=3;return}function Yc(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0;h=i;i=i+16|0;f=h+8|0;e=h+4|0;g=h;if((a|0)==0|(b|0)==0){a=-1;i=h;return a|0}a=a+8|0;if(d)Nc(a);a=Kc(a,g,e,f)|0;if(!a){a=0;i=h;return a|0}c[b>>2]=a;c[b+4>>2]=c[g>>2];c[b+8>>2]=c[e>>2];c[b+12>>2]=c[f>>2];a=2;i=h;return a|0}function Zc(a){a=a|0;var b=0,d=0;d=i;b=jd(a)|0;c[1792]=b;c[1791]=b;c[1790]=a;c[1793]=b+a;i=d;return b|0}function _c(a){a=a|0;c[1790]=a;return}function $c(){var a=0;a=i;c[1786]=c[1791];c[1787]=c[1790];do bd()|0;while((c[1787]|0)!=0);i=a;return}function ad(){var a=0,b=0;b=i;if(Uc(7176,0)|0){da(7280)|0;a=c[1784]|0;if(a)kd(a)}else{c[1796]=1;c[1798]=1}i=b;return -1}function bd(){var a=0,b=0,d=0;b=i;c[1788]=c[1798];a=Wc(c[1794]|0,7144,7200)|0;switch(a|0){case 1:case -2:{c[1787]=0;i=b;return a|0}case 4:{if(Vc(c[1794]|0,7208)|0){a=-1;i=b;return a|0}c[1814]=(Z((c[1803]|0)*3|0,c[1804]|0)|0)>>>1;ra();a=c[1800]|0;c[1787]=(c[1786]|0)-a+(c[1787]|0);c[1786]=a;a=0;i=b;return a|0}case 2:{c[1787]=0;break}case 3:{d=c[1800]|0;c[1787]=(c[1786]|0)-d+(c[1787]|0);c[1786]=d;break}default:{i=b;return a|0}}c[1798]=(c[1798]|0)+1;if((Yc(c[1794]|0,7264,0)|0)!=2){i=b;return a|0}do{c[1796]=(c[1796]|0)+1;ca(c[1816]|0,c[1803]|0,c[1804]|0)}while((Yc(c[1794]|0,7264,0)|0)==2);i=b;return a|0}function cd(){var a=0,b=0;b=i;a=c[1784]|0;if(a)kd(a);i=b;return}function dd(){var a=0,b=0;b=i;i=i+16|0;a=b;Xc(a);i=b;return c[a>>2]|0}function ed(){var a=0,b=0;b=i;i=i+16|0;a=b;Xc(a);i=b;return c[a+4>>2]|0}function fd(a){a=a|0;var b=0;b=i;a=jd(a)|0;i=b;return a|0}function gd(a){a=a|0;var b=0;b=i;kd(a);i=b;return}function hd(a,b,c){a=a|0;b=b|0;c=c|0;var d=0;d=i;od(a|0,b|0,c|0)|0;i=d;return}function id(a,b,c){a=a|0;b=b|0;c=c|0;var d=0;d=i;nd(a|0,b&255|0,c|0)|0;i=d;return}function jd(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0;L=i;do if(a>>>0<245){if(a>>>0<11)p=16;else p=a+11&-8;a=p>>>3;l=c[1828]|0;k=l>>>a;if(k&3){g=(k&1^1)+a|0;b=g<<1;h=7352+(b<<2)|0;b=7352+(b+2<<2)|0;e=c[b>>2]|0;j=e+8|0;f=c[j>>2]|0;do if((h|0)!=(f|0)){if(f>>>0<(c[1832]|0)>>>0)ka();d=f+12|0;if((c[d>>2]|0)==(e|0)){c[d>>2]=h;c[b>>2]=f;break}else ka()}else c[1828]=l&~(1<<g);while(0);x=g<<3;c[e+4>>2]=x|3;x=e+(x|4)|0;c[x>>2]=c[x>>2]|1;x=j;i=L;return x|0}j=c[1830]|0;if(p>>>0>j>>>0){if(k){g=2<<a;g=k<<a&(g|0-g);g=(g&0-g)+-1|0;a=g>>>12&16;g=g>>>a;h=g>>>5&8;g=g>>>h;d=g>>>2&4;g=g>>>d;e=g>>>1&2;g=g>>>e;f=g>>>1&1;f=(h|a|d|e|f)+(g>>>f)|0;g=f<<1;e=7352+(g<<2)|0;g=7352+(g+2<<2)|0;d=c[g>>2]|0;a=d+8|0;h=c[a>>2]|0;do if((e|0)!=(h|0)){if(h>>>0<(c[1832]|0)>>>0)ka();j=h+12|0;if((c[j>>2]|0)==(d|0)){c[j>>2]=e;c[g>>2]=h;m=c[1830]|0;break}else ka()}else{c[1828]=l&~(1<<f);m=j}while(0);x=f<<3;k=x-p|0;c[d+4>>2]=p|3;b=d+p|0;c[d+(p|4)>>2]=k|1;c[d+x>>2]=k;if(m){e=c[1833]|0;g=m>>>3;h=g<<1;f=7352+(h<<2)|0;j=c[1828]|0;g=1<<g;if(j&g){j=7352+(h+2<<2)|0;h=c[j>>2]|0;if(h>>>0<(c[1832]|0)>>>0)ka();else{n=j;o=h}}else{c[1828]=j|g;n=7352+(h+2<<2)|0;o=f}c[n>>2]=e;c[o+12>>2]=e;c[e+8>>2]=o;c[e+12>>2]=f}c[1830]=k;c[1833]=b;x=a;i=L;return x|0}k=c[1829]|0;if(k){l=(k&0-k)+-1|0;w=l>>>12&16;l=l>>>w;v=l>>>5&8;l=l>>>v;x=l>>>2&4;l=l>>>x;j=l>>>1&2;l=l>>>j;m=l>>>1&1;m=c[7616+((v|w|x|j|m)+(l>>>m)<<2)>>2]|0;l=(c[m+4>>2]&-8)-p|0;j=m;while(1){d=c[j+16>>2]|0;if(!d){d=c[j+20>>2]|0;if(!d)break}j=(c[d+4>>2]&-8)-p|0;x=j>>>0<l>>>0;l=x?j:l;j=d;m=x?d:m}k=c[1832]|0;if(m>>>0<k>>>0)ka();b=m+p|0;if(m>>>0>=b>>>0)ka();a=c[m+24>>2]|0;g=c[m+12>>2]|0;do if((g|0)==(m|0)){h=m+20|0;j=c[h>>2]|0;if(!j){h=m+16|0;j=c[h>>2]|0;if(!j){e=0;break}}while(1){f=j+20|0;g=c[f>>2]|0;if(g){j=g;h=f;continue}f=j+16|0;g=c[f>>2]|0;if(!g)break;else{j=g;h=f}}if(h>>>0<k>>>0)ka();else{c[h>>2]=0;e=j;break}}else{f=c[m+8>>2]|0;if(f>>>0<k>>>0)ka();j=f+12|0;if((c[j>>2]|0)!=(m|0))ka();h=g+8|0;if((c[h>>2]|0)==(m|0)){c[j>>2]=g;c[h>>2]=f;e=g;break}else ka()}while(0);do if(a){j=c[m+28>>2]|0;h=7616+(j<<2)|0;if((m|0)==(c[h>>2]|0)){c[h>>2]=e;if(!e){c[1829]=c[1829]&~(1<<j);break}}else{if(a>>>0<(c[1832]|0)>>>0)ka();j=a+16|0;if((c[j>>2]|0)==(m|0))c[j>>2]=e;else c[a+20>>2]=e;if(!e)break}h=c[1832]|0;if(e>>>0<h>>>0)ka();c[e+24>>2]=a;j=c[m+16>>2]|0;do if(j)if(j>>>0<h>>>0)ka();else{c[e+16>>2]=j;c[j+24>>2]=e;break}while(0);f=c[m+20>>2]|0;if(f)if(f>>>0<(c[1832]|0)>>>0)ka();else{c[e+20>>2]=f;c[f+24>>2]=e;break}}while(0);if(l>>>0<16){x=l+p|0;c[m+4>>2]=x|3;x=m+(x+4)|0;c[x>>2]=c[x>>2]|1}else{c[m+4>>2]=p|3;c[m+(p|4)>>2]=l|1;c[m+(l+p)>>2]=l;d=c[1830]|0;if(d){e=c[1833]|0;g=d>>>3;h=g<<1;f=7352+(h<<2)|0;j=c[1828]|0;g=1<<g;if(j&g){j=7352+(h+2<<2)|0;h=c[j>>2]|0;if(h>>>0<(c[1832]|0)>>>0)ka();else{r=j;q=h}}else{c[1828]=j|g;r=7352+(h+2<<2)|0;q=f}c[r>>2]=e;c[q+12>>2]=e;c[e+8>>2]=q;c[e+12>>2]=f}c[1830]=l;c[1833]=b}x=m+8|0;i=L;return x|0}}}else if(a>>>0<=4294967231){a=a+11|0;p=a&-8;m=c[1829]|0;if(m){h=0-p|0;a=a>>>8;if(a)if(p>>>0>16777215)l=31;else{q=(a+1048320|0)>>>16&8;r=a<<q;o=(r+520192|0)>>>16&4;r=r<<o;l=(r+245760|0)>>>16&2;l=14-(o|q|l)+(r<<l>>>15)|0;l=p>>>(l+7|0)&1|l<<1}else l=0;j=c[7616+(l<<2)>>2]|0;a:do if(!j){a=0;k=0}else{if((l|0)==31)k=0;else k=25-(l>>>1)|0;f=h;a=0;e=p<<k;k=0;while(1){g=c[j+4>>2]&-8;h=g-p|0;if(h>>>0<f>>>0)if((g|0)==(p|0)){a=j;k=j;break a}else k=j;else h=f;r=c[j+20>>2]|0;j=c[j+(e>>>31<<2)+16>>2]|0;a=(r|0)==0|(r|0)==(j|0)?a:r;if(!j)break;else{f=h;e=e<<1}}}while(0);if((a|0)==0&(k|0)==0){a=2<<l;a=m&(a|0-a);if(!a)break;r=(a&0-a)+-1|0;n=r>>>12&16;r=r>>>n;m=r>>>5&8;r=r>>>m;o=r>>>2&4;r=r>>>o;q=r>>>1&2;r=r>>>q;a=r>>>1&1;a=c[7616+((m|n|o|q|a)+(r>>>a)<<2)>>2]|0}if(!a){n=h;m=k}else while(1){r=(c[a+4>>2]&-8)-p|0;j=r>>>0<h>>>0;h=j?r:h;k=j?a:k;j=c[a+16>>2]|0;if(j){a=j;continue}a=c[a+20>>2]|0;if(!a){n=h;m=k;break}}if((m|0)!=0?n>>>0<((c[1830]|0)-p|0)>>>0:0){k=c[1832]|0;if(m>>>0<k>>>0)ka();o=m+p|0;if(m>>>0>=o>>>0)ka();a=c[m+24>>2]|0;g=c[m+12>>2]|0;do if((g|0)==(m|0)){h=m+20|0;j=c[h>>2]|0;if(!j){h=m+16|0;j=c[h>>2]|0;if(!j){b=0;break}}while(1){f=j+20|0;g=c[f>>2]|0;if(g){j=g;h=f;continue}f=j+16|0;g=c[f>>2]|0;if(!g)break;else{j=g;h=f}}if(h>>>0<k>>>0)ka();else{c[h>>2]=0;b=j;break}}else{f=c[m+8>>2]|0;if(f>>>0<k>>>0)ka();j=f+12|0;if((c[j>>2]|0)!=(m|0))ka();h=g+8|0;if((c[h>>2]|0)==(m|0)){c[j>>2]=g;c[h>>2]=f;b=g;break}else ka()}while(0);do if(a){j=c[m+28>>2]|0;h=7616+(j<<2)|0;if((m|0)==(c[h>>2]|0)){c[h>>2]=b;if(!b){c[1829]=c[1829]&~(1<<j);break}}else{if(a>>>0<(c[1832]|0)>>>0)ka();j=a+16|0;if((c[j>>2]|0)==(m|0))c[j>>2]=b;else c[a+20>>2]=b;if(!b)break}h=c[1832]|0;if(b>>>0<h>>>0)ka();c[b+24>>2]=a;j=c[m+16>>2]|0;do if(j)if(j>>>0<h>>>0)ka();else{c[b+16>>2]=j;c[j+24>>2]=b;break}while(0);j=c[m+20>>2]|0;if(j)if(j>>>0<(c[1832]|0)>>>0)ka();else{c[b+20>>2]=j;c[j+24>>2]=b;break}}while(0);b:do if(n>>>0>=16){c[m+4>>2]=p|3;c[m+(p|4)>>2]=n|1;c[m+(n+p)>>2]=n;j=n>>>3;if(n>>>0<256){g=j<<1;d=7352+(g<<2)|0;h=c[1828]|0;j=1<<j;do if(!(h&j)){c[1828]=h|j;t=7352+(g+2<<2)|0;u=d}else{f=7352+(g+2<<2)|0;e=c[f>>2]|0;if(e>>>0>=(c[1832]|0)>>>0){t=f;u=e;break}ka()}while(0);c[t>>2]=o;c[u+12>>2]=o;c[m+(p+8)>>2]=u;c[m+(p+12)>>2]=d;break}d=n>>>8;if(d)if(n>>>0>16777215)f=31;else{w=(d+1048320|0)>>>16&8;x=d<<w;u=(x+520192|0)>>>16&4;x=x<<u;f=(x+245760|0)>>>16&2;f=14-(u|w|f)+(x<<f>>>15)|0;f=n>>>(f+7|0)&1|f<<1}else f=0;h=7616+(f<<2)|0;c[m+(p+28)>>2]=f;c[m+(p+20)>>2]=0;c[m+(p+16)>>2]=0;j=c[1829]|0;g=1<<f;if(!(j&g)){c[1829]=j|g;c[h>>2]=o;c[m+(p+24)>>2]=h;c[m+(p+12)>>2]=o;c[m+(p+8)>>2]=o;break}j=c[h>>2]|0;if((f|0)==31)d=0;else d=25-(f>>>1)|0;c:do if((c[j+4>>2]&-8|0)!=(n|0)){f=n<<d;while(1){g=j+(f>>>31<<2)+16|0;h=c[g>>2]|0;if(!h)break;if((c[h+4>>2]&-8|0)==(n|0)){v=h;break c}else{f=f<<1;j=h}}if(g>>>0<(c[1832]|0)>>>0)ka();else{c[g>>2]=o;c[m+(p+24)>>2]=j;c[m+(p+12)>>2]=o;c[m+(p+8)>>2]=o;break b}}else v=j;while(0);b=v+8|0;d=c[b>>2]|0;x=c[1832]|0;if(v>>>0>=x>>>0&d>>>0>=x>>>0){c[d+12>>2]=o;c[b>>2]=o;c[m+(p+8)>>2]=d;c[m+(p+12)>>2]=v;c[m+(p+24)>>2]=0;break}else ka()}else{x=n+p|0;c[m+4>>2]=x|3;x=m+(x+4)|0;c[x>>2]=c[x>>2]|1}while(0);x=m+8|0;i=L;return x|0}}}else p=-1;while(0);k=c[1830]|0;if(k>>>0>=p>>>0){d=k-p|0;b=c[1833]|0;if(d>>>0>15){c[1833]=b+p;c[1830]=d;c[b+(p+4)>>2]=d|1;c[b+k>>2]=d;c[b+4>>2]=p|3}else{c[1830]=0;c[1833]=0;c[b+4>>2]=k|3;x=b+(k+4)|0;c[x>>2]=c[x>>2]|1}x=b+8|0;i=L;return x|0}k=c[1831]|0;if(k>>>0>p>>>0){w=k-p|0;c[1831]=w;x=c[1834]|0;c[1834]=x+p;c[x+(p+4)>>2]=w|1;c[x+4>>2]=p|3;x=x+8|0;i=L;return x|0}do if(!(c[1946]|0)){k=ua(30)|0;if(!(k+-1&k)){c[1948]=k;c[1947]=k;c[1949]=-1;c[1950]=-1;c[1951]=0;c[1939]=0;c[1946]=(ta(0)|0)&-16^1431655768;break}else ka()}while(0);l=p+48|0;g=c[1948]|0;f=p+47|0;h=g+f|0;g=0-g|0;m=h&g;if(m>>>0<=p>>>0){x=0;i=L;return x|0}a=c[1938]|0;if((a|0)!=0?(u=c[1936]|0,v=u+m|0,v>>>0<=u>>>0|v>>>0>a>>>0):0){x=0;i=L;return x|0}d:do if(!(c[1939]&4)){j=c[1834]|0;e:do if(j){a=7760|0;while(1){k=c[a>>2]|0;if(k>>>0<=j>>>0?(s=a+4|0,(k+(c[s>>2]|0)|0)>>>0>j>>>0):0)break;a=c[a+8>>2]|0;if(!a){A=181;break e}}if(a){k=h-(c[1831]|0)&g;if(k>>>0<2147483647){j=ma(k|0)|0;if((j|0)==((c[a>>2]|0)+(c[s>>2]|0)|0))A=190;else A=191}else k=0}else A=181}else A=181;while(0);do if((A|0)==181){j=ma(0)|0;if((j|0)!=(-1|0)){a=j;k=c[1947]|0;h=k+-1|0;if(!(h&a))k=m;else k=m-a+(h+a&0-k)|0;a=c[1936]|0;h=a+k|0;if(k>>>0>p>>>0&k>>>0<2147483647){v=c[1938]|0;if((v|0)!=0?h>>>0<=a>>>0|h>>>0>v>>>0:0){k=0;break}h=ma(k|0)|0;if((h|0)==(j|0))A=190;else{j=h;A=191}}else k=0}else k=0}while(0);f:do if((A|0)==190){if((j|0)!=(-1|0)){w=j;s=k;A=201;break d}}else if((A|0)==191){a=0-k|0;do if((j|0)!=(-1|0)&k>>>0<2147483647&l>>>0>k>>>0?(d=c[1948]|0,d=f-k+d&0-d,d>>>0<2147483647):0)if((ma(d|0)|0)==(-1|0)){ma(a|0)|0;k=0;break f}else{k=d+k|0;break}while(0);if((j|0)==(-1|0))k=0;else{w=j;s=k;A=201;break d}}while(0);c[1939]=c[1939]|4;A=198}else{k=0;A=198}while(0);if((((A|0)==198?m>>>0<2147483647:0)?(w=ma(m|0)|0,x=ma(0)|0,(w|0)!=(-1|0)&(x|0)!=(-1|0)&w>>>0<x>>>0):0)?(z=x-w|0,y=z>>>0>(p+40|0)>>>0,y):0){s=y?z:k;A=201}if((A|0)==201){j=(c[1936]|0)+s|0;c[1936]=j;if(j>>>0>(c[1937]|0)>>>0)c[1937]=j;o=c[1834]|0;g:do if(o){f=7760|0;while(1){k=c[f>>2]|0;g=f+4|0;j=c[g>>2]|0;if((w|0)==(k+j|0)){A=213;break}h=c[f+8>>2]|0;if(!h)break;else f=h}if(((A|0)==213?(c[f+12>>2]&8|0)==0:0)?o>>>0>=k>>>0&o>>>0<w>>>0:0){c[g>>2]=j+s;d=(c[1831]|0)+s|0;b=o+8|0;if(!(b&7))b=0;else b=0-b&7;x=d-b|0;c[1834]=o+b;c[1831]=x;c[o+(b+4)>>2]=x|1;c[o+(d+4)>>2]=40;c[1835]=c[1950];break}k=c[1832]|0;if(w>>>0<k>>>0){c[1832]=w;k=w}h=w+s|0;g=7760|0;while(1){if((c[g>>2]|0)==(h|0)){A=223;break}j=c[g+8>>2]|0;if(!j)break;else g=j}if((A|0)==223?(c[g+12>>2]&8|0)==0:0){c[g>>2]=w;j=g+4|0;c[j>>2]=(c[j>>2]|0)+s;j=w+8|0;if(!(j&7))r=0;else r=0-j&7;j=w+(s+8)|0;if(!(j&7))b=0;else b=0-j&7;j=w+(b+s)|0;q=r+p|0;n=w+q|0;d=j-(w+r)-p|0;c[w+(r+4)>>2]=p|3;h:do if((j|0)!=(o|0)){if((j|0)==(c[1833]|0)){x=(c[1830]|0)+d|0;c[1830]=x;c[1833]=n;c[w+(q+4)>>2]=x|1;c[w+(x+q)>>2]=x;break}l=s+4|0;h=c[w+(l+b)>>2]|0;if((h&3|0)==1){m=h&-8;e=h>>>3;i:do if(h>>>0>=256){a=c[w+((b|24)+s)>>2]|0;g=c[w+(s+12+b)>>2]|0;do if((g|0)==(j|0)){g=b|16;f=w+(l+g)|0;h=c[f>>2]|0;if(!h){g=w+(g+s)|0;h=c[g>>2]|0;if(!h){H=0;break}}else g=f;while(1){e=h+20|0;f=c[e>>2]|0;if(f){h=f;g=e;continue}e=h+16|0;f=c[e>>2]|0;if(!f)break;else{h=f;g=e}}if(g>>>0<k>>>0)ka();else{c[g>>2]=0;H=h;break}}else{f=c[w+((b|8)+s)>>2]|0;if(f>>>0<k>>>0)ka();k=f+12|0;if((c[k>>2]|0)!=(j|0))ka();h=g+8|0;if((c[h>>2]|0)==(j|0)){c[k>>2]=g;c[h>>2]=f;H=g;break}else ka()}while(0);if(!a)break;k=c[w+(s+28+b)>>2]|0;h=7616+(k<<2)|0;do if((j|0)!=(c[h>>2]|0)){if(a>>>0<(c[1832]|0)>>>0)ka();k=a+16|0;if((c[k>>2]|0)==(j|0))c[k>>2]=H;else c[a+20>>2]=H;if(!H)break i}else{c[h>>2]=H;if(H)break;c[1829]=c[1829]&~(1<<k);break i}while(0);h=c[1832]|0;if(H>>>0<h>>>0)ka();c[H+24>>2]=a;j=b|16;k=c[w+(j+s)>>2]|0;do if(k)if(k>>>0<h>>>0)ka();else{c[H+16>>2]=k;c[k+24>>2]=H;break}while(0);j=c[w+(l+j)>>2]|0;if(!j)break;if(j>>>0<(c[1832]|0)>>>0)ka();else{c[H+20>>2]=j;c[j+24>>2]=H;break}}else{g=c[w+((b|8)+s)>>2]|0;f=c[w+(s+12+b)>>2]|0;h=7352+(e<<1<<2)|0;do if((g|0)!=(h|0)){if(g>>>0<k>>>0)ka();if((c[g+12>>2]|0)==(j|0))break;ka()}while(0);if((f|0)==(g|0)){c[1828]=c[1828]&~(1<<e);break}do if((f|0)==(h|0))D=f+8|0;else{if(f>>>0<k>>>0)ka();k=f+8|0;if((c[k>>2]|0)==(j|0)){D=k;break}ka()}while(0);c[g+12>>2]=f;c[D>>2]=g}while(0);j=w+((m|b)+s)|0;k=m+d|0}else k=d;j=j+4|0;c[j>>2]=c[j>>2]&-2;c[w+(q+4)>>2]=k|1;c[w+(k+q)>>2]=k;j=k>>>3;if(k>>>0<256){g=j<<1;f=7352+(g<<2)|0;h=c[1828]|0;j=1<<j;do if(!(h&j)){c[1828]=h|j;I=7352+(g+2<<2)|0;J=f}else{j=7352+(g+2<<2)|0;h=c[j>>2]|0;if(h>>>0>=(c[1832]|0)>>>0){I=j;J=h;break}ka()}while(0);c[I>>2]=n;c[J+12>>2]=n;c[w+(q+8)>>2]=J;c[w+(q+12)>>2]=f;break}d=k>>>8;do if(!d)f=0;else{if(k>>>0>16777215){f=31;break}v=(d+1048320|0)>>>16&8;x=d<<v;u=(x+520192|0)>>>16&4;x=x<<u;f=(x+245760|0)>>>16&2;f=14-(u|v|f)+(x<<f>>>15)|0;f=k>>>(f+7|0)&1|f<<1}while(0);h=7616+(f<<2)|0;c[w+(q+28)>>2]=f;c[w+(q+20)>>2]=0;c[w+(q+16)>>2]=0;j=c[1829]|0;g=1<<f;if(!(j&g)){c[1829]=j|g;c[h>>2]=n;c[w+(q+24)>>2]=h;c[w+(q+12)>>2]=n;c[w+(q+8)>>2]=n;break}j=c[h>>2]|0;if((f|0)==31)h=0;else h=25-(f>>>1)|0;j:do if((c[j+4>>2]&-8|0)!=(k|0)){f=k<<h;while(1){g=j+(f>>>31<<2)+16|0;h=c[g>>2]|0;if(!h)break;if((c[h+4>>2]&-8|0)==(k|0)){K=h;break j}else{f=f<<1;j=h}}if(g>>>0<(c[1832]|0)>>>0)ka();else{c[g>>2]=n;c[w+(q+24)>>2]=j;c[w+(q+12)>>2]=n;c[w+(q+8)>>2]=n;break h}}else K=j;while(0);b=K+8|0;d=c[b>>2]|0;x=c[1832]|0;if(K>>>0>=x>>>0&d>>>0>=x>>>0){c[d+12>>2]=n;c[b>>2]=n;c[w+(q+8)>>2]=d;c[w+(q+12)>>2]=K;c[w+(q+24)>>2]=0;break}else ka()}else{x=(c[1831]|0)+d|0;c[1831]=x;c[1834]=n;c[w+(q+4)>>2]=x|1}while(0);x=w+(r|8)|0;i=L;return x|0}j=7760|0;while(1){h=c[j>>2]|0;if(h>>>0<=o>>>0?(B=c[j+4>>2]|0,C=h+B|0,C>>>0>o>>>0):0)break;j=c[j+8>>2]|0}j=h+(B+-39)|0;if(!(j&7))j=0;else j=0-j&7;g=h+(B+-47+j)|0;g=g>>>0<(o+16|0)>>>0?o:g;h=g+8|0;j=w+8|0;if(!(j&7))j=0;else j=0-j&7;f=s+-40-j|0;c[1834]=w+j;c[1831]=f;c[w+(j+4)>>2]=f|1;c[w+(s+-36)>>2]=40;c[1835]=c[1950];c[g+4>>2]=27;c[h+0>>2]=c[1940];c[h+4>>2]=c[1941];c[h+8>>2]=c[1942];c[h+12>>2]=c[1943];c[1940]=w;c[1941]=s;c[1943]=0;c[1942]=h;f=g+28|0;c[f>>2]=7;if((g+32|0)>>>0<C>>>0)do{x=f;f=f+4|0;c[f>>2]=7}while((x+8|0)>>>0<C>>>0);if((g|0)!=(o|0)){k=g-o|0;j=o+(k+4)|0;c[j>>2]=c[j>>2]&-2;c[o+4>>2]=k|1;c[o+k>>2]=k;j=k>>>3;if(k>>>0<256){g=j<<1;f=7352+(g<<2)|0;h=c[1828]|0;j=1<<j;do if(!(h&j)){c[1828]=h|j;E=7352+(g+2<<2)|0;F=f}else{d=7352+(g+2<<2)|0;b=c[d>>2]|0;if(b>>>0>=(c[1832]|0)>>>0){E=d;F=b;break}ka()}while(0);c[E>>2]=o;c[F+12>>2]=o;c[o+8>>2]=F;c[o+12>>2]=f;break}d=k>>>8;if(d)if(k>>>0>16777215)g=31;else{w=(d+1048320|0)>>>16&8;x=d<<w;v=(x+520192|0)>>>16&4;x=x<<v;g=(x+245760|0)>>>16&2;g=14-(v|w|g)+(x<<g>>>15)|0;g=k>>>(g+7|0)&1|g<<1}else g=0;h=7616+(g<<2)|0;c[o+28>>2]=g;c[o+20>>2]=0;c[o+16>>2]=0;e=c[1829]|0;j=1<<g;if(!(e&j)){c[1829]=e|j;c[h>>2]=o;c[o+24>>2]=h;c[o+12>>2]=o;c[o+8>>2]=o;break}e=c[h>>2]|0;if((g|0)==31)d=0;else d=25-(g>>>1)|0;k:do if((c[e+4>>2]&-8|0)!=(k|0)){j=k<<d;while(1){h=e+(j>>>31<<2)+16|0;d=c[h>>2]|0;if(!d)break;if((c[d+4>>2]&-8|0)==(k|0)){G=d;break k}else{j=j<<1;e=d}}if(h>>>0<(c[1832]|0)>>>0)ka();else{c[h>>2]=o;c[o+24>>2]=e;c[o+12>>2]=o;c[o+8>>2]=o;break g}}else G=e;while(0);b=G+8|0;d=c[b>>2]|0;x=c[1832]|0;if(G>>>0>=x>>>0&d>>>0>=x>>>0){c[d+12>>2]=o;c[b>>2]=o;c[o+8>>2]=d;c[o+12>>2]=G;c[o+24>>2]=0;break}else ka()}}else{x=c[1832]|0;if((x|0)==0|w>>>0<x>>>0)c[1832]=w;c[1940]=w;c[1941]=s;c[1943]=0;c[1837]=c[1946];c[1836]=-1;b=0;do{x=b<<1;v=7352+(x<<2)|0;c[7352+(x+3<<2)>>2]=v;c[7352+(x+2<<2)>>2]=v;b=b+1|0}while((b|0)!=32);b=w+8|0;if(!(b&7))b=0;else b=0-b&7;x=s+-40-b|0;c[1834]=w+b;c[1831]=x;c[w+(b+4)>>2]=x|1;c[w+(s+-36)>>2]=40;c[1835]=c[1950]}while(0);b=c[1831]|0;if(b>>>0>p>>>0){w=b-p|0;c[1831]=w;x=c[1834]|0;c[1834]=x+p;c[x+(p+4)>>2]=w|1;c[x+4>>2]=p|3;x=x+8|0;i=L;return x|0}}c[(va()|0)>>2]=12;x=0;i=L;return x|0}function kd(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;w=i;if(!a){i=w;return}f=a+-8|0;h=c[1832]|0;if(f>>>0<h>>>0)ka();g=c[a+-4>>2]|0;e=g&3;if((e|0)==1)ka();q=g&-8;r=a+(q+-8)|0;do if(!(g&1)){g=c[f>>2]|0;if(!e){i=w;return}j=-8-g|0;m=a+j|0;n=g+q|0;if(m>>>0<h>>>0)ka();if((m|0)==(c[1833]|0)){f=a+(q+-4)|0;g=c[f>>2]|0;if((g&3|0)!=3){v=m;l=n;break}c[1830]=n;c[f>>2]=g&-2;c[a+(j+4)>>2]=n|1;c[r>>2]=n;i=w;return}d=g>>>3;if(g>>>0<256){e=c[a+(j+8)>>2]|0;f=c[a+(j+12)>>2]|0;g=7352+(d<<1<<2)|0;if((e|0)!=(g|0)){if(e>>>0<h>>>0)ka();if((c[e+12>>2]|0)!=(m|0))ka()}if((f|0)==(e|0)){c[1828]=c[1828]&~(1<<d);v=m;l=n;break}if((f|0)!=(g|0)){if(f>>>0<h>>>0)ka();g=f+8|0;if((c[g>>2]|0)==(m|0))b=g;else ka()}else b=f+8|0;c[e+12>>2]=f;c[b>>2]=e;v=m;l=n;break}b=c[a+(j+24)>>2]|0;e=c[a+(j+12)>>2]|0;do if((e|0)==(m|0)){f=a+(j+20)|0;g=c[f>>2]|0;if(!g){f=a+(j+16)|0;g=c[f>>2]|0;if(!g){k=0;break}}while(1){d=g+20|0;e=c[d>>2]|0;if(e){g=e;f=d;continue}d=g+16|0;e=c[d>>2]|0;if(!e)break;else{g=e;f=d}}if(f>>>0<h>>>0)ka();else{c[f>>2]=0;k=g;break}}else{d=c[a+(j+8)>>2]|0;if(d>>>0<h>>>0)ka();g=d+12|0;if((c[g>>2]|0)!=(m|0))ka();f=e+8|0;if((c[f>>2]|0)==(m|0)){c[g>>2]=e;c[f>>2]=d;k=e;break}else ka()}while(0);if(b){g=c[a+(j+28)>>2]|0;f=7616+(g<<2)|0;if((m|0)==(c[f>>2]|0)){c[f>>2]=k;if(!k){c[1829]=c[1829]&~(1<<g);v=m;l=n;break}}else{if(b>>>0<(c[1832]|0)>>>0)ka();g=b+16|0;if((c[g>>2]|0)==(m|0))c[g>>2]=k;else c[b+20>>2]=k;if(!k){v=m;l=n;break}}f=c[1832]|0;if(k>>>0<f>>>0)ka();c[k+24>>2]=b;g=c[a+(j+16)>>2]|0;do if(g)if(g>>>0<f>>>0)ka();else{c[k+16>>2]=g;c[g+24>>2]=k;break}while(0);g=c[a+(j+20)>>2]|0;if(g)if(g>>>0<(c[1832]|0)>>>0)ka();else{c[k+20>>2]=g;c[g+24>>2]=k;v=m;l=n;break}else{v=m;l=n}}else{v=m;l=n}}else{v=f;l=q}while(0);if(v>>>0>=r>>>0)ka();g=a+(q+-4)|0;f=c[g>>2]|0;if(!(f&1))ka();if(!(f&2)){if((r|0)==(c[1834]|0)){m=(c[1831]|0)+l|0;c[1831]=m;c[1834]=v;c[v+4>>2]=m|1;if((v|0)!=(c[1833]|0)){i=w;return}c[1833]=0;c[1830]=0;i=w;return}if((r|0)==(c[1833]|0)){m=(c[1830]|0)+l|0;c[1830]=m;c[1833]=v;c[v+4>>2]=m|1;c[v+m>>2]=m;i=w;return}h=(f&-8)+l|0;d=f>>>3;do if(f>>>0>=256){b=c[a+(q+16)>>2]|0;g=c[a+(q|4)>>2]|0;do if((g|0)==(r|0)){f=a+(q+12)|0;g=c[f>>2]|0;if(!g){f=a+(q+8)|0;g=c[f>>2]|0;if(!g){p=0;break}}while(1){d=g+20|0;e=c[d>>2]|0;if(e){g=e;f=d;continue}d=g+16|0;e=c[d>>2]|0;if(!e)break;else{g=e;f=d}}if(f>>>0<(c[1832]|0)>>>0)ka();else{c[f>>2]=0;p=g;break}}else{f=c[a+q>>2]|0;if(f>>>0<(c[1832]|0)>>>0)ka();e=f+12|0;if((c[e>>2]|0)!=(r|0))ka();d=g+8|0;if((c[d>>2]|0)==(r|0)){c[e>>2]=g;c[d>>2]=f;p=g;break}else ka()}while(0);if(b){g=c[a+(q+20)>>2]|0;f=7616+(g<<2)|0;if((r|0)==(c[f>>2]|0)){c[f>>2]=p;if(!p){c[1829]=c[1829]&~(1<<g);break}}else{if(b>>>0<(c[1832]|0)>>>0)ka();g=b+16|0;if((c[g>>2]|0)==(r|0))c[g>>2]=p;else c[b+20>>2]=p;if(!p)break}g=c[1832]|0;if(p>>>0<g>>>0)ka();c[p+24>>2]=b;f=c[a+(q+8)>>2]|0;do if(f)if(f>>>0<g>>>0)ka();else{c[p+16>>2]=f;c[f+24>>2]=p;break}while(0);d=c[a+(q+12)>>2]|0;if(d)if(d>>>0<(c[1832]|0)>>>0)ka();else{c[p+20>>2]=d;c[d+24>>2]=p;break}}}else{e=c[a+q>>2]|0;f=c[a+(q|4)>>2]|0;g=7352+(d<<1<<2)|0;if((e|0)!=(g|0)){if(e>>>0<(c[1832]|0)>>>0)ka();if((c[e+12>>2]|0)!=(r|0))ka()}if((f|0)==(e|0)){c[1828]=c[1828]&~(1<<d);break}if((f|0)!=(g|0)){if(f>>>0<(c[1832]|0)>>>0)ka();g=f+8|0;if((c[g>>2]|0)==(r|0))o=g;else ka()}else o=f+8|0;c[e+12>>2]=f;c[o>>2]=e}while(0);c[v+4>>2]=h|1;c[v+h>>2]=h;if((v|0)==(c[1833]|0)){c[1830]=h;i=w;return}else g=h}else{c[g>>2]=f&-2;c[v+4>>2]=l|1;c[v+l>>2]=l;g=l}e=g>>>3;if(g>>>0<256){f=e<<1;g=7352+(f<<2)|0;d=c[1828]|0;e=1<<e;if(d&e){d=7352+(f+2<<2)|0;b=c[d>>2]|0;if(b>>>0<(c[1832]|0)>>>0)ka();else{s=d;t=b}}else{c[1828]=d|e;s=7352+(f+2<<2)|0;t=g}c[s>>2]=v;c[t+12>>2]=v;c[v+8>>2]=t;c[v+12>>2]=g;i=w;return}d=g>>>8;if(d)if(g>>>0>16777215)f=31;else{l=(d+1048320|0)>>>16&8;m=d<<l;k=(m+520192|0)>>>16&4;m=m<<k;f=(m+245760|0)>>>16&2;f=14-(k|l|f)+(m<<f>>>15)|0;f=g>>>(f+7|0)&1|f<<1}else f=0;b=7616+(f<<2)|0;c[v+28>>2]=f;c[v+20>>2]=0;c[v+16>>2]=0;d=c[1829]|0;e=1<<f;a:do if(d&e){b=c[b>>2]|0;if((f|0)==31)d=0;else d=25-(f>>>1)|0;b:do if((c[b+4>>2]&-8|0)!=(g|0)){f=g<<d;while(1){e=b+(f>>>31<<2)+16|0;d=c[e>>2]|0;if(!d)break;if((c[d+4>>2]&-8|0)==(g|0)){u=d;break b}else{f=f<<1;b=d}}if(e>>>0<(c[1832]|0)>>>0)ka();else{c[e>>2]=v;c[v+24>>2]=b;c[v+12>>2]=v;c[v+8>>2]=v;break a}}else u=b;while(0);d=u+8|0;b=c[d>>2]|0;m=c[1832]|0;if(u>>>0>=m>>>0&b>>>0>=m>>>0){c[b+12>>2]=v;c[d>>2]=v;c[v+8>>2]=b;c[v+12>>2]=u;c[v+24>>2]=0;break}else ka()}else{c[1829]=d|e;c[b>>2]=v;c[v+24>>2]=b;c[v+12>>2]=v;c[v+8>>2]=v}while(0);m=(c[1836]|0)+-1|0;c[1836]=m;if(!m)b=7768|0;else{i=w;return}while(1){b=c[b>>2]|0;if(!b)break;else b=b+8|0}c[1836]=-1;i=w;return}function ld(){}function md(b){b=b|0;var c=0;c=b;while(a[c>>0]|0)c=c+1|0;return c-b|0}function nd(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0;f=b+e|0;if((e|0)>=20){d=d&255;h=b&3;i=d|d<<8|d<<16|d<<24;g=f&~3;if(h){h=b+4-h|0;while((b|0)<(h|0)){a[b>>0]=d;b=b+1|0}}while((b|0)<(g|0)){c[b>>2]=i;b=b+4|0}}while((b|0)<(f|0)){a[b>>0]=d;b=b+1|0}return b-e|0}function od(b,d,e){b=b|0;d=d|0;e=e|0;var f=0;if((e|0)>=4096)return pa(b|0,d|0,e|0)|0;f=b|0;if((b&3)==(d&3)){while(b&3){if(!e)return f|0;a[b>>0]=a[d>>0]|0;b=b+1|0;d=d+1|0;e=e-1|0}while((e|0)>=4){c[b>>2]=c[d>>2];b=b+4|0;d=d+4|0;e=e-4|0}}while((e|0)>0){a[b>>0]=a[d>>0]|0;b=b+1|0;d=d+1|0;e=e-1|0}return f|0}function pd(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;xa[a&3](b|0,c|0,d|0,e|0,f|0)}function qd(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;_(0)}

// EMSCRIPTEN_END_FUNCS
var xa=[qd,fc,ec,qd];return{_strlen:md,_free:kd,_broadwayGetMajorVersion:dd,_get_h264bsdClip:Lb,_broadwayExit:cd,_memset:nd,_broadwayCreateStream:Zc,_malloc:jd,_memcpy:od,_broadwayGetMinorVersion:ed,_broadwayPlayStream:$c,_broadwaySetStreamLength:_c,_broadwayInit:ad,runPostSets:ld,stackAlloc:ya,stackSave:za,stackRestore:Aa,setThrew:Ba,setTempRet0:Ea,getTempRet0:Fa,dynCall_viiiii:pd}})


// EMSCRIPTEN_END_ASM
(p.Xc,p.Yc,Q),Bb=p._strlen=$._strlen,Ea=p._free=$._free;p._broadwayGetMajorVersion=$._broadwayGetMajorVersion;p._get_h264bsdClip=$._get_h264bsdClip;p._broadwayExit=$._broadwayExit;var Gb=p._memset=$._memset;p._broadwayCreateStream=$._broadwayCreateStream;var Ca=p._malloc=$._malloc,gc=p._memcpy=$._memcpy;
p._broadwayGetMinorVersion=$._broadwayGetMinorVersion;p._broadwayPlayStream=$._broadwayPlayStream;p._broadwaySetStreamLength=$._broadwaySetStreamLength;p._broadwayInit=$._broadwayInit;p.runPostSets=$.runPostSets;p.dynCall_viiiii=$.dynCall_viiiii;z.pb=$.stackAlloc;z.Tb=$.stackSave;z.Sb=$.stackRestore;z.Yd=$.setTempRet0;z.xd=$.getTempRet0;
if(T)if("function"===typeof p.locateFile?T=p.locateFile(T):p.memoryInitializerPrefixURL&&(T=p.memoryInitializerPrefixURL+T),t||da){var hc=p.readBinary(T);N.set(hc,Ia)}else Ya(),yb(T,function(a){N.set(a,Ia);Za()},function(){d("could not load memory initializer "+T)});function ia(a){this.name="ExitStatus";this.message="Program terminated with exit("+a+")";this.status=a}ia.prototype=Error();var ic,jc=k,Xa=function kc(){!p.calledRun&&lc&&mc();p.calledRun||(Xa=kc)};
p.callMain=p.ag=function(a){function b(){for(var a=0;3>a;a++)e.push(0)}w(0==S,"cannot call main when async dependencies remain! (listen on __ATMAIN__)");w(0==Oa.length,"cannot call main when preRun functions remain to be called");a=a||[];Sa||(Sa=i,Na(R));var c=a.length+1,e=[M(Va(p.thisProgram),"i8",0)];b();for(var f=0;f<c-1;f+=1)e.push(M(Va(a[f]),"i8",0)),b();e.push(0);e=M(e,"i32",0);ic=y;try{var h=p._main(c,e,0);nc(h)}catch(j){j instanceof ia||("SimulateInfiniteLoop"==j?p.noExitRuntime=i:(j&&("object"===
typeof j&&j.stack)&&p.fa("exception thrown: "+[j,j.stack]),d(j)))}finally{}};
function mc(a){function b(){if(!p.calledRun&&(p.calledRun=i,!H)){Sa||(Sa=i,Na(R));Na(Pa);ba&&jc!==k&&p.fa("pre-main prep time: "+(Date.now()-jc)+" ms");if(p.onRuntimeInitialized)p.onRuntimeInitialized();p._main&&lc&&p.callMain(a);if(p.postRun)for("function"==typeof p.postRun&&(p.postRun=[p.postRun]);p.postRun.length;)Ua(p.postRun.shift());Na(Ra)}}a=a||p.arguments;jc===k&&(jc=Date.now());if(!(0<S)){if(p.preRun)for("function"==typeof p.preRun&&(p.preRun=[p.preRun]);p.preRun.length;)Ta(p.preRun.shift());
Na(Oa);!(0<S)&&!p.calledRun&&(p.setStatus?(p.setStatus("Running..."),setTimeout(function(){setTimeout(function(){p.setStatus("")},1);b()},1)):b())}}p.run=p.Ng=mc;function nc(a){p.noExitRuntime||(H=i,y=ic,Na(Qa),t?(process.stdout.once("drain",function(){process.exit(a)}),console.log(" "),setTimeout(function(){process.exit(a)},500)):da&&"function"===typeof quit&&quit(a),d(new ia(a)))}p.exit=p.hg=nc;
function A(a){a&&(p.print(a),p.fa(a));H=i;d("abort() at "+Fa()+"\nIf this abort() is unexpected, build with -s ASSERTIONS=1 which can give more information.")}p.abort=p.abort=A;if(p.preInit)for("function"==typeof p.preInit&&(p.preInit=[p.preInit]);0<p.preInit.length;)p.preInit.pop()();var lc=m;p.noInitialRun&&(lc=m);mc();

    var resultModule = window.Module || global.Module || Module;
    
    return resultModule;
  };
  
  
  var nowValue = function(){
    return (new Date()).getTime();
  };
  
  if (typeof performance != "undefined"){
    if (performance.now){
      nowValue = function(){
        return performance.now();
      };
    };
  };
  
  
  var Broadway = function(parOptions){
    this.options = parOptions || {};
    
    this.now = nowValue;
    
    var asmInstance;
    
    var fakeWindow = {
    };
    
    var Module = getModule.apply(fakeWindow, [function () {

    }, function ($buffer, width, height) {
      var buffer = this.pictureBuffers[$buffer];
      if (!buffer) {
        buffer = this.pictureBuffers[$buffer] = toU8Array($buffer, (width * height * 3) / 2);
      };
      
      var infos;
      var doInfo = false;
      if (this.infoAr.length){
        doInfo = true;
        infos = this.infoAr;
      };
      this.infoAr = [];
      
      if (this.options.rgb){
        if (!asmInstance){
          asmInstance = getAsm(width, height);
        };
        asmInstance.inp.set(buffer);
        asmInstance.doit();

        var copyU8 = new Uint8Array(asmInstance.outSize);
        copyU8.set( asmInstance.out );
        
        if (doInfo){
          infos[0].finishDecoding = nowValue();
        };
        
        this.onPictureDecoded(copyU8, width, height, infos);
        return;
        
      };
      
      if (doInfo){
        infos[0].finishDecoding = nowValue();
      };
      this.onPictureDecoded(buffer, width, height, infos);
    }.bind(this)]);

    var HEAP8 = Module.HEAP8;
    var HEAPU8 = Module.HEAPU8;
    var HEAP16 = Module.HEAP16;
    var HEAP32 = Module.HEAP32;
    var _h264bsdClip = Module._get_h264bsdClip();

    
    var MAX_STREAM_BUFFER_LENGTH = 1024 * 1024;
  
    // from old constructor
    Module._broadwayInit();
    
    /**
   * Creates a typed array from a HEAP8 pointer. 
   */
    function toU8Array(ptr, length) {
      return HEAPU8.subarray(ptr, ptr + length);
    };
    this.streamBuffer = toU8Array(Module._broadwayCreateStream(MAX_STREAM_BUFFER_LENGTH), MAX_STREAM_BUFFER_LENGTH);
    this.pictureBuffers = {};
    // collect extra infos that are provided with the nal units
    this.infoAr = [];
    
    this.onPictureDecoded = function (buffer, width, height, infos) {
      
    };
    
    /**
     * Decodes a stream buffer. This may be one single (unframed) NAL unit without the
     * start code, or a sequence of NAL units with framing start code prefixes. This
     * function overwrites stream buffer allocated by the codec with the supplied buffer.
     */
    this.decode = function decode(buffer, parInfo) {
      // console.info("Decoding: " + buffer.length);
      // collect infos
      if (parInfo){
        this.infoAr.push(parInfo);
        parInfo.startDecoding = nowValue();
      };
      
      this.streamBuffer.set(buffer);
      Module._broadwaySetStreamLength(buffer.length);
      Module._broadwayPlayStream();
    };


    
    function patchOptimizations(config, patches) { 
      var scope = getGlobalScope();
      for (var name in patches) {
        var patch = patches[name];
        if (patch) {
          var option = config[name];
          if (!option) option = "original";
          console.info(name + ": " + option);
          assert (option in patch.options);
          var fn = patch.options[option].fn;
          if (fn) {
            scope[patch.original] = Module.patch(null, patch.name, fn);
            console.info("Patching: " + patch.name + ", with: " + option);
          }
        }
      }
    };
    
    var patches = {
      "filter": {
        name: "_h264bsdFilterPicture",
        display: "Filter Picture",
        original: "Original_h264bsdFilterPicture",
        options: {
          none: {display: "None", fn: function () {}},
          original: {display: "Original", fn: null},
        }
      },
      "filterHorLuma": {
        name: "_FilterHorLuma",
        display: "Filter Hor Luma",
        original: "OriginalFilterHorLuma",
        options: {
          none: {display: "None", fn: function () {}},
          original: {display: "Original", fn: null},
          optimized: {display: "Optimized", fn: OptimizedFilterHorLuma}
        }
      },
      "filterVerLumaEdge": {
        name: "_FilterVerLumaEdge",
        display: "Filter Ver Luma Edge",
        original: "OriginalFilterVerLumaEdge",
        options: {
          none: {display: "None", fn: function () {}},
          original: {display: "Original", fn: null},
          optimized: {display: "Optimized", fn: OptimizedFilterVerLumaEdge}
        }
      },
      "getBoundaryStrengthsA": {
        name: "_GetBoundaryStrengthsA",
        display: "Get Boundary Strengths",
        original: "OriginalGetBoundaryStrengthsA",
        options: {
          none: {display: "None", fn: function () {}},
          original: {display: "Original", fn: null},
          optimized: {display: "Optimized", fn: OptimizedGetBoundaryStrengthsA}
        }
      }
    };
    function getGlobalScope() {
      return function () { return this; }.call(null);
    };
    
    /* Optimizations */

    function clip(x, y, z) {
      return z < x ? x : (z > y ? y : z);
    }

    function OptimizedGetBoundaryStrengthsA($mb, $bS) {
      var $totalCoeff = $mb + 28;

      var tc0 = HEAP16[$totalCoeff + 0 >> 1];
      var tc1 = HEAP16[$totalCoeff + 2 >> 1];
      var tc2 = HEAP16[$totalCoeff + 4 >> 1];
      var tc3 = HEAP16[$totalCoeff + 6 >> 1];
      var tc4 = HEAP16[$totalCoeff + 8 >> 1];
      var tc5 = HEAP16[$totalCoeff + 10 >> 1];
      var tc6 = HEAP16[$totalCoeff + 12 >> 1];
      var tc7 = HEAP16[$totalCoeff + 14 >> 1];
      var tc8 = HEAP16[$totalCoeff + 16 >> 1];
      var tc9 = HEAP16[$totalCoeff + 18 >> 1];
      var tc10 = HEAP16[$totalCoeff + 20 >> 1];
      var tc11 = HEAP16[$totalCoeff + 22 >> 1];
      var tc12 = HEAP16[$totalCoeff + 24 >> 1];
      var tc13 = HEAP16[$totalCoeff + 26 >> 1];
      var tc14 = HEAP16[$totalCoeff + 28 >> 1];
      var tc15 = HEAP16[$totalCoeff + 30 >> 1];

      HEAP32[$bS + 32 >> 2] = tc2 || tc0 ? 2 : 0;
      HEAP32[$bS + 40 >> 2] = tc3 || tc1 ? 2 : 0;
      HEAP32[$bS + 48 >> 2] = tc6 || tc4 ? 2 : 0;
      HEAP32[$bS + 56 >> 2] = tc7 || tc5 ? 2 : 0;
      HEAP32[$bS + 64 >> 2] = tc8 || tc2 ? 2 : 0;
      HEAP32[$bS + 72 >> 2] = tc9 || tc3 ? 2 : 0;
      HEAP32[$bS + 80 >> 2] = tc12 || tc6 ? 2 : 0;
      HEAP32[$bS + 88 >> 2] = tc13 || tc7 ? 2 : 0;
      HEAP32[$bS + 96 >> 2] = tc10 || tc8 ? 2 : 0;
      HEAP32[$bS + 104 >> 2] = tc11 || tc9 ? 2 : 0;
      HEAP32[$bS + 112 >> 2] = tc14 || tc12 ? 2 : 0;
      HEAP32[$bS + 120 >> 2] = tc15 || tc13 ? 2 : 0;

      HEAP32[$bS + 12 >> 2] = tc1 || tc0 ? 2 : 0;
      HEAP32[$bS + 20 >> 2] = tc4 || tc1 ? 2 : 0;
      HEAP32[$bS + 28 >> 2] = tc5 || tc4 ? 2 : 0;
      HEAP32[$bS + 44 >> 2] = tc3 || tc2 ? 2 : 0;
      HEAP32[$bS + 52 >> 2] = tc6 || tc3 ? 2 : 0;
      HEAP32[$bS + 60 >> 2] = tc7 || tc6 ? 2 : 0;
      HEAP32[$bS + 76 >> 2] = tc9 || tc8 ? 2 : 0;
      HEAP32[$bS + 84 >> 2] = tc12 || tc9 ? 2 : 0;
      HEAP32[$bS + 92 >> 2] = tc13 || tc12 ? 2 : 0;
      HEAP32[$bS + 108 >> 2] = tc11 || tc10 ? 2 : 0;
      HEAP32[$bS + 116 >> 2] = tc14 || tc11 ? 2 : 0;
      HEAP32[$bS + 124 >> 2] = tc15 || tc14 ? 2 : 0;
    }

    function OptimizedFilterVerLumaEdge ($data, bS, $thresholds, imageWidth) {
      var delta, tc, tmp;
      var p0, q0, p1, q1, p2, q2;
      var tmpFlag;
      var $clp = _h264bsdClip + 512;
      var alpha = HEAP32[$thresholds + 4 >> 2];
      var beta = HEAP32[$thresholds + 8 >> 2];
      var val;

      if (bS < 4) {
        tmp = tc = HEAPU8[HEAP32[$thresholds >> 2] + (bS - 1)] & 255;
        for (var i = 4; i > 0; i--) {
          p1 = HEAPU8[$data + -2] & 255;
          p0 = HEAPU8[$data + -1] & 255;
          q0 = HEAPU8[$data] & 255;
          q1 = HEAPU8[$data + 1] & 255;
          if ((Math.abs(p0 - q0) < alpha) && (Math.abs(p1 - p0) < beta) && (Math.abs(q1 - q0) < beta)) {
            p2 = HEAPU8[$data - 3] & 255;
            if (Math.abs(p2 - p0) < beta) {
              val = (p2 + ((p0 + q0 + 1) >> 1) - (p1 << 1)) >> 1;
              HEAP8[$data - 2] = p1 + clip(-tc, tc, val);
              tmp++;
            }

            q2 = HEAPU8[$data + 2] & 255;
            if (Math.abs(q2 - q0) < beta) {
              val = (q2 + ((p0 + q0 + 1) >> 1) - (q1 << 1)) >> 1;
              HEAP8[$data + 1] = (q1 + clip(-tc, tc, val));
              tmp++;
            }

            val = ((((q0 - p0) << 2) + (p1 - q1) + 4) >> 3);
            delta = clip(-tmp, tmp, val);

            p0 = HEAPU8[$clp + (p0 + delta)] & 255;
            q0 = HEAPU8[$clp + (q0 - delta)] & 255;
            tmp = tc;
            HEAP8[$data - 1] = p0;
            HEAP8[$data] = q0;

            $data += imageWidth;
          }
        }
      } else {
        OriginalFilterVerLumaEdge($data, bS, $thresholds, imageWidth);
      }
    }

    /**
 * Filter all four successive horizontal 4-pixel luma edges. This can be done when bS is equal to all four edges.
 */
    function OptimizedFilterHorLuma ($data, bS, $thresholds, imageWidth) {
      var delta, tc, tmp;
      var p0, q0, p1, q1, p2, q2;
      var tmpFlag;
      var $clp = _h264bsdClip + 512;
      var alpha = HEAP32[$thresholds + 4 >> 2];
      var beta = HEAP32[$thresholds + 8 >> 2];
      var val;

      if (bS < 4) {
        tmp = tc = HEAPU8[HEAP32[$thresholds >> 2] + (bS - 1)] & 255;
        for (var i = 16; i > 0; i--) {
          p1 = HEAPU8[$data + (-imageWidth << 1)] & 255;
          p0 = HEAPU8[$data + -imageWidth] & 255;
          q0 = HEAPU8[$data] & 255;
          q1 = HEAPU8[$data + imageWidth] & 255;

          if ((Math.abs(p0 - q0) < alpha) && (Math.abs(p1 - p0) < beta) && (Math.abs(q1 - q0) < beta)) {
            p2 = HEAPU8[$data + (-imageWidth * 3)] & 255;
            if (Math.abs(p2 - p0) < beta) {
              val = (p2 + ((p0 + q0 + 1) >> 1) - (p1 << 1)) >> 1;
              HEAP8[$data + (-imageWidth << 1)] = p1 + clip(-tc, tc, val);
              tmp++;
            }

            q2 = HEAPU8[$data + (imageWidth << 2)] & 255;
            if (Math.abs(q2 - q0) < beta) {
              val = (q2 + ((p0 + q0 + 1) >> 1) - (q1 << 1)) >> 1;
              HEAP8[$data + imageWidth] = (q1 + clip(-tc, tc, val));
              tmp++;
            }

            val = ((((q0 - p0) << 2) + (p1 - q1) + 4) >> 3);
            delta = clip(-tmp, tmp, val);

            p0 = HEAPU8[$clp + (p0 + delta)] & 255;
            q0 = HEAPU8[$clp + (q0 - delta)] & 255;
            tmp = tc;
            HEAP8[$data - imageWidth] = p0;
            HEAP8[$data] = q0;

            $data ++;
          }
        }
      } else {
        OriginalFilterHorLuma($data, bS, $thresholds, imageWidth);
      }
    }
  };

  
  Broadway.prototype = {
    configure: function (config) {
      // patchOptimizations(config, patches);
      console.info("Broadway Configured: " + JSON.stringify(config));
    }
    
  };
  
  
  
  
  /*
  
    asm.js implementation of a yuv to rgb convertor
    provided by @soliton4
    
    based on 
    http://www.wordsaretoys.com/2013/10/18/making-yuv-conversion-a-little-faster/
  
  */
  
  
  // factory to create asm.js yuv -> rgb convertor for a given resolution
  var asmInstances = {};
  var getAsm = function(parWidth, parHeight){
    var idStr = "" + parWidth + "x" + parHeight;
    if (asmInstances[idStr]){
      return asmInstances[idStr];
    };

    var lumaSize = parWidth * parHeight;
    var chromaSize = (lumaSize|0) >> 2;

    var inpSize = lumaSize + chromaSize + chromaSize;
    var outSize = parWidth * parHeight * 4;
    var cacheSize = Math.pow(2, 24) * 4;
    var size = inpSize + outSize + cacheSize;

    var chunkSize = Math.pow(2, 24);
    var heapSize = chunkSize;
    while (heapSize < size){
      heapSize += chunkSize;
    };
    var heap = new ArrayBuffer(heapSize);

    var res = asmFactory(global, {}, heap);
    res.init(parWidth, parHeight);
    asmInstances[idStr] = res;

    res.heap = heap;
    res.out = new Uint8Array(heap, 0, outSize);
    res.inp = new Uint8Array(heap, outSize, inpSize);
    res.outSize = outSize;

    return res;
  };


  function asmFactory(stdlib, foreign, heap) {
    "use asm";

    var imul = stdlib.Math.imul;
    var min = stdlib.Math.min;
    var max = stdlib.Math.max;
    var pow = stdlib.Math.pow;
    var out = new stdlib.Uint8Array(heap);
    var out32 = new stdlib.Uint32Array(heap);
    var inp = new stdlib.Uint8Array(heap);
    var mem = new stdlib.Uint8Array(heap);
    var mem32 = new stdlib.Uint32Array(heap);

    // for double algo
    /*var vt = 1.370705;
    var gt = 0.698001;
    var gt2 = 0.337633;
    var bt = 1.732446;*/

    var width = 0;
    var height = 0;
    var lumaSize = 0;
    var chromaSize = 0;
    var inpSize = 0;
    var outSize = 0;

    var inpStart = 0;
    var outStart = 0;

    var widthFour = 0;

    var cacheStart = 0;


    function init(parWidth, parHeight){
      parWidth = parWidth|0;
      parHeight = parHeight|0;

      var i = 0;
      var s = 0;

      width = parWidth;
      widthFour = imul(parWidth, 4)|0;
      height = parHeight;
      lumaSize = imul(width|0, height|0)|0;
      chromaSize = (lumaSize|0) >> 2;
      outSize = imul(imul(width, height)|0, 4)|0;
      inpSize = ((lumaSize + chromaSize)|0 + chromaSize)|0;

      outStart = 0;
      inpStart = (outStart + outSize)|0;
      cacheStart = (inpStart + inpSize)|0;

      // initializing memory (to be on the safe side)
      s = ~~(+pow(+2, +24));
      s = imul(s, 4)|0;

      for (i = 0|0; ((i|0) < (s|0))|0; i = (i + 4)|0){
        mem32[((cacheStart + i)|0) >> 2] = 0;
      };
    };

    function doit(){
      var ystart = 0;
      var ustart = 0;
      var vstart = 0;

      var y = 0;
      var yn = 0;
      var u = 0;
      var v = 0;

      var o = 0;

      var line = 0;
      var col = 0;

      var usave = 0;
      var vsave = 0;

      var ostart = 0;
      var cacheAdr = 0;

      ostart = outStart|0;

      ystart = inpStart|0;
      ustart = (ystart + lumaSize|0)|0;
      vstart = (ustart + chromaSize)|0;

      for (line = 0; (line|0) < (height|0); line = (line + 2)|0){
        usave = ustart;
        vsave = vstart;
        for (col = 0; (col|0) < (width|0); col = (col + 2)|0){
          y = inp[ystart >> 0]|0;
          yn = inp[((ystart + width)|0) >> 0]|0;

          u = inp[ustart >> 0]|0;
          v = inp[vstart >> 0]|0;

          cacheAdr = (((((y << 16)|0) + ((u << 8)|0))|0) + v)|0;
          o = mem32[((cacheStart + cacheAdr)|0) >> 2]|0;
          if (o){}else{
            o = yuv2rgbcalc(y,u,v)|0;
            mem32[((cacheStart + cacheAdr)|0) >> 2] = o|0;
          };
          mem32[ostart >> 2] = o;

          cacheAdr = (((((yn << 16)|0) + ((u << 8)|0))|0) + v)|0;
          o = mem32[((cacheStart + cacheAdr)|0) >> 2]|0;
          if (o){}else{
            o = yuv2rgbcalc(yn,u,v)|0;
            mem32[((cacheStart + cacheAdr)|0) >> 2] = o|0;
          };
          mem32[((ostart + widthFour)|0) >> 2] = o;

          //yuv2rgb5(y, u, v, ostart);
          //yuv2rgb5(yn, u, v, (ostart + widthFour)|0);
          ostart = (ostart + 4)|0;

          // next step only for y. u and v stay the same
          ystart = (ystart + 1)|0;
          y = inp[ystart >> 0]|0;
          yn = inp[((ystart + width)|0) >> 0]|0;

          //yuv2rgb5(y, u, v, ostart);
          cacheAdr = (((((y << 16)|0) + ((u << 8)|0))|0) + v)|0;
          o = mem32[((cacheStart + cacheAdr)|0) >> 2]|0;
          if (o){}else{
            o = yuv2rgbcalc(y,u,v)|0;
            mem32[((cacheStart + cacheAdr)|0) >> 2] = o|0;
          };
          mem32[ostart >> 2] = o;

          //yuv2rgb5(yn, u, v, (ostart + widthFour)|0);
          cacheAdr = (((((yn << 16)|0) + ((u << 8)|0))|0) + v)|0;
          o = mem32[((cacheStart + cacheAdr)|0) >> 2]|0;
          if (o){}else{
            o = yuv2rgbcalc(yn,u,v)|0;
            mem32[((cacheStart + cacheAdr)|0) >> 2] = o|0;
          };
          mem32[((ostart + widthFour)|0) >> 2] = o;
          ostart = (ostart + 4)|0;

          //all positions inc 1

          ystart = (ystart + 1)|0;
          ustart = (ustart + 1)|0;
          vstart = (vstart + 1)|0;
        };
        ostart = (ostart + widthFour)|0;
        ystart = (ystart + width)|0;

      };

    };

    function yuv2rgbcalc(y, u, v){
      y = y|0;
      u = u|0;
      v = v|0;

      var r = 0;
      var g = 0;
      var b = 0;

      var o = 0;

      var a0 = 0;
      var a1 = 0;
      var a2 = 0;
      var a3 = 0;
      var a4 = 0;

      a0 = imul(1192, (y - 16)|0)|0;
      a1 = imul(1634, (v - 128)|0)|0;
      a2 = imul(832, (v - 128)|0)|0;
      a3 = imul(400, (u - 128)|0)|0;
      a4 = imul(2066, (u - 128)|0)|0;

      r = (((a0 + a1)|0) >> 10)|0;
      g = (((((a0 - a2)|0) - a3)|0) >> 10)|0;
      b = (((a0 + a4)|0) >> 10)|0;

      if ((((r & 255)|0) != (r|0))|0){
        r = min(255, max(0, r|0)|0)|0;
      };
      if ((((g & 255)|0) != (g|0))|0){
        g = min(255, max(0, g|0)|0)|0;
      };
      if ((((b & 255)|0) != (b|0))|0){
        b = min(255, max(0, b|0)|0)|0;
      };

      o = 255;
      o = (o << 8)|0;
      o = (o + b)|0;
      o = (o << 8)|0;
      o = (o + g)|0;
      o = (o << 8)|0;
      o = (o + r)|0;

      return o|0;

    };



    return {
      init: init,
      doit: doit
    };
  };

  
  /*
    potential worker initialization
  
  */
  
  
  if (typeof self != "undefined"){
    var isWorker = false;
    var decoder;
    var reuseMemory = false;
    
    var memAr = [];
    var getMem = function(length){
      if (memAr.length){
        var u = memAr.shift();
        while (u && u.byteLength !== length){
          u = memAr.shift();
        };
        if (u){
          return u;
        };
      };
      return new ArrayBuffer(length);
    }; 
    
    self.addEventListener('message', function(e) {
      
      if (isWorker){
        if (reuseMemory){
          if (e.data.reuse){
            memAr.push(e.data.reuse);
          };
        };
        if (e.data.buf){
          decoder.decode(new Uint8Array(e.data.buf, e.data.offset || 0, e.data.length), e.data.info);
        };
        
      }else{
        if (e.data && e.data.type === "Broadway.js - Worker init"){
          isWorker = true;
          decoder = new Broadway(e.data.options);
          
          if (e.data.options.reuseMemory){
            reuseMemory = true;
            decoder.onPictureDecoded = function (buffer, width, height, infos) {
              
              //var buf = getMem();

              // buffer needs to be copied because we give up ownership
              var copyU8 = new Uint8Array(getMem(buffer.length));
              copyU8.set( buffer, 0, buffer.length );

              postMessage({
                buf: copyU8.buffer, 
                length: buffer.length,
                width: width, 
                height: height, 
                infos: infos
              }, [copyU8.buffer]); // 2nd parameter is used to indicate transfer of ownership

            };
            
          }else{
            decoder.onPictureDecoded = function (buffer, width, height, infos) {
              if (buffer) {
                buffer = new Uint8Array(buffer);
              };

              // buffer needs to be copied because we give up ownership
              var copyU8 = new Uint8Array(buffer.length);
              copyU8.set( buffer, 0, buffer.length );

              postMessage({
                buf: copyU8.buffer, 
                length: buffer.length,
                width: width, 
                height: height, 
                infos: infos
              }, [copyU8.buffer]); // 2nd parameter is used to indicate transfer of ownership

            };
          };
          postMessage({ consoleLog: "broadway worker initialized" });
        };
      };


    }, false);
  };
  
  Broadway.nowValue = nowValue;
  
  return Broadway;
  
  })();
  
  
}));


}).call(this,require('_process'),"/node_modules/h264-live-player/broadway")
},{"_process":47}],9:[function(require,module,exports){
"use strict";
var assert = require('../utils/assert');


function Program(gl) {
  this.gl = gl;
  this.program = this.gl.createProgram();
}

Program.prototype = {
  attach: function (shader) {
    this.gl.attachShader(this.program, shader.shader);
  }, 
  link: function () {
    this.gl.linkProgram(this.program);
    // If creating the shader program failed, alert.
    assert(this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS),
           "Unable to initialize the shader program.");
  },
  use: function () {
    this.gl.useProgram(this.program);
  },
  getAttributeLocation: function(name) {
    return this.gl.getAttribLocation(this.program, name);
  },
  setMatrixUniform: function(name, array) {
    var uniform = this.gl.getUniformLocation(this.program, name);
    this.gl.uniformMatrix4fv(uniform, false, array);
  }
};
module.exports = Program;


},{"../utils/assert":20}],10:[function(require,module,exports){
"use strict";

var assert = require('../utils/assert');

/**
 * Represents a WebGL shader script.
 */

function Script() {}

Script.createFromElementId = function(id) {
  var script = document.getElementById(id);
  
  // Didn't find an element with the specified ID, abort.
  assert(script , "Could not find shader with ID: " + id);
  
  // Walk through the source element's children, building the shader source string.
  var source = "";
  var currentChild = script .firstChild;
  while(currentChild) {
    if (currentChild.nodeType == 3) {
      source += currentChild.textContent;
    }
    currentChild = currentChild.nextSibling;
  }
  
  var res = new Scriptor();
  res.type = script.type;
  res.source = source;
  return res;
};

Script.createFromSource = function(type, source) {
  var res = new Script();
  res.type = type;
  res.source = source;
  return res;
}


module.exports = Script;
},{"../utils/assert":20}],11:[function(require,module,exports){
"use strict";

var error = require('../utils/error');

/**
 * Represents a WebGL shader object and provides a mechanism to load shaders from HTML
 * script tags.
 */


function Shader(gl, script) {
  
  // Now figure out what type of shader script we have, based on its MIME type.
  if (script.type == "x-shader/x-fragment") {
    this.shader = gl.createShader(gl.FRAGMENT_SHADER);
  } else if (script.type == "x-shader/x-vertex") {
    this.shader = gl.createShader(gl.VERTEX_SHADER);
  } else {
    error("Unknown shader type: " + script.type);
    return;
  }
  
  // Send the source to the shader object.
  gl.shaderSource(this.shader, script.source);
  
  // Compile the shader program.
  gl.compileShader(this.shader);
  
  // See if it compiled successfully.
  if (!gl.getShaderParameter(this.shader, gl.COMPILE_STATUS)) {
    error("An error occurred compiling the shaders: " + gl.getShaderInfoLog(this.shader));
    return;
  }
}
module.exports = Shader;




},{"../utils/error":21}],12:[function(require,module,exports){
"use strict";

var assert = require('../utils/assert');

/**
 * Represents a WebGL texture object.
 */

function Texture(gl, size, format) {
  this.gl = gl;
  this.size = size;
  this.texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, this.texture);
  this.format = format ? format : gl.LUMINANCE; 
  gl.texImage2D(gl.TEXTURE_2D, 0, this.format, size.w, size.h, 0, this.format, gl.UNSIGNED_BYTE, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
}

var textureIDs = null;
Texture.prototype = {
  fill: function(textureData, useTexSubImage2D) {
    var gl = this.gl;
    assert(textureData.length >= this.size.w * this.size.h, 
           "Texture size mismatch, data:" + textureData.length + ", texture: " + this.size.w * this.size.h);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    if (useTexSubImage2D) {
      gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, this.size.w , this.size.h, this.format, gl.UNSIGNED_BYTE, textureData);
    } else {
      // texImage2D seems to be faster, thus keeping it as the default
      gl.texImage2D(gl.TEXTURE_2D, 0, this.format, this.size.w, this.size.h, 0, this.format, gl.UNSIGNED_BYTE, textureData);
    }
  },
  bind: function(n, program, name) {
    var gl = this.gl;
    if (!textureIDs) {
      textureIDs = [gl.TEXTURE0, gl.TEXTURE1, gl.TEXTURE2];
    }
    gl.activeTexture(textureIDs[n]);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.uniform1i(gl.getUniformLocation(program.program, name), n);
  }
};
module.exports = Texture;


},{"../utils/assert":20}],13:[function(require,module,exports){
"use strict";

/**
 * Generic WebGL backed canvas that sets up: a quad to paint a texture on, appropriate vertex/fragment shaders,
 * scene parameters and other things. Specialized versions of this class can be created by overriding several 
 * initialization methods.

 */

var Script = require('./Script');
var error  = require('../utils/error');
var makePerspective  = require('../utils/glUtils').makePerspective;
var Matrix = require('sylvester.js').Matrix;
var Class  = require('uclass');
  

var vertexShaderScript = Script.createFromSource("x-shader/x-vertex", `
  attribute vec3 aVertexPosition;
  attribute vec2 aTextureCoord;
  uniform mat4 uMVMatrix;
  uniform mat4 uPMatrix;
  varying highp vec2 vTextureCoord;
  void main(void) {
    gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);
    vTextureCoord = aTextureCoord;
  }
`);

var fragmentShaderScript = Script.createFromSource("x-shader/x-fragment", `
  precision highp float;
  varying highp vec2 vTextureCoord;
  uniform sampler2D texture;
  void main(void) {
    gl_FragColor = texture2D(texture, vTextureCoord);
  }
`);

var WebGLCanvas = new Class({

  initialize : function(canvas, size, useFrameBuffer) {

    this.canvas = canvas;
    this.size = size;
    this.canvas.width = size.w;
    this.canvas.height = size.h;
    
    this.onInitWebGL();
    this.onInitShaders();
    this.initBuffers();

    if (useFrameBuffer)
      this.initFramebuffer();

    this.onInitTextures();
    this.initScene();
  },


/**
 * Initialize a frame buffer so that we can render off-screen.
 */
  initFramebuffer : function() {

    var gl = this.gl;

    // Create framebuffer object and texture.
    this.framebuffer = gl.createFramebuffer(); 
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
    this.framebufferTexture = new Texture(this.gl, this.size, gl.RGBA);

    // Create and allocate renderbuffer for depth data.
    var renderbuffer = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, this.size.w, this.size.h);

    // Attach texture and renderbuffer to the framebuffer.
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.framebufferTexture.texture, 0);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderbuffer);
  },



/**
 * Initialize vertex and texture coordinate buffers for a plane.
 */
  initBuffers : function () {
    var tmp;
    var gl = this.gl;
    
    // Create vertex position buffer.
    this.quadVPBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadVPBuffer);
    tmp = [
       1.0,  1.0, 0.0,
      -1.0,  1.0, 0.0, 
       1.0, -1.0, 0.0, 
      -1.0, -1.0, 0.0];
    
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(tmp), gl.STATIC_DRAW);
    this.quadVPBuffer.itemSize = 3;
    this.quadVPBuffer.numItems = 4;
    
    /*
     +--------------------+ 
     | -1,1 (1)           | 1,1 (0)
     |                    |
     |                    |
     |                    |
     |                    |
     |                    |
     | -1,-1 (3)          | 1,-1 (2)
     +--------------------+
     */
    
    var scaleX = 1.0;
    var scaleY = 1.0;
    
    // Create vertex texture coordinate buffer.
    this.quadVTCBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadVTCBuffer);
    tmp = [
      scaleX, 0.0,
      0.0, 0.0,
      scaleX, scaleY,
      0.0, scaleY,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(tmp), gl.STATIC_DRAW);
  },


  mvIdentity : function () {
    this.mvMatrix = Matrix.I(4);
  },

  mvMultiply : function(m) {
    this.mvMatrix = this.mvMatrix.x(m);
  },

  mvTranslate : function (m) {
    this.mvMultiply(Matrix.Translation($V([m[0], m[1], m[2]])).ensure4x4());
  },

  setMatrixUniforms : function () {
    this.program.setMatrixUniform("uPMatrix", new Float32Array(this.perspectiveMatrix.flatten()));
    this.program.setMatrixUniform("uMVMatrix", new Float32Array(this.mvMatrix.flatten()));
  },

  initScene : function() {
    var gl = this.gl;
    
    // Establish the perspective with which we want to view the
    // scene. Our field of view is 45 degrees, with a width/height
    // ratio of 640:480, and we only want to see objects between 0.1 units
    // and 100 units away from the camera.
    
    this.perspectiveMatrix = makePerspective(45, 1, 0.1, 100.0);
    
    // Set the drawing position to the "identity" point, which is
    // the center of the scene.
    this.mvIdentity();

    // Now move the drawing position a bit to where we want to start
    // drawing the square.
    this.mvTranslate([0.0, 0.0, -2.4]);

    // Draw the cube by binding the array buffer to the cube's vertices
    // array, setting attributes, and pushing it to GL.
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadVPBuffer);
    gl.vertexAttribPointer(this.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
    
    // Set the texture coordinates attribute for the vertices.
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadVTCBuffer);
    gl.vertexAttribPointer(this.textureCoordAttribute, 2, gl.FLOAT, false, 0, 0);  
    
    this.onInitSceneTextures();
    
    this.setMatrixUniforms();
    
    if (this.framebuffer) {
      console.log("Bound Frame Buffer");
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
    }
  },



  toString: function() {
    return "WebGLCanvas Size: " + this.size;
  },

  checkLastError: function (operation) {
    var err = this.gl.getError();
    if (err != this.gl.NO_ERROR) {
      var name = this.glNames[err];
      name = (name !== undefined) ? name + "(" + err + ")":
          ("Unknown WebGL ENUM (0x" + value.toString(16) + ")");
      if (operation) {
        console.log("WebGL Error: %s, %s", operation, name);
      } else {
        console.log("WebGL Error: %s", name);
      }
      console.trace();
    }
  },

  onInitWebGL: function () {
    try {
      this.gl = this.canvas.getContext("experimental-webgl");
    } catch(e) {}
    
    if (!this.gl) {
      error("Unable to initialize WebGL. Your browser may not support it.");
    }
    if (this.glNames) {
      return;
    }
    this.glNames = {};
    for (var propertyName in this.gl) {
      if (typeof this.gl[propertyName] == 'number') {
        this.glNames[this.gl[propertyName]] = propertyName;
      }
    }
  },

  onInitShaders: function() {
    this.program = new Program(this.gl);
    this.program.attach(new Shader(this.gl, vertexShaderScript));
    this.program.attach(new Shader(this.gl, fragmentShaderScript));
    this.program.link();
    this.program.use();
    this.vertexPositionAttribute = this.program.getAttributeLocation("aVertexPosition");
    this.gl.enableVertexAttribArray(this.vertexPositionAttribute);
    this.textureCoordAttribute = this.program.getAttributeLocation("aTextureCoord");;
    this.gl.enableVertexAttribArray(this.textureCoordAttribute);
  },

  onInitTextures: function () {
    var gl = this.gl;
    this.texture = new Texture(gl, this.size, gl.RGBA);
  },

  onInitSceneTextures: function () {
    this.texture.bind(0, this.program, "texture");
  },

  drawScene: function() {
    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
  },

  readPixels: function(buffer) {
    var gl = this.gl;
    gl.readPixels(0, 0, this.size.w, this.size.h, gl.RGBA, gl.UNSIGNED_BYTE, buffer);
  },


});



module.exports = WebGLCanvas;

},{"../utils/error":21,"../utils/glUtils":22,"./Script":10,"sylvester.js":48,"uclass":57}],14:[function(require,module,exports){
"use strict";
var Class = require('uclass');

var YUVCanvas = new Class({

  Binds : ['decode'],

  initialize : function(canvas, size) {
    this.canvas = canvas;
    this.canvasCtx = this.canvas.getContext("2d");
    this.canvasBuffer = this.canvasCtx.createImageData(size.w, size.h);
  },

  decode : function (buffer, width, height) {
    if (!buffer)
      return;

    var lumaSize = width * height;
    var chromaSize = lumaSize >> 2;
    
    var ybuf = buffer.subarray(0, lumaSize);
    var ubuf = buffer.subarray(lumaSize, lumaSize + chromaSize);
    var vbuf = buffer.subarray(lumaSize + chromaSize, lumaSize + 2 * chromaSize);
    
    for (var y = 0; y < height; y++) {
      for (var x = 0; x < width; x++) {
        var yIndex = x + y * width;
        var uIndex = ~~(y / 2) * ~~(width / 2) + ~~(x / 2);
        var vIndex = ~~(y / 2) * ~~(width / 2) + ~~(x / 2);
        var R = 1.164 * (ybuf[yIndex] - 16) + 1.596 * (vbuf[vIndex] - 128);
        var G = 1.164 * (ybuf[yIndex] - 16) - 0.813 * (vbuf[vIndex] - 128) - 0.391 * (ubuf[uIndex] - 128);
        var B = 1.164 * (ybuf[yIndex] - 16) + 2.018 * (ubuf[uIndex] - 128);
        
        var rgbIndex = yIndex * 4;
        this.canvasBuffer.data[rgbIndex+0] = R;
        this.canvasBuffer.data[rgbIndex+1] = G;
        this.canvasBuffer.data[rgbIndex+2] = B;
        this.canvasBuffer.data[rgbIndex+3] = 0xff;
      }
    }
    
    this.canvasCtx.putImageData(this.canvasBuffer, 0, 0);
    
    var date = new Date();
    //console.log("WSAvcPlayer: Decode time: " + (date.getTime() - this.rcvtime) + " ms");
  },

});


module.exports = YUVCanvas;
},{"uclass":57}],15:[function(require,module,exports){
"use strict";

var Program     = require('./Program');
var Shader      = require('./Shader');
var Texture     = require('./Texture');
var Script      = require('./Script');
var WebGLCanvas = require('./WebGLCanvas');

var Class       = require('uclass');

var vertexShaderScript = Script.createFromSource("x-shader/x-vertex", `
  attribute vec3 aVertexPosition;
  attribute vec2 aTextureCoord;
  uniform mat4 uMVMatrix;
  uniform mat4 uPMatrix;
  varying highp vec2 vTextureCoord;
  void main(void) {
    gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);
    vTextureCoord = aTextureCoord;
  }
`);


var fragmentShaderScript = Script.createFromSource("x-shader/x-fragment", `
  precision highp float;
  varying highp vec2 vTextureCoord;
  uniform sampler2D YTexture;
  uniform sampler2D UTexture;
  uniform sampler2D VTexture;
  const mat4 YUV2RGB = mat4
  (
   1.1643828125, 0, 1.59602734375, -.87078515625,
   1.1643828125, -.39176171875, -.81296875, .52959375,
   1.1643828125, 2.017234375, 0, -1.081390625,
   0, 0, 0, 1
  );

  void main(void) {
   gl_FragColor = vec4( texture2D(YTexture,  vTextureCoord).x, texture2D(UTexture, vTextureCoord).x, texture2D(VTexture, vTextureCoord).x, 1) * YUV2RGB;
  }
`);




var YUVWebGLCanvas = new Class({
  Extends  : WebGLCanvas,
  Binds : ['decode'],

  initialize : function(canvas, size) {
    YUVWebGLCanvas.parent.initialize.call(this, canvas, size);
  },

  onInitShaders: function() {
    this.program = new Program(this.gl);
    this.program.attach(new Shader(this.gl, vertexShaderScript));
    this.program.attach(new Shader(this.gl, fragmentShaderScript));
    this.program.link();
    this.program.use();
    this.vertexPositionAttribute = this.program.getAttributeLocation("aVertexPosition");
    this.gl.enableVertexAttribArray(this.vertexPositionAttribute);
    this.textureCoordAttribute = this.program.getAttributeLocation("aTextureCoord");;
    this.gl.enableVertexAttribArray(this.textureCoordAttribute);
  },

  onInitTextures: function () {
    console.log("creatingTextures: size: " + this.size);
    this.YTexture = new Texture(this.gl, this.size);
    this.UTexture = new Texture(this.gl, this.size.getHalfSize());
    this.VTexture = new Texture(this.gl, this.size.getHalfSize());
  },

  onInitSceneTextures: function () {
    this.YTexture.bind(0, this.program, "YTexture");
    this.UTexture.bind(1, this.program, "UTexture");
    this.VTexture.bind(2, this.program, "VTexture");
  },

  fillYUVTextures: function(y, u, v) {
    this.YTexture.fill(y);
    this.UTexture.fill(u);
    this.VTexture.fill(v);
  },

  decode: function(buffer, width, height) {

    if (!buffer)
      return;

    var lumaSize = width * height;
    var chromaSize = lumaSize >> 2;

    this.YTexture.fill(buffer.subarray(0, lumaSize));
    this.UTexture.fill(buffer.subarray(lumaSize, lumaSize + chromaSize));
    this.VTexture.fill(buffer.subarray(lumaSize + chromaSize, lumaSize + 2 * chromaSize));
    this.drawScene();
  },

  toString: function() {
    return "YUVCanvas Size: " + this.size;
  }
});





module.exports = YUVWebGLCanvas;

},{"./Program":9,"./Script":10,"./Shader":11,"./Texture":12,"./WebGLCanvas":13,"uclass":57}],16:[function(require,module,exports){
(function (process){
/**
 * This is the web browser implementation of `debug()`.
 *
 * Expose `debug()` as the module.
 */

exports = module.exports = require('./debug');
exports.log = log;
exports.formatArgs = formatArgs;
exports.save = save;
exports.load = load;
exports.useColors = useColors;
exports.storage = 'undefined' != typeof chrome
               && 'undefined' != typeof chrome.storage
                  ? chrome.storage.local
                  : localstorage();

/**
 * Colors.
 */

exports.colors = [
  'lightseagreen',
  'forestgreen',
  'goldenrod',
  'dodgerblue',
  'darkorchid',
  'crimson'
];

/**
 * Currently only WebKit-based Web Inspectors, Firefox >= v31,
 * and the Firebug extension (any Firefox version) are known
 * to support "%c" CSS customizations.
 *
 * TODO: add a `localStorage` variable to explicitly enable/disable colors
 */

function useColors() {
  // NB: In an Electron preload script, document will be defined but not fully
  // initialized. Since we know we're in Chrome, we'll just detect this case
  // explicitly
  if (typeof window !== 'undefined' && window.process && window.process.type === 'renderer') {
    return true;
  }

  // is webkit? http://stackoverflow.com/a/16459606/376773
  // document is undefined in react-native: https://github.com/facebook/react-native/pull/1632
  return (typeof document !== 'undefined' && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance) ||
    // is firebug? http://stackoverflow.com/a/398120/376773
    (typeof window !== 'undefined' && window.console && (window.console.firebug || (window.console.exception && window.console.table))) ||
    // is firefox >= v31?
    // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
    (typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) && parseInt(RegExp.$1, 10) >= 31) ||
    // double check webkit in userAgent just in case we are in a worker
    (typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/));
}

/**
 * Map %j to `JSON.stringify()`, since no Web Inspectors do that by default.
 */

exports.formatters.j = function(v) {
  try {
    return JSON.stringify(v);
  } catch (err) {
    return '[UnexpectedJSONParseError]: ' + err.message;
  }
};


/**
 * Colorize log arguments if enabled.
 *
 * @api public
 */

function formatArgs(args) {
  var useColors = this.useColors;

  args[0] = (useColors ? '%c' : '')
    + this.namespace
    + (useColors ? ' %c' : ' ')
    + args[0]
    + (useColors ? '%c ' : ' ')
    + '+' + exports.humanize(this.diff);

  if (!useColors) return;

  var c = 'color: ' + this.color;
  args.splice(1, 0, c, 'color: inherit')

  // the final "%c" is somewhat tricky, because there could be other
  // arguments passed either before or after the %c, so we need to
  // figure out the correct index to insert the CSS into
  var index = 0;
  var lastC = 0;
  args[0].replace(/%[a-zA-Z%]/g, function(match) {
    if ('%%' === match) return;
    index++;
    if ('%c' === match) {
      // we only are interested in the *last* %c
      // (the user may have provided their own)
      lastC = index;
    }
  });

  args.splice(lastC, 0, c);
}

/**
 * Invokes `console.log()` when available.
 * No-op when `console.log` is not a "function".
 *
 * @api public
 */

function log() {
  // this hackery is required for IE8/9, where
  // the `console.log` function doesn't have 'apply'
  return 'object' === typeof console
    && console.log
    && Function.prototype.apply.call(console.log, console, arguments);
}

/**
 * Save `namespaces`.
 *
 * @param {String} namespaces
 * @api private
 */

function save(namespaces) {
  try {
    if (null == namespaces) {
      exports.storage.removeItem('debug');
    } else {
      exports.storage.debug = namespaces;
    }
  } catch(e) {}
}

/**
 * Load `namespaces`.
 *
 * @return {String} returns the previously persisted debug modes
 * @api private
 */

function load() {
  var r;
  try {
    r = exports.storage.debug;
  } catch(e) {}

  // If debug isn't set in LS, and we're in Electron, try to load $DEBUG
  if (!r && typeof process !== 'undefined' && 'env' in process) {
    r = process.env.DEBUG;
  }

  return r;
}

/**
 * Enable namespaces listed in `localStorage.debug` initially.
 */

exports.enable(load());

/**
 * Localstorage attempts to return the localstorage.
 *
 * This is necessary because safari throws
 * when a user disables cookies/localstorage
 * and you attempt to access it.
 *
 * @return {LocalStorage}
 * @api private
 */

function localstorage() {
  try {
    return window.localStorage;
  } catch (e) {}
}

}).call(this,require('_process'))
},{"./debug":17,"_process":47}],17:[function(require,module,exports){

/**
 * This is the common logic for both the Node.js and web browser
 * implementations of `debug()`.
 *
 * Expose `debug()` as the module.
 */

exports = module.exports = createDebug.debug = createDebug['default'] = createDebug;
exports.coerce = coerce;
exports.disable = disable;
exports.enable = enable;
exports.enabled = enabled;
exports.humanize = require('ms');

/**
 * The currently active debug mode names, and names to skip.
 */

exports.names = [];
exports.skips = [];

/**
 * Map of special "%n" handling functions, for the debug "format" argument.
 *
 * Valid key names are a single, lower or upper-case letter, i.e. "n" and "N".
 */

exports.formatters = {};

/**
 * Previous log timestamp.
 */

var prevTime;

/**
 * Select a color.
 * @param {String} namespace
 * @return {Number}
 * @api private
 */

function selectColor(namespace) {
  var hash = 0, i;

  for (i in namespace) {
    hash  = ((hash << 5) - hash) + namespace.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }

  return exports.colors[Math.abs(hash) % exports.colors.length];
}

/**
 * Create a debugger with the given `namespace`.
 *
 * @param {String} namespace
 * @return {Function}
 * @api public
 */

function createDebug(namespace) {

  function debug() {
    // disabled?
    if (!debug.enabled) return;

    var self = debug;

    // set `diff` timestamp
    var curr = +new Date();
    var ms = curr - (prevTime || curr);
    self.diff = ms;
    self.prev = prevTime;
    self.curr = curr;
    prevTime = curr;

    // turn the `arguments` into a proper Array
    var args = new Array(arguments.length);
    for (var i = 0; i < args.length; i++) {
      args[i] = arguments[i];
    }

    args[0] = exports.coerce(args[0]);

    if ('string' !== typeof args[0]) {
      // anything else let's inspect with %O
      args.unshift('%O');
    }

    // apply any `formatters` transformations
    var index = 0;
    args[0] = args[0].replace(/%([a-zA-Z%])/g, function(match, format) {
      // if we encounter an escaped % then don't increase the array index
      if (match === '%%') return match;
      index++;
      var formatter = exports.formatters[format];
      if ('function' === typeof formatter) {
        var val = args[index];
        match = formatter.call(self, val);

        // now we need to remove `args[index]` since it's inlined in the `format`
        args.splice(index, 1);
        index--;
      }
      return match;
    });

    // apply env-specific formatting (colors, etc.)
    exports.formatArgs.call(self, args);

    var logFn = debug.log || exports.log || console.log.bind(console);
    logFn.apply(self, args);
  }

  debug.namespace = namespace;
  debug.enabled = exports.enabled(namespace);
  debug.useColors = exports.useColors();
  debug.color = selectColor(namespace);

  // env-specific initialization logic for debug instances
  if ('function' === typeof exports.init) {
    exports.init(debug);
  }

  return debug;
}

/**
 * Enables a debug mode by namespaces. This can include modes
 * separated by a colon and wildcards.
 *
 * @param {String} namespaces
 * @api public
 */

function enable(namespaces) {
  exports.save(namespaces);

  exports.names = [];
  exports.skips = [];

  var split = (typeof namespaces === 'string' ? namespaces : '').split(/[\s,]+/);
  var len = split.length;

  for (var i = 0; i < len; i++) {
    if (!split[i]) continue; // ignore empty strings
    namespaces = split[i].replace(/\*/g, '.*?');
    if (namespaces[0] === '-') {
      exports.skips.push(new RegExp('^' + namespaces.substr(1) + '$'));
    } else {
      exports.names.push(new RegExp('^' + namespaces + '$'));
    }
  }
}

/**
 * Disable debug output.
 *
 * @api public
 */

function disable() {
  exports.enable('');
}

/**
 * Returns true if the given mode name is enabled, false otherwise.
 *
 * @param {String} name
 * @return {Boolean}
 * @api public
 */

function enabled(name) {
  var i, len;
  for (i = 0, len = exports.skips.length; i < len; i++) {
    if (exports.skips[i].test(name)) {
      return false;
    }
  }
  for (i = 0, len = exports.names.length; i < len; i++) {
    if (exports.names[i].test(name)) {
      return true;
    }
  }
  return false;
}

/**
 * Coerce `val`.
 *
 * @param {Mixed} val
 * @return {Mixed}
 * @api private
 */

function coerce(val) {
  if (val instanceof Error) return val.stack || val.message;
  return val;
}

},{"ms":18}],18:[function(require,module,exports){
/**
 * Helpers.
 */

var s = 1000;
var m = s * 60;
var h = m * 60;
var d = h * 24;
var y = d * 365.25;

/**
 * Parse or format the given `val`.
 *
 * Options:
 *
 *  - `long` verbose formatting [false]
 *
 * @param {String|Number} val
 * @param {Object} [options]
 * @throws {Error} throw an error if val is not a non-empty string or a number
 * @return {String|Number}
 * @api public
 */

module.exports = function(val, options) {
  options = options || {};
  var type = typeof val;
  if (type === 'string' && val.length > 0) {
    return parse(val);
  } else if (type === 'number' && isNaN(val) === false) {
    return options.long ? fmtLong(val) : fmtShort(val);
  }
  throw new Error(
    'val is not a non-empty string or a valid number. val=' +
      JSON.stringify(val)
  );
};

/**
 * Parse the given `str` and return milliseconds.
 *
 * @param {String} str
 * @return {Number}
 * @api private
 */

function parse(str) {
  str = String(str);
  if (str.length > 100) {
    return;
  }
  var match = /^((?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|years?|yrs?|y)?$/i.exec(
    str
  );
  if (!match) {
    return;
  }
  var n = parseFloat(match[1]);
  var type = (match[2] || 'ms').toLowerCase();
  switch (type) {
    case 'years':
    case 'year':
    case 'yrs':
    case 'yr':
    case 'y':
      return n * y;
    case 'days':
    case 'day':
    case 'd':
      return n * d;
    case 'hours':
    case 'hour':
    case 'hrs':
    case 'hr':
    case 'h':
      return n * h;
    case 'minutes':
    case 'minute':
    case 'mins':
    case 'min':
    case 'm':
      return n * m;
    case 'seconds':
    case 'second':
    case 'secs':
    case 'sec':
    case 's':
      return n * s;
    case 'milliseconds':
    case 'millisecond':
    case 'msecs':
    case 'msec':
    case 'ms':
      return n;
    default:
      return undefined;
  }
}

/**
 * Short format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function fmtShort(ms) {
  if (ms >= d) {
    return Math.round(ms / d) + 'd';
  }
  if (ms >= h) {
    return Math.round(ms / h) + 'h';
  }
  if (ms >= m) {
    return Math.round(ms / m) + 'm';
  }
  if (ms >= s) {
    return Math.round(ms / s) + 's';
  }
  return ms + 'ms';
}

/**
 * Long format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function fmtLong(ms) {
  return plural(ms, d, 'day') ||
    plural(ms, h, 'hour') ||
    plural(ms, m, 'minute') ||
    plural(ms, s, 'second') ||
    ms + ' ms';
}

/**
 * Pluralization helper.
 */

function plural(ms, n, name) {
  if (ms < n) {
    return;
  }
  if (ms < n * 1.5) {
    return Math.floor(ms / n) + ' ' + name;
  }
  return Math.ceil(ms / n) + ' ' + name + 's';
}

},{}],19:[function(require,module,exports){
"use strict";

/**
 * Represents a 2-dimensional size value. 
 */

function Size(w, h) {
  this.w = w;
  this.h = h;
}

Size.prototype = {
  toString: function () {
    return "(" + this.w + ", " + this.h + ")";
  },
  getHalfSize: function() {
    return new Size(this.w >>> 1, this.h >>> 1);
  },
  length: function() {
    return this.w * this.h;
  }
}
module.exports = Size;
},{}],20:[function(require,module,exports){
"use strict";

var error = require('./error');

function assert(condition, message) {
  if (!condition) {
    error(message);
  }
}


module.exports = assert;

},{"./error":21}],21:[function(require,module,exports){
"use strict";

function error(message) {
  console.error(message);
  console.trace();
}

module.exports = error;

},{}],22:[function(require,module,exports){
"use strict";

var Matrix = require('sylvester.js').Matrix;
var Vector = require('sylvester.js').Vector;
var $M     = Matrix.create;


// augment Sylvester some
Matrix.Translation = function (v)
{
  if (v.elements.length == 2) {
    var r = Matrix.I(3);
    r.elements[2][0] = v.elements[0];
    r.elements[2][1] = v.elements[1];
    return r;
  }

  if (v.elements.length == 3) {
    var r = Matrix.I(4);
    r.elements[0][3] = v.elements[0];
    r.elements[1][3] = v.elements[1];
    r.elements[2][3] = v.elements[2];
    return r;
  }

  throw "Invalid length for Translation";
}

Matrix.prototype.flatten = function ()
{
    var result = [];
    if (this.elements.length == 0)
        return [];


    for (var j = 0; j < this.elements[0].length; j++)
        for (var i = 0; i < this.elements.length; i++)
            result.push(this.elements[i][j]);
    return result;
}

Matrix.prototype.ensure4x4 = function()
{
    if (this.elements.length == 4 &&
        this.elements[0].length == 4)
        return this;

    if (this.elements.length > 4 ||
        this.elements[0].length > 4)
        return null;

    for (var i = 0; i < this.elements.length; i++) {
        for (var j = this.elements[i].length; j < 4; j++) {
            if (i == j)
                this.elements[i].push(1);
            else
                this.elements[i].push(0);
        }
    }

    for (var i = this.elements.length; i < 4; i++) {
        if (i == 0)
            this.elements.push([1, 0, 0, 0]);
        else if (i == 1)
            this.elements.push([0, 1, 0, 0]);
        else if (i == 2)
            this.elements.push([0, 0, 1, 0]);
        else if (i == 3)
            this.elements.push([0, 0, 0, 1]);
    }

    return this;
};


Vector.prototype.flatten = function ()
{
    return this.elements;
};



//
// gluPerspective
//
function makePerspective(fovy, aspect, znear, zfar)
{
    var ymax = znear * Math.tan(fovy * Math.PI / 360.0);
    var ymin = -ymax;
    var xmin = ymin * aspect;
    var xmax = ymax * aspect;

    return makeFrustum(xmin, xmax, ymin, ymax, znear, zfar);
}

//
// glFrustum
//
function makeFrustum(left, right,
                     bottom, top,
                     znear, zfar)
{
    var X = 2*znear/(right-left);
    var Y = 2*znear/(top-bottom);
    var A = (right+left)/(right-left);
    var B = (top+bottom)/(top-bottom);
    var C = -(zfar+znear)/(zfar-znear);
    var D = -2*zfar*znear/(zfar-znear);

    return $M([[X, 0, A, 0],
               [0, Y, B, 0],
               [0, 0, C, D],
               [0, 0, -1, 0]]);
}

module.exports.makePerspective = makePerspective;


},{"sylvester.js":48}],23:[function(require,module,exports){
"use strict";

var Avc            = require('../broadway/Decoder');
var YUVWebGLCanvas = require('../canvas/YUVWebGLCanvas');
var YUVCanvas      = require('../canvas/YUVCanvas');
var Size           = require('../utils/Size');
var Class          = require('uclass');
var Events         = require('uclass/events');
var debug          = require('debug');
var log            = debug("wsavc");

var WSAvcPlayer = new Class({
  Implements : [Events],


  initialize : function(canvas, canvastype) {

    this.canvas     = canvas;
    this.canvastype = canvastype;

    // AVC codec initialization
    this.avc = new Avc();
    if(false) this.avc.configure({
      filter: "original",
      filterHorLuma: "optimized",
      filterVerLumaEdge: "optimized",
      getBoundaryStrengthsA: "optimized"
    });

    //WebSocket variable
    this.ws;
    this.pktnum = 0;

  },


  decode : function(data) {
    var naltype = "invalid frame";

    if (data.length > 4) {
      if (data[4] == 0x65) {
        naltype = "I frame";
      }
      else if (data[4] == 0x41) {
        naltype = "P frame";
      }
      else if (data[4] == 0x67) {
        naltype = "SPS";
      }
      else if (data[4] == 0x68) {
        naltype = "PPS";
      }
    }
    //log("Passed " + naltype + " to decoder");
    this.avc.decode(data);
  },

  connect : function(url) {

    // Websocket initialization
    if (this.ws != undefined) {
      this.ws.close();
      delete this.ws;
    }
    this.ws = new WebSocket(url);
    this.ws.binaryType = "arraybuffer";

    this.ws.onopen = () => {
      log("Connected to " + url);
    };


    var framesList = [];

    this.ws.onmessage = (evt) => {
      if(typeof evt.data == "string")
        return this.cmd(JSON.parse(evt.data));

      this.pktnum++;
      var frame = new Uint8Array(evt.data);
      //log("[Pkt " + this.pktnum + " (" + evt.data.byteLength + " bytes)]");
      //this.decode(frame);
      framesList.push(frame);
    };


    var running = true;

    var shiftFrame = function() {
      if(!running)
        return;


      if(framesList.length > 10) {
        log("Dropping frames", framesList.length);
        framesList = [];
      }

      var frame = framesList.shift();


      if(frame)
        this.decode(frame);

      requestAnimationFrame(shiftFrame);
    }.bind(this);


    shiftFrame();



    this.ws.onclose = () => {
      running = false;
      log("WSAvcPlayer: Connection closed")
    };

  },

  initCanvas : function(width, height) {
    var canvasFactory = this.canvastype == "webgl" || this.canvastype == "YUVWebGLCanvas"
                        ? YUVWebGLCanvas
                        : YUVCanvas;

    var canvas = new canvasFactory(this.canvas, new Size(width, height));
    this.avc.onPictureDecoded = canvas.decode;
    this.emit("canvasReady", width, height);
  },

  cmd : function(cmd){
    log("Incoming request", cmd);

    if(cmd.action == "init") {
      this.initCanvas(cmd.width, cmd.height);
      this.canvas.width  = cmd.width;
      this.canvas.height = cmd.height;
    }
  },

  disconnect : function() {
    this.ws.close();
  },

  playStream : function() {
    var message = "REQUESTSTREAM ";
    this.ws.send(message);
    log("Sent " + message);
  },


  stopStream : function() {
    this.ws.send("STOPSTREAM");
    log("Sent STOPSTREAM");
  },
});


module.exports = WSAvcPlayer;
module.exports.debug = debug;

},{"../broadway/Decoder":8,"../canvas/YUVCanvas":14,"../canvas/YUVWebGLCanvas":15,"../utils/Size":19,"debug":16,"uclass":57,"uclass/events":55}],24:[function(require,module,exports){
/*!
 * jQuery JavaScript Library v3.3.1
 * https://jquery.com/
 *
 * Includes Sizzle.js
 * https://sizzlejs.com/
 *
 * Copyright JS Foundation and other contributors
 * Released under the MIT license
 * https://jquery.org/license
 *
 * Date: 2018-01-20T17:24Z
 */
( function( global, factory ) {

	"use strict";

	if ( typeof module === "object" && typeof module.exports === "object" ) {

		// For CommonJS and CommonJS-like environments where a proper `window`
		// is present, execute the factory and get jQuery.
		// For environments that do not have a `window` with a `document`
		// (such as Node.js), expose a factory as module.exports.
		// This accentuates the need for the creation of a real `window`.
		// e.g. var jQuery = require("jquery")(window);
		// See ticket #14549 for more info.
		module.exports = global.document ?
			factory( global, true ) :
			function( w ) {
				if ( !w.document ) {
					throw new Error( "jQuery requires a window with a document" );
				}
				return factory( w );
			};
	} else {
		factory( global );
	}

// Pass this if window is not defined yet
} )( typeof window !== "undefined" ? window : this, function( window, noGlobal ) {

// Edge <= 12 - 13+, Firefox <=18 - 45+, IE 10 - 11, Safari 5.1 - 9+, iOS 6 - 9.1
// throw exceptions when non-strict code (e.g., ASP.NET 4.5) accesses strict mode
// arguments.callee.caller (trac-13335). But as of jQuery 3.0 (2016), strict mode should be common
// enough that all such attempts are guarded in a try block.
"use strict";

var arr = [];

var document = window.document;

var getProto = Object.getPrototypeOf;

var slice = arr.slice;

var concat = arr.concat;

var push = arr.push;

var indexOf = arr.indexOf;

var class2type = {};

var toString = class2type.toString;

var hasOwn = class2type.hasOwnProperty;

var fnToString = hasOwn.toString;

var ObjectFunctionString = fnToString.call( Object );

var support = {};

var isFunction = function isFunction( obj ) {

      // Support: Chrome <=57, Firefox <=52
      // In some browsers, typeof returns "function" for HTML <object> elements
      // (i.e., `typeof document.createElement( "object" ) === "function"`).
      // We don't want to classify *any* DOM node as a function.
      return typeof obj === "function" && typeof obj.nodeType !== "number";
  };


var isWindow = function isWindow( obj ) {
		return obj != null && obj === obj.window;
	};




	var preservedScriptAttributes = {
		type: true,
		src: true,
		noModule: true
	};

	function DOMEval( code, doc, node ) {
		doc = doc || document;

		var i,
			script = doc.createElement( "script" );

		script.text = code;
		if ( node ) {
			for ( i in preservedScriptAttributes ) {
				if ( node[ i ] ) {
					script[ i ] = node[ i ];
				}
			}
		}
		doc.head.appendChild( script ).parentNode.removeChild( script );
	}


function toType( obj ) {
	if ( obj == null ) {
		return obj + "";
	}

	// Support: Android <=2.3 only (functionish RegExp)
	return typeof obj === "object" || typeof obj === "function" ?
		class2type[ toString.call( obj ) ] || "object" :
		typeof obj;
}
/* global Symbol */
// Defining this global in .eslintrc.json would create a danger of using the global
// unguarded in another place, it seems safer to define global only for this module



var
	version = "3.3.1",

	// Define a local copy of jQuery
	jQuery = function( selector, context ) {

		// The jQuery object is actually just the init constructor 'enhanced'
		// Need init if jQuery is called (just allow error to be thrown if not included)
		return new jQuery.fn.init( selector, context );
	},

	// Support: Android <=4.0 only
	// Make sure we trim BOM and NBSP
	rtrim = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g;

jQuery.fn = jQuery.prototype = {

	// The current version of jQuery being used
	jquery: version,

	constructor: jQuery,

	// The default length of a jQuery object is 0
	length: 0,

	toArray: function() {
		return slice.call( this );
	},

	// Get the Nth element in the matched element set OR
	// Get the whole matched element set as a clean array
	get: function( num ) {

		// Return all the elements in a clean array
		if ( num == null ) {
			return slice.call( this );
		}

		// Return just the one element from the set
		return num < 0 ? this[ num + this.length ] : this[ num ];
	},

	// Take an array of elements and push it onto the stack
	// (returning the new matched element set)
	pushStack: function( elems ) {

		// Build a new jQuery matched element set
		var ret = jQuery.merge( this.constructor(), elems );

		// Add the old object onto the stack (as a reference)
		ret.prevObject = this;

		// Return the newly-formed element set
		return ret;
	},

	// Execute a callback for every element in the matched set.
	each: function( callback ) {
		return jQuery.each( this, callback );
	},

	map: function( callback ) {
		return this.pushStack( jQuery.map( this, function( elem, i ) {
			return callback.call( elem, i, elem );
		} ) );
	},

	slice: function() {
		return this.pushStack( slice.apply( this, arguments ) );
	},

	first: function() {
		return this.eq( 0 );
	},

	last: function() {
		return this.eq( -1 );
	},

	eq: function( i ) {
		var len = this.length,
			j = +i + ( i < 0 ? len : 0 );
		return this.pushStack( j >= 0 && j < len ? [ this[ j ] ] : [] );
	},

	end: function() {
		return this.prevObject || this.constructor();
	},

	// For internal use only.
	// Behaves like an Array's method, not like a jQuery method.
	push: push,
	sort: arr.sort,
	splice: arr.splice
};

jQuery.extend = jQuery.fn.extend = function() {
	var options, name, src, copy, copyIsArray, clone,
		target = arguments[ 0 ] || {},
		i = 1,
		length = arguments.length,
		deep = false;

	// Handle a deep copy situation
	if ( typeof target === "boolean" ) {
		deep = target;

		// Skip the boolean and the target
		target = arguments[ i ] || {};
		i++;
	}

	// Handle case when target is a string or something (possible in deep copy)
	if ( typeof target !== "object" && !isFunction( target ) ) {
		target = {};
	}

	// Extend jQuery itself if only one argument is passed
	if ( i === length ) {
		target = this;
		i--;
	}

	for ( ; i < length; i++ ) {

		// Only deal with non-null/undefined values
		if ( ( options = arguments[ i ] ) != null ) {

			// Extend the base object
			for ( name in options ) {
				src = target[ name ];
				copy = options[ name ];

				// Prevent never-ending loop
				if ( target === copy ) {
					continue;
				}

				// Recurse if we're merging plain objects or arrays
				if ( deep && copy && ( jQuery.isPlainObject( copy ) ||
					( copyIsArray = Array.isArray( copy ) ) ) ) {

					if ( copyIsArray ) {
						copyIsArray = false;
						clone = src && Array.isArray( src ) ? src : [];

					} else {
						clone = src && jQuery.isPlainObject( src ) ? src : {};
					}

					// Never move original objects, clone them
					target[ name ] = jQuery.extend( deep, clone, copy );

				// Don't bring in undefined values
				} else if ( copy !== undefined ) {
					target[ name ] = copy;
				}
			}
		}
	}

	// Return the modified object
	return target;
};

jQuery.extend( {

	// Unique for each copy of jQuery on the page
	expando: "jQuery" + ( version + Math.random() ).replace( /\D/g, "" ),

	// Assume jQuery is ready without the ready module
	isReady: true,

	error: function( msg ) {
		throw new Error( msg );
	},

	noop: function() {},

	isPlainObject: function( obj ) {
		var proto, Ctor;

		// Detect obvious negatives
		// Use toString instead of jQuery.type to catch host objects
		if ( !obj || toString.call( obj ) !== "[object Object]" ) {
			return false;
		}

		proto = getProto( obj );

		// Objects with no prototype (e.g., `Object.create( null )`) are plain
		if ( !proto ) {
			return true;
		}

		// Objects with prototype are plain iff they were constructed by a global Object function
		Ctor = hasOwn.call( proto, "constructor" ) && proto.constructor;
		return typeof Ctor === "function" && fnToString.call( Ctor ) === ObjectFunctionString;
	},

	isEmptyObject: function( obj ) {

		/* eslint-disable no-unused-vars */
		// See https://github.com/eslint/eslint/issues/6125
		var name;

		for ( name in obj ) {
			return false;
		}
		return true;
	},

	// Evaluates a script in a global context
	globalEval: function( code ) {
		DOMEval( code );
	},

	each: function( obj, callback ) {
		var length, i = 0;

		if ( isArrayLike( obj ) ) {
			length = obj.length;
			for ( ; i < length; i++ ) {
				if ( callback.call( obj[ i ], i, obj[ i ] ) === false ) {
					break;
				}
			}
		} else {
			for ( i in obj ) {
				if ( callback.call( obj[ i ], i, obj[ i ] ) === false ) {
					break;
				}
			}
		}

		return obj;
	},

	// Support: Android <=4.0 only
	trim: function( text ) {
		return text == null ?
			"" :
			( text + "" ).replace( rtrim, "" );
	},

	// results is for internal usage only
	makeArray: function( arr, results ) {
		var ret = results || [];

		if ( arr != null ) {
			if ( isArrayLike( Object( arr ) ) ) {
				jQuery.merge( ret,
					typeof arr === "string" ?
					[ arr ] : arr
				);
			} else {
				push.call( ret, arr );
			}
		}

		return ret;
	},

	inArray: function( elem, arr, i ) {
		return arr == null ? -1 : indexOf.call( arr, elem, i );
	},

	// Support: Android <=4.0 only, PhantomJS 1 only
	// push.apply(_, arraylike) throws on ancient WebKit
	merge: function( first, second ) {
		var len = +second.length,
			j = 0,
			i = first.length;

		for ( ; j < len; j++ ) {
			first[ i++ ] = second[ j ];
		}

		first.length = i;

		return first;
	},

	grep: function( elems, callback, invert ) {
		var callbackInverse,
			matches = [],
			i = 0,
			length = elems.length,
			callbackExpect = !invert;

		// Go through the array, only saving the items
		// that pass the validator function
		for ( ; i < length; i++ ) {
			callbackInverse = !callback( elems[ i ], i );
			if ( callbackInverse !== callbackExpect ) {
				matches.push( elems[ i ] );
			}
		}

		return matches;
	},

	// arg is for internal usage only
	map: function( elems, callback, arg ) {
		var length, value,
			i = 0,
			ret = [];

		// Go through the array, translating each of the items to their new values
		if ( isArrayLike( elems ) ) {
			length = elems.length;
			for ( ; i < length; i++ ) {
				value = callback( elems[ i ], i, arg );

				if ( value != null ) {
					ret.push( value );
				}
			}

		// Go through every key on the object,
		} else {
			for ( i in elems ) {
				value = callback( elems[ i ], i, arg );

				if ( value != null ) {
					ret.push( value );
				}
			}
		}

		// Flatten any nested arrays
		return concat.apply( [], ret );
	},

	// A global GUID counter for objects
	guid: 1,

	// jQuery.support is not used in Core but other projects attach their
	// properties to it so it needs to exist.
	support: support
} );

if ( typeof Symbol === "function" ) {
	jQuery.fn[ Symbol.iterator ] = arr[ Symbol.iterator ];
}

// Populate the class2type map
jQuery.each( "Boolean Number String Function Array Date RegExp Object Error Symbol".split( " " ),
function( i, name ) {
	class2type[ "[object " + name + "]" ] = name.toLowerCase();
} );

function isArrayLike( obj ) {

	// Support: real iOS 8.2 only (not reproducible in simulator)
	// `in` check used to prevent JIT error (gh-2145)
	// hasOwn isn't used here due to false negatives
	// regarding Nodelist length in IE
	var length = !!obj && "length" in obj && obj.length,
		type = toType( obj );

	if ( isFunction( obj ) || isWindow( obj ) ) {
		return false;
	}

	return type === "array" || length === 0 ||
		typeof length === "number" && length > 0 && ( length - 1 ) in obj;
}
var Sizzle =
/*!
 * Sizzle CSS Selector Engine v2.3.3
 * https://sizzlejs.com/
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license
 * http://jquery.org/license
 *
 * Date: 2016-08-08
 */
(function( window ) {

var i,
	support,
	Expr,
	getText,
	isXML,
	tokenize,
	compile,
	select,
	outermostContext,
	sortInput,
	hasDuplicate,

	// Local document vars
	setDocument,
	document,
	docElem,
	documentIsHTML,
	rbuggyQSA,
	rbuggyMatches,
	matches,
	contains,

	// Instance-specific data
	expando = "sizzle" + 1 * new Date(),
	preferredDoc = window.document,
	dirruns = 0,
	done = 0,
	classCache = createCache(),
	tokenCache = createCache(),
	compilerCache = createCache(),
	sortOrder = function( a, b ) {
		if ( a === b ) {
			hasDuplicate = true;
		}
		return 0;
	},

	// Instance methods
	hasOwn = ({}).hasOwnProperty,
	arr = [],
	pop = arr.pop,
	push_native = arr.push,
	push = arr.push,
	slice = arr.slice,
	// Use a stripped-down indexOf as it's faster than native
	// https://jsperf.com/thor-indexof-vs-for/5
	indexOf = function( list, elem ) {
		var i = 0,
			len = list.length;
		for ( ; i < len; i++ ) {
			if ( list[i] === elem ) {
				return i;
			}
		}
		return -1;
	},

	booleans = "checked|selected|async|autofocus|autoplay|controls|defer|disabled|hidden|ismap|loop|multiple|open|readonly|required|scoped",

	// Regular expressions

	// http://www.w3.org/TR/css3-selectors/#whitespace
	whitespace = "[\\x20\\t\\r\\n\\f]",

	// http://www.w3.org/TR/CSS21/syndata.html#value-def-identifier
	identifier = "(?:\\\\.|[\\w-]|[^\0-\\xa0])+",

	// Attribute selectors: http://www.w3.org/TR/selectors/#attribute-selectors
	attributes = "\\[" + whitespace + "*(" + identifier + ")(?:" + whitespace +
		// Operator (capture 2)
		"*([*^$|!~]?=)" + whitespace +
		// "Attribute values must be CSS identifiers [capture 5] or strings [capture 3 or capture 4]"
		"*(?:'((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\"|(" + identifier + "))|)" + whitespace +
		"*\\]",

	pseudos = ":(" + identifier + ")(?:\\((" +
		// To reduce the number of selectors needing tokenize in the preFilter, prefer arguments:
		// 1. quoted (capture 3; capture 4 or capture 5)
		"('((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\")|" +
		// 2. simple (capture 6)
		"((?:\\\\.|[^\\\\()[\\]]|" + attributes + ")*)|" +
		// 3. anything else (capture 2)
		".*" +
		")\\)|)",

	// Leading and non-escaped trailing whitespace, capturing some non-whitespace characters preceding the latter
	rwhitespace = new RegExp( whitespace + "+", "g" ),
	rtrim = new RegExp( "^" + whitespace + "+|((?:^|[^\\\\])(?:\\\\.)*)" + whitespace + "+$", "g" ),

	rcomma = new RegExp( "^" + whitespace + "*," + whitespace + "*" ),
	rcombinators = new RegExp( "^" + whitespace + "*([>+~]|" + whitespace + ")" + whitespace + "*" ),

	rattributeQuotes = new RegExp( "=" + whitespace + "*([^\\]'\"]*?)" + whitespace + "*\\]", "g" ),

	rpseudo = new RegExp( pseudos ),
	ridentifier = new RegExp( "^" + identifier + "$" ),

	matchExpr = {
		"ID": new RegExp( "^#(" + identifier + ")" ),
		"CLASS": new RegExp( "^\\.(" + identifier + ")" ),
		"TAG": new RegExp( "^(" + identifier + "|[*])" ),
		"ATTR": new RegExp( "^" + attributes ),
		"PSEUDO": new RegExp( "^" + pseudos ),
		"CHILD": new RegExp( "^:(only|first|last|nth|nth-last)-(child|of-type)(?:\\(" + whitespace +
			"*(even|odd|(([+-]|)(\\d*)n|)" + whitespace + "*(?:([+-]|)" + whitespace +
			"*(\\d+)|))" + whitespace + "*\\)|)", "i" ),
		"bool": new RegExp( "^(?:" + booleans + ")$", "i" ),
		// For use in libraries implementing .is()
		// We use this for POS matching in `select`
		"needsContext": new RegExp( "^" + whitespace + "*[>+~]|:(even|odd|eq|gt|lt|nth|first|last)(?:\\(" +
			whitespace + "*((?:-\\d)?\\d*)" + whitespace + "*\\)|)(?=[^-]|$)", "i" )
	},

	rinputs = /^(?:input|select|textarea|button)$/i,
	rheader = /^h\d$/i,

	rnative = /^[^{]+\{\s*\[native \w/,

	// Easily-parseable/retrievable ID or TAG or CLASS selectors
	rquickExpr = /^(?:#([\w-]+)|(\w+)|\.([\w-]+))$/,

	rsibling = /[+~]/,

	// CSS escapes
	// http://www.w3.org/TR/CSS21/syndata.html#escaped-characters
	runescape = new RegExp( "\\\\([\\da-f]{1,6}" + whitespace + "?|(" + whitespace + ")|.)", "ig" ),
	funescape = function( _, escaped, escapedWhitespace ) {
		var high = "0x" + escaped - 0x10000;
		// NaN means non-codepoint
		// Support: Firefox<24
		// Workaround erroneous numeric interpretation of +"0x"
		return high !== high || escapedWhitespace ?
			escaped :
			high < 0 ?
				// BMP codepoint
				String.fromCharCode( high + 0x10000 ) :
				// Supplemental Plane codepoint (surrogate pair)
				String.fromCharCode( high >> 10 | 0xD800, high & 0x3FF | 0xDC00 );
	},

	// CSS string/identifier serialization
	// https://drafts.csswg.org/cssom/#common-serializing-idioms
	rcssescape = /([\0-\x1f\x7f]|^-?\d)|^-$|[^\0-\x1f\x7f-\uFFFF\w-]/g,
	fcssescape = function( ch, asCodePoint ) {
		if ( asCodePoint ) {

			// U+0000 NULL becomes U+FFFD REPLACEMENT CHARACTER
			if ( ch === "\0" ) {
				return "\uFFFD";
			}

			// Control characters and (dependent upon position) numbers get escaped as code points
			return ch.slice( 0, -1 ) + "\\" + ch.charCodeAt( ch.length - 1 ).toString( 16 ) + " ";
		}

		// Other potentially-special ASCII characters get backslash-escaped
		return "\\" + ch;
	},

	// Used for iframes
	// See setDocument()
	// Removing the function wrapper causes a "Permission Denied"
	// error in IE
	unloadHandler = function() {
		setDocument();
	},

	disabledAncestor = addCombinator(
		function( elem ) {
			return elem.disabled === true && ("form" in elem || "label" in elem);
		},
		{ dir: "parentNode", next: "legend" }
	);

// Optimize for push.apply( _, NodeList )
try {
	push.apply(
		(arr = slice.call( preferredDoc.childNodes )),
		preferredDoc.childNodes
	);
	// Support: Android<4.0
	// Detect silently failing push.apply
	arr[ preferredDoc.childNodes.length ].nodeType;
} catch ( e ) {
	push = { apply: arr.length ?

		// Leverage slice if possible
		function( target, els ) {
			push_native.apply( target, slice.call(els) );
		} :

		// Support: IE<9
		// Otherwise append directly
		function( target, els ) {
			var j = target.length,
				i = 0;
			// Can't trust NodeList.length
			while ( (target[j++] = els[i++]) ) {}
			target.length = j - 1;
		}
	};
}

function Sizzle( selector, context, results, seed ) {
	var m, i, elem, nid, match, groups, newSelector,
		newContext = context && context.ownerDocument,

		// nodeType defaults to 9, since context defaults to document
		nodeType = context ? context.nodeType : 9;

	results = results || [];

	// Return early from calls with invalid selector or context
	if ( typeof selector !== "string" || !selector ||
		nodeType !== 1 && nodeType !== 9 && nodeType !== 11 ) {

		return results;
	}

	// Try to shortcut find operations (as opposed to filters) in HTML documents
	if ( !seed ) {

		if ( ( context ? context.ownerDocument || context : preferredDoc ) !== document ) {
			setDocument( context );
		}
		context = context || document;

		if ( documentIsHTML ) {

			// If the selector is sufficiently simple, try using a "get*By*" DOM method
			// (excepting DocumentFragment context, where the methods don't exist)
			if ( nodeType !== 11 && (match = rquickExpr.exec( selector )) ) {

				// ID selector
				if ( (m = match[1]) ) {

					// Document context
					if ( nodeType === 9 ) {
						if ( (elem = context.getElementById( m )) ) {

							// Support: IE, Opera, Webkit
							// TODO: identify versions
							// getElementById can match elements by name instead of ID
							if ( elem.id === m ) {
								results.push( elem );
								return results;
							}
						} else {
							return results;
						}

					// Element context
					} else {

						// Support: IE, Opera, Webkit
						// TODO: identify versions
						// getElementById can match elements by name instead of ID
						if ( newContext && (elem = newContext.getElementById( m )) &&
							contains( context, elem ) &&
							elem.id === m ) {

							results.push( elem );
							return results;
						}
					}

				// Type selector
				} else if ( match[2] ) {
					push.apply( results, context.getElementsByTagName( selector ) );
					return results;

				// Class selector
				} else if ( (m = match[3]) && support.getElementsByClassName &&
					context.getElementsByClassName ) {

					push.apply( results, context.getElementsByClassName( m ) );
					return results;
				}
			}

			// Take advantage of querySelectorAll
			if ( support.qsa &&
				!compilerCache[ selector + " " ] &&
				(!rbuggyQSA || !rbuggyQSA.test( selector )) ) {

				if ( nodeType !== 1 ) {
					newContext = context;
					newSelector = selector;

				// qSA looks outside Element context, which is not what we want
				// Thanks to Andrew Dupont for this workaround technique
				// Support: IE <=8
				// Exclude object elements
				} else if ( context.nodeName.toLowerCase() !== "object" ) {

					// Capture the context ID, setting it first if necessary
					if ( (nid = context.getAttribute( "id" )) ) {
						nid = nid.replace( rcssescape, fcssescape );
					} else {
						context.setAttribute( "id", (nid = expando) );
					}

					// Prefix every selector in the list
					groups = tokenize( selector );
					i = groups.length;
					while ( i-- ) {
						groups[i] = "#" + nid + " " + toSelector( groups[i] );
					}
					newSelector = groups.join( "," );

					// Expand context for sibling selectors
					newContext = rsibling.test( selector ) && testContext( context.parentNode ) ||
						context;
				}

				if ( newSelector ) {
					try {
						push.apply( results,
							newContext.querySelectorAll( newSelector )
						);
						return results;
					} catch ( qsaError ) {
					} finally {
						if ( nid === expando ) {
							context.removeAttribute( "id" );
						}
					}
				}
			}
		}
	}

	// All others
	return select( selector.replace( rtrim, "$1" ), context, results, seed );
}

/**
 * Create key-value caches of limited size
 * @returns {function(string, object)} Returns the Object data after storing it on itself with
 *	property name the (space-suffixed) string and (if the cache is larger than Expr.cacheLength)
 *	deleting the oldest entry
 */
function createCache() {
	var keys = [];

	function cache( key, value ) {
		// Use (key + " ") to avoid collision with native prototype properties (see Issue #157)
		if ( keys.push( key + " " ) > Expr.cacheLength ) {
			// Only keep the most recent entries
			delete cache[ keys.shift() ];
		}
		return (cache[ key + " " ] = value);
	}
	return cache;
}

/**
 * Mark a function for special use by Sizzle
 * @param {Function} fn The function to mark
 */
function markFunction( fn ) {
	fn[ expando ] = true;
	return fn;
}

/**
 * Support testing using an element
 * @param {Function} fn Passed the created element and returns a boolean result
 */
function assert( fn ) {
	var el = document.createElement("fieldset");

	try {
		return !!fn( el );
	} catch (e) {
		return false;
	} finally {
		// Remove from its parent by default
		if ( el.parentNode ) {
			el.parentNode.removeChild( el );
		}
		// release memory in IE
		el = null;
	}
}

/**
 * Adds the same handler for all of the specified attrs
 * @param {String} attrs Pipe-separated list of attributes
 * @param {Function} handler The method that will be applied
 */
function addHandle( attrs, handler ) {
	var arr = attrs.split("|"),
		i = arr.length;

	while ( i-- ) {
		Expr.attrHandle[ arr[i] ] = handler;
	}
}

/**
 * Checks document order of two siblings
 * @param {Element} a
 * @param {Element} b
 * @returns {Number} Returns less than 0 if a precedes b, greater than 0 if a follows b
 */
function siblingCheck( a, b ) {
	var cur = b && a,
		diff = cur && a.nodeType === 1 && b.nodeType === 1 &&
			a.sourceIndex - b.sourceIndex;

	// Use IE sourceIndex if available on both nodes
	if ( diff ) {
		return diff;
	}

	// Check if b follows a
	if ( cur ) {
		while ( (cur = cur.nextSibling) ) {
			if ( cur === b ) {
				return -1;
			}
		}
	}

	return a ? 1 : -1;
}

/**
 * Returns a function to use in pseudos for input types
 * @param {String} type
 */
function createInputPseudo( type ) {
	return function( elem ) {
		var name = elem.nodeName.toLowerCase();
		return name === "input" && elem.type === type;
	};
}

/**
 * Returns a function to use in pseudos for buttons
 * @param {String} type
 */
function createButtonPseudo( type ) {
	return function( elem ) {
		var name = elem.nodeName.toLowerCase();
		return (name === "input" || name === "button") && elem.type === type;
	};
}

/**
 * Returns a function to use in pseudos for :enabled/:disabled
 * @param {Boolean} disabled true for :disabled; false for :enabled
 */
function createDisabledPseudo( disabled ) {

	// Known :disabled false positives: fieldset[disabled] > legend:nth-of-type(n+2) :can-disable
	return function( elem ) {

		// Only certain elements can match :enabled or :disabled
		// https://html.spec.whatwg.org/multipage/scripting.html#selector-enabled
		// https://html.spec.whatwg.org/multipage/scripting.html#selector-disabled
		if ( "form" in elem ) {

			// Check for inherited disabledness on relevant non-disabled elements:
			// * listed form-associated elements in a disabled fieldset
			//   https://html.spec.whatwg.org/multipage/forms.html#category-listed
			//   https://html.spec.whatwg.org/multipage/forms.html#concept-fe-disabled
			// * option elements in a disabled optgroup
			//   https://html.spec.whatwg.org/multipage/forms.html#concept-option-disabled
			// All such elements have a "form" property.
			if ( elem.parentNode && elem.disabled === false ) {

				// Option elements defer to a parent optgroup if present
				if ( "label" in elem ) {
					if ( "label" in elem.parentNode ) {
						return elem.parentNode.disabled === disabled;
					} else {
						return elem.disabled === disabled;
					}
				}

				// Support: IE 6 - 11
				// Use the isDisabled shortcut property to check for disabled fieldset ancestors
				return elem.isDisabled === disabled ||

					// Where there is no isDisabled, check manually
					/* jshint -W018 */
					elem.isDisabled !== !disabled &&
						disabledAncestor( elem ) === disabled;
			}

			return elem.disabled === disabled;

		// Try to winnow out elements that can't be disabled before trusting the disabled property.
		// Some victims get caught in our net (label, legend, menu, track), but it shouldn't
		// even exist on them, let alone have a boolean value.
		} else if ( "label" in elem ) {
			return elem.disabled === disabled;
		}

		// Remaining elements are neither :enabled nor :disabled
		return false;
	};
}

/**
 * Returns a function to use in pseudos for positionals
 * @param {Function} fn
 */
function createPositionalPseudo( fn ) {
	return markFunction(function( argument ) {
		argument = +argument;
		return markFunction(function( seed, matches ) {
			var j,
				matchIndexes = fn( [], seed.length, argument ),
				i = matchIndexes.length;

			// Match elements found at the specified indexes
			while ( i-- ) {
				if ( seed[ (j = matchIndexes[i]) ] ) {
					seed[j] = !(matches[j] = seed[j]);
				}
			}
		});
	});
}

/**
 * Checks a node for validity as a Sizzle context
 * @param {Element|Object=} context
 * @returns {Element|Object|Boolean} The input node if acceptable, otherwise a falsy value
 */
function testContext( context ) {
	return context && typeof context.getElementsByTagName !== "undefined" && context;
}

// Expose support vars for convenience
support = Sizzle.support = {};

/**
 * Detects XML nodes
 * @param {Element|Object} elem An element or a document
 * @returns {Boolean} True iff elem is a non-HTML XML node
 */
isXML = Sizzle.isXML = function( elem ) {
	// documentElement is verified for cases where it doesn't yet exist
	// (such as loading iframes in IE - #4833)
	var documentElement = elem && (elem.ownerDocument || elem).documentElement;
	return documentElement ? documentElement.nodeName !== "HTML" : false;
};

/**
 * Sets document-related variables once based on the current document
 * @param {Element|Object} [doc] An element or document object to use to set the document
 * @returns {Object} Returns the current document
 */
setDocument = Sizzle.setDocument = function( node ) {
	var hasCompare, subWindow,
		doc = node ? node.ownerDocument || node : preferredDoc;

	// Return early if doc is invalid or already selected
	if ( doc === document || doc.nodeType !== 9 || !doc.documentElement ) {
		return document;
	}

	// Update global variables
	document = doc;
	docElem = document.documentElement;
	documentIsHTML = !isXML( document );

	// Support: IE 9-11, Edge
	// Accessing iframe documents after unload throws "permission denied" errors (jQuery #13936)
	if ( preferredDoc !== document &&
		(subWindow = document.defaultView) && subWindow.top !== subWindow ) {

		// Support: IE 11, Edge
		if ( subWindow.addEventListener ) {
			subWindow.addEventListener( "unload", unloadHandler, false );

		// Support: IE 9 - 10 only
		} else if ( subWindow.attachEvent ) {
			subWindow.attachEvent( "onunload", unloadHandler );
		}
	}

	/* Attributes
	---------------------------------------------------------------------- */

	// Support: IE<8
	// Verify that getAttribute really returns attributes and not properties
	// (excepting IE8 booleans)
	support.attributes = assert(function( el ) {
		el.className = "i";
		return !el.getAttribute("className");
	});

	/* getElement(s)By*
	---------------------------------------------------------------------- */

	// Check if getElementsByTagName("*") returns only elements
	support.getElementsByTagName = assert(function( el ) {
		el.appendChild( document.createComment("") );
		return !el.getElementsByTagName("*").length;
	});

	// Support: IE<9
	support.getElementsByClassName = rnative.test( document.getElementsByClassName );

	// Support: IE<10
	// Check if getElementById returns elements by name
	// The broken getElementById methods don't pick up programmatically-set names,
	// so use a roundabout getElementsByName test
	support.getById = assert(function( el ) {
		docElem.appendChild( el ).id = expando;
		return !document.getElementsByName || !document.getElementsByName( expando ).length;
	});

	// ID filter and find
	if ( support.getById ) {
		Expr.filter["ID"] = function( id ) {
			var attrId = id.replace( runescape, funescape );
			return function( elem ) {
				return elem.getAttribute("id") === attrId;
			};
		};
		Expr.find["ID"] = function( id, context ) {
			if ( typeof context.getElementById !== "undefined" && documentIsHTML ) {
				var elem = context.getElementById( id );
				return elem ? [ elem ] : [];
			}
		};
	} else {
		Expr.filter["ID"] =  function( id ) {
			var attrId = id.replace( runescape, funescape );
			return function( elem ) {
				var node = typeof elem.getAttributeNode !== "undefined" &&
					elem.getAttributeNode("id");
				return node && node.value === attrId;
			};
		};

		// Support: IE 6 - 7 only
		// getElementById is not reliable as a find shortcut
		Expr.find["ID"] = function( id, context ) {
			if ( typeof context.getElementById !== "undefined" && documentIsHTML ) {
				var node, i, elems,
					elem = context.getElementById( id );

				if ( elem ) {

					// Verify the id attribute
					node = elem.getAttributeNode("id");
					if ( node && node.value === id ) {
						return [ elem ];
					}

					// Fall back on getElementsByName
					elems = context.getElementsByName( id );
					i = 0;
					while ( (elem = elems[i++]) ) {
						node = elem.getAttributeNode("id");
						if ( node && node.value === id ) {
							return [ elem ];
						}
					}
				}

				return [];
			}
		};
	}

	// Tag
	Expr.find["TAG"] = support.getElementsByTagName ?
		function( tag, context ) {
			if ( typeof context.getElementsByTagName !== "undefined" ) {
				return context.getElementsByTagName( tag );

			// DocumentFragment nodes don't have gEBTN
			} else if ( support.qsa ) {
				return context.querySelectorAll( tag );
			}
		} :

		function( tag, context ) {
			var elem,
				tmp = [],
				i = 0,
				// By happy coincidence, a (broken) gEBTN appears on DocumentFragment nodes too
				results = context.getElementsByTagName( tag );

			// Filter out possible comments
			if ( tag === "*" ) {
				while ( (elem = results[i++]) ) {
					if ( elem.nodeType === 1 ) {
						tmp.push( elem );
					}
				}

				return tmp;
			}
			return results;
		};

	// Class
	Expr.find["CLASS"] = support.getElementsByClassName && function( className, context ) {
		if ( typeof context.getElementsByClassName !== "undefined" && documentIsHTML ) {
			return context.getElementsByClassName( className );
		}
	};

	/* QSA/matchesSelector
	---------------------------------------------------------------------- */

	// QSA and matchesSelector support

	// matchesSelector(:active) reports false when true (IE9/Opera 11.5)
	rbuggyMatches = [];

	// qSa(:focus) reports false when true (Chrome 21)
	// We allow this because of a bug in IE8/9 that throws an error
	// whenever `document.activeElement` is accessed on an iframe
	// So, we allow :focus to pass through QSA all the time to avoid the IE error
	// See https://bugs.jquery.com/ticket/13378
	rbuggyQSA = [];

	if ( (support.qsa = rnative.test( document.querySelectorAll )) ) {
		// Build QSA regex
		// Regex strategy adopted from Diego Perini
		assert(function( el ) {
			// Select is set to empty string on purpose
			// This is to test IE's treatment of not explicitly
			// setting a boolean content attribute,
			// since its presence should be enough
			// https://bugs.jquery.com/ticket/12359
			docElem.appendChild( el ).innerHTML = "<a id='" + expando + "'></a>" +
				"<select id='" + expando + "-\r\\' msallowcapture=''>" +
				"<option selected=''></option></select>";

			// Support: IE8, Opera 11-12.16
			// Nothing should be selected when empty strings follow ^= or $= or *=
			// The test attribute must be unknown in Opera but "safe" for WinRT
			// https://msdn.microsoft.com/en-us/library/ie/hh465388.aspx#attribute_section
			if ( el.querySelectorAll("[msallowcapture^='']").length ) {
				rbuggyQSA.push( "[*^$]=" + whitespace + "*(?:''|\"\")" );
			}

			// Support: IE8
			// Boolean attributes and "value" are not treated correctly
			if ( !el.querySelectorAll("[selected]").length ) {
				rbuggyQSA.push( "\\[" + whitespace + "*(?:value|" + booleans + ")" );
			}

			// Support: Chrome<29, Android<4.4, Safari<7.0+, iOS<7.0+, PhantomJS<1.9.8+
			if ( !el.querySelectorAll( "[id~=" + expando + "-]" ).length ) {
				rbuggyQSA.push("~=");
			}

			// Webkit/Opera - :checked should return selected option elements
			// http://www.w3.org/TR/2011/REC-css3-selectors-20110929/#checked
			// IE8 throws error here and will not see later tests
			if ( !el.querySelectorAll(":checked").length ) {
				rbuggyQSA.push(":checked");
			}

			// Support: Safari 8+, iOS 8+
			// https://bugs.webkit.org/show_bug.cgi?id=136851
			// In-page `selector#id sibling-combinator selector` fails
			if ( !el.querySelectorAll( "a#" + expando + "+*" ).length ) {
				rbuggyQSA.push(".#.+[+~]");
			}
		});

		assert(function( el ) {
			el.innerHTML = "<a href='' disabled='disabled'></a>" +
				"<select disabled='disabled'><option/></select>";

			// Support: Windows 8 Native Apps
			// The type and name attributes are restricted during .innerHTML assignment
			var input = document.createElement("input");
			input.setAttribute( "type", "hidden" );
			el.appendChild( input ).setAttribute( "name", "D" );

			// Support: IE8
			// Enforce case-sensitivity of name attribute
			if ( el.querySelectorAll("[name=d]").length ) {
				rbuggyQSA.push( "name" + whitespace + "*[*^$|!~]?=" );
			}

			// FF 3.5 - :enabled/:disabled and hidden elements (hidden elements are still enabled)
			// IE8 throws error here and will not see later tests
			if ( el.querySelectorAll(":enabled").length !== 2 ) {
				rbuggyQSA.push( ":enabled", ":disabled" );
			}

			// Support: IE9-11+
			// IE's :disabled selector does not pick up the children of disabled fieldsets
			docElem.appendChild( el ).disabled = true;
			if ( el.querySelectorAll(":disabled").length !== 2 ) {
				rbuggyQSA.push( ":enabled", ":disabled" );
			}

			// Opera 10-11 does not throw on post-comma invalid pseudos
			el.querySelectorAll("*,:x");
			rbuggyQSA.push(",.*:");
		});
	}

	if ( (support.matchesSelector = rnative.test( (matches = docElem.matches ||
		docElem.webkitMatchesSelector ||
		docElem.mozMatchesSelector ||
		docElem.oMatchesSelector ||
		docElem.msMatchesSelector) )) ) {

		assert(function( el ) {
			// Check to see if it's possible to do matchesSelector
			// on a disconnected node (IE 9)
			support.disconnectedMatch = matches.call( el, "*" );

			// This should fail with an exception
			// Gecko does not error, returns false instead
			matches.call( el, "[s!='']:x" );
			rbuggyMatches.push( "!=", pseudos );
		});
	}

	rbuggyQSA = rbuggyQSA.length && new RegExp( rbuggyQSA.join("|") );
	rbuggyMatches = rbuggyMatches.length && new RegExp( rbuggyMatches.join("|") );

	/* Contains
	---------------------------------------------------------------------- */
	hasCompare = rnative.test( docElem.compareDocumentPosition );

	// Element contains another
	// Purposefully self-exclusive
	// As in, an element does not contain itself
	contains = hasCompare || rnative.test( docElem.contains ) ?
		function( a, b ) {
			var adown = a.nodeType === 9 ? a.documentElement : a,
				bup = b && b.parentNode;
			return a === bup || !!( bup && bup.nodeType === 1 && (
				adown.contains ?
					adown.contains( bup ) :
					a.compareDocumentPosition && a.compareDocumentPosition( bup ) & 16
			));
		} :
		function( a, b ) {
			if ( b ) {
				while ( (b = b.parentNode) ) {
					if ( b === a ) {
						return true;
					}
				}
			}
			return false;
		};

	/* Sorting
	---------------------------------------------------------------------- */

	// Document order sorting
	sortOrder = hasCompare ?
	function( a, b ) {

		// Flag for duplicate removal
		if ( a === b ) {
			hasDuplicate = true;
			return 0;
		}

		// Sort on method existence if only one input has compareDocumentPosition
		var compare = !a.compareDocumentPosition - !b.compareDocumentPosition;
		if ( compare ) {
			return compare;
		}

		// Calculate position if both inputs belong to the same document
		compare = ( a.ownerDocument || a ) === ( b.ownerDocument || b ) ?
			a.compareDocumentPosition( b ) :

			// Otherwise we know they are disconnected
			1;

		// Disconnected nodes
		if ( compare & 1 ||
			(!support.sortDetached && b.compareDocumentPosition( a ) === compare) ) {

			// Choose the first element that is related to our preferred document
			if ( a === document || a.ownerDocument === preferredDoc && contains(preferredDoc, a) ) {
				return -1;
			}
			if ( b === document || b.ownerDocument === preferredDoc && contains(preferredDoc, b) ) {
				return 1;
			}

			// Maintain original order
			return sortInput ?
				( indexOf( sortInput, a ) - indexOf( sortInput, b ) ) :
				0;
		}

		return compare & 4 ? -1 : 1;
	} :
	function( a, b ) {
		// Exit early if the nodes are identical
		if ( a === b ) {
			hasDuplicate = true;
			return 0;
		}

		var cur,
			i = 0,
			aup = a.parentNode,
			bup = b.parentNode,
			ap = [ a ],
			bp = [ b ];

		// Parentless nodes are either documents or disconnected
		if ( !aup || !bup ) {
			return a === document ? -1 :
				b === document ? 1 :
				aup ? -1 :
				bup ? 1 :
				sortInput ?
				( indexOf( sortInput, a ) - indexOf( sortInput, b ) ) :
				0;

		// If the nodes are siblings, we can do a quick check
		} else if ( aup === bup ) {
			return siblingCheck( a, b );
		}

		// Otherwise we need full lists of their ancestors for comparison
		cur = a;
		while ( (cur = cur.parentNode) ) {
			ap.unshift( cur );
		}
		cur = b;
		while ( (cur = cur.parentNode) ) {
			bp.unshift( cur );
		}

		// Walk down the tree looking for a discrepancy
		while ( ap[i] === bp[i] ) {
			i++;
		}

		return i ?
			// Do a sibling check if the nodes have a common ancestor
			siblingCheck( ap[i], bp[i] ) :

			// Otherwise nodes in our document sort first
			ap[i] === preferredDoc ? -1 :
			bp[i] === preferredDoc ? 1 :
			0;
	};

	return document;
};

Sizzle.matches = function( expr, elements ) {
	return Sizzle( expr, null, null, elements );
};

Sizzle.matchesSelector = function( elem, expr ) {
	// Set document vars if needed
	if ( ( elem.ownerDocument || elem ) !== document ) {
		setDocument( elem );
	}

	// Make sure that attribute selectors are quoted
	expr = expr.replace( rattributeQuotes, "='$1']" );

	if ( support.matchesSelector && documentIsHTML &&
		!compilerCache[ expr + " " ] &&
		( !rbuggyMatches || !rbuggyMatches.test( expr ) ) &&
		( !rbuggyQSA     || !rbuggyQSA.test( expr ) ) ) {

		try {
			var ret = matches.call( elem, expr );

			// IE 9's matchesSelector returns false on disconnected nodes
			if ( ret || support.disconnectedMatch ||
					// As well, disconnected nodes are said to be in a document
					// fragment in IE 9
					elem.document && elem.document.nodeType !== 11 ) {
				return ret;
			}
		} catch (e) {}
	}

	return Sizzle( expr, document, null, [ elem ] ).length > 0;
};

Sizzle.contains = function( context, elem ) {
	// Set document vars if needed
	if ( ( context.ownerDocument || context ) !== document ) {
		setDocument( context );
	}
	return contains( context, elem );
};

Sizzle.attr = function( elem, name ) {
	// Set document vars if needed
	if ( ( elem.ownerDocument || elem ) !== document ) {
		setDocument( elem );
	}

	var fn = Expr.attrHandle[ name.toLowerCase() ],
		// Don't get fooled by Object.prototype properties (jQuery #13807)
		val = fn && hasOwn.call( Expr.attrHandle, name.toLowerCase() ) ?
			fn( elem, name, !documentIsHTML ) :
			undefined;

	return val !== undefined ?
		val :
		support.attributes || !documentIsHTML ?
			elem.getAttribute( name ) :
			(val = elem.getAttributeNode(name)) && val.specified ?
				val.value :
				null;
};

Sizzle.escape = function( sel ) {
	return (sel + "").replace( rcssescape, fcssescape );
};

Sizzle.error = function( msg ) {
	throw new Error( "Syntax error, unrecognized expression: " + msg );
};

/**
 * Document sorting and removing duplicates
 * @param {ArrayLike} results
 */
Sizzle.uniqueSort = function( results ) {
	var elem,
		duplicates = [],
		j = 0,
		i = 0;

	// Unless we *know* we can detect duplicates, assume their presence
	hasDuplicate = !support.detectDuplicates;
	sortInput = !support.sortStable && results.slice( 0 );
	results.sort( sortOrder );

	if ( hasDuplicate ) {
		while ( (elem = results[i++]) ) {
			if ( elem === results[ i ] ) {
				j = duplicates.push( i );
			}
		}
		while ( j-- ) {
			results.splice( duplicates[ j ], 1 );
		}
	}

	// Clear input after sorting to release objects
	// See https://github.com/jquery/sizzle/pull/225
	sortInput = null;

	return results;
};

/**
 * Utility function for retrieving the text value of an array of DOM nodes
 * @param {Array|Element} elem
 */
getText = Sizzle.getText = function( elem ) {
	var node,
		ret = "",
		i = 0,
		nodeType = elem.nodeType;

	if ( !nodeType ) {
		// If no nodeType, this is expected to be an array
		while ( (node = elem[i++]) ) {
			// Do not traverse comment nodes
			ret += getText( node );
		}
	} else if ( nodeType === 1 || nodeType === 9 || nodeType === 11 ) {
		// Use textContent for elements
		// innerText usage removed for consistency of new lines (jQuery #11153)
		if ( typeof elem.textContent === "string" ) {
			return elem.textContent;
		} else {
			// Traverse its children
			for ( elem = elem.firstChild; elem; elem = elem.nextSibling ) {
				ret += getText( elem );
			}
		}
	} else if ( nodeType === 3 || nodeType === 4 ) {
		return elem.nodeValue;
	}
	// Do not include comment or processing instruction nodes

	return ret;
};

Expr = Sizzle.selectors = {

	// Can be adjusted by the user
	cacheLength: 50,

	createPseudo: markFunction,

	match: matchExpr,

	attrHandle: {},

	find: {},

	relative: {
		">": { dir: "parentNode", first: true },
		" ": { dir: "parentNode" },
		"+": { dir: "previousSibling", first: true },
		"~": { dir: "previousSibling" }
	},

	preFilter: {
		"ATTR": function( match ) {
			match[1] = match[1].replace( runescape, funescape );

			// Move the given value to match[3] whether quoted or unquoted
			match[3] = ( match[3] || match[4] || match[5] || "" ).replace( runescape, funescape );

			if ( match[2] === "~=" ) {
				match[3] = " " + match[3] + " ";
			}

			return match.slice( 0, 4 );
		},

		"CHILD": function( match ) {
			/* matches from matchExpr["CHILD"]
				1 type (only|nth|...)
				2 what (child|of-type)
				3 argument (even|odd|\d*|\d*n([+-]\d+)?|...)
				4 xn-component of xn+y argument ([+-]?\d*n|)
				5 sign of xn-component
				6 x of xn-component
				7 sign of y-component
				8 y of y-component
			*/
			match[1] = match[1].toLowerCase();

			if ( match[1].slice( 0, 3 ) === "nth" ) {
				// nth-* requires argument
				if ( !match[3] ) {
					Sizzle.error( match[0] );
				}

				// numeric x and y parameters for Expr.filter.CHILD
				// remember that false/true cast respectively to 0/1
				match[4] = +( match[4] ? match[5] + (match[6] || 1) : 2 * ( match[3] === "even" || match[3] === "odd" ) );
				match[5] = +( ( match[7] + match[8] ) || match[3] === "odd" );

			// other types prohibit arguments
			} else if ( match[3] ) {
				Sizzle.error( match[0] );
			}

			return match;
		},

		"PSEUDO": function( match ) {
			var excess,
				unquoted = !match[6] && match[2];

			if ( matchExpr["CHILD"].test( match[0] ) ) {
				return null;
			}

			// Accept quoted arguments as-is
			if ( match[3] ) {
				match[2] = match[4] || match[5] || "";

			// Strip excess characters from unquoted arguments
			} else if ( unquoted && rpseudo.test( unquoted ) &&
				// Get excess from tokenize (recursively)
				(excess = tokenize( unquoted, true )) &&
				// advance to the next closing parenthesis
				(excess = unquoted.indexOf( ")", unquoted.length - excess ) - unquoted.length) ) {

				// excess is a negative index
				match[0] = match[0].slice( 0, excess );
				match[2] = unquoted.slice( 0, excess );
			}

			// Return only captures needed by the pseudo filter method (type and argument)
			return match.slice( 0, 3 );
		}
	},

	filter: {

		"TAG": function( nodeNameSelector ) {
			var nodeName = nodeNameSelector.replace( runescape, funescape ).toLowerCase();
			return nodeNameSelector === "*" ?
				function() { return true; } :
				function( elem ) {
					return elem.nodeName && elem.nodeName.toLowerCase() === nodeName;
				};
		},

		"CLASS": function( className ) {
			var pattern = classCache[ className + " " ];

			return pattern ||
				(pattern = new RegExp( "(^|" + whitespace + ")" + className + "(" + whitespace + "|$)" )) &&
				classCache( className, function( elem ) {
					return pattern.test( typeof elem.className === "string" && elem.className || typeof elem.getAttribute !== "undefined" && elem.getAttribute("class") || "" );
				});
		},

		"ATTR": function( name, operator, check ) {
			return function( elem ) {
				var result = Sizzle.attr( elem, name );

				if ( result == null ) {
					return operator === "!=";
				}
				if ( !operator ) {
					return true;
				}

				result += "";

				return operator === "=" ? result === check :
					operator === "!=" ? result !== check :
					operator === "^=" ? check && result.indexOf( check ) === 0 :
					operator === "*=" ? check && result.indexOf( check ) > -1 :
					operator === "$=" ? check && result.slice( -check.length ) === check :
					operator === "~=" ? ( " " + result.replace( rwhitespace, " " ) + " " ).indexOf( check ) > -1 :
					operator === "|=" ? result === check || result.slice( 0, check.length + 1 ) === check + "-" :
					false;
			};
		},

		"CHILD": function( type, what, argument, first, last ) {
			var simple = type.slice( 0, 3 ) !== "nth",
				forward = type.slice( -4 ) !== "last",
				ofType = what === "of-type";

			return first === 1 && last === 0 ?

				// Shortcut for :nth-*(n)
				function( elem ) {
					return !!elem.parentNode;
				} :

				function( elem, context, xml ) {
					var cache, uniqueCache, outerCache, node, nodeIndex, start,
						dir = simple !== forward ? "nextSibling" : "previousSibling",
						parent = elem.parentNode,
						name = ofType && elem.nodeName.toLowerCase(),
						useCache = !xml && !ofType,
						diff = false;

					if ( parent ) {

						// :(first|last|only)-(child|of-type)
						if ( simple ) {
							while ( dir ) {
								node = elem;
								while ( (node = node[ dir ]) ) {
									if ( ofType ?
										node.nodeName.toLowerCase() === name :
										node.nodeType === 1 ) {

										return false;
									}
								}
								// Reverse direction for :only-* (if we haven't yet done so)
								start = dir = type === "only" && !start && "nextSibling";
							}
							return true;
						}

						start = [ forward ? parent.firstChild : parent.lastChild ];

						// non-xml :nth-child(...) stores cache data on `parent`
						if ( forward && useCache ) {

							// Seek `elem` from a previously-cached index

							// ...in a gzip-friendly way
							node = parent;
							outerCache = node[ expando ] || (node[ expando ] = {});

							// Support: IE <9 only
							// Defend against cloned attroperties (jQuery gh-1709)
							uniqueCache = outerCache[ node.uniqueID ] ||
								(outerCache[ node.uniqueID ] = {});

							cache = uniqueCache[ type ] || [];
							nodeIndex = cache[ 0 ] === dirruns && cache[ 1 ];
							diff = nodeIndex && cache[ 2 ];
							node = nodeIndex && parent.childNodes[ nodeIndex ];

							while ( (node = ++nodeIndex && node && node[ dir ] ||

								// Fallback to seeking `elem` from the start
								(diff = nodeIndex = 0) || start.pop()) ) {

								// When found, cache indexes on `parent` and break
								if ( node.nodeType === 1 && ++diff && node === elem ) {
									uniqueCache[ type ] = [ dirruns, nodeIndex, diff ];
									break;
								}
							}

						} else {
							// Use previously-cached element index if available
							if ( useCache ) {
								// ...in a gzip-friendly way
								node = elem;
								outerCache = node[ expando ] || (node[ expando ] = {});

								// Support: IE <9 only
								// Defend against cloned attroperties (jQuery gh-1709)
								uniqueCache = outerCache[ node.uniqueID ] ||
									(outerCache[ node.uniqueID ] = {});

								cache = uniqueCache[ type ] || [];
								nodeIndex = cache[ 0 ] === dirruns && cache[ 1 ];
								diff = nodeIndex;
							}

							// xml :nth-child(...)
							// or :nth-last-child(...) or :nth(-last)?-of-type(...)
							if ( diff === false ) {
								// Use the same loop as above to seek `elem` from the start
								while ( (node = ++nodeIndex && node && node[ dir ] ||
									(diff = nodeIndex = 0) || start.pop()) ) {

									if ( ( ofType ?
										node.nodeName.toLowerCase() === name :
										node.nodeType === 1 ) &&
										++diff ) {

										// Cache the index of each encountered element
										if ( useCache ) {
											outerCache = node[ expando ] || (node[ expando ] = {});

											// Support: IE <9 only
											// Defend against cloned attroperties (jQuery gh-1709)
											uniqueCache = outerCache[ node.uniqueID ] ||
												(outerCache[ node.uniqueID ] = {});

											uniqueCache[ type ] = [ dirruns, diff ];
										}

										if ( node === elem ) {
											break;
										}
									}
								}
							}
						}

						// Incorporate the offset, then check against cycle size
						diff -= last;
						return diff === first || ( diff % first === 0 && diff / first >= 0 );
					}
				};
		},

		"PSEUDO": function( pseudo, argument ) {
			// pseudo-class names are case-insensitive
			// http://www.w3.org/TR/selectors/#pseudo-classes
			// Prioritize by case sensitivity in case custom pseudos are added with uppercase letters
			// Remember that setFilters inherits from pseudos
			var args,
				fn = Expr.pseudos[ pseudo ] || Expr.setFilters[ pseudo.toLowerCase() ] ||
					Sizzle.error( "unsupported pseudo: " + pseudo );

			// The user may use createPseudo to indicate that
			// arguments are needed to create the filter function
			// just as Sizzle does
			if ( fn[ expando ] ) {
				return fn( argument );
			}

			// But maintain support for old signatures
			if ( fn.length > 1 ) {
				args = [ pseudo, pseudo, "", argument ];
				return Expr.setFilters.hasOwnProperty( pseudo.toLowerCase() ) ?
					markFunction(function( seed, matches ) {
						var idx,
							matched = fn( seed, argument ),
							i = matched.length;
						while ( i-- ) {
							idx = indexOf( seed, matched[i] );
							seed[ idx ] = !( matches[ idx ] = matched[i] );
						}
					}) :
					function( elem ) {
						return fn( elem, 0, args );
					};
			}

			return fn;
		}
	},

	pseudos: {
		// Potentially complex pseudos
		"not": markFunction(function( selector ) {
			// Trim the selector passed to compile
			// to avoid treating leading and trailing
			// spaces as combinators
			var input = [],
				results = [],
				matcher = compile( selector.replace( rtrim, "$1" ) );

			return matcher[ expando ] ?
				markFunction(function( seed, matches, context, xml ) {
					var elem,
						unmatched = matcher( seed, null, xml, [] ),
						i = seed.length;

					// Match elements unmatched by `matcher`
					while ( i-- ) {
						if ( (elem = unmatched[i]) ) {
							seed[i] = !(matches[i] = elem);
						}
					}
				}) :
				function( elem, context, xml ) {
					input[0] = elem;
					matcher( input, null, xml, results );
					// Don't keep the element (issue #299)
					input[0] = null;
					return !results.pop();
				};
		}),

		"has": markFunction(function( selector ) {
			return function( elem ) {
				return Sizzle( selector, elem ).length > 0;
			};
		}),

		"contains": markFunction(function( text ) {
			text = text.replace( runescape, funescape );
			return function( elem ) {
				return ( elem.textContent || elem.innerText || getText( elem ) ).indexOf( text ) > -1;
			};
		}),

		// "Whether an element is represented by a :lang() selector
		// is based solely on the element's language value
		// being equal to the identifier C,
		// or beginning with the identifier C immediately followed by "-".
		// The matching of C against the element's language value is performed case-insensitively.
		// The identifier C does not have to be a valid language name."
		// http://www.w3.org/TR/selectors/#lang-pseudo
		"lang": markFunction( function( lang ) {
			// lang value must be a valid identifier
			if ( !ridentifier.test(lang || "") ) {
				Sizzle.error( "unsupported lang: " + lang );
			}
			lang = lang.replace( runescape, funescape ).toLowerCase();
			return function( elem ) {
				var elemLang;
				do {
					if ( (elemLang = documentIsHTML ?
						elem.lang :
						elem.getAttribute("xml:lang") || elem.getAttribute("lang")) ) {

						elemLang = elemLang.toLowerCase();
						return elemLang === lang || elemLang.indexOf( lang + "-" ) === 0;
					}
				} while ( (elem = elem.parentNode) && elem.nodeType === 1 );
				return false;
			};
		}),

		// Miscellaneous
		"target": function( elem ) {
			var hash = window.location && window.location.hash;
			return hash && hash.slice( 1 ) === elem.id;
		},

		"root": function( elem ) {
			return elem === docElem;
		},

		"focus": function( elem ) {
			return elem === document.activeElement && (!document.hasFocus || document.hasFocus()) && !!(elem.type || elem.href || ~elem.tabIndex);
		},

		// Boolean properties
		"enabled": createDisabledPseudo( false ),
		"disabled": createDisabledPseudo( true ),

		"checked": function( elem ) {
			// In CSS3, :checked should return both checked and selected elements
			// http://www.w3.org/TR/2011/REC-css3-selectors-20110929/#checked
			var nodeName = elem.nodeName.toLowerCase();
			return (nodeName === "input" && !!elem.checked) || (nodeName === "option" && !!elem.selected);
		},

		"selected": function( elem ) {
			// Accessing this property makes selected-by-default
			// options in Safari work properly
			if ( elem.parentNode ) {
				elem.parentNode.selectedIndex;
			}

			return elem.selected === true;
		},

		// Contents
		"empty": function( elem ) {
			// http://www.w3.org/TR/selectors/#empty-pseudo
			// :empty is negated by element (1) or content nodes (text: 3; cdata: 4; entity ref: 5),
			//   but not by others (comment: 8; processing instruction: 7; etc.)
			// nodeType < 6 works because attributes (2) do not appear as children
			for ( elem = elem.firstChild; elem; elem = elem.nextSibling ) {
				if ( elem.nodeType < 6 ) {
					return false;
				}
			}
			return true;
		},

		"parent": function( elem ) {
			return !Expr.pseudos["empty"]( elem );
		},

		// Element/input types
		"header": function( elem ) {
			return rheader.test( elem.nodeName );
		},

		"input": function( elem ) {
			return rinputs.test( elem.nodeName );
		},

		"button": function( elem ) {
			var name = elem.nodeName.toLowerCase();
			return name === "input" && elem.type === "button" || name === "button";
		},

		"text": function( elem ) {
			var attr;
			return elem.nodeName.toLowerCase() === "input" &&
				elem.type === "text" &&

				// Support: IE<8
				// New HTML5 attribute values (e.g., "search") appear with elem.type === "text"
				( (attr = elem.getAttribute("type")) == null || attr.toLowerCase() === "text" );
		},

		// Position-in-collection
		"first": createPositionalPseudo(function() {
			return [ 0 ];
		}),

		"last": createPositionalPseudo(function( matchIndexes, length ) {
			return [ length - 1 ];
		}),

		"eq": createPositionalPseudo(function( matchIndexes, length, argument ) {
			return [ argument < 0 ? argument + length : argument ];
		}),

		"even": createPositionalPseudo(function( matchIndexes, length ) {
			var i = 0;
			for ( ; i < length; i += 2 ) {
				matchIndexes.push( i );
			}
			return matchIndexes;
		}),

		"odd": createPositionalPseudo(function( matchIndexes, length ) {
			var i = 1;
			for ( ; i < length; i += 2 ) {
				matchIndexes.push( i );
			}
			return matchIndexes;
		}),

		"lt": createPositionalPseudo(function( matchIndexes, length, argument ) {
			var i = argument < 0 ? argument + length : argument;
			for ( ; --i >= 0; ) {
				matchIndexes.push( i );
			}
			return matchIndexes;
		}),

		"gt": createPositionalPseudo(function( matchIndexes, length, argument ) {
			var i = argument < 0 ? argument + length : argument;
			for ( ; ++i < length; ) {
				matchIndexes.push( i );
			}
			return matchIndexes;
		})
	}
};

Expr.pseudos["nth"] = Expr.pseudos["eq"];

// Add button/input type pseudos
for ( i in { radio: true, checkbox: true, file: true, password: true, image: true } ) {
	Expr.pseudos[ i ] = createInputPseudo( i );
}
for ( i in { submit: true, reset: true } ) {
	Expr.pseudos[ i ] = createButtonPseudo( i );
}

// Easy API for creating new setFilters
function setFilters() {}
setFilters.prototype = Expr.filters = Expr.pseudos;
Expr.setFilters = new setFilters();

tokenize = Sizzle.tokenize = function( selector, parseOnly ) {
	var matched, match, tokens, type,
		soFar, groups, preFilters,
		cached = tokenCache[ selector + " " ];

	if ( cached ) {
		return parseOnly ? 0 : cached.slice( 0 );
	}

	soFar = selector;
	groups = [];
	preFilters = Expr.preFilter;

	while ( soFar ) {

		// Comma and first run
		if ( !matched || (match = rcomma.exec( soFar )) ) {
			if ( match ) {
				// Don't consume trailing commas as valid
				soFar = soFar.slice( match[0].length ) || soFar;
			}
			groups.push( (tokens = []) );
		}

		matched = false;

		// Combinators
		if ( (match = rcombinators.exec( soFar )) ) {
			matched = match.shift();
			tokens.push({
				value: matched,
				// Cast descendant combinators to space
				type: match[0].replace( rtrim, " " )
			});
			soFar = soFar.slice( matched.length );
		}

		// Filters
		for ( type in Expr.filter ) {
			if ( (match = matchExpr[ type ].exec( soFar )) && (!preFilters[ type ] ||
				(match = preFilters[ type ]( match ))) ) {
				matched = match.shift();
				tokens.push({
					value: matched,
					type: type,
					matches: match
				});
				soFar = soFar.slice( matched.length );
			}
		}

		if ( !matched ) {
			break;
		}
	}

	// Return the length of the invalid excess
	// if we're just parsing
	// Otherwise, throw an error or return tokens
	return parseOnly ?
		soFar.length :
		soFar ?
			Sizzle.error( selector ) :
			// Cache the tokens
			tokenCache( selector, groups ).slice( 0 );
};

function toSelector( tokens ) {
	var i = 0,
		len = tokens.length,
		selector = "";
	for ( ; i < len; i++ ) {
		selector += tokens[i].value;
	}
	return selector;
}

function addCombinator( matcher, combinator, base ) {
	var dir = combinator.dir,
		skip = combinator.next,
		key = skip || dir,
		checkNonElements = base && key === "parentNode",
		doneName = done++;

	return combinator.first ?
		// Check against closest ancestor/preceding element
		function( elem, context, xml ) {
			while ( (elem = elem[ dir ]) ) {
				if ( elem.nodeType === 1 || checkNonElements ) {
					return matcher( elem, context, xml );
				}
			}
			return false;
		} :

		// Check against all ancestor/preceding elements
		function( elem, context, xml ) {
			var oldCache, uniqueCache, outerCache,
				newCache = [ dirruns, doneName ];

			// We can't set arbitrary data on XML nodes, so they don't benefit from combinator caching
			if ( xml ) {
				while ( (elem = elem[ dir ]) ) {
					if ( elem.nodeType === 1 || checkNonElements ) {
						if ( matcher( elem, context, xml ) ) {
							return true;
						}
					}
				}
			} else {
				while ( (elem = elem[ dir ]) ) {
					if ( elem.nodeType === 1 || checkNonElements ) {
						outerCache = elem[ expando ] || (elem[ expando ] = {});

						// Support: IE <9 only
						// Defend against cloned attroperties (jQuery gh-1709)
						uniqueCache = outerCache[ elem.uniqueID ] || (outerCache[ elem.uniqueID ] = {});

						if ( skip && skip === elem.nodeName.toLowerCase() ) {
							elem = elem[ dir ] || elem;
						} else if ( (oldCache = uniqueCache[ key ]) &&
							oldCache[ 0 ] === dirruns && oldCache[ 1 ] === doneName ) {

							// Assign to newCache so results back-propagate to previous elements
							return (newCache[ 2 ] = oldCache[ 2 ]);
						} else {
							// Reuse newcache so results back-propagate to previous elements
							uniqueCache[ key ] = newCache;

							// A match means we're done; a fail means we have to keep checking
							if ( (newCache[ 2 ] = matcher( elem, context, xml )) ) {
								return true;
							}
						}
					}
				}
			}
			return false;
		};
}

function elementMatcher( matchers ) {
	return matchers.length > 1 ?
		function( elem, context, xml ) {
			var i = matchers.length;
			while ( i-- ) {
				if ( !matchers[i]( elem, context, xml ) ) {
					return false;
				}
			}
			return true;
		} :
		matchers[0];
}

function multipleContexts( selector, contexts, results ) {
	var i = 0,
		len = contexts.length;
	for ( ; i < len; i++ ) {
		Sizzle( selector, contexts[i], results );
	}
	return results;
}

function condense( unmatched, map, filter, context, xml ) {
	var elem,
		newUnmatched = [],
		i = 0,
		len = unmatched.length,
		mapped = map != null;

	for ( ; i < len; i++ ) {
		if ( (elem = unmatched[i]) ) {
			if ( !filter || filter( elem, context, xml ) ) {
				newUnmatched.push( elem );
				if ( mapped ) {
					map.push( i );
				}
			}
		}
	}

	return newUnmatched;
}

function setMatcher( preFilter, selector, matcher, postFilter, postFinder, postSelector ) {
	if ( postFilter && !postFilter[ expando ] ) {
		postFilter = setMatcher( postFilter );
	}
	if ( postFinder && !postFinder[ expando ] ) {
		postFinder = setMatcher( postFinder, postSelector );
	}
	return markFunction(function( seed, results, context, xml ) {
		var temp, i, elem,
			preMap = [],
			postMap = [],
			preexisting = results.length,

			// Get initial elements from seed or context
			elems = seed || multipleContexts( selector || "*", context.nodeType ? [ context ] : context, [] ),

			// Prefilter to get matcher input, preserving a map for seed-results synchronization
			matcherIn = preFilter && ( seed || !selector ) ?
				condense( elems, preMap, preFilter, context, xml ) :
				elems,

			matcherOut = matcher ?
				// If we have a postFinder, or filtered seed, or non-seed postFilter or preexisting results,
				postFinder || ( seed ? preFilter : preexisting || postFilter ) ?

					// ...intermediate processing is necessary
					[] :

					// ...otherwise use results directly
					results :
				matcherIn;

		// Find primary matches
		if ( matcher ) {
			matcher( matcherIn, matcherOut, context, xml );
		}

		// Apply postFilter
		if ( postFilter ) {
			temp = condense( matcherOut, postMap );
			postFilter( temp, [], context, xml );

			// Un-match failing elements by moving them back to matcherIn
			i = temp.length;
			while ( i-- ) {
				if ( (elem = temp[i]) ) {
					matcherOut[ postMap[i] ] = !(matcherIn[ postMap[i] ] = elem);
				}
			}
		}

		if ( seed ) {
			if ( postFinder || preFilter ) {
				if ( postFinder ) {
					// Get the final matcherOut by condensing this intermediate into postFinder contexts
					temp = [];
					i = matcherOut.length;
					while ( i-- ) {
						if ( (elem = matcherOut[i]) ) {
							// Restore matcherIn since elem is not yet a final match
							temp.push( (matcherIn[i] = elem) );
						}
					}
					postFinder( null, (matcherOut = []), temp, xml );
				}

				// Move matched elements from seed to results to keep them synchronized
				i = matcherOut.length;
				while ( i-- ) {
					if ( (elem = matcherOut[i]) &&
						(temp = postFinder ? indexOf( seed, elem ) : preMap[i]) > -1 ) {

						seed[temp] = !(results[temp] = elem);
					}
				}
			}

		// Add elements to results, through postFinder if defined
		} else {
			matcherOut = condense(
				matcherOut === results ?
					matcherOut.splice( preexisting, matcherOut.length ) :
					matcherOut
			);
			if ( postFinder ) {
				postFinder( null, results, matcherOut, xml );
			} else {
				push.apply( results, matcherOut );
			}
		}
	});
}

function matcherFromTokens( tokens ) {
	var checkContext, matcher, j,
		len = tokens.length,
		leadingRelative = Expr.relative[ tokens[0].type ],
		implicitRelative = leadingRelative || Expr.relative[" "],
		i = leadingRelative ? 1 : 0,

		// The foundational matcher ensures that elements are reachable from top-level context(s)
		matchContext = addCombinator( function( elem ) {
			return elem === checkContext;
		}, implicitRelative, true ),
		matchAnyContext = addCombinator( function( elem ) {
			return indexOf( checkContext, elem ) > -1;
		}, implicitRelative, true ),
		matchers = [ function( elem, context, xml ) {
			var ret = ( !leadingRelative && ( xml || context !== outermostContext ) ) || (
				(checkContext = context).nodeType ?
					matchContext( elem, context, xml ) :
					matchAnyContext( elem, context, xml ) );
			// Avoid hanging onto element (issue #299)
			checkContext = null;
			return ret;
		} ];

	for ( ; i < len; i++ ) {
		if ( (matcher = Expr.relative[ tokens[i].type ]) ) {
			matchers = [ addCombinator(elementMatcher( matchers ), matcher) ];
		} else {
			matcher = Expr.filter[ tokens[i].type ].apply( null, tokens[i].matches );

			// Return special upon seeing a positional matcher
			if ( matcher[ expando ] ) {
				// Find the next relative operator (if any) for proper handling
				j = ++i;
				for ( ; j < len; j++ ) {
					if ( Expr.relative[ tokens[j].type ] ) {
						break;
					}
				}
				return setMatcher(
					i > 1 && elementMatcher( matchers ),
					i > 1 && toSelector(
						// If the preceding token was a descendant combinator, insert an implicit any-element `*`
						tokens.slice( 0, i - 1 ).concat({ value: tokens[ i - 2 ].type === " " ? "*" : "" })
					).replace( rtrim, "$1" ),
					matcher,
					i < j && matcherFromTokens( tokens.slice( i, j ) ),
					j < len && matcherFromTokens( (tokens = tokens.slice( j )) ),
					j < len && toSelector( tokens )
				);
			}
			matchers.push( matcher );
		}
	}

	return elementMatcher( matchers );
}

function matcherFromGroupMatchers( elementMatchers, setMatchers ) {
	var bySet = setMatchers.length > 0,
		byElement = elementMatchers.length > 0,
		superMatcher = function( seed, context, xml, results, outermost ) {
			var elem, j, matcher,
				matchedCount = 0,
				i = "0",
				unmatched = seed && [],
				setMatched = [],
				contextBackup = outermostContext,
				// We must always have either seed elements or outermost context
				elems = seed || byElement && Expr.find["TAG"]( "*", outermost ),
				// Use integer dirruns iff this is the outermost matcher
				dirrunsUnique = (dirruns += contextBackup == null ? 1 : Math.random() || 0.1),
				len = elems.length;

			if ( outermost ) {
				outermostContext = context === document || context || outermost;
			}

			// Add elements passing elementMatchers directly to results
			// Support: IE<9, Safari
			// Tolerate NodeList properties (IE: "length"; Safari: <number>) matching elements by id
			for ( ; i !== len && (elem = elems[i]) != null; i++ ) {
				if ( byElement && elem ) {
					j = 0;
					if ( !context && elem.ownerDocument !== document ) {
						setDocument( elem );
						xml = !documentIsHTML;
					}
					while ( (matcher = elementMatchers[j++]) ) {
						if ( matcher( elem, context || document, xml) ) {
							results.push( elem );
							break;
						}
					}
					if ( outermost ) {
						dirruns = dirrunsUnique;
					}
				}

				// Track unmatched elements for set filters
				if ( bySet ) {
					// They will have gone through all possible matchers
					if ( (elem = !matcher && elem) ) {
						matchedCount--;
					}

					// Lengthen the array for every element, matched or not
					if ( seed ) {
						unmatched.push( elem );
					}
				}
			}

			// `i` is now the count of elements visited above, and adding it to `matchedCount`
			// makes the latter nonnegative.
			matchedCount += i;

			// Apply set filters to unmatched elements
			// NOTE: This can be skipped if there are no unmatched elements (i.e., `matchedCount`
			// equals `i`), unless we didn't visit _any_ elements in the above loop because we have
			// no element matchers and no seed.
			// Incrementing an initially-string "0" `i` allows `i` to remain a string only in that
			// case, which will result in a "00" `matchedCount` that differs from `i` but is also
			// numerically zero.
			if ( bySet && i !== matchedCount ) {
				j = 0;
				while ( (matcher = setMatchers[j++]) ) {
					matcher( unmatched, setMatched, context, xml );
				}

				if ( seed ) {
					// Reintegrate element matches to eliminate the need for sorting
					if ( matchedCount > 0 ) {
						while ( i-- ) {
							if ( !(unmatched[i] || setMatched[i]) ) {
								setMatched[i] = pop.call( results );
							}
						}
					}

					// Discard index placeholder values to get only actual matches
					setMatched = condense( setMatched );
				}

				// Add matches to results
				push.apply( results, setMatched );

				// Seedless set matches succeeding multiple successful matchers stipulate sorting
				if ( outermost && !seed && setMatched.length > 0 &&
					( matchedCount + setMatchers.length ) > 1 ) {

					Sizzle.uniqueSort( results );
				}
			}

			// Override manipulation of globals by nested matchers
			if ( outermost ) {
				dirruns = dirrunsUnique;
				outermostContext = contextBackup;
			}

			return unmatched;
		};

	return bySet ?
		markFunction( superMatcher ) :
		superMatcher;
}

compile = Sizzle.compile = function( selector, match /* Internal Use Only */ ) {
	var i,
		setMatchers = [],
		elementMatchers = [],
		cached = compilerCache[ selector + " " ];

	if ( !cached ) {
		// Generate a function of recursive functions that can be used to check each element
		if ( !match ) {
			match = tokenize( selector );
		}
		i = match.length;
		while ( i-- ) {
			cached = matcherFromTokens( match[i] );
			if ( cached[ expando ] ) {
				setMatchers.push( cached );
			} else {
				elementMatchers.push( cached );
			}
		}

		// Cache the compiled function
		cached = compilerCache( selector, matcherFromGroupMatchers( elementMatchers, setMatchers ) );

		// Save selector and tokenization
		cached.selector = selector;
	}
	return cached;
};

/**
 * A low-level selection function that works with Sizzle's compiled
 *  selector functions
 * @param {String|Function} selector A selector or a pre-compiled
 *  selector function built with Sizzle.compile
 * @param {Element} context
 * @param {Array} [results]
 * @param {Array} [seed] A set of elements to match against
 */
select = Sizzle.select = function( selector, context, results, seed ) {
	var i, tokens, token, type, find,
		compiled = typeof selector === "function" && selector,
		match = !seed && tokenize( (selector = compiled.selector || selector) );

	results = results || [];

	// Try to minimize operations if there is only one selector in the list and no seed
	// (the latter of which guarantees us context)
	if ( match.length === 1 ) {

		// Reduce context if the leading compound selector is an ID
		tokens = match[0] = match[0].slice( 0 );
		if ( tokens.length > 2 && (token = tokens[0]).type === "ID" &&
				context.nodeType === 9 && documentIsHTML && Expr.relative[ tokens[1].type ] ) {

			context = ( Expr.find["ID"]( token.matches[0].replace(runescape, funescape), context ) || [] )[0];
			if ( !context ) {
				return results;

			// Precompiled matchers will still verify ancestry, so step up a level
			} else if ( compiled ) {
				context = context.parentNode;
			}

			selector = selector.slice( tokens.shift().value.length );
		}

		// Fetch a seed set for right-to-left matching
		i = matchExpr["needsContext"].test( selector ) ? 0 : tokens.length;
		while ( i-- ) {
			token = tokens[i];

			// Abort if we hit a combinator
			if ( Expr.relative[ (type = token.type) ] ) {
				break;
			}
			if ( (find = Expr.find[ type ]) ) {
				// Search, expanding context for leading sibling combinators
				if ( (seed = find(
					token.matches[0].replace( runescape, funescape ),
					rsibling.test( tokens[0].type ) && testContext( context.parentNode ) || context
				)) ) {

					// If seed is empty or no tokens remain, we can return early
					tokens.splice( i, 1 );
					selector = seed.length && toSelector( tokens );
					if ( !selector ) {
						push.apply( results, seed );
						return results;
					}

					break;
				}
			}
		}
	}

	// Compile and execute a filtering function if one is not provided
	// Provide `match` to avoid retokenization if we modified the selector above
	( compiled || compile( selector, match ) )(
		seed,
		context,
		!documentIsHTML,
		results,
		!context || rsibling.test( selector ) && testContext( context.parentNode ) || context
	);
	return results;
};

// One-time assignments

// Sort stability
support.sortStable = expando.split("").sort( sortOrder ).join("") === expando;

// Support: Chrome 14-35+
// Always assume duplicates if they aren't passed to the comparison function
support.detectDuplicates = !!hasDuplicate;

// Initialize against the default document
setDocument();

// Support: Webkit<537.32 - Safari 6.0.3/Chrome 25 (fixed in Chrome 27)
// Detached nodes confoundingly follow *each other*
support.sortDetached = assert(function( el ) {
	// Should return 1, but returns 4 (following)
	return el.compareDocumentPosition( document.createElement("fieldset") ) & 1;
});

// Support: IE<8
// Prevent attribute/property "interpolation"
// https://msdn.microsoft.com/en-us/library/ms536429%28VS.85%29.aspx
if ( !assert(function( el ) {
	el.innerHTML = "<a href='#'></a>";
	return el.firstChild.getAttribute("href") === "#" ;
}) ) {
	addHandle( "type|href|height|width", function( elem, name, isXML ) {
		if ( !isXML ) {
			return elem.getAttribute( name, name.toLowerCase() === "type" ? 1 : 2 );
		}
	});
}

// Support: IE<9
// Use defaultValue in place of getAttribute("value")
if ( !support.attributes || !assert(function( el ) {
	el.innerHTML = "<input/>";
	el.firstChild.setAttribute( "value", "" );
	return el.firstChild.getAttribute( "value" ) === "";
}) ) {
	addHandle( "value", function( elem, name, isXML ) {
		if ( !isXML && elem.nodeName.toLowerCase() === "input" ) {
			return elem.defaultValue;
		}
	});
}

// Support: IE<9
// Use getAttributeNode to fetch booleans when getAttribute lies
if ( !assert(function( el ) {
	return el.getAttribute("disabled") == null;
}) ) {
	addHandle( booleans, function( elem, name, isXML ) {
		var val;
		if ( !isXML ) {
			return elem[ name ] === true ? name.toLowerCase() :
					(val = elem.getAttributeNode( name )) && val.specified ?
					val.value :
				null;
		}
	});
}

return Sizzle;

})( window );



jQuery.find = Sizzle;
jQuery.expr = Sizzle.selectors;

// Deprecated
jQuery.expr[ ":" ] = jQuery.expr.pseudos;
jQuery.uniqueSort = jQuery.unique = Sizzle.uniqueSort;
jQuery.text = Sizzle.getText;
jQuery.isXMLDoc = Sizzle.isXML;
jQuery.contains = Sizzle.contains;
jQuery.escapeSelector = Sizzle.escape;




var dir = function( elem, dir, until ) {
	var matched = [],
		truncate = until !== undefined;

	while ( ( elem = elem[ dir ] ) && elem.nodeType !== 9 ) {
		if ( elem.nodeType === 1 ) {
			if ( truncate && jQuery( elem ).is( until ) ) {
				break;
			}
			matched.push( elem );
		}
	}
	return matched;
};


var siblings = function( n, elem ) {
	var matched = [];

	for ( ; n; n = n.nextSibling ) {
		if ( n.nodeType === 1 && n !== elem ) {
			matched.push( n );
		}
	}

	return matched;
};


var rneedsContext = jQuery.expr.match.needsContext;



function nodeName( elem, name ) {

  return elem.nodeName && elem.nodeName.toLowerCase() === name.toLowerCase();

};
var rsingleTag = ( /^<([a-z][^\/\0>:\x20\t\r\n\f]*)[\x20\t\r\n\f]*\/?>(?:<\/\1>|)$/i );



// Implement the identical functionality for filter and not
function winnow( elements, qualifier, not ) {
	if ( isFunction( qualifier ) ) {
		return jQuery.grep( elements, function( elem, i ) {
			return !!qualifier.call( elem, i, elem ) !== not;
		} );
	}

	// Single element
	if ( qualifier.nodeType ) {
		return jQuery.grep( elements, function( elem ) {
			return ( elem === qualifier ) !== not;
		} );
	}

	// Arraylike of elements (jQuery, arguments, Array)
	if ( typeof qualifier !== "string" ) {
		return jQuery.grep( elements, function( elem ) {
			return ( indexOf.call( qualifier, elem ) > -1 ) !== not;
		} );
	}

	// Filtered directly for both simple and complex selectors
	return jQuery.filter( qualifier, elements, not );
}

jQuery.filter = function( expr, elems, not ) {
	var elem = elems[ 0 ];

	if ( not ) {
		expr = ":not(" + expr + ")";
	}

	if ( elems.length === 1 && elem.nodeType === 1 ) {
		return jQuery.find.matchesSelector( elem, expr ) ? [ elem ] : [];
	}

	return jQuery.find.matches( expr, jQuery.grep( elems, function( elem ) {
		return elem.nodeType === 1;
	} ) );
};

jQuery.fn.extend( {
	find: function( selector ) {
		var i, ret,
			len = this.length,
			self = this;

		if ( typeof selector !== "string" ) {
			return this.pushStack( jQuery( selector ).filter( function() {
				for ( i = 0; i < len; i++ ) {
					if ( jQuery.contains( self[ i ], this ) ) {
						return true;
					}
				}
			} ) );
		}

		ret = this.pushStack( [] );

		for ( i = 0; i < len; i++ ) {
			jQuery.find( selector, self[ i ], ret );
		}

		return len > 1 ? jQuery.uniqueSort( ret ) : ret;
	},
	filter: function( selector ) {
		return this.pushStack( winnow( this, selector || [], false ) );
	},
	not: function( selector ) {
		return this.pushStack( winnow( this, selector || [], true ) );
	},
	is: function( selector ) {
		return !!winnow(
			this,

			// If this is a positional/relative selector, check membership in the returned set
			// so $("p:first").is("p:last") won't return true for a doc with two "p".
			typeof selector === "string" && rneedsContext.test( selector ) ?
				jQuery( selector ) :
				selector || [],
			false
		).length;
	}
} );


// Initialize a jQuery object


// A central reference to the root jQuery(document)
var rootjQuery,

	// A simple way to check for HTML strings
	// Prioritize #id over <tag> to avoid XSS via location.hash (#9521)
	// Strict HTML recognition (#11290: must start with <)
	// Shortcut simple #id case for speed
	rquickExpr = /^(?:\s*(<[\w\W]+>)[^>]*|#([\w-]+))$/,

	init = jQuery.fn.init = function( selector, context, root ) {
		var match, elem;

		// HANDLE: $(""), $(null), $(undefined), $(false)
		if ( !selector ) {
			return this;
		}

		// Method init() accepts an alternate rootjQuery
		// so migrate can support jQuery.sub (gh-2101)
		root = root || rootjQuery;

		// Handle HTML strings
		if ( typeof selector === "string" ) {
			if ( selector[ 0 ] === "<" &&
				selector[ selector.length - 1 ] === ">" &&
				selector.length >= 3 ) {

				// Assume that strings that start and end with <> are HTML and skip the regex check
				match = [ null, selector, null ];

			} else {
				match = rquickExpr.exec( selector );
			}

			// Match html or make sure no context is specified for #id
			if ( match && ( match[ 1 ] || !context ) ) {

				// HANDLE: $(html) -> $(array)
				if ( match[ 1 ] ) {
					context = context instanceof jQuery ? context[ 0 ] : context;

					// Option to run scripts is true for back-compat
					// Intentionally let the error be thrown if parseHTML is not present
					jQuery.merge( this, jQuery.parseHTML(
						match[ 1 ],
						context && context.nodeType ? context.ownerDocument || context : document,
						true
					) );

					// HANDLE: $(html, props)
					if ( rsingleTag.test( match[ 1 ] ) && jQuery.isPlainObject( context ) ) {
						for ( match in context ) {

							// Properties of context are called as methods if possible
							if ( isFunction( this[ match ] ) ) {
								this[ match ]( context[ match ] );

							// ...and otherwise set as attributes
							} else {
								this.attr( match, context[ match ] );
							}
						}
					}

					return this;

				// HANDLE: $(#id)
				} else {
					elem = document.getElementById( match[ 2 ] );

					if ( elem ) {

						// Inject the element directly into the jQuery object
						this[ 0 ] = elem;
						this.length = 1;
					}
					return this;
				}

			// HANDLE: $(expr, $(...))
			} else if ( !context || context.jquery ) {
				return ( context || root ).find( selector );

			// HANDLE: $(expr, context)
			// (which is just equivalent to: $(context).find(expr)
			} else {
				return this.constructor( context ).find( selector );
			}

		// HANDLE: $(DOMElement)
		} else if ( selector.nodeType ) {
			this[ 0 ] = selector;
			this.length = 1;
			return this;

		// HANDLE: $(function)
		// Shortcut for document ready
		} else if ( isFunction( selector ) ) {
			return root.ready !== undefined ?
				root.ready( selector ) :

				// Execute immediately if ready is not present
				selector( jQuery );
		}

		return jQuery.makeArray( selector, this );
	};

// Give the init function the jQuery prototype for later instantiation
init.prototype = jQuery.fn;

// Initialize central reference
rootjQuery = jQuery( document );


var rparentsprev = /^(?:parents|prev(?:Until|All))/,

	// Methods guaranteed to produce a unique set when starting from a unique set
	guaranteedUnique = {
		children: true,
		contents: true,
		next: true,
		prev: true
	};

jQuery.fn.extend( {
	has: function( target ) {
		var targets = jQuery( target, this ),
			l = targets.length;

		return this.filter( function() {
			var i = 0;
			for ( ; i < l; i++ ) {
				if ( jQuery.contains( this, targets[ i ] ) ) {
					return true;
				}
			}
		} );
	},

	closest: function( selectors, context ) {
		var cur,
			i = 0,
			l = this.length,
			matched = [],
			targets = typeof selectors !== "string" && jQuery( selectors );

		// Positional selectors never match, since there's no _selection_ context
		if ( !rneedsContext.test( selectors ) ) {
			for ( ; i < l; i++ ) {
				for ( cur = this[ i ]; cur && cur !== context; cur = cur.parentNode ) {

					// Always skip document fragments
					if ( cur.nodeType < 11 && ( targets ?
						targets.index( cur ) > -1 :

						// Don't pass non-elements to Sizzle
						cur.nodeType === 1 &&
							jQuery.find.matchesSelector( cur, selectors ) ) ) {

						matched.push( cur );
						break;
					}
				}
			}
		}

		return this.pushStack( matched.length > 1 ? jQuery.uniqueSort( matched ) : matched );
	},

	// Determine the position of an element within the set
	index: function( elem ) {

		// No argument, return index in parent
		if ( !elem ) {
			return ( this[ 0 ] && this[ 0 ].parentNode ) ? this.first().prevAll().length : -1;
		}

		// Index in selector
		if ( typeof elem === "string" ) {
			return indexOf.call( jQuery( elem ), this[ 0 ] );
		}

		// Locate the position of the desired element
		return indexOf.call( this,

			// If it receives a jQuery object, the first element is used
			elem.jquery ? elem[ 0 ] : elem
		);
	},

	add: function( selector, context ) {
		return this.pushStack(
			jQuery.uniqueSort(
				jQuery.merge( this.get(), jQuery( selector, context ) )
			)
		);
	},

	addBack: function( selector ) {
		return this.add( selector == null ?
			this.prevObject : this.prevObject.filter( selector )
		);
	}
} );

function sibling( cur, dir ) {
	while ( ( cur = cur[ dir ] ) && cur.nodeType !== 1 ) {}
	return cur;
}

jQuery.each( {
	parent: function( elem ) {
		var parent = elem.parentNode;
		return parent && parent.nodeType !== 11 ? parent : null;
	},
	parents: function( elem ) {
		return dir( elem, "parentNode" );
	},
	parentsUntil: function( elem, i, until ) {
		return dir( elem, "parentNode", until );
	},
	next: function( elem ) {
		return sibling( elem, "nextSibling" );
	},
	prev: function( elem ) {
		return sibling( elem, "previousSibling" );
	},
	nextAll: function( elem ) {
		return dir( elem, "nextSibling" );
	},
	prevAll: function( elem ) {
		return dir( elem, "previousSibling" );
	},
	nextUntil: function( elem, i, until ) {
		return dir( elem, "nextSibling", until );
	},
	prevUntil: function( elem, i, until ) {
		return dir( elem, "previousSibling", until );
	},
	siblings: function( elem ) {
		return siblings( ( elem.parentNode || {} ).firstChild, elem );
	},
	children: function( elem ) {
		return siblings( elem.firstChild );
	},
	contents: function( elem ) {
        if ( nodeName( elem, "iframe" ) ) {
            return elem.contentDocument;
        }

        // Support: IE 9 - 11 only, iOS 7 only, Android Browser <=4.3 only
        // Treat the template element as a regular one in browsers that
        // don't support it.
        if ( nodeName( elem, "template" ) ) {
            elem = elem.content || elem;
        }

        return jQuery.merge( [], elem.childNodes );
	}
}, function( name, fn ) {
	jQuery.fn[ name ] = function( until, selector ) {
		var matched = jQuery.map( this, fn, until );

		if ( name.slice( -5 ) !== "Until" ) {
			selector = until;
		}

		if ( selector && typeof selector === "string" ) {
			matched = jQuery.filter( selector, matched );
		}

		if ( this.length > 1 ) {

			// Remove duplicates
			if ( !guaranteedUnique[ name ] ) {
				jQuery.uniqueSort( matched );
			}

			// Reverse order for parents* and prev-derivatives
			if ( rparentsprev.test( name ) ) {
				matched.reverse();
			}
		}

		return this.pushStack( matched );
	};
} );
var rnothtmlwhite = ( /[^\x20\t\r\n\f]+/g );



// Convert String-formatted options into Object-formatted ones
function createOptions( options ) {
	var object = {};
	jQuery.each( options.match( rnothtmlwhite ) || [], function( _, flag ) {
		object[ flag ] = true;
	} );
	return object;
}

/*
 * Create a callback list using the following parameters:
 *
 *	options: an optional list of space-separated options that will change how
 *			the callback list behaves or a more traditional option object
 *
 * By default a callback list will act like an event callback list and can be
 * "fired" multiple times.
 *
 * Possible options:
 *
 *	once:			will ensure the callback list can only be fired once (like a Deferred)
 *
 *	memory:			will keep track of previous values and will call any callback added
 *					after the list has been fired right away with the latest "memorized"
 *					values (like a Deferred)
 *
 *	unique:			will ensure a callback can only be added once (no duplicate in the list)
 *
 *	stopOnFalse:	interrupt callings when a callback returns false
 *
 */
jQuery.Callbacks = function( options ) {

	// Convert options from String-formatted to Object-formatted if needed
	// (we check in cache first)
	options = typeof options === "string" ?
		createOptions( options ) :
		jQuery.extend( {}, options );

	var // Flag to know if list is currently firing
		firing,

		// Last fire value for non-forgettable lists
		memory,

		// Flag to know if list was already fired
		fired,

		// Flag to prevent firing
		locked,

		// Actual callback list
		list = [],

		// Queue of execution data for repeatable lists
		queue = [],

		// Index of currently firing callback (modified by add/remove as needed)
		firingIndex = -1,

		// Fire callbacks
		fire = function() {

			// Enforce single-firing
			locked = locked || options.once;

			// Execute callbacks for all pending executions,
			// respecting firingIndex overrides and runtime changes
			fired = firing = true;
			for ( ; queue.length; firingIndex = -1 ) {
				memory = queue.shift();
				while ( ++firingIndex < list.length ) {

					// Run callback and check for early termination
					if ( list[ firingIndex ].apply( memory[ 0 ], memory[ 1 ] ) === false &&
						options.stopOnFalse ) {

						// Jump to end and forget the data so .add doesn't re-fire
						firingIndex = list.length;
						memory = false;
					}
				}
			}

			// Forget the data if we're done with it
			if ( !options.memory ) {
				memory = false;
			}

			firing = false;

			// Clean up if we're done firing for good
			if ( locked ) {

				// Keep an empty list if we have data for future add calls
				if ( memory ) {
					list = [];

				// Otherwise, this object is spent
				} else {
					list = "";
				}
			}
		},

		// Actual Callbacks object
		self = {

			// Add a callback or a collection of callbacks to the list
			add: function() {
				if ( list ) {

					// If we have memory from a past run, we should fire after adding
					if ( memory && !firing ) {
						firingIndex = list.length - 1;
						queue.push( memory );
					}

					( function add( args ) {
						jQuery.each( args, function( _, arg ) {
							if ( isFunction( arg ) ) {
								if ( !options.unique || !self.has( arg ) ) {
									list.push( arg );
								}
							} else if ( arg && arg.length && toType( arg ) !== "string" ) {

								// Inspect recursively
								add( arg );
							}
						} );
					} )( arguments );

					if ( memory && !firing ) {
						fire();
					}
				}
				return this;
			},

			// Remove a callback from the list
			remove: function() {
				jQuery.each( arguments, function( _, arg ) {
					var index;
					while ( ( index = jQuery.inArray( arg, list, index ) ) > -1 ) {
						list.splice( index, 1 );

						// Handle firing indexes
						if ( index <= firingIndex ) {
							firingIndex--;
						}
					}
				} );
				return this;
			},

			// Check if a given callback is in the list.
			// If no argument is given, return whether or not list has callbacks attached.
			has: function( fn ) {
				return fn ?
					jQuery.inArray( fn, list ) > -1 :
					list.length > 0;
			},

			// Remove all callbacks from the list
			empty: function() {
				if ( list ) {
					list = [];
				}
				return this;
			},

			// Disable .fire and .add
			// Abort any current/pending executions
			// Clear all callbacks and values
			disable: function() {
				locked = queue = [];
				list = memory = "";
				return this;
			},
			disabled: function() {
				return !list;
			},

			// Disable .fire
			// Also disable .add unless we have memory (since it would have no effect)
			// Abort any pending executions
			lock: function() {
				locked = queue = [];
				if ( !memory && !firing ) {
					list = memory = "";
				}
				return this;
			},
			locked: function() {
				return !!locked;
			},

			// Call all callbacks with the given context and arguments
			fireWith: function( context, args ) {
				if ( !locked ) {
					args = args || [];
					args = [ context, args.slice ? args.slice() : args ];
					queue.push( args );
					if ( !firing ) {
						fire();
					}
				}
				return this;
			},

			// Call all the callbacks with the given arguments
			fire: function() {
				self.fireWith( this, arguments );
				return this;
			},

			// To know if the callbacks have already been called at least once
			fired: function() {
				return !!fired;
			}
		};

	return self;
};


function Identity( v ) {
	return v;
}
function Thrower( ex ) {
	throw ex;
}

function adoptValue( value, resolve, reject, noValue ) {
	var method;

	try {

		// Check for promise aspect first to privilege synchronous behavior
		if ( value && isFunction( ( method = value.promise ) ) ) {
			method.call( value ).done( resolve ).fail( reject );

		// Other thenables
		} else if ( value && isFunction( ( method = value.then ) ) ) {
			method.call( value, resolve, reject );

		// Other non-thenables
		} else {

			// Control `resolve` arguments by letting Array#slice cast boolean `noValue` to integer:
			// * false: [ value ].slice( 0 ) => resolve( value )
			// * true: [ value ].slice( 1 ) => resolve()
			resolve.apply( undefined, [ value ].slice( noValue ) );
		}

	// For Promises/A+, convert exceptions into rejections
	// Since jQuery.when doesn't unwrap thenables, we can skip the extra checks appearing in
	// Deferred#then to conditionally suppress rejection.
	} catch ( value ) {

		// Support: Android 4.0 only
		// Strict mode functions invoked without .call/.apply get global-object context
		reject.apply( undefined, [ value ] );
	}
}

jQuery.extend( {

	Deferred: function( func ) {
		var tuples = [

				// action, add listener, callbacks,
				// ... .then handlers, argument index, [final state]
				[ "notify", "progress", jQuery.Callbacks( "memory" ),
					jQuery.Callbacks( "memory" ), 2 ],
				[ "resolve", "done", jQuery.Callbacks( "once memory" ),
					jQuery.Callbacks( "once memory" ), 0, "resolved" ],
				[ "reject", "fail", jQuery.Callbacks( "once memory" ),
					jQuery.Callbacks( "once memory" ), 1, "rejected" ]
			],
			state = "pending",
			promise = {
				state: function() {
					return state;
				},
				always: function() {
					deferred.done( arguments ).fail( arguments );
					return this;
				},
				"catch": function( fn ) {
					return promise.then( null, fn );
				},

				// Keep pipe for back-compat
				pipe: function( /* fnDone, fnFail, fnProgress */ ) {
					var fns = arguments;

					return jQuery.Deferred( function( newDefer ) {
						jQuery.each( tuples, function( i, tuple ) {

							// Map tuples (progress, done, fail) to arguments (done, fail, progress)
							var fn = isFunction( fns[ tuple[ 4 ] ] ) && fns[ tuple[ 4 ] ];

							// deferred.progress(function() { bind to newDefer or newDefer.notify })
							// deferred.done(function() { bind to newDefer or newDefer.resolve })
							// deferred.fail(function() { bind to newDefer or newDefer.reject })
							deferred[ tuple[ 1 ] ]( function() {
								var returned = fn && fn.apply( this, arguments );
								if ( returned && isFunction( returned.promise ) ) {
									returned.promise()
										.progress( newDefer.notify )
										.done( newDefer.resolve )
										.fail( newDefer.reject );
								} else {
									newDefer[ tuple[ 0 ] + "With" ](
										this,
										fn ? [ returned ] : arguments
									);
								}
							} );
						} );
						fns = null;
					} ).promise();
				},
				then: function( onFulfilled, onRejected, onProgress ) {
					var maxDepth = 0;
					function resolve( depth, deferred, handler, special ) {
						return function() {
							var that = this,
								args = arguments,
								mightThrow = function() {
									var returned, then;

									// Support: Promises/A+ section 2.3.3.3.3
									// https://promisesaplus.com/#point-59
									// Ignore double-resolution attempts
									if ( depth < maxDepth ) {
										return;
									}

									returned = handler.apply( that, args );

									// Support: Promises/A+ section 2.3.1
									// https://promisesaplus.com/#point-48
									if ( returned === deferred.promise() ) {
										throw new TypeError( "Thenable self-resolution" );
									}

									// Support: Promises/A+ sections 2.3.3.1, 3.5
									// https://promisesaplus.com/#point-54
									// https://promisesaplus.com/#point-75
									// Retrieve `then` only once
									then = returned &&

										// Support: Promises/A+ section 2.3.4
										// https://promisesaplus.com/#point-64
										// Only check objects and functions for thenability
										( typeof returned === "object" ||
											typeof returned === "function" ) &&
										returned.then;

									// Handle a returned thenable
									if ( isFunction( then ) ) {

										// Special processors (notify) just wait for resolution
										if ( special ) {
											then.call(
												returned,
												resolve( maxDepth, deferred, Identity, special ),
												resolve( maxDepth, deferred, Thrower, special )
											);

										// Normal processors (resolve) also hook into progress
										} else {

											// ...and disregard older resolution values
											maxDepth++;

											then.call(
												returned,
												resolve( maxDepth, deferred, Identity, special ),
												resolve( maxDepth, deferred, Thrower, special ),
												resolve( maxDepth, deferred, Identity,
													deferred.notifyWith )
											);
										}

									// Handle all other returned values
									} else {

										// Only substitute handlers pass on context
										// and multiple values (non-spec behavior)
										if ( handler !== Identity ) {
											that = undefined;
											args = [ returned ];
										}

										// Process the value(s)
										// Default process is resolve
										( special || deferred.resolveWith )( that, args );
									}
								},

								// Only normal processors (resolve) catch and reject exceptions
								process = special ?
									mightThrow :
									function() {
										try {
											mightThrow();
										} catch ( e ) {

											if ( jQuery.Deferred.exceptionHook ) {
												jQuery.Deferred.exceptionHook( e,
													process.stackTrace );
											}

											// Support: Promises/A+ section 2.3.3.3.4.1
											// https://promisesaplus.com/#point-61
											// Ignore post-resolution exceptions
											if ( depth + 1 >= maxDepth ) {

												// Only substitute handlers pass on context
												// and multiple values (non-spec behavior)
												if ( handler !== Thrower ) {
													that = undefined;
													args = [ e ];
												}

												deferred.rejectWith( that, args );
											}
										}
									};

							// Support: Promises/A+ section 2.3.3.3.1
							// https://promisesaplus.com/#point-57
							// Re-resolve promises immediately to dodge false rejection from
							// subsequent errors
							if ( depth ) {
								process();
							} else {

								// Call an optional hook to record the stack, in case of exception
								// since it's otherwise lost when execution goes async
								if ( jQuery.Deferred.getStackHook ) {
									process.stackTrace = jQuery.Deferred.getStackHook();
								}
								window.setTimeout( process );
							}
						};
					}

					return jQuery.Deferred( function( newDefer ) {

						// progress_handlers.add( ... )
						tuples[ 0 ][ 3 ].add(
							resolve(
								0,
								newDefer,
								isFunction( onProgress ) ?
									onProgress :
									Identity,
								newDefer.notifyWith
							)
						);

						// fulfilled_handlers.add( ... )
						tuples[ 1 ][ 3 ].add(
							resolve(
								0,
								newDefer,
								isFunction( onFulfilled ) ?
									onFulfilled :
									Identity
							)
						);

						// rejected_handlers.add( ... )
						tuples[ 2 ][ 3 ].add(
							resolve(
								0,
								newDefer,
								isFunction( onRejected ) ?
									onRejected :
									Thrower
							)
						);
					} ).promise();
				},

				// Get a promise for this deferred
				// If obj is provided, the promise aspect is added to the object
				promise: function( obj ) {
					return obj != null ? jQuery.extend( obj, promise ) : promise;
				}
			},
			deferred = {};

		// Add list-specific methods
		jQuery.each( tuples, function( i, tuple ) {
			var list = tuple[ 2 ],
				stateString = tuple[ 5 ];

			// promise.progress = list.add
			// promise.done = list.add
			// promise.fail = list.add
			promise[ tuple[ 1 ] ] = list.add;

			// Handle state
			if ( stateString ) {
				list.add(
					function() {

						// state = "resolved" (i.e., fulfilled)
						// state = "rejected"
						state = stateString;
					},

					// rejected_callbacks.disable
					// fulfilled_callbacks.disable
					tuples[ 3 - i ][ 2 ].disable,

					// rejected_handlers.disable
					// fulfilled_handlers.disable
					tuples[ 3 - i ][ 3 ].disable,

					// progress_callbacks.lock
					tuples[ 0 ][ 2 ].lock,

					// progress_handlers.lock
					tuples[ 0 ][ 3 ].lock
				);
			}

			// progress_handlers.fire
			// fulfilled_handlers.fire
			// rejected_handlers.fire
			list.add( tuple[ 3 ].fire );

			// deferred.notify = function() { deferred.notifyWith(...) }
			// deferred.resolve = function() { deferred.resolveWith(...) }
			// deferred.reject = function() { deferred.rejectWith(...) }
			deferred[ tuple[ 0 ] ] = function() {
				deferred[ tuple[ 0 ] + "With" ]( this === deferred ? undefined : this, arguments );
				return this;
			};

			// deferred.notifyWith = list.fireWith
			// deferred.resolveWith = list.fireWith
			// deferred.rejectWith = list.fireWith
			deferred[ tuple[ 0 ] + "With" ] = list.fireWith;
		} );

		// Make the deferred a promise
		promise.promise( deferred );

		// Call given func if any
		if ( func ) {
			func.call( deferred, deferred );
		}

		// All done!
		return deferred;
	},

	// Deferred helper
	when: function( singleValue ) {
		var

			// count of uncompleted subordinates
			remaining = arguments.length,

			// count of unprocessed arguments
			i = remaining,

			// subordinate fulfillment data
			resolveContexts = Array( i ),
			resolveValues = slice.call( arguments ),

			// the master Deferred
			master = jQuery.Deferred(),

			// subordinate callback factory
			updateFunc = function( i ) {
				return function( value ) {
					resolveContexts[ i ] = this;
					resolveValues[ i ] = arguments.length > 1 ? slice.call( arguments ) : value;
					if ( !( --remaining ) ) {
						master.resolveWith( resolveContexts, resolveValues );
					}
				};
			};

		// Single- and empty arguments are adopted like Promise.resolve
		if ( remaining <= 1 ) {
			adoptValue( singleValue, master.done( updateFunc( i ) ).resolve, master.reject,
				!remaining );

			// Use .then() to unwrap secondary thenables (cf. gh-3000)
			if ( master.state() === "pending" ||
				isFunction( resolveValues[ i ] && resolveValues[ i ].then ) ) {

				return master.then();
			}
		}

		// Multiple arguments are aggregated like Promise.all array elements
		while ( i-- ) {
			adoptValue( resolveValues[ i ], updateFunc( i ), master.reject );
		}

		return master.promise();
	}
} );


// These usually indicate a programmer mistake during development,
// warn about them ASAP rather than swallowing them by default.
var rerrorNames = /^(Eval|Internal|Range|Reference|Syntax|Type|URI)Error$/;

jQuery.Deferred.exceptionHook = function( error, stack ) {

	// Support: IE 8 - 9 only
	// Console exists when dev tools are open, which can happen at any time
	if ( window.console && window.console.warn && error && rerrorNames.test( error.name ) ) {
		window.console.warn( "jQuery.Deferred exception: " + error.message, error.stack, stack );
	}
};




jQuery.readyException = function( error ) {
	window.setTimeout( function() {
		throw error;
	} );
};




// The deferred used on DOM ready
var readyList = jQuery.Deferred();

jQuery.fn.ready = function( fn ) {

	readyList
		.then( fn )

		// Wrap jQuery.readyException in a function so that the lookup
		// happens at the time of error handling instead of callback
		// registration.
		.catch( function( error ) {
			jQuery.readyException( error );
		} );

	return this;
};

jQuery.extend( {

	// Is the DOM ready to be used? Set to true once it occurs.
	isReady: false,

	// A counter to track how many items to wait for before
	// the ready event fires. See #6781
	readyWait: 1,

	// Handle when the DOM is ready
	ready: function( wait ) {

		// Abort if there are pending holds or we're already ready
		if ( wait === true ? --jQuery.readyWait : jQuery.isReady ) {
			return;
		}

		// Remember that the DOM is ready
		jQuery.isReady = true;

		// If a normal DOM Ready event fired, decrement, and wait if need be
		if ( wait !== true && --jQuery.readyWait > 0 ) {
			return;
		}

		// If there are functions bound, to execute
		readyList.resolveWith( document, [ jQuery ] );
	}
} );

jQuery.ready.then = readyList.then;

// The ready event handler and self cleanup method
function completed() {
	document.removeEventListener( "DOMContentLoaded", completed );
	window.removeEventListener( "load", completed );
	jQuery.ready();
}

// Catch cases where $(document).ready() is called
// after the browser event has already occurred.
// Support: IE <=9 - 10 only
// Older IE sometimes signals "interactive" too soon
if ( document.readyState === "complete" ||
	( document.readyState !== "loading" && !document.documentElement.doScroll ) ) {

	// Handle it asynchronously to allow scripts the opportunity to delay ready
	window.setTimeout( jQuery.ready );

} else {

	// Use the handy event callback
	document.addEventListener( "DOMContentLoaded", completed );

	// A fallback to window.onload, that will always work
	window.addEventListener( "load", completed );
}




// Multifunctional method to get and set values of a collection
// The value/s can optionally be executed if it's a function
var access = function( elems, fn, key, value, chainable, emptyGet, raw ) {
	var i = 0,
		len = elems.length,
		bulk = key == null;

	// Sets many values
	if ( toType( key ) === "object" ) {
		chainable = true;
		for ( i in key ) {
			access( elems, fn, i, key[ i ], true, emptyGet, raw );
		}

	// Sets one value
	} else if ( value !== undefined ) {
		chainable = true;

		if ( !isFunction( value ) ) {
			raw = true;
		}

		if ( bulk ) {

			// Bulk operations run against the entire set
			if ( raw ) {
				fn.call( elems, value );
				fn = null;

			// ...except when executing function values
			} else {
				bulk = fn;
				fn = function( elem, key, value ) {
					return bulk.call( jQuery( elem ), value );
				};
			}
		}

		if ( fn ) {
			for ( ; i < len; i++ ) {
				fn(
					elems[ i ], key, raw ?
					value :
					value.call( elems[ i ], i, fn( elems[ i ], key ) )
				);
			}
		}
	}

	if ( chainable ) {
		return elems;
	}

	// Gets
	if ( bulk ) {
		return fn.call( elems );
	}

	return len ? fn( elems[ 0 ], key ) : emptyGet;
};


// Matches dashed string for camelizing
var rmsPrefix = /^-ms-/,
	rdashAlpha = /-([a-z])/g;

// Used by camelCase as callback to replace()
function fcamelCase( all, letter ) {
	return letter.toUpperCase();
}

// Convert dashed to camelCase; used by the css and data modules
// Support: IE <=9 - 11, Edge 12 - 15
// Microsoft forgot to hump their vendor prefix (#9572)
function camelCase( string ) {
	return string.replace( rmsPrefix, "ms-" ).replace( rdashAlpha, fcamelCase );
}
var acceptData = function( owner ) {

	// Accepts only:
	//  - Node
	//    - Node.ELEMENT_NODE
	//    - Node.DOCUMENT_NODE
	//  - Object
	//    - Any
	return owner.nodeType === 1 || owner.nodeType === 9 || !( +owner.nodeType );
};




function Data() {
	this.expando = jQuery.expando + Data.uid++;
}

Data.uid = 1;

Data.prototype = {

	cache: function( owner ) {

		// Check if the owner object already has a cache
		var value = owner[ this.expando ];

		// If not, create one
		if ( !value ) {
			value = {};

			// We can accept data for non-element nodes in modern browsers,
			// but we should not, see #8335.
			// Always return an empty object.
			if ( acceptData( owner ) ) {

				// If it is a node unlikely to be stringify-ed or looped over
				// use plain assignment
				if ( owner.nodeType ) {
					owner[ this.expando ] = value;

				// Otherwise secure it in a non-enumerable property
				// configurable must be true to allow the property to be
				// deleted when data is removed
				} else {
					Object.defineProperty( owner, this.expando, {
						value: value,
						configurable: true
					} );
				}
			}
		}

		return value;
	},
	set: function( owner, data, value ) {
		var prop,
			cache = this.cache( owner );

		// Handle: [ owner, key, value ] args
		// Always use camelCase key (gh-2257)
		if ( typeof data === "string" ) {
			cache[ camelCase( data ) ] = value;

		// Handle: [ owner, { properties } ] args
		} else {

			// Copy the properties one-by-one to the cache object
			for ( prop in data ) {
				cache[ camelCase( prop ) ] = data[ prop ];
			}
		}
		return cache;
	},
	get: function( owner, key ) {
		return key === undefined ?
			this.cache( owner ) :

			// Always use camelCase key (gh-2257)
			owner[ this.expando ] && owner[ this.expando ][ camelCase( key ) ];
	},
	access: function( owner, key, value ) {

		// In cases where either:
		//
		//   1. No key was specified
		//   2. A string key was specified, but no value provided
		//
		// Take the "read" path and allow the get method to determine
		// which value to return, respectively either:
		//
		//   1. The entire cache object
		//   2. The data stored at the key
		//
		if ( key === undefined ||
				( ( key && typeof key === "string" ) && value === undefined ) ) {

			return this.get( owner, key );
		}

		// When the key is not a string, or both a key and value
		// are specified, set or extend (existing objects) with either:
		//
		//   1. An object of properties
		//   2. A key and value
		//
		this.set( owner, key, value );

		// Since the "set" path can have two possible entry points
		// return the expected data based on which path was taken[*]
		return value !== undefined ? value : key;
	},
	remove: function( owner, key ) {
		var i,
			cache = owner[ this.expando ];

		if ( cache === undefined ) {
			return;
		}

		if ( key !== undefined ) {

			// Support array or space separated string of keys
			if ( Array.isArray( key ) ) {

				// If key is an array of keys...
				// We always set camelCase keys, so remove that.
				key = key.map( camelCase );
			} else {
				key = camelCase( key );

				// If a key with the spaces exists, use it.
				// Otherwise, create an array by matching non-whitespace
				key = key in cache ?
					[ key ] :
					( key.match( rnothtmlwhite ) || [] );
			}

			i = key.length;

			while ( i-- ) {
				delete cache[ key[ i ] ];
			}
		}

		// Remove the expando if there's no more data
		if ( key === undefined || jQuery.isEmptyObject( cache ) ) {

			// Support: Chrome <=35 - 45
			// Webkit & Blink performance suffers when deleting properties
			// from DOM nodes, so set to undefined instead
			// https://bugs.chromium.org/p/chromium/issues/detail?id=378607 (bug restricted)
			if ( owner.nodeType ) {
				owner[ this.expando ] = undefined;
			} else {
				delete owner[ this.expando ];
			}
		}
	},
	hasData: function( owner ) {
		var cache = owner[ this.expando ];
		return cache !== undefined && !jQuery.isEmptyObject( cache );
	}
};
var dataPriv = new Data();

var dataUser = new Data();



//	Implementation Summary
//
//	1. Enforce API surface and semantic compatibility with 1.9.x branch
//	2. Improve the module's maintainability by reducing the storage
//		paths to a single mechanism.
//	3. Use the same single mechanism to support "private" and "user" data.
//	4. _Never_ expose "private" data to user code (TODO: Drop _data, _removeData)
//	5. Avoid exposing implementation details on user objects (eg. expando properties)
//	6. Provide a clear path for implementation upgrade to WeakMap in 2014

var rbrace = /^(?:\{[\w\W]*\}|\[[\w\W]*\])$/,
	rmultiDash = /[A-Z]/g;

function getData( data ) {
	if ( data === "true" ) {
		return true;
	}

	if ( data === "false" ) {
		return false;
	}

	if ( data === "null" ) {
		return null;
	}

	// Only convert to a number if it doesn't change the string
	if ( data === +data + "" ) {
		return +data;
	}

	if ( rbrace.test( data ) ) {
		return JSON.parse( data );
	}

	return data;
}

function dataAttr( elem, key, data ) {
	var name;

	// If nothing was found internally, try to fetch any
	// data from the HTML5 data-* attribute
	if ( data === undefined && elem.nodeType === 1 ) {
		name = "data-" + key.replace( rmultiDash, "-$&" ).toLowerCase();
		data = elem.getAttribute( name );

		if ( typeof data === "string" ) {
			try {
				data = getData( data );
			} catch ( e ) {}

			// Make sure we set the data so it isn't changed later
			dataUser.set( elem, key, data );
		} else {
			data = undefined;
		}
	}
	return data;
}

jQuery.extend( {
	hasData: function( elem ) {
		return dataUser.hasData( elem ) || dataPriv.hasData( elem );
	},

	data: function( elem, name, data ) {
		return dataUser.access( elem, name, data );
	},

	removeData: function( elem, name ) {
		dataUser.remove( elem, name );
	},

	// TODO: Now that all calls to _data and _removeData have been replaced
	// with direct calls to dataPriv methods, these can be deprecated.
	_data: function( elem, name, data ) {
		return dataPriv.access( elem, name, data );
	},

	_removeData: function( elem, name ) {
		dataPriv.remove( elem, name );
	}
} );

jQuery.fn.extend( {
	data: function( key, value ) {
		var i, name, data,
			elem = this[ 0 ],
			attrs = elem && elem.attributes;

		// Gets all values
		if ( key === undefined ) {
			if ( this.length ) {
				data = dataUser.get( elem );

				if ( elem.nodeType === 1 && !dataPriv.get( elem, "hasDataAttrs" ) ) {
					i = attrs.length;
					while ( i-- ) {

						// Support: IE 11 only
						// The attrs elements can be null (#14894)
						if ( attrs[ i ] ) {
							name = attrs[ i ].name;
							if ( name.indexOf( "data-" ) === 0 ) {
								name = camelCase( name.slice( 5 ) );
								dataAttr( elem, name, data[ name ] );
							}
						}
					}
					dataPriv.set( elem, "hasDataAttrs", true );
				}
			}

			return data;
		}

		// Sets multiple values
		if ( typeof key === "object" ) {
			return this.each( function() {
				dataUser.set( this, key );
			} );
		}

		return access( this, function( value ) {
			var data;

			// The calling jQuery object (element matches) is not empty
			// (and therefore has an element appears at this[ 0 ]) and the
			// `value` parameter was not undefined. An empty jQuery object
			// will result in `undefined` for elem = this[ 0 ] which will
			// throw an exception if an attempt to read a data cache is made.
			if ( elem && value === undefined ) {

				// Attempt to get data from the cache
				// The key will always be camelCased in Data
				data = dataUser.get( elem, key );
				if ( data !== undefined ) {
					return data;
				}

				// Attempt to "discover" the data in
				// HTML5 custom data-* attrs
				data = dataAttr( elem, key );
				if ( data !== undefined ) {
					return data;
				}

				// We tried really hard, but the data doesn't exist.
				return;
			}

			// Set the data...
			this.each( function() {

				// We always store the camelCased key
				dataUser.set( this, key, value );
			} );
		}, null, value, arguments.length > 1, null, true );
	},

	removeData: function( key ) {
		return this.each( function() {
			dataUser.remove( this, key );
		} );
	}
} );


jQuery.extend( {
	queue: function( elem, type, data ) {
		var queue;

		if ( elem ) {
			type = ( type || "fx" ) + "queue";
			queue = dataPriv.get( elem, type );

			// Speed up dequeue by getting out quickly if this is just a lookup
			if ( data ) {
				if ( !queue || Array.isArray( data ) ) {
					queue = dataPriv.access( elem, type, jQuery.makeArray( data ) );
				} else {
					queue.push( data );
				}
			}
			return queue || [];
		}
	},

	dequeue: function( elem, type ) {
		type = type || "fx";

		var queue = jQuery.queue( elem, type ),
			startLength = queue.length,
			fn = queue.shift(),
			hooks = jQuery._queueHooks( elem, type ),
			next = function() {
				jQuery.dequeue( elem, type );
			};

		// If the fx queue is dequeued, always remove the progress sentinel
		if ( fn === "inprogress" ) {
			fn = queue.shift();
			startLength--;
		}

		if ( fn ) {

			// Add a progress sentinel to prevent the fx queue from being
			// automatically dequeued
			if ( type === "fx" ) {
				queue.unshift( "inprogress" );
			}

			// Clear up the last queue stop function
			delete hooks.stop;
			fn.call( elem, next, hooks );
		}

		if ( !startLength && hooks ) {
			hooks.empty.fire();
		}
	},

	// Not public - generate a queueHooks object, or return the current one
	_queueHooks: function( elem, type ) {
		var key = type + "queueHooks";
		return dataPriv.get( elem, key ) || dataPriv.access( elem, key, {
			empty: jQuery.Callbacks( "once memory" ).add( function() {
				dataPriv.remove( elem, [ type + "queue", key ] );
			} )
		} );
	}
} );

jQuery.fn.extend( {
	queue: function( type, data ) {
		var setter = 2;

		if ( typeof type !== "string" ) {
			data = type;
			type = "fx";
			setter--;
		}

		if ( arguments.length < setter ) {
			return jQuery.queue( this[ 0 ], type );
		}

		return data === undefined ?
			this :
			this.each( function() {
				var queue = jQuery.queue( this, type, data );

				// Ensure a hooks for this queue
				jQuery._queueHooks( this, type );

				if ( type === "fx" && queue[ 0 ] !== "inprogress" ) {
					jQuery.dequeue( this, type );
				}
			} );
	},
	dequeue: function( type ) {
		return this.each( function() {
			jQuery.dequeue( this, type );
		} );
	},
	clearQueue: function( type ) {
		return this.queue( type || "fx", [] );
	},

	// Get a promise resolved when queues of a certain type
	// are emptied (fx is the type by default)
	promise: function( type, obj ) {
		var tmp,
			count = 1,
			defer = jQuery.Deferred(),
			elements = this,
			i = this.length,
			resolve = function() {
				if ( !( --count ) ) {
					defer.resolveWith( elements, [ elements ] );
				}
			};

		if ( typeof type !== "string" ) {
			obj = type;
			type = undefined;
		}
		type = type || "fx";

		while ( i-- ) {
			tmp = dataPriv.get( elements[ i ], type + "queueHooks" );
			if ( tmp && tmp.empty ) {
				count++;
				tmp.empty.add( resolve );
			}
		}
		resolve();
		return defer.promise( obj );
	}
} );
var pnum = ( /[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/ ).source;

var rcssNum = new RegExp( "^(?:([+-])=|)(" + pnum + ")([a-z%]*)$", "i" );


var cssExpand = [ "Top", "Right", "Bottom", "Left" ];

var isHiddenWithinTree = function( elem, el ) {

		// isHiddenWithinTree might be called from jQuery#filter function;
		// in that case, element will be second argument
		elem = el || elem;

		// Inline style trumps all
		return elem.style.display === "none" ||
			elem.style.display === "" &&

			// Otherwise, check computed style
			// Support: Firefox <=43 - 45
			// Disconnected elements can have computed display: none, so first confirm that elem is
			// in the document.
			jQuery.contains( elem.ownerDocument, elem ) &&

			jQuery.css( elem, "display" ) === "none";
	};

var swap = function( elem, options, callback, args ) {
	var ret, name,
		old = {};

	// Remember the old values, and insert the new ones
	for ( name in options ) {
		old[ name ] = elem.style[ name ];
		elem.style[ name ] = options[ name ];
	}

	ret = callback.apply( elem, args || [] );

	// Revert the old values
	for ( name in options ) {
		elem.style[ name ] = old[ name ];
	}

	return ret;
};




function adjustCSS( elem, prop, valueParts, tween ) {
	var adjusted, scale,
		maxIterations = 20,
		currentValue = tween ?
			function() {
				return tween.cur();
			} :
			function() {
				return jQuery.css( elem, prop, "" );
			},
		initial = currentValue(),
		unit = valueParts && valueParts[ 3 ] || ( jQuery.cssNumber[ prop ] ? "" : "px" ),

		// Starting value computation is required for potential unit mismatches
		initialInUnit = ( jQuery.cssNumber[ prop ] || unit !== "px" && +initial ) &&
			rcssNum.exec( jQuery.css( elem, prop ) );

	if ( initialInUnit && initialInUnit[ 3 ] !== unit ) {

		// Support: Firefox <=54
		// Halve the iteration target value to prevent interference from CSS upper bounds (gh-2144)
		initial = initial / 2;

		// Trust units reported by jQuery.css
		unit = unit || initialInUnit[ 3 ];

		// Iteratively approximate from a nonzero starting point
		initialInUnit = +initial || 1;

		while ( maxIterations-- ) {

			// Evaluate and update our best guess (doubling guesses that zero out).
			// Finish if the scale equals or crosses 1 (making the old*new product non-positive).
			jQuery.style( elem, prop, initialInUnit + unit );
			if ( ( 1 - scale ) * ( 1 - ( scale = currentValue() / initial || 0.5 ) ) <= 0 ) {
				maxIterations = 0;
			}
			initialInUnit = initialInUnit / scale;

		}

		initialInUnit = initialInUnit * 2;
		jQuery.style( elem, prop, initialInUnit + unit );

		// Make sure we update the tween properties later on
		valueParts = valueParts || [];
	}

	if ( valueParts ) {
		initialInUnit = +initialInUnit || +initial || 0;

		// Apply relative offset (+=/-=) if specified
		adjusted = valueParts[ 1 ] ?
			initialInUnit + ( valueParts[ 1 ] + 1 ) * valueParts[ 2 ] :
			+valueParts[ 2 ];
		if ( tween ) {
			tween.unit = unit;
			tween.start = initialInUnit;
			tween.end = adjusted;
		}
	}
	return adjusted;
}


var defaultDisplayMap = {};

function getDefaultDisplay( elem ) {
	var temp,
		doc = elem.ownerDocument,
		nodeName = elem.nodeName,
		display = defaultDisplayMap[ nodeName ];

	if ( display ) {
		return display;
	}

	temp = doc.body.appendChild( doc.createElement( nodeName ) );
	display = jQuery.css( temp, "display" );

	temp.parentNode.removeChild( temp );

	if ( display === "none" ) {
		display = "block";
	}
	defaultDisplayMap[ nodeName ] = display;

	return display;
}

function showHide( elements, show ) {
	var display, elem,
		values = [],
		index = 0,
		length = elements.length;

	// Determine new display value for elements that need to change
	for ( ; index < length; index++ ) {
		elem = elements[ index ];
		if ( !elem.style ) {
			continue;
		}

		display = elem.style.display;
		if ( show ) {

			// Since we force visibility upon cascade-hidden elements, an immediate (and slow)
			// check is required in this first loop unless we have a nonempty display value (either
			// inline or about-to-be-restored)
			if ( display === "none" ) {
				values[ index ] = dataPriv.get( elem, "display" ) || null;
				if ( !values[ index ] ) {
					elem.style.display = "";
				}
			}
			if ( elem.style.display === "" && isHiddenWithinTree( elem ) ) {
				values[ index ] = getDefaultDisplay( elem );
			}
		} else {
			if ( display !== "none" ) {
				values[ index ] = "none";

				// Remember what we're overwriting
				dataPriv.set( elem, "display", display );
			}
		}
	}

	// Set the display of the elements in a second loop to avoid constant reflow
	for ( index = 0; index < length; index++ ) {
		if ( values[ index ] != null ) {
			elements[ index ].style.display = values[ index ];
		}
	}

	return elements;
}

jQuery.fn.extend( {
	show: function() {
		return showHide( this, true );
	},
	hide: function() {
		return showHide( this );
	},
	toggle: function( state ) {
		if ( typeof state === "boolean" ) {
			return state ? this.show() : this.hide();
		}

		return this.each( function() {
			if ( isHiddenWithinTree( this ) ) {
				jQuery( this ).show();
			} else {
				jQuery( this ).hide();
			}
		} );
	}
} );
var rcheckableType = ( /^(?:checkbox|radio)$/i );

var rtagName = ( /<([a-z][^\/\0>\x20\t\r\n\f]+)/i );

var rscriptType = ( /^$|^module$|\/(?:java|ecma)script/i );



// We have to close these tags to support XHTML (#13200)
var wrapMap = {

	// Support: IE <=9 only
	option: [ 1, "<select multiple='multiple'>", "</select>" ],

	// XHTML parsers do not magically insert elements in the
	// same way that tag soup parsers do. So we cannot shorten
	// this by omitting <tbody> or other required elements.
	thead: [ 1, "<table>", "</table>" ],
	col: [ 2, "<table><colgroup>", "</colgroup></table>" ],
	tr: [ 2, "<table><tbody>", "</tbody></table>" ],
	td: [ 3, "<table><tbody><tr>", "</tr></tbody></table>" ],

	_default: [ 0, "", "" ]
};

// Support: IE <=9 only
wrapMap.optgroup = wrapMap.option;

wrapMap.tbody = wrapMap.tfoot = wrapMap.colgroup = wrapMap.caption = wrapMap.thead;
wrapMap.th = wrapMap.td;


function getAll( context, tag ) {

	// Support: IE <=9 - 11 only
	// Use typeof to avoid zero-argument method invocation on host objects (#15151)
	var ret;

	if ( typeof context.getElementsByTagName !== "undefined" ) {
		ret = context.getElementsByTagName( tag || "*" );

	} else if ( typeof context.querySelectorAll !== "undefined" ) {
		ret = context.querySelectorAll( tag || "*" );

	} else {
		ret = [];
	}

	if ( tag === undefined || tag && nodeName( context, tag ) ) {
		return jQuery.merge( [ context ], ret );
	}

	return ret;
}


// Mark scripts as having already been evaluated
function setGlobalEval( elems, refElements ) {
	var i = 0,
		l = elems.length;

	for ( ; i < l; i++ ) {
		dataPriv.set(
			elems[ i ],
			"globalEval",
			!refElements || dataPriv.get( refElements[ i ], "globalEval" )
		);
	}
}


var rhtml = /<|&#?\w+;/;

function buildFragment( elems, context, scripts, selection, ignored ) {
	var elem, tmp, tag, wrap, contains, j,
		fragment = context.createDocumentFragment(),
		nodes = [],
		i = 0,
		l = elems.length;

	for ( ; i < l; i++ ) {
		elem = elems[ i ];

		if ( elem || elem === 0 ) {

			// Add nodes directly
			if ( toType( elem ) === "object" ) {

				// Support: Android <=4.0 only, PhantomJS 1 only
				// push.apply(_, arraylike) throws on ancient WebKit
				jQuery.merge( nodes, elem.nodeType ? [ elem ] : elem );

			// Convert non-html into a text node
			} else if ( !rhtml.test( elem ) ) {
				nodes.push( context.createTextNode( elem ) );

			// Convert html into DOM nodes
			} else {
				tmp = tmp || fragment.appendChild( context.createElement( "div" ) );

				// Deserialize a standard representation
				tag = ( rtagName.exec( elem ) || [ "", "" ] )[ 1 ].toLowerCase();
				wrap = wrapMap[ tag ] || wrapMap._default;
				tmp.innerHTML = wrap[ 1 ] + jQuery.htmlPrefilter( elem ) + wrap[ 2 ];

				// Descend through wrappers to the right content
				j = wrap[ 0 ];
				while ( j-- ) {
					tmp = tmp.lastChild;
				}

				// Support: Android <=4.0 only, PhantomJS 1 only
				// push.apply(_, arraylike) throws on ancient WebKit
				jQuery.merge( nodes, tmp.childNodes );

				// Remember the top-level container
				tmp = fragment.firstChild;

				// Ensure the created nodes are orphaned (#12392)
				tmp.textContent = "";
			}
		}
	}

	// Remove wrapper from fragment
	fragment.textContent = "";

	i = 0;
	while ( ( elem = nodes[ i++ ] ) ) {

		// Skip elements already in the context collection (trac-4087)
		if ( selection && jQuery.inArray( elem, selection ) > -1 ) {
			if ( ignored ) {
				ignored.push( elem );
			}
			continue;
		}

		contains = jQuery.contains( elem.ownerDocument, elem );

		// Append to fragment
		tmp = getAll( fragment.appendChild( elem ), "script" );

		// Preserve script evaluation history
		if ( contains ) {
			setGlobalEval( tmp );
		}

		// Capture executables
		if ( scripts ) {
			j = 0;
			while ( ( elem = tmp[ j++ ] ) ) {
				if ( rscriptType.test( elem.type || "" ) ) {
					scripts.push( elem );
				}
			}
		}
	}

	return fragment;
}


( function() {
	var fragment = document.createDocumentFragment(),
		div = fragment.appendChild( document.createElement( "div" ) ),
		input = document.createElement( "input" );

	// Support: Android 4.0 - 4.3 only
	// Check state lost if the name is set (#11217)
	// Support: Windows Web Apps (WWA)
	// `name` and `type` must use .setAttribute for WWA (#14901)
	input.setAttribute( "type", "radio" );
	input.setAttribute( "checked", "checked" );
	input.setAttribute( "name", "t" );

	div.appendChild( input );

	// Support: Android <=4.1 only
	// Older WebKit doesn't clone checked state correctly in fragments
	support.checkClone = div.cloneNode( true ).cloneNode( true ).lastChild.checked;

	// Support: IE <=11 only
	// Make sure textarea (and checkbox) defaultValue is properly cloned
	div.innerHTML = "<textarea>x</textarea>";
	support.noCloneChecked = !!div.cloneNode( true ).lastChild.defaultValue;
} )();
var documentElement = document.documentElement;



var
	rkeyEvent = /^key/,
	rmouseEvent = /^(?:mouse|pointer|contextmenu|drag|drop)|click/,
	rtypenamespace = /^([^.]*)(?:\.(.+)|)/;

function returnTrue() {
	return true;
}

function returnFalse() {
	return false;
}

// Support: IE <=9 only
// See #13393 for more info
function safeActiveElement() {
	try {
		return document.activeElement;
	} catch ( err ) { }
}

function on( elem, types, selector, data, fn, one ) {
	var origFn, type;

	// Types can be a map of types/handlers
	if ( typeof types === "object" ) {

		// ( types-Object, selector, data )
		if ( typeof selector !== "string" ) {

			// ( types-Object, data )
			data = data || selector;
			selector = undefined;
		}
		for ( type in types ) {
			on( elem, type, selector, data, types[ type ], one );
		}
		return elem;
	}

	if ( data == null && fn == null ) {

		// ( types, fn )
		fn = selector;
		data = selector = undefined;
	} else if ( fn == null ) {
		if ( typeof selector === "string" ) {

			// ( types, selector, fn )
			fn = data;
			data = undefined;
		} else {

			// ( types, data, fn )
			fn = data;
			data = selector;
			selector = undefined;
		}
	}
	if ( fn === false ) {
		fn = returnFalse;
	} else if ( !fn ) {
		return elem;
	}

	if ( one === 1 ) {
		origFn = fn;
		fn = function( event ) {

			// Can use an empty set, since event contains the info
			jQuery().off( event );
			return origFn.apply( this, arguments );
		};

		// Use same guid so caller can remove using origFn
		fn.guid = origFn.guid || ( origFn.guid = jQuery.guid++ );
	}
	return elem.each( function() {
		jQuery.event.add( this, types, fn, data, selector );
	} );
}

/*
 * Helper functions for managing events -- not part of the public interface.
 * Props to Dean Edwards' addEvent library for many of the ideas.
 */
jQuery.event = {

	global: {},

	add: function( elem, types, handler, data, selector ) {

		var handleObjIn, eventHandle, tmp,
			events, t, handleObj,
			special, handlers, type, namespaces, origType,
			elemData = dataPriv.get( elem );

		// Don't attach events to noData or text/comment nodes (but allow plain objects)
		if ( !elemData ) {
			return;
		}

		// Caller can pass in an object of custom data in lieu of the handler
		if ( handler.handler ) {
			handleObjIn = handler;
			handler = handleObjIn.handler;
			selector = handleObjIn.selector;
		}

		// Ensure that invalid selectors throw exceptions at attach time
		// Evaluate against documentElement in case elem is a non-element node (e.g., document)
		if ( selector ) {
			jQuery.find.matchesSelector( documentElement, selector );
		}

		// Make sure that the handler has a unique ID, used to find/remove it later
		if ( !handler.guid ) {
			handler.guid = jQuery.guid++;
		}

		// Init the element's event structure and main handler, if this is the first
		if ( !( events = elemData.events ) ) {
			events = elemData.events = {};
		}
		if ( !( eventHandle = elemData.handle ) ) {
			eventHandle = elemData.handle = function( e ) {

				// Discard the second event of a jQuery.event.trigger() and
				// when an event is called after a page has unloaded
				return typeof jQuery !== "undefined" && jQuery.event.triggered !== e.type ?
					jQuery.event.dispatch.apply( elem, arguments ) : undefined;
			};
		}

		// Handle multiple events separated by a space
		types = ( types || "" ).match( rnothtmlwhite ) || [ "" ];
		t = types.length;
		while ( t-- ) {
			tmp = rtypenamespace.exec( types[ t ] ) || [];
			type = origType = tmp[ 1 ];
			namespaces = ( tmp[ 2 ] || "" ).split( "." ).sort();

			// There *must* be a type, no attaching namespace-only handlers
			if ( !type ) {
				continue;
			}

			// If event changes its type, use the special event handlers for the changed type
			special = jQuery.event.special[ type ] || {};

			// If selector defined, determine special event api type, otherwise given type
			type = ( selector ? special.delegateType : special.bindType ) || type;

			// Update special based on newly reset type
			special = jQuery.event.special[ type ] || {};

			// handleObj is passed to all event handlers
			handleObj = jQuery.extend( {
				type: type,
				origType: origType,
				data: data,
				handler: handler,
				guid: handler.guid,
				selector: selector,
				needsContext: selector && jQuery.expr.match.needsContext.test( selector ),
				namespace: namespaces.join( "." )
			}, handleObjIn );

			// Init the event handler queue if we're the first
			if ( !( handlers = events[ type ] ) ) {
				handlers = events[ type ] = [];
				handlers.delegateCount = 0;

				// Only use addEventListener if the special events handler returns false
				if ( !special.setup ||
					special.setup.call( elem, data, namespaces, eventHandle ) === false ) {

					if ( elem.addEventListener ) {
						elem.addEventListener( type, eventHandle );
					}
				}
			}

			if ( special.add ) {
				special.add.call( elem, handleObj );

				if ( !handleObj.handler.guid ) {
					handleObj.handler.guid = handler.guid;
				}
			}

			// Add to the element's handler list, delegates in front
			if ( selector ) {
				handlers.splice( handlers.delegateCount++, 0, handleObj );
			} else {
				handlers.push( handleObj );
			}

			// Keep track of which events have ever been used, for event optimization
			jQuery.event.global[ type ] = true;
		}

	},

	// Detach an event or set of events from an element
	remove: function( elem, types, handler, selector, mappedTypes ) {

		var j, origCount, tmp,
			events, t, handleObj,
			special, handlers, type, namespaces, origType,
			elemData = dataPriv.hasData( elem ) && dataPriv.get( elem );

		if ( !elemData || !( events = elemData.events ) ) {
			return;
		}

		// Once for each type.namespace in types; type may be omitted
		types = ( types || "" ).match( rnothtmlwhite ) || [ "" ];
		t = types.length;
		while ( t-- ) {
			tmp = rtypenamespace.exec( types[ t ] ) || [];
			type = origType = tmp[ 1 ];
			namespaces = ( tmp[ 2 ] || "" ).split( "." ).sort();

			// Unbind all events (on this namespace, if provided) for the element
			if ( !type ) {
				for ( type in events ) {
					jQuery.event.remove( elem, type + types[ t ], handler, selector, true );
				}
				continue;
			}

			special = jQuery.event.special[ type ] || {};
			type = ( selector ? special.delegateType : special.bindType ) || type;
			handlers = events[ type ] || [];
			tmp = tmp[ 2 ] &&
				new RegExp( "(^|\\.)" + namespaces.join( "\\.(?:.*\\.|)" ) + "(\\.|$)" );

			// Remove matching events
			origCount = j = handlers.length;
			while ( j-- ) {
				handleObj = handlers[ j ];

				if ( ( mappedTypes || origType === handleObj.origType ) &&
					( !handler || handler.guid === handleObj.guid ) &&
					( !tmp || tmp.test( handleObj.namespace ) ) &&
					( !selector || selector === handleObj.selector ||
						selector === "**" && handleObj.selector ) ) {
					handlers.splice( j, 1 );

					if ( handleObj.selector ) {
						handlers.delegateCount--;
					}
					if ( special.remove ) {
						special.remove.call( elem, handleObj );
					}
				}
			}

			// Remove generic event handler if we removed something and no more handlers exist
			// (avoids potential for endless recursion during removal of special event handlers)
			if ( origCount && !handlers.length ) {
				if ( !special.teardown ||
					special.teardown.call( elem, namespaces, elemData.handle ) === false ) {

					jQuery.removeEvent( elem, type, elemData.handle );
				}

				delete events[ type ];
			}
		}

		// Remove data and the expando if it's no longer used
		if ( jQuery.isEmptyObject( events ) ) {
			dataPriv.remove( elem, "handle events" );
		}
	},

	dispatch: function( nativeEvent ) {

		// Make a writable jQuery.Event from the native event object
		var event = jQuery.event.fix( nativeEvent );

		var i, j, ret, matched, handleObj, handlerQueue,
			args = new Array( arguments.length ),
			handlers = ( dataPriv.get( this, "events" ) || {} )[ event.type ] || [],
			special = jQuery.event.special[ event.type ] || {};

		// Use the fix-ed jQuery.Event rather than the (read-only) native event
		args[ 0 ] = event;

		for ( i = 1; i < arguments.length; i++ ) {
			args[ i ] = arguments[ i ];
		}

		event.delegateTarget = this;

		// Call the preDispatch hook for the mapped type, and let it bail if desired
		if ( special.preDispatch && special.preDispatch.call( this, event ) === false ) {
			return;
		}

		// Determine handlers
		handlerQueue = jQuery.event.handlers.call( this, event, handlers );

		// Run delegates first; they may want to stop propagation beneath us
		i = 0;
		while ( ( matched = handlerQueue[ i++ ] ) && !event.isPropagationStopped() ) {
			event.currentTarget = matched.elem;

			j = 0;
			while ( ( handleObj = matched.handlers[ j++ ] ) &&
				!event.isImmediatePropagationStopped() ) {

				// Triggered event must either 1) have no namespace, or 2) have namespace(s)
				// a subset or equal to those in the bound event (both can have no namespace).
				if ( !event.rnamespace || event.rnamespace.test( handleObj.namespace ) ) {

					event.handleObj = handleObj;
					event.data = handleObj.data;

					ret = ( ( jQuery.event.special[ handleObj.origType ] || {} ).handle ||
						handleObj.handler ).apply( matched.elem, args );

					if ( ret !== undefined ) {
						if ( ( event.result = ret ) === false ) {
							event.preventDefault();
							event.stopPropagation();
						}
					}
				}
			}
		}

		// Call the postDispatch hook for the mapped type
		if ( special.postDispatch ) {
			special.postDispatch.call( this, event );
		}

		return event.result;
	},

	handlers: function( event, handlers ) {
		var i, handleObj, sel, matchedHandlers, matchedSelectors,
			handlerQueue = [],
			delegateCount = handlers.delegateCount,
			cur = event.target;

		// Find delegate handlers
		if ( delegateCount &&

			// Support: IE <=9
			// Black-hole SVG <use> instance trees (trac-13180)
			cur.nodeType &&

			// Support: Firefox <=42
			// Suppress spec-violating clicks indicating a non-primary pointer button (trac-3861)
			// https://www.w3.org/TR/DOM-Level-3-Events/#event-type-click
			// Support: IE 11 only
			// ...but not arrow key "clicks" of radio inputs, which can have `button` -1 (gh-2343)
			!( event.type === "click" && event.button >= 1 ) ) {

			for ( ; cur !== this; cur = cur.parentNode || this ) {

				// Don't check non-elements (#13208)
				// Don't process clicks on disabled elements (#6911, #8165, #11382, #11764)
				if ( cur.nodeType === 1 && !( event.type === "click" && cur.disabled === true ) ) {
					matchedHandlers = [];
					matchedSelectors = {};
					for ( i = 0; i < delegateCount; i++ ) {
						handleObj = handlers[ i ];

						// Don't conflict with Object.prototype properties (#13203)
						sel = handleObj.selector + " ";

						if ( matchedSelectors[ sel ] === undefined ) {
							matchedSelectors[ sel ] = handleObj.needsContext ?
								jQuery( sel, this ).index( cur ) > -1 :
								jQuery.find( sel, this, null, [ cur ] ).length;
						}
						if ( matchedSelectors[ sel ] ) {
							matchedHandlers.push( handleObj );
						}
					}
					if ( matchedHandlers.length ) {
						handlerQueue.push( { elem: cur, handlers: matchedHandlers } );
					}
				}
			}
		}

		// Add the remaining (directly-bound) handlers
		cur = this;
		if ( delegateCount < handlers.length ) {
			handlerQueue.push( { elem: cur, handlers: handlers.slice( delegateCount ) } );
		}

		return handlerQueue;
	},

	addProp: function( name, hook ) {
		Object.defineProperty( jQuery.Event.prototype, name, {
			enumerable: true,
			configurable: true,

			get: isFunction( hook ) ?
				function() {
					if ( this.originalEvent ) {
							return hook( this.originalEvent );
					}
				} :
				function() {
					if ( this.originalEvent ) {
							return this.originalEvent[ name ];
					}
				},

			set: function( value ) {
				Object.defineProperty( this, name, {
					enumerable: true,
					configurable: true,
					writable: true,
					value: value
				} );
			}
		} );
	},

	fix: function( originalEvent ) {
		return originalEvent[ jQuery.expando ] ?
			originalEvent :
			new jQuery.Event( originalEvent );
	},

	special: {
		load: {

			// Prevent triggered image.load events from bubbling to window.load
			noBubble: true
		},
		focus: {

			// Fire native event if possible so blur/focus sequence is correct
			trigger: function() {
				if ( this !== safeActiveElement() && this.focus ) {
					this.focus();
					return false;
				}
			},
			delegateType: "focusin"
		},
		blur: {
			trigger: function() {
				if ( this === safeActiveElement() && this.blur ) {
					this.blur();
					return false;
				}
			},
			delegateType: "focusout"
		},
		click: {

			// For checkbox, fire native event so checked state will be right
			trigger: function() {
				if ( this.type === "checkbox" && this.click && nodeName( this, "input" ) ) {
					this.click();
					return false;
				}
			},

			// For cross-browser consistency, don't fire native .click() on links
			_default: function( event ) {
				return nodeName( event.target, "a" );
			}
		},

		beforeunload: {
			postDispatch: function( event ) {

				// Support: Firefox 20+
				// Firefox doesn't alert if the returnValue field is not set.
				if ( event.result !== undefined && event.originalEvent ) {
					event.originalEvent.returnValue = event.result;
				}
			}
		}
	}
};

jQuery.removeEvent = function( elem, type, handle ) {

	// This "if" is needed for plain objects
	if ( elem.removeEventListener ) {
		elem.removeEventListener( type, handle );
	}
};

jQuery.Event = function( src, props ) {

	// Allow instantiation without the 'new' keyword
	if ( !( this instanceof jQuery.Event ) ) {
		return new jQuery.Event( src, props );
	}

	// Event object
	if ( src && src.type ) {
		this.originalEvent = src;
		this.type = src.type;

		// Events bubbling up the document may have been marked as prevented
		// by a handler lower down the tree; reflect the correct value.
		this.isDefaultPrevented = src.defaultPrevented ||
				src.defaultPrevented === undefined &&

				// Support: Android <=2.3 only
				src.returnValue === false ?
			returnTrue :
			returnFalse;

		// Create target properties
		// Support: Safari <=6 - 7 only
		// Target should not be a text node (#504, #13143)
		this.target = ( src.target && src.target.nodeType === 3 ) ?
			src.target.parentNode :
			src.target;

		this.currentTarget = src.currentTarget;
		this.relatedTarget = src.relatedTarget;

	// Event type
	} else {
		this.type = src;
	}

	// Put explicitly provided properties onto the event object
	if ( props ) {
		jQuery.extend( this, props );
	}

	// Create a timestamp if incoming event doesn't have one
	this.timeStamp = src && src.timeStamp || Date.now();

	// Mark it as fixed
	this[ jQuery.expando ] = true;
};

// jQuery.Event is based on DOM3 Events as specified by the ECMAScript Language Binding
// https://www.w3.org/TR/2003/WD-DOM-Level-3-Events-20030331/ecma-script-binding.html
jQuery.Event.prototype = {
	constructor: jQuery.Event,
	isDefaultPrevented: returnFalse,
	isPropagationStopped: returnFalse,
	isImmediatePropagationStopped: returnFalse,
	isSimulated: false,

	preventDefault: function() {
		var e = this.originalEvent;

		this.isDefaultPrevented = returnTrue;

		if ( e && !this.isSimulated ) {
			e.preventDefault();
		}
	},
	stopPropagation: function() {
		var e = this.originalEvent;

		this.isPropagationStopped = returnTrue;

		if ( e && !this.isSimulated ) {
			e.stopPropagation();
		}
	},
	stopImmediatePropagation: function() {
		var e = this.originalEvent;

		this.isImmediatePropagationStopped = returnTrue;

		if ( e && !this.isSimulated ) {
			e.stopImmediatePropagation();
		}

		this.stopPropagation();
	}
};

// Includes all common event props including KeyEvent and MouseEvent specific props
jQuery.each( {
	altKey: true,
	bubbles: true,
	cancelable: true,
	changedTouches: true,
	ctrlKey: true,
	detail: true,
	eventPhase: true,
	metaKey: true,
	pageX: true,
	pageY: true,
	shiftKey: true,
	view: true,
	"char": true,
	charCode: true,
	key: true,
	keyCode: true,
	button: true,
	buttons: true,
	clientX: true,
	clientY: true,
	offsetX: true,
	offsetY: true,
	pointerId: true,
	pointerType: true,
	screenX: true,
	screenY: true,
	targetTouches: true,
	toElement: true,
	touches: true,

	which: function( event ) {
		var button = event.button;

		// Add which for key events
		if ( event.which == null && rkeyEvent.test( event.type ) ) {
			return event.charCode != null ? event.charCode : event.keyCode;
		}

		// Add which for click: 1 === left; 2 === middle; 3 === right
		if ( !event.which && button !== undefined && rmouseEvent.test( event.type ) ) {
			if ( button & 1 ) {
				return 1;
			}

			if ( button & 2 ) {
				return 3;
			}

			if ( button & 4 ) {
				return 2;
			}

			return 0;
		}

		return event.which;
	}
}, jQuery.event.addProp );

// Create mouseenter/leave events using mouseover/out and event-time checks
// so that event delegation works in jQuery.
// Do the same for pointerenter/pointerleave and pointerover/pointerout
//
// Support: Safari 7 only
// Safari sends mouseenter too often; see:
// https://bugs.chromium.org/p/chromium/issues/detail?id=470258
// for the description of the bug (it existed in older Chrome versions as well).
jQuery.each( {
	mouseenter: "mouseover",
	mouseleave: "mouseout",
	pointerenter: "pointerover",
	pointerleave: "pointerout"
}, function( orig, fix ) {
	jQuery.event.special[ orig ] = {
		delegateType: fix,
		bindType: fix,

		handle: function( event ) {
			var ret,
				target = this,
				related = event.relatedTarget,
				handleObj = event.handleObj;

			// For mouseenter/leave call the handler if related is outside the target.
			// NB: No relatedTarget if the mouse left/entered the browser window
			if ( !related || ( related !== target && !jQuery.contains( target, related ) ) ) {
				event.type = handleObj.origType;
				ret = handleObj.handler.apply( this, arguments );
				event.type = fix;
			}
			return ret;
		}
	};
} );

jQuery.fn.extend( {

	on: function( types, selector, data, fn ) {
		return on( this, types, selector, data, fn );
	},
	one: function( types, selector, data, fn ) {
		return on( this, types, selector, data, fn, 1 );
	},
	off: function( types, selector, fn ) {
		var handleObj, type;
		if ( types && types.preventDefault && types.handleObj ) {

			// ( event )  dispatched jQuery.Event
			handleObj = types.handleObj;
			jQuery( types.delegateTarget ).off(
				handleObj.namespace ?
					handleObj.origType + "." + handleObj.namespace :
					handleObj.origType,
				handleObj.selector,
				handleObj.handler
			);
			return this;
		}
		if ( typeof types === "object" ) {

			// ( types-object [, selector] )
			for ( type in types ) {
				this.off( type, selector, types[ type ] );
			}
			return this;
		}
		if ( selector === false || typeof selector === "function" ) {

			// ( types [, fn] )
			fn = selector;
			selector = undefined;
		}
		if ( fn === false ) {
			fn = returnFalse;
		}
		return this.each( function() {
			jQuery.event.remove( this, types, fn, selector );
		} );
	}
} );


var

	/* eslint-disable max-len */

	// See https://github.com/eslint/eslint/issues/3229
	rxhtmlTag = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([a-z][^\/\0>\x20\t\r\n\f]*)[^>]*)\/>/gi,

	/* eslint-enable */

	// Support: IE <=10 - 11, Edge 12 - 13 only
	// In IE/Edge using regex groups here causes severe slowdowns.
	// See https://connect.microsoft.com/IE/feedback/details/1736512/
	rnoInnerhtml = /<script|<style|<link/i,

	// checked="checked" or checked
	rchecked = /checked\s*(?:[^=]|=\s*.checked.)/i,
	rcleanScript = /^\s*<!(?:\[CDATA\[|--)|(?:\]\]|--)>\s*$/g;

// Prefer a tbody over its parent table for containing new rows
function manipulationTarget( elem, content ) {
	if ( nodeName( elem, "table" ) &&
		nodeName( content.nodeType !== 11 ? content : content.firstChild, "tr" ) ) {

		return jQuery( elem ).children( "tbody" )[ 0 ] || elem;
	}

	return elem;
}

// Replace/restore the type attribute of script elements for safe DOM manipulation
function disableScript( elem ) {
	elem.type = ( elem.getAttribute( "type" ) !== null ) + "/" + elem.type;
	return elem;
}
function restoreScript( elem ) {
	if ( ( elem.type || "" ).slice( 0, 5 ) === "true/" ) {
		elem.type = elem.type.slice( 5 );
	} else {
		elem.removeAttribute( "type" );
	}

	return elem;
}

function cloneCopyEvent( src, dest ) {
	var i, l, type, pdataOld, pdataCur, udataOld, udataCur, events;

	if ( dest.nodeType !== 1 ) {
		return;
	}

	// 1. Copy private data: events, handlers, etc.
	if ( dataPriv.hasData( src ) ) {
		pdataOld = dataPriv.access( src );
		pdataCur = dataPriv.set( dest, pdataOld );
		events = pdataOld.events;

		if ( events ) {
			delete pdataCur.handle;
			pdataCur.events = {};

			for ( type in events ) {
				for ( i = 0, l = events[ type ].length; i < l; i++ ) {
					jQuery.event.add( dest, type, events[ type ][ i ] );
				}
			}
		}
	}

	// 2. Copy user data
	if ( dataUser.hasData( src ) ) {
		udataOld = dataUser.access( src );
		udataCur = jQuery.extend( {}, udataOld );

		dataUser.set( dest, udataCur );
	}
}

// Fix IE bugs, see support tests
function fixInput( src, dest ) {
	var nodeName = dest.nodeName.toLowerCase();

	// Fails to persist the checked state of a cloned checkbox or radio button.
	if ( nodeName === "input" && rcheckableType.test( src.type ) ) {
		dest.checked = src.checked;

	// Fails to return the selected option to the default selected state when cloning options
	} else if ( nodeName === "input" || nodeName === "textarea" ) {
		dest.defaultValue = src.defaultValue;
	}
}

function domManip( collection, args, callback, ignored ) {

	// Flatten any nested arrays
	args = concat.apply( [], args );

	var fragment, first, scripts, hasScripts, node, doc,
		i = 0,
		l = collection.length,
		iNoClone = l - 1,
		value = args[ 0 ],
		valueIsFunction = isFunction( value );

	// We can't cloneNode fragments that contain checked, in WebKit
	if ( valueIsFunction ||
			( l > 1 && typeof value === "string" &&
				!support.checkClone && rchecked.test( value ) ) ) {
		return collection.each( function( index ) {
			var self = collection.eq( index );
			if ( valueIsFunction ) {
				args[ 0 ] = value.call( this, index, self.html() );
			}
			domManip( self, args, callback, ignored );
		} );
	}

	if ( l ) {
		fragment = buildFragment( args, collection[ 0 ].ownerDocument, false, collection, ignored );
		first = fragment.firstChild;

		if ( fragment.childNodes.length === 1 ) {
			fragment = first;
		}

		// Require either new content or an interest in ignored elements to invoke the callback
		if ( first || ignored ) {
			scripts = jQuery.map( getAll( fragment, "script" ), disableScript );
			hasScripts = scripts.length;

			// Use the original fragment for the last item
			// instead of the first because it can end up
			// being emptied incorrectly in certain situations (#8070).
			for ( ; i < l; i++ ) {
				node = fragment;

				if ( i !== iNoClone ) {
					node = jQuery.clone( node, true, true );

					// Keep references to cloned scripts for later restoration
					if ( hasScripts ) {

						// Support: Android <=4.0 only, PhantomJS 1 only
						// push.apply(_, arraylike) throws on ancient WebKit
						jQuery.merge( scripts, getAll( node, "script" ) );
					}
				}

				callback.call( collection[ i ], node, i );
			}

			if ( hasScripts ) {
				doc = scripts[ scripts.length - 1 ].ownerDocument;

				// Reenable scripts
				jQuery.map( scripts, restoreScript );

				// Evaluate executable scripts on first document insertion
				for ( i = 0; i < hasScripts; i++ ) {
					node = scripts[ i ];
					if ( rscriptType.test( node.type || "" ) &&
						!dataPriv.access( node, "globalEval" ) &&
						jQuery.contains( doc, node ) ) {

						if ( node.src && ( node.type || "" ).toLowerCase()  !== "module" ) {

							// Optional AJAX dependency, but won't run scripts if not present
							if ( jQuery._evalUrl ) {
								jQuery._evalUrl( node.src );
							}
						} else {
							DOMEval( node.textContent.replace( rcleanScript, "" ), doc, node );
						}
					}
				}
			}
		}
	}

	return collection;
}

function remove( elem, selector, keepData ) {
	var node,
		nodes = selector ? jQuery.filter( selector, elem ) : elem,
		i = 0;

	for ( ; ( node = nodes[ i ] ) != null; i++ ) {
		if ( !keepData && node.nodeType === 1 ) {
			jQuery.cleanData( getAll( node ) );
		}

		if ( node.parentNode ) {
			if ( keepData && jQuery.contains( node.ownerDocument, node ) ) {
				setGlobalEval( getAll( node, "script" ) );
			}
			node.parentNode.removeChild( node );
		}
	}

	return elem;
}

jQuery.extend( {
	htmlPrefilter: function( html ) {
		return html.replace( rxhtmlTag, "<$1></$2>" );
	},

	clone: function( elem, dataAndEvents, deepDataAndEvents ) {
		var i, l, srcElements, destElements,
			clone = elem.cloneNode( true ),
			inPage = jQuery.contains( elem.ownerDocument, elem );

		// Fix IE cloning issues
		if ( !support.noCloneChecked && ( elem.nodeType === 1 || elem.nodeType === 11 ) &&
				!jQuery.isXMLDoc( elem ) ) {

			// We eschew Sizzle here for performance reasons: https://jsperf.com/getall-vs-sizzle/2
			destElements = getAll( clone );
			srcElements = getAll( elem );

			for ( i = 0, l = srcElements.length; i < l; i++ ) {
				fixInput( srcElements[ i ], destElements[ i ] );
			}
		}

		// Copy the events from the original to the clone
		if ( dataAndEvents ) {
			if ( deepDataAndEvents ) {
				srcElements = srcElements || getAll( elem );
				destElements = destElements || getAll( clone );

				for ( i = 0, l = srcElements.length; i < l; i++ ) {
					cloneCopyEvent( srcElements[ i ], destElements[ i ] );
				}
			} else {
				cloneCopyEvent( elem, clone );
			}
		}

		// Preserve script evaluation history
		destElements = getAll( clone, "script" );
		if ( destElements.length > 0 ) {
			setGlobalEval( destElements, !inPage && getAll( elem, "script" ) );
		}

		// Return the cloned set
		return clone;
	},

	cleanData: function( elems ) {
		var data, elem, type,
			special = jQuery.event.special,
			i = 0;

		for ( ; ( elem = elems[ i ] ) !== undefined; i++ ) {
			if ( acceptData( elem ) ) {
				if ( ( data = elem[ dataPriv.expando ] ) ) {
					if ( data.events ) {
						for ( type in data.events ) {
							if ( special[ type ] ) {
								jQuery.event.remove( elem, type );

							// This is a shortcut to avoid jQuery.event.remove's overhead
							} else {
								jQuery.removeEvent( elem, type, data.handle );
							}
						}
					}

					// Support: Chrome <=35 - 45+
					// Assign undefined instead of using delete, see Data#remove
					elem[ dataPriv.expando ] = undefined;
				}
				if ( elem[ dataUser.expando ] ) {

					// Support: Chrome <=35 - 45+
					// Assign undefined instead of using delete, see Data#remove
					elem[ dataUser.expando ] = undefined;
				}
			}
		}
	}
} );

jQuery.fn.extend( {
	detach: function( selector ) {
		return remove( this, selector, true );
	},

	remove: function( selector ) {
		return remove( this, selector );
	},

	text: function( value ) {
		return access( this, function( value ) {
			return value === undefined ?
				jQuery.text( this ) :
				this.empty().each( function() {
					if ( this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9 ) {
						this.textContent = value;
					}
				} );
		}, null, value, arguments.length );
	},

	append: function() {
		return domManip( this, arguments, function( elem ) {
			if ( this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9 ) {
				var target = manipulationTarget( this, elem );
				target.appendChild( elem );
			}
		} );
	},

	prepend: function() {
		return domManip( this, arguments, function( elem ) {
			if ( this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9 ) {
				var target = manipulationTarget( this, elem );
				target.insertBefore( elem, target.firstChild );
			}
		} );
	},

	before: function() {
		return domManip( this, arguments, function( elem ) {
			if ( this.parentNode ) {
				this.parentNode.insertBefore( elem, this );
			}
		} );
	},

	after: function() {
		return domManip( this, arguments, function( elem ) {
			if ( this.parentNode ) {
				this.parentNode.insertBefore( elem, this.nextSibling );
			}
		} );
	},

	empty: function() {
		var elem,
			i = 0;

		for ( ; ( elem = this[ i ] ) != null; i++ ) {
			if ( elem.nodeType === 1 ) {

				// Prevent memory leaks
				jQuery.cleanData( getAll( elem, false ) );

				// Remove any remaining nodes
				elem.textContent = "";
			}
		}

		return this;
	},

	clone: function( dataAndEvents, deepDataAndEvents ) {
		dataAndEvents = dataAndEvents == null ? false : dataAndEvents;
		deepDataAndEvents = deepDataAndEvents == null ? dataAndEvents : deepDataAndEvents;

		return this.map( function() {
			return jQuery.clone( this, dataAndEvents, deepDataAndEvents );
		} );
	},

	html: function( value ) {
		return access( this, function( value ) {
			var elem = this[ 0 ] || {},
				i = 0,
				l = this.length;

			if ( value === undefined && elem.nodeType === 1 ) {
				return elem.innerHTML;
			}

			// See if we can take a shortcut and just use innerHTML
			if ( typeof value === "string" && !rnoInnerhtml.test( value ) &&
				!wrapMap[ ( rtagName.exec( value ) || [ "", "" ] )[ 1 ].toLowerCase() ] ) {

				value = jQuery.htmlPrefilter( value );

				try {
					for ( ; i < l; i++ ) {
						elem = this[ i ] || {};

						// Remove element nodes and prevent memory leaks
						if ( elem.nodeType === 1 ) {
							jQuery.cleanData( getAll( elem, false ) );
							elem.innerHTML = value;
						}
					}

					elem = 0;

				// If using innerHTML throws an exception, use the fallback method
				} catch ( e ) {}
			}

			if ( elem ) {
				this.empty().append( value );
			}
		}, null, value, arguments.length );
	},

	replaceWith: function() {
		var ignored = [];

		// Make the changes, replacing each non-ignored context element with the new content
		return domManip( this, arguments, function( elem ) {
			var parent = this.parentNode;

			if ( jQuery.inArray( this, ignored ) < 0 ) {
				jQuery.cleanData( getAll( this ) );
				if ( parent ) {
					parent.replaceChild( elem, this );
				}
			}

		// Force callback invocation
		}, ignored );
	}
} );

jQuery.each( {
	appendTo: "append",
	prependTo: "prepend",
	insertBefore: "before",
	insertAfter: "after",
	replaceAll: "replaceWith"
}, function( name, original ) {
	jQuery.fn[ name ] = function( selector ) {
		var elems,
			ret = [],
			insert = jQuery( selector ),
			last = insert.length - 1,
			i = 0;

		for ( ; i <= last; i++ ) {
			elems = i === last ? this : this.clone( true );
			jQuery( insert[ i ] )[ original ]( elems );

			// Support: Android <=4.0 only, PhantomJS 1 only
			// .get() because push.apply(_, arraylike) throws on ancient WebKit
			push.apply( ret, elems.get() );
		}

		return this.pushStack( ret );
	};
} );
var rnumnonpx = new RegExp( "^(" + pnum + ")(?!px)[a-z%]+$", "i" );

var getStyles = function( elem ) {

		// Support: IE <=11 only, Firefox <=30 (#15098, #14150)
		// IE throws on elements created in popups
		// FF meanwhile throws on frame elements through "defaultView.getComputedStyle"
		var view = elem.ownerDocument.defaultView;

		if ( !view || !view.opener ) {
			view = window;
		}

		return view.getComputedStyle( elem );
	};

var rboxStyle = new RegExp( cssExpand.join( "|" ), "i" );



( function() {

	// Executing both pixelPosition & boxSizingReliable tests require only one layout
	// so they're executed at the same time to save the second computation.
	function computeStyleTests() {

		// This is a singleton, we need to execute it only once
		if ( !div ) {
			return;
		}

		container.style.cssText = "position:absolute;left:-11111px;width:60px;" +
			"margin-top:1px;padding:0;border:0";
		div.style.cssText =
			"position:relative;display:block;box-sizing:border-box;overflow:scroll;" +
			"margin:auto;border:1px;padding:1px;" +
			"width:60%;top:1%";
		documentElement.appendChild( container ).appendChild( div );

		var divStyle = window.getComputedStyle( div );
		pixelPositionVal = divStyle.top !== "1%";

		// Support: Android 4.0 - 4.3 only, Firefox <=3 - 44
		reliableMarginLeftVal = roundPixelMeasures( divStyle.marginLeft ) === 12;

		// Support: Android 4.0 - 4.3 only, Safari <=9.1 - 10.1, iOS <=7.0 - 9.3
		// Some styles come back with percentage values, even though they shouldn't
		div.style.right = "60%";
		pixelBoxStylesVal = roundPixelMeasures( divStyle.right ) === 36;

		// Support: IE 9 - 11 only
		// Detect misreporting of content dimensions for box-sizing:border-box elements
		boxSizingReliableVal = roundPixelMeasures( divStyle.width ) === 36;

		// Support: IE 9 only
		// Detect overflow:scroll screwiness (gh-3699)
		div.style.position = "absolute";
		scrollboxSizeVal = div.offsetWidth === 36 || "absolute";

		documentElement.removeChild( container );

		// Nullify the div so it wouldn't be stored in the memory and
		// it will also be a sign that checks already performed
		div = null;
	}

	function roundPixelMeasures( measure ) {
		return Math.round( parseFloat( measure ) );
	}

	var pixelPositionVal, boxSizingReliableVal, scrollboxSizeVal, pixelBoxStylesVal,
		reliableMarginLeftVal,
		container = document.createElement( "div" ),
		div = document.createElement( "div" );

	// Finish early in limited (non-browser) environments
	if ( !div.style ) {
		return;
	}

	// Support: IE <=9 - 11 only
	// Style of cloned element affects source element cloned (#8908)
	div.style.backgroundClip = "content-box";
	div.cloneNode( true ).style.backgroundClip = "";
	support.clearCloneStyle = div.style.backgroundClip === "content-box";

	jQuery.extend( support, {
		boxSizingReliable: function() {
			computeStyleTests();
			return boxSizingReliableVal;
		},
		pixelBoxStyles: function() {
			computeStyleTests();
			return pixelBoxStylesVal;
		},
		pixelPosition: function() {
			computeStyleTests();
			return pixelPositionVal;
		},
		reliableMarginLeft: function() {
			computeStyleTests();
			return reliableMarginLeftVal;
		},
		scrollboxSize: function() {
			computeStyleTests();
			return scrollboxSizeVal;
		}
	} );
} )();


function curCSS( elem, name, computed ) {
	var width, minWidth, maxWidth, ret,

		// Support: Firefox 51+
		// Retrieving style before computed somehow
		// fixes an issue with getting wrong values
		// on detached elements
		style = elem.style;

	computed = computed || getStyles( elem );

	// getPropertyValue is needed for:
	//   .css('filter') (IE 9 only, #12537)
	//   .css('--customProperty) (#3144)
	if ( computed ) {
		ret = computed.getPropertyValue( name ) || computed[ name ];

		if ( ret === "" && !jQuery.contains( elem.ownerDocument, elem ) ) {
			ret = jQuery.style( elem, name );
		}

		// A tribute to the "awesome hack by Dean Edwards"
		// Android Browser returns percentage for some values,
		// but width seems to be reliably pixels.
		// This is against the CSSOM draft spec:
		// https://drafts.csswg.org/cssom/#resolved-values
		if ( !support.pixelBoxStyles() && rnumnonpx.test( ret ) && rboxStyle.test( name ) ) {

			// Remember the original values
			width = style.width;
			minWidth = style.minWidth;
			maxWidth = style.maxWidth;

			// Put in the new values to get a computed value out
			style.minWidth = style.maxWidth = style.width = ret;
			ret = computed.width;

			// Revert the changed values
			style.width = width;
			style.minWidth = minWidth;
			style.maxWidth = maxWidth;
		}
	}

	return ret !== undefined ?

		// Support: IE <=9 - 11 only
		// IE returns zIndex value as an integer.
		ret + "" :
		ret;
}


function addGetHookIf( conditionFn, hookFn ) {

	// Define the hook, we'll check on the first run if it's really needed.
	return {
		get: function() {
			if ( conditionFn() ) {

				// Hook not needed (or it's not possible to use it due
				// to missing dependency), remove it.
				delete this.get;
				return;
			}

			// Hook needed; redefine it so that the support test is not executed again.
			return ( this.get = hookFn ).apply( this, arguments );
		}
	};
}


var

	// Swappable if display is none or starts with table
	// except "table", "table-cell", or "table-caption"
	// See here for display values: https://developer.mozilla.org/en-US/docs/CSS/display
	rdisplayswap = /^(none|table(?!-c[ea]).+)/,
	rcustomProp = /^--/,
	cssShow = { position: "absolute", visibility: "hidden", display: "block" },
	cssNormalTransform = {
		letterSpacing: "0",
		fontWeight: "400"
	},

	cssPrefixes = [ "Webkit", "Moz", "ms" ],
	emptyStyle = document.createElement( "div" ).style;

// Return a css property mapped to a potentially vendor prefixed property
function vendorPropName( name ) {

	// Shortcut for names that are not vendor prefixed
	if ( name in emptyStyle ) {
		return name;
	}

	// Check for vendor prefixed names
	var capName = name[ 0 ].toUpperCase() + name.slice( 1 ),
		i = cssPrefixes.length;

	while ( i-- ) {
		name = cssPrefixes[ i ] + capName;
		if ( name in emptyStyle ) {
			return name;
		}
	}
}

// Return a property mapped along what jQuery.cssProps suggests or to
// a vendor prefixed property.
function finalPropName( name ) {
	var ret = jQuery.cssProps[ name ];
	if ( !ret ) {
		ret = jQuery.cssProps[ name ] = vendorPropName( name ) || name;
	}
	return ret;
}

function setPositiveNumber( elem, value, subtract ) {

	// Any relative (+/-) values have already been
	// normalized at this point
	var matches = rcssNum.exec( value );
	return matches ?

		// Guard against undefined "subtract", e.g., when used as in cssHooks
		Math.max( 0, matches[ 2 ] - ( subtract || 0 ) ) + ( matches[ 3 ] || "px" ) :
		value;
}

function boxModelAdjustment( elem, dimension, box, isBorderBox, styles, computedVal ) {
	var i = dimension === "width" ? 1 : 0,
		extra = 0,
		delta = 0;

	// Adjustment may not be necessary
	if ( box === ( isBorderBox ? "border" : "content" ) ) {
		return 0;
	}

	for ( ; i < 4; i += 2 ) {

		// Both box models exclude margin
		if ( box === "margin" ) {
			delta += jQuery.css( elem, box + cssExpand[ i ], true, styles );
		}

		// If we get here with a content-box, we're seeking "padding" or "border" or "margin"
		if ( !isBorderBox ) {

			// Add padding
			delta += jQuery.css( elem, "padding" + cssExpand[ i ], true, styles );

			// For "border" or "margin", add border
			if ( box !== "padding" ) {
				delta += jQuery.css( elem, "border" + cssExpand[ i ] + "Width", true, styles );

			// But still keep track of it otherwise
			} else {
				extra += jQuery.css( elem, "border" + cssExpand[ i ] + "Width", true, styles );
			}

		// If we get here with a border-box (content + padding + border), we're seeking "content" or
		// "padding" or "margin"
		} else {

			// For "content", subtract padding
			if ( box === "content" ) {
				delta -= jQuery.css( elem, "padding" + cssExpand[ i ], true, styles );
			}

			// For "content" or "padding", subtract border
			if ( box !== "margin" ) {
				delta -= jQuery.css( elem, "border" + cssExpand[ i ] + "Width", true, styles );
			}
		}
	}

	// Account for positive content-box scroll gutter when requested by providing computedVal
	if ( !isBorderBox && computedVal >= 0 ) {

		// offsetWidth/offsetHeight is a rounded sum of content, padding, scroll gutter, and border
		// Assuming integer scroll gutter, subtract the rest and round down
		delta += Math.max( 0, Math.ceil(
			elem[ "offset" + dimension[ 0 ].toUpperCase() + dimension.slice( 1 ) ] -
			computedVal -
			delta -
			extra -
			0.5
		) );
	}

	return delta;
}

function getWidthOrHeight( elem, dimension, extra ) {

	// Start with computed style
	var styles = getStyles( elem ),
		val = curCSS( elem, dimension, styles ),
		isBorderBox = jQuery.css( elem, "boxSizing", false, styles ) === "border-box",
		valueIsBorderBox = isBorderBox;

	// Support: Firefox <=54
	// Return a confounding non-pixel value or feign ignorance, as appropriate.
	if ( rnumnonpx.test( val ) ) {
		if ( !extra ) {
			return val;
		}
		val = "auto";
	}

	// Check for style in case a browser which returns unreliable values
	// for getComputedStyle silently falls back to the reliable elem.style
	valueIsBorderBox = valueIsBorderBox &&
		( support.boxSizingReliable() || val === elem.style[ dimension ] );

	// Fall back to offsetWidth/offsetHeight when value is "auto"
	// This happens for inline elements with no explicit setting (gh-3571)
	// Support: Android <=4.1 - 4.3 only
	// Also use offsetWidth/offsetHeight for misreported inline dimensions (gh-3602)
	if ( val === "auto" ||
		!parseFloat( val ) && jQuery.css( elem, "display", false, styles ) === "inline" ) {

		val = elem[ "offset" + dimension[ 0 ].toUpperCase() + dimension.slice( 1 ) ];

		// offsetWidth/offsetHeight provide border-box values
		valueIsBorderBox = true;
	}

	// Normalize "" and auto
	val = parseFloat( val ) || 0;

	// Adjust for the element's box model
	return ( val +
		boxModelAdjustment(
			elem,
			dimension,
			extra || ( isBorderBox ? "border" : "content" ),
			valueIsBorderBox,
			styles,

			// Provide the current computed size to request scroll gutter calculation (gh-3589)
			val
		)
	) + "px";
}

jQuery.extend( {

	// Add in style property hooks for overriding the default
	// behavior of getting and setting a style property
	cssHooks: {
		opacity: {
			get: function( elem, computed ) {
				if ( computed ) {

					// We should always get a number back from opacity
					var ret = curCSS( elem, "opacity" );
					return ret === "" ? "1" : ret;
				}
			}
		}
	},

	// Don't automatically add "px" to these possibly-unitless properties
	cssNumber: {
		"animationIterationCount": true,
		"columnCount": true,
		"fillOpacity": true,
		"flexGrow": true,
		"flexShrink": true,
		"fontWeight": true,
		"lineHeight": true,
		"opacity": true,
		"order": true,
		"orphans": true,
		"widows": true,
		"zIndex": true,
		"zoom": true
	},

	// Add in properties whose names you wish to fix before
	// setting or getting the value
	cssProps: {},

	// Get and set the style property on a DOM Node
	style: function( elem, name, value, extra ) {

		// Don't set styles on text and comment nodes
		if ( !elem || elem.nodeType === 3 || elem.nodeType === 8 || !elem.style ) {
			return;
		}

		// Make sure that we're working with the right name
		var ret, type, hooks,
			origName = camelCase( name ),
			isCustomProp = rcustomProp.test( name ),
			style = elem.style;

		// Make sure that we're working with the right name. We don't
		// want to query the value if it is a CSS custom property
		// since they are user-defined.
		if ( !isCustomProp ) {
			name = finalPropName( origName );
		}

		// Gets hook for the prefixed version, then unprefixed version
		hooks = jQuery.cssHooks[ name ] || jQuery.cssHooks[ origName ];

		// Check if we're setting a value
		if ( value !== undefined ) {
			type = typeof value;

			// Convert "+=" or "-=" to relative numbers (#7345)
			if ( type === "string" && ( ret = rcssNum.exec( value ) ) && ret[ 1 ] ) {
				value = adjustCSS( elem, name, ret );

				// Fixes bug #9237
				type = "number";
			}

			// Make sure that null and NaN values aren't set (#7116)
			if ( value == null || value !== value ) {
				return;
			}

			// If a number was passed in, add the unit (except for certain CSS properties)
			if ( type === "number" ) {
				value += ret && ret[ 3 ] || ( jQuery.cssNumber[ origName ] ? "" : "px" );
			}

			// background-* props affect original clone's values
			if ( !support.clearCloneStyle && value === "" && name.indexOf( "background" ) === 0 ) {
				style[ name ] = "inherit";
			}

			// If a hook was provided, use that value, otherwise just set the specified value
			if ( !hooks || !( "set" in hooks ) ||
				( value = hooks.set( elem, value, extra ) ) !== undefined ) {

				if ( isCustomProp ) {
					style.setProperty( name, value );
				} else {
					style[ name ] = value;
				}
			}

		} else {

			// If a hook was provided get the non-computed value from there
			if ( hooks && "get" in hooks &&
				( ret = hooks.get( elem, false, extra ) ) !== undefined ) {

				return ret;
			}

			// Otherwise just get the value from the style object
			return style[ name ];
		}
	},

	css: function( elem, name, extra, styles ) {
		var val, num, hooks,
			origName = camelCase( name ),
			isCustomProp = rcustomProp.test( name );

		// Make sure that we're working with the right name. We don't
		// want to modify the value if it is a CSS custom property
		// since they are user-defined.
		if ( !isCustomProp ) {
			name = finalPropName( origName );
		}

		// Try prefixed name followed by the unprefixed name
		hooks = jQuery.cssHooks[ name ] || jQuery.cssHooks[ origName ];

		// If a hook was provided get the computed value from there
		if ( hooks && "get" in hooks ) {
			val = hooks.get( elem, true, extra );
		}

		// Otherwise, if a way to get the computed value exists, use that
		if ( val === undefined ) {
			val = curCSS( elem, name, styles );
		}

		// Convert "normal" to computed value
		if ( val === "normal" && name in cssNormalTransform ) {
			val = cssNormalTransform[ name ];
		}

		// Make numeric if forced or a qualifier was provided and val looks numeric
		if ( extra === "" || extra ) {
			num = parseFloat( val );
			return extra === true || isFinite( num ) ? num || 0 : val;
		}

		return val;
	}
} );

jQuery.each( [ "height", "width" ], function( i, dimension ) {
	jQuery.cssHooks[ dimension ] = {
		get: function( elem, computed, extra ) {
			if ( computed ) {

				// Certain elements can have dimension info if we invisibly show them
				// but it must have a current display style that would benefit
				return rdisplayswap.test( jQuery.css( elem, "display" ) ) &&

					// Support: Safari 8+
					// Table columns in Safari have non-zero offsetWidth & zero
					// getBoundingClientRect().width unless display is changed.
					// Support: IE <=11 only
					// Running getBoundingClientRect on a disconnected node
					// in IE throws an error.
					( !elem.getClientRects().length || !elem.getBoundingClientRect().width ) ?
						swap( elem, cssShow, function() {
							return getWidthOrHeight( elem, dimension, extra );
						} ) :
						getWidthOrHeight( elem, dimension, extra );
			}
		},

		set: function( elem, value, extra ) {
			var matches,
				styles = getStyles( elem ),
				isBorderBox = jQuery.css( elem, "boxSizing", false, styles ) === "border-box",
				subtract = extra && boxModelAdjustment(
					elem,
					dimension,
					extra,
					isBorderBox,
					styles
				);

			// Account for unreliable border-box dimensions by comparing offset* to computed and
			// faking a content-box to get border and padding (gh-3699)
			if ( isBorderBox && support.scrollboxSize() === styles.position ) {
				subtract -= Math.ceil(
					elem[ "offset" + dimension[ 0 ].toUpperCase() + dimension.slice( 1 ) ] -
					parseFloat( styles[ dimension ] ) -
					boxModelAdjustment( elem, dimension, "border", false, styles ) -
					0.5
				);
			}

			// Convert to pixels if value adjustment is needed
			if ( subtract && ( matches = rcssNum.exec( value ) ) &&
				( matches[ 3 ] || "px" ) !== "px" ) {

				elem.style[ dimension ] = value;
				value = jQuery.css( elem, dimension );
			}

			return setPositiveNumber( elem, value, subtract );
		}
	};
} );

jQuery.cssHooks.marginLeft = addGetHookIf( support.reliableMarginLeft,
	function( elem, computed ) {
		if ( computed ) {
			return ( parseFloat( curCSS( elem, "marginLeft" ) ) ||
				elem.getBoundingClientRect().left -
					swap( elem, { marginLeft: 0 }, function() {
						return elem.getBoundingClientRect().left;
					} )
				) + "px";
		}
	}
);

// These hooks are used by animate to expand properties
jQuery.each( {
	margin: "",
	padding: "",
	border: "Width"
}, function( prefix, suffix ) {
	jQuery.cssHooks[ prefix + suffix ] = {
		expand: function( value ) {
			var i = 0,
				expanded = {},

				// Assumes a single number if not a string
				parts = typeof value === "string" ? value.split( " " ) : [ value ];

			for ( ; i < 4; i++ ) {
				expanded[ prefix + cssExpand[ i ] + suffix ] =
					parts[ i ] || parts[ i - 2 ] || parts[ 0 ];
			}

			return expanded;
		}
	};

	if ( prefix !== "margin" ) {
		jQuery.cssHooks[ prefix + suffix ].set = setPositiveNumber;
	}
} );

jQuery.fn.extend( {
	css: function( name, value ) {
		return access( this, function( elem, name, value ) {
			var styles, len,
				map = {},
				i = 0;

			if ( Array.isArray( name ) ) {
				styles = getStyles( elem );
				len = name.length;

				for ( ; i < len; i++ ) {
					map[ name[ i ] ] = jQuery.css( elem, name[ i ], false, styles );
				}

				return map;
			}

			return value !== undefined ?
				jQuery.style( elem, name, value ) :
				jQuery.css( elem, name );
		}, name, value, arguments.length > 1 );
	}
} );


function Tween( elem, options, prop, end, easing ) {
	return new Tween.prototype.init( elem, options, prop, end, easing );
}
jQuery.Tween = Tween;

Tween.prototype = {
	constructor: Tween,
	init: function( elem, options, prop, end, easing, unit ) {
		this.elem = elem;
		this.prop = prop;
		this.easing = easing || jQuery.easing._default;
		this.options = options;
		this.start = this.now = this.cur();
		this.end = end;
		this.unit = unit || ( jQuery.cssNumber[ prop ] ? "" : "px" );
	},
	cur: function() {
		var hooks = Tween.propHooks[ this.prop ];

		return hooks && hooks.get ?
			hooks.get( this ) :
			Tween.propHooks._default.get( this );
	},
	run: function( percent ) {
		var eased,
			hooks = Tween.propHooks[ this.prop ];

		if ( this.options.duration ) {
			this.pos = eased = jQuery.easing[ this.easing ](
				percent, this.options.duration * percent, 0, 1, this.options.duration
			);
		} else {
			this.pos = eased = percent;
		}
		this.now = ( this.end - this.start ) * eased + this.start;

		if ( this.options.step ) {
			this.options.step.call( this.elem, this.now, this );
		}

		if ( hooks && hooks.set ) {
			hooks.set( this );
		} else {
			Tween.propHooks._default.set( this );
		}
		return this;
	}
};

Tween.prototype.init.prototype = Tween.prototype;

Tween.propHooks = {
	_default: {
		get: function( tween ) {
			var result;

			// Use a property on the element directly when it is not a DOM element,
			// or when there is no matching style property that exists.
			if ( tween.elem.nodeType !== 1 ||
				tween.elem[ tween.prop ] != null && tween.elem.style[ tween.prop ] == null ) {
				return tween.elem[ tween.prop ];
			}

			// Passing an empty string as a 3rd parameter to .css will automatically
			// attempt a parseFloat and fallback to a string if the parse fails.
			// Simple values such as "10px" are parsed to Float;
			// complex values such as "rotate(1rad)" are returned as-is.
			result = jQuery.css( tween.elem, tween.prop, "" );

			// Empty strings, null, undefined and "auto" are converted to 0.
			return !result || result === "auto" ? 0 : result;
		},
		set: function( tween ) {

			// Use step hook for back compat.
			// Use cssHook if its there.
			// Use .style if available and use plain properties where available.
			if ( jQuery.fx.step[ tween.prop ] ) {
				jQuery.fx.step[ tween.prop ]( tween );
			} else if ( tween.elem.nodeType === 1 &&
				( tween.elem.style[ jQuery.cssProps[ tween.prop ] ] != null ||
					jQuery.cssHooks[ tween.prop ] ) ) {
				jQuery.style( tween.elem, tween.prop, tween.now + tween.unit );
			} else {
				tween.elem[ tween.prop ] = tween.now;
			}
		}
	}
};

// Support: IE <=9 only
// Panic based approach to setting things on disconnected nodes
Tween.propHooks.scrollTop = Tween.propHooks.scrollLeft = {
	set: function( tween ) {
		if ( tween.elem.nodeType && tween.elem.parentNode ) {
			tween.elem[ tween.prop ] = tween.now;
		}
	}
};

jQuery.easing = {
	linear: function( p ) {
		return p;
	},
	swing: function( p ) {
		return 0.5 - Math.cos( p * Math.PI ) / 2;
	},
	_default: "swing"
};

jQuery.fx = Tween.prototype.init;

// Back compat <1.8 extension point
jQuery.fx.step = {};




var
	fxNow, inProgress,
	rfxtypes = /^(?:toggle|show|hide)$/,
	rrun = /queueHooks$/;

function schedule() {
	if ( inProgress ) {
		if ( document.hidden === false && window.requestAnimationFrame ) {
			window.requestAnimationFrame( schedule );
		} else {
			window.setTimeout( schedule, jQuery.fx.interval );
		}

		jQuery.fx.tick();
	}
}

// Animations created synchronously will run synchronously
function createFxNow() {
	window.setTimeout( function() {
		fxNow = undefined;
	} );
	return ( fxNow = Date.now() );
}

// Generate parameters to create a standard animation
function genFx( type, includeWidth ) {
	var which,
		i = 0,
		attrs = { height: type };

	// If we include width, step value is 1 to do all cssExpand values,
	// otherwise step value is 2 to skip over Left and Right
	includeWidth = includeWidth ? 1 : 0;
	for ( ; i < 4; i += 2 - includeWidth ) {
		which = cssExpand[ i ];
		attrs[ "margin" + which ] = attrs[ "padding" + which ] = type;
	}

	if ( includeWidth ) {
		attrs.opacity = attrs.width = type;
	}

	return attrs;
}

function createTween( value, prop, animation ) {
	var tween,
		collection = ( Animation.tweeners[ prop ] || [] ).concat( Animation.tweeners[ "*" ] ),
		index = 0,
		length = collection.length;
	for ( ; index < length; index++ ) {
		if ( ( tween = collection[ index ].call( animation, prop, value ) ) ) {

			// We're done with this property
			return tween;
		}
	}
}

function defaultPrefilter( elem, props, opts ) {
	var prop, value, toggle, hooks, oldfire, propTween, restoreDisplay, display,
		isBox = "width" in props || "height" in props,
		anim = this,
		orig = {},
		style = elem.style,
		hidden = elem.nodeType && isHiddenWithinTree( elem ),
		dataShow = dataPriv.get( elem, "fxshow" );

	// Queue-skipping animations hijack the fx hooks
	if ( !opts.queue ) {
		hooks = jQuery._queueHooks( elem, "fx" );
		if ( hooks.unqueued == null ) {
			hooks.unqueued = 0;
			oldfire = hooks.empty.fire;
			hooks.empty.fire = function() {
				if ( !hooks.unqueued ) {
					oldfire();
				}
			};
		}
		hooks.unqueued++;

		anim.always( function() {

			// Ensure the complete handler is called before this completes
			anim.always( function() {
				hooks.unqueued--;
				if ( !jQuery.queue( elem, "fx" ).length ) {
					hooks.empty.fire();
				}
			} );
		} );
	}

	// Detect show/hide animations
	for ( prop in props ) {
		value = props[ prop ];
		if ( rfxtypes.test( value ) ) {
			delete props[ prop ];
			toggle = toggle || value === "toggle";
			if ( value === ( hidden ? "hide" : "show" ) ) {

				// Pretend to be hidden if this is a "show" and
				// there is still data from a stopped show/hide
				if ( value === "show" && dataShow && dataShow[ prop ] !== undefined ) {
					hidden = true;

				// Ignore all other no-op show/hide data
				} else {
					continue;
				}
			}
			orig[ prop ] = dataShow && dataShow[ prop ] || jQuery.style( elem, prop );
		}
	}

	// Bail out if this is a no-op like .hide().hide()
	propTween = !jQuery.isEmptyObject( props );
	if ( !propTween && jQuery.isEmptyObject( orig ) ) {
		return;
	}

	// Restrict "overflow" and "display" styles during box animations
	if ( isBox && elem.nodeType === 1 ) {

		// Support: IE <=9 - 11, Edge 12 - 15
		// Record all 3 overflow attributes because IE does not infer the shorthand
		// from identically-valued overflowX and overflowY and Edge just mirrors
		// the overflowX value there.
		opts.overflow = [ style.overflow, style.overflowX, style.overflowY ];

		// Identify a display type, preferring old show/hide data over the CSS cascade
		restoreDisplay = dataShow && dataShow.display;
		if ( restoreDisplay == null ) {
			restoreDisplay = dataPriv.get( elem, "display" );
		}
		display = jQuery.css( elem, "display" );
		if ( display === "none" ) {
			if ( restoreDisplay ) {
				display = restoreDisplay;
			} else {

				// Get nonempty value(s) by temporarily forcing visibility
				showHide( [ elem ], true );
				restoreDisplay = elem.style.display || restoreDisplay;
				display = jQuery.css( elem, "display" );
				showHide( [ elem ] );
			}
		}

		// Animate inline elements as inline-block
		if ( display === "inline" || display === "inline-block" && restoreDisplay != null ) {
			if ( jQuery.css( elem, "float" ) === "none" ) {

				// Restore the original display value at the end of pure show/hide animations
				if ( !propTween ) {
					anim.done( function() {
						style.display = restoreDisplay;
					} );
					if ( restoreDisplay == null ) {
						display = style.display;
						restoreDisplay = display === "none" ? "" : display;
					}
				}
				style.display = "inline-block";
			}
		}
	}

	if ( opts.overflow ) {
		style.overflow = "hidden";
		anim.always( function() {
			style.overflow = opts.overflow[ 0 ];
			style.overflowX = opts.overflow[ 1 ];
			style.overflowY = opts.overflow[ 2 ];
		} );
	}

	// Implement show/hide animations
	propTween = false;
	for ( prop in orig ) {

		// General show/hide setup for this element animation
		if ( !propTween ) {
			if ( dataShow ) {
				if ( "hidden" in dataShow ) {
					hidden = dataShow.hidden;
				}
			} else {
				dataShow = dataPriv.access( elem, "fxshow", { display: restoreDisplay } );
			}

			// Store hidden/visible for toggle so `.stop().toggle()` "reverses"
			if ( toggle ) {
				dataShow.hidden = !hidden;
			}

			// Show elements before animating them
			if ( hidden ) {
				showHide( [ elem ], true );
			}

			/* eslint-disable no-loop-func */

			anim.done( function() {

			/* eslint-enable no-loop-func */

				// The final step of a "hide" animation is actually hiding the element
				if ( !hidden ) {
					showHide( [ elem ] );
				}
				dataPriv.remove( elem, "fxshow" );
				for ( prop in orig ) {
					jQuery.style( elem, prop, orig[ prop ] );
				}
			} );
		}

		// Per-property setup
		propTween = createTween( hidden ? dataShow[ prop ] : 0, prop, anim );
		if ( !( prop in dataShow ) ) {
			dataShow[ prop ] = propTween.start;
			if ( hidden ) {
				propTween.end = propTween.start;
				propTween.start = 0;
			}
		}
	}
}

function propFilter( props, specialEasing ) {
	var index, name, easing, value, hooks;

	// camelCase, specialEasing and expand cssHook pass
	for ( index in props ) {
		name = camelCase( index );
		easing = specialEasing[ name ];
		value = props[ index ];
		if ( Array.isArray( value ) ) {
			easing = value[ 1 ];
			value = props[ index ] = value[ 0 ];
		}

		if ( index !== name ) {
			props[ name ] = value;
			delete props[ index ];
		}

		hooks = jQuery.cssHooks[ name ];
		if ( hooks && "expand" in hooks ) {
			value = hooks.expand( value );
			delete props[ name ];

			// Not quite $.extend, this won't overwrite existing keys.
			// Reusing 'index' because we have the correct "name"
			for ( index in value ) {
				if ( !( index in props ) ) {
					props[ index ] = value[ index ];
					specialEasing[ index ] = easing;
				}
			}
		} else {
			specialEasing[ name ] = easing;
		}
	}
}

function Animation( elem, properties, options ) {
	var result,
		stopped,
		index = 0,
		length = Animation.prefilters.length,
		deferred = jQuery.Deferred().always( function() {

			// Don't match elem in the :animated selector
			delete tick.elem;
		} ),
		tick = function() {
			if ( stopped ) {
				return false;
			}
			var currentTime = fxNow || createFxNow(),
				remaining = Math.max( 0, animation.startTime + animation.duration - currentTime ),

				// Support: Android 2.3 only
				// Archaic crash bug won't allow us to use `1 - ( 0.5 || 0 )` (#12497)
				temp = remaining / animation.duration || 0,
				percent = 1 - temp,
				index = 0,
				length = animation.tweens.length;

			for ( ; index < length; index++ ) {
				animation.tweens[ index ].run( percent );
			}

			deferred.notifyWith( elem, [ animation, percent, remaining ] );

			// If there's more to do, yield
			if ( percent < 1 && length ) {
				return remaining;
			}

			// If this was an empty animation, synthesize a final progress notification
			if ( !length ) {
				deferred.notifyWith( elem, [ animation, 1, 0 ] );
			}

			// Resolve the animation and report its conclusion
			deferred.resolveWith( elem, [ animation ] );
			return false;
		},
		animation = deferred.promise( {
			elem: elem,
			props: jQuery.extend( {}, properties ),
			opts: jQuery.extend( true, {
				specialEasing: {},
				easing: jQuery.easing._default
			}, options ),
			originalProperties: properties,
			originalOptions: options,
			startTime: fxNow || createFxNow(),
			duration: options.duration,
			tweens: [],
			createTween: function( prop, end ) {
				var tween = jQuery.Tween( elem, animation.opts, prop, end,
						animation.opts.specialEasing[ prop ] || animation.opts.easing );
				animation.tweens.push( tween );
				return tween;
			},
			stop: function( gotoEnd ) {
				var index = 0,

					// If we are going to the end, we want to run all the tweens
					// otherwise we skip this part
					length = gotoEnd ? animation.tweens.length : 0;
				if ( stopped ) {
					return this;
				}
				stopped = true;
				for ( ; index < length; index++ ) {
					animation.tweens[ index ].run( 1 );
				}

				// Resolve when we played the last frame; otherwise, reject
				if ( gotoEnd ) {
					deferred.notifyWith( elem, [ animation, 1, 0 ] );
					deferred.resolveWith( elem, [ animation, gotoEnd ] );
				} else {
					deferred.rejectWith( elem, [ animation, gotoEnd ] );
				}
				return this;
			}
		} ),
		props = animation.props;

	propFilter( props, animation.opts.specialEasing );

	for ( ; index < length; index++ ) {
		result = Animation.prefilters[ index ].call( animation, elem, props, animation.opts );
		if ( result ) {
			if ( isFunction( result.stop ) ) {
				jQuery._queueHooks( animation.elem, animation.opts.queue ).stop =
					result.stop.bind( result );
			}
			return result;
		}
	}

	jQuery.map( props, createTween, animation );

	if ( isFunction( animation.opts.start ) ) {
		animation.opts.start.call( elem, animation );
	}

	// Attach callbacks from options
	animation
		.progress( animation.opts.progress )
		.done( animation.opts.done, animation.opts.complete )
		.fail( animation.opts.fail )
		.always( animation.opts.always );

	jQuery.fx.timer(
		jQuery.extend( tick, {
			elem: elem,
			anim: animation,
			queue: animation.opts.queue
		} )
	);

	return animation;
}

jQuery.Animation = jQuery.extend( Animation, {

	tweeners: {
		"*": [ function( prop, value ) {
			var tween = this.createTween( prop, value );
			adjustCSS( tween.elem, prop, rcssNum.exec( value ), tween );
			return tween;
		} ]
	},

	tweener: function( props, callback ) {
		if ( isFunction( props ) ) {
			callback = props;
			props = [ "*" ];
		} else {
			props = props.match( rnothtmlwhite );
		}

		var prop,
			index = 0,
			length = props.length;

		for ( ; index < length; index++ ) {
			prop = props[ index ];
			Animation.tweeners[ prop ] = Animation.tweeners[ prop ] || [];
			Animation.tweeners[ prop ].unshift( callback );
		}
	},

	prefilters: [ defaultPrefilter ],

	prefilter: function( callback, prepend ) {
		if ( prepend ) {
			Animation.prefilters.unshift( callback );
		} else {
			Animation.prefilters.push( callback );
		}
	}
} );

jQuery.speed = function( speed, easing, fn ) {
	var opt = speed && typeof speed === "object" ? jQuery.extend( {}, speed ) : {
		complete: fn || !fn && easing ||
			isFunction( speed ) && speed,
		duration: speed,
		easing: fn && easing || easing && !isFunction( easing ) && easing
	};

	// Go to the end state if fx are off
	if ( jQuery.fx.off ) {
		opt.duration = 0;

	} else {
		if ( typeof opt.duration !== "number" ) {
			if ( opt.duration in jQuery.fx.speeds ) {
				opt.duration = jQuery.fx.speeds[ opt.duration ];

			} else {
				opt.duration = jQuery.fx.speeds._default;
			}
		}
	}

	// Normalize opt.queue - true/undefined/null -> "fx"
	if ( opt.queue == null || opt.queue === true ) {
		opt.queue = "fx";
	}

	// Queueing
	opt.old = opt.complete;

	opt.complete = function() {
		if ( isFunction( opt.old ) ) {
			opt.old.call( this );
		}

		if ( opt.queue ) {
			jQuery.dequeue( this, opt.queue );
		}
	};

	return opt;
};

jQuery.fn.extend( {
	fadeTo: function( speed, to, easing, callback ) {

		// Show any hidden elements after setting opacity to 0
		return this.filter( isHiddenWithinTree ).css( "opacity", 0 ).show()

			// Animate to the value specified
			.end().animate( { opacity: to }, speed, easing, callback );
	},
	animate: function( prop, speed, easing, callback ) {
		var empty = jQuery.isEmptyObject( prop ),
			optall = jQuery.speed( speed, easing, callback ),
			doAnimation = function() {

				// Operate on a copy of prop so per-property easing won't be lost
				var anim = Animation( this, jQuery.extend( {}, prop ), optall );

				// Empty animations, or finishing resolves immediately
				if ( empty || dataPriv.get( this, "finish" ) ) {
					anim.stop( true );
				}
			};
			doAnimation.finish = doAnimation;

		return empty || optall.queue === false ?
			this.each( doAnimation ) :
			this.queue( optall.queue, doAnimation );
	},
	stop: function( type, clearQueue, gotoEnd ) {
		var stopQueue = function( hooks ) {
			var stop = hooks.stop;
			delete hooks.stop;
			stop( gotoEnd );
		};

		if ( typeof type !== "string" ) {
			gotoEnd = clearQueue;
			clearQueue = type;
			type = undefined;
		}
		if ( clearQueue && type !== false ) {
			this.queue( type || "fx", [] );
		}

		return this.each( function() {
			var dequeue = true,
				index = type != null && type + "queueHooks",
				timers = jQuery.timers,
				data = dataPriv.get( this );

			if ( index ) {
				if ( data[ index ] && data[ index ].stop ) {
					stopQueue( data[ index ] );
				}
			} else {
				for ( index in data ) {
					if ( data[ index ] && data[ index ].stop && rrun.test( index ) ) {
						stopQueue( data[ index ] );
					}
				}
			}

			for ( index = timers.length; index--; ) {
				if ( timers[ index ].elem === this &&
					( type == null || timers[ index ].queue === type ) ) {

					timers[ index ].anim.stop( gotoEnd );
					dequeue = false;
					timers.splice( index, 1 );
				}
			}

			// Start the next in the queue if the last step wasn't forced.
			// Timers currently will call their complete callbacks, which
			// will dequeue but only if they were gotoEnd.
			if ( dequeue || !gotoEnd ) {
				jQuery.dequeue( this, type );
			}
		} );
	},
	finish: function( type ) {
		if ( type !== false ) {
			type = type || "fx";
		}
		return this.each( function() {
			var index,
				data = dataPriv.get( this ),
				queue = data[ type + "queue" ],
				hooks = data[ type + "queueHooks" ],
				timers = jQuery.timers,
				length = queue ? queue.length : 0;

			// Enable finishing flag on private data
			data.finish = true;

			// Empty the queue first
			jQuery.queue( this, type, [] );

			if ( hooks && hooks.stop ) {
				hooks.stop.call( this, true );
			}

			// Look for any active animations, and finish them
			for ( index = timers.length; index--; ) {
				if ( timers[ index ].elem === this && timers[ index ].queue === type ) {
					timers[ index ].anim.stop( true );
					timers.splice( index, 1 );
				}
			}

			// Look for any animations in the old queue and finish them
			for ( index = 0; index < length; index++ ) {
				if ( queue[ index ] && queue[ index ].finish ) {
					queue[ index ].finish.call( this );
				}
			}

			// Turn off finishing flag
			delete data.finish;
		} );
	}
} );

jQuery.each( [ "toggle", "show", "hide" ], function( i, name ) {
	var cssFn = jQuery.fn[ name ];
	jQuery.fn[ name ] = function( speed, easing, callback ) {
		return speed == null || typeof speed === "boolean" ?
			cssFn.apply( this, arguments ) :
			this.animate( genFx( name, true ), speed, easing, callback );
	};
} );

// Generate shortcuts for custom animations
jQuery.each( {
	slideDown: genFx( "show" ),
	slideUp: genFx( "hide" ),
	slideToggle: genFx( "toggle" ),
	fadeIn: { opacity: "show" },
	fadeOut: { opacity: "hide" },
	fadeToggle: { opacity: "toggle" }
}, function( name, props ) {
	jQuery.fn[ name ] = function( speed, easing, callback ) {
		return this.animate( props, speed, easing, callback );
	};
} );

jQuery.timers = [];
jQuery.fx.tick = function() {
	var timer,
		i = 0,
		timers = jQuery.timers;

	fxNow = Date.now();

	for ( ; i < timers.length; i++ ) {
		timer = timers[ i ];

		// Run the timer and safely remove it when done (allowing for external removal)
		if ( !timer() && timers[ i ] === timer ) {
			timers.splice( i--, 1 );
		}
	}

	if ( !timers.length ) {
		jQuery.fx.stop();
	}
	fxNow = undefined;
};

jQuery.fx.timer = function( timer ) {
	jQuery.timers.push( timer );
	jQuery.fx.start();
};

jQuery.fx.interval = 13;
jQuery.fx.start = function() {
	if ( inProgress ) {
		return;
	}

	inProgress = true;
	schedule();
};

jQuery.fx.stop = function() {
	inProgress = null;
};

jQuery.fx.speeds = {
	slow: 600,
	fast: 200,

	// Default speed
	_default: 400
};


// Based off of the plugin by Clint Helfers, with permission.
// https://web.archive.org/web/20100324014747/http://blindsignals.com/index.php/2009/07/jquery-delay/
jQuery.fn.delay = function( time, type ) {
	time = jQuery.fx ? jQuery.fx.speeds[ time ] || time : time;
	type = type || "fx";

	return this.queue( type, function( next, hooks ) {
		var timeout = window.setTimeout( next, time );
		hooks.stop = function() {
			window.clearTimeout( timeout );
		};
	} );
};


( function() {
	var input = document.createElement( "input" ),
		select = document.createElement( "select" ),
		opt = select.appendChild( document.createElement( "option" ) );

	input.type = "checkbox";

	// Support: Android <=4.3 only
	// Default value for a checkbox should be "on"
	support.checkOn = input.value !== "";

	// Support: IE <=11 only
	// Must access selectedIndex to make default options select
	support.optSelected = opt.selected;

	// Support: IE <=11 only
	// An input loses its value after becoming a radio
	input = document.createElement( "input" );
	input.value = "t";
	input.type = "radio";
	support.radioValue = input.value === "t";
} )();


var boolHook,
	attrHandle = jQuery.expr.attrHandle;

jQuery.fn.extend( {
	attr: function( name, value ) {
		return access( this, jQuery.attr, name, value, arguments.length > 1 );
	},

	removeAttr: function( name ) {
		return this.each( function() {
			jQuery.removeAttr( this, name );
		} );
	}
} );

jQuery.extend( {
	attr: function( elem, name, value ) {
		var ret, hooks,
			nType = elem.nodeType;

		// Don't get/set attributes on text, comment and attribute nodes
		if ( nType === 3 || nType === 8 || nType === 2 ) {
			return;
		}

		// Fallback to prop when attributes are not supported
		if ( typeof elem.getAttribute === "undefined" ) {
			return jQuery.prop( elem, name, value );
		}

		// Attribute hooks are determined by the lowercase version
		// Grab necessary hook if one is defined
		if ( nType !== 1 || !jQuery.isXMLDoc( elem ) ) {
			hooks = jQuery.attrHooks[ name.toLowerCase() ] ||
				( jQuery.expr.match.bool.test( name ) ? boolHook : undefined );
		}

		if ( value !== undefined ) {
			if ( value === null ) {
				jQuery.removeAttr( elem, name );
				return;
			}

			if ( hooks && "set" in hooks &&
				( ret = hooks.set( elem, value, name ) ) !== undefined ) {
				return ret;
			}

			elem.setAttribute( name, value + "" );
			return value;
		}

		if ( hooks && "get" in hooks && ( ret = hooks.get( elem, name ) ) !== null ) {
			return ret;
		}

		ret = jQuery.find.attr( elem, name );

		// Non-existent attributes return null, we normalize to undefined
		return ret == null ? undefined : ret;
	},

	attrHooks: {
		type: {
			set: function( elem, value ) {
				if ( !support.radioValue && value === "radio" &&
					nodeName( elem, "input" ) ) {
					var val = elem.value;
					elem.setAttribute( "type", value );
					if ( val ) {
						elem.value = val;
					}
					return value;
				}
			}
		}
	},

	removeAttr: function( elem, value ) {
		var name,
			i = 0,

			// Attribute names can contain non-HTML whitespace characters
			// https://html.spec.whatwg.org/multipage/syntax.html#attributes-2
			attrNames = value && value.match( rnothtmlwhite );

		if ( attrNames && elem.nodeType === 1 ) {
			while ( ( name = attrNames[ i++ ] ) ) {
				elem.removeAttribute( name );
			}
		}
	}
} );

// Hooks for boolean attributes
boolHook = {
	set: function( elem, value, name ) {
		if ( value === false ) {

			// Remove boolean attributes when set to false
			jQuery.removeAttr( elem, name );
		} else {
			elem.setAttribute( name, name );
		}
		return name;
	}
};

jQuery.each( jQuery.expr.match.bool.source.match( /\w+/g ), function( i, name ) {
	var getter = attrHandle[ name ] || jQuery.find.attr;

	attrHandle[ name ] = function( elem, name, isXML ) {
		var ret, handle,
			lowercaseName = name.toLowerCase();

		if ( !isXML ) {

			// Avoid an infinite loop by temporarily removing this function from the getter
			handle = attrHandle[ lowercaseName ];
			attrHandle[ lowercaseName ] = ret;
			ret = getter( elem, name, isXML ) != null ?
				lowercaseName :
				null;
			attrHandle[ lowercaseName ] = handle;
		}
		return ret;
	};
} );




var rfocusable = /^(?:input|select|textarea|button)$/i,
	rclickable = /^(?:a|area)$/i;

jQuery.fn.extend( {
	prop: function( name, value ) {
		return access( this, jQuery.prop, name, value, arguments.length > 1 );
	},

	removeProp: function( name ) {
		return this.each( function() {
			delete this[ jQuery.propFix[ name ] || name ];
		} );
	}
} );

jQuery.extend( {
	prop: function( elem, name, value ) {
		var ret, hooks,
			nType = elem.nodeType;

		// Don't get/set properties on text, comment and attribute nodes
		if ( nType === 3 || nType === 8 || nType === 2 ) {
			return;
		}

		if ( nType !== 1 || !jQuery.isXMLDoc( elem ) ) {

			// Fix name and attach hooks
			name = jQuery.propFix[ name ] || name;
			hooks = jQuery.propHooks[ name ];
		}

		if ( value !== undefined ) {
			if ( hooks && "set" in hooks &&
				( ret = hooks.set( elem, value, name ) ) !== undefined ) {
				return ret;
			}

			return ( elem[ name ] = value );
		}

		if ( hooks && "get" in hooks && ( ret = hooks.get( elem, name ) ) !== null ) {
			return ret;
		}

		return elem[ name ];
	},

	propHooks: {
		tabIndex: {
			get: function( elem ) {

				// Support: IE <=9 - 11 only
				// elem.tabIndex doesn't always return the
				// correct value when it hasn't been explicitly set
				// https://web.archive.org/web/20141116233347/http://fluidproject.org/blog/2008/01/09/getting-setting-and-removing-tabindex-values-with-javascript/
				// Use proper attribute retrieval(#12072)
				var tabindex = jQuery.find.attr( elem, "tabindex" );

				if ( tabindex ) {
					return parseInt( tabindex, 10 );
				}

				if (
					rfocusable.test( elem.nodeName ) ||
					rclickable.test( elem.nodeName ) &&
					elem.href
				) {
					return 0;
				}

				return -1;
			}
		}
	},

	propFix: {
		"for": "htmlFor",
		"class": "className"
	}
} );

// Support: IE <=11 only
// Accessing the selectedIndex property
// forces the browser to respect setting selected
// on the option
// The getter ensures a default option is selected
// when in an optgroup
// eslint rule "no-unused-expressions" is disabled for this code
// since it considers such accessions noop
if ( !support.optSelected ) {
	jQuery.propHooks.selected = {
		get: function( elem ) {

			/* eslint no-unused-expressions: "off" */

			var parent = elem.parentNode;
			if ( parent && parent.parentNode ) {
				parent.parentNode.selectedIndex;
			}
			return null;
		},
		set: function( elem ) {

			/* eslint no-unused-expressions: "off" */

			var parent = elem.parentNode;
			if ( parent ) {
				parent.selectedIndex;

				if ( parent.parentNode ) {
					parent.parentNode.selectedIndex;
				}
			}
		}
	};
}

jQuery.each( [
	"tabIndex",
	"readOnly",
	"maxLength",
	"cellSpacing",
	"cellPadding",
	"rowSpan",
	"colSpan",
	"useMap",
	"frameBorder",
	"contentEditable"
], function() {
	jQuery.propFix[ this.toLowerCase() ] = this;
} );




	// Strip and collapse whitespace according to HTML spec
	// https://infra.spec.whatwg.org/#strip-and-collapse-ascii-whitespace
	function stripAndCollapse( value ) {
		var tokens = value.match( rnothtmlwhite ) || [];
		return tokens.join( " " );
	}


function getClass( elem ) {
	return elem.getAttribute && elem.getAttribute( "class" ) || "";
}

function classesToArray( value ) {
	if ( Array.isArray( value ) ) {
		return value;
	}
	if ( typeof value === "string" ) {
		return value.match( rnothtmlwhite ) || [];
	}
	return [];
}

jQuery.fn.extend( {
	addClass: function( value ) {
		var classes, elem, cur, curValue, clazz, j, finalValue,
			i = 0;

		if ( isFunction( value ) ) {
			return this.each( function( j ) {
				jQuery( this ).addClass( value.call( this, j, getClass( this ) ) );
			} );
		}

		classes = classesToArray( value );

		if ( classes.length ) {
			while ( ( elem = this[ i++ ] ) ) {
				curValue = getClass( elem );
				cur = elem.nodeType === 1 && ( " " + stripAndCollapse( curValue ) + " " );

				if ( cur ) {
					j = 0;
					while ( ( clazz = classes[ j++ ] ) ) {
						if ( cur.indexOf( " " + clazz + " " ) < 0 ) {
							cur += clazz + " ";
						}
					}

					// Only assign if different to avoid unneeded rendering.
					finalValue = stripAndCollapse( cur );
					if ( curValue !== finalValue ) {
						elem.setAttribute( "class", finalValue );
					}
				}
			}
		}

		return this;
	},

	removeClass: function( value ) {
		var classes, elem, cur, curValue, clazz, j, finalValue,
			i = 0;

		if ( isFunction( value ) ) {
			return this.each( function( j ) {
				jQuery( this ).removeClass( value.call( this, j, getClass( this ) ) );
			} );
		}

		if ( !arguments.length ) {
			return this.attr( "class", "" );
		}

		classes = classesToArray( value );

		if ( classes.length ) {
			while ( ( elem = this[ i++ ] ) ) {
				curValue = getClass( elem );

				// This expression is here for better compressibility (see addClass)
				cur = elem.nodeType === 1 && ( " " + stripAndCollapse( curValue ) + " " );

				if ( cur ) {
					j = 0;
					while ( ( clazz = classes[ j++ ] ) ) {

						// Remove *all* instances
						while ( cur.indexOf( " " + clazz + " " ) > -1 ) {
							cur = cur.replace( " " + clazz + " ", " " );
						}
					}

					// Only assign if different to avoid unneeded rendering.
					finalValue = stripAndCollapse( cur );
					if ( curValue !== finalValue ) {
						elem.setAttribute( "class", finalValue );
					}
				}
			}
		}

		return this;
	},

	toggleClass: function( value, stateVal ) {
		var type = typeof value,
			isValidValue = type === "string" || Array.isArray( value );

		if ( typeof stateVal === "boolean" && isValidValue ) {
			return stateVal ? this.addClass( value ) : this.removeClass( value );
		}

		if ( isFunction( value ) ) {
			return this.each( function( i ) {
				jQuery( this ).toggleClass(
					value.call( this, i, getClass( this ), stateVal ),
					stateVal
				);
			} );
		}

		return this.each( function() {
			var className, i, self, classNames;

			if ( isValidValue ) {

				// Toggle individual class names
				i = 0;
				self = jQuery( this );
				classNames = classesToArray( value );

				while ( ( className = classNames[ i++ ] ) ) {

					// Check each className given, space separated list
					if ( self.hasClass( className ) ) {
						self.removeClass( className );
					} else {
						self.addClass( className );
					}
				}

			// Toggle whole class name
			} else if ( value === undefined || type === "boolean" ) {
				className = getClass( this );
				if ( className ) {

					// Store className if set
					dataPriv.set( this, "__className__", className );
				}

				// If the element has a class name or if we're passed `false`,
				// then remove the whole classname (if there was one, the above saved it).
				// Otherwise bring back whatever was previously saved (if anything),
				// falling back to the empty string if nothing was stored.
				if ( this.setAttribute ) {
					this.setAttribute( "class",
						className || value === false ?
						"" :
						dataPriv.get( this, "__className__" ) || ""
					);
				}
			}
		} );
	},

	hasClass: function( selector ) {
		var className, elem,
			i = 0;

		className = " " + selector + " ";
		while ( ( elem = this[ i++ ] ) ) {
			if ( elem.nodeType === 1 &&
				( " " + stripAndCollapse( getClass( elem ) ) + " " ).indexOf( className ) > -1 ) {
					return true;
			}
		}

		return false;
	}
} );




var rreturn = /\r/g;

jQuery.fn.extend( {
	val: function( value ) {
		var hooks, ret, valueIsFunction,
			elem = this[ 0 ];

		if ( !arguments.length ) {
			if ( elem ) {
				hooks = jQuery.valHooks[ elem.type ] ||
					jQuery.valHooks[ elem.nodeName.toLowerCase() ];

				if ( hooks &&
					"get" in hooks &&
					( ret = hooks.get( elem, "value" ) ) !== undefined
				) {
					return ret;
				}

				ret = elem.value;

				// Handle most common string cases
				if ( typeof ret === "string" ) {
					return ret.replace( rreturn, "" );
				}

				// Handle cases where value is null/undef or number
				return ret == null ? "" : ret;
			}

			return;
		}

		valueIsFunction = isFunction( value );

		return this.each( function( i ) {
			var val;

			if ( this.nodeType !== 1 ) {
				return;
			}

			if ( valueIsFunction ) {
				val = value.call( this, i, jQuery( this ).val() );
			} else {
				val = value;
			}

			// Treat null/undefined as ""; convert numbers to string
			if ( val == null ) {
				val = "";

			} else if ( typeof val === "number" ) {
				val += "";

			} else if ( Array.isArray( val ) ) {
				val = jQuery.map( val, function( value ) {
					return value == null ? "" : value + "";
				} );
			}

			hooks = jQuery.valHooks[ this.type ] || jQuery.valHooks[ this.nodeName.toLowerCase() ];

			// If set returns undefined, fall back to normal setting
			if ( !hooks || !( "set" in hooks ) || hooks.set( this, val, "value" ) === undefined ) {
				this.value = val;
			}
		} );
	}
} );

jQuery.extend( {
	valHooks: {
		option: {
			get: function( elem ) {

				var val = jQuery.find.attr( elem, "value" );
				return val != null ?
					val :

					// Support: IE <=10 - 11 only
					// option.text throws exceptions (#14686, #14858)
					// Strip and collapse whitespace
					// https://html.spec.whatwg.org/#strip-and-collapse-whitespace
					stripAndCollapse( jQuery.text( elem ) );
			}
		},
		select: {
			get: function( elem ) {
				var value, option, i,
					options = elem.options,
					index = elem.selectedIndex,
					one = elem.type === "select-one",
					values = one ? null : [],
					max = one ? index + 1 : options.length;

				if ( index < 0 ) {
					i = max;

				} else {
					i = one ? index : 0;
				}

				// Loop through all the selected options
				for ( ; i < max; i++ ) {
					option = options[ i ];

					// Support: IE <=9 only
					// IE8-9 doesn't update selected after form reset (#2551)
					if ( ( option.selected || i === index ) &&

							// Don't return options that are disabled or in a disabled optgroup
							!option.disabled &&
							( !option.parentNode.disabled ||
								!nodeName( option.parentNode, "optgroup" ) ) ) {

						// Get the specific value for the option
						value = jQuery( option ).val();

						// We don't need an array for one selects
						if ( one ) {
							return value;
						}

						// Multi-Selects return an array
						values.push( value );
					}
				}

				return values;
			},

			set: function( elem, value ) {
				var optionSet, option,
					options = elem.options,
					values = jQuery.makeArray( value ),
					i = options.length;

				while ( i-- ) {
					option = options[ i ];

					/* eslint-disable no-cond-assign */

					if ( option.selected =
						jQuery.inArray( jQuery.valHooks.option.get( option ), values ) > -1
					) {
						optionSet = true;
					}

					/* eslint-enable no-cond-assign */
				}

				// Force browsers to behave consistently when non-matching value is set
				if ( !optionSet ) {
					elem.selectedIndex = -1;
				}
				return values;
			}
		}
	}
} );

// Radios and checkboxes getter/setter
jQuery.each( [ "radio", "checkbox" ], function() {
	jQuery.valHooks[ this ] = {
		set: function( elem, value ) {
			if ( Array.isArray( value ) ) {
				return ( elem.checked = jQuery.inArray( jQuery( elem ).val(), value ) > -1 );
			}
		}
	};
	if ( !support.checkOn ) {
		jQuery.valHooks[ this ].get = function( elem ) {
			return elem.getAttribute( "value" ) === null ? "on" : elem.value;
		};
	}
} );




// Return jQuery for attributes-only inclusion


support.focusin = "onfocusin" in window;


var rfocusMorph = /^(?:focusinfocus|focusoutblur)$/,
	stopPropagationCallback = function( e ) {
		e.stopPropagation();
	};

jQuery.extend( jQuery.event, {

	trigger: function( event, data, elem, onlyHandlers ) {

		var i, cur, tmp, bubbleType, ontype, handle, special, lastElement,
			eventPath = [ elem || document ],
			type = hasOwn.call( event, "type" ) ? event.type : event,
			namespaces = hasOwn.call( event, "namespace" ) ? event.namespace.split( "." ) : [];

		cur = lastElement = tmp = elem = elem || document;

		// Don't do events on text and comment nodes
		if ( elem.nodeType === 3 || elem.nodeType === 8 ) {
			return;
		}

		// focus/blur morphs to focusin/out; ensure we're not firing them right now
		if ( rfocusMorph.test( type + jQuery.event.triggered ) ) {
			return;
		}

		if ( type.indexOf( "." ) > -1 ) {

			// Namespaced trigger; create a regexp to match event type in handle()
			namespaces = type.split( "." );
			type = namespaces.shift();
			namespaces.sort();
		}
		ontype = type.indexOf( ":" ) < 0 && "on" + type;

		// Caller can pass in a jQuery.Event object, Object, or just an event type string
		event = event[ jQuery.expando ] ?
			event :
			new jQuery.Event( type, typeof event === "object" && event );

		// Trigger bitmask: & 1 for native handlers; & 2 for jQuery (always true)
		event.isTrigger = onlyHandlers ? 2 : 3;
		event.namespace = namespaces.join( "." );
		event.rnamespace = event.namespace ?
			new RegExp( "(^|\\.)" + namespaces.join( "\\.(?:.*\\.|)" ) + "(\\.|$)" ) :
			null;

		// Clean up the event in case it is being reused
		event.result = undefined;
		if ( !event.target ) {
			event.target = elem;
		}

		// Clone any incoming data and prepend the event, creating the handler arg list
		data = data == null ?
			[ event ] :
			jQuery.makeArray( data, [ event ] );

		// Allow special events to draw outside the lines
		special = jQuery.event.special[ type ] || {};
		if ( !onlyHandlers && special.trigger && special.trigger.apply( elem, data ) === false ) {
			return;
		}

		// Determine event propagation path in advance, per W3C events spec (#9951)
		// Bubble up to document, then to window; watch for a global ownerDocument var (#9724)
		if ( !onlyHandlers && !special.noBubble && !isWindow( elem ) ) {

			bubbleType = special.delegateType || type;
			if ( !rfocusMorph.test( bubbleType + type ) ) {
				cur = cur.parentNode;
			}
			for ( ; cur; cur = cur.parentNode ) {
				eventPath.push( cur );
				tmp = cur;
			}

			// Only add window if we got to document (e.g., not plain obj or detached DOM)
			if ( tmp === ( elem.ownerDocument || document ) ) {
				eventPath.push( tmp.defaultView || tmp.parentWindow || window );
			}
		}

		// Fire handlers on the event path
		i = 0;
		while ( ( cur = eventPath[ i++ ] ) && !event.isPropagationStopped() ) {
			lastElement = cur;
			event.type = i > 1 ?
				bubbleType :
				special.bindType || type;

			// jQuery handler
			handle = ( dataPriv.get( cur, "events" ) || {} )[ event.type ] &&
				dataPriv.get( cur, "handle" );
			if ( handle ) {
				handle.apply( cur, data );
			}

			// Native handler
			handle = ontype && cur[ ontype ];
			if ( handle && handle.apply && acceptData( cur ) ) {
				event.result = handle.apply( cur, data );
				if ( event.result === false ) {
					event.preventDefault();
				}
			}
		}
		event.type = type;

		// If nobody prevented the default action, do it now
		if ( !onlyHandlers && !event.isDefaultPrevented() ) {

			if ( ( !special._default ||
				special._default.apply( eventPath.pop(), data ) === false ) &&
				acceptData( elem ) ) {

				// Call a native DOM method on the target with the same name as the event.
				// Don't do default actions on window, that's where global variables be (#6170)
				if ( ontype && isFunction( elem[ type ] ) && !isWindow( elem ) ) {

					// Don't re-trigger an onFOO event when we call its FOO() method
					tmp = elem[ ontype ];

					if ( tmp ) {
						elem[ ontype ] = null;
					}

					// Prevent re-triggering of the same event, since we already bubbled it above
					jQuery.event.triggered = type;

					if ( event.isPropagationStopped() ) {
						lastElement.addEventListener( type, stopPropagationCallback );
					}

					elem[ type ]();

					if ( event.isPropagationStopped() ) {
						lastElement.removeEventListener( type, stopPropagationCallback );
					}

					jQuery.event.triggered = undefined;

					if ( tmp ) {
						elem[ ontype ] = tmp;
					}
				}
			}
		}

		return event.result;
	},

	// Piggyback on a donor event to simulate a different one
	// Used only for `focus(in | out)` events
	simulate: function( type, elem, event ) {
		var e = jQuery.extend(
			new jQuery.Event(),
			event,
			{
				type: type,
				isSimulated: true
			}
		);

		jQuery.event.trigger( e, null, elem );
	}

} );

jQuery.fn.extend( {

	trigger: function( type, data ) {
		return this.each( function() {
			jQuery.event.trigger( type, data, this );
		} );
	},
	triggerHandler: function( type, data ) {
		var elem = this[ 0 ];
		if ( elem ) {
			return jQuery.event.trigger( type, data, elem, true );
		}
	}
} );


// Support: Firefox <=44
// Firefox doesn't have focus(in | out) events
// Related ticket - https://bugzilla.mozilla.org/show_bug.cgi?id=687787
//
// Support: Chrome <=48 - 49, Safari <=9.0 - 9.1
// focus(in | out) events fire after focus & blur events,
// which is spec violation - http://www.w3.org/TR/DOM-Level-3-Events/#events-focusevent-event-order
// Related ticket - https://bugs.chromium.org/p/chromium/issues/detail?id=449857
if ( !support.focusin ) {
	jQuery.each( { focus: "focusin", blur: "focusout" }, function( orig, fix ) {

		// Attach a single capturing handler on the document while someone wants focusin/focusout
		var handler = function( event ) {
			jQuery.event.simulate( fix, event.target, jQuery.event.fix( event ) );
		};

		jQuery.event.special[ fix ] = {
			setup: function() {
				var doc = this.ownerDocument || this,
					attaches = dataPriv.access( doc, fix );

				if ( !attaches ) {
					doc.addEventListener( orig, handler, true );
				}
				dataPriv.access( doc, fix, ( attaches || 0 ) + 1 );
			},
			teardown: function() {
				var doc = this.ownerDocument || this,
					attaches = dataPriv.access( doc, fix ) - 1;

				if ( !attaches ) {
					doc.removeEventListener( orig, handler, true );
					dataPriv.remove( doc, fix );

				} else {
					dataPriv.access( doc, fix, attaches );
				}
			}
		};
	} );
}
var location = window.location;

var nonce = Date.now();

var rquery = ( /\?/ );



// Cross-browser xml parsing
jQuery.parseXML = function( data ) {
	var xml;
	if ( !data || typeof data !== "string" ) {
		return null;
	}

	// Support: IE 9 - 11 only
	// IE throws on parseFromString with invalid input.
	try {
		xml = ( new window.DOMParser() ).parseFromString( data, "text/xml" );
	} catch ( e ) {
		xml = undefined;
	}

	if ( !xml || xml.getElementsByTagName( "parsererror" ).length ) {
		jQuery.error( "Invalid XML: " + data );
	}
	return xml;
};


var
	rbracket = /\[\]$/,
	rCRLF = /\r?\n/g,
	rsubmitterTypes = /^(?:submit|button|image|reset|file)$/i,
	rsubmittable = /^(?:input|select|textarea|keygen)/i;

function buildParams( prefix, obj, traditional, add ) {
	var name;

	if ( Array.isArray( obj ) ) {

		// Serialize array item.
		jQuery.each( obj, function( i, v ) {
			if ( traditional || rbracket.test( prefix ) ) {

				// Treat each array item as a scalar.
				add( prefix, v );

			} else {

				// Item is non-scalar (array or object), encode its numeric index.
				buildParams(
					prefix + "[" + ( typeof v === "object" && v != null ? i : "" ) + "]",
					v,
					traditional,
					add
				);
			}
		} );

	} else if ( !traditional && toType( obj ) === "object" ) {

		// Serialize object item.
		for ( name in obj ) {
			buildParams( prefix + "[" + name + "]", obj[ name ], traditional, add );
		}

	} else {

		// Serialize scalar item.
		add( prefix, obj );
	}
}

// Serialize an array of form elements or a set of
// key/values into a query string
jQuery.param = function( a, traditional ) {
	var prefix,
		s = [],
		add = function( key, valueOrFunction ) {

			// If value is a function, invoke it and use its return value
			var value = isFunction( valueOrFunction ) ?
				valueOrFunction() :
				valueOrFunction;

			s[ s.length ] = encodeURIComponent( key ) + "=" +
				encodeURIComponent( value == null ? "" : value );
		};

	// If an array was passed in, assume that it is an array of form elements.
	if ( Array.isArray( a ) || ( a.jquery && !jQuery.isPlainObject( a ) ) ) {

		// Serialize the form elements
		jQuery.each( a, function() {
			add( this.name, this.value );
		} );

	} else {

		// If traditional, encode the "old" way (the way 1.3.2 or older
		// did it), otherwise encode params recursively.
		for ( prefix in a ) {
			buildParams( prefix, a[ prefix ], traditional, add );
		}
	}

	// Return the resulting serialization
	return s.join( "&" );
};

jQuery.fn.extend( {
	serialize: function() {
		return jQuery.param( this.serializeArray() );
	},
	serializeArray: function() {
		return this.map( function() {

			// Can add propHook for "elements" to filter or add form elements
			var elements = jQuery.prop( this, "elements" );
			return elements ? jQuery.makeArray( elements ) : this;
		} )
		.filter( function() {
			var type = this.type;

			// Use .is( ":disabled" ) so that fieldset[disabled] works
			return this.name && !jQuery( this ).is( ":disabled" ) &&
				rsubmittable.test( this.nodeName ) && !rsubmitterTypes.test( type ) &&
				( this.checked || !rcheckableType.test( type ) );
		} )
		.map( function( i, elem ) {
			var val = jQuery( this ).val();

			if ( val == null ) {
				return null;
			}

			if ( Array.isArray( val ) ) {
				return jQuery.map( val, function( val ) {
					return { name: elem.name, value: val.replace( rCRLF, "\r\n" ) };
				} );
			}

			return { name: elem.name, value: val.replace( rCRLF, "\r\n" ) };
		} ).get();
	}
} );


var
	r20 = /%20/g,
	rhash = /#.*$/,
	rantiCache = /([?&])_=[^&]*/,
	rheaders = /^(.*?):[ \t]*([^\r\n]*)$/mg,

	// #7653, #8125, #8152: local protocol detection
	rlocalProtocol = /^(?:about|app|app-storage|.+-extension|file|res|widget):$/,
	rnoContent = /^(?:GET|HEAD)$/,
	rprotocol = /^\/\//,

	/* Prefilters
	 * 1) They are useful to introduce custom dataTypes (see ajax/jsonp.js for an example)
	 * 2) These are called:
	 *    - BEFORE asking for a transport
	 *    - AFTER param serialization (s.data is a string if s.processData is true)
	 * 3) key is the dataType
	 * 4) the catchall symbol "*" can be used
	 * 5) execution will start with transport dataType and THEN continue down to "*" if needed
	 */
	prefilters = {},

	/* Transports bindings
	 * 1) key is the dataType
	 * 2) the catchall symbol "*" can be used
	 * 3) selection will start with transport dataType and THEN go to "*" if needed
	 */
	transports = {},

	// Avoid comment-prolog char sequence (#10098); must appease lint and evade compression
	allTypes = "*/".concat( "*" ),

	// Anchor tag for parsing the document origin
	originAnchor = document.createElement( "a" );
	originAnchor.href = location.href;

// Base "constructor" for jQuery.ajaxPrefilter and jQuery.ajaxTransport
function addToPrefiltersOrTransports( structure ) {

	// dataTypeExpression is optional and defaults to "*"
	return function( dataTypeExpression, func ) {

		if ( typeof dataTypeExpression !== "string" ) {
			func = dataTypeExpression;
			dataTypeExpression = "*";
		}

		var dataType,
			i = 0,
			dataTypes = dataTypeExpression.toLowerCase().match( rnothtmlwhite ) || [];

		if ( isFunction( func ) ) {

			// For each dataType in the dataTypeExpression
			while ( ( dataType = dataTypes[ i++ ] ) ) {

				// Prepend if requested
				if ( dataType[ 0 ] === "+" ) {
					dataType = dataType.slice( 1 ) || "*";
					( structure[ dataType ] = structure[ dataType ] || [] ).unshift( func );

				// Otherwise append
				} else {
					( structure[ dataType ] = structure[ dataType ] || [] ).push( func );
				}
			}
		}
	};
}

// Base inspection function for prefilters and transports
function inspectPrefiltersOrTransports( structure, options, originalOptions, jqXHR ) {

	var inspected = {},
		seekingTransport = ( structure === transports );

	function inspect( dataType ) {
		var selected;
		inspected[ dataType ] = true;
		jQuery.each( structure[ dataType ] || [], function( _, prefilterOrFactory ) {
			var dataTypeOrTransport = prefilterOrFactory( options, originalOptions, jqXHR );
			if ( typeof dataTypeOrTransport === "string" &&
				!seekingTransport && !inspected[ dataTypeOrTransport ] ) {

				options.dataTypes.unshift( dataTypeOrTransport );
				inspect( dataTypeOrTransport );
				return false;
			} else if ( seekingTransport ) {
				return !( selected = dataTypeOrTransport );
			}
		} );
		return selected;
	}

	return inspect( options.dataTypes[ 0 ] ) || !inspected[ "*" ] && inspect( "*" );
}

// A special extend for ajax options
// that takes "flat" options (not to be deep extended)
// Fixes #9887
function ajaxExtend( target, src ) {
	var key, deep,
		flatOptions = jQuery.ajaxSettings.flatOptions || {};

	for ( key in src ) {
		if ( src[ key ] !== undefined ) {
			( flatOptions[ key ] ? target : ( deep || ( deep = {} ) ) )[ key ] = src[ key ];
		}
	}
	if ( deep ) {
		jQuery.extend( true, target, deep );
	}

	return target;
}

/* Handles responses to an ajax request:
 * - finds the right dataType (mediates between content-type and expected dataType)
 * - returns the corresponding response
 */
function ajaxHandleResponses( s, jqXHR, responses ) {

	var ct, type, finalDataType, firstDataType,
		contents = s.contents,
		dataTypes = s.dataTypes;

	// Remove auto dataType and get content-type in the process
	while ( dataTypes[ 0 ] === "*" ) {
		dataTypes.shift();
		if ( ct === undefined ) {
			ct = s.mimeType || jqXHR.getResponseHeader( "Content-Type" );
		}
	}

	// Check if we're dealing with a known content-type
	if ( ct ) {
		for ( type in contents ) {
			if ( contents[ type ] && contents[ type ].test( ct ) ) {
				dataTypes.unshift( type );
				break;
			}
		}
	}

	// Check to see if we have a response for the expected dataType
	if ( dataTypes[ 0 ] in responses ) {
		finalDataType = dataTypes[ 0 ];
	} else {

		// Try convertible dataTypes
		for ( type in responses ) {
			if ( !dataTypes[ 0 ] || s.converters[ type + " " + dataTypes[ 0 ] ] ) {
				finalDataType = type;
				break;
			}
			if ( !firstDataType ) {
				firstDataType = type;
			}
		}

		// Or just use first one
		finalDataType = finalDataType || firstDataType;
	}

	// If we found a dataType
	// We add the dataType to the list if needed
	// and return the corresponding response
	if ( finalDataType ) {
		if ( finalDataType !== dataTypes[ 0 ] ) {
			dataTypes.unshift( finalDataType );
		}
		return responses[ finalDataType ];
	}
}

/* Chain conversions given the request and the original response
 * Also sets the responseXXX fields on the jqXHR instance
 */
function ajaxConvert( s, response, jqXHR, isSuccess ) {
	var conv2, current, conv, tmp, prev,
		converters = {},

		// Work with a copy of dataTypes in case we need to modify it for conversion
		dataTypes = s.dataTypes.slice();

	// Create converters map with lowercased keys
	if ( dataTypes[ 1 ] ) {
		for ( conv in s.converters ) {
			converters[ conv.toLowerCase() ] = s.converters[ conv ];
		}
	}

	current = dataTypes.shift();

	// Convert to each sequential dataType
	while ( current ) {

		if ( s.responseFields[ current ] ) {
			jqXHR[ s.responseFields[ current ] ] = response;
		}

		// Apply the dataFilter if provided
		if ( !prev && isSuccess && s.dataFilter ) {
			response = s.dataFilter( response, s.dataType );
		}

		prev = current;
		current = dataTypes.shift();

		if ( current ) {

			// There's only work to do if current dataType is non-auto
			if ( current === "*" ) {

				current = prev;

			// Convert response if prev dataType is non-auto and differs from current
			} else if ( prev !== "*" && prev !== current ) {

				// Seek a direct converter
				conv = converters[ prev + " " + current ] || converters[ "* " + current ];

				// If none found, seek a pair
				if ( !conv ) {
					for ( conv2 in converters ) {

						// If conv2 outputs current
						tmp = conv2.split( " " );
						if ( tmp[ 1 ] === current ) {

							// If prev can be converted to accepted input
							conv = converters[ prev + " " + tmp[ 0 ] ] ||
								converters[ "* " + tmp[ 0 ] ];
							if ( conv ) {

								// Condense equivalence converters
								if ( conv === true ) {
									conv = converters[ conv2 ];

								// Otherwise, insert the intermediate dataType
								} else if ( converters[ conv2 ] !== true ) {
									current = tmp[ 0 ];
									dataTypes.unshift( tmp[ 1 ] );
								}
								break;
							}
						}
					}
				}

				// Apply converter (if not an equivalence)
				if ( conv !== true ) {

					// Unless errors are allowed to bubble, catch and return them
					if ( conv && s.throws ) {
						response = conv( response );
					} else {
						try {
							response = conv( response );
						} catch ( e ) {
							return {
								state: "parsererror",
								error: conv ? e : "No conversion from " + prev + " to " + current
							};
						}
					}
				}
			}
		}
	}

	return { state: "success", data: response };
}

jQuery.extend( {

	// Counter for holding the number of active queries
	active: 0,

	// Last-Modified header cache for next request
	lastModified: {},
	etag: {},

	ajaxSettings: {
		url: location.href,
		type: "GET",
		isLocal: rlocalProtocol.test( location.protocol ),
		global: true,
		processData: true,
		async: true,
		contentType: "application/x-www-form-urlencoded; charset=UTF-8",

		/*
		timeout: 0,
		data: null,
		dataType: null,
		username: null,
		password: null,
		cache: null,
		throws: false,
		traditional: false,
		headers: {},
		*/

		accepts: {
			"*": allTypes,
			text: "text/plain",
			html: "text/html",
			xml: "application/xml, text/xml",
			json: "application/json, text/javascript"
		},

		contents: {
			xml: /\bxml\b/,
			html: /\bhtml/,
			json: /\bjson\b/
		},

		responseFields: {
			xml: "responseXML",
			text: "responseText",
			json: "responseJSON"
		},

		// Data converters
		// Keys separate source (or catchall "*") and destination types with a single space
		converters: {

			// Convert anything to text
			"* text": String,

			// Text to html (true = no transformation)
			"text html": true,

			// Evaluate text as a json expression
			"text json": JSON.parse,

			// Parse text as xml
			"text xml": jQuery.parseXML
		},

		// For options that shouldn't be deep extended:
		// you can add your own custom options here if
		// and when you create one that shouldn't be
		// deep extended (see ajaxExtend)
		flatOptions: {
			url: true,
			context: true
		}
	},

	// Creates a full fledged settings object into target
	// with both ajaxSettings and settings fields.
	// If target is omitted, writes into ajaxSettings.
	ajaxSetup: function( target, settings ) {
		return settings ?

			// Building a settings object
			ajaxExtend( ajaxExtend( target, jQuery.ajaxSettings ), settings ) :

			// Extending ajaxSettings
			ajaxExtend( jQuery.ajaxSettings, target );
	},

	ajaxPrefilter: addToPrefiltersOrTransports( prefilters ),
	ajaxTransport: addToPrefiltersOrTransports( transports ),

	// Main method
	ajax: function( url, options ) {

		// If url is an object, simulate pre-1.5 signature
		if ( typeof url === "object" ) {
			options = url;
			url = undefined;
		}

		// Force options to be an object
		options = options || {};

		var transport,

			// URL without anti-cache param
			cacheURL,

			// Response headers
			responseHeadersString,
			responseHeaders,

			// timeout handle
			timeoutTimer,

			// Url cleanup var
			urlAnchor,

			// Request state (becomes false upon send and true upon completion)
			completed,

			// To know if global events are to be dispatched
			fireGlobals,

			// Loop variable
			i,

			// uncached part of the url
			uncached,

			// Create the final options object
			s = jQuery.ajaxSetup( {}, options ),

			// Callbacks context
			callbackContext = s.context || s,

			// Context for global events is callbackContext if it is a DOM node or jQuery collection
			globalEventContext = s.context &&
				( callbackContext.nodeType || callbackContext.jquery ) ?
					jQuery( callbackContext ) :
					jQuery.event,

			// Deferreds
			deferred = jQuery.Deferred(),
			completeDeferred = jQuery.Callbacks( "once memory" ),

			// Status-dependent callbacks
			statusCode = s.statusCode || {},

			// Headers (they are sent all at once)
			requestHeaders = {},
			requestHeadersNames = {},

			// Default abort message
			strAbort = "canceled",

			// Fake xhr
			jqXHR = {
				readyState: 0,

				// Builds headers hashtable if needed
				getResponseHeader: function( key ) {
					var match;
					if ( completed ) {
						if ( !responseHeaders ) {
							responseHeaders = {};
							while ( ( match = rheaders.exec( responseHeadersString ) ) ) {
								responseHeaders[ match[ 1 ].toLowerCase() ] = match[ 2 ];
							}
						}
						match = responseHeaders[ key.toLowerCase() ];
					}
					return match == null ? null : match;
				},

				// Raw string
				getAllResponseHeaders: function() {
					return completed ? responseHeadersString : null;
				},

				// Caches the header
				setRequestHeader: function( name, value ) {
					if ( completed == null ) {
						name = requestHeadersNames[ name.toLowerCase() ] =
							requestHeadersNames[ name.toLowerCase() ] || name;
						requestHeaders[ name ] = value;
					}
					return this;
				},

				// Overrides response content-type header
				overrideMimeType: function( type ) {
					if ( completed == null ) {
						s.mimeType = type;
					}
					return this;
				},

				// Status-dependent callbacks
				statusCode: function( map ) {
					var code;
					if ( map ) {
						if ( completed ) {

							// Execute the appropriate callbacks
							jqXHR.always( map[ jqXHR.status ] );
						} else {

							// Lazy-add the new callbacks in a way that preserves old ones
							for ( code in map ) {
								statusCode[ code ] = [ statusCode[ code ], map[ code ] ];
							}
						}
					}
					return this;
				},

				// Cancel the request
				abort: function( statusText ) {
					var finalText = statusText || strAbort;
					if ( transport ) {
						transport.abort( finalText );
					}
					done( 0, finalText );
					return this;
				}
			};

		// Attach deferreds
		deferred.promise( jqXHR );

		// Add protocol if not provided (prefilters might expect it)
		// Handle falsy url in the settings object (#10093: consistency with old signature)
		// We also use the url parameter if available
		s.url = ( ( url || s.url || location.href ) + "" )
			.replace( rprotocol, location.protocol + "//" );

		// Alias method option to type as per ticket #12004
		s.type = options.method || options.type || s.method || s.type;

		// Extract dataTypes list
		s.dataTypes = ( s.dataType || "*" ).toLowerCase().match( rnothtmlwhite ) || [ "" ];

		// A cross-domain request is in order when the origin doesn't match the current origin.
		if ( s.crossDomain == null ) {
			urlAnchor = document.createElement( "a" );

			// Support: IE <=8 - 11, Edge 12 - 15
			// IE throws exception on accessing the href property if url is malformed,
			// e.g. http://example.com:80x/
			try {
				urlAnchor.href = s.url;

				// Support: IE <=8 - 11 only
				// Anchor's host property isn't correctly set when s.url is relative
				urlAnchor.href = urlAnchor.href;
				s.crossDomain = originAnchor.protocol + "//" + originAnchor.host !==
					urlAnchor.protocol + "//" + urlAnchor.host;
			} catch ( e ) {

				// If there is an error parsing the URL, assume it is crossDomain,
				// it can be rejected by the transport if it is invalid
				s.crossDomain = true;
			}
		}

		// Convert data if not already a string
		if ( s.data && s.processData && typeof s.data !== "string" ) {
			s.data = jQuery.param( s.data, s.traditional );
		}

		// Apply prefilters
		inspectPrefiltersOrTransports( prefilters, s, options, jqXHR );

		// If request was aborted inside a prefilter, stop there
		if ( completed ) {
			return jqXHR;
		}

		// We can fire global events as of now if asked to
		// Don't fire events if jQuery.event is undefined in an AMD-usage scenario (#15118)
		fireGlobals = jQuery.event && s.global;

		// Watch for a new set of requests
		if ( fireGlobals && jQuery.active++ === 0 ) {
			jQuery.event.trigger( "ajaxStart" );
		}

		// Uppercase the type
		s.type = s.type.toUpperCase();

		// Determine if request has content
		s.hasContent = !rnoContent.test( s.type );

		// Save the URL in case we're toying with the If-Modified-Since
		// and/or If-None-Match header later on
		// Remove hash to simplify url manipulation
		cacheURL = s.url.replace( rhash, "" );

		// More options handling for requests with no content
		if ( !s.hasContent ) {

			// Remember the hash so we can put it back
			uncached = s.url.slice( cacheURL.length );

			// If data is available and should be processed, append data to url
			if ( s.data && ( s.processData || typeof s.data === "string" ) ) {
				cacheURL += ( rquery.test( cacheURL ) ? "&" : "?" ) + s.data;

				// #9682: remove data so that it's not used in an eventual retry
				delete s.data;
			}

			// Add or update anti-cache param if needed
			if ( s.cache === false ) {
				cacheURL = cacheURL.replace( rantiCache, "$1" );
				uncached = ( rquery.test( cacheURL ) ? "&" : "?" ) + "_=" + ( nonce++ ) + uncached;
			}

			// Put hash and anti-cache on the URL that will be requested (gh-1732)
			s.url = cacheURL + uncached;

		// Change '%20' to '+' if this is encoded form body content (gh-2658)
		} else if ( s.data && s.processData &&
			( s.contentType || "" ).indexOf( "application/x-www-form-urlencoded" ) === 0 ) {
			s.data = s.data.replace( r20, "+" );
		}

		// Set the If-Modified-Since and/or If-None-Match header, if in ifModified mode.
		if ( s.ifModified ) {
			if ( jQuery.lastModified[ cacheURL ] ) {
				jqXHR.setRequestHeader( "If-Modified-Since", jQuery.lastModified[ cacheURL ] );
			}
			if ( jQuery.etag[ cacheURL ] ) {
				jqXHR.setRequestHeader( "If-None-Match", jQuery.etag[ cacheURL ] );
			}
		}

		// Set the correct header, if data is being sent
		if ( s.data && s.hasContent && s.contentType !== false || options.contentType ) {
			jqXHR.setRequestHeader( "Content-Type", s.contentType );
		}

		// Set the Accepts header for the server, depending on the dataType
		jqXHR.setRequestHeader(
			"Accept",
			s.dataTypes[ 0 ] && s.accepts[ s.dataTypes[ 0 ] ] ?
				s.accepts[ s.dataTypes[ 0 ] ] +
					( s.dataTypes[ 0 ] !== "*" ? ", " + allTypes + "; q=0.01" : "" ) :
				s.accepts[ "*" ]
		);

		// Check for headers option
		for ( i in s.headers ) {
			jqXHR.setRequestHeader( i, s.headers[ i ] );
		}

		// Allow custom headers/mimetypes and early abort
		if ( s.beforeSend &&
			( s.beforeSend.call( callbackContext, jqXHR, s ) === false || completed ) ) {

			// Abort if not done already and return
			return jqXHR.abort();
		}

		// Aborting is no longer a cancellation
		strAbort = "abort";

		// Install callbacks on deferreds
		completeDeferred.add( s.complete );
		jqXHR.done( s.success );
		jqXHR.fail( s.error );

		// Get transport
		transport = inspectPrefiltersOrTransports( transports, s, options, jqXHR );

		// If no transport, we auto-abort
		if ( !transport ) {
			done( -1, "No Transport" );
		} else {
			jqXHR.readyState = 1;

			// Send global event
			if ( fireGlobals ) {
				globalEventContext.trigger( "ajaxSend", [ jqXHR, s ] );
			}

			// If request was aborted inside ajaxSend, stop there
			if ( completed ) {
				return jqXHR;
			}

			// Timeout
			if ( s.async && s.timeout > 0 ) {
				timeoutTimer = window.setTimeout( function() {
					jqXHR.abort( "timeout" );
				}, s.timeout );
			}

			try {
				completed = false;
				transport.send( requestHeaders, done );
			} catch ( e ) {

				// Rethrow post-completion exceptions
				if ( completed ) {
					throw e;
				}

				// Propagate others as results
				done( -1, e );
			}
		}

		// Callback for when everything is done
		function done( status, nativeStatusText, responses, headers ) {
			var isSuccess, success, error, response, modified,
				statusText = nativeStatusText;

			// Ignore repeat invocations
			if ( completed ) {
				return;
			}

			completed = true;

			// Clear timeout if it exists
			if ( timeoutTimer ) {
				window.clearTimeout( timeoutTimer );
			}

			// Dereference transport for early garbage collection
			// (no matter how long the jqXHR object will be used)
			transport = undefined;

			// Cache response headers
			responseHeadersString = headers || "";

			// Set readyState
			jqXHR.readyState = status > 0 ? 4 : 0;

			// Determine if successful
			isSuccess = status >= 200 && status < 300 || status === 304;

			// Get response data
			if ( responses ) {
				response = ajaxHandleResponses( s, jqXHR, responses );
			}

			// Convert no matter what (that way responseXXX fields are always set)
			response = ajaxConvert( s, response, jqXHR, isSuccess );

			// If successful, handle type chaining
			if ( isSuccess ) {

				// Set the If-Modified-Since and/or If-None-Match header, if in ifModified mode.
				if ( s.ifModified ) {
					modified = jqXHR.getResponseHeader( "Last-Modified" );
					if ( modified ) {
						jQuery.lastModified[ cacheURL ] = modified;
					}
					modified = jqXHR.getResponseHeader( "etag" );
					if ( modified ) {
						jQuery.etag[ cacheURL ] = modified;
					}
				}

				// if no content
				if ( status === 204 || s.type === "HEAD" ) {
					statusText = "nocontent";

				// if not modified
				} else if ( status === 304 ) {
					statusText = "notmodified";

				// If we have data, let's convert it
				} else {
					statusText = response.state;
					success = response.data;
					error = response.error;
					isSuccess = !error;
				}
			} else {

				// Extract error from statusText and normalize for non-aborts
				error = statusText;
				if ( status || !statusText ) {
					statusText = "error";
					if ( status < 0 ) {
						status = 0;
					}
				}
			}

			// Set data for the fake xhr object
			jqXHR.status = status;
			jqXHR.statusText = ( nativeStatusText || statusText ) + "";

			// Success/Error
			if ( isSuccess ) {
				deferred.resolveWith( callbackContext, [ success, statusText, jqXHR ] );
			} else {
				deferred.rejectWith( callbackContext, [ jqXHR, statusText, error ] );
			}

			// Status-dependent callbacks
			jqXHR.statusCode( statusCode );
			statusCode = undefined;

			if ( fireGlobals ) {
				globalEventContext.trigger( isSuccess ? "ajaxSuccess" : "ajaxError",
					[ jqXHR, s, isSuccess ? success : error ] );
			}

			// Complete
			completeDeferred.fireWith( callbackContext, [ jqXHR, statusText ] );

			if ( fireGlobals ) {
				globalEventContext.trigger( "ajaxComplete", [ jqXHR, s ] );

				// Handle the global AJAX counter
				if ( !( --jQuery.active ) ) {
					jQuery.event.trigger( "ajaxStop" );
				}
			}
		}

		return jqXHR;
	},

	getJSON: function( url, data, callback ) {
		return jQuery.get( url, data, callback, "json" );
	},

	getScript: function( url, callback ) {
		return jQuery.get( url, undefined, callback, "script" );
	}
} );

jQuery.each( [ "get", "post" ], function( i, method ) {
	jQuery[ method ] = function( url, data, callback, type ) {

		// Shift arguments if data argument was omitted
		if ( isFunction( data ) ) {
			type = type || callback;
			callback = data;
			data = undefined;
		}

		// The url can be an options object (which then must have .url)
		return jQuery.ajax( jQuery.extend( {
			url: url,
			type: method,
			dataType: type,
			data: data,
			success: callback
		}, jQuery.isPlainObject( url ) && url ) );
	};
} );


jQuery._evalUrl = function( url ) {
	return jQuery.ajax( {
		url: url,

		// Make this explicit, since user can override this through ajaxSetup (#11264)
		type: "GET",
		dataType: "script",
		cache: true,
		async: false,
		global: false,
		"throws": true
	} );
};


jQuery.fn.extend( {
	wrapAll: function( html ) {
		var wrap;

		if ( this[ 0 ] ) {
			if ( isFunction( html ) ) {
				html = html.call( this[ 0 ] );
			}

			// The elements to wrap the target around
			wrap = jQuery( html, this[ 0 ].ownerDocument ).eq( 0 ).clone( true );

			if ( this[ 0 ].parentNode ) {
				wrap.insertBefore( this[ 0 ] );
			}

			wrap.map( function() {
				var elem = this;

				while ( elem.firstElementChild ) {
					elem = elem.firstElementChild;
				}

				return elem;
			} ).append( this );
		}

		return this;
	},

	wrapInner: function( html ) {
		if ( isFunction( html ) ) {
			return this.each( function( i ) {
				jQuery( this ).wrapInner( html.call( this, i ) );
			} );
		}

		return this.each( function() {
			var self = jQuery( this ),
				contents = self.contents();

			if ( contents.length ) {
				contents.wrapAll( html );

			} else {
				self.append( html );
			}
		} );
	},

	wrap: function( html ) {
		var htmlIsFunction = isFunction( html );

		return this.each( function( i ) {
			jQuery( this ).wrapAll( htmlIsFunction ? html.call( this, i ) : html );
		} );
	},

	unwrap: function( selector ) {
		this.parent( selector ).not( "body" ).each( function() {
			jQuery( this ).replaceWith( this.childNodes );
		} );
		return this;
	}
} );


jQuery.expr.pseudos.hidden = function( elem ) {
	return !jQuery.expr.pseudos.visible( elem );
};
jQuery.expr.pseudos.visible = function( elem ) {
	return !!( elem.offsetWidth || elem.offsetHeight || elem.getClientRects().length );
};




jQuery.ajaxSettings.xhr = function() {
	try {
		return new window.XMLHttpRequest();
	} catch ( e ) {}
};

var xhrSuccessStatus = {

		// File protocol always yields status code 0, assume 200
		0: 200,

		// Support: IE <=9 only
		// #1450: sometimes IE returns 1223 when it should be 204
		1223: 204
	},
	xhrSupported = jQuery.ajaxSettings.xhr();

support.cors = !!xhrSupported && ( "withCredentials" in xhrSupported );
support.ajax = xhrSupported = !!xhrSupported;

jQuery.ajaxTransport( function( options ) {
	var callback, errorCallback;

	// Cross domain only allowed if supported through XMLHttpRequest
	if ( support.cors || xhrSupported && !options.crossDomain ) {
		return {
			send: function( headers, complete ) {
				var i,
					xhr = options.xhr();

				xhr.open(
					options.type,
					options.url,
					options.async,
					options.username,
					options.password
				);

				// Apply custom fields if provided
				if ( options.xhrFields ) {
					for ( i in options.xhrFields ) {
						xhr[ i ] = options.xhrFields[ i ];
					}
				}

				// Override mime type if needed
				if ( options.mimeType && xhr.overrideMimeType ) {
					xhr.overrideMimeType( options.mimeType );
				}

				// X-Requested-With header
				// For cross-domain requests, seeing as conditions for a preflight are
				// akin to a jigsaw puzzle, we simply never set it to be sure.
				// (it can always be set on a per-request basis or even using ajaxSetup)
				// For same-domain requests, won't change header if already provided.
				if ( !options.crossDomain && !headers[ "X-Requested-With" ] ) {
					headers[ "X-Requested-With" ] = "XMLHttpRequest";
				}

				// Set headers
				for ( i in headers ) {
					xhr.setRequestHeader( i, headers[ i ] );
				}

				// Callback
				callback = function( type ) {
					return function() {
						if ( callback ) {
							callback = errorCallback = xhr.onload =
								xhr.onerror = xhr.onabort = xhr.ontimeout =
									xhr.onreadystatechange = null;

							if ( type === "abort" ) {
								xhr.abort();
							} else if ( type === "error" ) {

								// Support: IE <=9 only
								// On a manual native abort, IE9 throws
								// errors on any property access that is not readyState
								if ( typeof xhr.status !== "number" ) {
									complete( 0, "error" );
								} else {
									complete(

										// File: protocol always yields status 0; see #8605, #14207
										xhr.status,
										xhr.statusText
									);
								}
							} else {
								complete(
									xhrSuccessStatus[ xhr.status ] || xhr.status,
									xhr.statusText,

									// Support: IE <=9 only
									// IE9 has no XHR2 but throws on binary (trac-11426)
									// For XHR2 non-text, let the caller handle it (gh-2498)
									( xhr.responseType || "text" ) !== "text"  ||
									typeof xhr.responseText !== "string" ?
										{ binary: xhr.response } :
										{ text: xhr.responseText },
									xhr.getAllResponseHeaders()
								);
							}
						}
					};
				};

				// Listen to events
				xhr.onload = callback();
				errorCallback = xhr.onerror = xhr.ontimeout = callback( "error" );

				// Support: IE 9 only
				// Use onreadystatechange to replace onabort
				// to handle uncaught aborts
				if ( xhr.onabort !== undefined ) {
					xhr.onabort = errorCallback;
				} else {
					xhr.onreadystatechange = function() {

						// Check readyState before timeout as it changes
						if ( xhr.readyState === 4 ) {

							// Allow onerror to be called first,
							// but that will not handle a native abort
							// Also, save errorCallback to a variable
							// as xhr.onerror cannot be accessed
							window.setTimeout( function() {
								if ( callback ) {
									errorCallback();
								}
							} );
						}
					};
				}

				// Create the abort callback
				callback = callback( "abort" );

				try {

					// Do send the request (this may raise an exception)
					xhr.send( options.hasContent && options.data || null );
				} catch ( e ) {

					// #14683: Only rethrow if this hasn't been notified as an error yet
					if ( callback ) {
						throw e;
					}
				}
			},

			abort: function() {
				if ( callback ) {
					callback();
				}
			}
		};
	}
} );




// Prevent auto-execution of scripts when no explicit dataType was provided (See gh-2432)
jQuery.ajaxPrefilter( function( s ) {
	if ( s.crossDomain ) {
		s.contents.script = false;
	}
} );

// Install script dataType
jQuery.ajaxSetup( {
	accepts: {
		script: "text/javascript, application/javascript, " +
			"application/ecmascript, application/x-ecmascript"
	},
	contents: {
		script: /\b(?:java|ecma)script\b/
	},
	converters: {
		"text script": function( text ) {
			jQuery.globalEval( text );
			return text;
		}
	}
} );

// Handle cache's special case and crossDomain
jQuery.ajaxPrefilter( "script", function( s ) {
	if ( s.cache === undefined ) {
		s.cache = false;
	}
	if ( s.crossDomain ) {
		s.type = "GET";
	}
} );

// Bind script tag hack transport
jQuery.ajaxTransport( "script", function( s ) {

	// This transport only deals with cross domain requests
	if ( s.crossDomain ) {
		var script, callback;
		return {
			send: function( _, complete ) {
				script = jQuery( "<script>" ).prop( {
					charset: s.scriptCharset,
					src: s.url
				} ).on(
					"load error",
					callback = function( evt ) {
						script.remove();
						callback = null;
						if ( evt ) {
							complete( evt.type === "error" ? 404 : 200, evt.type );
						}
					}
				);

				// Use native DOM manipulation to avoid our domManip AJAX trickery
				document.head.appendChild( script[ 0 ] );
			},
			abort: function() {
				if ( callback ) {
					callback();
				}
			}
		};
	}
} );




var oldCallbacks = [],
	rjsonp = /(=)\?(?=&|$)|\?\?/;

// Default jsonp settings
jQuery.ajaxSetup( {
	jsonp: "callback",
	jsonpCallback: function() {
		var callback = oldCallbacks.pop() || ( jQuery.expando + "_" + ( nonce++ ) );
		this[ callback ] = true;
		return callback;
	}
} );

// Detect, normalize options and install callbacks for jsonp requests
jQuery.ajaxPrefilter( "json jsonp", function( s, originalSettings, jqXHR ) {

	var callbackName, overwritten, responseContainer,
		jsonProp = s.jsonp !== false && ( rjsonp.test( s.url ) ?
			"url" :
			typeof s.data === "string" &&
				( s.contentType || "" )
					.indexOf( "application/x-www-form-urlencoded" ) === 0 &&
				rjsonp.test( s.data ) && "data"
		);

	// Handle iff the expected data type is "jsonp" or we have a parameter to set
	if ( jsonProp || s.dataTypes[ 0 ] === "jsonp" ) {

		// Get callback name, remembering preexisting value associated with it
		callbackName = s.jsonpCallback = isFunction( s.jsonpCallback ) ?
			s.jsonpCallback() :
			s.jsonpCallback;

		// Insert callback into url or form data
		if ( jsonProp ) {
			s[ jsonProp ] = s[ jsonProp ].replace( rjsonp, "$1" + callbackName );
		} else if ( s.jsonp !== false ) {
			s.url += ( rquery.test( s.url ) ? "&" : "?" ) + s.jsonp + "=" + callbackName;
		}

		// Use data converter to retrieve json after script execution
		s.converters[ "script json" ] = function() {
			if ( !responseContainer ) {
				jQuery.error( callbackName + " was not called" );
			}
			return responseContainer[ 0 ];
		};

		// Force json dataType
		s.dataTypes[ 0 ] = "json";

		// Install callback
		overwritten = window[ callbackName ];
		window[ callbackName ] = function() {
			responseContainer = arguments;
		};

		// Clean-up function (fires after converters)
		jqXHR.always( function() {

			// If previous value didn't exist - remove it
			if ( overwritten === undefined ) {
				jQuery( window ).removeProp( callbackName );

			// Otherwise restore preexisting value
			} else {
				window[ callbackName ] = overwritten;
			}

			// Save back as free
			if ( s[ callbackName ] ) {

				// Make sure that re-using the options doesn't screw things around
				s.jsonpCallback = originalSettings.jsonpCallback;

				// Save the callback name for future use
				oldCallbacks.push( callbackName );
			}

			// Call if it was a function and we have a response
			if ( responseContainer && isFunction( overwritten ) ) {
				overwritten( responseContainer[ 0 ] );
			}

			responseContainer = overwritten = undefined;
		} );

		// Delegate to script
		return "script";
	}
} );




// Support: Safari 8 only
// In Safari 8 documents created via document.implementation.createHTMLDocument
// collapse sibling forms: the second one becomes a child of the first one.
// Because of that, this security measure has to be disabled in Safari 8.
// https://bugs.webkit.org/show_bug.cgi?id=137337
support.createHTMLDocument = ( function() {
	var body = document.implementation.createHTMLDocument( "" ).body;
	body.innerHTML = "<form></form><form></form>";
	return body.childNodes.length === 2;
} )();


// Argument "data" should be string of html
// context (optional): If specified, the fragment will be created in this context,
// defaults to document
// keepScripts (optional): If true, will include scripts passed in the html string
jQuery.parseHTML = function( data, context, keepScripts ) {
	if ( typeof data !== "string" ) {
		return [];
	}
	if ( typeof context === "boolean" ) {
		keepScripts = context;
		context = false;
	}

	var base, parsed, scripts;

	if ( !context ) {

		// Stop scripts or inline event handlers from being executed immediately
		// by using document.implementation
		if ( support.createHTMLDocument ) {
			context = document.implementation.createHTMLDocument( "" );

			// Set the base href for the created document
			// so any parsed elements with URLs
			// are based on the document's URL (gh-2965)
			base = context.createElement( "base" );
			base.href = document.location.href;
			context.head.appendChild( base );
		} else {
			context = document;
		}
	}

	parsed = rsingleTag.exec( data );
	scripts = !keepScripts && [];

	// Single tag
	if ( parsed ) {
		return [ context.createElement( parsed[ 1 ] ) ];
	}

	parsed = buildFragment( [ data ], context, scripts );

	if ( scripts && scripts.length ) {
		jQuery( scripts ).remove();
	}

	return jQuery.merge( [], parsed.childNodes );
};


/**
 * Load a url into a page
 */
jQuery.fn.load = function( url, params, callback ) {
	var selector, type, response,
		self = this,
		off = url.indexOf( " " );

	if ( off > -1 ) {
		selector = stripAndCollapse( url.slice( off ) );
		url = url.slice( 0, off );
	}

	// If it's a function
	if ( isFunction( params ) ) {

		// We assume that it's the callback
		callback = params;
		params = undefined;

	// Otherwise, build a param string
	} else if ( params && typeof params === "object" ) {
		type = "POST";
	}

	// If we have elements to modify, make the request
	if ( self.length > 0 ) {
		jQuery.ajax( {
			url: url,

			// If "type" variable is undefined, then "GET" method will be used.
			// Make value of this field explicit since
			// user can override it through ajaxSetup method
			type: type || "GET",
			dataType: "html",
			data: params
		} ).done( function( responseText ) {

			// Save response for use in complete callback
			response = arguments;

			self.html( selector ?

				// If a selector was specified, locate the right elements in a dummy div
				// Exclude scripts to avoid IE 'Permission Denied' errors
				jQuery( "<div>" ).append( jQuery.parseHTML( responseText ) ).find( selector ) :

				// Otherwise use the full result
				responseText );

		// If the request succeeds, this function gets "data", "status", "jqXHR"
		// but they are ignored because response was set above.
		// If it fails, this function gets "jqXHR", "status", "error"
		} ).always( callback && function( jqXHR, status ) {
			self.each( function() {
				callback.apply( this, response || [ jqXHR.responseText, status, jqXHR ] );
			} );
		} );
	}

	return this;
};




// Attach a bunch of functions for handling common AJAX events
jQuery.each( [
	"ajaxStart",
	"ajaxStop",
	"ajaxComplete",
	"ajaxError",
	"ajaxSuccess",
	"ajaxSend"
], function( i, type ) {
	jQuery.fn[ type ] = function( fn ) {
		return this.on( type, fn );
	};
} );




jQuery.expr.pseudos.animated = function( elem ) {
	return jQuery.grep( jQuery.timers, function( fn ) {
		return elem === fn.elem;
	} ).length;
};




jQuery.offset = {
	setOffset: function( elem, options, i ) {
		var curPosition, curLeft, curCSSTop, curTop, curOffset, curCSSLeft, calculatePosition,
			position = jQuery.css( elem, "position" ),
			curElem = jQuery( elem ),
			props = {};

		// Set position first, in-case top/left are set even on static elem
		if ( position === "static" ) {
			elem.style.position = "relative";
		}

		curOffset = curElem.offset();
		curCSSTop = jQuery.css( elem, "top" );
		curCSSLeft = jQuery.css( elem, "left" );
		calculatePosition = ( position === "absolute" || position === "fixed" ) &&
			( curCSSTop + curCSSLeft ).indexOf( "auto" ) > -1;

		// Need to be able to calculate position if either
		// top or left is auto and position is either absolute or fixed
		if ( calculatePosition ) {
			curPosition = curElem.position();
			curTop = curPosition.top;
			curLeft = curPosition.left;

		} else {
			curTop = parseFloat( curCSSTop ) || 0;
			curLeft = parseFloat( curCSSLeft ) || 0;
		}

		if ( isFunction( options ) ) {

			// Use jQuery.extend here to allow modification of coordinates argument (gh-1848)
			options = options.call( elem, i, jQuery.extend( {}, curOffset ) );
		}

		if ( options.top != null ) {
			props.top = ( options.top - curOffset.top ) + curTop;
		}
		if ( options.left != null ) {
			props.left = ( options.left - curOffset.left ) + curLeft;
		}

		if ( "using" in options ) {
			options.using.call( elem, props );

		} else {
			curElem.css( props );
		}
	}
};

jQuery.fn.extend( {

	// offset() relates an element's border box to the document origin
	offset: function( options ) {

		// Preserve chaining for setter
		if ( arguments.length ) {
			return options === undefined ?
				this :
				this.each( function( i ) {
					jQuery.offset.setOffset( this, options, i );
				} );
		}

		var rect, win,
			elem = this[ 0 ];

		if ( !elem ) {
			return;
		}

		// Return zeros for disconnected and hidden (display: none) elements (gh-2310)
		// Support: IE <=11 only
		// Running getBoundingClientRect on a
		// disconnected node in IE throws an error
		if ( !elem.getClientRects().length ) {
			return { top: 0, left: 0 };
		}

		// Get document-relative position by adding viewport scroll to viewport-relative gBCR
		rect = elem.getBoundingClientRect();
		win = elem.ownerDocument.defaultView;
		return {
			top: rect.top + win.pageYOffset,
			left: rect.left + win.pageXOffset
		};
	},

	// position() relates an element's margin box to its offset parent's padding box
	// This corresponds to the behavior of CSS absolute positioning
	position: function() {
		if ( !this[ 0 ] ) {
			return;
		}

		var offsetParent, offset, doc,
			elem = this[ 0 ],
			parentOffset = { top: 0, left: 0 };

		// position:fixed elements are offset from the viewport, which itself always has zero offset
		if ( jQuery.css( elem, "position" ) === "fixed" ) {

			// Assume position:fixed implies availability of getBoundingClientRect
			offset = elem.getBoundingClientRect();

		} else {
			offset = this.offset();

			// Account for the *real* offset parent, which can be the document or its root element
			// when a statically positioned element is identified
			doc = elem.ownerDocument;
			offsetParent = elem.offsetParent || doc.documentElement;
			while ( offsetParent &&
				( offsetParent === doc.body || offsetParent === doc.documentElement ) &&
				jQuery.css( offsetParent, "position" ) === "static" ) {

				offsetParent = offsetParent.parentNode;
			}
			if ( offsetParent && offsetParent !== elem && offsetParent.nodeType === 1 ) {

				// Incorporate borders into its offset, since they are outside its content origin
				parentOffset = jQuery( offsetParent ).offset();
				parentOffset.top += jQuery.css( offsetParent, "borderTopWidth", true );
				parentOffset.left += jQuery.css( offsetParent, "borderLeftWidth", true );
			}
		}

		// Subtract parent offsets and element margins
		return {
			top: offset.top - parentOffset.top - jQuery.css( elem, "marginTop", true ),
			left: offset.left - parentOffset.left - jQuery.css( elem, "marginLeft", true )
		};
	},

	// This method will return documentElement in the following cases:
	// 1) For the element inside the iframe without offsetParent, this method will return
	//    documentElement of the parent window
	// 2) For the hidden or detached element
	// 3) For body or html element, i.e. in case of the html node - it will return itself
	//
	// but those exceptions were never presented as a real life use-cases
	// and might be considered as more preferable results.
	//
	// This logic, however, is not guaranteed and can change at any point in the future
	offsetParent: function() {
		return this.map( function() {
			var offsetParent = this.offsetParent;

			while ( offsetParent && jQuery.css( offsetParent, "position" ) === "static" ) {
				offsetParent = offsetParent.offsetParent;
			}

			return offsetParent || documentElement;
		} );
	}
} );

// Create scrollLeft and scrollTop methods
jQuery.each( { scrollLeft: "pageXOffset", scrollTop: "pageYOffset" }, function( method, prop ) {
	var top = "pageYOffset" === prop;

	jQuery.fn[ method ] = function( val ) {
		return access( this, function( elem, method, val ) {

			// Coalesce documents and windows
			var win;
			if ( isWindow( elem ) ) {
				win = elem;
			} else if ( elem.nodeType === 9 ) {
				win = elem.defaultView;
			}

			if ( val === undefined ) {
				return win ? win[ prop ] : elem[ method ];
			}

			if ( win ) {
				win.scrollTo(
					!top ? val : win.pageXOffset,
					top ? val : win.pageYOffset
				);

			} else {
				elem[ method ] = val;
			}
		}, method, val, arguments.length );
	};
} );

// Support: Safari <=7 - 9.1, Chrome <=37 - 49
// Add the top/left cssHooks using jQuery.fn.position
// Webkit bug: https://bugs.webkit.org/show_bug.cgi?id=29084
// Blink bug: https://bugs.chromium.org/p/chromium/issues/detail?id=589347
// getComputedStyle returns percent when specified for top/left/bottom/right;
// rather than make the css module depend on the offset module, just check for it here
jQuery.each( [ "top", "left" ], function( i, prop ) {
	jQuery.cssHooks[ prop ] = addGetHookIf( support.pixelPosition,
		function( elem, computed ) {
			if ( computed ) {
				computed = curCSS( elem, prop );

				// If curCSS returns percentage, fallback to offset
				return rnumnonpx.test( computed ) ?
					jQuery( elem ).position()[ prop ] + "px" :
					computed;
			}
		}
	);
} );


// Create innerHeight, innerWidth, height, width, outerHeight and outerWidth methods
jQuery.each( { Height: "height", Width: "width" }, function( name, type ) {
	jQuery.each( { padding: "inner" + name, content: type, "": "outer" + name },
		function( defaultExtra, funcName ) {

		// Margin is only for outerHeight, outerWidth
		jQuery.fn[ funcName ] = function( margin, value ) {
			var chainable = arguments.length && ( defaultExtra || typeof margin !== "boolean" ),
				extra = defaultExtra || ( margin === true || value === true ? "margin" : "border" );

			return access( this, function( elem, type, value ) {
				var doc;

				if ( isWindow( elem ) ) {

					// $( window ).outerWidth/Height return w/h including scrollbars (gh-1729)
					return funcName.indexOf( "outer" ) === 0 ?
						elem[ "inner" + name ] :
						elem.document.documentElement[ "client" + name ];
				}

				// Get document width or height
				if ( elem.nodeType === 9 ) {
					doc = elem.documentElement;

					// Either scroll[Width/Height] or offset[Width/Height] or client[Width/Height],
					// whichever is greatest
					return Math.max(
						elem.body[ "scroll" + name ], doc[ "scroll" + name ],
						elem.body[ "offset" + name ], doc[ "offset" + name ],
						doc[ "client" + name ]
					);
				}

				return value === undefined ?

					// Get width or height on the element, requesting but not forcing parseFloat
					jQuery.css( elem, type, extra ) :

					// Set width or height on the element
					jQuery.style( elem, type, value, extra );
			}, type, chainable ? margin : undefined, chainable );
		};
	} );
} );


jQuery.each( ( "blur focus focusin focusout resize scroll click dblclick " +
	"mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave " +
	"change select submit keydown keypress keyup contextmenu" ).split( " " ),
	function( i, name ) {

	// Handle event binding
	jQuery.fn[ name ] = function( data, fn ) {
		return arguments.length > 0 ?
			this.on( name, null, data, fn ) :
			this.trigger( name );
	};
} );

jQuery.fn.extend( {
	hover: function( fnOver, fnOut ) {
		return this.mouseenter( fnOver ).mouseleave( fnOut || fnOver );
	}
} );




jQuery.fn.extend( {

	bind: function( types, data, fn ) {
		return this.on( types, null, data, fn );
	},
	unbind: function( types, fn ) {
		return this.off( types, null, fn );
	},

	delegate: function( selector, types, data, fn ) {
		return this.on( types, selector, data, fn );
	},
	undelegate: function( selector, types, fn ) {

		// ( namespace ) or ( selector, types [, fn] )
		return arguments.length === 1 ?
			this.off( selector, "**" ) :
			this.off( types, selector || "**", fn );
	}
} );

// Bind a function to a context, optionally partially applying any
// arguments.
// jQuery.proxy is deprecated to promote standards (specifically Function#bind)
// However, it is not slated for removal any time soon
jQuery.proxy = function( fn, context ) {
	var tmp, args, proxy;

	if ( typeof context === "string" ) {
		tmp = fn[ context ];
		context = fn;
		fn = tmp;
	}

	// Quick check to determine if target is callable, in the spec
	// this throws a TypeError, but we will just return undefined.
	if ( !isFunction( fn ) ) {
		return undefined;
	}

	// Simulated bind
	args = slice.call( arguments, 2 );
	proxy = function() {
		return fn.apply( context || this, args.concat( slice.call( arguments ) ) );
	};

	// Set the guid of unique handler to the same of original handler, so it can be removed
	proxy.guid = fn.guid = fn.guid || jQuery.guid++;

	return proxy;
};

jQuery.holdReady = function( hold ) {
	if ( hold ) {
		jQuery.readyWait++;
	} else {
		jQuery.ready( true );
	}
};
jQuery.isArray = Array.isArray;
jQuery.parseJSON = JSON.parse;
jQuery.nodeName = nodeName;
jQuery.isFunction = isFunction;
jQuery.isWindow = isWindow;
jQuery.camelCase = camelCase;
jQuery.type = toType;

jQuery.now = Date.now;

jQuery.isNumeric = function( obj ) {

	// As of jQuery 3.0, isNumeric is limited to
	// strings and numbers (primitives or objects)
	// that can be coerced to finite numbers (gh-2662)
	var type = jQuery.type( obj );
	return ( type === "number" || type === "string" ) &&

		// parseFloat NaNs numeric-cast false positives ("")
		// ...but misinterprets leading-number strings, particularly hex literals ("0x...")
		// subtraction forces infinities to NaN
		!isNaN( obj - parseFloat( obj ) );
};




// Register as a named AMD module, since jQuery can be concatenated with other
// files that may use define, but not via a proper concatenation script that
// understands anonymous AMD modules. A named AMD is safest and most robust
// way to register. Lowercase jquery is used because AMD module names are
// derived from file names, and jQuery is normally delivered in a lowercase
// file name. Do this after creating the global so that if an AMD module wants
// to call noConflict to hide this version of jQuery, it will work.

// Note that for maximum portability, libraries that are not jQuery should
// declare themselves as anonymous modules, and avoid setting a global if an
// AMD loader is present. jQuery is a special case. For more information, see
// https://github.com/jrburke/requirejs/wiki/Updating-existing-libraries#wiki-anon

if ( typeof define === "function" && define.amd ) {
	define( "jquery", [], function() {
		return jQuery;
	} );
}




var

	// Map over jQuery in case of overwrite
	_jQuery = window.jQuery,

	// Map over the $ in case of overwrite
	_$ = window.$;

jQuery.noConflict = function( deep ) {
	if ( window.$ === jQuery ) {
		window.$ = _$;
	}

	if ( deep && window.jQuery === jQuery ) {
		window.jQuery = _jQuery;
	}

	return jQuery;
};

// Expose jQuery and $ identifiers, even in AMD
// (#7102#comment:10, https://github.com/jquery/jquery/pull/557)
// and CommonJS for browser emulators (#13566)
if ( !noGlobal ) {
	window.jQuery = window.$ = jQuery;
}




return jQuery;
} );

},{}],25:[function(require,module,exports){
var kindOf = require('./kindOf');
var isPlainObject = require('./isPlainObject');
var mixIn = require('../object/mixIn');

    /**
     * Clone native types.
     */
    function clone(val){
        switch (kindOf(val)) {
            case 'Object':
                return cloneObject(val);
            case 'Array':
                return cloneArray(val);
            case 'RegExp':
                return cloneRegExp(val);
            case 'Date':
                return cloneDate(val);
            default:
                return val;
        }
    }

    function cloneObject(source) {
        if (isPlainObject(source)) {
            return mixIn({}, source);
        } else {
            return source;
        }
    }

    function cloneRegExp(r) {
        var flags = '';
        flags += r.multiline ? 'm' : '';
        flags += r.global ? 'g' : '';
        flags += r.ignoreCase ? 'i' : '';
        return new RegExp(r.source, flags);
    }

    function cloneDate(date) {
        return new Date(+date);
    }

    function cloneArray(arr) {
        return arr.slice();
    }

    module.exports = clone;



},{"../object/mixIn":39,"./isPlainObject":31,"./kindOf":32}],26:[function(require,module,exports){
var mixIn = require('../object/mixIn');

    /**
     * Create Object using prototypal inheritance and setting custom properties.
     * - Mix between Douglas Crockford Prototypal Inheritance <http://javascript.crockford.com/prototypal.html> and the EcmaScript 5 `Object.create()` method.
     * @param {object} parent    Parent Object.
     * @param {object} [props] Object properties.
     * @return {object} Created object.
     */
    function createObject(parent, props){
        function F(){}
        F.prototype = parent;
        return mixIn(new F(), props);

    }
    module.exports = createObject;



},{"../object/mixIn":39}],27:[function(require,module,exports){
var clone = require('./clone');
var forOwn = require('../object/forOwn');
var kindOf = require('./kindOf');
var isPlainObject = require('./isPlainObject');

    /**
     * Recursively clone native types.
     */
    function deepClone(val, instanceClone) {
        switch ( kindOf(val) ) {
            case 'Object':
                return cloneObject(val, instanceClone);
            case 'Array':
                return cloneArray(val, instanceClone);
            default:
                return clone(val);
        }
    }

    function cloneObject(source, instanceClone) {
        if (isPlainObject(source)) {
            var out = {};
            forOwn(source, function(val, key) {
                this[key] = deepClone(val, instanceClone);
            }, out);
            return out;
        } else if (instanceClone) {
            return instanceClone(source);
        } else {
            return source;
        }
    }

    function cloneArray(arr, instanceClone) {
        var out = [],
            i = -1,
            n = arr.length,
            val;
        while (++i < n) {
            out[i] = deepClone(arr[i], instanceClone);
        }
        return out;
    }

    module.exports = deepClone;




},{"../object/forOwn":36,"./clone":25,"./isPlainObject":31,"./kindOf":32}],28:[function(require,module,exports){
var isKind = require('./isKind');
    /**
     */
    var isArray = Array.isArray || function (val) {
        return isKind(val, 'Array');
    };
    module.exports = isArray;


},{"./isKind":29}],29:[function(require,module,exports){
var kindOf = require('./kindOf');
    /**
     * Check if value is from a specific "kind".
     */
    function isKind(val, kind){
        return kindOf(val) === kind;
    }
    module.exports = isKind;


},{"./kindOf":32}],30:[function(require,module,exports){
var isKind = require('./isKind');
    /**
     */
    function isObject(val) {
        return isKind(val, 'Object');
    }
    module.exports = isObject;


},{"./isKind":29}],31:[function(require,module,exports){


    /**
     * Checks if the value is created by the `Object` constructor.
     */
    function isPlainObject(value) {
        return (!!value && typeof value === 'object' &&
            value.constructor === Object);
    }

    module.exports = isPlainObject;



},{}],32:[function(require,module,exports){

    /**
     * Gets the "kind" of value. (e.g. "String", "Number", etc)
     */
    function kindOf(val) {
        return Object.prototype.toString.call(val).slice(8, -1);
    }
    module.exports = kindOf;


},{}],33:[function(require,module,exports){
/**
 * @constant Maximum 32-bit signed integer value. (2^31 - 1)
 */

    module.exports = 2147483647;


},{}],34:[function(require,module,exports){
/**
 * @constant Minimum 32-bit signed integer value (-2^31).
 */

    module.exports = -2147483648;


},{}],35:[function(require,module,exports){
var hasOwn = require('./hasOwn');

    var _hasDontEnumBug,
        _dontEnums;

    function checkDontEnum(){
        _dontEnums = [
                'toString',
                'toLocaleString',
                'valueOf',
                'hasOwnProperty',
                'isPrototypeOf',
                'propertyIsEnumerable',
                'constructor'
            ];

        _hasDontEnumBug = true;

        for (var key in {'toString': null}) {
            _hasDontEnumBug = false;
        }
    }

    /**
     * Similar to Array/forEach but works over object properties and fixes Don't
     * Enum bug on IE.
     * based on: http://whattheheadsaid.com/2010/10/a-safer-object-keys-compatibility-implementation
     */
    function forIn(obj, fn, thisObj){
        var key, i = 0;
        // no need to check if argument is a real object that way we can use
        // it for arrays, functions, date, etc.

        //post-pone check till needed
        if (_hasDontEnumBug == null) checkDontEnum();

        for (key in obj) {
            if (exec(fn, obj, key, thisObj) === false) {
                break;
            }
        }


        if (_hasDontEnumBug) {
            var ctor = obj.constructor,
                isProto = !!ctor && obj === ctor.prototype;

            while (key = _dontEnums[i++]) {
                // For constructor, if it is a prototype object the constructor
                // is always non-enumerable unless defined otherwise (and
                // enumerated above).  For non-prototype objects, it will have
                // to be defined on this object, since it cannot be defined on
                // any prototype objects.
                //
                // For other [[DontEnum]] properties, check if the value is
                // different than Object prototype value.
                if (
                    (key !== 'constructor' ||
                        (!isProto && hasOwn(obj, key))) &&
                    obj[key] !== Object.prototype[key]
                ) {
                    if (exec(fn, obj, key, thisObj) === false) {
                        break;
                    }
                }
            }
        }
    }

    function exec(fn, obj, key, thisObj){
        return fn.call(thisObj, obj[key], key, obj);
    }

    module.exports = forIn;



},{"./hasOwn":37}],36:[function(require,module,exports){
var hasOwn = require('./hasOwn');
var forIn = require('./forIn');

    /**
     * Similar to Array/forEach but works over object properties and fixes Don't
     * Enum bug on IE.
     * based on: http://whattheheadsaid.com/2010/10/a-safer-object-keys-compatibility-implementation
     */
    function forOwn(obj, fn, thisObj){
        forIn(obj, function(val, key){
            if (hasOwn(obj, key)) {
                return fn.call(thisObj, obj[key], key, obj);
            }
        });
    }

    module.exports = forOwn;



},{"./forIn":35,"./hasOwn":37}],37:[function(require,module,exports){


    /**
     * Safer Object.hasOwnProperty
     */
     function hasOwn(obj, prop){
         return Object.prototype.hasOwnProperty.call(obj, prop);
     }

     module.exports = hasOwn;



},{}],38:[function(require,module,exports){
var hasOwn = require('./hasOwn');
var deepClone = require('../lang/deepClone');
var isObject = require('../lang/isObject');

    /**
     * Deep merge objects.
     */
    function merge() {
        var i = 1,
            key, val, obj, target;

        // make sure we don't modify source element and it's properties
        // objects are passed by reference
        target = deepClone( arguments[0] );

        while (obj = arguments[i++]) {
            for (key in obj) {
                if ( ! hasOwn(obj, key) ) {
                    continue;
                }

                val = obj[key];

                if ( isObject(val) && isObject(target[key]) ){
                    // inception, deep merge objects
                    target[key] = merge(target[key], val);
                } else {
                    // make sure arrays, regexp, date, objects are cloned
                    target[key] = deepClone(val);
                }

            }
        }

        return target;
    }

    module.exports = merge;



},{"../lang/deepClone":27,"../lang/isObject":30,"./hasOwn":37}],39:[function(require,module,exports){
var forOwn = require('./forOwn');

    /**
    * Combine properties from all the objects into first one.
    * - This method affects target object in place, if you want to create a new Object pass an empty object as first param.
    * @param {object} target    Target Object
    * @param {...object} objects    Objects to be combined (0...n objects).
    * @return {object} Target Object.
    */
    function mixIn(target, objects){
        var i = 0,
            n = arguments.length,
            obj;
        while(++i < n){
            obj = arguments[i];
            if (obj != null) {
                forOwn(obj, copyProp, target);
            }
        }
        return target;
    }

    function copyProp(val, key){
        this[key] = val;
    }

    module.exports = mixIn;


},{"./forOwn":36}],40:[function(require,module,exports){
var randInt = require('./randInt');
var isArray = require('../lang/isArray');

    /**
     * Returns a random element from the supplied arguments
     * or from the array (if single argument is an array).
     */
    function choice(items) {
        var target = (arguments.length === 1 && isArray(items))? items : arguments;
        return target[ randInt(0, target.length - 1) ];
    }

    module.exports = choice;



},{"../lang/isArray":28,"./randInt":44}],41:[function(require,module,exports){
var randHex = require('./randHex');
var choice = require('./choice');

  /**
   * Returns pseudo-random guid (UUID v4)
   * IMPORTANT: it's not totally "safe" since randHex/choice uses Math.random
   * by default and sequences can be predicted in some cases. See the
   * "random/random" documentation for more info about it and how to replace
   * the default PRNG.
   */
  function guid() {
    return (
        randHex(8)+'-'+
        randHex(4)+'-'+
        // v4 UUID always contain "4" at this position to specify it was
        // randomly generated
        '4' + randHex(3) +'-'+
        // v4 UUID always contain chars [a,b,8,9] at this position
        choice(8, 9, 'a', 'b') + randHex(3)+'-'+
        randHex(12)
    );
  }
  module.exports = guid;


},{"./choice":40,"./randHex":43}],42:[function(require,module,exports){
var random = require('./random');
var MIN_INT = require('../number/MIN_INT');
var MAX_INT = require('../number/MAX_INT');

    /**
     * Returns random number inside range
     */
    function rand(min, max){
        min = min == null? MIN_INT : min;
        max = max == null? MAX_INT : max;
        return min + (max - min) * random();
    }

    module.exports = rand;


},{"../number/MAX_INT":33,"../number/MIN_INT":34,"./random":45}],43:[function(require,module,exports){
var choice = require('./choice');

    var _chars = '0123456789abcdef'.split('');

    /**
     * Returns a random hexadecimal string
     */
    function randHex(size){
        size = size && size > 0? size : 6;
        var str = '';
        while (size--) {
            str += choice(_chars);
        }
        return str;
    }

    module.exports = randHex;



},{"./choice":40}],44:[function(require,module,exports){
var MIN_INT = require('../number/MIN_INT');
var MAX_INT = require('../number/MAX_INT');
var rand = require('./rand');

    /**
     * Gets random integer inside range or snap to min/max values.
     */
    function randInt(min, max){
        min = min == null? MIN_INT : ~~min;
        max = max == null? MAX_INT : ~~max;
        // can't be max + 0.5 otherwise it will round up if `rand`
        // returns `max` causing it to overflow range.
        // -0.5 and + 0.49 are required to avoid bias caused by rounding
        return Math.round( rand(min - 0.5, max + 0.499999999999) );
    }

    module.exports = randInt;


},{"../number/MAX_INT":33,"../number/MIN_INT":34,"./rand":42}],45:[function(require,module,exports){


    /**
     * Just a wrapper to Math.random. No methods inside mout/random should call
     * Math.random() directly so we can inject the pseudo-random number
     * generator if needed (ie. in case we need a seeded random or a better
     * algorithm than the native one)
     */
    function random(){
        return random.get();
    }

    // we expose the method so it can be swapped if needed
    random.get = Math.random;

    module.exports = random;



},{}],46:[function(require,module,exports){
!function(t,i){"object"==typeof exports&&"object"==typeof module?module.exports=i():"function"==typeof define&&define.amd?define("nipplejs",[],i):"object"==typeof exports?exports.nipplejs=i():t.nipplejs=i()}(window,function(){return function(t){var i={};function e(o){if(i[o])return i[o].exports;var n=i[o]={i:o,l:!1,exports:{}};return t[o].call(n.exports,n,n.exports,e),n.l=!0,n.exports}return e.m=t,e.c=i,e.d=function(t,i,o){e.o(t,i)||Object.defineProperty(t,i,{enumerable:!0,get:o})},e.r=function(t){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(t,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(t,"__esModule",{value:!0})},e.t=function(t,i){if(1&i&&(t=e(t)),8&i)return t;if(4&i&&"object"==typeof t&&t&&t.__esModule)return t;var o=Object.create(null);if(e.r(o),Object.defineProperty(o,"default",{enumerable:!0,value:t}),2&i&&"string"!=typeof t)for(var n in t)e.d(o,n,function(i){return t[i]}.bind(null,n));return o},e.n=function(t){var i=t&&t.__esModule?function(){return t.default}:function(){return t};return e.d(i,"a",i),i},e.o=function(t,i){return Object.prototype.hasOwnProperty.call(t,i)},e.p="",e(e.s=0)}([function(t,i,e){"use strict";e.r(i);var o,n=function(t,i){var e=i.x-t.x,o=i.y-t.y;return Math.sqrt(e*e+o*o)},s=function(t){return t*(Math.PI/180)},r=function(t){return t*(180/Math.PI)},d=function(t,i,e){for(var o,n=i.split(/[ ,]+/g),s=0;s<n.length;s+=1)o=n[s],t.addEventListener?t.addEventListener(o,e,!1):t.attachEvent&&t.attachEvent(o,e)},p=function(t,i,e){for(var o,n=i.split(/[ ,]+/g),s=0;s<n.length;s+=1)o=n[s],t.removeEventListener?t.removeEventListener(o,e):t.detachEvent&&t.detachEvent(o,e)},a=function(t){return t.preventDefault(),t.type.match(/^touch/)?t.changedTouches:t},c=function(){return{x:void 0!==window.pageXOffset?window.pageXOffset:(document.documentElement||document.body.parentNode||document.body).scrollLeft,y:void 0!==window.pageYOffset?window.pageYOffset:(document.documentElement||document.body.parentNode||document.body).scrollTop}},h=function(t,i){i.top||i.right||i.bottom||i.left?(t.style.top=i.top,t.style.right=i.right,t.style.bottom=i.bottom,t.style.left=i.left):(t.style.left=i.x+"px",t.style.top=i.y+"px")},l=function(t,i,e){var o=u(t);for(var n in o)if(o.hasOwnProperty(n))if("string"==typeof i)o[n]=i+" "+e;else{for(var s="",r=0,d=i.length;r<d;r+=1)s+=i[r]+" "+e+", ";o[n]=s.slice(0,-2)}return o},u=function(t){var i={};i[t]="";return["webkit","Moz","o"].forEach(function(e){i[e+t.charAt(0).toUpperCase()+t.slice(1)]=""}),i},f=function(t,i){for(var e in i)i.hasOwnProperty(e)&&(t[e]=i[e]);return t},y=function(t,i){if(t.length)for(var e=0,o=t.length;e<o;e+=1)i(t[e]);else i(t)},m=!!("ontouchstart"in window),v=!!window.PointerEvent,g=!!window.MSPointerEvent,b={start:"mousedown",move:"mousemove",end:"mouseup"},x={};function O(){}v?o={start:"pointerdown",move:"pointermove",end:"pointerup, pointercancel"}:g?o={start:"MSPointerDown",move:"MSPointerMove",end:"MSPointerUp"}:m?(o={start:"touchstart",move:"touchmove",end:"touchend, touchcancel"},x=b):o=b,O.prototype.on=function(t,i){var e,o=t.split(/[ ,]+/g);this._handlers_=this._handlers_||{};for(var n=0;n<o.length;n+=1)e=o[n],this._handlers_[e]=this._handlers_[e]||[],this._handlers_[e].push(i);return this},O.prototype.off=function(t,i){return this._handlers_=this._handlers_||{},void 0===t?this._handlers_={}:void 0===i?this._handlers_[t]=null:this._handlers_[t]&&this._handlers_[t].indexOf(i)>=0&&this._handlers_[t].splice(this._handlers_[t].indexOf(i),1),this},O.prototype.trigger=function(t,i){var e,o=this,n=t.split(/[ ,]+/g);o._handlers_=o._handlers_||{};for(var s=0;s<n.length;s+=1)e=n[s],o._handlers_[e]&&o._handlers_[e].length&&o._handlers_[e].forEach(function(t){t.call(o,{type:e,target:o},i)})},O.prototype.config=function(t){this.options=this.defaults||{},t&&(this.options=function(t,i){var e={};for(var o in t)t.hasOwnProperty(o)&&i.hasOwnProperty(o)?e[o]=i[o]:t.hasOwnProperty(o)&&(e[o]=t[o]);return e}(this.options,t))},O.prototype.bindEvt=function(t,i){var e=this;return e._domHandlers_=e._domHandlers_||{},e._domHandlers_[i]=function(){"function"==typeof e["on"+i]?e["on"+i].apply(e,arguments):console.warn('[WARNING] : Missing "on'+i+'" handler.')},d(t,o[i],e._domHandlers_[i]),x[i]&&d(t,x[i],e._domHandlers_[i]),e},O.prototype.unbindEvt=function(t,i){return this._domHandlers_=this._domHandlers_||{},p(t,o[i],this._domHandlers_[i]),x[i]&&p(t,x[i],this._domHandlers_[i]),delete this._domHandlers_[i],this};var _=O;function w(t,i){return this.identifier=i.identifier,this.position=i.position,this.frontPosition=i.frontPosition,this.collection=t,this.defaults={size:100,threshold:.1,color:"white",fadeTime:250,dataOnly:!1,restJoystick:!0,restOpacity:.5,mode:"dynamic",zone:document.body,lockX:!1,lockY:!1},this.config(i),"dynamic"===this.options.mode&&(this.options.restOpacity=0),this.id=w.id,w.id+=1,this.buildEl().stylize(),this.instance={el:this.ui.el,on:this.on.bind(this),off:this.off.bind(this),show:this.show.bind(this),hide:this.hide.bind(this),add:this.addToDom.bind(this),remove:this.removeFromDom.bind(this),destroy:this.destroy.bind(this),resetDirection:this.resetDirection.bind(this),computeDirection:this.computeDirection.bind(this),trigger:this.trigger.bind(this),position:this.position,frontPosition:this.frontPosition,ui:this.ui,identifier:this.identifier,id:this.id,options:this.options},this.instance}w.prototype=new _,w.constructor=w,w.id=0,w.prototype.buildEl=function(t){return this.ui={},this.options.dataOnly?this:(this.ui.el=document.createElement("div"),this.ui.back=document.createElement("div"),this.ui.front=document.createElement("div"),this.ui.el.className="nipple collection_"+this.collection.id,this.ui.back.className="back",this.ui.front.className="front",this.ui.el.setAttribute("id","nipple_"+this.collection.id+"_"+this.id),this.ui.el.appendChild(this.ui.back),this.ui.el.appendChild(this.ui.front),this)},w.prototype.stylize=function(){if(this.options.dataOnly)return this;var t=this.options.fadeTime+"ms",i=function(t,i){var e=u(t);for(var o in e)e.hasOwnProperty(o)&&(e[o]=i);return e}("borderRadius","50%"),e=l("transition","opacity",t),o={};return o.el={position:"absolute",opacity:this.options.restOpacity,display:"block",zIndex:999},o.back={position:"absolute",display:"block",width:this.options.size+"px",height:this.options.size+"px",marginLeft:-this.options.size/2+"px",marginTop:-this.options.size/2+"px",background:this.options.color,opacity:".5"},o.front={width:this.options.size/2+"px",height:this.options.size/2+"px",position:"absolute",display:"block",marginLeft:-this.options.size/4+"px",marginTop:-this.options.size/4+"px",background:this.options.color,opacity:".5"},f(o.el,e),f(o.back,i),f(o.front,i),this.applyStyles(o),this},w.prototype.applyStyles=function(t){for(var i in this.ui)if(this.ui.hasOwnProperty(i))for(var e in t[i])this.ui[i].style[e]=t[i][e];return this},w.prototype.addToDom=function(){return this.options.dataOnly||document.body.contains(this.ui.el)?this:(this.options.zone.appendChild(this.ui.el),this)},w.prototype.removeFromDom=function(){return this.options.dataOnly||!document.body.contains(this.ui.el)?this:(this.options.zone.removeChild(this.ui.el),this)},w.prototype.destroy=function(){clearTimeout(this.removeTimeout),clearTimeout(this.showTimeout),clearTimeout(this.restTimeout),this.trigger("destroyed",this.instance),this.removeFromDom(),this.off()},w.prototype.show=function(t){var i=this;return i.options.dataOnly?i:(clearTimeout(i.removeTimeout),clearTimeout(i.showTimeout),clearTimeout(i.restTimeout),i.addToDom(),i.restCallback(),setTimeout(function(){i.ui.el.style.opacity=1},0),i.showTimeout=setTimeout(function(){i.trigger("shown",i.instance),"function"==typeof t&&t.call(this)},i.options.fadeTime),i)},w.prototype.hide=function(t){var i=this;return i.options.dataOnly?i:(i.ui.el.style.opacity=i.options.restOpacity,clearTimeout(i.removeTimeout),clearTimeout(i.showTimeout),clearTimeout(i.restTimeout),i.removeTimeout=setTimeout(function(){var e="dynamic"===i.options.mode?"none":"block";i.ui.el.style.display=e,"function"==typeof t&&t.call(i),i.trigger("hidden",i.instance)},i.options.fadeTime),i.options.restJoystick&&i.restPosition(),i)},w.prototype.restPosition=function(t){var i=this;i.frontPosition={x:0,y:0};var e=i.options.fadeTime+"ms",o={};o.front=l("transition",["top","left"],e);var n={front:{}};n.front={left:i.frontPosition.x+"px",top:i.frontPosition.y+"px"},i.applyStyles(o),i.applyStyles(n),i.restTimeout=setTimeout(function(){"function"==typeof t&&t.call(i),i.restCallback()},i.options.fadeTime)},w.prototype.restCallback=function(){var t={};t.front=l("transition","none",""),this.applyStyles(t),this.trigger("rested",this.instance)},w.prototype.resetDirection=function(){this.direction={x:!1,y:!1,angle:!1}},w.prototype.computeDirection=function(t){var i,e,o,n=t.angle.radian,s=Math.PI/4,r=Math.PI/2;if(n>s&&n<3*s&&!t.lockX?i="up":n>-s&&n<=s&&!t.lockY?i="left":n>3*-s&&n<=-s&&!t.lockX?i="down":t.lockY||(i="right"),t.lockY||(e=n>-r&&n<r?"left":"right"),t.lockX||(o=n>0?"up":"down"),t.force>this.options.threshold){var d,p={};for(d in this.direction)this.direction.hasOwnProperty(d)&&(p[d]=this.direction[d]);var a={};for(d in this.direction={x:e,y:o,angle:i},t.direction=this.direction,p)p[d]===this.direction[d]&&(a[d]=!0);if(a.x&&a.y&&a.angle)return t;a.x&&a.y||this.trigger("plain",t),a.x||this.trigger("plain:"+e,t),a.y||this.trigger("plain:"+o,t),a.angle||this.trigger("dir dir:"+i,t)}return t};var T=w;function k(t,i){return this.nipples=[],this.idles=[],this.actives=[],this.ids=[],this.pressureIntervals={},this.manager=t,this.id=k.id,k.id+=1,this.defaults={zone:document.body,multitouch:!1,maxNumberOfNipples:10,mode:"dynamic",position:{top:0,left:0},catchDistance:200,size:100,threshold:.1,color:"white",fadeTime:250,dataOnly:!1,restJoystick:!0,restOpacity:.5,lockX:!1,lockY:!1},this.config(i),"static"!==this.options.mode&&"semi"!==this.options.mode||(this.options.multitouch=!1),this.options.multitouch||(this.options.maxNumberOfNipples=1),this.updateBox(),this.prepareNipples(),this.bindings(),this.begin(),this.nipples}k.prototype=new _,k.constructor=k,k.id=0,k.prototype.prepareNipples=function(){var t=this.nipples;t.on=this.on.bind(this),t.off=this.off.bind(this),t.options=this.options,t.destroy=this.destroy.bind(this),t.ids=this.ids,t.id=this.id,t.processOnMove=this.processOnMove.bind(this),t.processOnEnd=this.processOnEnd.bind(this),t.get=function(i){if(void 0===i)return t[0];for(var e=0,o=t.length;e<o;e+=1)if(t[e].identifier===i)return t[e];return!1}},k.prototype.bindings=function(){this.bindEvt(this.options.zone,"start"),this.options.zone.style.touchAction="none",this.options.zone.style.msTouchAction="none"},k.prototype.begin=function(){var t=this.options;if("static"===t.mode){var i=this.createNipple(t.position,this.manager.getIdentifier());i.add(),this.idles.push(i)}},k.prototype.createNipple=function(t,i){var e=c(),o={},n=this.options;if(t.x&&t.y)o={x:t.x-(e.x+this.box.left),y:t.y-(e.y+this.box.top)};else if(t.top||t.right||t.bottom||t.left){var s=document.createElement("DIV");s.style.display="hidden",s.style.top=t.top,s.style.right=t.right,s.style.bottom=t.bottom,s.style.left=t.left,s.style.position="absolute",n.zone.appendChild(s);var r=s.getBoundingClientRect();n.zone.removeChild(s),o=t,t={x:r.left+e.x,y:r.top+e.y}}var d=new T(this,{color:n.color,size:n.size,threshold:n.threshold,fadeTime:n.fadeTime,dataOnly:n.dataOnly,restJoystick:n.restJoystick,restOpacity:n.restOpacity,mode:n.mode,identifier:i,position:t,zone:n.zone,frontPosition:{x:0,y:0}});return n.dataOnly||(h(d.ui.el,o),h(d.ui.front,d.frontPosition)),this.nipples.push(d),this.trigger("added "+d.identifier+":added",d),this.manager.trigger("added "+d.identifier+":added",d),this.bindNipple(d),d},k.prototype.updateBox=function(){this.box=this.options.zone.getBoundingClientRect()},k.prototype.bindNipple=function(t){var i,e=this,o=function(t,o){i=t.type+" "+o.id+":"+t.type,e.trigger(i,o)};t.on("destroyed",e.onDestroyed.bind(e)),t.on("shown hidden rested dir plain",o),t.on("dir:up dir:right dir:down dir:left",o),t.on("plain:up plain:right plain:down plain:left",o)},k.prototype.pressureFn=function(t,i,e){var o=this,n=0;clearInterval(o.pressureIntervals[e]),o.pressureIntervals[e]=setInterval(function(){var e=t.force||t.pressure||t.webkitForce||0;e!==n&&(i.trigger("pressure",e),o.trigger("pressure "+i.identifier+":pressure",e),n=e)}.bind(o),100)},k.prototype.onstart=function(t){var i=this,e=i.options;t=a(t),i.updateBox();return y(t,function(t){i.actives.length<e.maxNumberOfNipples&&i.processOnStart(t)}),i.manager.bindDocument(),!1},k.prototype.processOnStart=function(t){var i,e=this,o=e.options,s=e.manager.getIdentifier(t),r=t.force||t.pressure||t.webkitForce||0,d={x:t.pageX,y:t.pageY},p=e.getOrCreate(s,d);p.identifier!==s&&e.manager.removeIdentifier(p.identifier),p.identifier=s;var a=function(i){i.trigger("start",i),e.trigger("start "+i.id+":start",i),i.show(),r>0&&e.pressureFn(t,i,i.identifier),e.processOnMove(t)};if((i=e.idles.indexOf(p))>=0&&e.idles.splice(i,1),e.actives.push(p),e.ids.push(p.identifier),"semi"!==o.mode)a(p);else{if(!(n(d,p.position)<=o.catchDistance))return p.destroy(),void e.processOnStart(t);a(p)}return p},k.prototype.getOrCreate=function(t,i){var e,o=this.options;return/(semi|static)/.test(o.mode)?(e=this.idles[0])?(this.idles.splice(0,1),e):"semi"===o.mode?this.createNipple(i,t):(console.warn("Coudln't find the needed nipple."),!1):e=this.createNipple(i,t)},k.prototype.processOnMove=function(t){var i=this.options,e=this.manager.getIdentifier(t),o=this.nipples.get(e);if(!o)return console.error("Found zombie joystick with ID "+e),void this.manager.removeIdentifier(e);o.identifier=e;var d,p,a,c,l,u,f,y,m=o.options.size/2,v={x:t.pageX,y:t.pageY},g=n(v,o.position),b=(d=v,p=o.position,a=p.x-d.x,c=p.y-d.y,r(Math.atan2(c,a))),x=s(b),O=g/m;g>m&&(g=m,l=o.position,u=g,y={x:0,y:0},f=s(f=b),y.x=l.x-u*Math.cos(f),y.y=l.y-u*Math.sin(f),v=y);var _=v.x-o.position.x,w=v.y-o.position.y;i.lockX&&(w=0),i.lockY&&(_=0),o.frontPosition={x:_,y:w},i.dataOnly||h(o.ui.front,o.frontPosition);var T={identifier:o.identifier,position:v,force:O,pressure:t.force||t.pressure||t.webkitForce||0,distance:g,angle:{radian:x,degree:b},instance:o,lockX:i.lockX,lockY:i.lockY};(T=o.computeDirection(T)).angle={radian:s(180-b),degree:180-b},o.trigger("move",T),this.trigger("move "+o.id+":move",T)},k.prototype.processOnEnd=function(t){var i=this,e=i.options,o=i.manager.getIdentifier(t),n=i.nipples.get(o),s=i.manager.removeIdentifier(n.identifier);n&&(e.dataOnly||n.hide(function(){"dynamic"===e.mode&&(n.trigger("removed",n),i.trigger("removed "+n.id+":removed",n),i.manager.trigger("removed "+n.id+":removed",n),n.destroy())}),clearInterval(i.pressureIntervals[n.identifier]),n.resetDirection(),n.trigger("end",n),i.trigger("end "+n.id+":end",n),i.ids.indexOf(n.identifier)>=0&&i.ids.splice(i.ids.indexOf(n.identifier),1),i.actives.indexOf(n)>=0&&i.actives.splice(i.actives.indexOf(n),1),/(semi|static)/.test(e.mode)?i.idles.push(n):i.nipples.indexOf(n)>=0&&i.nipples.splice(i.nipples.indexOf(n),1),i.manager.unbindDocument(),/(semi|static)/.test(e.mode)&&(i.manager.ids[s.id]=s.identifier))},k.prototype.onDestroyed=function(t,i){this.nipples.indexOf(i)>=0&&this.nipples.splice(this.nipples.indexOf(i),1),this.actives.indexOf(i)>=0&&this.actives.splice(this.actives.indexOf(i),1),this.idles.indexOf(i)>=0&&this.idles.splice(this.idles.indexOf(i),1),this.ids.indexOf(i.identifier)>=0&&this.ids.splice(this.ids.indexOf(i.identifier),1),this.manager.removeIdentifier(i.identifier),this.manager.unbindDocument()},k.prototype.destroy=function(){for(var t in this.unbindEvt(this.options.zone,"start"),this.nipples.forEach(function(t){t.destroy()}),this.pressureIntervals)this.pressureIntervals.hasOwnProperty(t)&&clearInterval(this.pressureIntervals[t]);this.trigger("destroyed",this.nipples),this.manager.unbindDocument(),this.off()};var P=k;function E(t){var i,e=this;return e.ids={},e.index=0,e.collections=[],e.config(t),e.prepareCollections(),d(window,"resize",function(t){clearTimeout(i),i=setTimeout(function(){var t,i=c();e.collections.forEach(function(e){e.forEach(function(e){t=e.el.getBoundingClientRect(),e.position={x:i.x+t.left,y:i.y+t.top}})})},100)}),e.collections}E.prototype=new _,E.constructor=E,E.prototype.prepareCollections=function(){var t=this;t.collections.create=t.create.bind(t),t.collections.on=t.on.bind(t),t.collections.off=t.off.bind(t),t.collections.destroy=t.destroy.bind(t),t.collections.get=function(i){var e;return t.collections.every(function(t){return!(e=t.get(i))}),e}},E.prototype.create=function(t){return this.createCollection(t)},E.prototype.createCollection=function(t){var i=new P(this,t);return this.bindCollection(i),this.collections.push(i),i},E.prototype.bindCollection=function(t){var i,e=this,o=function(t,o){i=t.type+" "+o.id+":"+t.type,e.trigger(i,o)};t.on("destroyed",e.onDestroyed.bind(e)),t.on("shown hidden rested dir plain",o),t.on("dir:up dir:right dir:down dir:left",o),t.on("plain:up plain:right plain:down plain:left",o)},E.prototype.bindDocument=function(){this.binded||(this.bindEvt(document,"move").bindEvt(document,"end"),this.binded=!0)},E.prototype.unbindDocument=function(t){Object.keys(this.ids).length&&!0!==t||(this.unbindEvt(document,"move").unbindEvt(document,"end"),this.binded=!1)},E.prototype.getIdentifier=function(t){var i;return t?void 0===(i=void 0===t.identifier?t.pointerId:t.identifier)&&(i=this.latest||0):i=this.index,void 0===this.ids[i]&&(this.ids[i]=this.index,this.index+=1),this.latest=i,this.ids[i]},E.prototype.removeIdentifier=function(t){var i={};for(var e in this.ids)if(this.ids[e]===t){i.id=e,i.identifier=this.ids[e],delete this.ids[e];break}return i},E.prototype.onmove=function(t){return this.onAny("move",t),!1},E.prototype.onend=function(t){return this.onAny("end",t),!1},E.prototype.oncancel=function(t){return this.onAny("end",t),!1},E.prototype.onAny=function(t,i){var e,o=this,n="processOn"+t.charAt(0).toUpperCase()+t.slice(1);i=a(i);return y(i,function(t){e=o.getIdentifier(t),y(o.collections,function(t,i,e){e.ids.indexOf(i)>=0&&(e[n](t),t._found_=!0)}.bind(null,t,e)),t._found_||o.removeIdentifier(e)}),!1},E.prototype.destroy=function(){this.unbindDocument(!0),this.ids={},this.index=0,this.collections.forEach(function(t){t.destroy()}),this.off()},E.prototype.onDestroyed=function(t,i){if(this.collections.indexOf(i)<0)return!1;this.collections.splice(this.collections.indexOf(i),1)};var z=new E;i.default={create:function(t){return z.create(t)},factory:z}}]).default});
},{}],47:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],48:[function(require,module,exports){
// Copyright (c) 2011, Chris Umbel

var global = (Function('return this'))();

exports.Vector = require('./vector');
global.$V = exports.Vector.create;
exports.Matrix = require('./matrix');
global.$M = exports.Matrix.create;
exports.Line = require('./line');
global.$L = exports.Line.create;
exports.Plane = require('./plane');
global.$P = exports.Plane.create;
exports.Line.Segment = require('./line.segment');
exports.Sylvester = require('./sylvester');

},{"./line":49,"./line.segment":50,"./matrix":51,"./plane":52,"./sylvester":53,"./vector":54}],49:[function(require,module,exports){
// Copyright (c) 2011, Chris Umbel, James Coglan
var Vector = require('./vector');
var Matrix = require('./matrix');
var Plane = require('./plane');
var Sylvester = require('./sylvester');

// Line class - depends on Vector, and some methods require Matrix and Plane.

function Line() {}
Line.prototype = {

  // Returns true if the argument occupies the same space as the line
  eql: function(line) {
    return (this.isParallelTo(line) && this.contains(line.anchor));
  },

  // Returns a copy of the line
  dup: function() {
    return Line.create(this.anchor, this.direction);
  },

  // Returns the result of translating the line by the given vector/array
  translate: function(vector) {
    var V = vector.elements || vector;
    return Line.create([
      this.anchor.elements[0] + V[0],
      this.anchor.elements[1] + V[1],
      this.anchor.elements[2] + (V[2] || 0)
    ], this.direction);
  },

  // Returns true if the line is parallel to the argument. Here, 'parallel to'
  // means that the argument's direction is either parallel or antiparallel to
  // the line's own direction. A line is parallel to a plane if the two do not
  // have a unique intersection.
  isParallelTo: function(obj) {
    if (obj.normal || (obj.start && obj.end)) { return obj.isParallelTo(this); }
    var theta = this.direction.angleFrom(obj.direction);
    return (Math.abs(theta) <= Sylvester.precision || Math.abs(theta - Math.PI) <= Sylvester.precision);
  },

  // Returns the line's perpendicular distance from the argument,
  // which can be a point, a line or a plane
  distanceFrom: function(obj) {
    if (obj.normal || (obj.start && obj.end)) { return obj.distanceFrom(this); }
    if (obj.direction) {
      // obj is a line
      if (this.isParallelTo(obj)) { return this.distanceFrom(obj.anchor); }
      var N = this.direction.cross(obj.direction).toUnitVector().elements;
      var A = this.anchor.elements, B = obj.anchor.elements;
      return Math.abs((A[0] - B[0]) * N[0] + (A[1] - B[1]) * N[1] + (A[2] - B[2]) * N[2]);
    } else {
      // obj is a point
      var P = obj.elements || obj;
      var A = this.anchor.elements, D = this.direction.elements;
      var PA1 = P[0] - A[0], PA2 = P[1] - A[1], PA3 = (P[2] || 0) - A[2];
      var modPA = Math.sqrt(PA1*PA1 + PA2*PA2 + PA3*PA3);
      if (modPA === 0) return 0;
      // Assumes direction vector is normalized
      var cosTheta = (PA1 * D[0] + PA2 * D[1] + PA3 * D[2]) / modPA;
      var sin2 = 1 - cosTheta*cosTheta;
      return Math.abs(modPA * Math.sqrt(sin2 < 0 ? 0 : sin2));
    }
  },

  // Returns true iff the argument is a point on the line, or if the argument
  // is a line segment lying within the receiver
  contains: function(obj) {
    if (obj.start && obj.end) { return this.contains(obj.start) && this.contains(obj.end); }
    var dist = this.distanceFrom(obj);
    return (dist !== null && dist <= Sylvester.precision);
  },

  // Returns the distance from the anchor of the given point. Negative values are
  // returned for points that are in the opposite direction to the line's direction from
  // the line's anchor point.
  positionOf: function(point) {
    if (!this.contains(point)) { return null; }
    var P = point.elements || point;
    var A = this.anchor.elements, D = this.direction.elements;
    return (P[0] - A[0]) * D[0] + (P[1] - A[1]) * D[1] + ((P[2] || 0) - A[2]) * D[2];
  },

  // Returns true iff the line lies in the given plane
  liesIn: function(plane) {
    return plane.contains(this);
  },

  // Returns true iff the line has a unique point of intersection with the argument
  intersects: function(obj) {
    if (obj.normal) { return obj.intersects(this); }
    return (!this.isParallelTo(obj) && this.distanceFrom(obj) <= Sylvester.precision);
  },

  // Returns the unique intersection point with the argument, if one exists
  intersectionWith: function(obj) {
    if (obj.normal || (obj.start && obj.end)) { return obj.intersectionWith(this); }
    if (!this.intersects(obj)) { return null; }
    var P = this.anchor.elements, X = this.direction.elements,
        Q = obj.anchor.elements, Y = obj.direction.elements;
    var X1 = X[0], X2 = X[1], X3 = X[2], Y1 = Y[0], Y2 = Y[1], Y3 = Y[2];
    var PsubQ1 = P[0] - Q[0], PsubQ2 = P[1] - Q[1], PsubQ3 = P[2] - Q[2];
    var XdotQsubP = - X1*PsubQ1 - X2*PsubQ2 - X3*PsubQ3;
    var YdotPsubQ = Y1*PsubQ1 + Y2*PsubQ2 + Y3*PsubQ3;
    var XdotX = X1*X1 + X2*X2 + X3*X3;
    var YdotY = Y1*Y1 + Y2*Y2 + Y3*Y3;
    var XdotY = X1*Y1 + X2*Y2 + X3*Y3;
    var k = (XdotQsubP * YdotY / XdotX + XdotY * YdotPsubQ) / (YdotY - XdotY * XdotY);
    return Vector.create([P[0] + k*X1, P[1] + k*X2, P[2] + k*X3]);
  },

  // Returns the point on the line that is closest to the given point or line/line segment
  pointClosestTo: function(obj) {
    if (obj.start && obj.end) {
      // obj is a line segment
      var P = obj.pointClosestTo(this);
      return (P === null) ? null : this.pointClosestTo(P);
    } else if (obj.direction) {
      // obj is a line
      if (this.intersects(obj)) { return this.intersectionWith(obj); }
      if (this.isParallelTo(obj)) { return null; }
      var D = this.direction.elements, E = obj.direction.elements;
      var D1 = D[0], D2 = D[1], D3 = D[2], E1 = E[0], E2 = E[1], E3 = E[2];
      // Create plane containing obj and the shared normal and intersect this with it
      // Thank you: http://www.cgafaq.info/wiki/Line-line_distance
      var x = (D3 * E1 - D1 * E3), y = (D1 * E2 - D2 * E1), z = (D2 * E3 - D3 * E2);
      var N = [x * E3 - y * E2, y * E1 - z * E3, z * E2 - x * E1];
      var P = Plane.create(obj.anchor, N);
      return P.intersectionWith(this);
    } else {
      // obj is a point
      var P = obj.elements || obj;
      if (this.contains(P)) { return Vector.create(P); }
      var A = this.anchor.elements, D = this.direction.elements;
      var D1 = D[0], D2 = D[1], D3 = D[2], A1 = A[0], A2 = A[1], A3 = A[2];
      var x = D1 * (P[1]-A2) - D2 * (P[0]-A1), y = D2 * ((P[2] || 0) - A3) - D3 * (P[1]-A2),
          z = D3 * (P[0]-A1) - D1 * ((P[2] || 0) - A3);
      var V = Vector.create([D2 * x - D3 * z, D3 * y - D1 * x, D1 * z - D2 * y]);
      var k = this.distanceFrom(P) / V.modulus();
      return Vector.create([
        P[0] + V.elements[0] * k,
        P[1] + V.elements[1] * k,
        (P[2] || 0) + V.elements[2] * k
      ]);
    }
  },

  // Returns a copy of the line rotated by t radians about the given line. Works by
  // finding the argument's closest point to this line's anchor point (call this C) and
  // rotating the anchor about C. Also rotates the line's direction about the argument's.
  // Be careful with this - the rotation axis' direction affects the outcome!
  rotate: function(t, line) {
    // If we're working in 2D
    if (typeof(line.direction) == 'undefined') { line = Line.create(line.to3D(), Vector.k); }
    var R = Matrix.Rotation(t, line.direction).elements;
    var C = line.pointClosestTo(this.anchor).elements;
    var A = this.anchor.elements, D = this.direction.elements;
    var C1 = C[0], C2 = C[1], C3 = C[2], A1 = A[0], A2 = A[1], A3 = A[2];
    var x = A1 - C1, y = A2 - C2, z = A3 - C3;
    return Line.create([
      C1 + R[0][0] * x + R[0][1] * y + R[0][2] * z,
      C2 + R[1][0] * x + R[1][1] * y + R[1][2] * z,
      C3 + R[2][0] * x + R[2][1] * y + R[2][2] * z
    ], [
      R[0][0] * D[0] + R[0][1] * D[1] + R[0][2] * D[2],
      R[1][0] * D[0] + R[1][1] * D[1] + R[1][2] * D[2],
      R[2][0] * D[0] + R[2][1] * D[1] + R[2][2] * D[2]
    ]);
  },

  // Returns a copy of the line with its direction vector reversed.
  // Useful when using lines for rotations.
  reverse: function() {
    return Line.create(this.anchor, this.direction.x(-1));
  },

  // Returns the line's reflection in the given point or line
  reflectionIn: function(obj) {
    if (obj.normal) {
      // obj is a plane
      var A = this.anchor.elements, D = this.direction.elements;
      var A1 = A[0], A2 = A[1], A3 = A[2], D1 = D[0], D2 = D[1], D3 = D[2];
      var newA = this.anchor.reflectionIn(obj).elements;
      // Add the line's direction vector to its anchor, then mirror that in the plane
      var AD1 = A1 + D1, AD2 = A2 + D2, AD3 = A3 + D3;
      var Q = obj.pointClosestTo([AD1, AD2, AD3]).elements;
      var newD = [Q[0] + (Q[0] - AD1) - newA[0], Q[1] + (Q[1] - AD2) - newA[1], Q[2] + (Q[2] - AD3) - newA[2]];
      return Line.create(newA, newD);
    } else if (obj.direction) {
      // obj is a line - reflection obtained by rotating PI radians about obj
      return this.rotate(Math.PI, obj);
    } else {
      // obj is a point - just reflect the line's anchor in it
      var P = obj.elements || obj;
      return Line.create(this.anchor.reflectionIn([P[0], P[1], (P[2] || 0)]), this.direction);
    }
  },

  // Set the line's anchor point and direction.
  setVectors: function(anchor, direction) {
    // Need to do this so that line's properties are not
    // references to the arguments passed in
    anchor = Vector.create(anchor);
    direction = Vector.create(direction);
    if (anchor.elements.length == 2) {anchor.elements.push(0); }
    if (direction.elements.length == 2) { direction.elements.push(0); }
    if (anchor.elements.length > 3 || direction.elements.length > 3) { return null; }
    var mod = direction.modulus();
    if (mod === 0) { return null; }
    this.anchor = anchor;
    this.direction = Vector.create([
      direction.elements[0] / mod,
      direction.elements[1] / mod,
      direction.elements[2] / mod
    ]);
    return this;
  }
};

// Constructor function
Line.create = function(anchor, direction) {
  var L = new Line();
  return L.setVectors(anchor, direction);
};

// Axes
Line.X = Line.create(Vector.Zero(3), Vector.i);
Line.Y = Line.create(Vector.Zero(3), Vector.j);
Line.Z = Line.create(Vector.Zero(3), Vector.k);

module.exports = Line;

},{"./matrix":51,"./plane":52,"./sylvester":53,"./vector":54}],50:[function(require,module,exports){
// Copyright (c) 2011, Chris Umbel, James Coglan
// Line.Segment class - depends on Line and its dependencies.

var Line = require('./line');
var Vector = require('./vector');

Line.Segment = function() {};
Line.Segment.prototype = {

  // Returns true iff the line segment is equal to the argument
  eql: function(segment) {
    return (this.start.eql(segment.start) && this.end.eql(segment.end)) ||
        (this.start.eql(segment.end) && this.end.eql(segment.start));
  },

  // Returns a copy of the line segment
  dup: function() {
    return Line.Segment.create(this.start, this.end);
  },

  // Returns the length of the line segment
  length: function() {
    var A = this.start.elements, B = this.end.elements;
    var C1 = B[0] - A[0], C2 = B[1] - A[1], C3 = B[2] - A[2];
    return Math.sqrt(C1*C1 + C2*C2 + C3*C3);
  },

  // Returns the line segment as a vector equal to its
  // end point relative to its endpoint
  toVector: function() {
    var A = this.start.elements, B = this.end.elements;
    return Vector.create([B[0] - A[0], B[1] - A[1], B[2] - A[2]]);
  },

  // Returns the segment's midpoint as a vector
  midpoint: function() {
    var A = this.start.elements, B = this.end.elements;
    return Vector.create([(B[0] + A[0])/2, (B[1] + A[1])/2, (B[2] + A[2])/2]);
  },

  // Returns the plane that bisects the segment
  bisectingPlane: function() {
    return Plane.create(this.midpoint(), this.toVector());
  },

  // Returns the result of translating the line by the given vector/array
  translate: function(vector) {
    var V = vector.elements || vector;
    var S = this.start.elements, E = this.end.elements;
    return Line.Segment.create(
      [S[0] + V[0], S[1] + V[1], S[2] + (V[2] || 0)],
      [E[0] + V[0], E[1] + V[1], E[2] + (V[2] || 0)]
    );
  },

  // Returns true iff the line segment is parallel to the argument. It simply forwards
  // the method call onto its line property.
  isParallelTo: function(obj) {
    return this.line.isParallelTo(obj);
  },

  // Returns the distance between the argument and the line segment's closest point to the argument
  distanceFrom: function(obj) {
    var P = this.pointClosestTo(obj);
    return (P === null) ? null : P.distanceFrom(obj);
  },

  // Returns true iff the given point lies on the segment
  contains: function(obj) {
    if (obj.start && obj.end) { return this.contains(obj.start) && this.contains(obj.end); }
    var P = (obj.elements || obj).slice();
    if (P.length == 2) { P.push(0); }
    if (this.start.eql(P)) { return true; }
    var S = this.start.elements;
    var V = Vector.create([S[0] - P[0], S[1] - P[1], S[2] - (P[2] || 0)]);
    var vect = this.toVector();
    return V.isAntiparallelTo(vect) && V.modulus() <= vect.modulus();
  },

  // Returns true iff the line segment intersects the argument
  intersects: function(obj) {
    return (this.intersectionWith(obj) !== null);
  },

  // Returns the unique point of intersection with the argument
  intersectionWith: function(obj) {
    if (!this.line.intersects(obj)) { return null; }
    var P = this.line.intersectionWith(obj);
    return (this.contains(P) ? P : null);
  },

  // Returns the point on the line segment closest to the given object
  pointClosestTo: function(obj) {
    if (obj.normal) {
      // obj is a plane
      var V = this.line.intersectionWith(obj);
      if (V === null) { return null; }
      return this.pointClosestTo(V);
    } else {
      // obj is a line (segment) or point
      var P = this.line.pointClosestTo(obj);
      if (P === null) { return null; }
      if (this.contains(P)) { return P; }
      return (this.line.positionOf(P) < 0 ? this.start : this.end).dup();
    }
  },

  // Set the start and end-points of the segment
  setPoints: function(startPoint, endPoint) {
    startPoint = Vector.create(startPoint).to3D();
    endPoint = Vector.create(endPoint).to3D();
    if (startPoint === null || endPoint === null) { return null; }
    this.line = Line.create(startPoint, endPoint.subtract(startPoint));
    this.start = startPoint;
    this.end = endPoint;
    return this;
  }
};

// Constructor function
Line.Segment.create = function(v1, v2) {
  var S = new Line.Segment();
  return S.setPoints(v1, v2);
};

module.exports = Line.Segment;

},{"./line":49,"./vector":54}],51:[function(require,module,exports){
// Copyright (c) 2011, Chris Umbel, James Coglan
// Matrix class - depends on Vector.

var Sylvester = require('./sylvester');
var Vector = require('./vector');

// augment a matrix M with identity rows/cols
function identSize(M, m, n, k) {
    var e = M.elements;
    var i = k - 1;

    while(i--) {
	var row = [];
	
	for(var j = 0; j < n; j++)
	    row.push(j == i ? 1 : 0);
	
        e.unshift(row);
    }
    
    for(var i = k - 1; i < m; i++) {
        while(e[i].length < n)
            e[i].unshift(0);
    }

    return $M(e);
}

function pca(X) {
    var Sigma = X.transpose().x(X).x(1 / X.rows());
    var svd = Sigma.svd();
    return {U: svd.U, S: svd.S};
}

// singular value decomposition in pure javascript
function svdJs() {
    var A = this;
    var V = Matrix.I(A.rows());
    var S = A.transpose();
    var U = Matrix.I(A.cols());
    var err = Number.MAX_VALUE;
    var i = 0;
    var maxLoop = 100;

    while(err > 2.2737e-13 && i < maxLoop) {
        var qr = S.transpose().qrJs();
        S = qr.R;
        V = V.x(qr.Q);
        qr = S.transpose().qrJs();
        U = U.x(qr.Q);
        S = qr.R;

        var e = S.triu(1).unroll().norm();
        var f = S.diagonal().norm();

        if(f == 0)
            f = 1;

        err = e / f;

        i++;
    }

    var ss = S.diagonal();
    var s = [];

    for(var i = 1; i <= ss.cols(); i++) {
        var ssn = ss.e(i);
        s.push(Math.abs(ssn));

        if(ssn < 0) {
            for(var j = 0; j < U.rows(); j++) {
                V.elements[j][i - 1] = -(V.elements[j][i - 1]);
            }
        }
    }

    return {U: U, S: $V(s).toDiagonalMatrix(), V: V};
}



// QR decomposition in pure javascript
function qrJs() {
    var m = this.rows();
    var n = this.cols();
    var Q = Matrix.I(m);
    var A = this;
    
    for(var k = 1; k < Math.min(m, n); k++) {
	var ak = A.slice(k, 0, k, k).col(1);
	var oneZero = [1];
	
	while(oneZero.length <=  m - k)
	    oneZero.push(0);
	
	oneZero = $V(oneZero);
	var vk = ak.add(oneZero.x(ak.norm() * Math.sign(ak.e(1))));
	var Vk = $M(vk);
	var Hk = Matrix.I(m - k + 1).subtract(Vk.x(2).x(Vk.transpose()).div(Vk.transpose().x(Vk).e(1, 1)));
	var Qk = identSize(Hk, m, n, k);
	A = Qk.x(A);
	// slow way to compute Q
	Q = Q.x(Qk);
    }
    
    return {Q: Q, R: A};
}




function Matrix() {}
Matrix.prototype = {
    // solve a system of linear equations (work in progress)
    solve: function(b) {
	var lu = this.lu();
	b = lu.P.x(b);
	var y = lu.L.forwardSubstitute(b);
	var x = lu.U.backSubstitute(y);
	return lu.P.x(x);
	//return this.inv().x(b);
    },

    // project a matrix onto a lower dim
    pcaProject: function(k, U) {
	var U = U || pca(this).U;
	var Ureduce= U.slice(1, U.rows(), 1, k);
	return {Z: this.x(Ureduce), U: U};
    },

    // recover a matrix to a higher dimension
    pcaRecover: function(U) {
	var k = this.cols();
	var Ureduce = U.slice(1, U.rows(), 1, k);
	return this.x(Ureduce.transpose());
    },    

    // grab the upper triangular part of the matrix
    triu: function(k) {
	if(!k)
	    k = 0;
	
	return this.map(function(x, i, j) {
	    return j - i >= k ? x : 0;
	});
    },

    // unroll a matrix into a vector
    unroll: function() {
	var v = [];
	
	for(var i = 1; i <= this.cols(); i++) {
	    for(var j = 1; j <= this.rows(); j++) {
		v.push(this.e(j, i));
	    }
	}

	return $V(v);
    },

    // return a sub-block of the matrix
    slice: function(startRow, endRow, startCol, endCol) {
	var x = [];
	
	if(endRow == 0)
	    endRow = this.rows();
	
	if(endCol == 0)
	    endCol = this.cols();

	for(i = startRow; i <= endRow; i++) {
	    var row = [];

	    for(j = startCol; j <= endCol; j++) {
		row.push(this.e(i, j));
	    }

	    x.push(row);
	}

	return $M(x);
    },

    // Returns element (i,j) of the matrix
    e: function(i,j) {
	if (i < 1 || i > this.elements.length || j < 1 || j > this.elements[0].length) { return null; }
	return this.elements[i - 1][j - 1];
    },

    // Returns row k of the matrix as a vector
    row: function(i) {
	if (i > this.elements.length) { return null; }
	return $V(this.elements[i - 1]);
    },

    // Returns column k of the matrix as a vector
    col: function(j) {
	if (j > this.elements[0].length) { return null; }
	var col = [], n = this.elements.length;
	for (var i = 0; i < n; i++) { col.push(this.elements[i][j - 1]); }
	return $V(col);
    },

    // Returns the number of rows/columns the matrix has
    dimensions: function() {
	return {rows: this.elements.length, cols: this.elements[0].length};
    },

    // Returns the number of rows in the matrix
    rows: function() {
	return this.elements.length;
    },

    // Returns the number of columns in the matrix
    cols: function() {
	return this.elements[0].length;
    },

    approxEql: function(matrix) {
	return this.eql(matrix, Sylvester.approxPrecision);
    },

    // Returns true iff the matrix is equal to the argument. You can supply
    // a vector as the argument, in which case the receiver must be a
    // one-column matrix equal to the vector.
    eql: function(matrix, precision) {
	var M = matrix.elements || matrix;
	if (typeof(M[0][0]) == 'undefined') { M = Matrix.create(M).elements; }
	if (this.elements.length != M.length ||
            this.elements[0].length != M[0].length) { return false; }
	var i = this.elements.length, nj = this.elements[0].length, j;
	while (i--) { j = nj;
		      while (j--) {
			  if (Math.abs(this.elements[i][j] - M[i][j]) > (precision || Sylvester.precision)) { return false; }
		      }
		    }
	return true;
    },

    // Returns a copy of the matrix
    dup: function() {
	return Matrix.create(this.elements);
    },

    // Maps the matrix to another matrix (of the same dimensions) according to the given function
    map: function(fn) {
    var els = [], i = this.elements.length, nj = this.elements[0].length, j;
	while (i--) { j = nj;
		      els[i] = [];
		      while (j--) {
			  els[i][j] = fn(this.elements[i][j], i + 1, j + 1);
		      }
		    }
	return Matrix.create(els);
    },

    // Returns true iff the argument has the same dimensions as the matrix
    isSameSizeAs: function(matrix) {
	var M = matrix.elements || matrix;
	if (typeof(M[0][0]) == 'undefined') { M = Matrix.create(M).elements; }
	return (this.elements.length == M.length &&
		this.elements[0].length == M[0].length);
    },

    // Returns the result of adding the argument to the matrix
    add: function(matrix) {
	if(typeof(matrix) == 'number') {
	    return this.map(function(x, i, j) { return x + matrix});
	} else {
	    var M = matrix.elements || matrix;
	    if (typeof(M[0][0]) == 'undefined') { M = Matrix.create(M).elements; }
	    if (!this.isSameSizeAs(M)) { return null; }
	    return this.map(function(x, i, j) { return x + M[i - 1][j - 1]; });
	}
    },

    // Returns the result of subtracting the argument from the matrix
    subtract: function(matrix) {
	if(typeof(matrix) == 'number') {
	    return this.map(function(x, i, j) { return x - matrix});
	} else {
	    var M = matrix.elements || matrix;
	    if (typeof(M[0][0]) == 'undefined') { M = Matrix.create(M).elements; }
	    if (!this.isSameSizeAs(M)) { return null; }
	    return this.map(function(x, i, j) { return x - M[i - 1][j - 1]; });
	}
    },

    // Returns true iff the matrix can multiply the argument from the left
    canMultiplyFromLeft: function(matrix) {
	var M = matrix.elements || matrix;
	if (typeof(M[0][0]) == 'undefined') { M = Matrix.create(M).elements; }
	// this.columns should equal matrix.rows
	return (this.elements[0].length == M.length);
    },

    // Returns the result of a multiplication-style operation the matrix from the right by the argument.
    // If the argument is a scalar then just operate on all the elements. If the argument is
    // a vector, a vector is returned, which saves you having to remember calling
    // col(1) on the result.
    mulOp: function(matrix, op) {
	if (!matrix.elements) {
	    return this.map(function(x) { return op(x, matrix); });
	}

	var returnVector = matrix.modulus ? true : false;
	var M = matrix.elements || matrix;
	if (typeof(M[0][0]) == 'undefined') 
	    M = Matrix.create(M).elements;
	if (!this.canMultiplyFromLeft(M)) 
	    return null; 
	var e = this.elements, rowThis, rowElem, elements = [],
        sum, m = e.length, n = M[0].length, o = e[0].length, i = m, j, k;

	while (i--) {
            rowElem = [];
            rowThis = e[i];
            j = n;

            while (j--) {
		sum = 0;
		k = o;

		while (k--) {
                    sum += op(rowThis[k], M[k][j]);
		}

		rowElem[j] = sum;
            }

            elements[i] = rowElem;
	}

	var M = Matrix.create(elements);
	return returnVector ? M.col(1) : M;
    },

    // Returns the result of dividing the matrix from the right by the argument.
    // If the argument is a scalar then just divide all the elements. If the argument is
    // a vector, a vector is returned, which saves you having to remember calling
    // col(1) on the result.
    div: function(matrix) {
	return this.mulOp(matrix, function(x, y) { return x / y});
    },

    // Returns the result of multiplying the matrix from the right by the argument.
    // If the argument is a scalar then just multiply all the elements. If the argument is
    // a vector, a vector is returned, which saves you having to remember calling
    // col(1) on the result.
    multiply: function(matrix) {
	return this.mulOp(matrix, function(x, y) { return x * y});
    },

    x: function(matrix) { return this.multiply(matrix); },

    elementMultiply: function(v) {
        return this.map(function(k, i, j) {
            return v.e(i, j) * k;
        });
    },

    // sum all elements in the matrix
    sum: function() {
        var sum = 0;

        this.map(function(x) { sum += x;});

        return sum;
    },

    // Returns a Vector of each colum averaged.
    mean: function() {
      var dim = this.dimensions();
      var r = [];
      for (var i = 1; i <= dim.cols; i++) {
        r.push(this.col(i).sum() / dim.rows);
      }
      return $V(r);
    },

    column: function(n) {
	return this.col(n);
    },

    // element-wise log
    log: function() {
	return this.map(function(x) { return Math.log(x); });
    },

    // Returns a submatrix taken from the matrix
    // Argument order is: start row, start col, nrows, ncols
    // Element selection wraps if the required index is outside the matrix's bounds, so you could
    // use this to perform row/column cycling or copy-augmenting.
    minor: function(a, b, c, d) {
	var elements = [], ni = c, i, nj, j;
	var rows = this.elements.length, cols = this.elements[0].length;
	while (ni--) {
	    i = c - ni - 1;
	    elements[i] = [];
	    nj = d;
	    while (nj--) {
		j = d - nj - 1;
		elements[i][j] = this.elements[(a + i - 1) % rows][(b + j - 1) % cols];
	    }
	}
	return Matrix.create(elements);
    },

    // Returns the transpose of the matrix
    transpose: function() {
    var rows = this.elements.length, i, cols = this.elements[0].length, j;
	var elements = [], i = cols;
	while (i--) {
	    j = rows;
	    elements[i] = [];
	    while (j--) {
		elements[i][j] = this.elements[j][i];
	    }
	}
	return Matrix.create(elements);
    },

    // Returns true iff the matrix is square
    isSquare: function() {
	return (this.elements.length == this.elements[0].length);
    },

    // Returns the (absolute) largest element of the matrix
    max: function() {
	var m = 0, i = this.elements.length, nj = this.elements[0].length, j;
	while (i--) {
	    j = nj;
	    while (j--) {
		if (Math.abs(this.elements[i][j]) > Math.abs(m)) { m = this.elements[i][j]; }
	    }
	}
	return m;
    },

    // Returns the indeces of the first match found by reading row-by-row from left to right
    indexOf: function(x) {
	var index = null, ni = this.elements.length, i, nj = this.elements[0].length, j;
	for (i = 0; i < ni; i++) {
	    for (j = 0; j < nj; j++) {
		if (this.elements[i][j] == x) { return {i: i + 1, j: j + 1}; }
	    }
	}
	return null;
    },

    // If the matrix is square, returns the diagonal elements as a vector.
    // Otherwise, returns null.
    diagonal: function() {
	if (!this.isSquare) { return null; }
	var els = [], n = this.elements.length;
	for (var i = 0; i < n; i++) {
	    els.push(this.elements[i][i]);
	}
	return $V(els);
    },

    // Make the matrix upper (right) triangular by Gaussian elimination.
    // This method only adds multiples of rows to other rows. No rows are
    // scaled up or switched, and the determinant is preserved.
    toRightTriangular: function() {
	var M = this.dup(), els;
	var n = this.elements.length, i, j, np = this.elements[0].length, p;
	for (i = 0; i < n; i++) {
	    if (M.elements[i][i] == 0) {
		for (j = i + 1; j < n; j++) {
		    if (M.elements[j][i] != 0) {
			els = [];
			for (p = 0; p < np; p++) { els.push(M.elements[i][p] + M.elements[j][p]); }
			M.elements[i] = els;
			break;
		    }
		}
	    }
	    if (M.elements[i][i] != 0) {
		for (j = i + 1; j < n; j++) {
		    var multiplier = M.elements[j][i] / M.elements[i][i];
		    els = [];
		    for (p = 0; p < np; p++) {
			// Elements with column numbers up to an including the number
			// of the row that we're subtracting can safely be set straight to
			// zero, since that's the point of this routine and it avoids having
			// to loop over and correct rounding errors later
			els.push(p <= i ? 0 : M.elements[j][p] - M.elements[i][p] * multiplier);
		    }
		    M.elements[j] = els;
		}
	    }
	}
	return M;
    },

    toUpperTriangular: function() { return this.toRightTriangular(); },

    // Returns the determinant for square matrices
    determinant: function() {
	if (!this.isSquare()) { return null; }
	if (this.cols == 1 && this.rows == 1) { return this.row(1); }
	if (this.cols == 0 && this.rows == 0) { return 1; }
	var M = this.toRightTriangular();
	var det = M.elements[0][0], n = M.elements.length;
	for (var i = 1; i < n; i++) {
	    det = det * M.elements[i][i];
	}
	return det;
    },
    det: function() { return this.determinant(); },

    // Returns true iff the matrix is singular
    isSingular: function() {
	return (this.isSquare() && this.determinant() === 0);
    },

    // Returns the trace for square matrices
    trace: function() {
	if (!this.isSquare()) { return null; }
	var tr = this.elements[0][0], n = this.elements.length;
	for (var i = 1; i < n; i++) {
	    tr += this.elements[i][i];
	}
	return tr;
    },

    tr: function() { return this.trace(); },

    // Returns the rank of the matrix
    rank: function() {
	var M = this.toRightTriangular(), rank = 0;
	var i = this.elements.length, nj = this.elements[0].length, j;
	while (i--) {
	    j = nj;
	    while (j--) {
		if (Math.abs(M.elements[i][j]) > Sylvester.precision) { rank++; break; }
	    }
	}
	return rank;
    },

    rk: function() { return this.rank(); },

    // Returns the result of attaching the given argument to the right-hand side of the matrix
    augment: function(matrix) {
	var M = matrix.elements || matrix;
	if (typeof(M[0][0]) == 'undefined') { M = Matrix.create(M).elements; }
	var T = this.dup(), cols = T.elements[0].length;
	var i = T.elements.length, nj = M[0].length, j;
	if (i != M.length) { return null; }
	while (i--) {
	    j = nj;
	    while (j--) {
		T.elements[i][cols + j] = M[i][j];
	    }
	}
	return T;
    },

    // Returns the inverse (if one exists) using Gauss-Jordan
    inverse: function() {
	if (!this.isSquare() || this.isSingular()) { return null; }
	var n = this.elements.length, i = n, j;
	var M = this.augment(Matrix.I(n)).toRightTriangular();
	var np = M.elements[0].length, p, els, divisor;
	var inverse_elements = [], new_element;
	// Matrix is non-singular so there will be no zeros on the diagonal
	// Cycle through rows from last to first
	while (i--) {
	    // First, normalise diagonal elements to 1
	    els = [];
	    inverse_elements[i] = [];
	    divisor = M.elements[i][i];
	    for (p = 0; p < np; p++) {
        new_element = M.elements[i][p] / divisor;
		els.push(new_element);
		// Shuffle off the current row of the right hand side into the results
		// array as it will not be modified by later runs through this loop
		if (p >= n) { inverse_elements[i].push(new_element); }
	    }
	    M.elements[i] = els;
	    // Then, subtract this row from those above it to
	    // give the identity matrix on the left hand side
	    j = i;
	    while (j--) {
		els = [];
		for (p = 0; p < np; p++) {
		    els.push(M.elements[j][p] - M.elements[i][p] * M.elements[j][i]);
		}
		M.elements[j] = els;
	    }
	}
	return Matrix.create(inverse_elements);
    },

    inv: function() { return this.inverse(); },

    // Returns the result of rounding all the elements
    round: function() {
	return this.map(function(x) { return Math.round(x); });
    },

    // Returns a copy of the matrix with elements set to the given value if they
    // differ from it by less than Sylvester.precision
    snapTo: function(x) {
	return this.map(function(p) {
	    return (Math.abs(p - x) <= Sylvester.precision) ? x : p;
	});
    },

    // Returns a string representation of the matrix
    inspect: function() {
	var matrix_rows = [];
	var n = this.elements.length;
	for (var i = 0; i < n; i++) {
	    matrix_rows.push($V(this.elements[i]).inspect());
	}
	return matrix_rows.join('\n');
    },

    // Returns a array representation of the matrix
    toArray: function() {
    	var matrix_rows = [];
    	var n = this.elements.length;
    	for (var i = 0; i < n; i++) {
        matrix_rows.push(this.elements[i]);
    	}
      return matrix_rows;
    },


    // Set the matrix's elements from an array. If the argument passed
    // is a vector, the resulting matrix will be a single column.
    setElements: function(els) {
	var i, j, elements = els.elements || els;
	if (typeof(elements[0][0]) != 'undefined') {
	    i = elements.length;
	    this.elements = [];
	    while (i--) {
		j = elements[i].length;
		this.elements[i] = [];
		while (j--) {
		    this.elements[i][j] = elements[i][j];
		}
	    }
	    return this;
	}
	var n = elements.length;
	this.elements = [];
	for (i = 0; i < n; i++) {
	    this.elements.push([elements[i]]);
	}
	return this;
    },

    // return the indexes of the columns with the largest value
    // for each row
    maxColumnIndexes: function() {
	var maxes = [];

	for(var i = 1; i <= this.rows(); i++) {
	    var max = null;
	    var maxIndex = -1;

	    for(var j = 1; j <= this.cols(); j++) {
		if(max === null || this.e(i, j) > max) {
		    max = this.e(i, j);
		    maxIndex = j;
		}
	    }

	    maxes.push(maxIndex);
	}

	return $V(maxes);
    },

    // return the largest values in each row
    maxColumns: function() {
	var maxes = [];

	for(var i = 1; i <= this.rows(); i++) {
	    var max = null;

	    for(var j = 1; j <= this.cols(); j++) {
		if(max === null || this.e(i, j) > max) {
		    max = this.e(i, j);
		}
	    }

	    maxes.push(max);
	}

	return $V(maxes);
    },

    // return the indexes of the columns with the smallest values
    // for each row
    minColumnIndexes: function() {
	var mins = [];

	for(var i = 1; i <= this.rows(); i++) {
	    var min = null;
	    var minIndex = -1;

	    for(var j = 1; j <= this.cols(); j++) {
		if(min === null || this.e(i, j) < min) {
		    min = this.e(i, j);
		    minIndex = j;
		}
	    }

	    mins.push(minIndex);
	}

	return $V(mins);
    },

    // return the smallest values in each row
    minColumns: function() {
	var mins = [];

	for(var i = 1; i <= this.rows(); i++) {
	    var min = null;

	    for(var j = 1; j <= this.cols(); j++) {
		if(min === null || this.e(i, j) < min) {
		    min = this.e(i, j);
		}
	    }

	    mins.push(min);
	}

	return $V(mins);
    },
    
    // perorm a partial pivot on the matrix. essentially move the largest
    // row below-or-including the pivot and replace the pivot's row with it.
    // a pivot matrix is returned so multiplication can perform the transform.
    partialPivot: function(k, j, P, A, L) {
	var maxIndex = 0;
	var maxValue = 0;

	for(var i = k; i <= A.rows(); i++) {
	    if(Math.abs(A.e(i, j)) > maxValue) {
		maxValue = Math.abs(A.e(k, j));
		maxIndex = i;
	    }
	}

	if(maxIndex != k) {
	    var tmp = A.elements[k - 1];
	    A.elements[k - 1] = A.elements[maxIndex - 1];
	    A.elements[maxIndex - 1] = tmp;
	    
	    P.elements[k - 1][k - 1] = 0;
	    P.elements[k - 1][maxIndex - 1] = 1;
	    P.elements[maxIndex - 1][maxIndex - 1] = 0;
	    P.elements[maxIndex - 1][k - 1] = 1;
	}
	
	return P;
    },

    // solve lower-triangular matrix * x = b via forward substitution
    forwardSubstitute: function(b) {
	var xa = [];

	for(var i = 1; i <= this.rows(); i++) {
	    var w = 0;

	    for(var j = 1; j < i; j++) {
		w += this.e(i, j) * xa[j - 1];
	    }

	    xa.push((b.e(i) - w) / this.e(i, i));
	}

	return $V(xa);
    },

    // solve an upper-triangular matrix * x = b via back substitution
    backSubstitute: function(b) {
	var xa = [];

	for(var i = this.rows(); i > 0; i--) {
	    var w = 0;

	    for(var j = this.cols(); j > i; j--) {
		w += this.e(i, j) * xa[this.rows() - j];
	    }

	    xa.push((b.e(i) - w) / this.e(i, i));
	}

	return $V(xa.reverse());
    },
    
    luJs: luJs,
    svdJs: svdJs,
    qrJs: qrJs,
};


var tolerance =  1.4901e-08;

// pure Javascript LU factorization
function luJs() {
    var A = this.dup();
    var L = Matrix.I(A.rows());
    var P = Matrix.I(A.rows());
    var U = Matrix.Zeros(A.rows(), A.cols());
    var p = 1;

    for(var k = 1; k <= Math.min(A.cols(), A.rows()); k++) {
	P = A.partialPivot(k, p, P, A, L);
	
	for(var i = k + 1; i <= A.rows(); i++) {
	    var l = A.e(i, p) / A.e(k, p);
	    L.elements[i - 1][k - 1] = l;
	    
	    for(var j = k + 1 ; j <= A.cols(); j++) {
		A.elements[i - 1][j - 1] -= A.e(k, j) * l;
	    }
	}
	
	for(var j = k; j <= A.cols(); j++) {
	    U.elements[k - 1][j - 1] = A.e(k, j);
	}

	if(p < A.cols())
	    p++;
    }    
    
    return {L: L, U: U, P: P};
}



Matrix.prototype.svd = svdJs;
Matrix.prototype.qr = qrJs;
Matrix.prototype.lu = luJs;

// Constructor function
Matrix.create = function(aElements) {
    var M = new Matrix().setElements(aElements);
    return M;
};

// Identity matrix of size n
Matrix.I = function(n) {
    var els = [], i = n, j;
    while (i--) {
	j = n;
	els[i] = [];
	while (j--) {
	    els[i][j] = (i == j) ? 1 : 0;
	}
    }
    return Matrix.create(els);
};

Matrix.loadFile = function(file) {
    var fs = require('fs');
    var contents = fs.readFileSync(file, 'utf-8');
    var matrix = [];

    var rowArray = contents.split('\n');
    for (var i = 0; i < rowArray.length; i++) {
	var d = rowArray[i].split(',');
	if (d.length > 1) {
	    matrix.push(d);
	}
    }

    var M = new Matrix();
    return M.setElements(matrix);
};

// Diagonal matrix - all off-diagonal elements are zero
Matrix.Diagonal = function(elements) {
    var i = elements.length;
    var M = Matrix.I(i);
    while (i--) {
	M.elements[i][i] = elements[i];
    }
    return M;
};

// Rotation matrix about some axis. If no axis is
// supplied, assume we're after a 2D transform
Matrix.Rotation = function(theta, a) {
    if (!a) {
	return Matrix.create([
	    [Math.cos(theta), -Math.sin(theta)],
	    [Math.sin(theta), Math.cos(theta)]
	]);
    }
    var axis = a.dup();
    if (axis.elements.length != 3) { return null; }
    var mod = axis.modulus();
    var x = axis.elements[0] / mod, y = axis.elements[1] / mod, z = axis.elements[2] / mod;
    var s = Math.sin(theta), c = Math.cos(theta), t = 1 - c;
    // Formula derived here: http://www.gamedev.net/reference/articles/article1199.asp
    // That proof rotates the co-ordinate system so theta
    // becomes -theta and sin becomes -sin here.
    return Matrix.create([
	[t * x * x + c, t * x * y - s * z, t * x * z + s * y],
	[t * x * y + s * z, t * y * y + c, t * y * z - s * x],
	[t * x * z - s * y, t * y * z + s * x, t * z * z + c]
    ]);
};

// Special case rotations
Matrix.RotationX = function(t) {
    var c = Math.cos(t), s = Math.sin(t);
    return Matrix.create([
	[1, 0, 0],
	[0, c, -s],
	[0, s, c]
    ]);
};

Matrix.RotationY = function(t) {
    var c = Math.cos(t), s = Math.sin(t);
    return Matrix.create([
	[c, 0, s],
	[0, 1, 0],
	[-s, 0, c]
    ]);
};

Matrix.RotationZ = function(t) {
    var c = Math.cos(t), s = Math.sin(t);
    return Matrix.create([
	[c, -s, 0],
	[s, c, 0],
	[0, 0, 1]
    ]);
};

// Random matrix of n rows, m columns
Matrix.Random = function(n, m) {
    if (arguments.length === 1) m = n;
    return Matrix.Zero(n, m).map(
	function() { return Math.random(); }
  );
};

Matrix.Fill = function(n, m, v) {
    if (arguments.length === 2) {
	v = m;
	m = n;
    }

    var els = [], i = n, j;

    while (i--) {
	j = m;
	els[i] = [];

	while (j--) {
	    els[i][j] = v;
	}
    }

    return Matrix.create(els);
};

// Matrix filled with zeros
Matrix.Zero = function(n, m) {
    return Matrix.Fill(n, m, 0);
};

// Matrix filled with zeros
Matrix.Zeros = function(n, m) {
    return Matrix.Zero(n, m);
};

// Matrix filled with ones
Matrix.One = function(n, m) {
    return Matrix.Fill(n, m, 1);
};

// Matrix filled with ones
Matrix.Ones = function(n, m) {
    return Matrix.One(n, m);
};

module.exports = Matrix;

},{"./sylvester":53,"./vector":54,"fs":7}],52:[function(require,module,exports){
// Copyright (c) 2011, Chris Umbel, James Coglan
// Plane class - depends on Vector. Some methods require Matrix and Line.
var Vector = require('./vector');
var Matrix = require('./matrix');
var Line = require('./line');

var Sylvester = require('./sylvester');

function Plane() {}
Plane.prototype = {

  // Returns true iff the plane occupies the same space as the argument
  eql: function(plane) {
    return (this.contains(plane.anchor) && this.isParallelTo(plane));
  },

  // Returns a copy of the plane
  dup: function() {
    return Plane.create(this.anchor, this.normal);
  },

  // Returns the result of translating the plane by the given vector
  translate: function(vector) {
    var V = vector.elements || vector;
    return Plane.create([
      this.anchor.elements[0] + V[0],
      this.anchor.elements[1] + V[1],
      this.anchor.elements[2] + (V[2] || 0)
    ], this.normal);
  },

  // Returns true iff the plane is parallel to the argument. Will return true
  // if the planes are equal, or if you give a line and it lies in the plane.
  isParallelTo: function(obj) {
    var theta;
    if (obj.normal) {
      // obj is a plane
      theta = this.normal.angleFrom(obj.normal);
      return (Math.abs(theta) <= Sylvester.precision || Math.abs(Math.PI - theta) <= Sylvester.precision);
    } else if (obj.direction) {
      // obj is a line
      return this.normal.isPerpendicularTo(obj.direction);
    }
    return null;
  },

  // Returns true iff the receiver is perpendicular to the argument
  isPerpendicularTo: function(plane) {
    var theta = this.normal.angleFrom(plane.normal);
    return (Math.abs(Math.PI/2 - theta) <= Sylvester.precision);
  },

  // Returns the plane's distance from the given object (point, line or plane)
  distanceFrom: function(obj) {
    if (this.intersects(obj) || this.contains(obj)) { return 0; }
    if (obj.anchor) {
      // obj is a plane or line
      var A = this.anchor.elements, B = obj.anchor.elements, N = this.normal.elements;
      return Math.abs((A[0] - B[0]) * N[0] + (A[1] - B[1]) * N[1] + (A[2] - B[2]) * N[2]);
    } else {
      // obj is a point
      var P = obj.elements || obj;
      var A = this.anchor.elements, N = this.normal.elements;
      return Math.abs((A[0] - P[0]) * N[0] + (A[1] - P[1]) * N[1] + (A[2] - (P[2] || 0)) * N[2]);
    }
  },

  // Returns true iff the plane contains the given point or line
  contains: function(obj) {
    if (obj.normal) { return null; }
    if (obj.direction) {
      return (this.contains(obj.anchor) && this.contains(obj.anchor.add(obj.direction)));
    } else {
      var P = obj.elements || obj;
      var A = this.anchor.elements, N = this.normal.elements;
      var diff = Math.abs(N[0]*(A[0] - P[0]) + N[1]*(A[1] - P[1]) + N[2]*(A[2] - (P[2] || 0)));
      return (diff <= Sylvester.precision);
    }
  },

  // Returns true iff the plane has a unique point/line of intersection with the argument
  intersects: function(obj) {
    if (typeof(obj.direction) == 'undefined' && typeof(obj.normal) == 'undefined') { return null; }
    return !this.isParallelTo(obj);
  },

  // Returns the unique intersection with the argument, if one exists. The result
  // will be a vector if a line is supplied, and a line if a plane is supplied.
  intersectionWith: function(obj) {
    if (!this.intersects(obj)) { return null; }
    if (obj.direction) {
      // obj is a line
      var A = obj.anchor.elements, D = obj.direction.elements,
          P = this.anchor.elements, N = this.normal.elements;
      var multiplier = (N[0]*(P[0]-A[0]) + N[1]*(P[1]-A[1]) + N[2]*(P[2]-A[2])) / (N[0]*D[0] + N[1]*D[1] + N[2]*D[2]);
      return Vector.create([A[0] + D[0]*multiplier, A[1] + D[1]*multiplier, A[2] + D[2]*multiplier]);
    } else if (obj.normal) {
      // obj is a plane
      var direction = this.normal.cross(obj.normal).toUnitVector();
      // To find an anchor point, we find one co-ordinate that has a value
      // of zero somewhere on the intersection, and remember which one we picked
      var N = this.normal.elements, A = this.anchor.elements,
          O = obj.normal.elements, B = obj.anchor.elements;
      var solver = Matrix.Zero(2,2), i = 0;
      while (solver.isSingular()) {
        i++;
        solver = Matrix.create([
          [ N[i%3], N[(i+1)%3] ],
          [ O[i%3], O[(i+1)%3]  ]
        ]);
      }
      // Then we solve the simultaneous equations in the remaining dimensions
      var inverse = solver.inverse().elements;
      var x = N[0]*A[0] + N[1]*A[1] + N[2]*A[2];
      var y = O[0]*B[0] + O[1]*B[1] + O[2]*B[2];
      var intersection = [
        inverse[0][0] * x + inverse[0][1] * y,
        inverse[1][0] * x + inverse[1][1] * y
      ];
      var anchor = [];
      for (var j = 1; j <= 3; j++) {
        // This formula picks the right element from intersection by
        // cycling depending on which element we set to zero above
        anchor.push((i == j) ? 0 : intersection[(j + (5 - i)%3)%3]);
      }
      return Line.create(anchor, direction);
    }
  },

  // Returns the point in the plane closest to the given point
  pointClosestTo: function(point) {
    var P = point.elements || point;
    var A = this.anchor.elements, N = this.normal.elements;
    var dot = (A[0] - P[0]) * N[0] + (A[1] - P[1]) * N[1] + (A[2] - (P[2] || 0)) * N[2];
    return Vector.create([P[0] + N[0] * dot, P[1] + N[1] * dot, (P[2] || 0) + N[2] * dot]);
  },

  // Returns a copy of the plane, rotated by t radians about the given line
  // See notes on Line#rotate.
  rotate: function(t, line) {
    var R = t.determinant ? t.elements : Matrix.Rotation(t, line.direction).elements;
    var C = line.pointClosestTo(this.anchor).elements;
    var A = this.anchor.elements, N = this.normal.elements;
    var C1 = C[0], C2 = C[1], C3 = C[2], A1 = A[0], A2 = A[1], A3 = A[2];
    var x = A1 - C1, y = A2 - C2, z = A3 - C3;
    return Plane.create([
      C1 + R[0][0] * x + R[0][1] * y + R[0][2] * z,
      C2 + R[1][0] * x + R[1][1] * y + R[1][2] * z,
      C3 + R[2][0] * x + R[2][1] * y + R[2][2] * z
    ], [
      R[0][0] * N[0] + R[0][1] * N[1] + R[0][2] * N[2],
      R[1][0] * N[0] + R[1][1] * N[1] + R[1][2] * N[2],
      R[2][0] * N[0] + R[2][1] * N[1] + R[2][2] * N[2]
    ]);
  },

  // Returns the reflection of the plane in the given point, line or plane.
  reflectionIn: function(obj) {
    if (obj.normal) {
      // obj is a plane
      var A = this.anchor.elements, N = this.normal.elements;
      var A1 = A[0], A2 = A[1], A3 = A[2], N1 = N[0], N2 = N[1], N3 = N[2];
      var newA = this.anchor.reflectionIn(obj).elements;
      // Add the plane's normal to its anchor, then mirror that in the other plane
      var AN1 = A1 + N1, AN2 = A2 + N2, AN3 = A3 + N3;
      var Q = obj.pointClosestTo([AN1, AN2, AN3]).elements;
      var newN = [Q[0] + (Q[0] - AN1) - newA[0], Q[1] + (Q[1] - AN2) - newA[1], Q[2] + (Q[2] - AN3) - newA[2]];
      return Plane.create(newA, newN);
    } else if (obj.direction) {
      // obj is a line
      return this.rotate(Math.PI, obj);
    } else {
      // obj is a point
      var P = obj.elements || obj;
      return Plane.create(this.anchor.reflectionIn([P[0], P[1], (P[2] || 0)]), this.normal);
    }
  },

  // Sets the anchor point and normal to the plane. If three arguments are specified,
  // the normal is calculated by assuming the three points should lie in the same plane.
  // If only two are sepcified, the second is taken to be the normal. Normal vector is
  // normalised before storage.
  setVectors: function(anchor, v1, v2) {
    anchor = Vector.create(anchor);
    anchor = anchor.to3D(); if (anchor === null) { return null; }
    v1 = Vector.create(v1);
    v1 = v1.to3D(); if (v1 === null) { return null; }
    if (typeof(v2) == 'undefined') {
      v2 = null;
    } else {
      v2 = Vector.create(v2);
      v2 = v2.to3D(); if (v2 === null) { return null; }
    }
    var A1 = anchor.elements[0], A2 = anchor.elements[1], A3 = anchor.elements[2];
    var v11 = v1.elements[0], v12 = v1.elements[1], v13 = v1.elements[2];
    var normal, mod;
    if (v2 !== null) {
      var v21 = v2.elements[0], v22 = v2.elements[1], v23 = v2.elements[2];
      normal = Vector.create([
        (v12 - A2) * (v23 - A3) - (v13 - A3) * (v22 - A2),
        (v13 - A3) * (v21 - A1) - (v11 - A1) * (v23 - A3),
        (v11 - A1) * (v22 - A2) - (v12 - A2) * (v21 - A1)
      ]);
      mod = normal.modulus();
      if (mod === 0) { return null; }
      normal = Vector.create([normal.elements[0] / mod, normal.elements[1] / mod, normal.elements[2] / mod]);
    } else {
      mod = Math.sqrt(v11*v11 + v12*v12 + v13*v13);
      if (mod === 0) { return null; }
      normal = Vector.create([v1.elements[0] / mod, v1.elements[1] / mod, v1.elements[2] / mod]);
    }
    this.anchor = anchor;
    this.normal = normal;
    return this;
  }
};

// Constructor function
Plane.create = function(anchor, v1, v2) {
  var P = new Plane();
  return P.setVectors(anchor, v1, v2);
};

// X-Y-Z planes
Plane.XY = Plane.create(Vector.Zero(3), Vector.k);
Plane.YZ = Plane.create(Vector.Zero(3), Vector.i);
Plane.ZX = Plane.create(Vector.Zero(3), Vector.j);
Plane.YX = Plane.XY; Plane.ZY = Plane.YZ; Plane.XZ = Plane.ZX;

// Returns the plane containing the given points (can be arrays as
// well as vectors). If the points are not coplanar, returns null.
Plane.fromPoints = function(points) {
  var np = points.length, list = [], i, P, n, N, A, B, C, D, theta, prevN, totalN = Vector.Zero(3);
  for (i = 0; i < np; i++) {
    P = Vector.create(points[i]).to3D();
    if (P === null) { return null; }
    list.push(P);
    n = list.length;
    if (n > 2) {
      // Compute plane normal for the latest three points
      A = list[n-1].elements; B = list[n-2].elements; C = list[n-3].elements;
      N = Vector.create([
        (A[1] - B[1]) * (C[2] - B[2]) - (A[2] - B[2]) * (C[1] - B[1]),
        (A[2] - B[2]) * (C[0] - B[0]) - (A[0] - B[0]) * (C[2] - B[2]),
        (A[0] - B[0]) * (C[1] - B[1]) - (A[1] - B[1]) * (C[0] - B[0])
      ]).toUnitVector();
      if (n > 3) {
        // If the latest normal is not (anti)parallel to the previous one, we've strayed off the plane.
        // This might be a slightly long-winded way of doing things, but we need the sum of all the normals
        // to find which way the plane normal should point so that the points form an anticlockwise list.
        theta = N.angleFrom(prevN);
        if (theta !== null) {
          if (!(Math.abs(theta) <= Sylvester.precision || Math.abs(theta - Math.PI) <= Sylvester.precision)) { return null; }
        }
      }
      totalN = totalN.add(N);
      prevN = N;
    }
  }
  // We need to add in the normals at the start and end points, which the above misses out
  A = list[1].elements; B = list[0].elements; C = list[n-1].elements; D = list[n-2].elements;
  totalN = totalN.add(Vector.create([
    (A[1] - B[1]) * (C[2] - B[2]) - (A[2] - B[2]) * (C[1] - B[1]),
    (A[2] - B[2]) * (C[0] - B[0]) - (A[0] - B[0]) * (C[2] - B[2]),
    (A[0] - B[0]) * (C[1] - B[1]) - (A[1] - B[1]) * (C[0] - B[0])
  ]).toUnitVector()).add(Vector.create([
    (B[1] - C[1]) * (D[2] - C[2]) - (B[2] - C[2]) * (D[1] - C[1]),
    (B[2] - C[2]) * (D[0] - C[0]) - (B[0] - C[0]) * (D[2] - C[2]),
    (B[0] - C[0]) * (D[1] - C[1]) - (B[1] - C[1]) * (D[0] - C[0])
  ]).toUnitVector());
  return Plane.create(list[0], totalN);
};

module.exports = Plane;

},{"./line":49,"./matrix":51,"./sylvester":53,"./vector":54}],53:[function(require,module,exports){
// Copyright (c) 2011, Chris Umbel, James Coglan
// This file is required in order for any other classes to work. Some Vector methods work with the
// other Sylvester classes and are useless unless they are included. Other classes such as Line and
// Plane will not function at all without Vector being loaded first.           

Math.sign = function(x) {
    return x < 0 ? -1: 1;
}
                                              
var Sylvester = {
    precision: 1e-6,
    approxPrecision: 1e-5
};

module.exports = Sylvester;

},{}],54:[function(require,module,exports){
// Copyright (c) 2011, Chris Umbel, James Coglan
// This file is required in order for any other classes to work. Some Vector methods work with the
// other Sylvester classes and are useless unless they are included. Other classes such as Line and
// Plane will not function at all without Vector being loaded first.

var Sylvester = require('./sylvester'),
Matrix = require('./matrix');

function Vector() {}
Vector.prototype = {

    norm: function() {
	var n = this.elements.length;
	var sum = 0;

	while (n--) {
	    sum += Math.pow(this.elements[n], 2);
	}

	return Math.sqrt(sum);
    },

    // Returns element i of the vector
    e: function(i) {
      return (i < 1 || i > this.elements.length) ? null : this.elements[i - 1];
    },

    // Returns the number of rows/columns the vector has
    dimensions: function() {
      return {rows: 1, cols: this.elements.length};
    },

    // Returns the number of rows in the vector
    rows: function() {
      return 1;
    },

    // Returns the number of columns in the vector
    cols: function() {
      return this.elements.length;
    },

    // Returns the modulus ('length') of the vector
    modulus: function() {
      return Math.sqrt(this.dot(this));
    },

    // Returns true iff the vector is equal to the argument
    eql: function(vector) {
    	var n = this.elements.length;
    	var V = vector.elements || vector;
    	if (n != V.length) { return false; }
    	while (n--) {
    	    if (Math.abs(this.elements[n] - V[n]) > Sylvester.precision) { return false; }
    	}
    	return true;
    },

    // Returns a copy of the vector
    dup: function() {
	    return Vector.create(this.elements);
    },

    // Maps the vector to another vector according to the given function
    map: function(fn) {
	var elements = [];
	this.each(function(x, i) {
	    elements.push(fn(x, i));
	});
	return Vector.create(elements);
    },

    // Calls the iterator for each element of the vector in turn
    each: function(fn) {
	var n = this.elements.length;
	for (var i = 0; i < n; i++) {
	    fn(this.elements[i], i + 1);
	}
    },

    // Returns a new vector created by normalizing the receiver
    toUnitVector: function() {
	var r = this.modulus();
	if (r === 0) { return this.dup(); }
	return this.map(function(x) { return x / r; });
    },

    // Returns the angle between the vector and the argument (also a vector)
    angleFrom: function(vector) {
	var V = vector.elements || vector;
	var n = this.elements.length, k = n, i;
	if (n != V.length) { return null; }
	var dot = 0, mod1 = 0, mod2 = 0;
	// Work things out in parallel to save time
	this.each(function(x, i) {
	    dot += x * V[i - 1];
	    mod1 += x * x;
	    mod2 += V[i - 1] * V[i - 1];
	});
	mod1 = Math.sqrt(mod1); mod2 = Math.sqrt(mod2);
	if (mod1 * mod2 === 0) { return null; }
	var theta = dot / (mod1 * mod2);
	if (theta < -1) { theta = -1; }
	if (theta > 1) { theta = 1; }
	return Math.acos(theta);
    },

    // Returns true iff the vector is parallel to the argument
    isParallelTo: function(vector) {
	var angle = this.angleFrom(vector);
	return (angle === null) ? null : (angle <= Sylvester.precision);
    },

    // Returns true iff the vector is antiparallel to the argument
    isAntiparallelTo: function(vector) {
	var angle = this.angleFrom(vector);
	return (angle === null) ? null : (Math.abs(angle - Math.PI) <= Sylvester.precision);
    },

    // Returns true iff the vector is perpendicular to the argument
    isPerpendicularTo: function(vector) {
	var dot = this.dot(vector);
	return (dot === null) ? null : (Math.abs(dot) <= Sylvester.precision);
    },

    // Returns the result of adding the argument to the vector
    add: function(value) {
	var V = value.elements || value;

	if (this.elements.length != V.length) 
	    return this.map(function(v) { return v + value });
	else
	    return this.map(function(x, i) { return x + V[i - 1]; });
    },

    // Returns the result of subtracting the argument from the vector
    subtract: function(v) {
	if (typeof(v) == 'number')
	    return this.map(function(k) { return k - v; });

	var V = v.elements || v;
	if (this.elements.length != V.length) { return null; }
	return this.map(function(x, i) { return x - V[i - 1]; });
    },

    // Returns the result of multiplying the elements of the vector by the argument
    multiply: function(k) {
	return this.map(function(x) { return x * k; });
    },

    elementMultiply: function(v) {
	return this.map(function(k, i) {
	    return v.e(i) * k;
	});
    },

    sum: function() {
	var sum = 0;
	this.map(function(x) { sum += x;});
	return sum;
    },

    chomp: function(n) {
	var elements = [];

	for (var i = n; i < this.elements.length; i++) {
	    elements.push(this.elements[i]);
	}

	return Vector.create(elements);
    },

    top: function(n) {
	var elements = [];

	for (var i = 0; i < n; i++) {
	    elements.push(this.elements[i]);
	}

	return Vector.create(elements);
    },

    augment: function(elements) {
	var newElements = this.elements;

	for (var i = 0; i < elements.length; i++) {
	    newElements.push(elements[i]);
	}

	return Vector.create(newElements);
    },

    x: function(k) { return this.multiply(k); },

    log: function() {
	return Vector.log(this);
    },

    elementDivide: function(vector) {
	return this.map(function(v, i) {
	    return v / vector.e(i);
	});
    },

    product: function() {
	var p = 1;

	this.map(function(v) {
	    p *= v;
	});

	return p;
    },

    // Returns the scalar product of the vector with the argument
    // Both vectors must have equal dimensionality
    dot: function(vector) {
	var V = vector.elements || vector;
	var i, product = 0, n = this.elements.length;	
	if (n != V.length) { return null; }
	while (n--) { product += this.elements[n] * V[n]; }
	return product;
    },

    // Returns the vector product of the vector with the argument
    // Both vectors must have dimensionality 3
    cross: function(vector) {
	var B = vector.elements || vector;
	if (this.elements.length != 3 || B.length != 3) { return null; }
	var A = this.elements;
	return Vector.create([
	    (A[1] * B[2]) - (A[2] * B[1]),
	    (A[2] * B[0]) - (A[0] * B[2]),
	    (A[0] * B[1]) - (A[1] * B[0])
	]);
    },

    // Returns the (absolute) largest element of the vector
    max: function() {
	var m = 0, i = this.elements.length;
	while (i--) {
	    if (Math.abs(this.elements[i]) > Math.abs(m)) { m = this.elements[i]; }
	}
	return m;
    },


    maxIndex: function() {
	var m = 0, i = this.elements.length;
	var maxIndex = -1;

	while (i--) {
	    if (Math.abs(this.elements[i]) > Math.abs(m)) { 
		m = this.elements[i]; 
		maxIndex = i + 1;
	    }
	}

	return maxIndex;
    },


    // Returns the index of the first match found
    indexOf: function(x) {
	var index = null, n = this.elements.length;
	for (var i = 0; i < n; i++) {
	    if (index === null && this.elements[i] == x) {
		index = i + 1;
	    }
	}
	return index;
    },

    // Returns a diagonal matrix with the vector's elements as its diagonal elements
    toDiagonalMatrix: function() {
	return Matrix.Diagonal(this.elements);
    },

    // Returns the result of rounding the elements of the vector
    round: function() {
	return this.map(function(x) { return Math.round(x); });
    },

    // Transpose a Vector, return a 1xn Matrix
    transpose: function() {
	var rows = this.elements.length;
	var elements = [];

	for (var i = 0; i < rows; i++) {
	    elements.push([this.elements[i]]);
	}
	return Matrix.create(elements);
    },

    // Returns a copy of the vector with elements set to the given value if they
    // differ from it by less than Sylvester.precision
    snapTo: function(x) {
	return this.map(function(y) {
	    return (Math.abs(y - x) <= Sylvester.precision) ? x : y;
	});
    },

    // Returns the vector's distance from the argument, when considered as a point in space
    distanceFrom: function(obj) {
	if (obj.anchor || (obj.start && obj.end)) { return obj.distanceFrom(this); }
	var V = obj.elements || obj;
	if (V.length != this.elements.length) { return null; }
	var sum = 0, part;
	this.each(function(x, i) {
	    part = x - V[i - 1];
	    sum += part * part;
	});
	return Math.sqrt(sum);
    },

    // Returns true if the vector is point on the given line
    liesOn: function(line) {
	return line.contains(this);
    },

    // Return true iff the vector is a point in the given plane
    liesIn: function(plane) {
	return plane.contains(this);
    },

    // Rotates the vector about the given object. The object should be a
    // point if the vector is 2D, and a line if it is 3D. Be careful with line directions!
    rotate: function(t, obj) {
	var V, R = null, x, y, z;
	if (t.determinant) { R = t.elements; }
	switch (this.elements.length) {
	case 2:
            V = obj.elements || obj;
            if (V.length != 2) { return null; }
            if (!R) { R = Matrix.Rotation(t).elements; }
            x = this.elements[0] - V[0];
            y = this.elements[1] - V[1];
            return Vector.create([
		V[0] + R[0][0] * x + R[0][1] * y,
		V[1] + R[1][0] * x + R[1][1] * y
            ]);
            break;
	case 3:
            if (!obj.direction) { return null; }
            var C = obj.pointClosestTo(this).elements;
            if (!R) { R = Matrix.Rotation(t, obj.direction).elements; }
            x = this.elements[0] - C[0];
            y = this.elements[1] - C[1];
            z = this.elements[2] - C[2];
            return Vector.create([
		C[0] + R[0][0] * x + R[0][1] * y + R[0][2] * z,
		C[1] + R[1][0] * x + R[1][1] * y + R[1][2] * z,
		C[2] + R[2][0] * x + R[2][1] * y + R[2][2] * z
            ]);
            break;
	default:
            return null;
	}
    },

    // Returns the result of reflecting the point in the given point, line or plane
    reflectionIn: function(obj) {
	if (obj.anchor) {
	    // obj is a plane or line
	    var P = this.elements.slice();
	    var C = obj.pointClosestTo(P).elements;
	    return Vector.create([C[0] + (C[0] - P[0]), C[1] + (C[1] - P[1]), C[2] + (C[2] - (P[2] || 0))]);
	} else {
	    // obj is a point
	    var Q = obj.elements || obj;
	    if (this.elements.length != Q.length) { return null; }
	    return this.map(function(x, i) { return Q[i - 1] + (Q[i - 1] - x); });
	}
    },

    // Utility to make sure vectors are 3D. If they are 2D, a zero z-component is added
    to3D: function() {
	var V = this.dup();
	switch (V.elements.length) {
	case 3: break;
	case 2: V.elements.push(0); break;
	default: return null;
	}
	return V;
    },

    // Returns a string representation of the vector
    inspect: function() {
	return '[' + this.elements.join(', ') + ']';
    },

    // Set vector's elements from an array
    setElements: function(els) {
	this.elements = (els.elements || els).slice();
	return this;
    }
};

// Constructor function
Vector.create = function(elements) {
    var V = new Vector();
    return V.setElements(elements);
};

// i, j, k unit vectors
Vector.i = Vector.create([1, 0, 0]);
Vector.j = Vector.create([0, 1, 0]);
Vector.k = Vector.create([0, 0, 1]);

// Random vector of size n
Vector.Random = function(n) {
    var elements = [];
    while (n--) { elements.push(Math.random()); }
    return Vector.create(elements);
};

Vector.Fill = function(n, v) {
    var elements = [];
    while (n--) { elements.push(v); }
    return Vector.create(elements);
};

// Vector filled with zeros
Vector.Zero = function(n) {
    return Vector.Fill(n, 0);
};

Vector.One = function(n) {
    return Vector.Fill(n, 1);
};

Vector.log = function(v) {
    return v.map(function(x) {
	return Math.log(x);
    });
};

module.exports = Vector;

},{"./matrix":51,"./sylvester":53}],55:[function(require,module,exports){
"use strict";

var Class = require('../');
var guid  = require('mout/random/guid');
var forIn  = require('mout/object/forIn');

var EventEmitter = new Class({
  Binds : ['on', 'off', 'once', 'emit'],

  callbacks : {},

  initialize : function() {
    var self = this;
    this.addEvent = this.on;
    this.removeListener = this.off;
    this.removeAllListeners = this.off;
    this.fireEvent = this.emit;
  },

  emit:function(event, payload){
    if(!this.callbacks[event])
      return;

    var args = Array.prototype.slice.call(arguments, 1);

    forIn(this.callbacks[event], function(callback){
      callback.apply(null, args);
    });
  },


  on:function(event, callback){
    if(typeof callback != "function")
      return console.log("you try to register a non function in " , event)
    if(!this.callbacks[event])
      this.callbacks[event] = {};
    this.callbacks[event][guid()] = callback;
  },

  once:function(event, callback){
    var self = this;
    var once = function(){
      self.off(event, once);
      self.off(event, callback);
    };

    this.on(event, callback);
    this.on(event, once);
  },

  off:function(event, callback){
    if(!event)
      this.callbacks = {};
    else if(!callback)
      this.callbacks[event] = {};
    else forIn(this.callbacks[event] || {}, function(v, k) {
      if(v == callback)
        delete this.callbacks[event][k];
    }, this);
  },
});

module.exports = EventEmitter;
},{"../":57,"mout/object/forIn":35,"mout/random/guid":41}],56:[function(require,module,exports){
"use strict";

var verbs = /^Implements|Extends|Binds$/

module.exports = function(ctx, obj){
  for(var key in obj) {
    if(key.match(verbs)) continue;
    if((typeof obj[key] == 'function') && obj[key].$static)
      ctx[key] = obj[key];
    else
      ctx.prototype[key] = obj[key];
  }
  return ctx;
}
},{}],57:[function(require,module,exports){
"use strict";

var hasOwn = require("mout/object/hasOwn");
var create = require("mout/lang/createObject");
var merge  = require("mout/object/merge");
var kindOf = require("mout/lang/kindOf");
var mixIn  = require("mout/object/mixIn");

var implement = require('./implement');
var verbs = /^Implements|Extends|Binds$/




var uClass = function(proto){

  if(kindOf(proto) === "Function") proto = {initialize: proto};

  var superprime = proto.Extends;

  var constructor = (hasOwn(proto, "initialize")) ? proto.initialize : superprime ? superprime : function(){};



  var out = function() {
    var self = this;
      //autobinding takes place here
    if(proto.Binds) proto.Binds.forEach(function(f){
      var original = self[f];
      if(original)
        self[f] = mixIn(self[f].bind(self), original);
    });

      //clone non function/static properties to current instance
    for(var key in out.prototype) {
      var v = out.prototype[key], t = kindOf(v);

      if(key.match(verbs) || t === "Function" || t == "GeneratorFunction")
        continue;

      if(t == "Object")
        self[key] = merge({}, self[key]); //create(null, self[key]);
      else if(t == "Array")
        self[key] = v.slice(); //clone ??
      else
        self[key] = v;
    }

    if(proto.Implements)
      proto.Implements.forEach(function(Mixin){
        Mixin.call(self);
      });




    constructor.apply(this, arguments);
  }


  if (superprime) {
    // inherit from superprime
      var superproto = superprime.prototype;
      if(superproto.Binds)
        proto.Binds = (proto.Binds || []).concat(superproto.Binds);

      if(superproto.Implements)
        proto.Implements = (proto.Implements || []).concat(superproto.Implements);

      var cproto = out.prototype = create(superproto);
      // setting constructor.parent to superprime.prototype
      // because it's the shortest possible absolute reference
      out.parent = superproto;
      cproto.constructor = out

  }


 if(proto.Implements) {
    if (kindOf(proto.Implements) !== "Array")
      proto.Implements = [proto.Implements];
    proto.Implements.forEach(function(Mixin){
      implement(out, Mixin.prototype);
    });
  }

  implement(out, proto);
  if(proto.Binds)
     out.prototype.Binds = proto.Binds;
  if(proto.Implements)
     out.prototype.Implements = proto.Implements;

  return out;
};



module.exports = uClass;
},{"./implement":56,"mout/lang/createObject":26,"mout/lang/kindOf":32,"mout/object/hasOwn":37,"mout/object/merge":38,"mout/object/mixIn":39}]},{},[6]);
