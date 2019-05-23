const c = require('../constants');
var pigpioOK = false;
var Gpio;
try {
    Gpio = require('pigpio').Gpio;
    pigpioOK = true;
}
catch(e) {
    console.log("WARN [Motor.js] pigpio not available");
    console.log(e);
}


module.exports = class Motor {
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
                this.gpio.direction_01.pwmWrite(c.LOW);
                this.gpio.direction_02.pwmWrite(c.HIGH);
            }
            else { //BACKWARDS 
                this.gpio.direction_01.pwmWrite(c.HIGH);
                this.gpio.direction_02.pwmWrite(c.LOW);
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
        return this.currentDirection==c.FORWARD?"↑":"↓";
    }
}