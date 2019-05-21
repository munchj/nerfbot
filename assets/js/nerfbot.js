const $ = require("jquery");
global.jQuery = $;
const c = require('./constants');
const settings = require('./settings');
import nipplejs from 'nipplejs';
const {Gauge} = require('gaugeJS');
const Magazine = require('./classes/Magazine');




var keyMapMovement = {mv_forward:false, mv_left:false, mv_backwards:false, mv_right:false};
var keyMapTurret = {mv_up:false, mv_down:false, mv_left:false, mv_right:false};
var keyMapShooting = {shoot:false};
var baseUpdateMap = {'speedX':0, 'speedY': 0};
var turretUpdateMap = {'speedX':0, 'speedY': 0};

var currentPower = c.FLYWHEEL_MIN_SPEED;

var gaugeOpts = {
  angle: 0, /// The span of the gauge arc
  lineWidth: 0.54, // The line thickness
  pointer: {
    length: 0.9, // Relative to gauge radius
    strokeWidth: 0.035 // The thickness
  },
  colorStart: '#FFFFFF',   
  colorStop: '#DDDDDD',    
  strokeColor: '#888888'   
};

var gauge;
$(document).ready(function () {
	var gaugeCanvas = document.getElementById("speedGauge");
	console.log(gaugeCanvas);
	if(gaugeCanvas) {
		gauge = new Gauge(gaugeCanvas).setOptions(gaugeOpts);
		gauge.animationSpeed = 10;
		gauge.maxValue = c.MAX_CAR_SPEED;
		gauge.setMinValue(c.MIN_CAR_SPEED);
		gauge.set(0);
	}
});




///////////////////////////////////////////////
////////////// websocket client  //////////////
///////////////////////////////////////////////
var nerfbotBaseServer = new WebSocket(settings.ws_base_handling);
var nerfbotTurretServer = new WebSocket(settings.ws_turret_handling);

window.nerfbotBaseServer = nerfbotBaseServer;
window.nerfbotTurretServer = nerfbotTurretServer;


var magazine = new Magazine("#magazine", 12);


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

var lastTurretObj;
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

	//prevent sending a move 0 after clicking on video to move
	if(JSON.stringify(lastTurretObj) != JSON.stringify(turretObj)) {
		sendCommandToTurret(JSON.stringify(turretObj));
		lastTurretObj = turretObj;
	}

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

function turretGoToPosition(positionX, positionY, speedX, speedY) {
	//console.log("turretGoToPosition", positionX, positionY, speedX, speedY);
	var obj = {
		type: c.MSG_TURRET_GOTO_POSITION,
		positionX: positionX,
		positionY: positionY,
		speedX: speedX,
		speedY: speedY
	}
	sendCommandToTurret(JSON.stringify(obj));
}

window.turretGoToPosition = turretGoToPosition;

function turretGoToAngle(angleX, angleY, speedX, speedY) {
	//console.log("turretGoToAngle", angleX, angleY, speedX, speedY);
	var obj = {
		type: c.MSG_TURRET_GOTO_ANGLE,
		angleX: angleX,
		angleY: angleY,
		speedX: speedX,
		speedY: speedY
	}
	sendCommandToTurret(JSON.stringify(obj));
}

function turretMovePosition(directionX, directionY, positionX, positionY, speedX, speedY) {
	//console.log("turretMovePosition", directionX, directionY, positionX, positionY, speedX, speedY);
	var obj = {
		type: c.MSG_TURRET_MOVE_POSITION,
		directionX: directionX,
		directionY: directionY,
		positionX: positionX,
		positionY: positionY,
		speedX: speedX,
		speedY: speedY
	}
	sendCommandToTurret(JSON.stringify(obj));
}

function turretMoveAngle(directionX, directionY, angleX, angleY, speedX, speedY) {
	console.log("turretMoveAngle", directionX, directionY, angleX, angleY, speedX, speedY);
	var obj = {
		type: c.MSG_TURRET_MOVE_ANGLE,
		directionX: directionX,
		directionY: directionY,
		angleX: angleX,
		angleY: angleY,
		speedX: speedX,
		speedY: speedY
	}
	sendCommandToTurret(JSON.stringify(obj));
}

window.turretMoveAngle = turretMoveAngle;

function shoot(speed)
{
	//console.log("shoot")
	var obj = {
		type: c.MSG_SHOOT,
		speed: speed
	}
	
	sendCommandToTurret(JSON.stringify(obj));
}

