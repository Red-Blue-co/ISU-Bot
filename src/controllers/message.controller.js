const config = require('../utils/config');
const spamFilter = require('../services/spamFilter');
const banManager = require('../services/banManager');

const onMessage = async (client, msg) => {
    try {
        const chat = await msg.getChat();
        const senderId = msg.author || msg.from; 

        if (!chat.isGroup) return;

        // --- 1. CHECK IF ALREADY BANNED ---
        if (banManager.isBanned(senderId)) {
            await chat.removeParticipants([senderId]);
            return;
        }

        // --- 2. SPAM CHECK ---
        const spamMessages = spamFilter.checkAndGetSpam(senderId, msg);

        if (spamMessages && spamMessages.length > 0) {
             console.log(`🚨 [SPAM] Detected from ${senderId}. Deleting...`);
             
             // Delete Messages
             try {
                 await Promise.all(spamMessages.map(async (m) => m.delete(true)));
             } catch (err) {}
             
             // Reset & Ban
             spamFilter.reset(senderId);
             banManager.add(senderId);
             
             // Execute Ban
             await executeBan(client, chat, senderId, "Excessive Spamming");
             return;
        }

        // --- 3. BAD NAME CHECK ---
        // We get the name just for checking, but we won't use it in the message
        const pushname = (msg._data.notifyName || "").toLowerCase();
        
        if (pushname.includes(config.bot.targetName.toLowerCase())) {
             console.log(`🎯 [BAD NAME] Detected.`);
             try { await msg.delete(true); } catch(e) {}
             
             banManager.add(senderId); 
             await executeBan(client, chat, senderId, "Forbidden Username");
        }

    } catch (error) {
        console.error("❌ Error:", error.message);
    }
};

// --- SIMPLIFIED BAN FUNCTION ---
async function executeBan(client, chat, userId, reason) {
    // 1. Kick
    try {
        await chat.removeParticipants([userId]);
    } catch (e) {
        console.error("❌ Failed to kick (Bot not Admin?)");
    }

    // 2. Alert (Just Mentions the User)
    try {
        await chat.sendMessage(
            `🛡️ **AUTO-BAN TRIGGERED**\n` +
            `👤 User: @${userId.split('@')[0]}\n` + // <--- Simple Tag
            `📝 Reason: ${reason}\n\n` +
            `👇 **Copy to Unban:**`,
            { mentions: [userId] } // <--- This makes the tag work
        );

        // 3. The Copy Code
        await chat.sendMessage(`\`\`\`!unban ${userId}\`\`\``);

    } catch (e) {
        console.error("❌ Could not send log:", e);
    }
    
    // 4. DM
    try {
        await client.sendMessage(userId, `🛑 **You were banned.** Reason: ${reason}`);
    } catch (e) {}
}

module.exports = onMessage;