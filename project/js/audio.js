
import { ASSETS_DIR } from "./script.js";

export class Jukebox {
    constructor() {
        this.music = undefined;
        this.sound = undefined;
        this.muted = false;
    }

    play_music() {
        if (!this.music) { return; }
        this.music.play();
    }
    
    stop_music() {
        if (!this.music) { return; };
        this.music.pause();
    }

    mute_music() {
        this.muted = !this.muted;
        if (!this.music) { return; }
        if (this.muted) {
            this.music.volume = 0.0;
        }
        else  {
            this.music.volume = 0.5;
        }
    }


    play_main_menu() {
        this.stop_music();
        this.music = new Audio(ASSETS_DIR + "in-game_lugubre_v0.1.mp3");
        if (this.muted) {
            this.music.volume = 0.0;
        }
        else {
            this.music.volume = 0.5
        }
        this.music.loop = true;
        this.play_music();
    }

    play_game() {
        this.stop_music();
        this.music = new Audio(ASSETS_DIR + "main-menu_v1.mp3");
        if (this.muted) {
            this.music.volume = 0.0;
        }
        else {
            this.music.volume = 0.5
        }
        this.music.loop = true;
        this.play_music();
    }
}

