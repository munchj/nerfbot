const c = require('./assets/js/constants');
const settings = require('./assets/js/settings');
const StepperMotorWrapper = require('./assets/js/classes/StepperMotorWrapper');

const WebSocket = require('ws');

var pigpioOK = false;
var Gpio;
try {
    Gpio = require('pigpio').Gpio;
    pigpioOK = true;
}
catch(e) {
    console.log("!!! pigpio not enabled !!!");
    console.log(e);
}


const wss = new WebSocket.Server({ port: 1339 });

const tiltStepper = new StepperMotorWrapper(settings.ws_tilt_stepper_port);


wss.on('connection', function connection(ws) {
    ws.on('message', function incoming(message) {
      //console.log('received: %s', message);

      try {
        var messageObject = JSON.parse(message);


        if(messageObject.type == c.MSG_MOVE_TURRET) {
            console.log(messageObject.type, messageObject.speedX, messageObject.speedY);
            tiltStepper.setDirection(messageObject.speedX >= 0 ? c.FORWARD :c.BACKWARDS);
            tiltStepper.setSpeed( Math.abs(messageObject.speedX));
            tiltStepper.rotate();
        }
        ws.send("ok");
      }
      catch(e) {
        console.log('EXCEPTION', e); 
        ws.send("ko " + e);
      }

    });
  
    console.log("Client connected");
        ws.send('OK');
  });
