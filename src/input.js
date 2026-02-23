export class InputHandler {
    constructor() {
        this.keys = {};
        this.actions = {
            JUMP: false,
            SLIDE: false,
            START: false,
            USE_SLOT: false,
            CHOICE_1: false,
            CHOICE_2: false,
            CHOICE_3: false,
            MUTE: false
        };

        this.pressed = {}; // Para detectar "press" único (não hold)

        window.addEventListener('keydown', (e) => this.onKeyDown(e));
        window.addEventListener('keyup', (e) => this.onKeyUp(e));
    }

    onKeyDown(e) {
        this.keys[e.code] = true;
        this.pressed[e.code] = true; // Marca que foi pressionado neste frame
        this.updateActions();
    }

    onKeyUp(e) {
        this.keys[e.code] = false;
        this.pressed[e.code] = false;
        this.updateActions();
    }

    updateActions() {
        this.actions.JUMP = this.keys['Space'] || this.keys['ArrowUp'] || this.keys['KeyW'];
        this.actions.SLIDE = this.keys['ArrowDown'] || this.keys['KeyS'];
        this.actions.START = this.keys['Space'] || this.keys['Enter'];
        this.actions.USE_SLOT = this.keys['KeyE'];
        this.actions.CHOICE_1 = this.keys['Digit1'] || this.keys['Numpad1'];
        this.actions.CHOICE_2 = this.keys['Digit2'] || this.keys['Numpad2'];
        this.actions.CHOICE_3 = this.keys['Digit3'] || this.keys['Numpad3'];
        this.actions.MUTE = this.keys['KeyM'];
    }

    isActionActive(actionName) {
        return this.actions[actionName];
    }
    
    // Verifica se foi pressionado neste frame (útil para toggles)
    wasPressed(code) {
        if (this.pressed[code]) {
            this.pressed[code] = false; // Consome o evento
            return true;
        }
        return false;
    }
    
    reset() {
        this.keys = {};
        this.pressed = {};
        this.actions = { 
            JUMP: false, SLIDE: false, START: false, 
            USE_SLOT: false, CHOICE_1: false, CHOICE_2: false, CHOICE_3: false, MUTE: false 
        };
    }
}
