export class AssetManager {
    constructor() {
        this.images = {};
        this.audio = {};
        this.isMuted = false;
        this.bgMusic = null;
    }

    async loadAll(assetList) {
        const imagePromises = Object.entries(assetList.SPRITES).map(([key, src]) => 
            this.loadImage(key, src)
        );
        
        const audioPromises = Object.entries(assetList.AUDIO).map(([key, src]) => 
            this.loadAudio(key, src)
        );

        await Promise.all([...imagePromises, ...audioPromises]);
    }

    loadImage(key, src) {
        return new Promise((resolve) => {
            const img = new Image();
            const timeout = setTimeout(() => {
                console.warn(`Img timeout: ${src}`);
                this.images[key] = null;
                resolve();
            }, 3000);

            img.onload = () => { clearTimeout(timeout); this.images[key] = img; resolve(); };
            img.onerror = () => { clearTimeout(timeout); console.warn(`Img missing: ${src}`); this.images[key] = null; resolve(); };
            img.src = src;
        });
    }

    loadAudio(key, src) {
        return new Promise((resolve) => {
            const aud = new Audio();
            const timeout = setTimeout(() => {
                console.warn(`Audio timeout: ${src}`);
                this.audio[key] = null;
                resolve();
            }, 3000);

            aud.oncanplaythrough = () => { clearTimeout(timeout); this.audio[key] = aud; resolve(); };
            aud.onerror = () => { clearTimeout(timeout); console.warn(`Audio missing: ${src}`); this.audio[key] = null; resolve(); };
            aud.src = src;
        });
    }

    getImage(key) { return this.images[key]; }

    playAudio(key, loop = false) {
        if (this.isMuted || !this.audio[key]) return;
        
        const sound = this.audio[key];
        
        // Se for música, trata diferente (apenas uma instância)
        if (key === 'MUSIC') {
            if (!this.bgMusic) this.bgMusic = sound;
            this.bgMusic.loop = true;
            this.bgMusic.volume = 0.3;
            this.bgMusic.play().catch(() => {});
            return;
        }

        // SFX: Clona para sobreposição
        const clone = sound.cloneNode();
        clone.volume = 0.5;
        clone.play().catch(() => {});
    }

    stopMusic() {
        if (this.bgMusic) {
            this.bgMusic.pause();
            this.bgMusic.currentTime = 0;
        }
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.isMuted) {
            if (this.bgMusic) this.bgMusic.pause();
        } else {
            if (this.bgMusic) this.bgMusic.play().catch(() => {});
        }
        return this.isMuted;
    }
}
