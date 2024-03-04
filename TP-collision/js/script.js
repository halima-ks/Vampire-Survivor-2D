/* Moteurs de jeu - L3B*/
/* TP-collision */
/* Valentin GUILLON & Cheïmâa FAKIH */


import { getRandom } from "./tools.js";
import { My_Img, My_Img_Animated } from "./imgs.js";
import { HitBox_Circle } from "./hitBox.js";
import { My_Object, Player_Object, Enemy_Turret_Object, Static_Object, Bonus_Object }
    from "./objects.js";


let cnv = document.getElementById("myCanvas");
let ctx = cnv.getContext("2d");

ctx.imageSmoothingEnabled = false;

let gui = new dat.gui.GUI();

let assetsDir = "assets/"
let pngExt = ".png";





//BACKGROUND
// image
let imgBackgroundName = "arena";
let spriteBackground = assetsDir + imgBackgroundName + pngExt;
let imgBackground = new My_Img(spriteBackground, 0, 0, cnv.width, cnv.height);



//PLAYER
// sprites
let imgPlayerName = "RedDeathFrame_";
let spritesPlayerDefault = [];
for (let i = 0; i < 5; i++) {
    spritesPlayerDefault.push(assetsDir + imgPlayerName + (i+1) + pngExt);
}
let spritesPlayerDead = [];
for (let i = 0; i < 5; i++) {
    spritesPlayerDead.push(assetsDir + "explosion_perso_" + (i+1) + pngExt);
}

// animated img
let imgAnimatedPlayer = new My_Img_Animated(spritesPlayerDefault, 10, 10, 30, 50, spritesPlayerDead)
// hitbox
let hitBoxPerso = new HitBox_Circle(
    imgAnimatedPlayer.x + (imgAnimatedPlayer.width / 2),
    imgAnimatedPlayer.y + (imgAnimatedPlayer.height / 2), 
    (imgAnimatedPlayer.width + imgAnimatedPlayer.height) / 5)
//object
let objectPlayer = new Player_Object(hitBoxPerso.x, hitBoxPerso.y, imgAnimatedPlayer, hitBoxPerso, 0, 0);


//OBSTACLES
// sprites 
let imgObstaclesName = "vassels_";
let spritesObstacles = [];
for (let i = 0; i < 6; i++) {
    spritesObstacles.push(assetsDir + imgObstaclesName + (i+1) + pngExt);
}

// génération d'obstacles
for (let i = 0; i < 15; i++) {
    let X = getRandom(0, cnv.width);
    let Y = getRandom(0, cnv.height);
    
    let distance = 0;
    while(distance < 120 || distance > 170) {
        X = getRandom(0, cnv.width);
        Y = getRandom(0, cnv.height);
        
        let distanceX = cnv.width/2 - X;
        let distanceY = cnv.height/2 - Y;
        distance = Math.sqrt((distanceX * distanceX) + (distanceY * distanceY));
    }
    
    // animated img
    let imgAnimatedObstacle = new My_Img_Animated(spritesObstacles, X - 15, Y - 15, 30, 30);
    // hitbox
    let hitBoxObstacle = new HitBox_Circle(X, Y, (imgAnimatedObstacle.width + imgAnimatedObstacle.height) / 4);
    // object
    new Static_Object(X, Y, imgAnimatedObstacle, hitBoxObstacle, 0, 0);
}


//TOWERS
// sprites
let imgTowersName = "towers_";
let spritesTowers = [];
let numbers = [6, 6, 7, 7, 8, 8, 7, 7];
for (let i = 0; i < 8; i++) {
    spritesTowers.push(assetsDir + imgTowersName + numbers[i] + pngExt);
}

for (let i = 0; i < 1; i++) {
    let X = cnv.width/2;
    let Y = cnv.height/2;
    
    // animated img
    let imgAnimatedTowers = new My_Img_Animated(spritesTowers, X - 60/2, Y - 60/2, 60, 60)
    // hitBox
    let hitBoxTower = new HitBox_Circle(X, Y - 20, 
        (imgAnimatedTowers.width + imgAnimatedTowers.height) / 10)
    // object
    let tower = new Enemy_Turret_Object(X, Y, imgAnimatedTowers, hitBoxTower, 0, 0);
}

