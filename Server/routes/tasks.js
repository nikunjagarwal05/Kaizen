import express from 'express';
import { body, validationResult } from 'express-validator';
import Task from '../models/Task.js';
import UserStats from '../models/UserStats.js';
import ActivityLog from '../models/ActivityLog.js';
import auth, { authenticate } from '../middleware/auth.js';
import { GAME_CONSTANTS } from '../config/constants.js';
import User from '../models/User.js';

const router = express.Router();

/*
GET /api/tasks
Get all tasks for the authenticated user
Query params: type, date, status
*/

router.get('/', authenticate, async(req, res) => {
    try{
        const { type, date, status } = req.query;
        const query = { userId: req.user._id };

        if (type) {
            query.type = type;
        }

        if(date) {
            const targetDate = new Date(date);
            const startOfDay = new Date(targetDate);
            startOfDay.setHours(0, 0, 0, 0);

            const endOfDay = new Date(targetDate);
            endOfDay.setHours(23, 59, 59, 999);
            query.assignedDate = { $gte: startOfDay, $lte: endOfDay };
        }

        if(status === 'completed') {
            query['status.completed'] = true;
        }
        else if(status === 'pending') {
            query['status.pending'] = true;
        }
        else if(status === 'failed') {
            query['status.failed'] = true;
        }

        const tasks = await Task.find(query).sort({ assignedDate: 1, createdAt: 1 });
        res.json({ tasks });
    } catch (error) {
        console.error('Get tasks error', error);
        res.status(500).json({ error: 'Server error fetching task' });
    }
});

/**
 * GET /api/tasks/:id
 * Get a specific task
 */

router.get('/:id', authenticate, async(req, res) => {
    try {
        const task = await Task.findOne({ _id: req.params.id, userId: req.user._id });

        if(!task) {
            return res.status(404).json({ error: 'Task not found' });
        }

        res.json({ task });
    } catch (error) {
        console.error('Get task error: ', error);
        res.status(500).json({ error: 'Server error fetching task' });
    }
});


/*
POST /api/tasks
Create a new task
*/

router.post('/', authenticate, [
    body('title').trim().isLength({ min: 1, max: 200 }).withMessage('Title is required'), 
    body('type').isIn(['todo', 'habit', 'challenge']).withMessage('Valid type required'),
    body('assignedDate').isISO8601().withMessage('Valid date required'),
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if(!errors.isEmpty()) {
            return res.status(500).json({ errors: errors.array() });
        }

        const {
            title, 
            description = '',
            type,
            assignedDate, 
            repeatConfig = { enabled: false, daysOfWeek: [] },
            expReward = GAME_CONSTANTS.TASK_COMPLETION_EXP,
            coinReward = GAME_CONSTANTS.TASK_COMPLETION_COINS,
        } = req.body;

        const Task = new Task({
            userId: req.user._id,
            title,
            description,
            type,
            assignedDate: new Date(assignedDate),
            repeatConfig,
            expReward,
            coinReward,
            penalties: {
                heartLoss: GAME_CONSTANTS.TASK_FAILURE_HEART_LOSS,
                coinLoss: GAME_CONSTANTS.TASK_FAILURE_COIN_LOSS,
            },
        });

        await task.save();
        res.status(201).json({ task });
    } catch (error) {
        console.error('Create task error: ', error);
        res.status(500).json({ error: 'Server error creating task' });
    }
});

/*
PUT /api/tasks/:id
update a task
*/

router.put('/:id', authenticate, [
    body('title').optional().trim().isLength({ min: 1, max:200 }),
    body('type').optional().isIn(['todo', 'habit', 'challenge']),
], async(req, res) => {
    try {
        const errors = validationResult(req);
        if(!errors.isEmpty()) {
            return res.status(404).json({ errors: errors.array() });
        }

        const task = await Task.findOne({ _id: req.params.id, userId: req.user._id});

        if(!task) {
            return res.status(404).json({ error: 'Task not found' });
        }

        // Update allowed fields
        if(req.body.title !== undefined) task.title = req.body.title;
        if(req.body.description !== undefined) task.description = req.body.description;
        if(req.body.type !== undefined) task.type = req.body.type;
        if(req.body.assignedDate !== undefined) task.assignedDate = new Date(req.body.assignedDate);
        if(req.body.repeatConfig !== undefined) task.repeatConfig = req.body.repeatConfig;
        if(req.body.expReward !== undefined) task.expReward = req.body.expReward;
        if(req.body.coinReward !== undefined) task.coinReward = req.body.coinReward;

        await task.save();
        res.json({ task });
    } catch (error) {
        console.error('Update task error', error);
        res.status(500).json({ error: 'Server error updating task' });
    }
});

/*
POST /api/tasks/:id/complete
Mark a task as complete
*/

router.post('/:id/complete', authenticate, async(req, res) => {
    try {
        const task = await Task.findOne({ _id: req.params.id, userId: req.user._id });

        if(!task) {
            return res.status(404).json({ error: 'Task not found' });
        }

        if(task.status.completed) {
            return res.json({ task, message: 'Task already completed' });
        }

        //Update task status
        task.status.completed = true;
        task.status.pending = false;
        task.status.failed = false;

        await task.save();

        // Update user stats

        const stats = await UserStats.findOne({ userId: req.user._id });
        if(stats) {
            const levelsGained = stats.addExperience(task.expReward);
            stats.coins += task.coinReward;
            await stats.save();

            // Update activity log for today
            await updateActivityLog(req.user._id, new Date(), true);

            res.json({
                task, 
                stats: {
                    level: stats.level, 
                    currentExp: stats.currentExp,
                    maxExp: stats.maxExp, 
                    hearts: stats.hearts, 
                    maxHearts: stats.maxHearts, 
                    coins: stats.coins,
                },
                levelsGained,
            });
        } else {
            res.json({ task });
        }
    } catch (error) {
        console.error('Complete task error: ', error);
        res.status(500).json({ error: 'Server error completing task' });
    }
});