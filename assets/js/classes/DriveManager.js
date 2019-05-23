const c = require('../constants');

module.exports = class DriveManager {
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
                    motor.setDirection(this.angularSpeed > 0 ? c.FORWARD : c.BACKWARDS);
                }
                else {  //RIGHT 
                    motor.setDirection(this.angularSpeed > 0 ? c.BACKWARDS : c.FORWARD);
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

        if(!(this.linearSpeed == 0 && this.angularSpeed == 0)) {
            console.log("-------------");
            console.log(this.motors[c.MOTOR_FL].currentSpeed + " " + this.motors[c.MOTOR_FL].printDirection() + "    " +  this.motors[c.MOTOR_FR].printDirection() + " " + this.motors[c.MOTOR_FR].currentSpeed);
            console.log(this.motors[c.MOTOR_BL].currentSpeed + " " + this.motors[c.MOTOR_BL].printDirection() + "    " +  this.motors[c.MOTOR_BR].printDirection() + " " + this.motors[c.MOTOR_BR].currentSpeed);
            console.log("-------------");
        }

    }

    testSequence() {
        setTimeout(function() {
            console.log("FRONT LEFT FORWARD")
            this.motors[c.MOTOR_FL].setSpeed(200);
            this.motors[c.MOTOR_FL].setDirection(c.FORWARD);
            setTimeout(function() {
                console.log("FRONT LEFT BACKWARDS")
                this.motors[c.MOTOR_FL].setSpeed(200);
                this.motors[c.MOTOR_FL].setDirection(c.BACKWARDS);
                setTimeout(function() {
                    console.log("FRONT RIGHT FORWARD")
                    this.motors[c.MOTOR_FR].setSpeed(200);
                    this.motors[c.MOTOR_FR].setDirection(c.FORWARD);
                    setTimeout(function() {
                        console.log("FRONT RIGHT BACKWARDS")
                        this.motors[c.MOTOR_FR].setSpeed(200);
                        this.motors[c.MOTOR_FR].setDirection(c.BACKWARDS);
                        setTimeout(function() {
                            console.log("BACK LEFT FORWARD")
                            this.motors[c.MOTOR_BL].setSpeed(200);
                            this.motors[c.MOTOR_BL].setDirection(c.FORWARD);
                            setTimeout(function() {
                                console.log("BACK LEFT BACKWARDS")
                                this.motors[c.MOTOR_BL].setSpeed(200);
                                this.motors[c.MOTOR_BL].setDirection(c.BACKWARDS);
                                setTimeout(function() {
                                    console.log("BACK RIGHT FORWARD")
                                    this.motors[c.MOTOR_BR].setSpeed(200);
                                    this.motors[c.MOTOR_BR].setDirection(c.FORWARD);
                                    setTimeout(function() {
                                        console.log("BACK RIGHT BACKWARDS")
                                        this.motors[c.MOTOR_BR].setSpeed(200);
                                        this.motors[c.MOTOR_BR].setDirection(c.BACKWARDS);
                                    }, 1000);
                                }, 1000);
                            }, 1000);
                        }, 1000);
                    }, 1000);
                }, 1000);
            }, 1000);
        }, 1000);
    }
}