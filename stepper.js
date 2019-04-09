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
        console.log(this.name + " setDirection " + direction);
        this.currentDirection = direction;

    }

    setSpeed(speed) {
        console.log(this.name + " setSpeed " + speed);
        this.currentSpeed = speed;
    }

    step(microseconds) {
        if(pingpioOK) {
            this.gpio.step.trigger(microseconds, 1);
        }
        console.log("step");
    }

    multiStep(microseconds, n, repeat) {
        console.log("multistep");
        for(let i=0;i<n;i++) {
            this.step(microseconds);
        }
        if(repeat()) {
            setTimeout(this.multiStep(microseconds, n, repeat), 0);
        }
    }
    

    //keeps rotating until speed is set to 0
    rotate() {
        console.log("rotate");
        var rpt = function() {
            return this.speed > 0;
        }
        this.multiStep(38, 100, rpt);
    }
}


var stepperWorker = new Worker(function() {
    console.log("worker create");
    var stepper = new StepperMotor("tilt", 17, 27, 22);
    stepper.setSpeed(10);
    

    this.onmessage = function(event) {
        console.log("worker.onmessage" + event);
        stepper.rotate();
       
    };
});


stepperWorker.postMessage("m_rotate");