const c = require('../constants');
const WebSocket = require('ws');

module.exports = class StepperMotorWrapper {
    constructor(port) {
        this.ws = new WebSocket("ws://localhost:" + port);
    }

    setSpeed(speed) {
        var object = {type:c.MSG_SET_SPEED, speed:speed};
        this.ws.send(JSON.stringify(object));
    }

    setDirection(direction) {
        var object = {type:c.MSG_SET_DIRECTION, direction:direction};
        this.ws.send(JSON.stringify(object));
    }

    rotate() {
        var object = {type:c.MSG_ROTATE};
        this.ws.send(JSON.stringify(object));
    }
}