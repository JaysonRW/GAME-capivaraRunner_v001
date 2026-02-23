import { Config } from './config.js';

export class Player {
    constructor() {
        this.width = Config.PLAYER_WIDTH;
        this.height = Config.PLAYER_HEIGHT;
        this.x = Config.PLAYER_START_X;
        this.y = Config.GROUND_Y - this.height;
        this.vy = 0;
        this.isGrounded = true;
        
        // Hitbox (menor que o sprite para ser mais justo)
        this.hitboxW = Config.PLAYER_HITBOX_W;
        this.hitboxH = Config.PLAYER_HITBOX_H;
        
        // Animação
        this.animTimer = 0;
        this.frameIndex = 0;
        this.state = 'RUN'; // RUN, JUMP, SLIDE
    }

    update(dt, input, jumpModifier = 1.0) {
        // Reset state
        this.state = 'RUN';

        // Pulo
        if (input.isActionActive('JUMP') && this.isGrounded) {
            this.vy = Config.JUMP_FORCE * jumpModifier;
            this.isGrounded = false;
        }

        // Slide
        if (input.isActionActive('SLIDE')) {
            this.state = 'SLIDE';
            this.hitboxH = Config.PLAYER_HITBOX_H / 2;
            if (this.isGrounded) {
                // Ajusta posição visual se necessário, mas hitbox é o que importa
            }
        } else {
            this.hitboxH = Config.PLAYER_HITBOX_H;
        }

        if (!this.isGrounded) {
            this.state = 'JUMP';
        }

        // Física
        this.vy += Config.GRAVITY * dt;
        this.y += this.vy * dt;

        // Chão
        if (this.y + this.height >= Config.GROUND_Y) {
            this.y = Config.GROUND_Y - this.height;
            this.vy = 0;
            this.isGrounded = true;
        }

        // Atualiza Animação
        if (this.state === 'RUN') {
            this.animTimer += dt;
            if (this.animTimer >= Config.ANIM.RUN_SPEED) {
                this.animTimer = 0;
                this.frameIndex = (this.frameIndex + 1) % Config.ANIM.RUN_FRAMES;
            }
        } else {
            this.frameIndex = 0;
        }
    }

    getBounds() {
        // Centraliza hitbox no sprite
        const offsetX = (this.width - this.hitboxW) / 2;
        const offsetY = (this.height - this.hitboxH); // Alinhado embaixo
        return { 
            x: this.x + offsetX, 
            y: this.y + offsetY, 
            w: this.hitboxW, 
            h: this.hitboxH 
        };
    }
}
