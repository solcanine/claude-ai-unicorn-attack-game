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
            // Create audio context for sound effects
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.initialized = true;
            
            // Background music (simple synthesized loop)
            this.createBackgroundMusic();
        } catch (e) {
            console.warn('Audio initialization failed:', e);
            this.initialized = false;
        }
    },

    ensureAudioContext() {
        if (!this.initialized || !this.audioContext) return false;
        
        // Resume audio context if suspended (required by browsers)
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume().catch(e => console.warn('Failed to resume audio:', e));
        }
        return true;
    },

    createBackgroundMusic() {
        // Create a simple upbeat melody using Web Audio API
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
                { freq: 523.25, duration: 0.2 }, // C5
                { freq: 587.33, duration: 0.2 }, // D5
                { freq: 659.25, duration: 0.2 }, // E5
                { freq: 783.99, duration: 0.2 }, // G5
                { freq: 659.25, duration: 0.2 }, // E5
                { freq: 783.99, duration: 0.4 }, // G5
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

            switch(type) {
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
    state: 'menu', // menu, playing, paused, gameOver
    score: 0,
    wishes: 3,
    scrollSpeed: CONFIG.game.scrollSpeed,
    keys: {},
    lastTime: 0,
    highScore: 0,
    scoreMultiplier: 1,
    invincible: false,
    invincibleTime: 0,
    dpr: 1
};

// Asset Manager (loads SVG sprites for canvas drawImage)
const assets = {
    unicorn: {
        img: null,
        loaded: false,
        failed: false
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
        return parseInt(localStorage.getItem('unicornAttackHighScore') || '0');
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
        // Smooth rainbow ribbon trail (replaces bubble particles)
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
        // Dash logic
        if (this.isDashing) {
            if (Date.now() - this.dashTime > CONFIG.player.dashDuration) {
                this.isDashing = false;
                this.velocityX = 0;
            }
        }

        // Apply gravity
        if (!this.isGrounded) {
            this.velocityY += CONFIG.player.gravity;
        }

        // Update position
        this.y += this.velocityY;
        this.x += this.velocityX;

        // Keep player in bounds horizontally
        if (this.x > CONFIG.player.x) {
            this.x = CONFIG.player.x;
            this.velocityX = 0;
        }
        if (this.x < 50) {
            this.x = 50;
        }

        // Rotation while in air
        if (!this.isGrounded && this.velocityY < 0) {
            this.rotation = Math.min(this.rotation + 0.05, 0.3);
        } else if (!this.isGrounded) {
            this.rotation = Math.max(this.rotation - 0.05, -0.3);
        } else {
            this.rotation *= 0.9;
        }

        // Platform collision
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

        // Check if fell off screen
        if (this.y > CONFIG.canvas.height) {
            return 'fell';
        }

        // Obstacle collision
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

        // Update particles
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
        // Rainbow ribbon trail points (instead of bubbles)
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

            // Limit length for performance
            if (this.trail.length > 60) {
                this.trail.shift();
            }
        }

        // Update trail points so they drift left with world scroll
        this.trail = this.trail.filter(t => {
            t.x -= game.scrollSpeed;
            t.life -= 0.03;
            return t.life > 0;
        });

        // Update and remove spark particles (used for explosions)
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
        // Draw rainbow ribbon trail (7 crisp stripes like the classic game)
        if (this.trail.length > 1) {
            ctx.save();
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            const stripes = [
                '#ff0000', // Red
                '#ff7a00', // Orange
                '#ffe600', // Yellow
                '#2dff4a', // Green
                '#00e5ff', // Cyan
                '#2a6bff', // Blue
                '#b400ff'  // Violet
            ];

            // Helper: draw a smooth curve through the trail points with an added y-offset
            const drawSmoothTrail = (yOffset) => {
                ctx.beginPath();
                const pts = this.trail;
                // Move to first point
                ctx.moveTo(pts[0].x, pts[0].y + yOffset);
                // Quadratic smoothing: curve to midpoints
                for (let i = 1; i < pts.length - 1; i++) {
                    const xc = (pts[i].x + pts[i + 1].x) / 2;
                    const yc = (pts[i].y + pts[i + 1].y) / 2 + yOffset;
                    ctx.quadraticCurveTo(pts[i].x, pts[i].y + yOffset, xc, yc);
                }
                // Final segment
                const last = pts[pts.length - 1];
                ctx.lineTo(last.x, last.y + yOffset);
            };

            // Soft glow behind the whole rainbow (single stroke, not per-color blur)
            ctx.globalAlpha = 0.25;
            ctx.shadowBlur = 22;
            ctx.shadowColor = 'rgba(255,255,255,0.6)';
            ctx.strokeStyle = 'rgba(255,255,255,0.35)';
            ctx.lineWidth = 26;
            drawSmoothTrail(0);
            ctx.stroke();

            // Draw 7 separate, clearly-visible stripes (no heavy blur so colors don't blend)
            ctx.globalAlpha = 0.95;
            ctx.shadowBlur = 0;

            const stripeThickness = 4.2; // thickness of each band
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
                const t = Date.now() / 60; // speed
                const start = Math.floor(t % (pts.length - shimmerLen));
                const end = start + shimmerLen;

                ctx.save();
                ctx.globalCompositeOperation = 'lighter';
                ctx.globalAlpha = 0.7;
                ctx.shadowBlur = 18;
                ctx.shadowColor = 'rgba(255,255,255,0.9)';

                // A thin highlight across the center of the rainbow
                ctx.lineWidth = 3;

                // Gradient so the highlight fades at the ends
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

                // Tiny sparkle point at the leading edge
                ctx.globalAlpha = 0.9;
                ctx.fillStyle = 'rgba(255,255,255,0.95)';
                ctx.beginPath();
                ctx.arc(p1.x, p1.y, 2.2, 0, Math.PI * 2);
                ctx.fill();

                ctx.restore();
            }

            ctx.restore();
        }

        // Draw explosion spark particles
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

        // Draw player
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate(this.rotation);

        // Dash effect
        if (this.isDashing) {
            ctx.shadowBlur = 30;
            ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
        }

        // Prefer SVG sprite if available, fallback to simple shape
        const unicornSprite = assets?.unicorn;
        if (unicornSprite?.loaded && unicornSprite.img) {
            ctx.imageSmoothingEnabled = true;
            ctx.drawImage(unicornSprite.img, -this.width / 2, -this.height / 2, this.width, this.height);
        } else {
            // Body (fallback unicorn shape)
            ctx.fillStyle = this.isDashing ? '#ffffff' : '#e0e0e0';
            ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);

            // Horn
            ctx.fillStyle = '#ffd700';
            ctx.beginPath();
            ctx.moveTo(-this.width / 2 + 10, -this.height / 2);
            ctx.lineTo(-this.width / 2 + 20, -this.height / 2 - 20);
            ctx.lineTo(-this.width / 2 + 15, -this.height / 2);
            ctx.fill();

            // Eye
            ctx.fillStyle = '#ff1493';
            ctx.beginPath();
            ctx.arc(-this.width / 2 + 15, -this.height / 2 + 15, 5, 0, Math.PI * 2);
            ctx.fill();

            // Legs (simple lines)
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
        // Platform with gradient
        const gradient = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
        gradient.addColorStop(0, '#ff1493');
        gradient.addColorStop(0.5, '#9400d3');
        gradient.addColorStop(1, '#4b0082');
        
        ctx.fillStyle = gradient;
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'rgba(255, 20, 147, 0.5)';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.shadowBlur = 0;

        // Stars on platform
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

// Obstacle Class (Stars to break through)
class Obstacle {
    constructor(x, y, type = 'star') {
        this.x = x;
        this.y = y;
        this.size = 40;
        this.destroyed = false;
        this.rotation = 0;
        this.type = type; // 'star', 'floating', 'moving'
        this.initialY = y;
        this.time = 0;
    }

    update() {
        this.x -= game.scrollSpeed;
        this.rotation += 0.05;
        this.time += 0.05;

        // Different movement patterns
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

        // Different colors for different types
        let color = '#ff00ff';
        if (this.type === 'floating') {
            color = '#00ffff';
        } else if (this.type === 'moving') {
            color = '#ff9900';
        }

        // Draw star obstacle
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

        // Inner glow
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, innerRadius / 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

// PowerUp Class
class PowerUp {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.size = 30;
        this.type = type; // 'invincibility', 'multiplier', 'life'
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

        // Different appearance based on type
        switch(this.type) {
            case 'invincibility':
                // Golden star
                ctx.fillStyle = '#ffd700';
                ctx.shadowBlur = 20;
                ctx.shadowColor = '#ffd700';
                this.drawStar(ctx, 0, 0, 5, this.size / 2 + pulseSize, this.size / 4);
                break;
            
            case 'multiplier':
                // Purple diamond
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
                
                // 2x text
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 14px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('2x', 0, 0);
                break;
            
            case 'life':
                // Red heart
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

// Background stars
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

// Game Manager
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
            // HiDPI / mobile-friendly rendering:
            // - Keep game logic in fixed logical coords (CONFIG.canvas.*)
            // - Render to a higher-resolution backing store using devicePixelRatio
            game.dpr = Math.max(1, Math.min(3, window.devicePixelRatio || 1));
            game.canvas.width = Math.floor(CONFIG.canvas.width * game.dpr);
            game.canvas.height = Math.floor(CONFIG.canvas.height * game.dpr);
            // CSS keeps it responsive
            game.canvas.style.width = '100%';
            game.canvas.style.height = 'auto';

            // Load high score
            game.highScore = storageManager.getHighScore();

            // Initialize audio (non-blocking)
            try {
                audioManager.init();
            } catch (e) {
                console.warn('Audio initialization failed, continuing without audio:', e);
            }

            // Load sprite assets
            assets.unicorn.img = new Image();
            assets.unicorn.img.onload = () => {
                assets.unicorn.loaded = true;
                assets.unicorn.failed = false;
            };
            assets.unicorn.img.onerror = () => {
                assets.unicorn.loaded = false;
                assets.unicorn.failed = true;
                console.warn('Failed to load unicorn sprite (assets/unicorn.png). Falling back to canvas shape.');
            };
            assets.unicorn.img.src = 'assets/unicorn.png';

            this.setupEventListeners();
            this.createBackgroundStars();
            this.updateUI();
            
            // Update menu high score
            const menuHighScore = document.getElementById('menu-high-score');
            if (menuHighScore) {
                menuHighScore.textContent = game.highScore;
            }
            
            this.gameLoop();
        } catch (e) {
            console.error('Game initialization failed:', e);
            alert('Failed to initialize game. Please refresh the page and try again.');
        }
    },

    setupEventListeners() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            game.keys[e.code] = true;

            // Allow pause toggle from both playing and paused states
            if (e.code === 'KeyP' && (game.state === 'playing' || game.state === 'paused')) {
                e.preventDefault();
                this.togglePause();
                return;
            }

            // Optional: Space also resumes from pause (nice UX)
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

        // Button controls
        const startBtn = document.getElementById('start-btn');
        if (startBtn) {
            startBtn.addEventListener('click', (e) => {
                console.log('Start button clicked');
                e.preventDefault();
                // Resume audio context on user interaction
                audioManager.ensureAudioContext();
                this.startGame();
            });
        } else {
            console.error('Start button not found!');
        }

        const restartBtn = document.getElementById('restart-btn');
        if (restartBtn) {
            restartBtn.addEventListener('click', (e) => {
                console.log('Restart button clicked');
                e.preventDefault();
                // Resume audio context on user interaction
                audioManager.ensureAudioContext();
                this.startGame();
            });
        } else {
            console.error('Restart button not found!');
        }

        // Mobile touch controls
        // IMPORTANT: passive:false so preventDefault() actually blocks scroll/zoom on mobile
        game.canvas.addEventListener(
            'touchstart',
            (e) => {
                e.preventDefault();
                const touch = e.touches[0];
                this.touchStartY = touch.clientY;
                this.touchStartX = touch.clientX;

                if (game.state === 'playing') {
                    // Tap on right side = dash, anywhere else = jump
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

        // Mute button
        const muteBtn = document.getElementById('mute-btn');
        if (muteBtn) {
            muteBtn.addEventListener('click', () => {
                const muted = audioManager.toggleMute();
                muteBtn.textContent = muted ? '🔇' : '🔊';
            });
        }

        // Window resize handler for mobile orientation changes
        let resizeTimeout;
        const handleResizeEvent = () => {
            // Debounce resize events
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.handleResize();
            }, 250);
        };

        window.addEventListener('resize', handleResizeEvent);
        
        // Also listen for orientation change (better mobile support)
        window.addEventListener('orientationchange', () => {
            // Orientation change needs a slight delay for accurate dimensions
            setTimeout(() => {
                this.handleResize();
            }, 300);
        });

        // Listen for screen orientation API if available
        if (screen.orientation) {
            screen.orientation.addEventListener('change', handleResizeEvent);
        }
    },

    handleResize() {
        // Update canvas dimensions with device pixel ratio
        game.dpr = Math.max(1, Math.min(3, window.devicePixelRatio || 1));
        game.canvas.width = Math.floor(CONFIG.canvas.width * game.dpr);
        game.canvas.height = Math.floor(CONFIG.canvas.height * game.dpr);
        // CSS keeps it responsive
        game.canvas.style.width = '100%';
        game.canvas.style.height = 'auto';
        
        // Log orientation for debugging
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

            this.player = new Player();
            this.platforms = [];
            this.obstacles = [];
            this.powerups = [];

            // Create initial platforms
            let x = 0;
            for (let i = 0; i < 5; i++) {
                const width = CONFIG.platform.minWidth + Math.random() * (CONFIG.platform.maxWidth - CONFIG.platform.minWidth);
                this.platforms.push(new Platform(x, width));
                x += width + CONFIG.platform.minGap + Math.random() * (CONFIG.platform.maxGap - CONFIG.platform.minGap);
            }

            document.getElementById('start-screen').classList.add('hidden');
            document.getElementById('game-over-screen').classList.add('hidden');

            // Start music (if available)
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
        } else if (game.state === 'paused') {
            game.state = 'playing';
        }
    },

    gameLoop(currentTime = 0) {
        requestAnimationFrame((time) => this.gameLoop(time));

        const deltaTime = currentTime - game.lastTime;
        game.lastTime = currentTime;

        // Clear canvas (reset transform because DPR scaling is applied)
        game.ctx.setTransform(1, 0, 0, 1, 0, 0);
        game.ctx.clearRect(0, 0, game.canvas.width, game.canvas.height);
        // Apply DPR transform so all drawing uses logical coordinates
        game.ctx.setTransform(game.dpr, 0, 0, game.dpr, 0, 0);

        // Draw background gradient
        const gradient = game.ctx.createLinearGradient(0, 0, 0, CONFIG.canvas.height);
        gradient.addColorStop(0, '#1a0033');
        gradient.addColorStop(0.5, '#330066');
        gradient.addColorStop(1, '#4d0099');
        game.ctx.fillStyle = gradient;
        game.ctx.fillRect(0, 0, CONFIG.canvas.width, CONFIG.canvas.height);

        // Draw background stars
        this.backgroundStars.forEach(star => {
            star.update();
            star.draw(game.ctx);
        });

        if (game.state === 'playing') {
            this.update();
            this.draw();
        } else if (game.state === 'paused') {
            this.draw();
            // Draw paused text
            game.ctx.save();
            game.ctx.fillStyle = 'white';
            game.ctx.font = 'bold 48px Arial';
            game.ctx.textAlign = 'center';
            game.ctx.fillText('PAUSED', CONFIG.canvas.width / 2, CONFIG.canvas.height / 2);
            game.ctx.restore();
        } else if (game.state === 'gameOver' || game.state === 'menu') {
            // Only draw background, don't draw game objects
            // The UI overlay will handle the menu/game over screens
        }
    },

    update() {
        // Update player
        const collision = this.player.update(this.platforms, this.obstacles);

        if (collision) {
            this.handleCollision(collision);
            return;
        }

        // Check power-up effects duration
        if (game.invincible && Date.now() - game.invincibleTime > 5000) {
            game.invincible = false;
        }

        // Update platforms
        this.platforms.forEach(platform => platform.update());

        // Remove off-screen platforms and create new ones
        this.platforms = this.platforms.filter(p => p.x + p.width > -100);
        
        if (this.platforms.length < 5) {
            const lastPlatform = this.platforms[this.platforms.length - 1];
            const gap = CONFIG.platform.minGap + Math.random() * (CONFIG.platform.maxGap - CONFIG.platform.minGap);
            const width = CONFIG.platform.minWidth + Math.random() * (CONFIG.platform.maxWidth - CONFIG.platform.minWidth);
            this.platforms.push(new Platform(lastPlatform.x + lastPlatform.width + gap, width));
        }

        // Update obstacles
        this.obstacles.forEach(obstacle => obstacle.update());
        this.obstacles = this.obstacles.filter(o => o.x > -100 && !o.destroyed);

        // Create new obstacles randomly with different types
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

        // Update power-ups
        this.powerups.forEach(powerup => powerup.update());
        this.powerups = this.powerups.filter(p => p.x > -100 && !p.collected);

        // Check power-up collection
        for (let powerup of this.powerups) {
            if (this.checkPowerUpCollision(powerup)) {
                this.collectPowerUp(powerup);
            }
        }

        // Create new power-ups randomly
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

        // Increase score and speed
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

        switch(powerup.type) {
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
                    game.score += 500; // Bonus points if already at max lives
                }
                break;
        }

        this.updateUI();
    },

    draw() {
        // Draw platforms
        this.platforms.forEach(platform => platform.draw(game.ctx));

        // Draw power-ups
        this.powerups.forEach(powerup => powerup.draw(game.ctx));

        // Draw obstacles
        this.obstacles.forEach(obstacle => obstacle.draw(game.ctx));

        // Draw player
        if (this.player) {
            this.player.draw(game.ctx);
        }

        // Draw invincibility effect
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
        if (!game.invincible) {
            game.wishes--;
            audioManager.playSound('hit');
            
            if (game.wishes <= 0) {
                // Reset player state before game over
                if (this.player) {
                    this.player.isDashing = false;
                    this.player.velocityX = 0;
                    this.player.velocityY = 0;
                }
                this.gameOver();
            } else {
                // Reset player position
                this.player.y = 200;
                this.player.velocityY = 0;
                this.player.velocityX = 0;
                this.player.isDashing = false;
                this.updateUI();
            }
        }
    },

    gameOver() {
        game.state = 'gameOver';
        audioManager.stopBackgroundMusic();
        
        // Clear all power-up states to prevent bugs
        game.invincible = false;
        game.invincibleTime = 0;
        game.scoreMultiplier = 1;
        
        const finalScore = Math.floor(game.score);
        document.getElementById('final-score').textContent = finalScore;
        
        // Check and save high score
        const isNewHighScore = storageManager.saveHighScore(finalScore);
        if (isNewHighScore) {
            game.highScore = finalScore;
            document.getElementById('new-high-score').classList.remove('hidden');
        } else {
            document.getElementById('new-high-score').classList.add('hidden');
        }
        
        document.getElementById('game-over-screen').classList.remove('hidden');
        this.updateUI();
    },

    updateUI() {
        document.getElementById('score').textContent = Math.floor(game.score);
        document.getElementById('high-score').textContent = game.highScore;
        
        const wishesText = '❤️'.repeat(game.wishes) + '🖤'.repeat(3 - game.wishes);
        document.getElementById('wishes').textContent = wishesText;

        // Show multiplier indicator
        const multiplierEl = document.getElementById('multiplier');
        if (game.scoreMultiplier > 1) {
            multiplierEl.textContent = `${game.scoreMultiplier}x`;
            multiplierEl.classList.remove('hidden');
        } else {
            multiplierEl.classList.add('hidden');
        }

        // Show invincibility indicator
        const invincibleEl = document.getElementById('invincible');
        if (game.invincible) {
            invincibleEl.classList.remove('hidden');
        } else {
            invincibleEl.classList.add('hidden');
        }
    }
};

// Initialize game when page loads
window.addEventListener('load', () => {
    console.log('🦄 Robot Unicorn Attack - Initializing...');
    gameManager.init();
    console.log('✅ Game ready! Click START GAME to play.');
});

