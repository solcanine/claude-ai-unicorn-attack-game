# 🦄 Robot Unicorn Attack

A web-based recreation of the classic endless runner game "Robot Unicorn Attack" using HTML5 Canvas and vanilla JavaScript.

## 🎮 Features

- **Smooth endless runner gameplay** - Auto-scrolling platforms with increasing difficulty
- **Jump & Double Jump** - Press SPACE to jump, press again in mid-air for double jump
- **Dash Attack** - Press Z to dash through star obstacles
- **Rainbow Particle Effects** - Beautiful trail effects following the unicorn
- **Score System** - Gain points for surviving and destroying obstacles
- **3 Wishes (Lives)** - Get three chances before game over
- **High Score Tracking** - Your best score is saved locally in your browser
- **Sound Effects & Music** - Dynamic audio with synthesized sound effects and background music
- **Power-Ups System**:
  - ⭐ **Invincibility** (Golden Star) - 5 seconds of invulnerability
  - 💎 **2x Multiplier** (Purple Diamond) - Double your score for 5 seconds
  - ❤️ **Extra Life** (Pink Heart) - Gain an additional wish (or bonus points if maxed)
- **Multiple Obstacle Types**:
  - 💜 Standard rotating stars
  - 🔷 Floating obstacles (cyan) - Move up and down slowly
  - 🟠 Moving obstacles (orange) - Move up and down quickly
- **Mobile Touch Controls** - Play on your phone or tablet!
- **Responsive Controls** - Smooth keyboard controls with cooldowns

## 🕹️ Controls

### PC / Keyboard

| Key       | Action                      |
| --------- | --------------------------- |
| **SPACE** | Jump / Double Jump          |
| **Z**     | Dash (breaks through stars) |
| **P**     | Pause / Unpause             |

### Mobile / Touch

| Action   | Control                               |
| -------- | ------------------------------------- |
| **Jump** | Tap anywhere on left/center of screen |
| **Dash** | Tap on the right side of the screen   |

### UI Controls

- **🔊/🔇 Button** - Toggle sound on/off

## 🚀 How to Play

1. Open `index.html` in a modern web browser
2. Click "START GAME" or press SPACE to begin
3. Jump across platforms and avoid falling
4. Dash through star obstacles (or jump over them)
5. Try to get the highest score possible!

## 📁 Project Structure

```
unicorn-attack-game/
├── index.html      # Main HTML file
├── style.css       # Styling and animations
├── game.js         # Game logic and rendering
└── README.md       # This file
```

## 🎨 Game Mechanics

### Player

- Auto-runs forward at increasing speed
- Can jump (2 jumps available - ground jump + air jump)
- Dash ability with cooldown (1 second)
- Dies when falling off platforms or hitting obstacles without dashing

### Platforms

- Randomly generated with varying gaps and widths
- Beautiful gradient colors (pink to purple)
- Decorated with small stars

### Obstacles

- **Standard Stars (Magenta)** - Rotating obstacles that appear on platforms
- **Floating Stars (Cyan)** - Move up and down slowly in a sine wave pattern
- **Moving Stars (Orange)** - Move up and down quickly with larger amplitude
- Can be destroyed by dashing through them (+100 points × multiplier)
- Hitting them without dashing or invincibility costs one life

### Power-Ups

- **Golden Star (⭐)** - Grants 5 seconds of invincibility
- **Purple Diamond (💎)** - 2x score multiplier for 5 seconds
- **Pink Heart (❤️)** - Grants an extra life (or +500 points if at max lives)
- Appear randomly on platforms
- Collected automatically when player touches them

### Scoring

- Continuous score for surviving (1 point per frame × multiplier)
- Bonus points for destroying obstacles (100 points × multiplier)
- Extra life power-up gives +500 points if already at max lives
- High score is saved in browser localStorage
- Speed gradually increases over time

## 🛠️ Technical Details

- **Built with**: Vanilla JavaScript (ES6+), HTML5 Canvas, CSS3, Web Audio API
- **No dependencies** - Runs directly in browser
- **Resolution**: 1000x600 canvas
- **Frame Rate**: 60 FPS (using requestAnimationFrame)
- **Physics**: Custom gravity and collision detection
- **Audio**: Synthesized sound effects and music using Web Audio API
- **Storage**: High scores saved to localStorage
- **Mobile Support**: Touch event handlers for mobile gameplay

## 🎯 Future Enhancements

Potential features to add:

- [x] Sound effects and background music ✅
- [x] Power-ups (invincibility, score multipliers) ✅
- [x] High score tracking (localStorage) ✅
- [x] Mobile touch controls ✅
- [x] More obstacle types ✅
- [ ] Multiple unicorn skins
- [ ] Online leaderboard
- [ ] Different background themes
- [ ] Combo system for consecutive obstacle destruction
- [ ] Additional power-up types
- [ ] Achievement system
- [ ] Customizable difficulty levels

## 🌟 Credits

Inspired by the original "Robot Unicorn Attack" by Adult Swim Games.

Built with ❤️ and 🦄

---

**Enjoy the game! Always believe in your dreams! ✨**
