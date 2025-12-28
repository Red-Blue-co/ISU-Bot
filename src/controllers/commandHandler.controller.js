const fs = require('fs');
const path = require('path');
const config = require('../utils/config');

const commands = new Map();

// Load files...
const commandFiles = fs.readdirSync(path.join(__dirname, '../commands')).filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const command = require(`../commands/${file}`);
    const commandName = command.name || file.split('.')[0]; 
    commands.set(commandName, command);
}

const handleCommand = async (client, msg) => {
    // 1. Declare OUTSIDE the try block
    let commandName = "";

    try {
        if (!msg.body.startsWith(config.bot.prefix)) return;

        const args = msg.body.slice(config.bot.prefix.length).trim().split(/ +/);
        
        // 2. Assign value
        commandName = args.shift().toLowerCase();

        if (!commands.has(commandName)) return;

        const command = commands.get(commandName);
        const chat = await msg.getChat();

        if (command.dmOnly === true && chat.isGroup) {
            return;
        }

        await command.execute(client, msg, args, commands);

    } catch (error) {
        // 3. Now this works safely
        console.error(`❌ Error executing !${commandName || 'unknown'}:`, error);
    }
};

module.exports = { handleCommand };