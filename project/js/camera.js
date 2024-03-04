
import { My_Img } from "./imgs.js";
import { My_Object } from "./objects.js";
import { CNV, CTX } from "./script.js";


export class Camera {
    constructor() {
        this.smoothness = CNV.width * 0.02; //a small value made a harder camera
    }


    move_objects(addX, addY) {
        if (Math.abs(addX) < 0.1 ) { addX = 0; }
        if (Math.abs(addY) < 0.1 ) { addY = 0; }

        for (const img of My_Img.instances) {
            img.x += addX;
            img.y += addY;
        }

        for (const obj of My_Object.instances) {
            obj.add_to_position(addX, addY);
        }
    }


    //déplace la "caméra" pour placer X et Y au centre de l'écran
    update(obj_focus = undefined, X = 0, Y = 0) {
        if (obj_focus) {
            if (obj_focus.is_dead || obj_focus.dying) { return; }
            X = obj_focus.x; Y = obj_focus.y;
        }

        let x_mid = CNV.width / 2
        let y_mid = CNV.height / 2
        
        let diff_x = x_mid - X
        let diff_y = y_mid - Y

        this.move_objects(diff_x/this.smoothness, diff_y/this.smoothness);
    }
}

