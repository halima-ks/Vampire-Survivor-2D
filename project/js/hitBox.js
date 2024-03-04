
import { CTX } from "./script.js";
import { distance, convert, rect_is_in_rect, circle_is_in_rect, is_in_rect } from "./tools.js";
import { draw_rect, draw_point, draw_circle_stroke, draw_rect_stroke } from "./imgs.js";

export class HitBox_Circle {
    constructor(x, y, radius) {
        this.x = x;
        this.y = y;
        this.centerX = this.x;
        this.centerY = this.y;
        this.radius = radius;

        this.enabled = true;
    }


    is_colliding(obj) {
        if (!this.enabled) { return false; }

        //collision disabled
        if (!this.enabled) { return false; }
        //collide with another mask
        if (obj instanceof HitBox_Mask) {
            // return obj.collide_with_circle(this);
            return is_collide_mask_with_circle(obj, this);
        }
        //collide with Circle
        else if (obj instanceof HitBox_Circle) {
            // return this.collide_with_circle(obj);
            return is_collide_circle_with_circle(this, obj);
        }
        else if (obj instanceof HitBox_Rect) {
            // return obj.collide_with_circle(this);
            return is_collide_rect_with_circle(obj, this);
        }
        return false;
    }


    draw_contours() {
        let thickness = 2;
        let color = "#0000FFBB";
        if (!this.enabled) {
            thickness = 2;
            color = "#FF0000AA";
        }

        draw_circle_stroke(this.x, this.y, this.radius, color, thickness)
    }
}



export class HitBox_Rect {
    constructor(xCenter, yCenter, width, height) {
        this.x = xCenter - width/2;
        this.y = yCenter - height/2;
        this.centerX = xCenter;
        this.centerY = yCenter;
        this.width = Math.floor(width);
        this.height = Math.floor(height);

        this.enabled = true;
    }


    is_colliding(obj) {
        if (!this.enabled) { return false; }

        //collision disabled
        if (!this.enabled) { return false; }
        //collide with a Mask
        if (obj instanceof HitBox_Mask) {
            // return obj.collide_with_rect(this);
            return is_collide_mask_with_rect(obj, this);
        }
        //collide with Circle
        else if (obj instanceof HitBox_Circle) {
            // return this.collide_with_circle(obj);
            return is_collide_rect_with_circle(this, obj);
        }
        //collide with another Rect
        else if (obj instanceof HitBox_Rect) {
            // return this.collide_with_rect(obj)
            return is_collide_rect_with_rect(this, obj);
        }
        return false;
    }


    draw_contours() {
        let thickness = 2;
        let color = "#0000FFBB";
        if (!this.enabled) {
            thickness = 2;
            color = "#FF0000AA";
        }

        draw_rect_stroke(this.x, this.y, this.width, this.height, color, thickness);
    }
}



/*
 * !!! cette class doit recevoir une image respectant les règles suivantes:
 * A la même taille que l'image dont elle est le mask
 * Le fond doit être transparent
 */
export class HitBox_Mask {
    constructor(xCenter, yCenter, img, width, height) {
        this.x = xCenter - (width/2);
        this.y = yCenter - (height/2);
        this.centerX = this.x;
        this.centerY = this.y;
        this.maskSquare = {"x1": 0, "y1": 0, "x2": 0, "y2": 0};
        this.width = Math.floor(width);
        this.height = Math.floor(height);
        this.mask = [] //boolens correspondant aux pixels d'une image
        this.mask_created = false;
        
        //predefined Image class
        this.img = new Image();
        this.img.src = img;

        this.enabled = true;
    }

    is_mask_empty() {
        for (const pixel of this.mask) {
            if (pixel) {
                return false;
            }
        }
        return true;
    }

    is_colliding(obj) {
        //collision disabled
        if (!this.enabled) { return false; }

        //collide with other mask
        if (obj instanceof HitBox_Mask) {
            // draw_rect(this.x, this.y, this.width, this.height, "#55555511")
            return is_collide_mask_with_mask(this, obj);
        }
        //collide with Circle
        else if (obj instanceof HitBox_Circle) {
            return is_collide_mask_with_circle(this, obj);
        }
        else if(obj instanceof HitBox_Rect) {
            return is_collide_mask_with_rect(this, obj);
        }

        return false;
    }


    update_mask() {
        if (this.mask_created) { return; }

        this.mask = this.create_mask();

        if (!this.is_mask_empty()) {
            this.update_center();
            this.mask_created = true;
        }
    }


