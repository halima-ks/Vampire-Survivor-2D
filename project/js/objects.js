
import { CNV, CTX, ASSETS_DIR, PNG_EXT, CNV10 } from "./script.js";
import { My_Img, My_Img_Animated, draw_circle_stroke, draw_rect } from "./imgs.js"
import { HitBox_Circle, HitBox_Mask, HitBox_Rect } from "./hitBox.js";
import { direction, distance, getRandom, is_in_rect, is_out_of_screen, normalize } from "./tools.js";
import { My_Button, create_menu } from "./interface.js";
import { generate_mobs } from './interface.js';
import { MOUSE } from "./input.js";





// Function that checks if the given object collides with any other objects.
// If collide with an object, compare their group, then call corresponding effect for each objects.
// Return 0 immediatly if the effect on the given object makes (like dying) makes him unable for next actions.
// Else, return 1.
function check_collisions(obj = My_Object, other_objects = Array(My_Object) , timestamp) {
    // if object has no hitBox
    if (!obj.hitBox) { return 1; }
    if (obj.group == "obstacle") { return 1; }
    if (obj.group == "bonus") { return 1; }

    let objGroup = obj.group;
    if (objGroup == "player_auto") { objGroup = "player"};

    for (const other of other_objects) {
        if (other == obj) { continue; }
        if (!other.hitBox) { continue; }
        if (other.is_dead) { continue; }
        if (other.dying) { continue; }
        if (!(obj.hitBox.is_colliding(other.hitBox))) { continue; }

        let otherGroup = other.group;
        if (otherGroup == "player_auto") { otherGroup = "player"};
        switch (objGroup) {
            case "player":
                switch(otherGroup) {
                    case "enemy_projectile":
                        obj.recul(other);
                        obj.die();
                        other.die();
                        return 0;
                    case "enemy_turret":
                        obj.recul(other);
                        obj.die();
                        other.die();
                        return 0;
                    case "bonus":
                        other.die();
                        obj.give_bonus(other.effect, timestamp);
                        break;
                    case "obstacle":
                        obj.recul(other)
                        break;
                }
                break;

            case "ally_projectile":
                switch(otherGroup) {
                    case "enemy_turret":
                        obj.die();
                        other.die();
                        return 0;
                    case "enemy_projectile":
                        obj.die();
                        other.die();
                        return 0;
                    case "enemy_chasing":
                        obj.die();
                        other.die();
                        return 0;
                    case "obstacle":
                        if (other.type == "hole") { break; } 
                        obj.die();
                        return 0;
                }
                break;

            case "enemy_turret":
                switch(otherGroup) {
                    case "player":
                        obj.die();
                        other.recul(obj)
                        other.die();
                        return 0;
                    case "ally_projectile":
                        obj.die();
                        other.die();
                        return 0;
                    case "enemy_chasing":
                        other.recul(obj)
                        break;
                }
                break;

            case "enemy_projectile":
                switch (otherGroup) {
                    case "obstacle":
                        if (other.type == "hole") { break; }
                        obj.die();
                        return 0;
                    case "player":
                        obj.die();
                        other.recul(obj);
                        other.die();
                        return 0;
                    case "ally_projectile":
                        obj.die();
                        other.die();
                        return 0;

                }
                break;

            case "enemy_chasing":
                switch (otherGroup) {
                    case "enemy_chasing":
                        obj.recul(other)
                        return 0;
                    case "obstacle":
                        obj.recul(other)
                        return 0;
                    case "player":
                        obj.die();
                        other.recul(obj)
                        other.die();
                        return 0;
                    case "ally_projectile":
                        obj.die();
                        other.die();
                        return 0;
                    case "enemy_turret":
                        obj.recul(other);
                        break;
                }
                break;
        }
    }

    return 1;
}



export class My_Object {
    constructor(xCenter, yCenter, image, hitBox, group = "", speed = 1, velocityX = 0.0, velocityY = 0.0) {
        this.x = xCenter;
        this.y = yCenter;

        this.image = image;
        this.hitBox = hitBox;

        this.speed = speed;
        this.velocityX = velocityX; //between -1 and 1
        this.velocityY = velocityY; //between -1 and 1

        this.group = group; //"player", "enemy", "obstacle"

        this.previousTimestampWhenMoved = undefined;

        this.id = -1;

        this.dying = false;
        this.is_dead = false;

        My_Object.addInstance(this);
    }



    static instances = [];
    static id = 0;
    static playerSpeed = 15;
    static game_infos = undefined;


    static destroy_objects () {
        My_Object.instances = [];
    }


    static clear_dead_objects() {
    let newList = My_Object.instances.filter(function(element) {
        return !element.is_dead;
        });
        My_Object.instances = newList;
    }

    static get_object(group_name) {
        for (const obj of My_Object.instances) {
            if (obj.group == group_name) {
                return obj;
            }
        }
        return undefined;
    }

    static get_player() {
        let obj = My_Object.get_object("player");
        if (!obj) {
            obj = My_Object.get_object("player_auto");
        }
        return obj;
    }


    //sort My_Objects.instances bases on element.y
    //bubble sort
    static sort_objects() {
        let length = My_Object.instances.length
        let list = My_Object.instances
        for (let i = 0; i < length-1; i++) {
            for (let j = i; j < length-1; j++) {
                const obj1 = list[j];
                const obj2 = list[j+1];
                let y1 = obj1.y;
                let y2 = obj2.y;
                if (obj1.hitBox instanceof HitBox_Mask) {
                    y1 = obj1.hitBox.centerY;
                }
                if (obj2.hitBox instanceof HitBox_Mask) {
                    y2 = obj2.hitBox.centerY;
                }

                let switch_obj = false;
                if (obj2.group == "text") { switch_obj = false;}
                if (obj1.group == "text") { switch_obj = true;}
                else if (obj2.group == "tuto_button") { switch_obj = false;}
                else if (obj1.group == "tuto_button") { switch_obj = true;}
                else if (y1 > y2) { switch_obj = true; }
                if (!switch_obj) { continue; }
                list[j] = obj2;
                list[j+1] = obj1;
            }
        }
    }


