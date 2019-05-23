const c = require('./assets/js/constants');

const WebSocket = require('ws');

const Motor = require('./assets/js/classes/Motor');
const KeepAliveManager = require('./assets/js/classes/KeepAliveManager');
const DriveManager = require('./assets/js/classes/DriveManager');

const wss = new WebSocket.Server({ port: 1337 });


const motorFL = new Motor(c.MOTOR_FL, c.FRONT, c.LEFT, 2, 27, 22);
const motorFR = new Motor(c.MOTOR_FR, c.FRONT, c.RIGHT, 3, 10, 9);
const motorBL = new Motor(c.MOTOR_BL, c.BACK, c.LEFT, 4, 24, 25);
const motorBR = new Motor(c.MOTOR_BR, c.BACK, c.RIGHT, 17, 18, 23);
const driveManager = new DriveManager(motorFL, motorFR, motorBL, motorBR);
const keepAliveManager = new KeepAliveManager(driveManager);


wss.on('connection', function connection(ws) {
    ws.on('message', function incoming(message) {
      //console.log('received: %s', message);

      try {
        var messageObject = JSON.parse(message);
        if(messageObject.type == c.MSG_PING || messageObject.type == c.MSG_MOVE) {
            keepAliveManager.refresh();
        }

        if(messageObject.type == c.MSG_MOVE) {
            driveManager.linearSpeed = messageObject.linearSpeed;
            driveManager.angularSpeed = messageObject.angularSpeed;
            driveManager.updateMotors();
        }

        if(messageObject.type == c.MSG_TEST_MOTORS) {
            driveManager.testSequence();
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
