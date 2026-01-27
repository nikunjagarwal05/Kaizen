import express from 'express';
import UserStats from '../models/UserStats.js';
import ActivityLog from '../models/ActivityLog.js';
import Task from '../models/Task.js';
import { authenticate } from '../middleware/auth.js';
import { GAME_CONSTANTS } from '../config/constants.js';

const router = express.Router();

/*
    GET /api/stats
    Get user stats
*/
router.get('/', authenticate, async (req, res) => {
    try {
        let stats = await UserStats.findOne({ userId: req.user._id });

        if(!stats) {
            // create stats if they don't exist
            stats = new UserStatus({ userId: req.user._id });
            await stats.save();
        }

        res.json({ stats });
    } catch(error) {
        console.error('Get stats error: ', error);
        res.status(500).json({ error: 'Server error fetching stats' });
    }
});


/*
    GET /api/stats/streak
    Get stats information
*/

router.get('/streak', authenticate, async (req, res) => {
    try {
        const stats = await UserStats.findOne({ userId: req.user._id });

        if(!stats) {
            return res.json({
                currentStreak: 0,
                highestStreak: 0,
            });
        }

        res.json({
            currentStreak: stats.currentStreak,
            highestStreak: stats.highestStreak,
        });
    } catch (error) {
        console.error('Get streak error: ', error);
        res.status(500).json({ error: 'Server error fetching streak' });
    }
});

/*
    GET /api/stats/counts
    Get tasks counts by type
*/

router.get('/counts', authenticate, async (req, res) => {
    try{
        const counts = await Task.aggregate([
            { $match: {userId: req.user._id} },
            { $group: { _id: '$type', count: { $sum: 1 } } },
        ]);

        const result = {
            habits: 0,
            todos: 0,
            challenges: 0,
        };

        counts.forEach(item => {
            if(item._id in result) {
                result[item._id] = item.count;
            }
        });

        res.json({ counts: result });
    } catch (error) {
        console.error('Get counts error: ', error);
        res.status(500).json({ error: 'Server error fetching counts' });
    }
});

/*
    Helper function to convert Date to local date string (YYYY-MM-DD)
    This prevents timezone issues when comparing dates
*/

const getLocalDateString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/*
    GET /api/stats/heatmap
    Gets heatmap data for the last year
*/

router.get('/heatmap', authenticate, async (req, res) => {
    try{
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        oneYearAgo.setHours(0, 0, 0, 0);

        const logs = await ActivityLog.find({
            userId: req.user._id,
            date: { $gte: oneYearAgo },
        }).sort({ date: 1 });

        const heatmapData = logs.map(log => ({
            date: getLocalDateString(log.date),
            intensity: log.totalTasks > 0 ? log.completedTasks / log.totalTasks : 0,
            completedTasks: log.completedTasks,
            totalTasks: log.totalTasks,
        }));

        res.json({ heatmap: heatmapData });
    } catch (error) {
        console.error('Get heatmap error: ', error);
        res.status(500).json({ error: 'Server error fetching heatmap' })
    }
});

export default router;