// Enemy Weakness/Resistance System
const ENEMY_TYPES = {
    'Skeleton': {
        resistances: { physical: 0.7 },
        weaknesses: { magic: 1.5 }
    },
    'Spider': {
        resistances: { magic: 0.8 },
        weaknesses: { physical: 1.4 }
    },
    'Slime': {
        resistances: { physical: 0.7 },
        weaknesses: { magic: 1.3 }
    },
    'Goblin': {
        resistances: { magic: 0.6},
        weaknesses: { physical: 2}
    },
    'Orc': {
        resistances: { physical: 0.9 },
        weaknesses: { magic: 1.2 }
    },
    'Wolf': {
        resistances: { physical: 0.85 },
        weaknesses: {}
    },
    'Bat': {
        resistances: { magic: 0.9 },
        weaknesses: { physical: 1.3 }
    },
    'Serpent': {
        resistances: { magic: 0.8 },
        weaknesses: { physical: 1.2 }
    },
    'Wraith': {
        resistances: { physical: 0.5 },
        weaknesses: { magic: 1.6 }
    },
    'Gnoll': {
        resistances: {},
        weaknesses: {}
    }
};

// Game State
class Player {
    constructor() {
        this.hp = 100;
        this.maxHp = 100;
        this.mp = 50;
        this.maxMp = 50;
        this.attack = 10;
        this.defense = 5;
        this.magic = 8;
        this.level = 1;
        this.xp = 0;
        this.xpToNext = 100;
        this.gold = 0;
        this.dungeonDepth = 1;
        this.roomsCleared = 0;
        this.enemiesKilled = 0;
        this.bossesKilled = 0;
    }

    heal(amount) {
        this.hp = Math.min(this.hp + amount, this.maxHp);
    }

    restoreMp(amount) {
        this.mp = Math.min(this.mp + amount, this.maxMp);
    }

    takeDamage(damage) {
        const actualDamage = Math.max(1, Math.floor(damage - (this.defense * 0.5)));
        this.hp = Math.max(0, this.hp - actualDamage);
        return actualDamage;
    }

    gainXp(amount) {
        this.xp += amount;
        if (this.xp >= this.xpToNext) {
            this.levelUp();
        }
    }

    levelUp() {
        this.level++;
        this.xp -= this.xpToNext;
        this.xpToNext = Math.floor(this.xpToNext * 1.2) + 50;
        
        // Base +2 to all stats
        this.maxHp += 3;
        this.maxMp += 3;
        this.attack += 3;
        this.defense += 3;
        this.magic += 3;
        
        // Restore 50% on level up
        this.hp = Math.min(this.hp + Math.floor(this.maxHp * 0.50), this.maxHp);
        this.mp = Math.min(this.mp + Math.floor(this.maxMp * 0.50), this.maxMp);
        
        // Bonus points tracking
        const bonuses = { hp: 0, mp: 0, atk: 0, def: 0, mag: 0 };
        
        // Distribute 5 random bonus points
        for (let i = 0; i < 6; i++) {
            const stats = ['hp', 'mp', 'atk', 'def', 'mag'];
            const chosen = stats[Math.floor(Math.random() * stats.length)];
            bonuses[chosen]++;
            
            switch(chosen) {
                case 'hp': this.maxHp += 1; this.hp += 1; break;
                case 'mp': this.maxMp += 1; this.mp += 1; break;
                case 'atk': this.attack += 1; break;
                case 'def': this.defense += 1; break;
                case 'mag': this.magic += 1; break;
            }
        }
        
        game.showLevelUp(bonuses);
        game.log(`✨ Level Up! You are now level ${this.level}!`, 'levelup');
        game.updateUI();
    }
}

class Enemy {
    constructor(playerLevel, dungeonDepth, isBoss = false) {
        this.isBoss = isBoss;
        this.playerLevel = playerLevel;
        this.dungeonDepth = dungeonDepth;
        this.name = this.generateName();
        
        // Boss multiplier is 3x for significant challenge
        const bossMultiplier = isBoss ? 3 : 1;
        
        // Variance for individual enemy differences (small range: 0.9 to 1.1) was 0.2 + 0.9
        const variance = () => Math.random() * 0.2 + 1;
        
        // Scale enemies based on player level, not depth
        // This ensures enemies stay challenging but fair as player levels up
        const levelScaling = playerLevel;
        
        // Base stats scale with player level
        // Regular enemies: scale aggressively to maintain challenge throughout game
        // Increased multipliers to prevent power creep at mid-game
        this.maxHp = Math.floor((30 + (levelScaling * 13)) * bossMultiplier * variance());
        this.hp = this.maxHp;
        this.attack = Math.floor((12 + (levelScaling * 3)) * bossMultiplier * variance());
        this.defense = Math.floor((5 + (levelScaling * 1.2)) * bossMultiplier * variance());
        this.magic = Math.floor((7 + (levelScaling * 2.3)) * bossMultiplier * variance());
        
        // XP and gold reduced significantly for better balance
        // Gold is now much more limited to prevent overpowering
        this.xp = Math.floor((25 + (levelScaling * 8)) * bossMultiplier + (dungeonDepth * 1));
        this.gold = Math.floor((8 + (levelScaling * 2)) * bossMultiplier + (dungeonDepth * 0.5));
        
        // Set weaknesses and resistances
        this.setWeaknessesAndResistances();
    }

