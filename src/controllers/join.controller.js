const banManager = require('../services/banManager');
const { randomDelay } = require('../utils/helpers');

const onGroupJoin = async (client, notification) => {
    try {
        const chat = await notification.getChat();
        
        for (const userId of notification.recipientIds) {
            // Check if banned
            if (banManager.isBanned(userId)) {
                console.log(`🚨 Banned user ${userId} detected. Preparing to kick...`);
                await chat.sendMessage(`🚫 @${userId.split('@')[0]} is banned from this group.`, {
                        mentions: [userId]});
                // 1. Send the DM Warning FIRST (Before kicking)
                try {
                    await client.sendMessage(userId, `⚠️ **Notice from ${chat.name}**\n\nYou were removed because you are permanently banned from this group for spamming.\nPlease do not try to rejoin.`);
                    console.log(`📨 DM sent to ${userId}`);
                } catch (dmError) {
                    console.log(`❌ Could not DM user (Privacy settings?): ${dmError.message}`);
                }

                // 2. Wait a moment (so the DM sends successfully)
                await randomDelay(1000, 2000);

                // 3. Kick them out
                try {
                    await chat.removeParticipants([userId]);
                    console.log(`✅ User ${userId} kicked.`);
                } catch (kickError) {
                    console.error(`❌ Kick failed: ${kickError.message}`);
                }
            }
        }
    } catch (error) {
        console.error('Error in joinController:', error);
    }
};

module.exports = { onGroupJoin };