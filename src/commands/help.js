module.exports = {
    name: 'help',
    description: 'Lists all available commands',
    usage: '!help',
    
    // ✅ This command itself is DM Only
    dmOnly: true, 

    execute: async (client, msg, args) => {
        try {
            if (!client.commands || client.commands.size === 0) {
                await msg.reply("❌ Error: No commands found.");
                return;
            }

            let helpText = "🤖 *Bot Command Menu* 🤖\n\n";

            // Loop through all commands
            client.commands.forEach((cmd) => {
                const name = cmd.name.charAt(0).toUpperCase() + cmd.name.slice(1);
                
                // ✅ Check if the command is restricted to DMs
                const tag = cmd.dmOnly ? " _[DM Only]_" : ""; 
                
                helpText += `🔹 *!${cmd.name}*${tag}\n   └ ${cmd.description || "No description"}\n`;
            });

            helpText += "\n💡 *Note:* Commands marked _[DM Only]_ will not work in groups.";

            await msg.reply(helpText);

        } catch (err) {
            console.error("❌ Error in !help command:", err.message);
            await msg.reply("❌ Failed to load help menu.");
        }
    }
};