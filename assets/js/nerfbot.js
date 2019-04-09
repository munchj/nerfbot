const $ = require("jquery");
const c = require('./constants');
const settings = require('./settings');
import nipplejs from 'nipplejs';


var updateRate = 10; //number of updates by second
var baseMinSpeed = 80;
var maxSpeed = 150;

var keyMapMovement = {'w':false, 'a':false, 's':false, 'd':false};
var keyMapTurret = {'i':false, 'k':false, 'j':false, 'l':false};
var keyMapShooting = {'u':false, 'o':false};
var updateMap = {'speedX':0, 'speedY': 0};


///////////////////////////////////////////////
////////////// websocket client  //////////////
///////////////////////////////////////////////
var nerfbotBaseServer = new WebSocket(settings.ws_base_handling);
var nerfbotTurretServer = new WebSocket(settings.ws_turret_handling);

nerfbotBaseServer.onopen = function() {
	console.log("[WebSocket] connected");
	$("#nerfbot_base_ws_status").text("base connected to " + settings.ws_base_handling);
}
nerfbotBaseServer.onerror = function(evt) {
	console.log("[WebSocket] error");
	$("#nerfbot_base_ws_status").text("base communication error " + evt);
}
nerfbotBaseServer.onclose = function() {
	console.log("[WebSocket] disconnected");
	$("#nerfbot_base_ws_status").text("base disconnected from " + settings.ws_base_handling);
}

nerfbotTurretServer.onopen = function() {
	console.log("[WebSocket] connected");
	$("#nerfbot_turret_ws_status").text("turret connected to " + settings.ws_turret_handling);
}
nerfbotTurretServer.onerror = function(evt) {
	console.log("[WebSocket] error");
	$("#nerfbot_turret_ws_status").text("turret communication error " + evt);
}
nerfbotTurretServer.onclose = function() {
	console.log("[WebSocket] disconnected");
	$("#nerfbot_turret_ws_status").text("turret disconnected from " + settings.ws_turret_handling);
}

var sendCommandToBase = function(command) {
	
	if(nerfbotBaseServer.readyState === nerfbotBaseServer.OPEN) {
		//console.log("sending " + command);
		nerfbotBaseServer.send(command);
	}
	else {
		//console.log("[websocket offline] " + command);
	}
}

var sendCommandToTurret = function(command) {
	
	if(nerfbotTurretServer.readyState === nerfbotTurretServer.OPEN) {
		//console.log("sending " + command);
		nerfbotTurretServer.send(command);
	}
	else {
		//console.log("[websocket offline] " + command);
	}
}

nerfbotBaseServer.onmessage = function(event) {
	//console.log("[WebSocket] >>" + event.data);
}

nerfbotTurretServer.onmessage = function(event) {
	//console.log("[WebSocket] >>" + event.data);
}

///////////////////////////////////////////////////////
////////////// send packets to websocket //////////////
///////////////////////////////////////////////////////


function wsUpdate() {
		var obj = {
			type: c.MSG_MOVE,
			linearSpeed: updateMap.speedX,
			angularSpeed: updateMap.speedY
		}
	
	$("#nerfbot_horizontal_movement").text("speedX:" + updateMap.speedX + " speedY:" + updateMap.speedY);
	sendCommandToBase(JSON.stringify(obj));
	setTimeout(wsUpdate, 1000/updateRate);
}
$(document).ready(wsUpdate);

function horizontalMove(speedX, speedY) {
	updateMap.speedX = speedX;
	updateMap.speedY = speedY;
}

function moveTurret(speedX, speedY) {
	var obj = {
		type: c.MSG_MOVE_TURRET,
		speedX: speedX,
		speedY: speedY
	}

	sendCommandToTurret(JSON.stringify(obj));
	$("#nerfbot_vertical_movement").text("speedX:" + speedX + " speedY:" + speedY);

}

