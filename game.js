// Game Configuration
const CONFIG = {
    canvas: {
        width: 1000,
        height: 600
    },
    player: {
        width: 60,
        height: 60,
        x: 150,
        jumpForce: 15,
        gravity: 0.6,
        dashSpeed: 25,
        dashDuration: 300,
        dashCooldown: 1000
    },
    game: {
        scrollSpeed: 6,
        scrollAcceleration: 0.001,
        maxScrollSpeed: 12
    },
    platform: {
        minGap: 150,
        maxGap: 350,
        minWidth: 200,
        maxWidth: 400,
        height: 20
    },
    audio: {
        enabled: true,
        musicVolume: 0.3,
        sfxVolume: 0.5
    }
};

// Audio Manager
const audioManager = {
    sounds: {},
    music: null,
    muted: false,
    audioContext: null,
    initialized: false,

    init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.initialized = true;

            this.createBackgroundMusic();
        } catch (e) {
            console.warn('Audio initialization failed:', e);
            this.initialized = false;
        }
    },

    ensureAudioContext() {
        if (!this.initialized || !this.audioContext) return false;

        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume().catch(e => console.warn('Failed to resume audio:', e));
        }
        return true;
    },

    createBackgroundMusic() {
        this.musicPlaying = false;
    },

    playBackgroundMusic() {
        if (!this.ensureAudioContext() || this.muted || this.musicPlaying) return;
        this.musicPlaying = true;
        this.playMelody();
    },

    stopBackgroundMusic() {
        this.musicPlaying = false;
    },

    playMelody() {
        if (!this.initialized || !this.audioContext || !this.musicPlaying || this.muted) return;

        try {
            const notes = [
                { freq: 523.25, duration: 0.2 },
                { freq: 587.33, duration: 0.2 },
                { freq: 659.25, duration: 0.2 },
                { freq: 783.99, duration: 0.2 },
                { freq: 659.25, duration: 0.2 },
                { freq: 783.99, duration: 0.4 },
            ];

            let currentTime = this.audioContext.currentTime;

            notes.forEach(note => {
                this.playNote(note.freq, currentTime, note.duration);
                currentTime += note.duration;
            });

            setTimeout(() => this.playMelody(), currentTime * 1000 - this.audioContext.currentTime * 1000 + 500);
        } catch (e) {
            console.warn('Music playback error:', e);
        }
    },

    playNote(frequency, startTime, duration) {
        if (!this.initialized || !this.audioContext) return;

        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            oscillator.frequency.value = frequency;
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(CONFIG.audio.musicVolume, startTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

            oscillator.start(startTime);
            oscillator.stop(startTime + duration);
        } catch (e) {
            console.warn('Note playback error:', e);
        }
    },

    playSound(type) {
        if (!this.ensureAudioContext() || this.muted) return;

        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            const now = this.audioContext.currentTime;

            switch (type) {
                case 'jump':
                    oscillator.frequency.setValueAtTime(400, now);
                    oscillator.frequency.exponentialRampToValueAtTime(600, now + 0.1);
                    gainNode.gain.setValueAtTime(CONFIG.audio.sfxVolume, now);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
                    oscillator.start(now);
                    oscillator.stop(now + 0.1);
                    break;

                case 'dash':
                    oscillator.frequency.setValueAtTime(200, now);
                    oscillator.frequency.exponentialRampToValueAtTime(100, now + 0.2);
                    oscillator.type = 'sawtooth';
                    gainNode.gain.setValueAtTime(CONFIG.audio.sfxVolume, now);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
                    oscillator.start(now);
                    oscillator.stop(now + 0.2);
                    break;

                case 'destroy':
                    oscillator.frequency.setValueAtTime(800, now);
                    oscillator.frequency.exponentialRampToValueAtTime(1200, now + 0.15);
                    oscillator.type = 'square';
                    gainNode.gain.setValueAtTime(CONFIG.audio.sfxVolume * 0.7, now);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
                    oscillator.start(now);
                    oscillator.stop(now + 0.15);
                    break;

                case 'hit':
                    oscillator.frequency.setValueAtTime(150, now);
                    oscillator.frequency.exponentialRampToValueAtTime(50, now + 0.3);
                    oscillator.type = 'sawtooth';
                    gainNode.gain.setValueAtTime(CONFIG.audio.sfxVolume, now);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
                    oscillator.start(now);
                    oscillator.stop(now + 0.3);
                    break;

                case 'powerup':
                    oscillator.frequency.setValueAtTime(600, now);
                    oscillator.frequency.exponentialRampToValueAtTime(1200, now + 0.3);
                    oscillator.type = 'sine';
                    gainNode.gain.setValueAtTime(CONFIG.audio.sfxVolume * 0.6, now);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
                    oscillator.start(now);
                    oscillator.stop(now + 0.3);
                    break;
            }
        } catch (e) {
            console.warn('Sound playback error:', e);
        }
    },

    toggleMute() {
        this.muted = !this.muted;
        if (this.muted) {
            this.stopBackgroundMusic();
        } else if (game.state === 'playing') {
            this.playBackgroundMusic();
        }
        return this.muted;
    }
};

// Game State
const game = {
    canvas: null,
    ctx: null,
    state: 'menu',
    score: 0,
    wishes: 3,
    scrollSpeed: CONFIG.game.scrollSpeed,
    keys: {},
    lastTime: 0,
    highScore: 0,
    scoreMultiplier: 1,
    invincible: false,
    invincibleTime: 0,
    dpr: 1,
    selectedSkin: 0,
    screenShake: {
        intensity: 0,
        duration: 0,
        startTime: 0
    },
    redFlash: {
        intensity: 0,
        duration: 0,
        startTime: 0
    },
    hitFlash: {
        active: false,
        startTime: 0,
        duration: 500
    }
};

