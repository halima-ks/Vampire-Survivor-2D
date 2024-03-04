
import { CNV, CTX, ASSETS_DIR } from "./script.js";


export function getRandom(min, max) {
    return Math.round(Math.random() * (max - min) + min);
}


export function distance(x1, y1, x2, y2) {
    let X = x1 - x2;
    let Y = y1 - y2;
    return Math.sqrt((X*X) + (Y*Y));
}


export function direction(fromX, fromY, toX, toY) {
    const dist = distance(fromX, fromY, toX, toY);
    const dirX = (toX - fromX) / dist
    const dirY = (toY - fromY) / dist
    return {"x": dirX, "y": dirY};
}


export function normalize(x, y) {
    if (x == 0 && y == 0) { return {"x": 0, "y": 0}; }

    const hypothenuse = Math.sqrt((x*x) + (y*y));

    x /= hypothenuse;
    y /= hypothenuse;

    return {"x": x, "y": y};
}


export function convert(A, B, C) {
    //by ChatGPT
    // Convert each integer to a hexadecimal string and pad with zeros if needed
    const hexA = A.toString(16).padStart(2, '0');
    const hexB = B.toString(16).padStart(2, '0');
    const hexC = C.toString(16).padStart(2, '0');

    // Concatenate the hexadecimal strings
    const result = "#" + hexA + hexB + hexC;

    return result.toUpperCase(); // Convert to uppercase as your example result is in uppercase
}


export function is_in_rect(x, y, x1, y1, x2, y2) {
    let in_x = x > x1 && x <= x2;
    let in_y = y > y1 && y <= y2;
    return in_x && in_y;
}


export function is_out_of_screen(x, y) {
    return !is_in_rect(x, y, 0, 0, CNV.width, CNV.height);
}


export function rect_is_in_rect(rect1, rect2) {
    // check if a corner of rect1 is inside rect2
    const positions = [
        {"x": rect1.x1, "y": rect1.y1},
        {"x": rect1.x1, "y": rect1.y2},
        {"x": rect1.x2, "y": rect1.y1},
        {"x": rect1.x2, "y": rect1.y2},
    ]
    for (const pos of positions) {
        if (is_in_rect(pos.x, pos.y, rect2.x1, rect2.y1, rect2.x2, rect2.y2)) {
            return true;
        }
    }

    //check if rectangles overlaps
    let overlapX = rect1.x2 >= rect2.x1 && rect1.x1 < rect2.x2
    let overlapY = rect1.y2 >= rect2.y1 && rect1.y1 < rect2.y2
    let englobeX = rect1.x1 < rect2.x1 && rect1.x2 > rect2.x2
    let englobeY = rect1.y1 < rect2.y1 && rect1.y2 > rect2.y2
    let insideX = rect1.x1 > rect2.x1 && rect1.x2 < rect2.x2
    let insideY = rect1.y1 > rect2.y1 && rect1.y2 < rect2.y2
    if ((overlapX && overlapY) ||
        ((englobeX || insideX || overlapX) && (englobeY || insideY || overlapY))
    ) { return true; }
}


export function circle_is_in_rect(circle, rect) {
    // Function to check if a point (x, y) is inside the rectangle
    function isPointInRect(x, y, rect) {
        return x >= rect.x1 && x <= rect.x2 && y >= rect.y1 && y <= rect.y2;
    }

    // Function to calculate the closest point on the rectangle to the circle
    function closestPointInRect(circle, rect) {
        let closestX = Math.max(rect.x1, Math.min(circle.x, rect.x2));
        let closestY = Math.max(rect.y1, Math.min(circle.y, rect.y2));
        return { x: closestX, y: closestY };
    }

    // Check if the center of the circle is inside the rectangle
    if (isPointInRect(circle.x, circle.y, rect)) {
        return true;
    }

    // Calculate the closest point on the rectangle to the circle
    const closestPoint = closestPointInRect(circle, rect);

    // Check if the closest point is inside the circle
    const distance = Math.sqrt((circle.x - closestPoint.x) ** 2 + (circle.y - closestPoint.y) ** 2);
    return distance < circle.radius;
}