function shoot(speed)
{
	var obj = {
		type: c.MSG_SHOOT
	}
	
	sendCommandToTurret(JSON.stringify(obj));
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

var fcnHandleMapChangeTurret = function() {
	if(keyMapTurret.i && keyMapTurret.k) {return;}
	if(keyMapTurret.j && keyMapTurret.k) {return;}
	
	if(keyMapTurret.i && !keyMapTurret.j && !keyMapTurret.l) { moveTurret(maxSpeed, 0); return;}
	if(keyMapTurret.i && keyMapTurret.j && !keyMapTurret.l) { moveTurret(maxSpeed, -maxSpeed); return;}
	if(keyMapTurret.i && !keyMapTurret.j && keyMapTurret.l) { moveTurret(maxSpeed, maxSpeed); return;}
	
	if(keyMapTurret.k && !keyMapTurret.j && !keyMapTurret.l) { moveTurret(-maxSpeed, 0); return;}
	if(keyMapTurret.k && keyMapTurret.j && !keyMapTurret.l) { moveTurret(-maxSpeed, -maxSpeed); return;}
	if(keyMapTurret.k && !keyMapTurret.j && keyMapTurret.l) { moveTurret(-maxSpeed, maxSpeed); return;}
	
	if(keyMapTurret.j) { moveTurret(0, -maxSpeed); return;}
	if(keyMapTurret.l) { moveTurret(0, maxSpeed); return;}
	
	if(!keyMapTurret.i && !keyMapTurret.j && !keyMapTurret.k && !keyMapTurret.l) { moveTurret(0, 0); return;}
}

var fcnHandleMapChangeShooting = function() {

}

$(document).keyup(function(event) {
	var oldMapMovement = JSON.stringify(keyMapMovement);
	var oldMapVertical = JSON.stringify(keyMapTurret);
	var oldMapShooting = JSON.stringify(keyMapShooting);
	
	switch(event.key) {
		case 'w': keyMapMovement.w = false; break;
		case 'a': keyMapMovement.a = false; break;
		case 's': keyMapMovement.s = false; break;
		case 'd': keyMapMovement.d = false; break;
		case 'i': keyMapTurret.i = false; break;
		case 'j': keyMapTurret.j = false; break;
		case 'k': keyMapTurret.k = false; break;
		case 'l': keyMapTurret.l = false; break;
		
		default:{break;}
	}
	var newMapMovement = JSON.stringify(keyMapMovement);
	var newMapVertical = JSON.stringify(keyMapTurret);
	var newMapShooting = JSON.stringify(keyMapShooting);
	
	
	if(newMapMovement != oldMapMovement)
	{
		fcnHandleMapChangeMovement();
	}
	
	if(newMapVertical != oldMapVertical)
	{
		fcnHandleMapChangeTurret();
	}

		if(newMapShooting != oldMapShooting)
	{
		fcnHandleMapChangeShooting();
	}
});

$(document).keydown(function(event) {
	var oldMapMovement = JSON.stringify(keyMapMovement);
	var oldMapTurret = JSON.stringify(keyMapTurret);
	var oldMapShooting = JSON.stringify(keyMapShooting);
	
	switch(event.key) {
		case 'w': keyMapMovement.w = true; break;
		case 'a': keyMapMovement.a = true; break;	
		case 's': keyMapMovement.s = true; break;	
		case 'd': keyMapMovement.d = true; break;	
		case 'i': keyMapTurret.i = true; break;	
		case 'j': keyMapTurret.j = true; break;	
		case 'k': keyMapTurret.k = true; break;	
		case 'l': keyMapTurret.l = true; break;	
		default:{break;}
	}
	var newMapMovement = JSON.stringify(keyMapMovement);
	var newMapVertical = JSON.stringify(keyMapTurret);
	var newMapShooting = JSON.stringify(keyMapShooting);
	
	
	if(newMapMovement != oldMapMovement)
	{
		fcnHandleMapChangeMovement();
	}
	
	if(newMapVertical != oldMapTurret)
	{
		fcnHandleMapChangeTurret();
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
	if(speed <= 10 && speed >= - 10) {tmp = 0;}
	else if(speed > 10) {tmp = (speed - 10)*maxSpeed/90;}
	else if(speed < -10) {tmp = (speed + 10)*maxSpeed/90;}
	return Math.round(tmp);
}

var remapBaseSpeed = function(speed) {
	const delta = maxSpeed - baseMinSpeed;
	if(speed > 0) {
		return Math.round(baseMinSpeed + ((speed / maxSpeed) * delta));
	}
	else if(speed < 0) {
		return Math.round(-baseMinSpeed + ((speed / maxSpeed) * delta));
	}
	return 0;
}

$(document).ready(function() {
    var driveOptions = {
        zone: document.getElementById('nerfbot_video_bottom_left'),
		mode: "static",
		position: {bottom: 80, left : 80},
		color: "red",
    };
    var driveManager = nipplejs.create(driveOptions);

	driveManager.get(0).on("move", function(evt, data) {
		var speed = data.distance*2;
		var speedX = speed*Math.sin(data.angle.radian);
		var speedY = speed*Math.cos(data.angle.radian);
		
		//avoid moving immediately
		speedX = remapBaseSpeed(readjustSpeed(speedX));
		speedY = remapBaseSpeed(readjustSpeed(speedY));
		
		horizontalMove(speedX,speedY);
	});
	
	driveManager.get(0).on("end", function(evt) {
		horizontalMove(0,0);
	});
	
	var turretOptions = {
        zone: document.getElementById('nerfbot_video_bottom_right'),
		mode: "static",
		position: {bottom: 80, right : 80},
		color: "lightblue",
		//lockX: true
    };
    var turretManager = nipplejs.create(turretOptions);

	turretManager.get(1).on("move", function(evt, data) {
		var speed = data.distance*2;
		var speedX = speed*Math.sin(data.angle.radian);
		var speedY = speed*Math.cos(data.angle.radian);
		speedX = readjustSpeed(speedX);
		speedY = readjustSpeed(speedY);

		moveTurret(speedX, speedY);
	});
	
	turretManager.get(1).on("end", function(evt) {
		moveTurret(0, 0);
	});	
});