    setWeaknessesAndResistances() {
        // Extract enemy type from name
        const nouns = ['Skeleton', 'Spider', 'Slime', 'Goblin', 'Orc', 'Wolf', 'Bat', 'Serpent', 'Wraith', 'Gnoll'];
        let enemyType = null;
        
        for (const noun of nouns) {
            if (this.name.includes(noun)) {
                enemyType = noun;
                break;
            }
        }
        
        if (enemyType && ENEMY_TYPES[enemyType]) {
            this.resistances = ENEMY_TYPES[enemyType].resistances;
            this.weaknesses = ENEMY_TYPES[enemyType].weaknesses;
        } else {
            this.resistances = {};
            this.weaknesses = {};
        }
    }

    generateName() {
        if (this.isBoss) {
            const titles = ['Ancient', 'Corrupted', 'Eldritch', 'Fallen', 'Cursed'];
            const names = ['Malakar', 'Zephyros', 'Vorthak', 'Shadowmere', 'Nightshade', 'Drakthar', 'Soulreaper'];
            const types = ['Lord', 'King', 'Titan', 'Overlord', 'Destroyer'];
            return `${titles[Math.floor(Math.random() * titles.length)]} ${names[Math.floor(Math.random() * names.length)]} the ${types[Math.floor(Math.random() * types.length)]}`;
        }
        
        const adj = ['Fierce', 'Dark', 'Rotting', 'Vicious', 'Savage', 'Twisted', 'Bloodthirsty'];
        const nouns = ['Skeleton', 'Goblin', 'Orc', 'Spider', 'Slime', 'Wolf', 'Bat', 'Serpent', 'Wraith', 'Gnoll'];
        return `${adj[Math.floor(Math.random() * adj.length)]} ${nouns[Math.floor(Math.random() * nouns.length)]}`;
    }

    takeDamage(damage, damageType = 'physical') {
        let finalDamage = damage;
        
        // Apply resistances and weaknesses
        if (damageType === 'physical' && this.resistances.physical) {
            finalDamage *= this.resistances.physical;
        } else if (damageType === 'magic' && this.resistances.magic) {
            finalDamage *= this.resistances.magic;
        }
        
        if (damageType === 'physical' && this.weaknesses.physical) {
            finalDamage *= this.weaknesses.physical;
        } else if (damageType === 'magic' && this.weaknesses.magic) {
            finalDamage *= this.weaknesses.magic;
        }
        
        const actual = Math.max(1, Math.floor(finalDamage - this.defense));
        this.hp = Math.max(0, this.hp - actual);
        return actual;
    }
}

class Game {
    constructor() {
        this.player = new Player();
        this.state = 'exploring'; // exploring, combat, shop, chest, boss_warning
        this.currentEnemy = null;
        this.awaitingBossDecision = false;
        this.autoScroll = true;
        this.messageHistory = [];
        
        this.init();
    }

    init() {
        this.updateUI();
        this.showIntro();
    }

    showIntro() {
        this.log("🏰 THE DUNGEON OF ETERNAL SHADOWS", 'system');
        this.log("You awaken on cold, damp stone. Your head throbs with pain.", 'flavor');
        this.log("Torches flicker on the walls of this ancient dungeon. You remember nothing of how you arrived here.", 'flavor');
        this.log("A faded inscription on the wall reads: 'Descend to ascend. Only at the depths can one find the path to freedom.'", 'magic');
        this.log("You must escape this dungeon. Gather your strength, defeat the horrors within, and find the exit!", 'special');
        this.log("", 'normal');
        this.log("🎯 OBJECTIVE: Survive the dungeon, defeat enemies, and delve deeper to find the escape!", 'special');
        this.log("You stand at a crossroads. Which path will you take?", 'system');
        this.log("DON'T TURN LEFT AT CROSSREADS!!!", 'special');
        this.log("DON'T TURN LEFT AT CROSSREADS!!!", 'special');
        this.log("DON'T TURN LEFT AT CROSSREADS!!!", 'special');
        this.log("DON'T TURN LEFT AT CROSSREADS!!!", 'special');
        this.log("DON'T TURN LEFT AT CROSSREADS!!!", 'special');
        
        // Start with path selection instead of auto-generating a room
        setTimeout(() => {
            this.showExplorationChoices();
        }, 500);
    }

    // Core Systems
    generateRoom() {
        const roll = Math.random();
        this.player.dungeonDepth++;
        
        if (this.player.dungeonDepth % 10 === 0 && !this.awaitingBossDecision) {
            this.showBossWarning();
            return;
        }
        
        let roomType;
        if (roll < 0.40) roomType = 'enemy';
        else if (roll < 0.40) roomType = 'chest';
        else if (roll < 0.55) roomType = 'shop';
        else roomType = 'empty';
        
        this.enterRoom(roomType);
    }

