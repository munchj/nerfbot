const c = require('./assets/js/constants');

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


const wss = new WebSocket.Server({ port: 1337 });

class Motor {
    constructor(name, positionX, positionY, speedPin, directionPin_01, directionPin_02) {
        console.log("Motor::constructor", name, positionX, positionY, speedPin, directionPin_01, directionPin_02);
        this.name = name;
        this.position = {x: positionX, y: positionY};
        
        this.pins = {};
        this.pins.speedPin = speedPin;
        this.pins.direction_01 = directionPin_01;
        this.pins.direction_02 = directionPin_02;

        if(pigpioOK) {
            this.gpio = {};
            this.gpio.speed = new Gpio(this.pins.speedPin, {mode: Gpio.OUTPUT});
            this.gpio.direction_01 = new Gpio(this.pins.direction_01, {mode: Gpio.OUTPUT});
            this.gpio.direction_02 = new Gpio(this.pins.direction_02, {mode: Gpio.OUTPUT});
        }

        this.currentSpeed = 0;
        this.currentDirection = 0
    }

    setDirection(direction) {
        this.currentDirection = direction;
        //console.log("Motor::",this.name, "::setDirection::", direction);
        if(pigpioOK) {
            if(direction == c.FORWARD) {
                this.gpio.direction_01.pwmWrite(c.HIGH);
                this.gpio.direction_02.pwmWrite(c.LOW);
            }
            else { //BACKWARDS 
                this.gpio.direction_01.pwmWrite(c.LOW);
                this.gpio.direction_02.pwmWrite(c.HIGH);
            }
        }
    }

    setSpeed(speed) {
        speed = Math.floor(speed);
        this.currentSpeed = speed;
        //if(speed != 0) {
        //    console.log("Motor::",this.name, "::setSpeed::", speed);
        //}

        if(pigpioOK) {
            this.gpio.speed.pwmWrite(speed);
        }
    }

    printDirection() {
        return this.direction==c.FORWARD?"↑":"↓";
    }
}

class KeepAliveManager {
    constructor(driveManager) {
        console.log("KeepAliveManager::constructor");
        this.handle = setTimeout(this.onTimeout, c.TIMEOUT_MS);
    }

    onTimeout() {
        console.log("KeepAliveManager::onTimeout");
        driveManager.stop();
    }

    refresh() {
        clearTimeout(this.handle);
        this.handle = setTimeout(this.onTimeout, c.TIMEOUT_MS);
    }
}

class DriveManager {
    constructor(motorFL, motorFR, motorBL, motorBR) {
        console.log("DriveManager::constructor");
        this.linearSpeed = 0;
        this.angularSpeed = 0;
        this.turnStrength = 0.3; // [0 - 1]
        this.motors = {};
        this.motors[c.MOTOR_FL] = motorFL;
        this.motors[c.MOTOR_FR] = motorFR;
        this.motors[c.MOTOR_BL] = motorBL;
        this.motors[c.MOTOR_BR] = motorBR;
    }

    stop() {
        console.log("DriveManager::stop");
        this.linearSpeed = 0;
        this.angularSpeed = 0;
        this.updateMotors(); 
    }

    updateMotors() {
        //console.log("DriveManager::updateMotors", this.linearSpeed, this.angularSpeed);
        if(this.linearSpeed == 0 && this.angularSpeed == 0) {
            //shut down all the motors
            for(let motor of Object.values(this.motors)) {
                motor.setSpeed(0);
                motor.setDirection(c.FORWARD);
            }
        }
        else if(this.angularSpeed == 0) {
            //forward or backwards, no turning
            var speed = Math.abs(this.linearSpeed);
            for(let motor of Object.values(this.motors)) {
                motor.setSpeed(speed);
                motor.setDirection(this.linearSpeed > 0 ? c.FORWARD : c.BACKWARDS);
            }
        }
        else if(this.linearSpeed == 0) {
            //in place rotation, reverse direction of left and right set of wheels
            var speed = Math.abs(this.angularSpeed);
            for(let motor of Object.values(this.motors)) {
                motor.setSpeed(speed);
                if(motor.position.y == c.LEFT) {
                    motor.setDirection(this.angularSpeed > 0 ? c.BACKWARDS : c.FORWARD);
                }
                else {  //RIGHT 
                    motor.setDirection(this.angularSpeed > 0 ? c.FORWARD : c.BACKWARDS);
                }
            }
        }
        else { //combination of linear and angular speed, compute a differential speed between left wheels train and right wheels train
            var speed = Math.abs(this.linearSpeed);
            var directionX = this.linearSpeed > 0 ? c.FORWARD : c.BACKWARDS;
            var nDirectionX = this.linearSpeed > 0 ? c.BACKWARDS : c.FORWARD;
            var directionY = this.angularSpeed > 0 ? c.RIGHT : c.LEFT;
            var speedDifference = speed * Math.abs(this.angularSpeed) / c.HIGH * this.turnStrength;

            for(let motor of Object.values(this.motors)) {
                let lDirection = motor.position.y == directionY ? directionX:nDirectionX;
                let lSpeed = motor.position.y == directionY ? (speedDifference) : speed;
                motor.setDirection(lDirection);
                motor.setSpeed(lSpeed);

            }

            
        }

        if(this.linearSpeed != 0) {
            console.log("-------------");
            console.log(this.motors[c.MOTOR_FL].currentSpeed + " " + this.motors[c.MOTOR_FL].printDirection() + "    " + + this.motors[c.MOTOR_FR].printDirection() + " " + this.motors[c.MOTOR_FR].currentSpeed);
            console.log(this.motors[c.MOTOR_BL].currentSpeed + " " + this.motors[c.MOTOR_BL].printDirection() + "    " + + this.motors[c.MOTOR_BR].printDirection() + " " + this.motors[c.MOTOR_BL].currentSpeed);
            console.log("-------------");
        }

    }
}




const motorFL = new Motor(c.MOTOR_FL, c.FRONT, c.LEFT, 2, 27, 22);
const motorFR = new Motor(c.MOTOR_FR, c.FRONT, c.RIGHT, 3, 10, 9);
const motorBL = new Motor(c.MOTOR_BL, c.BACK, c.LEFT, 4, 14, 15);
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
