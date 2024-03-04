

import { CNV, gui, guiVariables } from "./script.js";
import { My_Object, create_object } from "./objects.js";
import { My_Button } from "./interface.js";
import { getRandom } from "./tools.js";


export const MOUSE = {"x": 0, "y": 0, "moved": false};

var key_map = {};


export function initialise_listener() {
    // click detection
    CNV.addEventListener('click', function(evt) {
        var mousePos = getMousePos(evt);
        execute_click(mousePos, My_Button.instances)
        if (guiVariables["generate_BAT"]) {
            create_object("enemy chasing", mousePos.x, mousePos.y, {"filename": "BAT"});
        }
        else if (guiVariables["generate_TURRET"]) {
            create_object("tower", mousePos.x, mousePos.y)
            return;
        }
        else if (guiVariables["generate_BONUS"]) {
            create_object("bonus", mousePos.x, mousePos.y)
            return;
        }
        else if (guiVariables["generate_ALLY_PROJ"]) {
            let vel = {"x": 1, "y": 1};
            if (getRandom(0, 1)) { vel.x *= -1; }
            if (getRandom(0, 1)) { vel.y *= -1; }
            create_object("projectile ally", mousePos.x, mousePos.y, {"vel": vel})
            return;
        }
        else if (guiVariables["generate_ENEMY_PROJ"]) {
            let vel = {"x": 1, "y": 1};
            if (getRandom(0, 1)) { vel.x *= -1; }
            if (getRandom(0, 1)) { vel.y *= -1; }
            create_object("projectile enemy", mousePos.x, mousePos.y, {"vel": vel})
            return;
        }
    }, false)

    // keys detection
    onkeydown = onkeyup = function(e){
        key_map[e.key] = e.type == 'keydown';
    }
    
    // mouve position
    CNV.onmousemove = (event) => {
        var mousePos = getMousePos(event);
        MOUSE.x = mousePos.x
        MOUSE.y = mousePos.y
        MOUSE.moved = true
      }
}





// Function to get the mouse position
function getMousePos(event) {
    if (!event) { return; }
    var rect = CNV.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
}


//check if a point is inside any button
//execute button action
function execute_click(pos, btns) {
    for (const btn of btns) {
        const inside = btn.is_inside(pos.x, pos.y);
        if (inside) {
            btn.action();
            return;
        }
    }
}




export function execute_inputs() {
    let rightPressed = false;
    let leftPressed = false;
    let downPressed = false;
    let upPressed = false;
    let rightPressed2 = false;
    let leftPressed2 = false;
    let downPressed2 = false;
    let upPressed2 = false;

    for (const key in key_map) {
        //touche non pressée
        if (!key_map[key]) { continue; }

        //touche pressée
        switch (key) {
            case "z":
                upPressed = true;
                break;
            case "q":
                leftPressed = true;
                break;
            case "s":
                downPressed = true;
                break;
            case "d":
                rightPressed = true;
                break;
            case "l":
                gui.hide();
                break;
            case "m":
                gui.show();
                break;
        }
    }

    let objPlayer = My_Object.get_object("player");
    if (objPlayer) {
        //horizontal
        if (rightPressed && !leftPressed) {
            objPlayer.give_direction("right")
        }
        else if (!rightPressed && leftPressed) {
            objPlayer.give_direction("left")
        }
        //vertical
        if (downPressed && !upPressed) {
            objPlayer.give_direction("down")
        }
        else if (!downPressed && upPressed) {
            objPlayer.give_direction("up")
        }
    }

    const tuto_button = {"z": undefined, "q": undefined, "s": undefined, "d": undefined};

    for (const obj of My_Object.instances) {
        if (!obj.group == "tuto_button") { continue; }
        tuto_button[obj.letter] = obj;
    }

    if (rightPressed && tuto_button["d"]) {
        tuto_button["d"].die();
    }
    if (leftPressed && tuto_button["q"]) {
        tuto_button["q"].die();
    }
    if (downPressed && tuto_button["s"]) {
        tuto_button["s"].die();
    }
    if (upPressed && tuto_button["z"]) {
        tuto_button["z"].die();
    }


}
