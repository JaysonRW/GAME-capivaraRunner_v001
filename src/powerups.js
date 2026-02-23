import { Config } from './config.js';

export const PowerUpTypes = {
    SHIELD: { id: 'SHIELD', name: 'Casca Protetora', color: '#00FFFF', desc: 'Invulnerabilidade' },
    SPEED: { id: 'SPEED', name: 'Corrida Selvagem', color: '#FF4500', desc: 'Velocidade + Score 2x' },
    JUMP: { id: 'JUMP', name: 'Salto Estendido', color: '#FF00FF', desc: 'Pulo +30% Forte' }
};

export class PowerUpManager {
    constructor() {
        this.activePowerUp = null; // { type: PowerUpTypes.X, timeLeft: number }
        this.storedPowerUp = null; // PowerUpTypes.X
        this.currentOptions = [];
        this.pendingChoice = null; // Usado na fase de decisão
    }

    generateOptions() {
        const keys = Object.keys(PowerUpTypes);
        // Embaralha e pega 3
        const shuffled = keys.sort(() => 0.5 - Math.random());
        this.currentOptions = shuffled.slice(0, 3).map(k => PowerUpTypes[k]);
    }

    activate(type) {
        this.activePowerUp = {
            type: type,
            timeLeft: Config.POWER_DURATION
        };
    }

    store(type) {
        this.storedPowerUp = type;
    }

    useStored() {
        if (this.storedPowerUp) {
            this.activate(this.storedPowerUp);
            this.storedPowerUp = null;
            return true;
        }
        return false;
    }

    update(dt) {
        if (this.activePowerUp) {
            this.activePowerUp.timeLeft -= dt;
            if (this.activePowerUp.timeLeft <= 0) {
                this.activePowerUp = null;
            }
        }
    }

    isActive(typeId) {
        return this.activePowerUp && this.activePowerUp.type.id === typeId;
    }
    
    getActiveTimeLeft() {
        return this.activePowerUp ? Math.ceil(this.activePowerUp.timeLeft) : 0;
    }

    reset() {
        this.activePowerUp = null;
        this.storedPowerUp = null;
        this.currentOptions = [];
        this.pendingChoice = null;
    }
}