    enterRoom(type) {
        this.player.roomsCleared++;
        this.updateUI();
        
        // Alert player if entering a shop
        if (type === 'shop') {
            this.log("🏪 A MERCHANT IS HERE! You can buy items and upgrades!", 'special');
        }
        
        const descriptions = {
            empty: [
                "You enter a quiet chamber. The silence is deafening.",
                "An empty room lies before you, nothing but dust and shadows.",
                "The corridor stretches ahead, eerily silent.",
                "You find a abandoned resting area. Nothing of interest here.",
                "The room smells of damp stone and old earth."
            ],
            enemy: [
                "A shadow moves in the darkness! An enemy emerges!",
                "You hear a growl as something lunges at you from the shadows!",
                "The door slams shut behind you. You're trapped with a foe!",
                "Red eyes gleam in the darkness ahead...",
                "The stench of death fills this chamber. Something waits here."
            ],
            chest: [
                "A glimmer catches your eye - a treasure chest sits in the corner!",
                "You discover a weathered chest, slightly ajar.",
                "Ancient loot lies before you, ripe for the taking.",
                "A golden chest rests on a pedestal, seemingly unguarded.",
                "You spot a chest hidden behind some rubble."
            ],
            shop: [
                "A mysterious merchant appears from the shadows...",
                "You stumble upon a makeshift shop. Someone lives down here?",
                "Torches flicker around a display of goods for sale.",
                "A hooded figure waves you over to examine their wares.",
                "You find a safe haven - a traveling merchant's camp."
            ]
        };
        
        const desc = descriptions[type][Math.floor(Math.random() * descriptions[type].length)];
        this.log(`\n📍 Depth ${this.player.dungeonDepth}: ${desc}`, type === 'enemy' ? 'combat' : 'normal');
        
        switch(type) {
            case 'enemy':
                this.startCombat(false);
                break;
            case 'chest':
                this.openChest();
                break;
            case 'shop':
                this.enterShop();
                break;
            case 'empty':
                this.handleEmptyRoom();
                break;
        }
    }

    // Combat System
    startCombat(isBoss) {
        this.state = 'combat';
        // Pass player level to Enemy constructor instead of just depth
        this.currentEnemy = new Enemy(this.player.level, this.player.dungeonDepth, isBoss);
        
        const prefix = isBoss ? "👑 BOSS APPEARS: " : "⚔️ Enemy: ";
        this.log(`${prefix} ${this.currentEnemy.name}`, isBoss ? 'boss' : 'combat');
        this.log(`HP: ${this.currentEnemy.hp} | ATK: ${this.currentEnemy.attack} | DEF: ${this.currentEnemy.defense}`, 'stats');
        
        // Show weaknesses and resistances
        this.showEnemyWeaknesses();
        
        this.showEnemyPanel();
        this.updateEnemyUI();
        this.showCombatButtons();
    }

    showEnemyWeaknesses() {
        const enemy = this.currentEnemy;
        let weaknessText = '';
        
        if (Object.keys(enemy.weaknesses).length > 0) {
            const weaknesses = Object.entries(enemy.weaknesses)
                .map(([type, mult]) => `${type.charAt(0).toUpperCase() + type.slice(1)} (x${mult.toFixed(1)})`)
                .join(', ');
            weaknessText += `⚡ Weak to: ${weaknesses}`;
        }
        
        if (Object.keys(enemy.resistances).length > 0) {
            const resistances = Object.entries(enemy.resistances)
                .map(([type, mult]) => `${type.charAt(0).toUpperCase() + type.slice(1)} (x${mult.toFixed(1)})`)
                .join(', ');
            if (weaknessText) weaknessText += ' | ';
            weaknessText += `🛡️ Resistant to: ${resistances}`;
        }
        
        if (weaknessText) {
            this.log(weaknessText, 'magic');
        }
    }

    playerAttack(isMagic = false) {
        if (this.state !== 'combat' || !this.currentEnemy) return;
        
        let damage, mpRestore = 0;
        let message = "";
        const damageType = isMagic ? 'magic' : 'physical';
        
        if (isMagic) {
            const mpCost = Math.floor(this.player.maxMp * 0.25);
            if (this.player.mp < mpCost) {
                this.log("Not enough MP!", 'error');
                return;
            }
            this.player.mp -= mpCost;
            damage = Math.floor(this.player.magic * 1.6) + Math.floor(Math.random() * 5);
            message = `You cast a spell dealing ${damage} magic damage!`;
        } else {
            damage = this.player.attack + Math.floor(Math.random() * 5);
            mpRestore = Math.floor(this.player.maxMp * 0.05);
            this.player.restoreMp(mpRestore);
            message = `You attack for ${damage} damage!${mpRestore > 0 ? ` (Restored ${mpRestore} MP)` : ''}`;
        }
        
        const actualDamage = this.currentEnemy.takeDamage(damage, damageType);
        
        // Check for weakness/resistance
        let damageModifier = '';
        if (damageType === 'physical' && this.currentEnemy.weaknesses.physical) {
            damageModifier = ' 💥 WEAK POINT HIT!';
        } else if (damageType === 'magic' && this.currentEnemy.weaknesses.magic) {
            damageModifier = ' ⚡ SUPER EFFECTIVE!';
        } else if (damageType === 'physical' && this.currentEnemy.resistances.physical) {
            damageModifier = ' 🛡️ Reduced effectiveness...';
        } else if (damageType === 'magic' && this.currentEnemy.resistances.magic) {
            damageModifier = ' 🛡️ Reduced effectiveness...';
        }
        
        this.log(message + damageModifier, 'damage');
        
        // Visual feedback
        this.shakeScreen();
        this.updateUI();
        this.updateEnemyUI();
        
        if (this.currentEnemy.hp <= 0) {
            this.winCombat();
        } else {
            setTimeout(() => this.enemyTurn(), 800);
        }
    }

