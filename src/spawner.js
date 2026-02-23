import { Config } from './config.js';

export class Spawner {
    constructor() {
        this.obstacles = [];
        this.ecoFragments = [];
        
        this.obsTimer = 0;
        this.obsNextSpawn = this.getRandomObsSpawnTime();
        
        this.ecoTimer = 0;
        this.ecoNextSpawn = this.getRandomEcoSpawnTime();
    }

    getRandomObsSpawnTime() {
        return Math.random() * (Config.SPAWN_RATE_MAX - Config.SPAWN_RATE_MIN) + Config.SPAWN_RATE_MIN;
    }
    
    getRandomEcoSpawnTime() {
        return Math.random() * (Config.ECO_SPAWN_MAX - Config.ECO_SPAWN_MIN) + Config.ECO_SPAWN_MIN;
    }

    spawnObstacle() {
        const typeRoll = Math.random();
        let obstacle = {
            x: Config.BASE_WIDTH,
            y: 0,
            w: 20,
            h: 20,
            type: 'rock', // default
            passed: false
        };

        if (typeRoll < 0.6) { // 60% Chão
            const subType = Math.random();
            if (subType < 0.33) {
                obstacle.type = 'OBSTACLE_ROCK';
                obstacle.y = Config.GROUND_Y - 20;
            } else if (subType < 0.66) {
                obstacle.type = 'OBSTACLE_CAN';
                obstacle.y = Config.GROUND_Y - 20;
            } else {
                obstacle.type = 'OBSTACLE_PUDDLE';
                obstacle.y = Config.GROUND_Y - 15;
                obstacle.h = 15;
            }
        } else { // 40% Aéreo
            obstacle.type = 'OBSTACLE_BAG';
            obstacle.y = Config.GROUND_Y - 50; 
            obstacle.w = 24;
            obstacle.h = 24;
        }

        this.obstacles.push(obstacle);
    }

    spawnEcoFragment() {
        let fragment = {
            x: Config.BASE_WIDTH,
            y: Config.GROUND_Y - 60 - (Math.random() * 40),
            w: Config.ECO_SIZE,
            h: Config.ECO_SIZE,
            type: 'ECO_FRAGMENT'
        };
        this.ecoFragments.push(fragment);
    }

    update(dt, speedMultiplier) {
        this.obsTimer += dt;
        if (this.obsTimer >= this.obsNextSpawn) {
            this.spawnObstacle();
            this.obsTimer = 0;
            this.obsNextSpawn = this.getRandomObsSpawnTime();
        }

        this.ecoTimer += dt;
        if (this.ecoTimer >= this.ecoNextSpawn) {
            this.spawnEcoFragment();
            this.ecoTimer = 0;
            this.ecoNextSpawn = this.getRandomEcoSpawnTime();
        }

        const moveSpeed = Config.OBSTACLE_SPEED * speedMultiplier;
        
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            let obs = this.obstacles[i];
            obs.x -= moveSpeed * dt;
            if (obs.x + obs.w < -50) this.obstacles.splice(i, 1);
        }

        for (let i = this.ecoFragments.length - 1; i >= 0; i--) {
            let eco = this.ecoFragments[i];
            eco.x -= moveSpeed * dt;
            if (eco.x + eco.w < -50) this.ecoFragments.splice(i, 1);
        }
    }

    reset() {
        this.obstacles = [];
        this.ecoFragments = [];
        this.obsTimer = 0;
        this.ecoTimer = 0;
        this.obsNextSpawn = this.getRandomObsSpawnTime();
        this.ecoNextSpawn = this.getRandomEcoSpawnTime();
    }
}