    static addInstance(obj) {
        if (obj.id != -1) {
            console.log("This obj already added:")
            console.log(obj)
            return;
        }

        obj.id = My_Object.id;
        My_Object.id++;
        My_Object.instances.push(obj);
    }



    static draw_player_bonus() {
        let player = My_Object.get_object("player");
        if (!player) {
            player = My_Object.get_object("player_auto");
            if (!player) { return; }
        }

        //set size
        const len = Bonus.effects.length;
        let i = 0;
        const bonusSize = CNV10*1.5;
        const split = (bonusSize/3)
        const barSize = len*bonusSize + (len-1)*split
        const x = CNV.width/2-barSize/2;
        const y = CNV10*0.25;

        // draw support
        // draw_rect(CNV.width/2-barSize/2, CNV10, barSize, bonusSize, "#333333BB")
        const subSize = bonusSize/2
        const name = ["up-left", "up-right", "down-left", "down-right", "up", "down"];
        const coords = {
            "up-left":    {"x": 0, "y": 0, "w": subSize, "h":subSize},
            "up-right":   {"x": barSize-subSize, "y": 0, "w": subSize, "h":subSize},
            "down-left":  {"x": 0, "y": subSize, "w": subSize, "h":subSize},
            "down-right": {"x": barSize-subSize, "y": subSize, "w": subSize, "h":subSize},
            "up":         {"x": subSize, "y": 0, "w": barSize-subSize*2, "h":subSize},
            "down":       {"x": subSize, "y": subSize, "w": barSize-subSize*2, "h":subSize},
        }

        for (let i = 0; i < name.length; i++) {
            let img = new Image();
            let key = name[i]
            img.src = ASSETS_DIR + "frame_" + key + PNG_EXT;
            CTX.drawImage(img, x+coords[key].x, y+coords[key].y, coords[key].w+1, coords[key].h+1);
        }

        //draw each bonus
        for (const effect of Bonus.effects) {
            let img = new Image();
            let file = ASSETS_DIR + "bonus_" + effect;
            let add = "_v2"
            if (player.bonus_is_active[effect]) {
                img.src = file + "_on" + add + PNG_EXT;
            }
            else {
                img.src = file + "_off" + add + PNG_EXT;
            }
            let xoffset = i * (bonusSize + split)
            CTX.drawImage(img, x+xoffset, y, bonusSize, bonusSize);
            // draw_rect( x+xoffset, y, bonusSize, bonusSize, "#FF000055")
            
            i++
        }
    }



    /*
     * METHODS FOR SUBCLASSES
     */

    //precedes this.status_update()
    additionnal_update(timestamp) {
        return; 
    }


    //follows this.action()
    //called after collisions has been checked
    auto_actions(timestamp) {
        return;
    }


    generate_on_death() {
        return;
    }



    /*
     * MAIN METHODS (called outside)
     */

    action(timestamp, can_move = true, collision_active = true) {
        this.status_update(timestamp, collision_active);
        
        if (this.is_dead) { return; }
        if (this.dying) { return; }
        if (!can_move) { 
            this.previousTimestampWhenMoved = timestamp;
            return;
        }

        this.move(timestamp);

        if (collision_active && this.hitBox) {
            let continu = check_collisions(this, My_Object.instances, timestamp);
            if (!continu) { return; }
        }

        this.auto_actions(timestamp);
    }


    animate(timestamp) {
        if (!this.image) { return; }
        if (this.is_dead) { return; }
        if (!(this.image instanceof My_Img_Animated)) { return; }

        let loop = true;
        if (this.dying) { loop = false; }
        this.image.next_frame(timestamp, loop);
    }



    draw() {
        if (this.is_dead) { return ; }
        if (this.image) { 
            this.image.draw();
        }
    }



    /*
     * EFFECTS ON THIS OBJECT
     */

    die() {
        if (this.hitBox) {
            this.hitBox.enabled = false;
        }
        this.dying = true;
        if (this.image instanceof My_Img_Animated) {
            this.image.die();
        }
    }


    recul(obj) {
        let thisX = this.hitBox.centerX;
        let thisY = this.hitBox.centerY;
        let objX = obj.hitBox.centerX;
        let objY = obj.hitBox.centerY;

        let vel = direction(objX, objY, thisX, thisY);
        vel = normalize(vel.x, vel.y);
        if (obj.hitBox instanceof HitBox_Rect) {
            if (Math.abs(vel.x) > Math.abs(vel.y)) {
                vel.y = 0;
                if (vel.x < 0) { vel.x = -0.1; }
                else { vel.x = 0.1; }
            }
            else {
                vel.x = 0;
                if (vel.y < 0) { vel.y = -0.1; }
                else {vel.y = 0.1; }
            }
        }
        this.add_to_position(vel.x, vel.y);
        if (this.hitBox.is_colliding(obj.hitBox)) {
            this.recul(obj);
        }
    }



    rebond() {
        this.velocityX *= -1;
        this.velocityY *= -1;
    }


    /*
     * CALLED INSIDE the class or subclasses
     */

    move(timestamp) {
        if (this.is_dead) { return; }
        if (this.dying) { return; }

        if (this.previousTimestampWhenMoved == undefined) {
            this.previousTimestampWhenMoved = timestamp;
        }

        let elapsed = (timestamp - this.previousTimestampWhenMoved) / 100;

        this.normalize_velocity();
        this.add_to_position(this.speed * this.velocityX * elapsed, this.speed * this.velocityY * elapsed);

        this.previousTimestampWhenMoved = timestamp;
    }


    add_to_position(add_X, add_Y) {
        this.x += add_X;
        this.y += add_Y;
        if (this.image) {
            this.image.x += add_X;
            this.image.y += add_Y;
        }
        if (this.hitBox) {
            this.hitBox.x += add_X;
            this.hitBox.y += add_Y;
            this.hitBox.centerX += add_X;
            this.hitBox.centerY += add_Y;
        }
    }


    update_velocity(x = undefined, y = undefined) {
        if (x != undefined) {
            this.velocityX = x;
        }
        if (y != undefined) {
            this.velocityY = y;
        }
    }