    playerDefend() {
        if (this.state !== 'combat') return;
        
        const mpRestore = Math.floor(this.player.maxMp * 0.10);
        this.player.restoreMp(mpRestore);
        
        this.log(`You brace yourself for impact! Defense increased temporarily and restored ${mpRestore} MP.`, 'buff');
        
        // Temporary defense buff (simplified as heal for this turn)
        this.player.heal(Math.floor(this.player.defense * 0.5));
        
        this.updateUI();
        setTimeout(() => this.enemyTurn(true), 800);
    }

    playerHeal() {
        if (this.state !== 'combat') return;
        
        const mpCost = Math.floor(this.player.maxMp * 0.20);
        if (this.player.mp < mpCost) {
            this.log("Not enough MP to heal!", 'error');
            return;
        }
        
        this.player.mp -= mpCost;
        const healAmount = Math.floor(this.player.maxHp * 0.3) + this.player.magic;
        this.player.heal(healAmount);
        
        this.log(`💚 You heal yourself for ${healAmount} HP! (Cost: ${mpCost} MP)`, 'heal');
        this.updateUI();
        setTimeout(() => this.enemyTurn(), 800);
    }

    enemyTurn(playerDefending = false) {
        if (!this.currentEnemy || this.currentEnemy.hp <= 0) return;
        
        // Enemy action: 70% attack, 30% special (magic attack)
        const action = Math.random();
        let message, damage;
        
        if (action < 0.7) {
            // Normal attack
            damage = this.currentEnemy.attack;
            if (playerDefending) damage = Math.floor(damage * 0.5);
            const actualDamage = this.player.takeDamage(damage);
            message = `💥 ${this.currentEnemy.name} attacks you for ${actualDamage} damage!`;
            
            if (actualDamage > 0) {
                this.shakeScreen();
            }
        } else {
            // Magic attack
            damage = Math.floor(this.currentEnemy.magic * 1.5);
            if (playerDefending) damage = Math.floor(damage * 0.5);
            const actualDamage = this.player.takeDamage(damage);
            message = `✨ ${this.currentEnemy.name} casts a spell for ${actualDamage} magic damage!`;
        }
        
        this.log(message, 'damage');
        this.updateUI();
        this.updateEnemyUI();
        
        if (this.player.hp <= 0) {
            this.gameOver();
        }
    }

    winCombat() {
        const enemy = this.currentEnemy;
        const isBoss = enemy.isBoss;
        
        this.log(`\n🎉 Victory! Defeated ${enemy.name}!`, 'victory');
        this.player.gainXp(enemy.xp);
        this.player.gold += enemy.gold;
        this.player.enemiesKilled++;
        
        if (isBoss) {
            this.player.bossesKilled++;
        }
        
        // Restore 10% HP and MP after killing enemy
        const hpRestore = Math.floor(this.player.maxHp * 0.10);
        const mpRestore = Math.floor(this.player.maxMp * 0.10);
        this.player.heal(hpRestore);
        this.player.restoreMp(mpRestore);
        
        this.log(`💰 Gained ${enemy.gold} gold and ${enemy.xp} XP!`, 'gold');
        this.log(`✨ Restored ${hpRestore} HP and ${mpRestore} MP!`, 'heal');
        
        this.hideEnemyPanel();
        this.currentEnemy = null;
        this.state = 'exploring';
        
        if (isBoss) {
            this.log("🏆 Boss defeated! The dungeon trembles...", 'special');
            // Bonus for boss - reduced from 100 to 50
            this.player.gold += 70;
            this.log("Bonus: +70 Gold!", 'gold');
        }
        
        this.updateUI();
        
        setTimeout(() => {
            this.showExplorationChoices();
        }, 1500);
    }

    // Empty Room Handler
    handleEmptyRoom() {
        // Reward for empty room: small gold and 2% HP/MP restore
        const goldReward = Math.floor(5 + Math.random() * 10);
        const hpRestore = Math.floor(this.player.maxHp * 0.02);
        const mpRestore = Math.floor(this.player.maxMp * 0.02);
        
        this.player.gold += goldReward;
        this.player.heal(hpRestore);
        this.player.restoreMp(mpRestore);
        
        this.log(`✨ You find some coins and rest a moment.`, 'normal');
        this.log(`💰 Found ${goldReward} gold!`, 'gold');
        this.log(`💚 Restored ${hpRestore} HP and ${mpRestore} MP!`, 'heal');
        
        this.state = 'exploring';
        this.updateUI();
        
        setTimeout(() => {
            this.showExplorationChoices();
        }, 1500);
    }

