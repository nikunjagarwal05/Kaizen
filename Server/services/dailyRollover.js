import Task from '../models/Task.js';
import UserStats from '../models/UserStats.js';
import ActivityLog from '../models/ActivityLog.js';
import { GAME_CONSTANTS } from '../config/constants.js';

/**
 * Daily Rollover Logic
 * 
 * This function should be called once per day (via cron job or scheduled task)
 * It handles:
 * 1. Moving unfinished tasks to the next day
 * 2. Applying penalties for unfinished tasks
 * 3. Updating streaks
 * 4. Refilling hearts
 * 5. Creating activity logs
 */

export async function processDailyRollover() {
    try {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);

        const endofYesterday = new Date();
        endofYesterday.setHours(23, 59, 59, 999);

        // Get all users
        const User = (await import('../models/User.js')).default;
        const users = await User.find({});

        for (const user of users) {
            await processDailyRollover(user._id, yesterday, endofYesterday);
        }

        console.log(`Daily rollover completed for ${users.length} users`);
    } catch (error) {
        console.error('Daily rollover error: ', error);
    }
}


/*
Process rollover for a single user
*/

async function processDailyRollover(userId, startOfYesterday, endofYesterday) {
    // Get all pending tasks from yesterday
    const pendingTasks = await Task.find({
        userId, 
        assignedDate: { $gte: startOfYesterday, $lte: endofYesterday },
        'status.pending' : true,
        'status.complete' : false,
        'status.failed' : false,
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Move unfinished tasks to today and apply penalties
    for(const task of pendingTasks) {
        task.assignedDate = today;
        task.status.delayCount += 1;
        await task.save();
    }

    // Get user stats
    let stats = await UserStats.findOne({ userId });

    if(!stats) {
        stats = new UserStats({ userId });
    }

    // Apply penalties for unfinished tasks
    if(pendingTasks.length > 0) {
        const totalHeartLoss = pendingTasks.length * GAME_CONSTANTS.TASK_FAILURE_HEART_LOSS;
        const totalCoinLoss = pendingTasks.length * GAME_CONSTANTS.TASK_FAILURE_COIN_LOSS;

        stats.hearts = Math.max(0, stats.hearts - totalHeartLoss);
        stats.coins = Math.max(0, stats.coins - totalCoinLoss);

        // If hearts reach zero, apply penalty
        if(stats.hearts === 0) {
            stats.applyHeartZeroPenalty();
        }
    }

    // Calculate yesterday's activity
    const yesterdayTasks = await Task.find({
        userId,
        assignedDate: { $gte: startOfYesterday, $lte: endofYesterday },
    });

    const completedTasks = yesterdayTasks.filter(t => t.status.completed).length;
    const totalTasks = yesterdayTasks.length;
    const success = completedTasks >= GAME_CONSTANTS.MIN_TASKS_FOR_SUCCESSFUL_DAY &&
                    completedTasks === totalTasks && totalTasks > 0;


    // Update or create ActivityLog
    await ActivityLog.findOneAndUpdate(
        { userId, date: startOfYesterday },
        {
            userId,
            date: startOfYesterday, 
            completedTasks,
            totalTasks,
            success,
        },
        { upsert: true, new: true }
    );

    // Update streak
    if(success) {
        stats.currentStreak += 1;

        if(stats.currentStreak > stats.highestStreak) {
            stats.highestStreak = stats.currentStreak;
        }
    } else {
        stats.currentStreak = 0;
    }

    // Refill Heart (daily health refill)
    stats.hearts = Math.min(stats.maxHearts, stats.hearts + GAME_CONSTANTS.DAILY_HEART_REFILL);

    // Update last Activity date
    stats.lastActivityDate = new Date();

    await stats.save();
}

/**
 * Streak Logic Explanation:
 * 
 * A successful day = all assigned tasks completed (and at least MIN_TASKS_FOR_SUCCESSFUL_DAY tasks exist)
 * 
 * - If the day is successful: currentStreak increases by 1
 * - If currentStreak > highestStreak: update highestStreak
 * - If the day is not successful: currentStreak resets to 0
 * 
 * This runs during daily rollover, which processes yesterday's tasks.
 */

/**
 * Daily Rollover Explanation:
 * 
 * At day end (midnight), the system:
 * 1. Finds all pending tasks from yesterday
 * 2. Moves them to today and increments delayCount
 * 3. Applies penalties: -1 heart and -2 coins per unfinished task
 * 4. If hearts reach 0: level -1, hearts reset to 50% of max, coins reduced by 10%
 * 5. Calculates if yesterday was successful (all tasks completed)
 * 6. Updates streak based on success
 * 7. Refills hearts by DAILY_HEART_REFILL amount
 * 
 * This ensures tasks don't disappear and users are incentivized to complete them.
 */

/**
 * Penalties Explanation:
 * 
 * Task Failure:
 * - Heart loss: TASK_FAILURE_HEART_LOSS (default: 1)
 * - Coin loss: TASK_FAILURE_COIN_LOSS (default: 2)
 * 
 * When Hearts Reach Zero:
 * - Level decreases by HEART_ZERO_LEVEL_PENALTY (default: 1)
 * - Hearts reset to HEART_ZERO_HEART_RESET_PERCENT of max (default: 50%)
 * - Coins reduced by HEART_ZERO_COIN_PENALTY_PERCENT (default: 10%)
 * 
 * This creates meaningful consequences for not completing tasks while
 * preventing permanent account damage.
 */