    //set the center of the mask
    update_center() {
        let minX = this.width
        let maxX = 0;
        let minY = this.height;
        let maxY = 0;

        let i = 0;
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++, i++) {
                if (!this.mask[i]) { continue; }
                minX = Math.min(minX, x);
                maxX = Math.max(maxX, x);
                minY = Math.min(minY, y);
                maxY = Math.max(maxY, y);
            }
        }

        this.centerX = this.x + Math.floor((minX + maxX) / 2)
        this.centerY = this.y + Math.floor((minY + maxY) / 2)
        this.maskSquare.x1 = minX
        this.maskSquare.y1 = minY
        this.maskSquare.x2 = maxX
        this.maskSquare.y2 = maxY
    }


    get_pixels() {
        //draw the img
        draw_rect(0, 0, this.width, this.height, "#00FF00")
        CTX.drawImage(this.img, 0, 0, this.width, this.height);

        //get pixels data where the img was drawn
        let imgData = CTX.getImageData(0, 0, this.width, this.height)
        return imgData.data;
    }

    create_mask() {
        let data = this.get_pixels();
        let mask = []
        let i = 0;
        for (let j = 0; j < this.height; j++) {
            for (let k = 0; k < this.width; k++, i+=4) {
                let color = convert(data[i], data[i+1], data[i+2]);
                //bordure
                if (j*k == 0 || j+1 == this.height || k+1 == this.width) {
                    color = false
                }
                //fond
                else if (color == "#00FF00") {
                    color = false;
                }
                //hitBox
                else {
                    color = true;
                }

                mask.push(color)
            }
        }
        return mask
    }


    draw_contours() {
        // draw_rect_stroke(this.x+this.maskSquare.x1, this.y+this.maskSquare.y1, this.maskSquare.x2-this.maskSquare.x1, this.maskSquare.y2-this.maskSquare.y1, "#00FF00", 1);
        let color = "#0000FFBB"
        if (!this.enabled) {
            color = "#FF000055";
        }
        let i = 0;
        for (let j = 0; j < this.height; j++) {
            for (let k = 0; k < this.width; k++, i++) {
                if (!this.mask[i]) { continue; }
                //draw if there no previous/next column/row
                if(    this.mask[i-this.width] == undefined
                    || this.mask[i+this.width] == undefined
                    || this.mask[i-1] == undefined
                    || this.mask[i+1] == undefined
                    ) {
                    draw_point(this.x+k, this.y+j, color); 
                    console.log(j, k)
                    continue;
                }


                let surrounded = true;
                for(let l = j-1; l <= j+1; l++) {
                    if (!surrounded) { break; }
                    for(let m = k-1; m <= k+1; m++) {
                        if (l == 1 && m == 1) { continue; }
                        if (!this.mask[l*this.width+m]) {
                            surrounded = false;
                            break;
                        }
                    }
                }
                if (surrounded) { continue; }
                draw_point(this.x+k, this.y+j, color)
            }
        }

        draw_rect(this.centerX-2, this.centerY-2, 4, 4, "#000000")
    }
}













function is_collide_circle_with_circle(c1, c2) {
    let distanceX = c1.x - c2.x;
    let distanceY = c1.y - c2.y;
    let distance = Math.sqrt((distanceX * distanceX) + (distanceY * distanceY));

    return distance < c1.radius + c2.radius;
}


function is_collide_rect_with_rect(r1, r2) {
    const rect1 = {"x1": r1.x, "y1": r1.y, "x2": r1.x+r1.width, "y2": r1.y+r1.height};
    const rect2 = {"x1": r2.x, "y1": r2.y, "x2": r2.x+r2.width, "y2": r2.y+r2.height};
    if (rect_is_in_rect(rect1, rect2)) { return true; }
    return false
}


function is_collide_rect_with_circle(r, c) {
    const circle = {"x": c.x, "y": c.y, "radius": c.radius};
    const rect = {"x1": r.x, "y1": r.y, "x2": r.x+r.width, "y2": r.y+r.height};
    return circle_is_in_rect(circle, rect);
}