export function min(a, b) {
    if (a < b) { return a; }
    return b;
}




export function draw_all_images() {
    const files = ["background/game-over_1.png", "background/game-over_2.png", "background/game-over_3.png", "background/home_1.png", "background/home_2.png", "background/home_3.png", "background/main-menu_biome_1_1_blur.png", "background/main-menu_biome_1_2_blur.png", "background/main-menu_biome_1_3_blur.png", "background/main-menu_biome_2_1_blur.png", "background/main-menu_biome_2_2_blur.png", "background/main-menu_biome_2_3_blur.png", "background/main-menu_biome_3_1_blur.png", "background/main-menu_biome_3_2_blur.png", "background/main-menu_biome_3_3_blur.png", "BAT1.png", "BAT2.png", "BAT3.png", "BAT_mask.png", "bonus_gatling_off_v2.png", "bonus_gatling_on_v2.png", "bonus_invicibility_off_v2.png", "bonus_invicibility_on_v2.png", "bonus_spliter_off_v2.png", "bonus_spliter_on_v2.png", "btn_demo_hover.png", "btn_demo.png", "btn_play_hover.png", "btn_play.png", "close.png", "explosion_balle_0.png", "explosion_balle_1.png", "explosion_balle_2.png", "explosion_balle_3.png", "explosion_balle_4.png", "explosion_balle_5.png", "explosion_balle_6.png", "explosion_balle_7.png", "explosion_balle_8.png", "explosion_perso_0.png", "explosion_perso_1.png", "explosion_perso_2.png", "explosion_perso_3.png", "explosion_perso_4.png", "explosion_perso_5.png", "fireballs_mid_1.png", "fireballs_mid_2.png", "fireballs_mid_3.png", "fireballs_mid_4.png", "fireballs_mid_mask.png", "frame_down-left.png", "frame_down.png", "frame_down-right.png", "frame_left.png", "frame_mid.png", "frame_right.png", "frame_up-left.png", "frame_up.png", "frame_up-right.png", "in-game_lugubre_v0.1.mp3", "main-menu_v1.mp3", "RedDeathFrame_1.png", "RedDeathFrame_2.png", "RedDeathFrame_3.png", "RedDeathFrame_4.png", "RedDeathFrame_5.png", "RedDeathFrame_mask_v1.png", "RedDeathFrame_mask_v2.png", "RedDeathFrame_mask_v3.png", "sound_off.png", "sound_on.png", "stars_1.png", "stars_2.png", "stars_3.png", "stars_4.png", "stars_mask_v1.png", "stars_mask_v2.png", "terrain/ground/dark_rock/1.png", "terrain/ground/dark_rock/2.png", "terrain/ground/dark_rock/3.png", "terrain/ground/dark_rock/4.png", "terrain/ground/herb/1.png", "terrain/ground/herb/2.png", "terrain/ground/herb/3.png", "terrain/ground/herb/4.png", "terrain/ground/herb 2/1.png", "terrain/ground/herb 2/2.png", "terrain/ground/herb 2/3.png", "terrain/ground/herb 2/4.png", "terrain/hole/crevasse 1/corner_bot-left_mask.png", "terrain/hole/crevasse 1/corner_bot-left.png", "terrain/hole/crevasse 1/corner_bot-right_mask.png", "terrain/hole/crevasse 1/corner_bot-right.png", "terrain/hole/crevasse 1/corner_top-left_mask.png", "terrain/hole/crevasse 1/corner_top-left.png", "terrain/hole/crevasse 1/corner_top-right_mask.png", "terrain/hole/crevasse 1/corner_top-right.png", "terrain/hole/crevasse 1/mid_1_mask.png", "terrain/hole/crevasse 1/mid_1.png", "terrain/hole/crevasse 1/mid_2_mask.png", "terrain/hole/crevasse 1/mid_2.png", "terrain/hole/crevasse 1/mid_3_mask.png", "terrain/hole/crevasse 1/mid_3.png", "terrain/hole/crevasse 1/mid_4_mask.png", "terrain/hole/crevasse 1/mid_4.png", "terrain/hole/crevasse 1/side_bot_mask.png", "terrain/hole/crevasse 1/side_bot.png", "terrain/hole/crevasse 1/side_left_mask.png", "terrain/hole/crevasse 1/side_left.png", "terrain/hole/crevasse 1/side_right_mask.png", "terrain/hole/crevasse 1/side_right.png", "terrain/hole/crevasse 1/side_top_mask.png", "terrain/hole/crevasse 1/side_top.png", "terrain/hole/crevasse 1/terrain_part.png", "terrain/hole/crevasse 1/virage_bot-left_mask.png", "terrain/hole/crevasse 1/virage_bot-left.png", "terrain/hole/crevasse 1/virage_bot-right_mask.png", "terrain/hole/crevasse 1/virage_bot-right.png", "terrain/hole/crevasse 1/virage_top-left_mask.png", "terrain/hole/crevasse 1/virage_top-left.png", "terrain/hole/crevasse 1/virage_top-right_mask.png", "terrain/hole/crevasse 1/virage_top-right.png", "terrain/hole/lava/corner_bot-left_mask.png", "terrain/hole/lava/corner_bot-left.png", "terrain/hole/lava/corner_bot-right_mask.png", "terrain/hole/lava/corner_bot-right.png", "terrain/hole/lava/corner_top-left_mask.png", "terrain/hole/lava/corner_top-left.png", "terrain/hole/lava/corner_top-right_mask.png", "terrain/hole/lava/corner_top-right.png", "terrain/hole/lava/mid_1_mask.png", "terrain/hole/lava/mid_1.png", "terrain/hole/lava/mid_2_mask.png", "terrain/hole/lava/mid_2.png", "terrain/hole/lava/mid_3_mask.png", "terrain/hole/lava/mid_3.png", "terrain/hole/lava/mid_4_mask.png", "terrain/hole/lava/mid_4.png", "terrain/hole/lava/side_bot_mask.png", "terrain/hole/lava/side_bot.png", "terrain/hole/lava/side_left_mask.png", "terrain/hole/lava/side_left.png", "terrain/hole/lava/side_right_mask.png", "terrain/hole/lava/side_right.png", "terrain/hole/lava/side_top_mask.png", "terrain/hole/lava/side_top.png", "terrain/hole/lava/virage_bot-left_mask.png", "terrain/hole/lava/virage_bot-left.png", "terrain/hole/lava/virage_bot-right_mask.png", "terrain/hole/lava/virage_bot-right.png", "terrain/hole/lava/virage_top-left_mask.png", "terrain/hole/lava/virage_top-left.png", "terrain/hole/lava/virage_top-right_mask.png", "terrain/hole/lava/virage_top-right.png", "terrain/hole/water 1/corner_bot-left_mask.png", "terrain/hole/water 1/corner_bot-left.png", "terrain/hole/water 1/corner_bot-right_mask.png", "terrain/hole/water 1/corner_bot-right.png", "terrain/hole/water 1/corner_top-left_mask.png", "terrain/hole/water 1/corner_top-left.png", "terrain/hole/water 1/corner_top-right_mask.png", "terrain/hole/water 1/corner_top-right.png", "terrain/hole/water 1/mid_1_mask.png", "terrain/hole/water 1/mid_1.png", "terrain/hole/water 1/mid_2_mask.png", "terrain/hole/water 1/mid_2.png", "terrain/hole/water 1/mid_3_mask.png", "terrain/hole/water 1/mid_3.png", "terrain/hole/water 1/mid_4_mask.png", "terrain/hole/water 1/mid_4.png", "terrain/hole/water 1/side_bot_mask.png", "terrain/hole/water 1/side_bot.png", "terrain/hole/water 1/side_left_mask.png", "terrain/hole/water 1/side_left.png", "terrain/hole/water 1/side_right_mask.png", "terrain/hole/water 1/side_right.png", "terrain/hole/water 1/side_top_mask.png", "terrain/hole/water 1/side_top.png", "terrain/hole/water 1/virage_bot-left_mask.png", "terrain/hole/water 1/virage_bot-left.png", "terrain/hole/water 1/virage_bot-right_mask.png", "terrain/hole/water 1/virage_bot-right.png", "terrain/hole/water 1/virage_top-left_mask.png", "terrain/hole/water 1/virage_top-left.png", "terrain/hole/water 1/virage_top-right_mask.png", "terrain/hole/water 1/virage_top-right.png", "terrain/hole/water 2/corner_bot-left_mask.png", "terrain/hole/water 2/corner_bot-left.png", "terrain/hole/water 2/corner_bot-right_mask.png", "terrain/hole/water 2/corner_bot-right.png", "terrain/hole/water 2/corner_top-left_mask.png", "terrain/hole/water 2/corner_top-left.png", "terrain/hole/water 2/corner_top-right_mask.png", "terrain/hole/water 2/corner_top-right.png", "terrain/hole/water 2/mid_1_mask.png", "terrain/hole/water 2/mid_1.png", "terrain/hole/water 2/mid_2_mask.png", "terrain/hole/water 2/mid_2.png", "terrain/hole/water 2/mid_3_mask.png", "terrain/hole/water 2/mid_3.png", "terrain/hole/water 2/mid_4_mask.png", "terrain/hole/water 2/mid_4.png", "terrain/hole/water 2/side_bot_mask.png", "terrain/hole/water 2/side_bot.png", "terrain/hole/water 2/side_left_mask.png", "terrain/hole/water 2/side_left.png", "terrain/hole/water 2/side_right_mask.png", "terrain/hole/water 2/side_right.png", "terrain/hole/water 2/side_top_mask.png", "terrain/hole/water 2/side_top.png", "terrain/hole/water 2/virage_bot-left_mask.png", "terrain/hole/water 2/virage_bot-left.png", "terrain/hole/water 2/virage_bot-right_mask.png", "terrain/hole/water 2/virage_bot-right.png", "terrain/hole/water 2/virage_top-left_mask.png", "terrain/hole/water 2/virage_top-left.png", "terrain/hole/water 2/virage_top-right_mask.png", "terrain/hole/water 2/virage_top-right.png", "terrain/obstacle/bush/corner_bot-left_mask.png", "terrain/obstacle/bush/corner_bot-left.png", "terrain/obstacle/bush/corner_bot-right_mask.png", "terrain/obstacle/bush/corner_bot-right.png", "terrain/obstacle/bush/corner_top-left_mask.png", "terrain/obstacle/bush/corner_top-left.png", "terrain/obstacle/bush/corner_top-right_mask.png", "terrain/obstacle/bush/corner_top-right.png", "terrain/obstacle/bush/mid_1_mask.png", "terrain/obstacle/bush/mid_1.png", "terrain/obstacle/bush/mid_2_mask.png", "terrain/obstacle/bush/mid_2.png", "terrain/obstacle/bush/mid_3_mask.png", "terrain/obstacle/bush/mid_3.png", "terrain/obstacle/bush/mid_4_mask.png", "terrain/obstacle/bush/mid_4.png", "terrain/obstacle/bush/side_bot_mask.png", "terrain/obstacle/bush/side_bot.png", "terrain/obstacle/bush/side_left_mask.png", "terrain/obstacle/bush/side_left.png", "terrain/obstacle/bush/side_right_mask.png", "terrain/obstacle/bush/side_right.png", "terrain/obstacle/bush/side_top_mask.png", "terrain/obstacle/bush/side_top.png", "terrain/obstacle/bush/virage_bot-left_mask.png", "terrain/obstacle/bush/virage_bot-left.png", "terrain/obstacle/bush/virage_bot-right_mask.png", "terrain/obstacle/bush/virage_bot-right.png", "terrain/obstacle/bush/virage_top-left_mask.png", "terrain/obstacle/bush/virage_top-left.png", "terrain/obstacle/bush/virage_top-right_mask.png", "terrain/obstacle/bush/virage_top-right.png", "terrain/obstacle/bush 2/corner_bot-left_mask.png", "terrain/obstacle/bush 2/corner_bot-left.png", "terrain/obstacle/bush 2/corner_bot-right_mask.png", "terrain/obstacle/bush 2/corner_bot-right.png", "terrain/obstacle/bush 2/corner_top-left_mask.png", "terrain/obstacle/bush 2/corner_top-left.png", "terrain/obstacle/bush 2/corner_top-right_mask.png", "terrain/obstacle/bush 2/corner_top-right.png", "terrain/obstacle/bush 2/mid_1_mask.png", "terrain/obstacle/bush 2/mid_1.png", "terrain/obstacle/bush 2/mid_2_mask.png", "terrain/obstacle/bush 2/mid_2.png", "terrain/obstacle/bush 2/mid_3_mask.png", "terrain/obstacle/bush 2/mid_3.png", "terrain/obstacle/bush 2/mid_4_mask.png", "terrain/obstacle/bush 2/mid_4.png", "terrain/obstacle/bush 2/side_bot_mask.png", "terrain/obstacle/bush 2/side_bot.png", "terrain/obstacle/bush 2/side_left_mask.png", "terrain/obstacle/bush 2/side_left.png", "terrain/obstacle/bush 2/side_right_mask.png", "terrain/obstacle/bush 2/side_right.png", "terrain/obstacle/bush 2/side_top_mask.png", "terrain/obstacle/bush 2/side_top.png", "terrain/obstacle/bush 2/virage_bot-left_mask.png", "terrain/obstacle/bush 2/virage_bot-left.png", "terrain/obstacle/bush 2/virage_bot-right_mask.png", "terrain/obstacle/bush 2/virage_bot-right.png", "terrain/obstacle/bush 2/virage_top-left_mask.png", "terrain/obstacle/bush 2/virage_top-left.png", "terrain/obstacle/bush 2/virage_top-right_mask.png", "terrain/obstacle/bush 2/virage_top-right.png", "terrain/obstacle/wall_rock/corner_bot-left_mask.png", "terrain/obstacle/wall_rock/corner_bot-left.png", "terrain/obstacle/wall_rock/corner_bot-right_mask.png", "terrain/obstacle/wall_rock/corner_bot-right.png", "terrain/obstacle/wall_rock/corner_top-left_mask.png", "terrain/obstacle/wall_rock/corner_top-left.png", "terrain/obstacle/wall_rock/corner_top-right_mask.png", "terrain/obstacle/wall_rock/corner_top-right.png", "terrain/obstacle/wall_rock/mid_1_mask.png", "terrain/obstacle/wall_rock/mid_1.png", "terrain/obstacle/wall_rock/mid_2_mask.png", "terrain/obstacle/wall_rock/mid_2.png", "terrain/obstacle/wall_rock/mid_3_mask.png", "terrain/obstacle/wall_rock/mid_3.png", "terrain/obstacle/wall_rock/mid_4_mask.png", "terrain/obstacle/wall_rock/mid_4.png", "terrain/obstacle/wall_rock/side_bot_mask.png", "terrain/obstacle/wall_rock/side_bot.png", "terrain/obstacle/wall_rock/side_left_mask.png", "terrain/obstacle/wall_rock/side_left.png", "terrain/obstacle/wall_rock/side_right_mask.png", "terrain/obstacle/wall_rock/side_right.png", "terrain/obstacle/wall_rock/side_top_mask.png", "terrain/obstacle/wall_rock/side_top.png", "terrain/obstacle/wall_rock/virage_bot-left_mask.png", "terrain/obstacle/wall_rock/virage_bot-left.png", "terrain/obstacle/wall_rock/virage_bot-right_mask.png", "terrain/obstacle/wall_rock/virage_bot-right.png", "terrain/obstacle/wall_rock/virage_top-left_mask.png", "terrain/obstacle/wall_rock/virage_top-left.png", "terrain/obstacle/wall_rock/virage_top-right_mask.png", "terrain/obstacle/wall_rock/virage_top-right.png", "towers_10.png", "towers_1.png", "towers_2.png", "towers_3.png", "towers_4.png", "towers_5.png", "towers_6.png", "towers_7.png", "towers_8.png", "towers_9.png", "towers_mask_v2.png"];

    for (let i = 0; i < files.length; i++) {
        let file = ASSETS_DIR + files[i];
        let img = new Image();
        img.src = file;

        CTX.drawImage(img, 0, 0);
    }
}

