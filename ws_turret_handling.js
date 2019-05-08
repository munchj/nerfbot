const c = require('./assets/js/constants');
const settings = require('./assets/js/settings');
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 1339 });
const ArduinoWrapper = require('./assets/js/classes/ArduinoWrapper');

var arduinoWrapper = new ArduinoWrapper('COM6');




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
          arduinoWrapper.shoot();
        }
        else if(messageObject.type == c.MSG_CALIBRATE) {
          arduinoWrapper.calibrate();
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
