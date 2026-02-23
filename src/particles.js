import { Config } from './config.js';

export class ParticleSystem {
    constructor() {
        this.particles = [];
        // Inicializa pool
        for (let i = 0; i < Config.PARTICLE_MAX; i++) {
            this.particles.push({
                x: 0, y: 0, vx: 0, vy: 0,
                life: 0, color: '#FFF', active: false, size: 2
            });
        }
    }

    spawn(x, y, color, count = 5) {
        let spawned = 0;
        for (let p of this.particles) {
            if (!p.active) {
                p.active = true;
                p.x = x;
                p.y = y;
                // Velocidade aleatória explosiva
                const angle = Math.random() * Math.PI * 2;
                const speed = Math.random() * 50 + 20;
                p.vx = Math.cos(angle) * speed;
                p.vy = Math.sin(angle) * speed - 50; // Tendência a subir
                p.life = Config.PARTICLE_LIFETIME;
                p.color = color;
                p.size = Math.random() * 2 + 1;
                
                spawned++;
                if (spawned >= count) break;
            }
        }
    }

    update(dt) {
        for (let p of this.particles) {
            if (p.active) {
                p.x += p.vx * dt;
                p.y += p.vy * dt;
                p.vy += Config.GRAVITY * 0.5 * dt; // Gravidade leve nas partículas
                p.life -= dt;
                
                if (p.life <= 0) p.active = false;
            }
        }
    }

    draw(ctx) {
        for (let p of this.particles) {
            if (p.active) {
                ctx.fillStyle = p.color;
                ctx.globalAlpha = p.life / Config.PARTICLE_LIFETIME; // Fade out
                ctx.fillRect(Math.floor(p.x), Math.floor(p.y), p.size, p.size);
                ctx.globalAlpha = 1.0;
            }
        }
    }
    
    reset() {
        this.particles.forEach(p => p.active = false);
    }
}
