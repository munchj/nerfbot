const c = require('../constants');
var pigpioOK = false;
var Gpio;
try {
    Gpio = require('pigpio').Gpio;
    pigpioOK = true;
}
catch(e) {
    console.log("!!! pigpio not enabled !!!");
}

module.exports = class StepperMotor {
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

        this.relativeSteps = 0;

        this.forwardSwitch = 0;
        this.backwardsSwitch = 0;

        this.enableSwitches = true;
    }

    setDirection(direction) {
        //console.log(this.name + " setDirection " + direction);
        if(pigpioOK) {
            this.gpio.dir.digitalWrite(direction==c.FORWARD?1:0);
        }
        this.currentDirection = direction;

    }

    setSpeed(speed) {
        //console.log(this.name + " setSpeed " + speed);
        this.currentSpeed = speed;
    }

    setForwardSwitch(n) {
        this.forwardSwitch = n;
    }

    setBackwardsSwitch(n) {
        this.backwardsSwitch = n;
    }

    isForwardSwitchTriggered() {
        let b = this.currentDirection == c.FORWARD && this.relativeSteps >= this.forwardSwitch;
        //console.log("isForwardSwitchTriggered " + b);
        return b;
    }

    isBackwardsSwitchTriggered() {
        let b = this.currentDirection == c.BACKWARDS && this.relativeSteps <= this.backwardsSwitch;
        //console.log("isBackwardsSwitchTriggered " + b);
        return b;
    }

    step(microseconds) {
        if(this.enableSwitches) {
            if(this.isForwardSwitchTriggered()) {
                this.setSpeed(0);
                //console.log("upper switch, no step [" + this.relativeSteps + "]");
                return;
            }
            else if(this.isBackwardsSwitchTriggered())
            {
                this.setSpeed(0);
                //console.log("lower switch, no step [" + this.relativeSteps + "]");
                return;
            }
        }

        if(pigpioOK) {
            this.gpio.step.trigger(microseconds, 1);
        }
        

        if(this.currentDirection == c.FORWARD) {
            this.relativeSteps++;
        }
        else {
            this.relativeSteps--;
        }
        

        //console.log("step [" + this.relativeSteps + "]")
    }

    multiStep(microseconds, n, repeat) {
        for(let i=0;i<n&&repeat();i++) {
            this.step(microseconds);
        }
    
        if(repeat()) {
            const that = this;
            setTimeout(function() {that.multiStep(microseconds, n, repeat)}, 0);
        }
    }
    

    //keeps rotating until speed is set to 0
    rotate() {
        var stepper = this;
        var rpt = function() {
            if(stepper.isBackwardsSwitchTriggered() || stepper.isForwardSwitchTriggered()) {
                return false;
            }
            return stepper.currentSpeed > 0;
        }
        this.multiStep(38, 100, rpt);
    }
}