    status_update(timestamp, collision_active) {
        this.additionnal_update(timestamp);

        if (this.hitBox && !this.dying && !this.is_dead) {
            this.hitBox.enabled = collision_active;
        }
        if (this.hitBox instanceof HitBox_Mask) {
            this.hitBox.update_mask();
        }

        if (this.is_dead) { return; }
        if (!this.dying) { return; }

        if (this.image instanceof My_Img_Animated) {
            if (this.image.is_dead) {
                this.is_dead = true;
            }
        }
        else {
            this.is_dead = true;
        }

        if (this.is_dead) {
            this.generate_on_death();
        }
    }


    normalize_velocity() {
        const vel = normalize(this.velocityX, this.velocityY)
        this.velocityX = vel.x;
        this.velocityY = vel.y
    }


    is_inside_illegal_tile(x, y) {
        for (const obj of My_Object.instances) {
            if (obj.group != "obstacle") { continue; }
            if (!obj.image) { continue; }
            const img = obj.image;
            const x1 = img.x;
            const y1 = img.y;
            const x2 = x1 + img.width;
            const y2 = y1 + img.height;
            if (is_in_rect(x, y, x1, y1, x2, y2)) { return true; }
        }
        return false;
    }
}























// // A template subclass of My_Object
// // You must give "subclass_name" and a "group_name"

// export class subclass_name extends My_Object {
//     constructor(x, y, image, hitBox /*you can add brand new properties*/) {
//         super(x, y, image, hitBox, "group_name");
//         /*you can add brand new this.properties*/
//     }

//     //precedes this.status_update()
//     additionnal_update(timestamp) {
//         return; 
//     }

//     //follows this.action(timestamp)
//     //called after collisions has been checked
//     auto_actions(timestamp) {
//         return;
//     }
// }




export class Obstacle extends My_Object {
    constructor(xCenter, yCenter, image, hitBox, type = {"wall || hole": undefined}) {
        super(xCenter, yCenter, image, hitBox, "obstacle");
        this.type = type;
    }
}




export class Bonus extends My_Object {
    constructor(xCenter, yCenter, image, hitBox, effect = {"invicibility || gatling || spliter": undefined}) {
        super(xCenter, yCenter, image, hitBox, "bonus");
        this.effect = effect;
    }

    static effects = ["invicibility", "gatling", "spliter"];
}




export class Player extends My_Object {
    constructor(xCenter, yCenter, image, hitBox, speed) {
        super(xCenter, yCenter, image, hitBox, "player", speed);
        this.bonus_is_active = {"invicibility": false, "gatling": false, "spliter": false};
        this.bonus_duration =  {"invicibility":5, "gatling": 5, "spliter": 5}; //seconds
        this.timestampBonus =  {"invicibility": undefined, "gatling": undefined, "spliter": undefined};
    
        this.shoot = true;
        this.shot_by_seconds = 1.2; //1 / x, to shot every x seconds
        this.timestampWhenLastShot = undefined;

        this.real_values = {"shot_by_seconds": this.shot_by_seconds};
    }


    generate_on_death() {
        create_menu("game_over");
    }

    give_bonus(bonus, timestamp) {
        My_Object.game_infos.bonusAcquired++;
        this.bonus_is_active[bonus] = true;
        this.timestampBonus[bonus] = timestamp;

        this.refresh_bonuses(timestamp);
    }

    refresh_bonuses(timestamp) {
        for (const effect of Bonus.effects) {
            if (this.bonus_is_active[effect]) {
                this.timestampBonus[effect] = timestamp;
            }
        }
    }


    die() {
        if (this.bonus_is_active["invicibility"]) { return; }
        if (this.hitBox) {
            this.hitBox.enabled = false;
        }
        this.dying = true;
        if (this.image instanceof My_Img_Animated) {
            this.image.die();
        }
    }


    additionnal_update(timestamp) {
        // update bonuses activity
        for (const effect of Bonus.effects) {

            if (this.bonus_is_active[effect]) {
                if (this.timestampBonus[effect] == undefined) {
                    this.timestampBonus[effect] = timestamp;
                    return;
                }
                let elapsed = timestamp - this.timestampBonus[effect];
                let delay = this.bonus_duration[effect] * 1000
                if (elapsed >= delay) {
                    this.bonus_is_active[effect] = false;
                }
            }
        }


        // update Player properties based on active bonuses
        if (this.bonus_is_active["gatling"]) {
            this.real_values["shot_by_seconds"] = this.shot_by_seconds * 3;
        }
        else {
            this.real_values["shot_by_seconds"] = this.shot_by_seconds;
        }
        
    }


    auto_actions(timestamp) {
        this.check_out_of_screen();
        this.update_velocity(0, 0);
        this.tirer(timestamp);
    }


    generate_projectile(x, y){
        //found the nearest ennemy
        let nearest_obj = undefined;
        let smallest_dist = undefined;
        const targets = ["enemy_chasing", "enemy_turret"];
        for (const obj of My_Object.instances) {
            if (obj.is_dead || obj.dying) { continue; }
            if (is_out_of_screen(obj.x, obj.y)) { continue; }
            //check if obj is a possible target
            let is_a_target = false;
            for (const target of targets) {
                if (obj.group != target) { continue; }
                is_a_target = true;
            }
            if (!is_a_target) { continue; }

            //obj is a target
            let dist = distance(this.x, this.y, obj.x, obj.y);
            //update nearest_obj based on distance
            if ((smallest_dist == undefined) || (dist < smallest_dist)) {
                nearest_obj = obj;
                smallest_dist = dist;
            }
        }

        let vel = {"x": 0, "y": 0};
        //don't shoot if their is no target
        if (nearest_obj == undefined) { return; }

        //direction toward nearest_obj
        else {
            vel = direction(this.x, this.y, nearest_obj.hitBox.centerX, nearest_obj.hitBox.centerY);
        }
    
        //create projectile
        if (this.bonus_is_active["spliter"]) {
            create_projectile(x, y, vel.x, vel.y, "ally spliter");
        }
        else {
            create_projectile(x, y, vel.x, vel.y, "ally");
        }

    }


