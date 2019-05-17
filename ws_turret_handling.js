const c = require('./assets/js/constants');
const settings = require('./assets/js/settings');
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 1339 });
const ArduinoWrapper = require('./assets/js/classes/ArduinoWrapper');

var arduinoWrapper = new ArduinoWrapper(settings.ttyPort);




wss.on('connection', function connection(ws) {
    ws.on('message', function incoming(message) {
      //console.log('received: %s', message);

      try {
        var messageObject = JSON.parse(message);


        if(messageObject.type == c.MSG_MOVE_TURRET) {
            //console.log(messageObject.type, messageObject.speedX, messageObject.speedY);
            //arduinoWrapper.setDirection();
            arduinoWrapper.rotate(Math.abs(messageObject.speedX), messageObject.speedX >= 0 ? c.ARDUINO.BACKWARDS :c.ARDUINO.FORWARD, Math.abs(messageObject.speedY), messageObject.speedY >= 0 ? c.ARDUINO.BACKWARDS :c.ARDUINO.FORWARD);
            //arduinoWrapper.rotate();
        }
        else if(messageObject.type == c.MSG_SHOOT) {
          arduinoWrapper.shoot(messageObject.speed);
        }
        else if(messageObject.type == c.MSG_CALIBRATE_START) {
          arduinoWrapper.calibrateStart();
        }
        else if(messageObject.type == c.MSG_CALIBRATE_FINISH) {
          arduinoWrapper.calibrateFinish();
        }     
        else if(messageObject.type == c.MSG_TURRET_MOVE_ANGLE) {
          let directionX = messageObject.directionX==c.LEFT?c.ARDUINO.FORWARD:c.ARDUINO.BACKWARDS;
          let directionY = messageObject.directionY==c.UP?c.ARDUINO.BACKWARDS:c.ARDUINO.FORWARD;

          arduinoWrapper.moveAngle(directionX, messageObject.speedX, messageObject.angleX, directionY, messageObject.speedY, messageObject.angleY);
        }  
        else if(messageObject.type == c.MSG_TURRET_GOTO_POSITION) {
          arduinoWrapper.goToPosition(messageObject.speedX, messageObject.positionX, messageObject.speedY, messageObject.positionY);
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