    // Exploration
    showExplorationChoices() {
        const paths = ['Left Door', 'Right Door', 'Forward Passage', 'Hidden Path'];
        const descriptions = [
            'A door creaks on rusty hinges...',
            'A wooden door reinforced with iron bands...',
            'A narrow passage slopes downward...',
            'You notice a barely visible path behind the tapestry...'
        ];
        
        const buttonsDiv = document.getElementById('action-buttons');
        buttonsDiv.innerHTML = '';
        
        // Choose 2-3 random paths
        const numPaths = Math.floor(Math.random() * 2) + 2;
        const indices = [0, 1, 2, 3].sort(() => Math.random() - 0.5).slice(0, numPaths);
        
        indices.forEach(idx => {
            const btn = document.createElement('button');
            btn.className = 'bg-gray-800 hover:bg-gray-700 border border-gray-600 text-gray-200 py-3 px-4 rounded-lg transition-all btn-hover text-left';
            btn.innerHTML = `
                <div class="font-bold text-purple-300">${paths[idx]}</div>
                <div class="text-xs text-gray-500 mt-1">${descriptions[idx]}</div>
            `;
            btn.onclick = () => this.generateRoom();
            buttonsDiv.appendChild(btn);
        });
        
        const hpPercent = (this.player.hp / this.player.maxHp) * 100;
        const mpPercent = (this.player.mp / this.player.maxMp) * 100;
        
        if (hpPercent < 35 || mpPercent < 35) {
            const restBtn = document.createElement('button');
            restBtn.className = 'col-span-2 bg-blue-900/50 hover:bg-blue-900/70 border border-blue-600/50 text-blue-200 py-3 px-4 rounded-lg transition-all btn-hover';
            restBtn.innerHTML = '<div class="font-bold">Rest & Restore</div><div class="text-xs text-blue-300 mt-1">Restore 100% HP & MP (Costs Gold)</div>';
            restBtn.onclick = () => this.showRestMenu();
            buttonsDiv.appendChild(restBtn);
            lucide.createIcons();
        }
    }

    // Chest System
    openChest() {
        this.state = 'chest';
        const buttonsDiv = document.getElementById('action-buttons');
        buttonsDiv.innerHTML = '';
        
        const btn = document.createElement('button');
        btn.className = 'col-span-2 bg-yellow-900/30 hover:bg-yellow-900/50 border border-yellow-600/50 text-yellow-200 py-4 px-6 rounded-lg transition-all btn-hover';
        btn.innerHTML = `<div class="flex items-center justify-center gap-2"><i data-lucide="treasure-chest"></i> Open Chest</div>`;
        btn.onclick = () => this.lootChest();
        buttonsDiv.appendChild(btn);
        
        lucide.createIcons();
    }

    lootChest() {
        const roll = Math.random();
        let reward;
        
        if (roll < 0.75) {
            // Gold - significantly reduced
            const amount = Math.floor(10 + Math.random() * 15 + (this.player.level * 3));
            this.player.gold += amount;
            reward = `Found ${amount} gold coins!`;
            this.log(`📦 ${reward}`, 'gold');
        } else if (roll < 0.85) {
            // Potion (instant heal)
            const heal = Math.floor(this.player.maxHp * 0.5);
            this.player.heal(heal);
            reward = `Found a health potion! Restored ${heal} HP.`;
            this.log(`📦 ${reward}`, 'heal');
        } else {
            // Rare item (stat boost)
            const boost = Math.floor(Math.random() * 3) + 1; // Reduced from 3 to 2
            const stat = ['attack', 'defense', 'magic'][Math.floor(Math.random() * 3)];
            this.player[stat] += boost;
            const statName = stat.charAt(0).toUpperCase() + stat.slice(1);
            reward = `Found a Mystic ${statName} Scroll! +${boost} ${statName}`;
            this.log(`📦 ${reward}`, 'special');
        }
        
        this.state = 'exploring';
        this.updateUI();
        setTimeout(() => this.showExplorationChoices(), 1000);
    }

    // Shop System
    enterShop() {
        this.state = 'shop';
        this.openShop();
    }

    openShop() {
        document.getElementById('shop-modal').classList.remove('hidden');
        this.renderShop();
    }

    closeShop() {
        document.getElementById('shop-modal').classList.add('hidden');
    }

    leaveShop() {
        this.closeShop();
        this.state = 'exploring';
        this.showExplorationChoices();
    }

