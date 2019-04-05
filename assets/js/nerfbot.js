const $ = require("jquery");
const c = require('./constants');
const settings = require('./settings');
import nipplejs from 'nipplejs';

console.log("test:", c.MSG_MOVE);

const MSG_PING = "ping";
const MSG_MOVE = "move";

const MOTOR_FL = "motor_fl";
const MOTOR_FR = "motor_fr";
const MOTOR_BL = "motor_bl";
const MOTOR_BR = "motor_br";

const FORWARD = "fw";
const BACKWARDS = "bw";

const FRONT = "front";
const BACK = "back";
const LEFT = "left";
const RIGHT = "right";

const HIGH = 255;
const LOW = 0;

const TIMEOUT_MS = 100;


var updateRate = 10; //number of updates by second
var maxSpeed = 255;
var keepAlive = 2000;
var keyMapMovement = {'w':false, 'a':false, 's':false, 'd':false};
var keyMapVertical = {'i':false, 'k':false};
var keyMapShooting = {'j':false, 'l':false};
var updateMap = {'speedX':0, 'speedY': 0};

var lastCmdVertical;
var lastCmdShooting;

///////////////////////////////////////////////
////////////// websocket client  //////////////
///////////////////////////////////////////////
var nerfbotServer = new WebSocket(settings.ws_base_handling);

nerfbotServer.onopen = function() {
	console.log("[WebSocket] connected");
	$("#nerfbot_ws_status").text("connected to " + settings.ws_base_handling);
}
nerfbotServer.onerror = function(evt) {
	console.log("[WebSocket] error");
	$("#nerfbot_ws_status").text("communication error " + evt);
}
nerfbotServer.onclose = function() {
	console.log("[WebSocket] disconnected");
	$("#nerfbot_ws_status").text("disconnected from " + settings.ws_base_handling);
}

var sendCommand = function(command) {
	
	if(nerfbotServer.readyState === nerfbotServer.OPEN) {
		//console.log("sending " + command);
		nerfbotServer.send(command);
	}
	else {
		//console.log("[websocket offline] " + command);
	}
}

nerfbotServer.onmessage = function(event) {
	console.log("[WebSocket] >>" + event.data);
}

//////////////////////////////////////////////////
////////////// keepalive management //////////////
//////////////////////////////////////////////////
/*var fncKeepAlive = function() {
	sendCommand("ka:"+ new Date().getTime());
	setTimeout(fncKeepAlive, keepAlive);
}

$(document).ready(fncKeepAlive);*/

///////////////////////////////////////////////////////
////////////// send packets to websocket //////////////
///////////////////////////////////////////////////////


function wsUpdate() {
		var obj = {
			type: MSG_MOVE,
			linearSpeed: updateMap.speedX,
			angularSpeed: updateMap.speedY
		}
	
	$("#nerfbot_horizontal_movement").text("speedX:" + updateMap.speedX + " speedY:" + updateMap.speedY);
	sendCommand(JSON.stringify(obj));
	setTimeout(wsUpdate, 1000/updateRate);
}
$(document).ready(wsUpdate);

function horizontalMove(speedX, speedY) {
	updateMap.speedX = speedX;
	updateMap.speedY = speedY;
}

function verticalMove(speed) {
	var cmdVertical = "vm:" + speed;
	if(cmdVertical != lastCmdVertical || cmdVertical == 'vm:0') {
		sendCommand(cmdVertical);
		$("#nerfbot_vertical_movement").text(speed);
	}
	
	lastCmdVertical = cmdVertical;
}

function shoot(speed)
{
	var cmdShooting = "sh:" + speed;
	
	if(cmdShooting != lastCmdShooting) {
		sendCommand(cmdShooting);
	}
	
	lastCmdShooting = cmdShooting;
}

//////////////////////////////////////////////////
////////////// keyboard management ///////////////
//////////////////////////////////////////////////
var fcnHandleMapChangeMovement = function() {
	if(keyMapMovement.w && keyMapMovement.s) {return;}
	if(keyMapMovement.a && keyMapMovement.s) {return;}
	
	if(keyMapMovement.w && !keyMapMovement.a && !keyMapMovement.d) { horizontalMove(maxSpeed, 0); return;}
	if(keyMapMovement.w && keyMapMovement.a && !keyMapMovement.d) { horizontalMove(maxSpeed, -maxSpeed); return;}
	if(keyMapMovement.w && !keyMapMovement.a && keyMapMovement.d) { horizontalMove(maxSpeed, maxSpeed); return;}
	
	if(keyMapMovement.s && !keyMapMovement.a && !keyMapMovement.d) { horizontalMove(-maxSpeed, 0); return;}
	if(keyMapMovement.s && keyMapMovement.a && !keyMapMovement.d) { horizontalMove(-maxSpeed, -maxSpeed); return;}
	if(keyMapMovement.s && !keyMapMovement.a && keyMapMovement.d) { horizontalMove(-maxSpeed, maxSpeed); return;}
	
	if(keyMapMovement.a) { horizontalMove(0, -maxSpeed); return;}
	if(keyMapMovement.d) { horizontalMove(0, maxSpeed); return;}
	
	if(!keyMapMovement.w && !keyMapMovement.a && !keyMapMovement.s && !keyMapMovement.d) { horizontalMove(0, 0); return;}
}