function calibrateStart()
{
	//console.log("calibrate start")
	var obj = {
		type: c.MSG_CALIBRATE_START
	}
	
	sendCommandToTurret(JSON.stringify(obj));
}


function calibrateFinish()
{
	//console.log("calibrate finish")
	var obj = {
		type: c.MSG_CALIBRATE_FINISH
	}
	
	sendCommandToTurret(JSON.stringify(obj));
}

//////////////////////////////////////////////////
////////////// keyboard management ///////////////
//////////////////////////////////////////////////
var fcnHandleMapChangeMovement = function() {
	if(keyMapMovement.mv_forward && keyMapMovement.mv_backwards) {return;}
	if(keyMapMovement.mv_left && keyMapMovement.mv_right) {return;}
	
	if(keyMapMovement.mv_forward && !keyMapMovement.mv_left && !keyMapMovement.mv_right) { moveBase(c.MAX_CAR_SPEED, 0); return;}
	if(keyMapMovement.mv_forward && keyMapMovement.mv_left && !keyMapMovement.mv_right) { moveBase(c.MAX_CAR_SPEED, -c.MAX_CAR_SPEED); return;}
	if(keyMapMovement.mv_forward && !keyMapMovement.mv_left && keyMapMovement.mv_right) { moveBase(c.MAX_CAR_SPEED, c.MAX_CAR_SPEED); return;}
	
	if(keyMapMovement.mv_backwards && !keyMapMovement.mv_left && !keyMapMovement.mv_right) { moveBase(-c.MAX_CAR_SPEED, 0); return;}
	if(keyMapMovement.mv_backwards && keyMapMovement.mv_left && !keyMapMovement.mv_right) { moveBase(-c.MAX_CAR_SPEED, -c.MAX_CAR_SPEED); return;}
	if(keyMapMovement.mv_backwards && !keyMapMovement.mv_left && keyMapMovement.mv_right) { moveBase(-c.MAX_CAR_SPEED, c.MAX_CAR_SPEED); return;}
	
	if(keyMapMovement.mv_left) { moveBase(0, -c.MAX_CAR_SPEED); return;}
	if(keyMapMovement.mv_right) { moveBase(0, c.MAX_CAR_SPEED); return;}
	
	if(!keyMapMovement.mv_forward && !keyMapMovement.mv_left && !keyMapMovement.mv_backwards && !keyMapMovement.mv_right) { moveBase(0, 0); return;}
}

var fcnHandleMapChangeTurret = function() {
	//console.log(keyMapTurret);
	if(keyMapTurret.mv_up && keyMapTurret.mv_down) {return;}	
	if(keyMapTurret.mv_left && keyMapTurret.mv_right) {return;}
	
	if(keyMapTurret.mv_up && !keyMapTurret.mv_left && !keyMapTurret.mv_right) { moveTurret(0, c.MAX_PAN_RPM); return;}
	if(keyMapTurret.mv_up && keyMapTurret.mv_left && !keyMapTurret.mv_right) { moveTurret( -c.MAX_TILT_RPM, c.MAX_PAN_RPM); return;}
	if(keyMapTurret.mv_up && !keyMapTurret.mv_left && keyMapTurret.mv_right) { moveTurret(c.MAX_TILT_RPM, c.MAX_PAN_RPM); return;}
	
	if(keyMapTurret.mv_down && !keyMapTurret.mv_left && !keyMapTurret.mv_right) { moveTurret(0, -c.MAX_PAN_RPM); return;}
	if(keyMapTurret.mv_down && keyMapTurret.mv_left && !keyMapTurret.mv_right) { moveTurret( -c.MAX_TILT_RPM, -c.MAX_PAN_RPM); return;}
	if(keyMapTurret.mv_down && !keyMapTurret.mv_left && keyMapTurret.mv_right) { moveTurret(c.MAX_TILT_RPM, -c.MAX_PAN_RPM); return;}
	
	if(keyMapTurret.mv_left) { moveTurret(-c.MAX_TILT_RPM, 0); return;}
	if(keyMapTurret.mv_right) { moveTurret( c.MAX_TILT_RPM, 0); return;}
	
	if(!keyMapTurret.mv_up && !keyMapTurret.mv_left && !keyMapTurret.mv_down && !keyMapTurret.mv_right) { moveTurret(0, 0); return;}
}

var fcnHandleMapChangeShooting = function() {
	if(keyMapShooting.space) {
		shoot(currentPower);
		magazine.dartUsed();
	}

}

