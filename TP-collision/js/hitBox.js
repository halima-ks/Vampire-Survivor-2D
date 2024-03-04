

export class HitBox_Circle {
    constructor(x, y, radius) {
        this.x = x;
        this.y = y;
        this.radius = radius;

        //dat.GUI
        this.collision = true;
        this.contours = false;
    }


    is_colliding(obj) {
        if (!this.collision) { return false; }

        let distanceX = this.x - obj.x;
        let distanceY = this.y - obj.y;
        let distance = Math.sqrt((distanceX * distanceX) + (distanceY * distanceY));

        return distance < this.radius + obj.radius;
    }


    draw_contours(ctx) {
        if (!this.contours) { return; }

        let thickness = 2;
        let color = "#FF0000";
        if (!this.collision) {
            thickness = 2;
            color = "#FF0000AA";
        }

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, 2*Math.PI);
        ctx.lineWidth = thickness;
        ctx.strokeStyle = color;
        ctx.stroke();
        ctx.closePath();
    }
}