//BONUS
// sprites
let imgBonus = "stars_";
let spritesBonus = [];
let numbers_ = [1, 1, 1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 4, 3, 3, 3, 2, 2, 2];
for (let i = 0; i < numbers_.length; i++) {
    spritesBonus.push(assetsDir + imgBonus + numbers_[i] + pngExt);
}

let bonus_pos = [
    cnv.width - 30, 30,
    30, cnv.height -30,
    cnv.width - 30, cnv.height -30
]
for (let i = 0; i < 6; i+=2)
{
    let X = bonus_pos[i]
    let Y = bonus_pos[i+1]

    let imgBonus = new My_Img_Animated(spritesBonus, X - 20, Y - 20, 40, 40)
    let hitBoxBonus = new HitBox_Circle(X, Y, 20)
        
    //object
    new Bonus_Object(X, Y, imgBonus, hitBoxBonus, 0, 0)
}




// dat.GUI Folder
let backgroundFolder = gui.addFolder("Background")
backgroundFolder.add(imgBackground, "visible")

// dat.GUI folder
let persoFolder = gui.addFolder("Perso")
persoFolder.add(imgAnimatedPlayer, "x", 0, cnv.width - imgAnimatedPlayer.width, 1)
persoFolder.add(imgAnimatedPlayer, "y", 0, cnv.height - imgAnimatedPlayer.height, 1)
persoFolder.add(imgAnimatedPlayer, "width", 10, cnv.width, 1)
persoFolder.add(imgAnimatedPlayer, "height", 10, cnv.height, 1)
persoFolder.add(imgAnimatedPlayer, "animated")
persoFolder.add(imgAnimatedPlayer, "visible")
persoFolder.add(objectPlayer.hitBox, "collision")
persoFolder.add(objectPlayer.hitBox, "contours")


function update_bools_all_objects() {
    for (const obj of My_Object.instances) {
        obj.update_bool();
    }
}

// dat.GUI folder
let objectsFolder = gui.addFolder("Objects")
// objectsFolder.open();
objectsFolder.add(My_Object, "imgVisible").onChange(val => { update_bools_all_objects() } )
objectsFolder.add(My_Object, "collision").onChange(val => { update_bools_all_objects() } )
objectsFolder.add(My_Object, "hitBoxVisible").onChange(val => { update_bools_all_objects() } )
objectsFolder.add(My_Object, "moving").onChange(val =>{ update_bools_all_objects() } )




function updateGui() {
    backgroundFolder.updateDisplay();
    persoFolder.updateDisplay();
}





// KEYS DETECTION
var key_map = {};
onkeydown = onkeyup = function(e){
    key_map[e.key] = e.type == 'keydown';
}


function execute_inputs() {
    // objectPlayer.save_position()
    for (const key in key_map) {
        //touche non pressée
        if (!key_map[key]) { continue; }

        //touche pressée
        switch (key) {
            case "z":
                objectPlayer.move(cnv, "up")
                break;
            case "q":
                objectPlayer.move(cnv, "left")
                break;
            case "s":
                objectPlayer.move(cnv, "down")
                break;
            case "d":
                objectPlayer.move(cnv, "right")
                break;
        }
    }
}





function clear_dead_objects() {
    for (const dead_obj of My_Object.instances_dead) {
        let valeurASupprimer = dead_obj;

        let nouvelleListe = My_Object.instances.filter(function(element) {
            return element !== valeurASupprimer;
        });
        My_Object.instances = nouvelleListe;
    }
    My_Object.instances_dead = [];
}



let tempo = 0;
function animations() {
    //animation for Player (when alive)
    if (tempo == 2) {
        if (!objectPlayer.dying) {
            imgAnimatedPlayer.next_frame();
            tempo = 0;
        }
    }
    tempo++;

    for (const obj of My_Object.instances) {
        if (obj.object_image instanceof My_Img_Animated) {
            //let player animate when dying
            if (obj.group == "player") { if (!obj.dying) { continue; } }
            let loop = true;
            if (obj.dying) { loop = false; }
            obj.object_image.next_frame(loop);
        }
    }
}

function actions() {
    for (const obj of My_Object.instances) {
        obj.action(cnv);
    }
}

function draw() {
    ctx.clearRect(0, 0, cnv.width, cnv.height);
    imgBackground.draw(ctx);

    for (const obj of My_Object.instances) {
        obj.draw(ctx);
    }
}

function update() {
    animations();
    actions();
    draw();

    execute_inputs()
    clear_dead_objects();
    
    updateGui();
}



setInterval(update, 100);
