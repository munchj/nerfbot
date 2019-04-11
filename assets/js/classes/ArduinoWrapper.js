const c = require('../constants');
const SerialPort = require('serialport');

module.exports = class ArduinoWrapper {
    constructor(port) {
        this.serial = new SerialPort('COM5', {baudRate: 115200});
        var serial = this.serial;
        this.lastObject = {
  
        }
        
        this.serial.on("open", function() {
            console.log('[Arduino] connected');
            serial.on('data', function(data) {
                console.log('[Arduino] ' + data);
            });
        });
    }

    sendMessage(object) {
        this.serial.write(JSON.stringify(object), function(err) {
            if(err) {return console.log("[Arduino] error on write: ", err.message);}
         });
    }


    rotate(speedX, directionX, speedY, directionY) {
        let obj = {
            type : c.ARDUINO.MSG_ROTATE,
            speedX : speedX,
            directionX : directionX,
            speedY : speedY,
            directionY : directionY
        };
        if(JSON.stringify(this.lastObject) != JSON.stringify(obj)) {
            this.sendMessage(obj);
            this.lastObject = obj;
        }
       
    }
}