// Asset Manager (loads unicorn sprites)
const assets = {
    unicorns: [
        { img: null, loaded: false, failed: false, path: 'assets/unicorn.png', width: null, height: null },
        { img: null, loaded: false, failed: false, path: 'assets/unicorn1.png', width: null, height: null },
        { img: null, loaded: false, failed: false, path: 'assets/unicorn2.png', width: null, height: null },
        { img: null, loaded: false, failed: false, path: 'assets/unicorn3.png', width: null, height: null },
        { img: null, loaded: false, failed: false, path: 'assets/unicorn4.png', width: null, height: null },
        { img: null, loaded: false, failed: false, path: 'assets/unicorn5.png', width: null, height: null }
    ],
    get unicorn() {
        return this.unicorns[game.selectedSkin] || this.unicorns[0];
    }
};

// Storage Manager
const storageManager = {
    saveHighScore(score) {
        const highScore = this.getHighScore();
        if (score > highScore) {
            localStorage.setItem('unicornAttackHighScore', score.toString());
            return true;
        }
        return false;
    },

    getHighScore() {
        const saved = localStorage.getItem('unicornAttackHighScore');
        return saved ? parseInt(saved, 10) : 0;
    },

    saveSelectedSkin(skinIndex) {
        localStorage.setItem('unicornAttackSkin', skinIndex.toString());
    },

    getSelectedSkin() {
        const saved = localStorage.getItem('unicornAttackSkin');
        return saved ? parseInt(saved, 10) : 0;
    }
};

// Player Class
class Player {
    constructor() {
        this.x = CONFIG.player.x;
        this.y = 300;
        this.width = CONFIG.player.width;
        this.height = CONFIG.player.height;
        this.velocityY = 0;
        this.velocityX = 0;
        this.isGrounded = false;
        this.jumpsRemaining = 2;
        this.isDashing = false;
        this.dashTime = 0;
        this.lastDashTime = 0;
        this.particles = [];
        this.rotation = 0;
        this.trail = [];
        this.trailHue = 0;
    }

    jump() {
        if (this.jumpsRemaining > 0) {
            this.velocityY = -CONFIG.player.jumpForce;
            this.jumpsRemaining--;
            this.isGrounded = false;
            audioManager.playSound('jump');
        }
    }

    dash() {
        const now = Date.now();
        if (!this.isDashing && now - this.lastDashTime > CONFIG.player.dashCooldown) {
            this.isDashing = true;
            this.dashTime = now;
            this.lastDashTime = now;
            this.velocityX = CONFIG.player.dashSpeed;
            audioManager.playSound('dash');
        }
    }

    update(platforms, obstacles) {
        if (this.isDashing) {
            if (Date.now() - this.dashTime > CONFIG.player.dashDuration) {
                this.isDashing = false;
                this.velocityX = 0;
            }
        }

        if (!this.isGrounded) {
            this.velocityY += CONFIG.player.gravity;
        }

        this.y += this.velocityY;
        this.x += this.velocityX;

        if (this.x > CONFIG.player.x) {
            this.x = CONFIG.player.x;
            this.velocityX = 0;
        }
        if (this.x < 50) {
            this.x = 50;
        }

        if (!this.isGrounded && this.velocityY < 0) {
            this.rotation = Math.min(this.rotation + 0.05, 0.3);
        } else if (!this.isGrounded) {
            this.rotation = Math.max(this.rotation - 0.05, -0.3);
        } else {
            this.rotation *= 0.9;
        }

        this.isGrounded = false;
        for (let platform of platforms) {
            if (this.checkPlatformCollision(platform)) {
                this.isGrounded = true;
                this.velocityY = 0;
                this.y = platform.y - this.height;
                this.jumpsRemaining = 2;
                break;
            }
        }

        if (this.y > CONFIG.canvas.height) {
            return 'fell';
        }

        for (let obstacle of obstacles) {
            if (this.checkObstacleCollision(obstacle)) {
                if (this.isDashing || game.invincible) {
                    obstacle.destroyed = true;
                    game.score += 100 * game.scoreMultiplier;
                    this.createExplosion(obstacle.x + obstacle.size / 2, obstacle.y + obstacle.size / 2);
                    audioManager.playSound('destroy');
                } else if (!game.invincible) {
                    return 'hit';
                }
            }
        }

        this.updateParticles();

        return null;
    }

    checkPlatformCollision(platform) {
        return (
            this.x + this.width > platform.x &&
            this.x < platform.x + platform.width &&
            this.y + this.height >= platform.y &&
            this.y + this.height <= platform.y + platform.height &&
            this.velocityY >= 0
        );
    }

    checkObstacleCollision(obstacle) {
        if (obstacle.destroyed) return false;

        const playerCenterX = this.x + this.width / 2;
        const playerCenterY = this.y + this.height / 2;
        const obstacleCenterX = obstacle.x + obstacle.size / 2;
        const obstacleCenterY = obstacle.y + obstacle.size / 2;

        const dx = playerCenterX - obstacleCenterX;
        const dy = playerCenterY - obstacleCenterY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        return distance < (this.width / 2 + obstacle.size / 2) * 0.8;
    }

