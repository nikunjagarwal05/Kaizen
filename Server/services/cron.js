/*
Cron job setup for daily rollover
This file sets up a cron job to run the daily rollover at midnight
*/

import cron from 'node-cron';
import { processDailyRollover } from './dailyRollover.js';

// Run daily rollover at midnight (00:00) every day
// Format: second, minute, hour, day, month, day-of-week

cron.schedule('0 0 * * *', async() => {
    console.log('Running daily rollover at ', new Date().toISOString);
    await processDailyRollover();
    console.log('Daily rollover complete');
});

// Alternative: Run every minute for testing (comment out the above and uncomment this)
// cron.schedule('* * * * *', async () => {
//   console.log('Running daily rollover (test mode) at', new Date().toISOString());
//   await processDailyRollover();
// });

console.log('Cron jobs initialized. Daily rollover scheduled for midnight.');

/**
 * To use this:
 * 1. Install node-cron: npm install node-cron
 * 2. Import this file in server.js: import './services/cron.js';
 * 3. The rollover will run automatically at midnight
 * 
 * For production, consider using:
 * - Heroku Scheduler
 * - AWS EventBridge
 * - Google Cloud Scheduler
 * - Or a dedicated cron service
 */

