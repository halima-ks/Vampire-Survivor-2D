

export class My_Img {
    constructor(imgSrc, x, y, width = 25, height = 25) {
        this.imgSrc = imgSrc;

        //size
        this.width = width;
        this.height = height;

        //position
        this.x = x;
        this.y = y;

        //predefined Image class
        this.img = new Image();
        this.img.src = this.imgSrc;

        //dat.GUI
        this.visible = true;
    }


    draw(ctx) {
        if (this.visible) {
            ctx.drawImage(this.img, this.x, this.y, this.width, this.height);
        }
    }
}



//animated sprite with a SINGLE animation
export class My_Img_Animated extends My_Img {
    constructor(sprites, x = 0, y = 0, width = 25, height = 25, sprites_death = []) {
        super(sprites[0], x, y, width, height);
        this.sprites = sprites;
        this.sprites_death = sprites_death;

        this.dead = false;

        //dat.GUI
        this.animated = true;
    }

    // return 0 if there is no sprite left
    next_frame(loop = true) {
        if (this.sprites.length == 0) {
            this.dead = true;
            return 0;
        }
        if (!this.animated) {
            this.img.src = this.imgSrc;
            return 1;
        }

        let next = this.sprites.shift(); //remove the first list's element
        this.img.src = next;             //update current Img source
        if (loop) {
            this.sprites.push(next);     //push it at the end
        }
        return 1;
    }

    die() {
        this.sprites = this.sprites_death;
    }

}