    renderShop(isPremium = false) {
        document.getElementById('shop-gold').textContent = this.player.gold;
        const itemsDiv = document.getElementById('shop-items');
        const shopTitle = document.getElementById('shop-title');
        const shopDesc = document.getElementById('shop-desc');
        itemsDiv.innerHTML = '';
        
        // Set shop title based on type
        if (isPremium) {
            shopTitle.textContent = "Arcane Merchant's Exclusive Shop";
            shopDesc.textContent = "Rare and powerful items... at a premium price.";
        } else {
            shopTitle.textContent = "Merchant's Shop";
            shopDesc.textContent = "Spend your gold wisely...";
        }
        
        const items = isPremium ? [
            { id: 'hp', name: 'Max HP Boost', desc: '+5 Max HP', cost: 120, icon: 'heart', color: 'text-red-400' },
            { id: 'mp', name: 'Max MP Boost', desc: '+5 Max MP', cost: 120, icon: 'sparkles', color: 'text-blue-400' },
            { id: 'atk', name: 'Strength Training', desc: '+2 Attack', cost: 180, icon: 'sword', color: 'text-orange-400' },
            { id: 'def', name: 'Armor Upgrade', desc: '+2 Defense', cost: 180, icon: 'shield', color: 'text-cyan-400' },
            { id: 'mag', name: 'Arcane Study', desc: '+2 Magic', cost: 180, icon: 'wand-2', color: 'text-purple-400' },
            { id: 'potion', name: 'Full Restore', desc: 'Full HP & MP heal', cost: 250, icon: 'flask-conical', color: 'text-green-400' },
            { id: 'super-hp', name: 'Supreme HP Elixir', desc: '+10 Max HP', cost: 350, icon: 'heart', color: 'text-red-500' },
            { id: 'super-mp', name: 'Supreme MP Elixir', desc: '+10 Max MP', cost: 350, icon: 'sparkles', color: 'text-blue-500' }
        ] : [
            { id: 'hp', name: 'Max HP Boost', desc: '+5 Max HP', cost: 80, icon: 'heart', color: 'text-red-400' },
            { id: 'mp', name: 'Max MP Boost', desc: '+5 Max MP', cost: 80, icon: 'sparkles', color: 'text-blue-400' },
            { id: 'atk', name: 'Strength Training', desc: '+2 Attack', cost: 120, icon: 'sword', color: 'text-orange-400' },
            { id: 'def', name: 'Armor Upgrade', desc: '+2 Defense', cost: 120, icon: 'shield', color: 'text-cyan-400' },
            { id: 'mag', name: 'Arcane Study', desc: '+2 Magic', cost: 120, icon: 'wand-2', color: 'text-purple-400' },
            { id: 'potion', name: 'Full Restore', desc: 'Full HP & MP heal', cost: 180, icon: 'flask-conical', color: 'text-green-400' }
        ];
        
        items.forEach(item => {
            const canAfford = this.player.gold >= item.cost;
            const div = document.createElement('div');
            div.className = `flex justify-between items-center p-3 rounded-lg border ${canAfford ? 'bg-gray-800/50 border-gray-700 hover:border-gray-600' : 'bg-gray-900/30 border-gray-800 opacity-50'} transition-all`;
            div.innerHTML = `
                <div class="flex items-center gap-3">
                    <div class="p-2 bg-gray-900 rounded-lg ${item.color}">
                        <i data-lucide="${item.icon}" class="w-5 h-5"></i>
                    </div>
                    <div>
                        <div class="font-semibold text-gray-200 text-sm">${item.name}</div>
                        <div class="text-xs text-gray-500">${item.desc}</div>
                    </div>
                </div>
                <button onclick="game.buyItem('${item.id}', ${item.cost}, ${isPremium ? 'true' : 'false'})" 
                    class="px-3 py-1 rounded ${canAfford ? 'bg-yellow-600 hover:bg-yellow-500 text-white' : 'bg-gray-700 text-gray-500 cursor-not-allowed'} text-sm font-semibold transition-colors"
                    ${!canAfford ? 'disabled' : ''}>
                    ${item.cost}g
                </button>
            `;
            itemsDiv.appendChild(div);
        });
        
        lucide.createIcons();
    }

    buyItem(type, cost, isPremium = false) {
        if (this.player.gold < cost) return;
        
        this.player.gold -= cost;
        
        switch(type) {
            case 'hp':
                this.player.maxHp += 5;
                this.player.hp += 5;
                break;
            case 'mp':
                this.player.maxMp += 5;
                this.player.mp += 5;
                break;
            case 'atk':
                this.player.attack += 2;
                break;
            case 'def':
                this.player.defense += 2;
                break;
            case 'mag':
                this.player.magic += 2;
                break;
            case 'potion':
                this.player.hp = this.player.maxHp;
                this.player.mp = this.player.maxMp;
                break;
            case 'super-hp':
                this.player.maxHp += 10;
                this.player.hp += 10;
                break;
            case 'super-mp':
                this.player.maxMp += 10;
                this.player.mp += 10;
                break;
        }
        
        this.updateUI();
        this.renderShop(isPremium);
        this.log(`Purchased upgrade!`, 'success');
    }

    // Premium Shop System
    openPremiumShop() {
        document.getElementById('shop-modal').classList.remove('hidden');
        this.renderShop(true);
    }

    closePremiumShop() {
        document.getElementById('shop-modal').classList.add('hidden');
    }

    // Boss System
    showBossWarning() {
        this.awaitingBossDecision = true;
        document.getElementById('boss-modal').classList.remove('hidden');
    }

    fightBoss() {
        document.getElementById('boss-modal').classList.add('hidden');
        this.awaitingBossDecision = false;
        this.startCombat(true);
    }

    skipBoss() {
        document.getElementById('boss-modal').classList.add('hidden');
        this.log("You carefully sneak past the boss chamber, avoiding the terrible foe within...", 'flavor');
        this.awaitingBossDecision = false;
        // Note: Don't increment depth here - it was already incremented in generateRoom()
        setTimeout(() => this.showExplorationChoices(), 1500);
    }