    tirer(timestamp){
        if (!this.shoot) { return; }

        if (this.timestampWhenLastShot == undefined) {
            this.timestampWhenLastShot = timestamp;
        }
        let elapsed = timestamp - this.timestampWhenLastShot;
        let delay = 1000 / this.real_values["shot_by_seconds"];
        if (elapsed >= delay){
            this.generate_projectile(this.x, this.y);
            this.timestampWhenLastShot = timestamp;
        }
    }


    check_out_of_screen() {
        //out of screen
        let limit_right = CNV.width;
        let limit_down = CNV.height;

        if (this.x > limit_right) {
            this.add_to_position(-limit_right, 0)
        }
        else if (this.x < 0) {
            this.add_to_position(limit_right, 0)
        }
        if (this.y > limit_down) {
            this.add_to_position(0, -limit_down)
        }
        else if (this.y < 0) {
            this.add_to_position(0, limit_down)
        }
    }


    give_direction(direction = "") {
        if (this.is_dead) { return; }
        if (this.dying) { return; }

        //update position
        switch (direction) {
            case "down":
                this.update_velocity(undefined, 1)
                break;
            case "up":
                this.update_velocity(undefined, -1)
                break
            case "right":
                this.update_velocity(1, undefined)
                break
            case "left":
                this.update_velocity(-1, undefined)
                break
            default:
                console.log("error: player must have an allowed direction.")
        }
    }


    draw_invincible() {
        let radius = (this.image.width+this.image.height) / 4
        draw_circle_stroke(this.x, this.y, radius, "#AeAeA7", 3)
    }


    draw() {
        if (this.is_dead) { return ; }
        if (this.image) { 
            this.image.draw();
        }
        if (this.bonus_is_active["invicibility"]) {
            this.draw_invincible();
        }
    }
}




export class Enemy_Turret extends My_Object {
    constructor(xCenter, yCenter, image, hitBox) {
        super(xCenter, yCenter, image, hitBox, "enemy_turret");

        this.shoot = true;
        this.shot_by_seconds = 2.5; // 1/X, to shot every X seconds
        this.timestampWhenLastShot = undefined;
    }

    die() {
        this.shoot = false
        if (this.hitBox) {
            this.hitBox.enabled = false;
        }
        this.dying = true;
        if (this.image instanceof My_Img_Animated) {
            this.image.die();
        }
    }

    auto_actions(timestamp) {
        this.tirer(timestamp);
    }


    generate_projectile(x, y){
        const player = My_Object.get_player();
        if (!player) { return; }

        const vel = direction(x, y, player.hitBox.centerX, player.hitBox.centerY);
        create_projectile(x, y, vel.x, vel.y, "enemy");
    }


    tirer(timestamp){
        if (!this.shoot) { return; }

        if (this.timestampWhenLastShot == undefined) {
            this.timestampWhenLastShot = timestamp;
        }

        let elapsed = timestamp - this.timestampWhenLastShot;
        let delay = 1000 / this.shot_by_seconds
        if (elapsed >= delay){
            this.generate_projectile(this.x, this.y - this.image.height*0.5);
            this.timestampWhenLastShot = timestamp;
        }
    }

    generate_on_death() {
        My_Object.game_infos.turretKilled++;
        if (this.is_inside_illegal_tile(this.x, this.y)) { return; }
        const chance_bonus = getRandom(0, 1);
        if (!chance_bonus) {
            create_random_bonus(this.x, this.y);
            return;
        }
    }
}




class Projectile extends My_Object {
    constructor(xCenter, yCenter, image, hitBox, speed, velocityX, velocityY) {
        super(xCenter, yCenter, image, hitBox, "", speed, velocityX, velocityY);
    }

    auto_actions(timestamp) {
        if (this.is_out_of_screen()) {
            this.die();
        }
    }

    is_out_of_screen() {
        let out_right = this.x > CNV.width;
        let out_left = this.x < 0;
        let out_down = this.y > CNV.height;
        let out_up = this.y < 0;
        return out_right || out_left || out_down || out_up;
    }
}



export class Enemy_Projectile extends Projectile {
    constructor(xCenter, yCenter, image, hitBox, speed, velocityX, velocityY) {
        super(xCenter, yCenter, image, hitBox, speed, velocityX, velocityY);
        this.group = "enemy_projectile";
    }
}


export class Ally_Projectile extends Projectile {
    constructor(xCenter, yCenter, image, hitBox, speed, velocityX, velocityY)  {
        super(xCenter, yCenter, image, hitBox, speed, velocityX, velocityY);
        this.group = "ally_projectile";
    }
}

export class Ally_Projectile_Spliter extends Ally_Projectile {
    constructor(xCenter, yCenter, image, hitBox, speed, velocityX, velocityY)  {
        super(xCenter, yCenter, image, hitBox, speed, velocityX, velocityY);
        this.nb = 4;
    }

    generate_projectiles() {
        for (let i = 0; i < this.nb; i++) {
            let vel = {"x": 0, "y": 0};
            while (!vel.x && !vel.x) {
                vel.x = getRandom(0, 1);
                vel.y = getRandom(0, 1);
            }
            if (getRandom(0, 1)) { vel.x *= -1; }
            if (getRandom(0, 1)) { vel.y *= -1; }
        
            vel = normalize(vel.x, vel.y);
            create_projectile(this.x+vel.x, this.y+vel.y, vel.x, vel.y, "ally", this.image.width*0.75, this.image.height*0.75);
        }
    }

    die() {
        super.die()
        if (is_out_of_screen(this.x, this.y)) { return; }
        this.generate_projectiles();
    }

}




export class Enemy_Chasing extends My_Object {
    constructor(xCenter, yCenter, image, hitBox, speed, player) {
        super(xCenter, yCenter, image, hitBox, "enemy_chasing", speed);
        this.player = player; // Référence à l'objet joueur
        // this.chaseSpeed = 6; // Vitesse de poursuite de l'ennemi
    }

