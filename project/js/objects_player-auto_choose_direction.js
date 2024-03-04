
export class Player_Auto extends Player {
    constructor(xCenter, yCenter, image, hitBox, speed) {
        super(xCenter, yCenter, image, hitBox, speed);
        this.group = "player_auto";
    }

    generate_on_death() {
        create_menu("play_demo", false);
    }
    
    auto_actions(timestamp) {
        this.update_velocity(0, 0);
        this.tirer(timestamp);
        this.choose_direction();
    }
    
    
    //define the velocity based on nearest enemy and bonus
    choose_direction() {
        const good = ["bonus"];
        const bad = ["obstacle", "enemy_turret", "enemy_projectile", "enemy_chasing"]
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
        let near_bad = [];
        const nb_bads = 3;
        for (let i = 0; i < nb_bads; i++) { near_bad.push({"obj": undefined, "dist": undefined}); }
    
        let near_dist = undefined;
        //good
        for (const obj of go_to) {
            let dist = distance(obj.x, obj.y, this.x, this.y);
            if (near_dist == undefined || dist < near_dist) {
                near_dist = dist;
                near_good = obj;
            }
        }

        //bad
        function push_bad(bad, dist) {
            for (let i = 0; i < nb_bads; i++) {
                if (bad == near_bad[i].obj) { return;}
                if (near_bad[i].obj == undefined) {
                    near_bad[i].obj = bad;
                    near_bad[i].dist = dist;
                    return;
                }
                if (dist < near_bad[i].dist) {
                    const temp = near_bad[i];
                    near_bad[i].obj = bad;
                    near_bad[i].dist = dist;
                    push_bad(temp.obj, temp.dist);
                    return;
                }
            }
        }
        for (const obj of flee_to) {
            let dist = distance(obj.x, obj.y, this.x, this.y);
            for (let i = 0; i < nb_bads; i++) {
                push_bad(obj, dist);
            }
        }
    
        //final direction
        let dir_good = {"x": 0, "y": 0};
        let dir_bad = {"x": 0, "y": 0};
        
        if (near_good) {
            dir_good = direction(this.x, this.y, near_good.x, near_good.y);
        }
        if (near_bad) {
            for (let i = 0; i < nb_bads; i++) {
                if (near_bad[i].obj == undefined) { break; }
                let temp = direction(near_bad[i].obj.x, near_bad[i].obj.y, this.x, this.y)
                // dir_bad = direction(near_bad.x, near_bad.y, this.x, this.y);
                dir_bad.x += temp.x;
                dir_bad.y += temp.y;
            }
        }
        dir_bad = normalize(dir_bad.x, dir_bad.y, true);
        
        //add weight
        if (near_good && near_bad[0].obj != undefined) {
            let dist_bad = distance(this.x, this.y, near_bad[0].obj.x, near_bad[0].obj.y);
            if (dist_bad < CNV.width*0.1) {
                weight = 0.6;
            }
        }

        this.update_velocity(dir_good.x*weight + dir_bad.x, dir_good.y*weight + dir_bad.y);
    }
}
