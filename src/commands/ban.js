const banManager = require('../services/banManager');

module.exports = {
    name: "ban",
    description: "Permanently bans a user.",
    usage: "!ban @user [Reason]",
    dmOnly: false, 

    async execute(client, msg, args) {
        const chat = await msg.getChat();
        if (!chat.isGroup) return msg.reply('❌ Group only.');

        const mentionedIds = msg.mentionedIds; 
        if (!mentionedIds || mentionedIds.length === 0) {
            return msg.reply('⚠️ Please tag the user: `!ban @user`');
        }
        const targetId = mentionedIds[0];
        const reason = args.slice(1).join(' ') || "Violating rules";

        // 1. Add to DB
        banManager.add(targetId);

        // 2. DM
        try {
            await client.sendMessage(targetId, `🛑 **You have been BANNED.**\nReason: ${reason}`);
        } catch (err) {}

        // 3. Kick & Notify
        setTimeout(async () => {
            try {
                await chat.removeParticipants([targetId]);
                
                // Alert
                await chat.sendMessage(
                    `🚫 **USER BANNED**\n` +
                    `👤 User: @${targetId.split('@')[0]}\n` + // <--- Simple Tag
                    `📝 Reason: ${reason}\n\n` +
                    `👇 **Copy to Unban:**`,
                    { mentions: [targetId] }
                );

                // Copy Code
                await chat.sendMessage(`\`\`\`!unban ${targetId}\`\`\``);

            } catch (err) {
                console.error(err);
                await msg.reply('❌ Failed to kick (Bot needs Admin).');
            }
        }, 1000);
    }
};