//return true if at least one pixel of this.mask and obj.mask are both true
function is_collide_mask_with_mask(m1, m2) {
    //pre check
    //check if objects overlaps
    const rect1 = {"x1": m1.x, "y1": m1.y, "x2": m1.x+m1.width, "y2": m1.y+m1.height};
    const rect2 = {"x1": m2.x, "y1": m2.y, "x2": m2.x+m2.width, "y2": m2.y+m2.height};
    if(!rect_is_in_rect(rect1, rect2)) { return false; }

    // console.log("overlap")
    //check
    let count = 0
    const x_start = m1.maskSquare.x1
    const x_end = m1.maskSquare.x2
    const y_start = m1.maskSquare.y1
    const y_end = m1.maskSquare.y2
    for (let j = y_start; j < y_end; j++) {
        for (let i = x_start; i < x_end; i++, count++) {
            //coordonnées générales du pixel
            let X = m1.x + i;
            let Y = m1.y + j;

            //si le point n'est pas surperposé à m2
            if (X < m2.x || X > m2.x + m2.width) { continue;}
            if (Y < m2.y || Y > m2.y + m2.height) { continue; }

            //index dans m1.mask
            let iM1 = i + (j * m1.width);

            //index dans m2.mask
            let xOther = Math.floor(X - m2.x)
            let yOther = Math.floor(Y - m2.y)
            let iOther = xOther + (yOther * m2.width);

            // if (m1.mask[iM1]) {
            //     draw_point(X, Y, "#00FF0055")
            // }

            if (m1.mask[iM1] && m2.mask[iOther]) {
                // draw_rect(X-1, Y-1, 3, 3, "#FF0000")
                // console.log("collision")
                return true; // Collision detected
            }
        }
    }
    return false;
}


//return true if the distance between the center of circle and at least one true pixel of mask.mask is smaller than circle.radius
function is_collide_mask_with_circle(mask, circle) {
    //opti pour réduire par 4 le parcours de mask.mask:
    //pre check pour vérifier la position relative de circle (haut ou haut-droite ou haut-gauche...) dans les 8 directions
    //ex: si l'circle est en haut à gauche, il faut vérifier ignorer les pixels dans la partie bas-droite de mask.mask (donc x > width/2 && y > height/2)
    //ex: --   circle ----   bas, il faut ignore les pixels d'en haut (donc y < mask.height/2)

    // draw_rect(circle.x-10, circle.y-10, 20, 20, "#FF000055")
    
    // draw_circle_fill(circle.x, circle.y, circle.radius, "#0000FF55")

    //pre check
    //check if objects overlaps
    let overlapX = mask.x+mask.width >= circle.x-circle.radius && mask.x < circle.x+circle.radius
    let overlapY = mask.y+mask.height >= circle.y-circle.radius && mask.y < circle.y+circle.radius
    if (!overlapX || !overlapY) { return false; }

    /*
        * pour chaque pixel true de mask.mask
        *   si la distance avec le centre de circle est plus petite que rayon de circle, return true
        * return false
        */
    const x_start = mask.maskSquare.x1
    const x_end = mask.maskSquare.x2
    const y_start = mask.maskSquare.y1
    const y_end = mask.maskSquare.y2
    for (let j = y_start; j < y_end; j++) {
        for (let i = x_start; i < x_end; i++) {
            if (!mask.mask[i + j*mask.width]) { continue; }
            // draw_point(mask.x+i, mask.y+j, "#00FF00")
            let dist = distance(circle.x, circle.y, mask.x+i, mask.y+j)
            if (dist < circle.radius) { 
                // draw_rect(mask.x+i-1, mask.y+j-1, 3, 3, "#FF0000")
                // console.log("collision")
                return true; }
        }
    }
    return false;
}


//return true if any true pixel of mask.mask is in rect
function is_collide_mask_with_rect(mask, rect) {
    //pre check
    //check if objects overlaps
    const rect1 = {"x1": mask.x, "y1": mask.y, "x2": mask.x+mask.width, "y2": mask.y+mask.height};
    const rect2 = {"x1": rect.x, "y1": rect.y, "x2": rect.x+rect.width, "y2": rect.y+rect.height};
    if(!rect_is_in_rect(rect1, rect2)) { return false; }
    

    /*
        * pour chaque pixel true de mask.mask
        *   s'il est dans rect, return true
        * return false
        */
    const x_start = mask.maskSquare.x1
    const x_end = mask.maskSquare.x2
    const y_start = mask.maskSquare.y1
    const y_end = mask.maskSquare.y2
    for (let j = y_start; j < y_end; j++) {
        for (let i = x_start; i < x_end; i++) {
            if (!mask.mask[i + j*mask.width]) { continue; }

            if (is_in_rect(mask.x+i, mask.y+j, rect.x, rect.y, rect.x+rect.width, rect.y+rect.height)) {
                return true;
            }
        }
    }
    return false;
}