var fcnHandleMapChangeVertical = function() {
	if(keyMapVertical.i) { verticalMove(100); return;}
	if(keyMapVertical.k) { verticalMove(-100); return;}
	if(!keyMapVertical.i && !keyMapVertical.k) { verticalMove(0); return;}
}

var fcnHandleMapChangeShooting = function() {
	if(keyMapShooting.j) { shoot(100); return;}
	if(keyMapShooting.l) { shoot(100); return;}
	if(!keyMapShooting.j && !keyMapShooting.l) { shoot(0); return;}
}

$(document).keyup(function(event) {
	var oldMapMovement = JSON.stringify(keyMapMovement);
	var oldMapVertical = JSON.stringify(keyMapVertical);
	var oldMapShooting = JSON.stringify(keyMapShooting);
	
	switch(event.key) {
		case 'w': keyMapMovement.w = false; break;
		case 'a': keyMapMovement.a = false; break;
		case 's': keyMapMovement.s = false; break;
		case 'd': keyMapMovement.d = false; break;
		case 'i': keyMapVertical.i = false; break;
		case 'j': keyMapShooting.j = false; break;
		case 'k': keyMapVertical.k = false; break;
		case 'l': keyMapShooting.l = false; break;
		default:{break;}
	}
	var newMapMovement = JSON.stringify(keyMapMovement);
	var newMapVertical = JSON.stringify(keyMapVertical);
	var newMapShooting = JSON.stringify(keyMapShooting);
	
	
	if(newMapMovement != oldMapMovement)
	{
		fcnHandleMapChangeMovement();
	}
	
	if(newMapVertical != oldMapVertical)
	{
		fcnHandleMapChangeVertical();
	}

		if(newMapShooting != oldMapShooting)
	{
		fcnHandleMapChangeShooting();
	}
});

$(document).keydown(function(event) {
	var oldMapMovement = JSON.stringify(keyMapMovement);
	var oldMapVertical = JSON.stringify(keyMapVertical);
	var oldMapShooting = JSON.stringify(keyMapShooting);
	
	switch(event.key) {
		case 'w': keyMapMovement.w = true; break;
		case 'a': keyMapMovement.a = true; break;	
		case 's': keyMapMovement.s = true; break;	
		case 'd': keyMapMovement.d = true; break;	
		case 'i': keyMapVertical.i = true; break;	
		case 'j': keyMapShooting.j = true; break;	
		case 'k': keyMapVertical.k = true; break;	
		case 'l': keyMapShooting.l = true; break;	
		default:{break;}
	}
	var newMapMovement = JSON.stringify(keyMapMovement);
	var newMapVertical = JSON.stringify(keyMapVertical);
	var newMapShooting = JSON.stringify(keyMapShooting);
	
	
	if(newMapMovement != oldMapMovement)
	{
		fcnHandleMapChangeMovement();
	}
	
	if(newMapVertical != oldMapVertical)
	{
		fcnHandleMapChangeVertical();
	}

		if(newMapShooting != oldMapShooting)
	{
		fcnHandleMapChangeShooting();
	}
});


///////////////////////////////////////
////////////// nipplejs ///////////////
///////////////////////////////////////
var readjustSpeed = function(speed) {
	var tmp = 0;
	if(speed <= 20 && speed >= - 20) {tmp = 0;}
	else if(speed > 20) {tmp = (speed - 20)*maxSpeed/80;}
	else if(speed < -20) {tmp = (speed + 20)*maxSpeed/80;}
	return Math.round(tmp);
}

$(document).ready(function() {
    var movementOptions = {
        zone: document.getElementById('nerfbot_video_bottom_left'),
		mode: "static",
		position: {bottom: 80, left : 80},
		color: "red",
    };
    var movementManager = nipplejs.create(movementOptions);

	movementManager.get(0).on("move", function(evt, data) {
		var speed = data.distance*2;
		var speedX = speed*Math.sin(data.angle.radian);
		var speedY = speed*Math.cos(data.angle.radian);
		
		//avoid moving immediately
		speedX = readjustSpeed(speedX);
		speedY = readjustSpeed(speedY);
		
		horizontalMove(speedX,speedY);
	});
	
	movementManager.get(0).on("end", function(evt) {
		horizontalMove(0,0);
	});
	
	var verticalOptions = {
        zone: document.getElementById('nerfbot_video_bottom_right'),
		mode: "static",
		position: {bottom: 80, right : 80},
		color: "lightblue",
		lockX: true
    };
    var verticalManager = nipplejs.create(verticalOptions);

	verticalManager.get(1).on("move", function(evt, data) {
		var speed = data.distance*2;
		var speedX = speed*Math.sin(data.angle.radian);
		speedX = readjustSpeed(speedX);

		verticalMove(speedX);
	});
	
	verticalManager.get(1).on("end", function(evt) {
		verticalMove(0);
	});	
});