    updateParticles() {
        if (game.state === 'playing') {
            this.trailHue = (this.trailHue + 6) % 360;

            const anchorX = this.x + this.width * 0.15;
            const anchorY = this.y + this.height * 0.55;

            this.trail.push({
                x: anchorX,
                y: anchorY,
                life: 1,
                hue: this.trailHue
            });

            if (this.trail.length > 60) {
                this.trail.shift();
            }
        }

        this.trail = this.trail.filter(t => {
            t.x -= game.scrollSpeed;
            t.life -= 0.03;
            return t.life > 0;
        });

        this.particles = this.particles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.02;
            return p.life > 0;
        });
    }

    createExplosion(x, y) {
        for (let i = 0; i < 20; i++) {
            const angle = (Math.PI * 2 * i) / 20;
            const speed = Math.random() * 5 + 3;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed - game.scrollSpeed,
                vy: Math.sin(angle) * speed,
                size: Math.random() * 6 + 3,
                life: 1,
                hue: 50 + Math.random() * 60
            });
        }
    }

    draw(ctx) {
        if (this.trail.length > 1) {
            ctx.save();
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            const stripes = [
                '#ff0000',
                '#ff7a00',
                '#ffe600',
                '#2dff4a',
                '#00e5ff',
                '#2a6bff',
                '#b400ff'
            ];

            const drawSmoothTrail = (yOffset) => {
                ctx.beginPath();
                const pts = this.trail;
                ctx.moveTo(pts[0].x, pts[0].y + yOffset);
                for (let i = 1; i < pts.length - 1; i++) {
                    const xc = (pts[i].x + pts[i + 1].x) / 2;
                    const yc = (pts[i].y + pts[i + 1].y) / 2 + yOffset;
                    ctx.quadraticCurveTo(pts[i].x, pts[i].y + yOffset, xc, yc);
                }
                const last = pts[pts.length - 1];
                ctx.lineTo(last.x, last.y + yOffset);
            };

            ctx.globalAlpha = 0.25;
            ctx.shadowBlur = 22;
            ctx.shadowColor = 'rgba(255,255,255,0.6)';
            ctx.strokeStyle = 'rgba(255,255,255,0.35)';
            ctx.lineWidth = 26;
            drawSmoothTrail(0);
            ctx.stroke();

            ctx.globalAlpha = 0.95;
            ctx.shadowBlur = 0;

            const stripeThickness = 4.2;
            for (let i = 0; i < stripes.length; i++) {
                const yOffset = (i - 3) * stripeThickness;
                ctx.strokeStyle = stripes[i];
                ctx.lineWidth = stripeThickness;
                drawSmoothTrail(yOffset);
                ctx.stroke();
            }

            if (this.trail.length > 10) {
                const pts = this.trail;
                const shimmerLen = Math.min(14, pts.length - 2);
                const t = Date.now() / 60;
                const start = Math.floor(t % (pts.length - shimmerLen));
                const end = start + shimmerLen;

                ctx.save();
                ctx.globalCompositeOperation = 'lighter';
                ctx.globalAlpha = 0.7;
                ctx.shadowBlur = 18;
                ctx.shadowColor = 'rgba(255,255,255,0.9)';

                ctx.lineWidth = 3;

                const p0 = pts[start];
                const p1 = pts[end - 1];
                const grad = ctx.createLinearGradient(p0.x, p0.y, p1.x, p1.y);
                grad.addColorStop(0, 'rgba(255,255,255,0)');
                grad.addColorStop(0.25, 'rgba(255,255,255,0.9)');
                grad.addColorStop(0.75, 'rgba(255,255,255,0.9)');
                grad.addColorStop(1, 'rgba(255,255,255,0)');
                ctx.strokeStyle = grad;

                ctx.beginPath();
                ctx.moveTo(p0.x, p0.y);
                for (let i = start + 1; i < end - 1; i++) {
                    const xc = (pts[i].x + pts[i + 1].x) / 2;
                    const yc = (pts[i].y + pts[i + 1].y) / 2;
                    ctx.quadraticCurveTo(pts[i].x, pts[i].y, xc, yc);
                }
                ctx.lineTo(p1.x, p1.y);
                ctx.stroke();

                ctx.globalAlpha = 0.9;
                ctx.fillStyle = 'rgba(255,255,255,0.95)';
                ctx.beginPath();
                ctx.arc(p1.x, p1.y, 2.2, 0, Math.PI * 2);
                ctx.fill();

                ctx.restore();
            }

            ctx.restore();
        }

        this.particles.forEach(p => {
            ctx.save();
            ctx.globalAlpha = p.life;
            ctx.fillStyle = `hsl(${p.hue}, 100%, 60%)`;
            ctx.shadowBlur = 15;
            ctx.shadowColor = `hsl(${p.hue}, 100%, 60%)`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });

        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate(this.rotation);

        if (game.hitFlash.active) {
            const elapsed = Date.now() - game.hitFlash.startTime;
            const flashProgress = elapsed / game.hitFlash.duration;
            const flashValue = Math.sin(flashProgress * Math.PI * 10) * 0.5 + 0.5;
            ctx.globalAlpha = 0.5 + flashValue * 0.5;
            if (flashValue > 0.7) {
                ctx.filter = 'brightness(1.5) saturate(1.5)';
            }
        }

        if (this.isDashing) {
            ctx.shadowBlur = 30;
            ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
        }

        const unicornSprite = assets.unicorns[game.selectedSkin] || assets.unicorns[0];
        if (unicornSprite?.loaded && unicornSprite.img) {
            ctx.imageSmoothingEnabled = true;

            const targetWidth = this.width;
            const targetHeight = this.height;

            let drawWidth = targetWidth;
            let drawHeight = targetHeight;

            if (unicornSprite.width && unicornSprite.height) {
                const imageAspect = unicornSprite.width / unicornSprite.height;
                const targetAspect = targetWidth / targetHeight;

                if (imageAspect > targetAspect) {
                    drawWidth = targetWidth;
                    drawHeight = targetWidth / imageAspect;
                } else {
                    drawHeight = targetHeight;
                    drawWidth = targetHeight * imageAspect;
                }
            }

            ctx.drawImage(unicornSprite.img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
        } else {
            ctx.fillStyle = this.isDashing ? '#ffffff' : '#e0e0e0';
            ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);

            ctx.fillStyle = '#ffd700';
            ctx.beginPath();
            ctx.moveTo(-this.width / 2 + 10, -this.height / 2);
            ctx.lineTo(-this.width / 2 + 20, -this.height / 2 - 20);
            ctx.lineTo(-this.width / 2 + 15, -this.height / 2);
            ctx.fill();

            ctx.fillStyle = '#ff1493';
            ctx.beginPath();
            ctx.arc(-this.width / 2 + 15, -this.height / 2 + 15, 5, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = '#c0c0c0';
            ctx.lineWidth = 4;
            const legOffset = Math.sin(Date.now() / 100) * 5;
            ctx.beginPath();
            ctx.moveTo(-this.width / 4, this.height / 2);
            ctx.lineTo(-this.width / 4, this.height / 2 + 10 + legOffset);
            ctx.moveTo(this.width / 4, this.height / 2);
            ctx.lineTo(this.width / 4, this.height / 2 + 10 - legOffset);
            ctx.stroke();
        }

        ctx.restore();
    }
}