    auto_actions(timestamp) {
        this.chasePlayer();
    }

    chasePlayer() {
        //Calcule la direction vers le joueur
        let dx = this.player.hitBox.centerX - this.hitBox.centerX;
        let dy = this.player.hitBox.centerY - this.hitBox.centerY;
        let dist = Math.sqrt(dx * dx + dy * dy);

        //Normalise la direction et applique la vitesse
        if (dist > 1) {
            dx = (dx / dist);
            dy = (dy / dist);
            this.update_velocity(dx, dy);
        }
    }

    // die() {
    //     super.die();
    //     generate_mobs(this.player); // Générer de nouvel ennemi lors de la mort de cet ennemi
    // }

    generate_on_death() {
        My_Object.game_infos.enemyChasingKilled++;
        if (this.is_inside_illegal_tile(this.x, this.y)) { return; }
        const chance_bonus = getRandom(0, 9);
        if (!chance_bonus) {
            create_random_bonus(this.x, this.y);
            return;
        }
        // const chance_mobs = getRandom(0, 1);
        // if(!chance_mobs) {
        //     const nb = getRandom(1, 3);
        //     for (let i = 0; i < nb; i++) {
        //         create_enemy_chasing(this.x+i*1, this.y);
        //     }
        //     return;
        // }
        const chance_turret = getRandom(0, 3);
        if(!chance_turret) {
            create_tower(this.x+1, this.y+1);
            return;
        }
    }
}


export class Player_Auto extends Player {
    constructor(xCenter, yCenter, image, hitBox, speed) {
        super(xCenter, yCenter, image, hitBox, speed);
        this.group = "player_auto";
    }

    generate_on_death() {
        create_menu("game_over", false, true);
    }
    
    auto_actions(timestamp) {
        this.update_velocity(0, 0);
        this.tirer(timestamp);
        this.choose_direction();
    }
    
    
    //define the velocity based on nearest enemy and bonus
    choose_direction() {
        let good = ["bonus"];
        let bad = ["obstacle", "enemy_turret", "enemy_projectile", "enemy_chasing"]
        if (this.bonus_is_active["invicibility"]) {
            good = ["bonus", "enemy_turret", "enemy_chasing"];
            bad = ["obstacle"]
        }
        let go_to = []
        let flee_to = []
    
        //found all targets
        for (const obj of My_Object.instances) {
            if (obj.dying || obj.dead) { continue; }
            if (obj == this) { continue; }
            
            let found = false;
            //good
            for (const name of good) {
                if (obj.group == name) {
                    found = true;
                    break;
                }
            }
            if (found) {
                go_to.push(obj);
                continue;
            }
    
            //bad
            if (!is_in_rect(obj.x, obj.y, CNV.width*0.25, CNV.height*0.25, CNV.width*0.75, CNV.height*0.75)) { continue; }
            for (const name of bad) {
                if (obj.group == name) {
                    found = true;
                    break;
                }
            }
            if (found) {
                flee_to.push(obj);
                continue;
            }
        }
    
        //nearest
        let weight = 1.2;
        let near_good = undefined;
        let near_bad = undefined;
    
        let near_dist = undefined;
        //good
        for (const obj of go_to) {
            let dist = distance(obj.hitBox.centerX, obj.hitBox.centerY, this.hitBox.centerX, this.hitBox.centerY);
            if (near_dist == undefined || dist < near_dist) {
                near_dist = dist;
                near_good = obj;
            }
        }
        near_dist = undefined;
        //bad
        for (const obj of flee_to) {
            let dist = distance(obj.hitBox.centerX, obj.hitBox.centerY, this.hitBox.centerX, this.hitBox.centerY);
            if (near_dist == undefined ||  dist < near_dist) {
                near_dist = dist;
                near_bad = obj;
            }
        }
    
        //final direction
        let dir_good = {"x": 0, "y": 0};
        let dir_bad = {"x": 0, "y": 0};
        
        if (near_good) {
            dir_good = direction(this.hitBox.centerX, this.hitBox.centerY, near_good.hitBox.centerX, near_good.hitBox.centerY);
        }
        if (near_bad) {
            dir_bad = direction(near_bad.hitBox.centerX, near_bad.hitBox.centerY, this.hitBox.centerX, this.hitBox.centerY);
        }
        
        //add weight
        if (near_good && near_bad) {
            let dist_bad = distance(this.hitBox.centerX, this.hitBox.centerY, near_bad.hitBox.centerX, near_bad.hitBox.centerY);
            if (dist_bad < CNV.width*0.1) {
                weight = 0.6;
            }
        }
    
        this.update_velocity(dir_good.x*weight + dir_bad.x, dir_good.y*weight + dir_bad.y);
    }
}



export class Moving_Background extends My_Object {
    constructor(x, y, image, speed /*you can add brand new properties*/) {
        super(x, y, image, undefined, "", speed, -1.0);
        /*you can add brand new this.properties*/

        this.moveTo = "right";
        if (getRandom(0, 1)) {
            this.moveTo = "left";
            this.velocityX = 1.0;
        }
    }


    auto_actions(timestamp) {
        this.slide();
    }

    slide() {
        const right = this.image.x + this.image.width*0.9
        const left = this.image.x + this.image.width*0.1
        switch (this.moveTo) {
            case "right":
                if (right < CNV.width) {
                    this.moveTo = "left";
                    this.update_velocity(1, 0);
                } 
                break;
            case "left":
                if (left > 0) {
                    this.moveTo = "right"
                    this.update_velocity(-1, 0);
                } 
        
            default:
                break;
        }
    }
}



export class Enemy_Generator extends My_Object {
    constructor(x, y, image, hitBox, targetForChasing) {
        super(x, y, image, hitBox, "enemy_generator");
        this.targetForChasing = targetForChasing;

        this.timestampWhenGenerate = undefined;
        this.spawn_rate = 2.5; // 1/x for 1 by x seconds
        this.mobs_dead = 0;
        
        this.timestampRateIncreased = undefined;
        this.increaseRate = 5; //each x seconds
        this.increaseAmount = 0.2;
    }

