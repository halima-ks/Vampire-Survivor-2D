

import { My_Img, My_Img_Animated } from "./imgs.js"
import { HitBox_Circle } from "./hitBox.js";
import { getRandom } from "./tools.js";


let assetsDir = "assets/"
let pngExt = ".png";




// return 1 to allow next actions, 0 to not.
function check_collisions(obj, other_objects) {
    for (const other of other_objects) {
        if (other == obj) { continue; }
        if (other.dead) { continue; }

        if (!(other.hitBox.is_colliding(obj.hitBox))) { continue; }

        switch (obj.group) {
            case "player":
                switch(other.group) {
                    case "projectile":
                        obj.die();
                        other.die();
                        return 0;
                    case "enemy_turret":
                        obj.die();
                        return 0;
                    case "bonus":
                        obj.invincible = true;
                        return 1;
                    case "static":
                        obj.recul(other)
                        // obj.roll_back(other);
                        return 1;
                    default:
                        return 1;
                }
            case "enemy_turret":
                switch(other.group) {
                    case "player":
                        obj.shoot = false;
                        obj.die();
                        return 0;
                    default:
                        return 1;
                }
            case "projectile":
                switch (other.group) {
                    case "static":
                        obj.die();
                        return 0;
                    case "player":
                        obj.die();
                        return 0;
                    default:
                        return 1;
                }
            case "bonus":
                switch (other.group) {
                    case "player":
                        obj.die()
                        return 0;
                    default:
                        return 1;
                }
            default:
                return 1;
        
        }
    }

    return 1;
}



export class My_Object {
    constructor(x, y, object_image, hitBox, group = "", velocityX = 1.0, velocityY = 0.0) {
        this.x = x;
        this.y = y;
        this.previousX = x;
        this.previousY = y;
        this.object_image = object_image;
        this.hitBox = hitBox;

        this.speed = 10;
        this.velocityX = velocityX; //between -1 and 1
        this.velocityY = velocityY; //between -1 and 1

        this.group = group; //"player", "enemy", "static"
        this.invincible = false;
        this.duration = 30;
        this.timer = 0;

        this.id = -1;

        this.stop = false;
        this.dying = false;
        this.dead = false;

        this.addInstance();
        this.update_bool();
    }

    static instances = [];
    static instances_dead = [];
    static id = 0;
    static imgVisible = true;
    static collision = true;
    static hitBoxVisible = false;
    static moving = true;


    update() {
        if (this.invincible) {
            this.timer++;
            if (this.timer == this.duration) {
                this.timer = 0;
                this.invincible = false;
            }
        }

        if (this.dead) { return; }
        if (!this.dying) { return; }

        if (this.object_image instanceof My_Img_Animated) {
            if (this.object_image.dead) {
                this.dead = true;
            }
        }
        else {
            this.dead = true;
        }

        if (this.dead) {
            My_Object.instances_dead.push(this);
        }
    }

    update_position(add_X, add_Y) {
        this.x += add_X;
        this.y += add_Y;
        this.object_image.x += add_X;
        this.object_image.y += add_Y;
        this.hitBox.x += add_X;
        this.hitBox.y += add_Y;
    }

    save_position() {
        this.previousX = this.x;
        this.previousY = this.y;
    }

    update_bool() {
        this.object_image.visible = My_Object.imgVisible;
        this.stop = !My_Object.moving;
        this.hitBox.contours = My_Object.hitBoxVisible;
        if (this.dead || this.dying) { return; }
        this.hitBox.collision = My_Object.collision;
    }

    addInstance() {
        if (this.id != -1) {
            console.log("This obj already added:")
            console.log(this)
            return;
        }

        this.id = My_Object.id;
        My_Object.id++;
        My_Object.instances.push(this);
    }


    draw(ctx) {
        if (this.dead) { return ; }
        this.object_image.draw(ctx);
        if (this.invincible) {
            this.draw_invincible(ctx);
        }
        this.hitBox.draw_contours(ctx);
    }

    draw_invincible(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.hitBox.radius + 2, 0, 2*Math.PI);
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#9e9e97";
        ctx.stroke();
        ctx.closePath();
    }


    action(cnv) {
        this.update();
        
        if (this.dead) { return; }
        if (this.dying) { return; }
        if (this.stop) { return; }
        
        let continu = check_collisions(this, My_Object.instances);
        if (!continu) { return; }

        this.save_position()

        this.auto_actions(cnv);
    }

    //la suite de this.action. Pour les sous-classes.
    auto_actions(cnv) {
        return;
    }


    recul(obj) {
        let reculX = this.speed;
        let reculY = this.speed;

        if (this.x < obj.x) {
            reculX *= -1;
        }
        if (this.y < obj.y) {
            reculY *= -1;
        }

        this.update_position(reculX, reculY)
    }

    
    //WIP, to replace recul()
    //a diagonal must must allow one movement
    //ex: if the wall is on right, a right-up step must allow an up step.
    //DONE
    //ça fait chier si la nouvelle position est dans une autre collision
    roll_back(other) {
        let x_diff = this.previousX - this.x;
        let y_diff = this.previousY - this.y;

        let allowed = false;
        //test roll back x
        this.update_position(x_diff, 0);
        if (!(other.hitBox.is_colliding(this.hitBox))) { allowed = true; }
        //test roll back y
        if (!allowed) {
            this.update_position(-x_diff, y_diff);
        }
        if (other.hitBox.is_colliding(this.hitBox)) { console.log("bro ?")}
    }


    rebond() {
        this.velocityX *= -1;
        this.velocityY *= -1;
    }


    die() {
        if (this.invincible) { return; }
        this.collision = false;
        this.hitBox.collision = false;
        this.dying = true;
        if (this.object_image instanceof My_Img_Animated) {
            this.object_image.die();
        }
    }
}





