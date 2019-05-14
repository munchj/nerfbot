module.exports = {
    ARDUINO : {
        FORWARD: 1,
        BACKWARDS: 0,
        MSG_ROTATE: 1,
        MSG_SHOOT : 2,
        MSG_CALIBRATE_START: 3,
        MSG_CALIBRATE_FINISH: 4,
        MSG_GOTO_POSITION: 5,
        MSG_GOTO_ANGLE: 6,
        MSG_MOVE_POSITION: 7,
        MSG_MOVE_ANGLE: 8,
        MSG_HOME: 9,        
    },
    MSG_PING : "ping",
    MSG_MOVE : "move",
    MSG_MOVE_TURRET : "move_turret",
    MSG_SHOOT : "shoot",
    MSG_CALIBRATE_START: "calibrate_start",
    MSG_CALIBRATE_FINISH: "calibrate_finish",
    MSG_TEST_MOTORS : "test_motors",
    MSG_TURRET_GOTO_POSITION : "goto_pos",
    MSG_TURRET_GOTO_ANGLE : "goto_angle",
    MSG_TURRET_MOVE_POSITION : "move_pos",
    MSG_TURRET_MOVE_ANGLE : "move_angle",


    MSG_ROTATE : "rotate",
    MSG_SET_SPEED: "set_speed",
    MSG_SET_DIRECTION: "set_direction",
    
    MOTOR_FL : "motor_fl",
    MOTOR_FR : "motor_fr",
    MOTOR_BL : "motor_bl",
    MOTOR_BR : "motor_br",
    
    FORWARD : "fw",
    BACKWARDS : "bw",
    
    FRONT : "front",
    BACK : "back",
    LEFT : "left",
    RIGHT : "right",
    UP: "up",
    DOWN: "down",
    
    HIGH : 255,
    LOW : 0,
    
    TIMEOUT_MS : 200,

    MAX_TILT_RPM : 80,
    MAX_PAN_RPM: 80,

    FLYWHEEL_MIN_SPEED: 18,
    FLYWHEEL_MAX_SPEED: 50,

    UPDATE_RATE: 20
};

    