    //follows this.action(timestamp)
    //called after collisions has been checked
    auto_actions(timestamp) {
        this.generate(timestamp);
        this.increaseSpawnRate(timestamp);
    }

    generate(timestamp) {
        if (this.timestampWhenGenerate == undefined) {
            this.timestampWhenGenerate = timestamp;
        }

        let elapsed = timestamp - this.timestampWhenGenerate;
        let delay = 1000 / this.spawn_rate
        if (elapsed < delay){ return; }
        this.timestampWhenGenerate = timestamp;

        let enemyX = 1;
        let enemyY = 1;

        while(true) {
            enemyX = getRandom(-CNV.width*0.2, CNV.width*1.2);
            enemyY = getRandom(-CNV.height*0.2, CNV.height*1.2);
            //is in the canvas
            if (is_in_rect(enemyX, enemyY, 0, 0, CNV.width, CNV.height)) { continue; }
            //is on an obstacle
            if (this.is_inside_illegal_tile(enemyX, enemyY)) { continue; }
            break;
        }

        create_object("enemy chasing", enemyX, enemyY, {"filename": "BAT"})
    }
    
    
    increaseSpawnRate(timestamp) {
        if (this.timestampRateIncreased == undefined) {
            this.timestampRateIncreased = timestamp;
        }

        let elapsed = timestamp - this.timestampRateIncreased;
        let delay = this.increaseRate * 1000
        if (elapsed < delay){ return; }
        this.timestampRateIncreased = timestamp;
        
        this.spawn_rate += this.increaseAmount;
    }
}




export class Timer extends My_Object {
    constructor(duration_seconds) {
        super(0, 0, undefined, undefined)
        this.duration = duration_seconds;
        this.timestampCreation = undefined;
    }


    generate_on_death() {
        console.log("Timer without effect ended.")
    }


    auto_actions(timestamp) {
        this.endTimer(timestamp);
    }

    endTimer(timestamp) {
        if (this.timestampCreation == undefined) {
            this.timestampCreation = timestamp;
        }

        let elapsed = timestamp - this.timestampCreation;
        let delay = this.duration * 1000
        if (elapsed < delay){ return; }

        this.die();
    }
}



export class Timer_Launch_Demo extends Timer {
    constructor(duration_seconds) {
        super(duration_seconds)
    }

    auto_actions(timestamp) {
        //reset timer if mouve has moved
        if (MOUSE.moved) {
            this.timestampCreation = timestamp;
        }
        super.auto_actions(timestamp);
        
    }

    generate_on_death() {
        create_menu("play_demo");
    }
}



export class Timer_Launch_Main_Menu extends Timer {
    constructor(duration_seconds) {
        super(duration_seconds)
    }

    generate_on_death() {
        create_menu("main_menu", false);
    }
}


export class Biome extends My_Object {
    constructor(biome) {
        super(0, 0, undefined, undefined, "biome");
        this.biome = biome;
    }
}




export class Game_Infos extends My_Object {
    constructor() {
        super(0, 0, undefined, undefined, "game_infos")

        this.timestampWhenGameStarted = undefined;
        this.lastTimestamp = undefined;
        this.enemyChasingKilled = 0;
        this.turretKilled = 0;
        this.bonusAcquired = 0;
        this.multiplier = 1.0;
        this.timestampSinceMultiplierIncreaded = undefined;
        this.score = 0;
        My_Object.game_infos = this;
    }

    auto_actions(timestamp) {
        if (this.timestampWhenGameStarted == undefined) {
            this.timestampWhenGameStarted = timestamp;
            this.lastTimestamp = timestamp;
            return;
        }

        this.update_multiplier(timestamp);
        this.update_score(timestamp);
        this.lastTimestamp = timestamp;
    }

    update_multiplier(timestamp) {
        //check that all bonus are active on the player
        const obj = My_Object.get_player();
        if (!obj) { return; }
        for (const effect of Bonus.effects) {
            if(!obj.bonus_is_active[effect]) {
                this.multiplier = 1.0;
                this.timestampSinceMultiplierIncreaded = undefined
                return;
            }
        }

        //increase multiplier if 1 seconds passed
        if (this.timestampSinceMultiplierIncreaded == undefined) {
            this.timestampSinceMultiplierIncreaded = timestamp;
            this.multiplier += 0.1;
            return;
        }
        let elapsed = timestamp - this.timestampSinceMultiplierIncreaded

        if (elapsed <= 1000) { return; }
        this.timestampSinceMultiplierIncreaded = timestamp;


        this.multiplier += 0.1;
    }

    update_score(timestamp) {
        let elapsed = timestamp - this.lastTimestamp;

        const score = elapsed*2 + this.enemyChasingKilled*1000 + this.turretKilled * 10*1000 + this.bonusAcquired * 5 * 1000;
        this.score += score * this.multiplier;

        this.enemyChasingKilled = 0;
        this.turretKilled = 0;
        this.bonusAcquired = 0;
    }

    getTime() {
        return Math.floor((this.lastTimestamp - this.timestampWhenGameStarted) / 1000);
    }

    getScore() {
        return Math.floor(this.score / 1000);
    }
}





export class Text extends My_Object {
    constructor(x, y, width, height, text, color_font = "#FFFFFF", color_back = "#000000") {
        super(x, y, undefined, undefined, "text")

        this.text = text;
        this.x = x - width/2;
        this.y = y - height/2;
        this.width = width;
        this.height = height;
        this.color_font = color_font;
        this.color_back = color_back;
    }

    draw() {
        draw_rect(this.x, this.y, this.width, this.height, this.color_back);
        CTX.font = this.height+"px serif";
        CTX.fillStyle = this.color_font;
        CTX.fillText(this.text, this.x, this.y+this.height, this.width);
    }

    add_to_position() {
        return;
    }
}


export class Tuto_Button extends My_Object {
    constructor(image, letter) {
        super(0, 0, image, undefined, "tuto_button")
        this.letter = letter;
    }