export class Static_Object extends My_Object {
    constructor(x, y, object_image, hitBox, velocityX = 1.0, velocityY = 0.0) {
        super(x, y, object_image, hitBox, "static", velocityX, velocityY);
    }
}


export class Player_Object extends My_Object {
    constructor(x, y, object_image, hitBox, velocityX = 1.0, velocityY = 0.0) {
        super(x, y, object_image, hitBox, "player", velocityX, velocityY);
    }


    move(cnv, direction = "") {
        if (this.dead) { return; }
        if (this.dying) { return; }

        let limit_right = cnv.width;
        let limit_down = cnv.height;

        //update position
        switch (direction) {
            case "down":
                this.update_position(0, this.speed)
                break;
            case "up":
                this.update_position(0, -this.speed)
                break
            case "right":
                this.update_position(this.speed, 0)
                break
            case "left":
                this.update_position(-this.speed, 0)
                break
            default:
                console.log("error: player must have an allowed direction.")
        }


        //out of screen
        if (this.x > limit_right) {
            this.update_position(-limit_right, 0)
        }
        else if (this.x < 0) {
            this.update_position(limit_right, 0)
        }
        if (this.y > limit_down) {
            this.update_position(0, -limit_down)
        }
        else if (this.y < 0) {
            this.update_position(0, limit_down)
        }

    }

}


export class Enemy_Turret_Object extends My_Object {
    constructor(x, y, object_image, hitBox, velocityX = 1.0, velocityY = 0.0) {
        super(x, y, object_image, hitBox, "enemy_turret", velocityX, velocityY);
        this.shoot = true;
        this.rate_of_fire = 1;
        this.intervale = 0;
    }

    auto_actions(cnv) {
        this.tirer();
    }


    projectile(x, y){
        let velX = Math.random();
        let velY = Math.random();
        if (getRandom(0, 1)) {
            velX *= -1;
        }
        if (getRandom(0, 1)) {
            velY *= -1;
        }
        let sprite_ball_src = [];
        for (let i = 0; i < 4; i++) {
            sprite_ball_src.push(assetsDir + "fireballs_mid_" + (i+1) + pngExt);
        }

        let sprites_explosion_src = [];
        for (let i = 0; i < 8; i++) {
            sprites_explosion_src.push(assetsDir + "explosion_balle_" + (i+1) + pngExt);
        }

        let imgBall = new My_Img_Animated(sprite_ball_src, x-10, y-7.5, 20, 15, sprites_explosion_src)
        let hitBoxBall = new HitBox_Circle(x, y, (imgBall.height + imgBall.width) / 4);
        new Projectile_Object(x, y, imgBall, hitBoxBall, velX, velY);

    }

    tirer(){
        if (!this.shoot) { return; }
        if (!My_Object.moving) { return; }

        if (this.intervale == this.rate_of_fire){
            this.projectile(this.x, this.y - 20);
            this.intervale = 0;
        }
        this.intervale++;
    }
}


export class Projectile_Object extends My_Object {
    constructor(x, y, object_image, hitBox, velocityX = 1.0, velocityY = 0.0) {
        super(x, y, object_image, hitBox, "projectile", velocityX, velocityY);
    }

    auto_actions(cnv) {
        this.move(cnv);
    }

    move(cnv) {
        if (this.dead) { return; }
        if (this.dying) { return; }

        let limit_right = cnv.width;
        let limit_down = cnv.height;

        //update position
        this.update_position(this.speed * this.velocityX, this.speed * this.velocityY);


        //out of screen
        let out_right = this.x > limit_right;
        let out_left = this.x < 0;
        let out_down = this.y > limit_down;
        let out_up = this.y < 0;
        if (out_right || out_left || out_down || out_up) {
            this.die()
        }
    }
}


export class Bonus_Object extends My_Object {
    constructor(x, y, object_image, hitBox, velocityX = 1.0, velocityY = 0.0) {
        super(x, y, object_image, hitBox, "bonus", velocityX, velocityY);
    }
}

