
import { CNV, CNV10, CTX } from "./script.js";
import { is_in_rect, distance, min, rect_is_in_rect } from "./tools.js";

export function draw_rect(x, y, width, height, color) {
    CTX.beginPath();
    CTX.rect(x, y, width, height);
    CTX.fillStyle = color
    CTX.fill();
    CTX.closePath();
}


export function draw_rect_stroke(x, y, width, height, color, thickness = 1) {
    CTX.beginPath();
    CTX.rect(x, y, width, height);
    CTX.lineWidth = thickness;
    CTX.strokeStyle = color
    CTX.stroke();
    CTX.closePath();
}


export function draw_point(x, y, color) {
    draw_rect(x, y, 1, 1, color);
}


export function draw_circle_stroke(x, y, radius, color, thickness = 1) {
    CTX.beginPath();
    CTX.arc(x, y, radius, 0, 2*Math.PI);
    CTX.lineWidth = thickness;
    CTX.strokeStyle = color;
    CTX.stroke();
    CTX.closePath();
}


export function draw_circle_fill(x, y, radius, color) {
    CTX.beginPath();
    CTX.arc(x, y, radius, 0, 2*Math.PI);
    CTX.fillStyle = color;
    CTX.fill();
    CTX.closePath();
}



export class My_Img {
    constructor(imgSrc, xCenter, yCenter, width, height, iconeSrc = undefined, icone_color = {"in": "#000000", "border": "#FFFFFF"}, is_background_component = false) {
        this.imgSrc = imgSrc;
        this.iconeSrc = iconeSrc
        this.iconeColor = icone_color
        this.is_background_component = is_background_component;
    
        //size
        this.width = Math.floor(width);
        this.height = Math.floor(height);
    
        //position
        this.x = xCenter - (width/2);
        this.y = yCenter - (height/2);
    
        //predefined Image class
        this.img = new Image();
        if(imgSrc) {
            this.img.src = this.imgSrc;
        }
    
        this.icone = new Image();
        if(iconeSrc) {
            this.icone.src = this.iconeSrc;
            this.iconeSize = CNV10;
        }

        //dat.GUI
        this.is_visible = true;
    }



    static instances = [];

    static destroy_imgs() {
        My_Img.instances = [];
    }

    static add_instance(img) {
        My_Img.instances.push(img);
    }



    draw() {
        if (!this.imgSrc) { return; }
        if (!this.is_visible) { return; }

        const rect1 = {"x1": this.x, "y1": this.y, "x2": this.x+this.width, "y2": this.y+this.height};
        const rect2 = {"x1": 0, "y1": 0, "x2": CNV.width, "y2": CNV.height};
        if (this.is_background_component || rect_is_in_rect(rect1, rect2)) {
            CTX.drawImage(this.img, this.x, this.y, this.width, this.height);
        }
    }

    draw_icone() {
        if (!(this.iconeSrc && this.is_out_of_canvas())) {
            return;
        }
        let target = {"x": this.x+this.width/2, "y": this.y+this.height/2}
        let origin = {"x": CNV.width/2, "y": CNV.height/2}
        let dist = distance(target.x, target.y, origin.x, origin.y)
        let vector = {"x": (target.x - origin.x)/dist , "y": (target.y - origin.y) /dist}

        let border = {"x": 0, "y": 0};
        if (vector.x > 0) { border.x = CNV.width; }
        if (vector.y > 0) { border.y = CNV.height; }
        let distFromBorder = CNV.width + CNV.height;

        //move the origin to the target until he's near the border
        while (distFromBorder > CNV10/2) {
            origin.x += vector.x;
            origin.y += vector.y;

            let horizontal = Math.abs(distance(border.x, 0, origin.x, 0));
            let vertical = Math.abs(distance(0, border.y, 0, origin.y));
            distFromBorder = min(horizontal, vertical);
        }

        //define the icone size based on distance with the target
        let X = origin.x;
        let Y = origin.y;
        dist = distance(target.x, target.y, X, Y);
        let size = this.iconeSize;
        let thickness = 2;
        if (dist > CNV10*13) {
            size = Math.abs(size*0.2);
            thickness *= 0.2;
        }
        else if (dist > CNV10*10) {
            size = Math.abs(size*0.4);
            thickness *= 0.4;
        }
        else if (dist > CNV10*5) {
            size = Math.abs(size*0.6);
            thickness *= 0.6;
        }
        else if (dist > CNV10*3) {
            size = Math.abs(size*0.8);
            thickness *= 0.8;
        }
        else {
            size = Math.abs(size*0.9);
        }

        let subSize = size * 0.8;
        draw_circle_fill(X, Y, size/2, this.iconeColor["in"]);
        draw_circle_stroke(X, Y, size/2, this.iconeColor["border"], thickness);
        CTX.drawImage(this.icone, X-subSize/2, Y-subSize/2, subSize, subSize);
    }

    is_out_of_canvas() {
        if (!is_in_rect(this.x+this.width/2, this.y+this.height/2, 0, 0, CNV.width, CNV.height)) {
            return true;
        }
        return false;
    }
}




//animated sprite with a SINGLE animation
export class My_Img_Animated extends My_Img {
    constructor(xCenter, yCenter, width, height, sprites, iconeSrc = undefined, iconeColor = {"in": "#000000", "border": "#FFFFFF"}) {
        const temp = My_Img_Animated.get_default_animation(sprites);
        super(temp["frames"][0], xCenter, yCenter, width, height, iconeSrc, iconeColor);
        this.actual_sprites = temp["frames"];
        this.sprites = sprites; //dict de dict {"nom anim" : {"fps": int, "frames": list(str)}, ...}

        this.is_dead = false;

        this.fps = temp["fps"];
        this.previousTimestamp = undefined;

        //dat.GUI
        this.animated = true;
    }


    static get_default_animation(sprites) {
        const animations = ["standing", "walking"] //sorted by priority

        for (const anim of animations) {
            const temp = sprites[anim]
            if (temp) {
                return temp;
            }
        }

        console.log("error: My_Img_Animated has no default animation", animations)
        console.log("In imgs.js: My_Img_Animated.get_default_animation().")
        return []
    }

    // return 0 if there is no sprite left
    next_frame(timestamp, loop = true) {
        if (this.previousTimestamp == undefined) {
            this.previousTimestamp = timestamp;
        }

        let elapsed = timestamp - this.previousTimestamp;
        let delay = 1000 / this.fps
        if (elapsed < delay) { return 1; }

        this.previousTimestamp = timestamp;

        if (this.actual_sprites.length == 0) {
            this.is_dead = true;
            return;
        }
        
        if (!this.animated) {
            this.img.src = this.imgSrc;
            return;
        }

        let next = this.actual_sprites.shift(); //remove the first list's element
        this.img.src = next;                    //update current Img source
        if (loop) {
            this.actual_sprites.push(next);     //push it at the end
        }
        return;
    }

    die() {
        const anim = this.sprites["dying"];
        if (anim) {
            this.actual_sprites = anim["frames"];
            this.fps = anim["fps"];
        }
        else {
            this.actual_sprites = []
        }
    }

}




export class My_Circle {
    constructor(x, y, rad, color) {
        this.x = x;
        this.y = y;
        this.rad = rad;
        this.color = color;

        this.is_visible = true;
    }


    draw() {
        if (!this.is_visible) { return; }

        draw_circle_fill(this.x, this.y, this.rad, this.color);
    }
}