    move() {
        const player = My_Object.get_player();
        if (!player) { return; }

        let addX = 0;
        let addY = 0;

        switch (this.letter) {
            case "z":
                addY = -CNV10;
                break;
            case "q":
                addX = -CNV10;
                break;
            case "s":
                addY = CNV10;
                break;
            case "d":
                addX = CNV10;
                break;
        
            default:
                console.log("Letter " + this.letter + "not set up")
                break;
        }

        this.x = player.x + addX;
        this.y = player.y + addY;
        this.image.x = player.x + addX - this.image.width/2
        this.image.y = player.y + addY - this.image.height/2
    }
}











export function create_object(name, x, y, args = {"vassel hitbox": "circle", "filename": ASSETS_DIR+"terrain/terrain", "player auto": false, "obstacle_type": "wall", "timer name": {"demo": undefined}, "timer duration": 5, "vel": {"x":1, "y":1}}, changeDefaults = false, defaults = {"width": CNV10, "height": CNV10}) {
    // console.log("new", name);
    if (changeDefaults) {
        switch (name) {
            case "bonus":
                create_random_bonus(x, y, defaults["width"], defaults["height"]);
                break;
            case "tree":
                create_tree(x, y, defaults["width"], defaults["height"]);
                break;
            case "border":
                create_border(x, y, args["filename"], defaults["width"], defaults["height"]);
                break;
            case "vassel":
                create_vassel(x, y, args["vassel hitbox"], defaults["width"], defaults["height"]);
                break;
            case "tower":
                create_tower(x, y, defaults["width"], defaults["height"]);
                break;
            case "player":
                return create_player(x, y, args["player auto"], defaults["width"], defaults["height"]);
                break;
            case "obstacle":
                return create_obstacle(x, y, args["filename"], args["obstacle_type"], defaults["width"], defaults["height"]);
                break;
            case "enemy chasing":
                create_enemy_chasing(x, y, args["filename"], defaults["width"], defaults["height"])
                break;
            case "moving background":
                create_moving_background(x, y, args["filename"], defaults["width"], defaults["height"]);
                break;
            case "timer":
                create_timer(args["timer name"], args["timer duration"]);
                break
            default:
                console.log("error: there is no method to create this abject (\"" + name + "\").")
                console.log("In create_object in objects.js.")
                break;
        }
    }
    else {
        switch (name) {
            case "bonus":
                create_random_bonus(x, y);
                break;
            case "tree":
                create_tree(x, y);
                break;
            case "border":
                create_border(x, y, args["filename"]);
                break;
            case "vassel":
                create_vassel(x, y, args["vassel hitbox"]);
                break;
            case "tower":
                create_tower(x, y);
                break;
            case "player":
                return create_player(x, y, args["player auto"]);
                break;
            case "obstacle":
                return create_obstacle(x, y, args["filename"], args["obstacle_type"]);
                break;
            case "enemy chasing":
                create_enemy_chasing(x, y, args["filename"]);
                break
            case "moving background":
                create_moving_background(x, y, args["filename"]);
                break;
            case "timer":
                create_timer(args["timer name"], args["timer duration"]);
                break
            case "projectile ally":
                create_projectile(x, y, args["vel"].x, args["vel"].y, "ally")
                break;
            case "projectile enemy":
                create_projectile(x, y, args["vel"].x, args["vel"].y, "enemy")
                break;
            default:
                console.log("error: there is no method to create this abject (\"" + name + "\").")
                console.log("In create_object in objects.js.")
                break;
        }
    }
}



function create_random_bonus(x, y, width = CNV10*1.2, height = CNV10*1.2) {
    // prepare sprites
    let imgName = "stars_";
    let nb = [1, 1, 1, 1, 2, 2, 3, 3, 4, 4, 3, 3, 2, 2];
    let sprites = {"standing": {"fps": 10, "frames": []}};
    for (let i = 0; i < nb.length; i++) {
        sprites["standing"]["frames"].push(ASSETS_DIR + imgName + nb[i] + PNG_EXT);
    }
    // create object
    let imgObj = new My_Img_Animated(x, y, width, height, sprites, sprites["standing"]["frames"][0]);
    let hitBoxObj = new HitBox_Mask(x, y, ASSETS_DIR+imgName+"mask_v2"+PNG_EXT, width, height)
    
    const effect = Bonus.effects[getRandom(0, Bonus.effects.length-1)]
    new Bonus(x, y, imgObj, hitBoxObj, effect);
}



function create_tree(x, y, width = CNV10, height = CNV10) {
    // prepare sprite
    let imgName = "forest/";
    if (getRandom(0, 1)) {
        imgName += "tree_large"
    }
    else {
        imgName += "tree_thin"
    }
    // create object
    let imgObj = new My_Img(ASSETS_DIR+imgName+PNG_EXT, x, y, width, height)
    let hitBox = new HitBox_Circle(x, y, (width+height)/4)
    new Obstacle(x, y, imgObj, hitBox, "wall")
}



function create_border(x, y, filename, width, height) {
    // create object
    let imgObj = new My_Img(ASSETS_DIR+filename+PNG_EXT, x, y, width, height)
    let hitBox = new HitBox_Rect(x, y, width, height)
    new Obstacle(x, y, imgObj, hitBox, "wall")
}



function create_vassel(x, y, type, width = CNV10*0.75, height = CNV10*0.75) {
    // prepare sprites
    let imgName = "vassels_";
    let sprites = {"standing": {"fps": 10, "frames": []}};
    for (let i = 0; i < 6; i++) {
        sprites["standing"]["frames"].push(ASSETS_DIR + imgName + (i+1) + PNG_EXT);
    }
    // create object
    let imgObj = new My_Img_Animated(x, y, width, height, sprites);
    let hitBoxObj = undefined;
    if (type == "circle") {
        hitBoxObj = new HitBox_Circle(x, y, (width+height)/4)
    }
    else if (type == "mask") {
        hitBoxObj = new HitBox_Mask(x, y, ASSETS_DIR+imgName+"mask_v2"+PNG_EXT, width, height)
    }
    else if (type == "rect") {
        hitBoxObj = new HitBox_Rect(x, y, width, height)
    }
    new Obstacle(x, y, imgObj, hitBoxObj, "wall")

}



