import mongoose from 'mongoose';
import { GAME_CONSTANTS } from '../config/constants.js';

const userStatsSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
        index: true,
    },
    level: {
        type: Number,
        default: GAME_CONSTANTS.INITIAL_LEVEL,
        min: 1,
    }, 
    currentExp: {
        type: Number, 
        default: 0,
        min: 0,
    },
    maxExp: {
        type: Number,
        default: GAME_CONSTANTS.INITIAL_MAX_EXP,
        min: 1,
    },
    hearts: {
        type: Number,
        default: GAME_CONSTANTS.INITIAL_HEARTS,
        min: 0,
    },
    maxHearts: {
        type: Number,
        default: GAME_CONSTANTS.INITIAL_MAX_HEARTS,
        min: 1,
    },
    coins: {
        type: Number, 
        default: 0,
        min: 0,
    },
    currentStreak: {
        type: Number, 
        default: 0,
        min: 0,
    },
    highestStreak: {
        type: Number,
        default: 0,
        min: 0,
    },
    lastActivityDate: {
        type: Date,
        default: null,
    },
}, {
    timestamps: true,
});

// Method to add experience and handle level up
userStatsSchema.methods.addExperience = function(exp) {
    this.currentExp += exp;

    let levelsGained = 0;
    while(this.currentExp >= this.maxExp) {
        this.currentExp -= this.maxExp;
        this.level += 1;
        this.maxExp += GAME_CONSTANTS.EXP_INCREASE_PER_LEVEL;
        this.maxHearts += GAME_CONSTANTS.LEVEL_UP_HEART_INCREASE;
        this.heart += GAME_CONSTANTS.LEVEL_UP_HEART_INCREASE;
        this.coins += GAME_CONSTANTS.LEVEL_UP_BONUS_COINS;
        levelsGained += 1;
    }

    return levelsGained;
};

// Method to apply penalties when hearts reach zero
userStatsSchema.methods.applyHeartZeroPenalty = function() {
    const { HEART_ZERO_LEVEL_PENALTY, HEART_ZERO_COIN_PENALTY_PERCENT, HEART_ZERO_HEART_RESET_PERCENT } = GAME_CONSTANTS;

    this.level = Math.max(1, this.level - HEART_ZERO_LEVEL_PENALTY);
    this.coins = Math.max(0, Math.floor(this.coins * (1 - HEART_ZERO_COIN_PENALTY_PERCENT)));
    this.hearts = Math.ceil(this.maxHearts * HEART_ZERO_HEART_RESET_PERCENT);
};

export default mongoose.model('UserStats', userStatsSchema);

