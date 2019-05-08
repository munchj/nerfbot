const c = require('../constants');
const SerialPort = require('serialport');


module.exports = class ArduinoWrapper {
    constructor(port) {
        this.serial = new SerialPort(port, {baudRate: 115200});
        var serial = this.serial;
        this.serialBuffer = "";
        this.lastObject = {
  
        }
        
        this.serial.on("open", function() {
            console.log('[Arduino] connected');
            var serialBuffer = "";
            serial.on('data', function(data) {
                serialBuffer = "" + serialBuffer + data;
                if(serialBuffer.includes("\r\n")) {
                    for(var buf of serialBuffer.split("\r\n")) {
                        if(buf) {
                            console.log('[Arduino] ' + buf);
                        }
                        
                    }
                    
                    serialBuffer = "";
                }
                
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
            console.log(obj);
            this.sendMessage(obj);
            this.lastObject = obj;
        }
       
    }

    shoot(speed) {
        let obj = {
            type: c.ARDUINO.MSG_SHOOT,
            speedX: c.FLYWHEEL_SPEED
        };
        console.log(obj)
        this.sendMessage(obj);
    }

    calibrate() {
        let obj = {
            type: c.ARDUINO.MSG_CALIBRATE
        };
        console.log(obj)
        this.sendMessage(obj);
    }
}