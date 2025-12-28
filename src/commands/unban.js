const banManager = require('../services/banManager');

module.exports = {
    name: "unban",
    description: "Unbans a user and sends them an invite link.",
    usage: "!unban <number>",
    dmOnly: false,

    async execute(client, msg, args) {
        // 1. Validation
        if (!args.length) return msg.reply("⚠️ Please type the number. Example: `!unban 9876543210`");

        const searchNumber = args.join('').replace(/[^0-9]/g, '');

        if (searchNumber.length < 5) {
            return msg.reply("⚠️ Number is too short.");
        }

        console.log(`\n🔍 [UNBAN] Searching for number containing: "${searchNumber}"`);

        // 2. Search Logic
        const allBanned = Array.from(banManager.bannedUsers);
        let matchFound = null;

        for (const fullId of allBanned) {
            if (fullId.includes(searchNumber)) {
                matchFound = fullId;
                break;
            }
        }

        // 3. EXECUTE
        if (matchFound) {
            // A. Remove from Ban List
            banManager.remove(matchFound);
            console.log(`✅ [UNBAN] Removed: ${matchFound}`);

            // B. Get Group Invite Link
            let inviteSent = false;
            try {
                const chat = await msg.getChat();
                
                // Only try this if we are inside a Group
                if (chat.isGroup) {
                    // Generate link (Requires Admin permissions)
                    const inviteCode = await chat.getInviteCode();
                    const inviteLink = `https://chat.whatsapp.com/${inviteCode}`;

                    // Send DM to the user
                    await client.sendMessage(matchFound, 
                        `🎉 **Good News!**\n\n` +
                        `You have been unbanned from **${chat.name}**.\n` +
                        `You are welcome to rejoin using this link:\n\n` +
                        `${inviteLink}`
                    );
                    inviteSent = true;
                    console.log(`📨 Invite link sent to ${matchFound}`);
                }
            } catch (err) {
                console.error("❌ Failed to send invite (Bot not admin? User blocked DMs?)", err.message);
            }

            // C. Reply to Admin in Group
            let replyMsg = `✅ **UNBANNED**\nUser: ${matchFound.split('@')[0]}\n`;
            
            if (inviteSent) {
                replyMsg += `📨 **Invite link has been DM'd to them.**`;
            } else {
                replyMsg += `⚠️ **Could not send invite link.** (I might not be Admin, or their DMs are closed).`;
            }

            await msg.reply(replyMsg);

        } else {
            // Not Found
            await msg.reply(
                `❌ **Not Found**\n` +
                `I checked ${allBanned.length} banned users but found no match for "${searchNumber}".`
            );
        }
    }
};