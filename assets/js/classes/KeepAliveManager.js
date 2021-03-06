const c = require('../constants');


module.exports = class KeepAliveManager {
    constructor(driveManager) {
        console.log("KeepAliveManager::constructor");
        this.driveManager = driveManager;
        this.handle = setTimeout(this.onTimeout, c.TIMEOUT_MS);
    }

    onTimeout() {
        console.log("KeepAliveManager::onTimeout");
        if(this.driveManager) {
            this.driveManager.stop();
        }
        else {
            console.log("!!!");
        }
    }

    refresh() {
        clearTimeout(this.handle);
        this.handle = setTimeout(this.onTimeout, c.TIMEOUT_MS);
    }
}