import { Game } from './game.js';

console.log("Main.js loaded - Sprint 5");

window.addEventListener('load', () => {
    console.log("Window loaded, initializing game...");
    const game = new Game();
    game.init().then(() => {
        console.log("Game initialized!");
    }).catch(e => {
        console.error("Game init failed:", e);
    });
});