    // Level Up Modal
    showLevelUp(bonuses) {
        document.getElementById('new-level').textContent = this.player.level;
        document.getElementById('bonus-hp').textContent = bonuses.hp > 0 ? `+${bonuses.hp} bonus` : '';
        document.getElementById('bonus-mp').textContent = bonuses.mp > 0 ? `+${bonuses.mp} bonus` : '';
        document.getElementById('bonus-atk').textContent = bonuses.atk > 0 ? `+${bonuses.atk} bonus` : '';
        document.getElementById('bonus-def').textContent = bonuses.def > 0 ? `+${bonuses.def} bonus` : '';
        document.getElementById('bonus-mag').textContent = bonuses.mag > 0 ? `+${bonuses.mag} bonus` : '';
        document.getElementById('levelup-modal').classList.remove('hidden');
    }

    closeLevelUp() {
        document.getElementById('levelup-modal').classList.add('hidden');
    }

    // Combat UI
    showCombatButtons() {
        const buttonsDiv = document.getElementById('action-buttons');
        buttonsDiv.innerHTML = '';
        
        const actions = [
            { name: 'Attack', icon: 'sword', color: 'bg-orange-600 hover:bg-orange-500', action: () => this.playerAttack(false), desc: 'Deal dmg +5% MP' },
            { name: 'Magic', icon: 'wand-2', color: 'bg-purple-600 hover:bg-purple-500', action: () => this.playerAttack(true), desc: 'High dmg, costs MP' },
            { name: 'Defend', icon: 'shield', color: 'bg-blue-600 hover:bg-blue-500', action: () => this.playerDefend(), desc: 'Block +10% MP' },
            { name: 'Heal', icon: 'heart', color: 'bg-green-600 hover:bg-green-500', action: () => this.playerHeal(), desc: 'Heal 30%, costs MP' }
        ];
        
        actions.forEach(act => {
            const btn = document.createElement('button');
            btn.className = `${act.color} text-white py-3 px-4 rounded-lg transition-all btn-hover flex flex-col items-center gap-1`;
            btn.innerHTML = `
                <i data-lucide="${act.icon}" class="w-5 h-5"></i>
                <span class="font-bold">${act.name}</span>
                <span class="text-xs opacity-75">${act.desc}</span>
            `;
            btn.onclick = act.action;
            buttonsDiv.appendChild(btn);
        });
        
        lucide.createIcons();
    }

    // Logging System
    log(message, type = 'normal') {
        const logDiv = document.getElementById('game-log');
        const entry = document.createElement('div');
        entry.className = 'message-appear border-l-2 pl-3 py-1 ' + this.getMessageStyle(type);
        
        const time = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
        entry.innerHTML = `<span class="text-gray-600 text-xs mr-2">[${time}]</span>${message}`;
        
        logDiv.appendChild(entry);
        this.messageHistory.push({ msg: message, type, time });
        
        if (this.autoScroll) {
            logDiv.scrollTop = logDiv.scrollHeight;
        }
    }

    getMessageStyle(type) {
        const styles = {
            'combat': 'border-red-500 bg-red-950/10',
            'damage': 'border-orange-500 text-orange-200',
            'heal': 'border-green-500 text-green-200',
            'gold': 'border-yellow-500 text-yellow-200',
            'magic': 'border-purple-500 text-purple-200',
            'victory': 'border-green-500 text-green-300 font-bold',
            'boss': 'border-red-600 text-red-300 font-bold',
            'levelup': 'border-purple-400 bg-purple-950/20 font-bold',
            'error': 'border-red-600 text-red-400',
            'system': 'border-blue-500 text-blue-300 font-semibold',
            'flavor': 'border-gray-600 text-gray-400 italic',
            'stats': 'border-gray-700 text-gray-500 text-xs',
            'special': 'border-pink-500 text-pink-300',
            'success': 'border-green-500 text-green-300',
            'buff': 'border-cyan-500 text-cyan-200',
            'normal': 'border-gray-700 text-gray-300'
        };
        return styles[type] || styles['normal'];
    }

    // UI Updates
    updateUI() {
        // Bars
        const hpPercent = (this.player.hp / this.player.maxHp) * 100;
        const mpPercent = (this.player.mp / this.player.maxMp) * 100;
        const xpPercent = (this.player.xp / this.player.xpToNext) * 100;
        
        document.getElementById('hp-bar').style.width = `${Math.max(0, hpPercent)}%`;
        document.getElementById('mp-bar').style.width = `${Math.max(0, mpPercent)}%`;
        document.getElementById('xp-bar').style.width = `${Math.max(0, xpPercent)}%`;
        
        // Text
        document.getElementById('hp-text').textContent = `${Math.floor(this.player.hp)}/${this.player.maxHp}`;
        document.getElementById('mp-text').textContent = `${Math.floor(this.player.mp)}/${this.player.maxMp}`;
        document.getElementById('xp-text').textContent = `${this.player.xp}/${this.player.xpToNext}`;
        
        // Stats
        document.getElementById('level-display').textContent = this.player.level;
        document.getElementById('gold-display').textContent = this.player.gold;
        document.getElementById('depth-display').textContent = this.player.dungeonDepth;
        document.getElementById('stat-attack').textContent = this.player.attack;
        document.getElementById('stat-defense').textContent = this.player.defense;
        document.getElementById('stat-magic').textContent = this.player.magic;
        
        // Counters
        document.getElementById('rooms-cleared').textContent = this.player.roomsCleared;
        document.getElementById('enemies-killed').textContent = this.player.enemiesKilled;
        
        // HP Bar color change on low health
        const hpBar = document.getElementById('hp-bar');
        if (hpPercent < 25) {
            hpBar.classList.remove('from-red-600', 'to-red-500');
            hpBar.classList.add('from-red-700', 'to-red-600', 'animate-pulse');
        } else {
            hpBar.classList.add('from-red-600', 'to-red-500');
            hpBar.classList.remove('from-red-700', 'to-red-600', 'animate-pulse');
        }

        // Update enemy UI if in combat
        if (this.state === 'combat' && this.currentEnemy) {
            this.updateEnemyUI();
        }
    }

