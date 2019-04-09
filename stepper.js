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

const c = require('./assets/js/constants');
var Worker = require('webworker-threads').Worker;


class StepperMotor {
    constructor(name, stepPin, dirPin, enaPin) {
        this.name = name;
        this.pins = {};
        this.pins.step = stepPin;
        this.pins.dir = dirPin;
        this.pins.enable = enaPin;

        if(pigpioOK) {
            this.gpio = {};
            this.gpio.step = new Gpio(this.pins.step, {mode: Gpio.OUTPUT});
            this.gpio.dir = new Gpio(this.pins.dir, {mode: Gpio.OUTPUT});
            this.gpio.enable = new Gpio(this.pins.enable, {mode: Gpio.OUTPUT});
        }

        this.currentSpeed = 0;
        this.currentDirection = c.FORWARD;

        this.worker = null;
    }

    setDirection(direction) {
        console.log(nthis.name + " setDirection " + direction);
        this.currentDirection = direction;

    }

    setSpeed(speed) {
        console.log(nthis.name + " setsetSpeed " + speed);
        this.currentSpeed = speed;
    }

    step(microseconds) {
        if(pingpioOK) {
            this.gpio.step.trigger(microseconds, 1);
        }
        console.log("step");
    }

    multiStep(microseconds, n, repeat) {
        for(let i=0;i<n;i++) {
            this.step(microseconds);
        }
        if(repeat()) {
            setTimeout(this.multiStep(microseconds, n, repeat), 0);
        }
    }
    

    //keeps rotating until speed is set to 0
    rotate() {
        var myStepper = this;
        this.worker = new Worker(function() {
            var rpt = function() {
                return this.speed > 0;
            }
    
            this.onmessage = function(event) {
                console.log(event);
                self.close();
              };
              myStepper.multiStep(38, 100, rpt);
        });

    }
}



var stepper = new StepperMotor("tilt", 17, 27, 22);
stepper.setSpeed(10);
stepper.rotate();