function create_tower(x, y, width = CNV10*0.8, height = CNV10*0.8) {
    // prepare sprites
    let imgName = "towers_";
    let nb = [6, 6, 7, 7, 8, 8, 7, 7];
    let sprites = {"standing": {"fps": 5, "frames": []}, "dying": {"fps": 5, "frames": []}};
    for (let i = 0; i < nb.length; i++) {
        sprites["standing"]["frames"].push(ASSETS_DIR + imgName + nb[i] + PNG_EXT);
    }
    for (let i = 0; i < 8; i++) {
        sprites["dying"]["frames"].push(ASSETS_DIR + "explosion_balle_" + (i+1) + PNG_EXT);
    }
    // create object
    let imgObj = new My_Img_Animated(x, y, width, height, sprites, sprites["standing"]["frames"][0]);
    let hitBoxObj = new HitBox_Mask(x, y, ASSETS_DIR+imgName+"mask_v2"+PNG_EXT, width, height)
    new Enemy_Turret(x, y, imgObj, hitBoxObj)
}



function create_player(x, y, auto = false, width = CNV10, height = CNV10*1.4) {
    // prepare sprites
    let imgPlayerName = "RedDeathFrame_";
    let sprites = {"standing": {"fps": 6, "frames": []}, "dying": {"fps": 6, "frames": []}};
    for (let i = 0; i < 5; i++) {
        sprites["standing"]["frames"].push(ASSETS_DIR + imgPlayerName + (i+1) + PNG_EXT);
    }
    for (let i = 0; i < 5; i++) {
        sprites["dying"]["frames"].push(ASSETS_DIR + "explosion_perso_" + (i+1) + PNG_EXT);
    }

    let imgAnimatedPlayer = new My_Img_Animated(x, y, width, height, sprites)
    let hitBoxPerso = new HitBox_Mask(x, y, ASSETS_DIR+imgPlayerName+"mask_v3"+PNG_EXT, width, height)
    // let hitBoxPerso = new HitBox_Circle(x, y, (width+height)/4)
    // let hitBoxPerso = new HitBox_Rect(x, y, width, height)
    // return new Player(x, y, imgAnimatedPlayer, hitBoxPerso, 15);
    if (auto) {
        return new Player_Auto(x, y, imgAnimatedPlayer, hitBoxPerso, CNV10*0.3);
    }
    else {
        return new Player(x, y, imgAnimatedPlayer, hitBoxPerso, CNV10*0.3);
    }
}



function create_obstacle(x, y, name, type, width = CNV10, height = CNV10) {
    let image = new My_Img(ASSETS_DIR+name+PNG_EXT, x, y, width, height);
    let hitBox = new HitBox_Mask(x, y, ASSETS_DIR+name+"_mask"+PNG_EXT, width, height);
    new Obstacle(x, y, image, hitBox, type);
}




function create_enemy_chasing(x, y, name = "BAT", width = CNV10*0.5, height = CNV10*0.5) {
    let sprites = {"standing": {"fps": 10, "frames": []}, "dying": {"fps": 10, "frames": []}};

    for (let i = 0; i < 3; i++) {
        sprites["standing"]["frames"].push(ASSETS_DIR + name + (i+1) + PNG_EXT);
    }

    for (let i = 0; i < 8; i++) {
        sprites["dying"]["frames"].push(ASSETS_DIR + "explosion_balle_" + (i+1) + PNG_EXT);
    }


    let enemyImage = new My_Img_Animated(x, y, width, height, sprites);
    //Hitbox sous forme de cercle
    // let enemyHitBox = new HitBox_Circle(x, y, (width+height)/4);
    let enemyHitBox = new HitBox_Mask(x, y, ASSETS_DIR + name + "_mask" + PNG_EXT, width, height);
    let object = My_Object.get_object("player");
    if (!object) {
        object = My_Object.get_object("player_auto")
    }
    if (!object || object.dying || object.dead) { return; }
    new Enemy_Chasing(x, y, enemyImage, enemyHitBox, CNV10*0.07, object);
}



function create_projectile(x, y, velX, velY, type = {"ally || enemy || ally spliter": undefined}, width = CNV10*0.4, height = CNV10*0.4) {
    // width = CNV10*0.7, height = CNV10*0.5
    // prepare sprites
    let sprites = {"standing": {"fps": 4, "frames": []}, "dying": {"fps": 4, "frames": []}};
    for (let i = 0; i < 4; i++) {
        sprites["standing"]["frames"].push(ASSETS_DIR + "fireballs_mid_" + (i+1) + PNG_EXT);
    }

    for (let i = 0; i < 8; i++) {
        sprites["dying"]["frames"].push(ASSETS_DIR + "explosion_balle_" + (i+1) + PNG_EXT);
    }

    let imgBall = new My_Img_Animated(x, y, width, height, sprites)
    let hitBoxBall = new HitBox_Mask(x, y, ASSETS_DIR + "fireballs_mid_mask" + PNG_EXT, width, height);
    if (type == "ally") {
        new Ally_Projectile(x, y, imgBall, hitBoxBall, CNV10*0.3, velX, velY);
    }
    else if (type == "ally spliter") {
        new Ally_Projectile_Spliter(x, y, imgBall, hitBoxBall, CNV10*0.3, velX, velY);
    }
    else if (type == "enemy") {
        new Enemy_Projectile(x, y, imgBall, hitBoxBall, CNV10*0.3, velX, velY);
    }
}




function create_moving_background(x, y, name, width = CNV.width*1.5, height = CNV.height*1.2) {
    let img = new My_Img(ASSETS_DIR+name+PNG_EXT, x, y, width, height);
    new Moving_Background(x, y, img, CNV10*0.02)
}



function create_timer(name, duration) {
    switch (name) {
        case "demo":
            new Timer_Launch_Demo(duration);
            break;
    
        case "main_menu":
            new Timer_Launch_Main_Menu(duration);
            break;
    
        default:
            console.log("Error: in create_object, in objects.js.")
            console.log("There is no timer called (\"" + name + "\").")
            break;
    }
}