// Platform Class
class Platform {
    constructor(x, width) {
        this.x = x;
        this.width = width;
        this.height = CONFIG.platform.height;
        this.y = CONFIG.canvas.height - 100 - Math.random() * 150;
    }

    update() {
        this.x -= game.scrollSpeed;
    }

    draw(ctx) {
        const gradient = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
        gradient.addColorStop(0, '#ff1493');
        gradient.addColorStop(0.5, '#9400d3');
        gradient.addColorStop(1, '#4b0082');

        ctx.fillStyle = gradient;
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'rgba(255, 20, 147, 0.5)';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.shadowBlur = 0;

        for (let i = 0; i < this.width; i += 50) {
            const starX = this.x + i + 25;
            const starY = this.y - 5;
            this.drawStar(ctx, starX, starY, 5, 3, 5);
        }
    }

    drawStar(ctx, x, y, spikes, outerRadius, innerRadius) {
        let rot = Math.PI / 2 * 3;
        let step = Math.PI / spikes;

        ctx.save();
        ctx.fillStyle = '#ffff00';
        ctx.shadowBlur = 5;
        ctx.shadowColor = '#ffff00';
        ctx.beginPath();
        ctx.moveTo(x, y - outerRadius);

        for (let i = 0; i < spikes; i++) {
            ctx.lineTo(x + Math.cos(rot) * outerRadius, y + Math.sin(rot) * outerRadius);
            rot += step;
            ctx.lineTo(x + Math.cos(rot) * innerRadius, y + Math.sin(rot) * innerRadius);
            rot += step;
        }

        ctx.lineTo(x, y - outerRadius);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }
}

class Obstacle {
    constructor(x, y, type = 'star') {
        this.x = x;
        this.y = y;
        this.size = 40;
        this.destroyed = false;
        this.rotation = 0;
        this.type = type;
        this.initialY = y;
        this.time = 0;
    }

    update() {
        this.x -= game.scrollSpeed;
        this.rotation += 0.05;
        this.time += 0.05;

        if (this.type === 'floating') {
            this.y = this.initialY + Math.sin(this.time) * 30;
        } else if (this.type === 'moving') {
            this.y = this.initialY + Math.sin(this.time * 2) * 50;
        }
    }

    draw(ctx) {
        if (this.destroyed) return;

        ctx.save();
        ctx.translate(this.x + this.size / 2, this.y + this.size / 2);
        ctx.rotate(this.rotation);

        let color = '#ff00ff';
        if (this.type === 'floating') {
            color = '#00ffff';
        } else if (this.type === 'moving') {
            color = '#ff9900';
        }

        const spikes = 5;
        const outerRadius = this.size / 2;
        const innerRadius = this.size / 4;
        let rot = Math.PI / 2 * 3;
        let step = Math.PI / spikes;

        ctx.fillStyle = color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = color;
        ctx.beginPath();
        ctx.moveTo(0, -outerRadius);

        for (let i = 0; i < spikes; i++) {
            ctx.lineTo(Math.cos(rot) * outerRadius, Math.sin(rot) * outerRadius);
            rot += step;
            ctx.lineTo(Math.cos(rot) * innerRadius, Math.sin(rot) * innerRadius);
            rot += step;
        }

        ctx.lineTo(0, -outerRadius);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, innerRadius / 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

class PowerUp {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.size = 30;
        this.type = type;
        this.collected = false;
        this.rotation = 0;
        this.pulse = 0;
    }

    update() {
        this.x -= game.scrollSpeed;
        this.rotation += 0.1;
        this.pulse += 0.1;
    }

    draw(ctx) {
        if (this.collected) return;

        ctx.save();
        const pulseSize = Math.sin(this.pulse) * 5;
        ctx.translate(this.x + this.size / 2, this.y + this.size / 2);
        ctx.rotate(this.rotation);

        switch (this.type) {
            case 'invincibility':
                ctx.fillStyle = '#ffd700';
                ctx.shadowBlur = 20;
                ctx.shadowColor = '#ffd700';
                this.drawStar(ctx, 0, 0, 5, this.size / 2 + pulseSize, this.size / 4);
                break;

            case 'multiplier':
                ctx.fillStyle = '#9400d3';
                ctx.shadowBlur = 20;
                ctx.shadowColor = '#9400d3';
                ctx.beginPath();
                ctx.moveTo(0, -(this.size / 2 + pulseSize));
                ctx.lineTo(this.size / 2 + pulseSize, 0);
                ctx.lineTo(0, this.size / 2 + pulseSize);
                ctx.lineTo(-(this.size / 2 + pulseSize), 0);
                ctx.closePath();
                ctx.fill();

                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 14px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('2x', 0, 0);
                break;

            case 'life':
                ctx.fillStyle = '#ff1493';
                ctx.shadowBlur = 20;
                ctx.shadowColor = '#ff1493';
                const heartSize = this.size / 2 + pulseSize;
                ctx.beginPath();
                ctx.moveTo(0, heartSize / 4);
                ctx.bezierCurveTo(-heartSize, -heartSize / 2, -heartSize / 2, -heartSize, 0, -heartSize / 4);
                ctx.bezierCurveTo(heartSize / 2, -heartSize, heartSize, -heartSize / 2, 0, heartSize / 4);
                ctx.closePath();
                ctx.fill();
                break;
        }

        ctx.restore();
    }

    drawStar(ctx, x, y, spikes, outerRadius, innerRadius) {
        let rot = Math.PI / 2 * 3;
        let step = Math.PI / spikes;

        ctx.beginPath();
        ctx.moveTo(x, y - outerRadius);

        for (let i = 0; i < spikes; i++) {
            ctx.lineTo(x + Math.cos(rot) * outerRadius, y + Math.sin(rot) * outerRadius);
            rot += step;
            ctx.lineTo(x + Math.cos(rot) * innerRadius, y + Math.sin(rot) * innerRadius);
            rot += step;
        }

        ctx.lineTo(x, y - outerRadius);
        ctx.closePath();
        ctx.fill();
    }
}

class Star {
    constructor() {
        this.x = Math.random() * CONFIG.canvas.width;
        this.y = Math.random() * CONFIG.canvas.height;
        this.size = Math.random() * 2 + 1;
        this.speed = Math.random() * 2 + 1;
        this.opacity = Math.random();
    }

