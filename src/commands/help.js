// src/commands/help.js

module.exports = {
    // 1. SETTINGS
    name: "help",
    description: "Lists all available commands and how to use them.",
    usage: "!help",
    dmOnly: true, // <--- TRUE: This command is ignored in groups.

    // 2. LOGIC
    async execute(client, msg, args, commands) {
        let helpText = "🤖 *Bot Command List*\n\n";

        // Loop through all loaded commands to build the list dynamically
        commands.forEach((cmd, name) => {
            const desc = cmd.description || "No description provided.";
            const usage = cmd.usage || `!${name}`;
            
            // Add a small tag if it's a DM-only command
            const tag = cmd.dmOnly ? " 🔒 [DM Only]" : ""; 
            
            helpText += `🔹 *!${name}*${tag}\n`;
            helpText += `   📝 ${desc}\n`;
            helpText += `   ⌨️ ${usage}\n\n`;
        });

        helpText += "_Note: Commands marked [DM Only] will not work in groups._";

        // Send the list
        await msg.reply(helpText);
    }
};