const $ = require("jquery");
const c = require('./constants');
const settings = require('./settings');
import nipplejs from 'nipplejs';
const Magazine = require('./classes/Magazine');


var baseMinSpeed = 80;
var maxSpeed = c.HIGH;

var keyMapMovement = {'w':false, 'a':false, 's':false, 'd':false};
var keyMapTurret = {'i':false, 'k':false, 'j':false, 'l':false};
var keyMapShooting = {'u':false, 'o':false};
var baseUpdateMap = {'speedX':0, 'speedY': 0};
var turretUpdateMap = {'speedX':0, 'speedY': 0};

///////////////////////////////////////////////
////////////// websocket client  //////////////
///////////////////////////////////////////////
var nerfbotBaseServer = new WebSocket(settings.ws_base_handling);
var nerfbotTurretServer = new WebSocket(settings.ws_turret_handling);

window.nerfbotBaseServer = nerfbotBaseServer;
window.nerfbotTurretServer = nerfbotTurretServer;

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
		var baseObj = {
			type: c.MSG_MOVE,
			linearSpeed: baseUpdateMap.speedX,
			angularSpeed: baseUpdateMap.speedY
		}
		var turretObj = {
			type: c.MSG_MOVE_TURRET,
			speedX: turretUpdateMap.speedX,
			speedY: turretUpdateMap.speedY
		}
	
	$("#nerfbot_horizontal_movement").text("speedX:" + baseUpdateMap.speedX + " speedY:" + baseUpdateMap.speedY);
	$("#nerfbot_vertical_movement").text("speedX:" + turretUpdateMap.speedX + " speedY:" + turretUpdateMap.speedY);

	sendCommandToBase(JSON.stringify(baseObj));
	sendCommandToTurret(JSON.stringify(turretObj));

	setTimeout(wsUpdate, 1000/c.UPDATE_RATE);
}
$(document).ready(wsUpdate);

function moveBase(speedX, speedY) {
	baseUpdateMap.speedX = speedX;
	baseUpdateMap.speedY = speedY;
}

function moveTurret(speedX, speedY) {
	turretUpdateMap.speedX = speedX;
	turretUpdateMap.speedY = speedY;
}

function shoot(speed)
{
	console.log("shoot")
	var obj = {
		type: c.MSG_SHOOT
	}
	
	sendCommandToTurret(JSON.stringify(obj));
}

function calibrateStart()
{
	console.log("calibrate start")
	var obj = {
		type: c.MSG_CALIBRATE_START
	}
	
	sendCommandToTurret(JSON.stringify(obj));
}


function calibrateFinish()
{
	console.log("calibrate finish")
	var obj = {
		type: c.MSG_CALIBRATE_FINISH
	}
	
	sendCommandToTurret(JSON.stringify(obj));
}

//////////////////////////////////////////////////
////////////// keyboard management ///////////////
//////////////////////////////////////////////////
var fcnHandleMapChangeMovement = function() {
	if(keyMapMovement.w && keyMapMovement.s) {return;}
	if(keyMapMovement.a && keyMapMovement.d) {return;}
	
	if(keyMapMovement.w && !keyMapMovement.a && !keyMapMovement.d) { moveBase(maxSpeed, 0); return;}
	if(keyMapMovement.w && keyMapMovement.a && !keyMapMovement.d) { moveBase(maxSpeed, -maxSpeed); return;}
	if(keyMapMovement.w && !keyMapMovement.a && keyMapMovement.d) { moveBase(maxSpeed, maxSpeed); return;}
	
	if(keyMapMovement.s && !keyMapMovement.a && !keyMapMovement.d) { moveBase(-maxSpeed, 0); return;}
	if(keyMapMovement.s && keyMapMovement.a && !keyMapMovement.d) { moveBase(-maxSpeed, -maxSpeed); return;}
	if(keyMapMovement.s && !keyMapMovement.a && keyMapMovement.d) { moveBase(-maxSpeed, maxSpeed); return;}
	
	if(keyMapMovement.a) { moveBase(0, -maxSpeed); return;}
	if(keyMapMovement.d) { moveBase(0, maxSpeed); return;}
	
	if(!keyMapMovement.w && !keyMapMovement.a && !keyMapMovement.s && !keyMapMovement.d) { moveBase(0, 0); return;}
}

