
const c = require('./assets/js/constants');
const settings = require('./assets/js/settings');
const StepperMotor = require('./assets/js/classes/StepperMotor');

const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: settings.ws_tilt_stepper_port });


const stepperMotor = new StepperMotor("tilt", 17, 27, 22);
stepperMotor.setSpeed(1);
stepperMotor.setForwardSwitch(33333);
stepperMotor.setBackwardsSwitch(-1);

wss.on('connection', function connection(ws) {
    ws.on('message', function incoming(message) {
      //console.log('received: %s', message);

      try {
        var messageObject = JSON.parse(message);
        if(messageObject.type == c.MSG_ROTATE) {
           stepperMotor.rotate();
        }
        else if(messageObject.type == c.MSG_SET_SPEED) {
            stepperMotor.setSpeed(messageObject.speed);
         }
        else if(messageObject.type == c.MSG_SET_DIRECTION) {
            stepperMotor.setDirection(messageObject.direction);
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

  
