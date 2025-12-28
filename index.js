/**
 * * Features:
 */

const fs = require('fs');
const path = require('path');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

// --- IMPORTS ---
const config = require('./src/utils/config');
const { handleCommand } = require('./src/controllers/commandHandler.controller');
const onMessageSpamCheck = require('./src/controllers/message.controller');
const { onGroupJoin } = require('./src/controllers/join.controller');

// --- LOGGING SYSTEM ---
const LOG_FILE = path.join(__dirname, 'bot.log');

/**
 * Helper to log to both Console and File
 * @param {string} level - INFO, WARN, ERROR, CRITICAL
 * @param {string} message - The text to log
 */
function log(level, message) {
    const timestamp = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
    const logEntry = `[${timestamp}] [${level}] ${message}`;

    // 1. Print to Console
    console.log(logEntry);

    // 2. Append to File
    try {
        fs.appendFileSync(LOG_FILE, logEntry + '\n');
    } catch (err) {
        console.error("❌ Failed to write to log file:", err);
    }
}

// --- GLOBAL ERROR HANDLING (CRASH PROTECTION) ---
process.on('uncaughtException', (err) => {
    log('CRITICAL', `🔥 Uncaught Exception: ${err.message}`);
    log('CRITICAL', err.stack);
    // process.exit(1); // Optional: Restart if using PM2
});

process.on('unhandledRejection', (reason, promise) => {
    log('CRITICAL', `🔥 Unhandled Rejection: ${reason}`);
});


// --- CLIENT SETUP ---
log('INFO', '🚀 Initializing Bot Client...');

const client = new Client({
    authStrategy: new LocalAuth(), // Saves session
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
        ]
    }
});


// --- EVENT LISTENERS ---

// 1. QR Code Generation
client.on('qr', (qr) => {
    log('INFO', '📡 QR Code received. Please scan to login.');
    qrcode.generate(qr, { small: true });
});

// 2. Successful Login
client.on('ready', () => {
    log('INFO', '✅ Bot is ONLINE and Connected!');
    log('INFO', `🛡️  Mode: Active | Prefix: ${config.bot.prefix}`);
});

// 3. Authentication Failure
client.on('auth_failure', (msg) => {
    log('ERROR', `❌ Authentication Failed: ${msg}`);
});

// 4. Disconnected (Network/Ban issue)
client.on('disconnected', (reason) => {
    log('WARN', `⚠️ Client Disconnected. Reason: ${reason}`);
});

// 5. Incoming Messages (Commands & Spam)
client.on('message_create', async (msg) => {
    try {
        // A. Check for Commands (!help, !ban)
        // If it starts with prefix, we assume it's a command attempt
        if (msg.body.startsWith(config.bot.prefix)) {
            await handleCommand(client, msg);
        }
        
        // B. Run Spam Checker (Always run this, even on commands, to prevent command spam)
        await onMessageSpamCheck(client, msg);

    } catch (err) {
        log('ERROR', `Message Handler Failed: ${err.message}`);
    }
});

// 6. Group Join (Detect Banned Users)
client.on('group_join', async (notification) => {
    log('INFO', `👥 Group Join Event detected in chat: ${notification.chatId}`);
    try {
        await onGroupJoin(client, notification);
    } catch (err) {
        log('ERROR', `Join Handler Failed: ${err.message}`);
    }
});


// --- START ---
log('INFO', '⚙️  Starting Client...');
client.initialize();