    update() {
        this.x -= this.speed;
        if (this.x < 0) {
            this.x = CONFIG.canvas.width;
            this.y = Math.random() * CONFIG.canvas.height;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.opacity;
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 5;
        ctx.shadowColor = '#ffffff';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

const gameManager = {
    player: null,
    platforms: [],
    obstacles: [],
    powerups: [],
    backgroundStars: [],
    touchStartY: 0,
    touchStartX: 0,

    init() {
        try {
            game.canvas = document.getElementById('gameCanvas');
            game.ctx = game.canvas.getContext('2d');
            game.dpr = Math.max(1, Math.min(3, window.devicePixelRatio || 1));
            game.canvas.width = Math.floor(CONFIG.canvas.width * game.dpr);
            game.canvas.height = Math.floor(CONFIG.canvas.height * game.dpr);
            game.canvas.style.width = '100%';
            game.canvas.style.height = 'auto';

            game.highScore = storageManager.getHighScore();
            game.selectedSkin = storageManager.getSelectedSkin();

            try {
                audioManager.init();
            } catch (e) {
                console.warn('Audio initialization failed, continuing without audio:', e);
            }

            assets.unicorns.forEach((unicorn, index) => {
                unicorn.img = new Image();
                unicorn.img.onload = () => {
                    unicorn.loaded = true;
                    unicorn.failed = false;
                    unicorn.width = unicorn.img.naturalWidth || unicorn.img.width;
                    unicorn.height = unicorn.img.naturalHeight || unicorn.img.height;
                    console.log(`✅ Loaded unicorn ${index}: ${unicorn.width}x${unicorn.height}`);
                };
                unicorn.img.onerror = () => {
                    unicorn.loaded = false;
                    unicorn.failed = true;
                    console.warn(`Failed to load unicorn sprite ${index} (${unicorn.path}). Falling back to canvas shape.`);
                };
                unicorn.img.src = unicorn.path;
            });

            this.setupEventListeners();
            this.createBackgroundStars();
            this.updateUI();

            const menuHighScore = document.getElementById('menu-high-score');
            if (menuHighScore) {
                menuHighScore.textContent = game.highScore;
            }

            setTimeout(() => {
                this.updateSkinSelector();
            }, 100);

            this.gameLoop();
        } catch (e) {
            console.error('Game initialization failed:', e);
            alert('Failed to initialize game. Please refresh the page and try again.');
        }
    },

    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            game.keys[e.code] = true;

            if (e.code === 'KeyP' && (game.state === 'playing' || game.state === 'paused')) {
                e.preventDefault();
                this.togglePause();
                return;
            }

            if (e.code === 'Space' && game.state === 'paused') {
                e.preventDefault();
                this.togglePause();
                return;
            }

            if (game.state === 'playing') {
                if (e.code === 'Space') {
                    e.preventDefault();
                    this.player.jump();
                }
                if (e.code === 'KeyZ') {
                    e.preventDefault();
                    this.player.dash();
                }
            }
        });

        document.addEventListener('keyup', (e) => {
            game.keys[e.code] = false;
        });

        const skinButtons = document.querySelectorAll('.skin-btn');
        if (skinButtons.length > 0) {
            skinButtons.forEach(btn => {
                const handleSkinClick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const skinIndex = parseInt(btn.getAttribute('data-skin'), 10);
                    if (!isNaN(skinIndex)) {
                        console.log(`Skin ${skinIndex} selected`);
                        gameManager.selectSkin(skinIndex);
                    }
                };
                btn.addEventListener('click', handleSkinClick);
            });
            console.log(`✅ ${skinButtons.length} skin buttons initialized`);
        } else {
            console.warn('⚠️ No skin buttons found in DOM');
        }

        const startBtn = document.getElementById('start-btn');
        if (startBtn) {
            const handleStartClick = (e) => {
                console.log('Start button clicked');
                e.preventDefault();
                e.stopPropagation();
                audioManager.ensureAudioContext();
                gameManager.startGame();
            };

            startBtn.addEventListener('click', handleStartClick);
            console.log('✅ Start button initialized');
        } else {
            console.error('❌ Start button not found!');
        }

        const restartBtn = document.getElementById('restart-btn');
        if (restartBtn) {
            restartBtn.addEventListener('click', (e) => {
                console.log('Restart button clicked');
                e.preventDefault();
                audioManager.ensureAudioContext();
                this.startGame();
            });
        } else {
            console.error('Restart button not found!');
        }

