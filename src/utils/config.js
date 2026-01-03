const fs = require('fs');
const path = require('path');
const ini = require('ini');

// Path to root: src/utils/ -> src/ -> root/
const configPath = path.resolve(__dirname, '../../index.conf');

let config;

try {
    const fileContent = fs.readFileSync(configPath, 'utf-8');
    const parsedIni = ini.parse(fileContent);

    // Create the clean config object the Bot expects
    config = {
        spam: {
            maxMessages: parseInt(parsedIni.spam.maxMessages) || 6,
            timeWindow: parseInt(parsedIni.spam.timeWindow) || 5000,
            minDelay: parseInt(parsedIni.spam.minDelay) || 1000,
            maxDelay: parseInt(parsedIni.spam.maxDelay) || 3000
        },
        bot: {
            targetName: parsedIni.bot.targetName || '',
            prefix: parsedIni.bot.prefix || '!'
        },
        
        // 🛠️ FIX 1: Move 'adminOnly' to the top level so Controller can find it
        // 🛠️ FIX 2: Check for boolean TRUE or string 'true'
        adminOnly: (parsedIni.bot.adminOnly === true || parsedIni.bot.adminOnly === 'true')
    };

} catch (err) {
    console.error('⚠️ index.conf not found. Using defaults.');
    config = { 
        spam: { maxMessages: 6, timeWindow: 5000, minDelay: 1000, maxDelay: 3000 }, 
        bot: { targetName: 'kim', prefix: '!' },
        adminOnly: true // Default to safe
    };
}

module.exports = config;