var fcnHandleMapChangeTurret = function() {
	console.log(keyMapTurret);
	if(keyMapTurret.i && keyMapTurret.k) {return;}	
	if(keyMapTurret.j && keyMapTurret.l) {return;}
	
	if(keyMapTurret.i && !keyMapTurret.j && !keyMapTurret.l) { moveTurret(c.MAX_PAN_RPM, 0); return;}
	if(keyMapTurret.i && keyMapTurret.j && !keyMapTurret.l) { moveTurret(c.MAX_PAN_RPM, -c.MAX_TILT_RPM); return;}
	if(keyMapTurret.i && !keyMapTurret.j && keyMapTurret.l) { moveTurret(c.MAX_PAN_RPM, c.MAX_TILT_RPM); return;}
	
	if(keyMapTurret.k && !keyMapTurret.j && !keyMapTurret.l) { moveTurret(-c.MAX_PAN_RPM, 0); return;}
	if(keyMapTurret.k && keyMapTurret.j && !keyMapTurret.l) { moveTurret(-c.MAX_PAN_RPM, -c.MAX_TILT_RPM); return;}
	if(keyMapTurret.k && !keyMapTurret.j && keyMapTurret.l) { moveTurret(-c.MAX_PAN_RPM, c.MAX_TILT_RPM); return;}
	
	if(keyMapTurret.j) { moveTurret(0, -c.MAX_TILT_RPM); return;}
	if(keyMapTurret.l) { moveTurret(0, c.MAX_TILT_RPM); return;}
	
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
    var leftJoystickOptions = {
        zone: document.getElementById('nerfbot_left_joystick_container'),
		mode: "static",
		position: {bottom: 150, left : 150},
		color: "white",
		size: 200
    };
    var leftJoystick = nipplejs.create(leftJoystickOptions);

	leftJoystick.get(0).on("move", function(evt, data) {
		var speed = data.distance;
		var speedX = speed*Math.sin(data.angle.radian);
		var speedY = speed*Math.cos(data.angle.radian);
		
		//avoid moving immediately
		speedX = remapBaseSpeed(readjustSpeed(speedX));
		speedY = remapBaseSpeed(readjustSpeed(speedY));
		
		moveBase(speedX,speedY);
	});
	
	leftJoystick.get(0).on("end", function(evt) {
		moveBase(0,0);
	});
	
	var rightJoystickOptions = {
        zone: document.getElementById('nerfbot_right_joystick_container'),
		mode: "static",
		position: {bottom: 150, right : 150},
		color: "white",
		size: 200
		//lockX: true
    };
    var rightJoystick = nipplejs.create(rightJoystickOptions);

	rightJoystick.get(1).on("move", function(evt, data) {
		var rpm = data.distance;
		var rpmX = rpm*Math.sin(data.angle.radian);
		var rpmY = rpm*Math.cos(data.angle.radian);
		console.log(rpmX, rpmY);
		rpmX = Math.round(c.MAX_PAN_RPM/5.0*Math.exp(-3+Math.abs((rpmX/18.0))));
		rpmY = Math.round(c.MAX_TILT_RPM/5.0*Math.exp(-3+Math.abs((rpmY/18.0))));
		
		moveTurret(rpmX, rpmY);
	});
	
	rightJoystick.get(1).on("end", function(evt) {
		moveTurret(0, 0);
	});	


	var magazine = new Magazine("#magazine", 12);
	magazine.refresh();
	
	$('#shoot-btn').on('click', function() {
		shoot(1);
		magazine.dartUsed();
	});

	$('#reload-btn').on('click', function() {
		magazine.reload();
	});

	$('#calibrate-btn-start').on('click', function() {
		calibrateStart();
	});

	$('#calibrate-btn-finish').on('click', function() {
		calibrateFinish();
	});	

	$('#close-settings').on('click', function() {
		$('#settings').hide();
	});	
	
	$('#show-settings').on('click', function() {
		$('#settings').show();
	});		

});