        const resumeBtn = document.getElementById('resume-btn');
        if (resumeBtn) {
            resumeBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (game.state === 'paused') {
                    this.togglePause();
                }
            });
        }

        const restartFromPauseBtn = document.getElementById('restart-from-pause-btn');
        if (restartFromPauseBtn) {
            restartFromPauseBtn.addEventListener('click', (e) => {
                e.preventDefault();
                audioManager.ensureAudioContext();
                this.hidePauseMenu();
                this.startGame();
            });
        }

        const quitBtn = document.getElementById('quit-btn');
        if (quitBtn) {
            quitBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.hidePauseMenu();
                game.state = 'menu';
                document.getElementById('start-screen').classList.remove('hidden');
                document.getElementById('game-over-screen').classList.add('hidden');
                audioManager.stopBackgroundMusic();
                this.updateUI();
            });
        }

        game.canvas.addEventListener(
            'touchstart',
            (e) => {
                e.preventDefault();
                const touch = e.touches[0];
                this.touchStartY = touch.clientY;
                this.touchStartX = touch.clientX;

                if (game.state === 'playing') {
                    const rect = game.canvas.getBoundingClientRect();
                    const x = touch.clientX - rect.left;
                    if (x > rect.width * 0.7) {
                        this.player.dash();
                    } else {
                        this.player.jump();
                    }
                }
            },
            { passive: false }
        );

        game.canvas.addEventListener(
            'touchmove',
            (e) => {
                e.preventDefault();
            },
            { passive: false }
        );

        const muteBtn = document.getElementById('mute-btn');
        if (muteBtn) {
            muteBtn.addEventListener('click', () => {
                const muted = audioManager.toggleMute();
                muteBtn.textContent = muted ? '🔇' : '🔊';
            });
        }

        let resizeTimeout;
        const handleResizeEvent = () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.handleResize();
            }, 250);
        };

        window.addEventListener('resize', handleResizeEvent);

        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.handleResize();
            }, 300);
        });

        if (screen.orientation) {
            screen.orientation.addEventListener('change', handleResizeEvent);
        }
    },

    handleResize() {
        game.dpr = Math.max(1, Math.min(3, window.devicePixelRatio || 1));
        game.canvas.width = Math.floor(CONFIG.canvas.width * game.dpr);
        game.canvas.height = Math.floor(CONFIG.canvas.height * game.dpr);
        game.canvas.style.width = '100%';
        game.canvas.style.height = 'auto';

        if (window.matchMedia("(orientation: portrait)").matches) {
            console.log('Orientation: Portrait');
        } else if (window.matchMedia("(orientation: landscape)").matches) {
            console.log('Orientation: Landscape');
        }
    },

    createBackgroundStars() {
        for (let i = 0; i < 100; i++) {
            this.backgroundStars.push(new Star());
        }
    },

    startGame() {
        console.log('Starting game...');

        try {
            game.state = 'playing';
            game.score = 0;
            game.wishes = 3;
            game.scrollSpeed = CONFIG.game.scrollSpeed;
            game.scoreMultiplier = 1;
            game.invincible = false;
            game.invincibleTime = 0;
            game.screenShake.intensity = 0;
            game.screenShake.duration = 0;
            game.redFlash.intensity = 0;
            game.redFlash.duration = 0;
            game.hitFlash.active = false;

            this.player = new Player();
            this.platforms = [];
            this.obstacles = [];
            this.powerups = [];

            let x = 0;
            for (let i = 0; i < 5; i++) {
                const width = CONFIG.platform.minWidth + Math.random() * (CONFIG.platform.maxWidth - CONFIG.platform.minWidth);
                this.platforms.push(new Platform(x, width));
                x += width + CONFIG.platform.minGap + Math.random() * (CONFIG.platform.maxGap - CONFIG.platform.minGap);
            }

            document.getElementById('start-screen').classList.add('hidden');
            document.getElementById('game-over-screen').classList.add('hidden');
            this.hidePauseMenu();

            try {
                audioManager.playBackgroundMusic();
            } catch (e) {
                console.warn('Failed to start music:', e);
            }

            this.updateUI();

            console.log('Game started successfully!');
        } catch (e) {
            console.error('Error starting game:', e);
            alert('Failed to start game. Error: ' + e.message);
        }
    },

    togglePause() {
        if (game.state === 'playing') {
            game.state = 'paused';
            this.showPauseMenu();
        } else if (game.state === 'paused') {
            game.state = 'playing';
            this.hidePauseMenu();
        }
    },

    showPauseMenu() {
        const pauseScreen = document.getElementById('pause-screen');
        const pauseScore = document.getElementById('pause-score');
        if (pauseScreen && pauseScore) {
            pauseScore.textContent = Math.floor(game.score);
            pauseScreen.classList.remove('hidden');
        }
    },

    hidePauseMenu() {
        const pauseScreen = document.getElementById('pause-screen');
        if (pauseScreen) {
            pauseScreen.classList.add('hidden');
        }
    },

    gameLoop(currentTime = 0) {
        requestAnimationFrame((time) => this.gameLoop(time));

        const deltaTime = currentTime - game.lastTime;
        game.lastTime = currentTime;

        let shakeX = 0;
        let shakeY = 0;
        if (game.screenShake.intensity > 0 && (game.state === 'playing' || game.state === 'paused' || game.state === 'gameOver')) {
            shakeX = (Math.random() - 0.5) * game.screenShake.intensity;
            shakeY = (Math.random() - 0.5) * game.screenShake.intensity;
        } else if (game.state === 'menu') {
            game.screenShake.intensity = 0;
            game.screenShake.duration = 0;
        }

        game.ctx.setTransform(1, 0, 0, 1, 0, 0);
        game.ctx.clearRect(0, 0, game.canvas.width, game.canvas.height);
        game.ctx.setTransform(game.dpr, 0, 0, game.dpr, shakeX * game.dpr, shakeY * game.dpr);

        const gradient = game.ctx.createLinearGradient(0, 0, 0, CONFIG.canvas.height);
        gradient.addColorStop(0, '#1a0033');
        gradient.addColorStop(0.5, '#330066');
        gradient.addColorStop(1, '#4d0099');
        game.ctx.fillStyle = gradient;
        game.ctx.fillRect(0, 0, CONFIG.canvas.width, CONFIG.canvas.height);

        this.backgroundStars.forEach(star => {
            star.update();
            star.draw(game.ctx);
        });

        if (game.state === 'playing') {
            this.update();
            this.draw();
        } else if (game.state === 'paused') {
            this.draw();
        } else if (game.state === 'gameOver') {
            this.updateVisualEffects();
            this.draw();
        } else if (game.state === 'menu') {
        }

        if (game.redFlash.intensity > 0) {
            game.ctx.setTransform(1, 0, 0, 1, 0, 0);
            game.ctx.fillStyle = `rgba(255, 0, 0, ${game.redFlash.intensity * 0.5})`;
            game.ctx.fillRect(0, 0, game.canvas.width, game.canvas.height);
        }
    },

    update() {
        this.updateVisualEffects();

        const collision = this.player.update(this.platforms, this.obstacles);

        if (collision) {
            this.handleCollision(collision);
            return;
        }

        if (game.invincible && Date.now() - game.invincibleTime > 5000) {
            game.invincible = false;
        }

        this.platforms.forEach(platform => platform.update());

        this.platforms = this.platforms.filter(p => p.x + p.width > -100);

        if (this.platforms.length < 5) {
            const lastPlatform = this.platforms[this.platforms.length - 1];
            const gap = CONFIG.platform.minGap + Math.random() * (CONFIG.platform.maxGap - CONFIG.platform.minGap);
            const width = CONFIG.platform.minWidth + Math.random() * (CONFIG.platform.maxWidth - CONFIG.platform.minWidth);
            this.platforms.push(new Platform(lastPlatform.x + lastPlatform.width + gap, width));
        }

        this.obstacles.forEach(obstacle => obstacle.update());
        this.obstacles = this.obstacles.filter(o => o.x > -100 && !o.destroyed);

        if (Math.random() < 0.015 && this.obstacles.length < 4) {
            const platform = this.platforms[Math.floor(Math.random() * Math.min(3, this.platforms.length))];
            if (platform) {
                const rand = Math.random();
                let type = 'star';
                if (rand > 0.7) type = 'floating';
                else if (rand > 0.85) type = 'moving';

                this.obstacles.push(new Obstacle(
                    platform.x + platform.width / 2,
                    platform.y - 60,
                    type
                ));
            }
        }

        this.powerups.forEach(powerup => powerup.update());
        this.powerups = this.powerups.filter(p => p.x > -100 && !p.collected);

        for (let powerup of this.powerups) {
            if (this.checkPowerUpCollision(powerup)) {
                this.collectPowerUp(powerup);
            }
        }

        if (Math.random() < 0.005 && this.powerups.length < 2) {
            const platform = this.platforms[Math.floor(Math.random() * Math.min(3, this.platforms.length))];
            if (platform) {
                const rand = Math.random();
                let type = 'invincibility';
                if (rand > 0.4) type = 'multiplier';
                else if (rand > 0.7) type = 'life';

                this.powerups.push(new PowerUp(
                    platform.x + platform.width / 2,
                    platform.y - 80,
                    type
                ));
            }
        }

        game.score += 1 * game.scoreMultiplier;
        if (game.scrollSpeed < CONFIG.game.maxScrollSpeed) {
            game.scrollSpeed += CONFIG.game.scrollAcceleration;
        }

        this.updateUI();
    },

    checkPowerUpCollision(powerup) {
        if (powerup.collected) return false;

        const player = this.player;
        const dx = (player.x + player.width / 2) - (powerup.x + powerup.size / 2);
        const dy = (player.y + player.height / 2) - (powerup.y + powerup.size / 2);
        const distance = Math.sqrt(dx * dx + dy * dy);

        return distance < (player.width / 2 + powerup.size / 2);
    },

    collectPowerUp(powerup) {
        powerup.collected = true;
        audioManager.playSound('powerup');

        switch (powerup.type) {
            case 'invincibility':
                game.invincible = true;
                game.invincibleTime = Date.now();
                break;

            case 'multiplier':
                game.scoreMultiplier = 2;
                setTimeout(() => {
                    game.scoreMultiplier = 1;
                }, 5000);
                break;

            case 'life':
                if (game.wishes < 3) {
                    game.wishes++;
                } else {
                    game.score += 500;
                }
                break;
        }

        this.updateUI();
    },

    draw() {
        this.platforms.forEach(platform => platform.draw(game.ctx));

        this.powerups.forEach(powerup => powerup.draw(game.ctx));

        this.obstacles.forEach(obstacle => obstacle.draw(game.ctx));

        if (this.player) {
            this.player.draw(game.ctx);
        }

        if (game.invincible) {
            game.ctx.save();
            game.ctx.globalAlpha = 0.3;
            game.ctx.fillStyle = '#ffd700';
            game.ctx.shadowBlur = 30;
            game.ctx.shadowColor = '#ffd700';
            game.ctx.beginPath();
            game.ctx.arc(
                this.player.x + this.player.width / 2,
                this.player.y + this.player.height / 2,
                this.player.width,
                0,
                Math.PI * 2
            );
            game.ctx.fill();
            game.ctx.restore();
        }
    },

    handleCollision(type) {
        if (game.invincible && type === 'fell') {
            let safeY = 200;
            let safeX = this.player.x;

            for (let platform of this.platforms) {
                if (platform.x <= this.player.x && platform.x + platform.width >= this.player.x) {
                    safeY = platform.y - this.player.height;
                    safeX = this.player.x;
                    break;
                }
            }

            this.player.y = safeY;
            this.player.velocityY = 0;
            this.player.velocityX = 0;
            this.player.isDashing = false;
            return;
        }

        if (!game.invincible) {
            game.wishes--;
            audioManager.playSound('hit');

            this.triggerScreenShake(15, 400);
            this.triggerRedFlash(0.6, 300);
            this.createHitEffect(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2);
            game.hitFlash.active = true;
            game.hitFlash.startTime = Date.now();

            if (game.wishes <= 0) {
                if (this.player) {
                    this.player.isDashing = false;
                    this.player.velocityX = 0;
                    this.player.velocityY = 0;
                }
                this.gameOver();
            } else {
                this.player.y = 200;
                this.player.velocityY = 0;
                this.player.velocityX = 0;
                this.player.isDashing = false;
                this.updateUI();
            }
        }
    },

    triggerScreenShake(intensity, duration) {
        game.screenShake.intensity = intensity;
        game.screenShake.duration = duration;
        game.screenShake.startTime = Date.now();
    },

    triggerRedFlash(intensity, duration) {
        game.redFlash.intensity = intensity;
        game.redFlash.duration = duration;
        game.redFlash.startTime = Date.now();
    },

    createHitEffect(x, y) {
        for (let i = 0; i < 30; i++) {
            const angle = (Math.PI * 2 * i) / 30;
            const speed = Math.random() * 8 + 4;
            const hue = Math.random() * 60 + 320;
            this.player.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed - game.scrollSpeed,
                vy: Math.sin(angle) * speed,
                size: Math.random() * 8 + 4,
                life: 1.0,
                hue: hue
            });
        }
    },

    updateVisualEffects() {
        const currentTime = Date.now();

        if (game.screenShake.duration > 0) {
            const elapsed = currentTime - game.screenShake.startTime;
            if (elapsed < game.screenShake.duration) {
                const progress = elapsed / game.screenShake.duration;
                game.screenShake.intensity = game.screenShake.intensity * (1 - progress);
            } else {
                game.screenShake.intensity = 0;
                game.screenShake.duration = 0;
            }
        }

        if (game.redFlash.duration > 0) {
            const elapsed = currentTime - game.redFlash.startTime;
            if (elapsed < game.redFlash.duration) {
                const progress = elapsed / game.redFlash.duration;
                game.redFlash.intensity = game.redFlash.intensity * (1 - progress);
            } else {
                game.redFlash.intensity = 0;
                game.redFlash.duration = 0;
            }
        }

        if (game.hitFlash.active) {
            const elapsed = currentTime - game.hitFlash.startTime;
            if (elapsed > game.hitFlash.duration) {
                game.hitFlash.active = false;
            }
        }
    },

    gameOver() {
        game.state = 'gameOver';
        audioManager.stopBackgroundMusic();

        game.invincible = false;
        game.invincibleTime = 0;
        game.scoreMultiplier = 1;

        this.triggerScreenShake(20, 250);
        this.triggerRedFlash(0.8, 200);

        game.hitFlash.active = false;

        const finalScore = Math.floor(game.score);
        document.getElementById('final-score').textContent = finalScore;

        const isNewHighScore = storageManager.saveHighScore(finalScore);
        if (isNewHighScore) {
            game.highScore = finalScore;
            document.getElementById('new-high-score').classList.remove('hidden');
        } else {
            document.getElementById('new-high-score').classList.add('hidden');
        }

        document.getElementById('game-over-screen').classList.remove('hidden');
        this.hidePauseMenu();
        this.updateUI();
    },

    selectSkin(skinIndex) {
        if (skinIndex >= 0 && skinIndex < assets.unicorns.length) {
            game.selectedSkin = skinIndex;
            storageManager.saveSelectedSkin(skinIndex);
            this.updateSkinSelector();
        }
    },

    updateSkinSelector() {
        const skinButtons = document.querySelectorAll('.skin-btn');
        if (skinButtons.length > 0) {
            skinButtons.forEach((btn, index) => {
                if (index === game.selectedSkin) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });
        }
    },

    attachButtonListeners() {
        const startBtn = document.getElementById('start-btn');
        if (startBtn && !startBtn.hasAttribute('data-listener-attached')) {
            startBtn.setAttribute('data-listener-attached', 'true');
            startBtn.addEventListener('click', (e) => {
                console.log('Start button clicked (re-attached)');
                e.preventDefault();
                e.stopPropagation();
                audioManager.ensureAudioContext();
                this.startGame();
            });
            console.log('✅ Start button listener re-attached');
        }
    },

    updateUI() {
        document.getElementById('score').textContent = Math.floor(game.score);
        document.getElementById('high-score').textContent = game.highScore;

        const wishesText = '❤️'.repeat(game.wishes) + '🖤'.repeat(3 - game.wishes);
        document.getElementById('wishes').textContent = wishesText;

        const multiplierEl = document.getElementById('multiplier');
        if (game.scoreMultiplier > 1) {
            multiplierEl.textContent = `${game.scoreMultiplier}x`;
            multiplierEl.classList.remove('hidden');
        } else {
            multiplierEl.classList.add('hidden');
        }

        const invincibleEl = document.getElementById('invincible');
        if (game.invincible) {
            invincibleEl.classList.remove('hidden');
        } else {
            invincibleEl.classList.add('hidden');
        }
    }
};

window.addEventListener('load', () => {
    console.log('🦄 Robot Unicorn Attack - Initializing...');
    try {
        gameManager.init();
        console.log('✅ Game ready! Click START GAME to play.');

        setTimeout(() => {
            const startBtn = document.getElementById('start-btn');
            const skinBtns = document.querySelectorAll('.skin-btn');
            console.log('🔍 Debug: Start button exists?', !!startBtn);
            console.log('🔍 Debug: Skin buttons found:', skinBtns.length);

            if (startBtn) {
                console.log('🔍 Debug: Start button computed style:', window.getComputedStyle(startBtn).pointerEvents);
            }
        }, 500);
    } catch (error) {
        console.error('❌ Error initializing game:', error);
        alert('Failed to initialize game: ' + error.message);
    }
});

