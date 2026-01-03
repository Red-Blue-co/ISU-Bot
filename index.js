/**
 * ============================================================
 * 🤖 WHATSAPP BOT - MAIN ENTRY POINT (PRODUCTION READY)
 * ============================================================
 */

const fs = require('fs');
const path = require('path');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

// --- LOCAL IMPORTS ---
// Try/Catch configuration load to prevent immediate crash if missing
let config;
try {
    config = require('./src/utils/config');
} catch (e) {
    console.error("❌ CRITICAL: 'src/utils/config.js' not found. Please create it.");
    process.exit(1);
}

const onMessage = require('./src/controllers/message.controller'); 
const { onGroupJoin } = require('./src/controllers/join.controller');

// --- CONSTANTS ---
const LOG_FILE = path.join(__dirname, 'bot.log');
const SESSION_PATH = path.join(__dirname, '.wwebjs_auth'); // Explicit session path

// ============================================================
// 📋 LOGGING SYSTEM
// ============================================================
function log(level, message) {
    const timestamp = new Date().toISOString().replace('T', ' ').split('.')[0];
    const logEntry = `[${timestamp}] [${level}] ${message}`;
    
    console.log(logEntry);
    
    try {
        fs.appendFileSync(LOG_FILE, logEntry + '\n');
    } catch (err) {
        console.error("❌ Failed to write to log file:", err.message);
    }
}

// ============================================================
// 🛡️ GLOBAL ERROR HANDLING (Anti-Crash)
// ============================================================
process.on('uncaughtException', (err) => {
    log('CRITICAL', `🔥 Uncaught Exception: ${err.message}\n${err.stack}`);
    // In production, we log it but keep running if possible
});

process.on('unhandledRejection', (reason) => {
    log('CRITICAL', `🔥 Unhandled Rejection: ${reason}`);
});

// ============================================================
// 🚀 CLIENT INITIALIZATION
// ============================================================
log('INFO', '🚀 Initializing Bot Client...');

const client = new Client({
    // Explicit path prevents session loss during restarts
    authStrategy: new LocalAuth({ dataPath: SESSION_PATH }), 
    
    // PRODUCTION PUPPETEER CONFIG
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage', // Critical for low-RAM servers
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
        ]
    }
});

// Prevent "MaxListenersExceededWarning" in complex bots
client.setMaxListeners(0); 

// ============================================================
// 📂 COMMAND HANDLER LOADING
// ============================================================
client.commands = new Map();
const commandsPath = path.join(__dirname, 'src', 'commands');

try {
    if (fs.existsSync(commandsPath)) {
        const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
        
        for (const file of commandFiles) {
            try {
                const command = require(path.join(commandsPath, file));
                if (command.name) {
                    client.commands.set(command.name, command);
                    log('INFO', `✅ Loaded Command: ${command.name}`);
                }
            } catch (cmdErr) {
                log('ERROR', `❌ Error loading file ${file}: ${cmdErr.message}`);
            }
        }
    } else {
        log('WARN', '⚠️ "src/commands" folder not found. Creating it...');
        fs.mkdirSync(commandsPath, { recursive: true });
    }
} catch (err) {
    log('ERROR', `❌ Critical Command Loader Error: ${err.message}`);
}

// ============================================================
// 📡 EVENT LISTENERS
// ============================================================

// 1. QR Code Generation
client.on('qr', (qr) => {
    log('INFO', '📡 QR Code received. Scan with WhatsApp!');
    qrcode.generate(qr, { small: true });
});

// 2. Client Ready
client.on('ready', () => {
    log('INFO', '✅ Bot is ONLINE and Connected!');
    log('INFO', `🛡️  Mode: Active | Prefix: "${config.bot.prefix}"`);
    log('INFO', `👤 Admin Mode: ${config.adminOnly ? 'Enabled' : 'Disabled'}`);
});

// 3. Message Handler (Unified)
// We use 'message_create' to allow Self-Bot commands (You controlling it)
client.on('message_create', async (msg) => {
    try {
        await onMessage(client, msg);
    } catch (err) {
        log('ERROR', `❌ Message Handler Failed: ${err.message}`);
    }
});

// 4. Group Join Handler
client.on('group_join', async (notification) => {
    log('INFO', `👥 Group Join Event: ${notification.chatId}`);
    try {
        await onGroupJoin(client, notification);
    } catch (err) {
        log('ERROR', `❌ Join Handler Failed: ${err.message}`);
    }
});

// 5. Disconnect Handler
client.on('disconnected', (reason) => {
    log('WARN', `🔌 Client disconnected: ${reason}`);
    // Note: Use PM2 to auto-restart the process if this happens!
});

// ============================================================
// 🛑 GRACEFUL SHUTDOWN (The "Clean Exit")
// ============================================================
// This prevents "Zombie" Chrome processes when you stop the bot.
const shutdown = async (signal) => {
    log('INFO', `🛑 Received ${signal}. Shutting down safely...`);
    try {
        await client.destroy();
        log('INFO', '✅ Client destroyed. Exiting.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error during shutdown:', error);
        process.exit(1);
    }
};

process.on('SIGINT', () => shutdown('SIGINT'));   // Ctrl+C
process.on('SIGTERM', () => shutdown('SIGTERM')); // Docker/Server stop

// ============================================================
// 🏁 START THE BOT
// ============================================================
log('INFO', '⚙️  Starting Client...');
client.initialize();