$(document).keyup(function(event) {
	var oldMapMovement = JSON.stringify(keyMapMovement);
	var oldMapVertical = JSON.stringify(keyMapTurret);
	var oldMapShooting = JSON.stringify(keyMapShooting);
	switch(event.key) {
		case 'w': keyMapMovement.mv_forward = false; break;
		case 'a': keyMapMovement.mv_left = false; break;
		case 's': keyMapMovement.mv_backwards = false; break;
		case 'd': keyMapMovement.mv_right = false; break;
		case 'i': keyMapTurret.mv_up = false; break;
		case 'j': keyMapTurret.mv_left = false; break;
		case 'k': keyMapTurret.mv_down = false; break;
		case 'l': keyMapTurret.mv_right = false; break;
		case ' ': keyMapShooting.shoot = false; break;
		
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
		case 'w': keyMapMovement.mv_forward = true; break;
		case 'a': keyMapMovement.mv_left = true; break;	
		case 's': keyMapMovement.mv_backwards = true; break;	
		case 'd': keyMapMovement.mv_right = true; break;	
		case 'i': keyMapTurret.mv_up = true; break;	
		case 'j': keyMapTurret.mv_left = true; break;	
		case 'k': keyMapTurret.mv_down = true; break;	
		case 'l': keyMapTurret.mv_right = true; break;	
		case ' ': keyMapShooting.shoot = true; break;
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

		var directionX = speedX > 0?1:-1;
		var directionY = speedY > 0?1:-1;
		
		speedX =  Math.round((c.MAX_CAR_SPEED-c.MIN_CAR_SPEED)*Math.pow(Math.abs(speedX/100), 10));
		speedY =  Math.round((c.MAX_CAR_SPEED-c.MIN_CAR_SPEED)*Math.pow(Math.abs(speedY/100), 10));
		
		if(speedX>0) speedX += c.MIN_CAR_SPEED;
		if(speedY>0) speedY += c.MIN_CAR_SPEED;

		if(speedX>speedY) {
			speedY = 0;
			gauge.options.colorStop = '#9fc2fc';

		} else {
			gauge.options.colorStop = '#fcd29f';
			speedX = 0;
		}
		
		gauge.set(Math.max(speedX, speedY));
		//avoid moving immediately


		//speedX = remapBaseSpeed(readjustSpeed(speedX));
		//speedY = remapBaseSpeed(readjustSpeed(speedY));
		
		moveBase(directionX * speedX, directionY * speedY);
	});
	
	leftJoystick.get(0).on("end", function(evt) {
		gauge.set(0);
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
		var rpmX = rpm*Math.cos(data.angle.radian);
		var rpmY = rpm*Math.sin(data.angle.radian);
		//console.log(rpmX, rpmY);
		//rpmX = (rpmX>0?1:-1)*Math.round(c.MAX_PAN_RPM/5.0*Math.exp(-3+Math.abs((rpmX/18.0))));
		//rpmY = (rpmY>0?1:-1)*Math.round(c.MAX_TILT_RPM/5.0*Math.exp(-3+Math.abs((rpmY/18.0))));
		rpmX = (rpmX>0?1:-1)*Math.round(c.MAX_PAN_RPM*Math.pow(Math.abs(rpmX/100), 4));
		rpmY = (rpmY>0?1:-1)*Math.round(c.MAX_TILT_RPM*Math.pow(Math.abs(rpmY/100), 4));
		
		moveTurret(rpmX, rpmY);
	});
	
	rightJoystick.get(1).on("end", function(evt) {
		moveTurret(0, 0);
	});	

	magazine.refresh();

	
	$('#shoot-btn').on('click', function() {
		shoot(currentPower);
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



	$("#power-slider").attr({"min": c.FLYWHEEL_MIN_SPEED, "max": c.FLYWHEEL_MAX_SPEED});
	$("#power-slider").val(c.FLYWHEEL_MIN_SPEED);
	$("#power-slider").on("change", function(val) {
		currentPower = $("#power-slider").val();
	});


	$("#stream_02_overlay").on("click", function(e) {
		var offset = this.getClientRects()[0];
		var clickPosX = e.clientX - offset.left - this.clientWidth/2;
		var clickPosY = e.clientY - offset.top - this.clientHeight/2;
		
		var fovX = 32.8;
		var fovY = 43.5;

		var angleX = fovX / this.clientWidth * clickPosX;
		var angleY = -fovY / this.clientHeight * clickPosY;

		var speedX = 6;
		var speedY = 12;

		turretMoveAngle(angleX>=0?c.RIGHT:c.LEFT, angleY>=0?c.UP:c.DOWN, Math.abs(angleX), Math.abs(angleY), speedX, speedY);
	});		


});



