const c = require('../constants');
const {SerialPort} = require('serialport');


module.exports = class ArduinoWrapper {
    constructor(port) {
        this.serial = new SerialPort({path: port, baudRate: 115200});
        var serial = this.serial;
        this.serialBuffer = "";
        this.lastObject = {
  
        }
        
        this.serial.on("open", function() {
            console.log('[ESP32] connected');
            var serialBuffer = "";
            serial.on('data', function(data) {
                serialBuffer = "" + serialBuffer + data;
                if(serialBuffer.includes("\r\n")) {
                    for(var buf of serialBuffer.split("\r\n")) {
                        if(buf) {
                            console.log('[ESP32] ' + buf);
                        }
                        
                    }
                    
                    serialBuffer = "";
                }
                
            });
        });
    }

    sendMessage(object) {
        this.serial.write(JSON.stringify(object), function(err) {
            if(err) {return console.log("[ESP32] error on write: ", err.message);}
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

    goToPosition(speedX, positionX, speedY, positionY) {
        let obj = {
            type : c.ARDUINO.MSG_GOTO_POSITION,
            speedX : speedX,
            positionX : positionX,
            speedY : speedY,
            positionY : positionY
        };
        if(JSON.stringify(this.lastObject) != JSON.stringify(obj)) {
            console.log(obj);
            this.sendMessage(obj);
            this.lastObject = obj;
        }
    }

    goToAngle(speedX, angleX, speedY, angleY) {
        let obj = {
            type : c.ARDUINO.MSG_GOTO_ANGLE,
            speedX : speedX,
            angleX : angleX,
            speedY : speedY,
            angleY : angleY
        };
        if(JSON.stringify(this.lastObject) != JSON.stringify(obj)) {
            console.log(obj);
            this.sendMessage(obj);
            this.lastObject = obj;
        }
    }  
    
    movePosition(directionX, speedX, positionX, directionY, speedY, positionY) {
        let obj = {
            type : c.ARDUINO.MSG_MOVE_POSITION,
            directionX: directionX,
            speedX : speedX,
            positionX : positionX,
            directionY : directionY,
            speedY : speedY,
            positionY : positionY
        };
        if(JSON.stringify(this.lastObject) != JSON.stringify(obj)) {
            console.log(obj);
            this.sendMessage(obj);
            this.lastObject = obj;
        }
    }   
    
    moveAngle(directionX, speedX, angleX, directionY, speedY, angleY) {
        let obj = {
            type : c.ARDUINO.MSG_MOVE_ANGLE,
            directionX: "" + directionX,
            speedX : "" + speedX,
            angleX : "" + angleX,
            directionY : "" + directionY,
            speedY : "" + speedY,
            angleY : "" + angleY
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
            speedX: speed
        };
        console.log(obj)
        this.sendMessage(obj);
    }

    calibrateStart() {
        let obj = {
            type: c.ARDUINO.MSG_CALIBRATE_START
        };
        console.log(obj)
        this.sendMessage(obj);
    }

    calibrateFinish() {
        let obj = {
            type: c.ARDUINO.MSG_CALIBRATE_FINISH
        };
        console.log(obj)
        this.sendMessage(obj);
    }    
}