    showEnemyPanel() {
        const panel = document.getElementById('enemy-panel');
        if (panel) panel.classList.remove('hidden');
    }

    hideEnemyPanel() {
        const panel = document.getElementById('enemy-panel');
        if (panel) panel.classList.add('hidden');
    }

    updateEnemyUI() {
        if (!this.currentEnemy) return;
        
        const enemy = this.currentEnemy;
        const hpPercent = (enemy.hp / enemy.maxHp) * 100;
        
        document.getElementById('enemy-name').textContent = enemy.name;
        document.getElementById('enemy-hp-text').textContent = `${Math.floor(enemy.hp)}/${enemy.maxHp}`;
        document.getElementById('enemy-hp-bar').style.width = `${Math.max(0, hpPercent)}%`;
        document.getElementById('enemy-atk').textContent = enemy.attack;
        document.getElementById('enemy-def').textContent = enemy.defense;
        document.getElementById('enemy-mag').textContent = enemy.magic;
        
        // Update weaknesses display
        const weaknessDiv = document.getElementById('enemy-weaknesses');
        let weaknessHTML = '';
        
        if (Object.keys(enemy.weaknesses).length > 0) {
            weaknessHTML += '<div class="text-yellow-400 text-xs font-bold">⚡ Weak to: ';
            weaknessHTML += Object.keys(enemy.weaknesses).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(', ');
            weaknessHTML += '</div>';
        }
        
        if (Object.keys(enemy.resistances).length > 0) {
            weaknessHTML += '<div class="text-blue-400 text-xs font-bold">🛡️ Resistant to: ';
            weaknessHTML += Object.keys(enemy.resistances).map(r => r.charAt(0).toUpperCase() + r.slice(1)).join(', ');
            weaknessHTML += '</div>';
        }
        
        weaknessDiv.innerHTML = weaknessHTML;
    }

    shakeScreen() {
        document.body.classList.add('shake');
        setTimeout(() => document.body.classList.remove('shake'), 500);
    }

    toggleAutoScroll() {
        this.autoScroll = !this.autoScroll;
        document.getElementById('autoscroll-btn').textContent = `Auto-scroll: ${this.autoScroll ? 'ON' : 'OFF'}`;
    }

    gameOver() {
        this.hideEnemyPanel();
        
        // Show death scoreboard
        document.getElementById('score-depth').textContent = this.player.dungeonDepth;
        document.getElementById('score-kills').textContent = this.player.enemiesKilled;
        document.getElementById('score-bosses').textContent = this.player.bossesKilled;
        document.getElementById('score-gold').textContent = this.player.gold;
        document.getElementById('score-level').textContent = this.player.level;
        
        document.getElementById('death-modal').classList.remove('hidden');
        
        this.log("💀 You have died... Your adventure ends here.", 'error');
        this.state = 'gameover';
    }

    showRestMenu() {
        const restCost = Math.max(50, Math.floor(this.player.maxHp * 0.5));
        
        const buttonsDiv = document.getElementById('action-buttons');
        buttonsDiv.innerHTML = '';
        
        const confirmBtn = document.createElement('button');
        confirmBtn.className = 'bg-green-600 hover:bg-green-500 border border-green-500 text-white py-3 px-4 rounded-lg transition-all btn-hover';
        confirmBtn.innerHTML = '<div class="font-bold">Confirm Rest (' + restCost + 'g)</div>';
        confirmBtn.onclick = () => {
            if (this.player.gold >= restCost) {
                this.rest(restCost);
            } else {
                this.log("Not enough gold to rest!", 'error');
            }
        };
        
        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'bg-red-600 hover:bg-red-500 border border-red-500 text-white py-3 px-4 rounded-lg transition-all btn-hover';
        cancelBtn.innerHTML = '<div class="font-bold">Cancel</div>';
        cancelBtn.onclick = () => this.showExplorationChoices();
        
        buttonsDiv.appendChild(confirmBtn);
        buttonsDiv.appendChild(cancelBtn);
        
        this.log('You find a safe place to rest. It will cost ' + restCost + ' gold to fully restore your HP and MP.', 'special');
        lucide.createIcons();
    }

    rest(cost) {
        this.player.gold -= cost;
        this.player.hp = this.player.maxHp;
        this.player.mp = this.player.maxMp;
        
        this.log('You rest and recover your strength...', 'heal');
        this.log('HP fully restored!', 'heal');
        this.log('MP fully restored!', 'heal');
        this.log('Paid ' + cost + ' gold for rest.', 'gold');
        
        this.updateUI();
        
        setTimeout(() => {
            this.showExplorationChoices();
        }, 1500);
    }
}

// Initialize game
const game = new Game();
