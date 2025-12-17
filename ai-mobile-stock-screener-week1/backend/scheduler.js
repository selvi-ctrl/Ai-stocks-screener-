const cron = require('node-cron');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// Scheduler status tracking
let schedulerStatus = {
    isRunning: false,
    lastRun: null,
    lastSuccess: null,
    lastError: null,
    runCount: 0,
    errorCount: 0
};

// Get the absolute path to the Python script
const scriptPath = path.join(__dirname, '../scripts/ingest_yfinance.py');

/**
 * Execute the Python data ingestion script
 * @returns {Promise<void>}
 */
const runDataIngestion = () => {
    return new Promise((resolve, reject) => {
        console.log(`[${new Date().toISOString()}] Starting data ingestion...`);
        schedulerStatus.lastRun = new Date();
        schedulerStatus.runCount++;

        // Check if script exists
        if (!fs.existsSync(scriptPath)) {
            const error = `Script not found: ${scriptPath}`;
            console.error(`[${new Date().toISOString()}] ERROR: ${error}`);
            schedulerStatus.lastError = error;
            schedulerStatus.errorCount++;
            reject(new Error(error));
            return;
        }

        // Execute the Python script
        exec(`python "${scriptPath}"`, { timeout: 300000 }, (error, stdout, stderr) => {
            if (error) {
                console.error(`[${new Date().toISOString()}] Error executing script:`, error);
                console.error('stderr:', stderr);
                schedulerStatus.lastError = error.message;
                schedulerStatus.errorCount++;
                reject(error);
                return;
            }

            if (stderr && stderr.trim()) {
                console.warn(`[${new Date().toISOString()}] Script warnings:`, stderr);
            }

            console.log(`[${new Date().toISOString()}] Data ingestion completed successfully`);
            console.log('stdout:', stdout);
            schedulerStatus.lastSuccess = new Date();
            resolve();
        });
    });
};

/**
 * Check if current time is within market hours (9 AM - 4 PM IST, Mon-Fri)
 * @returns {boolean}
 */
const isMarketHours = () => {
    const now = new Date();
    
    // Convert to IST (UTC+5:30)
    const istOffset = 5.5 * 60; // IST offset in minutes
    const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
    const istTime = new Date(utcTime + (istOffset * 60000));
    
    const day = istTime.getDay(); // 0 = Sunday, 6 = Saturday
    const hour = istTime.getHours();
    
    // Check if it's a weekday (Monday-Friday)
    const isWeekday = day >= 1 && day <= 5;
    
    // Check if it's between 9 AM and 4 PM IST
    const isDuringMarketHours = hour >= 9 && hour < 16;
    
    return isWeekday && isDuringMarketHours;
};

/**
 * Initialize the scheduler
 */
const initScheduler = () => {
    console.log('Initializing stock data scheduler...');
    
    // Schedule to run every 30 minutes
    // Cron expression: */30 * * * * means "every 30 minutes"
    const job = cron.schedule('*/30 * * * *', async () => {
        // Only run during market hours
        if (!isMarketHours()) {
            console.log(`[${new Date().toISOString()}] Outside market hours - skipping data ingestion`);
            return;
        }

        try {
            schedulerStatus.isRunning = true;
            await runDataIngestion();
        } catch (error) {
            console.error(`[${new Date().toISOString()}] Scheduled job failed:`, error);
        } finally {
            schedulerStatus.isRunning = false;
        }
    });

    console.log('Scheduler initialized successfully');
    console.log('Schedule: Every 30 minutes during market hours (9 AM - 4 PM IST, Mon-Fri)');
    
    // Run immediately on startup if within market hours
    if (isMarketHours()) {
        console.log('Within market hours - running initial data ingestion...');
        runDataIngestion()
            .then(() => console.log('Initial data ingestion completed'))
            .catch(err => console.error('Initial data ingestion failed:', err));
    }

    return job;
};

/**
 * Get scheduler status
 * @returns {object} Current scheduler status
 */
const getSchedulerStatus = () => {
    return {
        ...schedulerStatus,
        isMarketHours: isMarketHours(),
        nextRun: schedulerStatus.isRunning ? null : 'Next 30-minute interval during market hours'
    };
};

/**
 * Manually trigger data ingestion (for testing/admin purposes)
 * @returns {Promise<void>}
 */
const triggerManualRun = async () => {
    if (schedulerStatus.isRunning) {
        throw new Error('Data ingestion is already running');
    }

    try {
        schedulerStatus.isRunning = true;
        await runDataIngestion();
        return { success: true, message: 'Manual data ingestion completed successfully' };
    } catch (error) {
        throw error;
    } finally {
        schedulerStatus.isRunning = false;
    }
};

module.exports = {
    initScheduler,
    getSchedulerStatus,
    triggerManualRun,
    isMarketHours
};
