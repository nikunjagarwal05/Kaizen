/*
Gamification Constants
All game values are configurable here for easy tuning
*/

export const GAME_CONSTANTS = {
    // Task Completion Rewards
    TASK_COMPLETION_EXP: 10,
    TASK_COMPLETION_COINS: 5,

    // Task Failure Penalites
    TASK_FAILURE_HEART_LOSS: 1,
    TASK_FAILURE_COIN_LOSS: 2,

    // Level System
    INITIAL_LEVEL: 1,
    INITIAL_MAX_EXP: 100,
    EXP_INCREASE_PER_LEVEL: 10,
    LEVEL_UP_BONUS_COINS: 10,
    LEVEL_UP_HEART_INCREASE: 1,

    // Heart System
    INITIAL_MAX_HEARTS: 10,
    INITIAL_HEARTS: 10,
    DAILY_HEART_REFILL: 5,

    // Penalty System (when hearts reach 0)
    HEART_ZERO_LEVEL_PENALTY: 1,
    HEART_ZERO_COIN_PENALTY_PERCENT: 0.1,
    HEART_ZERO_HEART_RESET_PERCENT: 0.5,

    // Streak System
    MIN_TASKS_FOR_SUCCESSFUL_DAY: 1,
};