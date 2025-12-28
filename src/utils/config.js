const fs = require('fs');
const path = require('path');
const ini = require('ini');

// Path to root: src/utils/ -> src/ -> root/
const configPath = path.resolve(__dirname, '../../index.conf');

let config;

try {
    const fileContent = fs.readFileSync(configPath, 'utf-8');
    config = ini.parse(fileContent);

    // Conversions
    config.spam.maxMessages = parseInt(config.spam.maxMessages);
    config.spam.timeWindow = parseInt(config.spam.timeWindow);
    config.spam.minDelay = parseInt(config.spam.minDelay);
    config.spam.maxDelay = parseInt(config.spam.maxDelay);
    config.bot.adminOnly = (config.bot.adminOnly === 'true');

} catch (err) {
    console.error('⚠️ index.conf not found. Using defaults.');
    config = { 
        spam: { maxMessages: 6, timeWindow: 5000, minDelay: 1000, maxDelay: 3000 }, 
        bot: { targetName: 'kim', prefix: '!', adminOnly: false } 
    };
}

module.exports = config;