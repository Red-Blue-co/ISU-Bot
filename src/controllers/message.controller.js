const config = require('../utils/config');
const spamFilter = require('../services/spamFilter');
const banManager = require('../services/banManager');
const { findAnswer } = require('../utils/autoResponder'); 

const onMessage = async (client, msg) => {
    try {
        const isHost = msg.fromMe; // Is this YOU?

        // ============================================================
        // 🛑 SAFETY FILTERS
        // ============================================================

        // 1. LID CHECK: Ignore strange ID types unless it's YOU
        if (!isHost && (msg.from.includes('lid') || (msg.author && msg.author.includes('lid')))) {
            return; 
        }

        // 2. SYSTEM MESSAGE CHECK
        const ignoredTypes = ['e2e_notification', 'gp2', 'notification_template', 'call_log', 'protocol', 'ciphertext', 'revoked'];
        if (ignoredTypes.includes(msg.type)) return;

        // 3. HISTORY SYNC CHECK (Old Messages)
        const messageAge = Math.floor(Date.now() / 1000) - msg.timestamp;
        if (messageAge > 300) return; 

        // ============================================================
        // 🛠️ LOAD CHAT
        // ============================================================
        let chat;
        try { chat = await msg.getChat(); } catch (err) { return; }
        const senderId = msg.author || msg.from; 

        // ============================================================
        // 🧪 TEST MODE & LOOP PROTECTION
        // ============================================================
        if (isHost) {
            // Allow commands starting with '!'
            if (msg.body.startsWith('!')) {
                // Pass
            } 
            // Allow short text for testing Auto-Responder
            else if (msg.body.length < 200) {
                 // Pass
            } 
            // Block long text to prevent loops
            else {
                return; 
            }
        }

        // ============================================================
        // 🛡️ SECURITY LAYER (Only runs in Groups)
        // ============================================================
        if (chat.isGroup) {
            // 1. BAN CHECK
            if (banManager.isBanned(senderId)) {
                try { await chat.removeParticipants([senderId]); } catch (e) {}
                return;
            }

            // 2. SPAM CHECK
            try {
                const spamMessages = spamFilter.checkAndGetSpam(senderId, msg);
                if (spamMessages && spamMessages.length > 0) {
                    console.log(`🚨 [SPAM] Detected from ${senderId}.`);
                    try { await Promise.all(spamMessages.map(async (m) => m.delete(true))); } catch (err) {}
                    
                    spamFilter.reset(senderId);
                    banManager.add(senderId);
                    await executeBan(client, chat, senderId, "Excessive Spamming");
                    return;
                }
            } catch (err) {}

            // 3. BAD NAME CHECK
            const pushname = (msg._data.notifyName || "").toLowerCase();
            if (config.bot && config.bot.targetName && pushname.includes(config.bot.targetName.toLowerCase())) {
                banManager.add(senderId); 
                await executeBan(client, chat, senderId, "Forbidden Username");
                return; 
            }
        }

        // ============================================================
        // 🔀 ROUTING LOGIC
        // ============================================================
        const body = msg.body;

        // ➤ PATH A: COMMANDS
        if (body.startsWith('!')) {
            
            // 🔒 GLOBAL ADMIN LOCK
            if (config.adminOnly === true) {
                if (chat.isGroup) {
                    const participants = chat.participants || [];
                    const participant = participants.find(p => p.id._serialized === senderId);
                    
                    // 🛡️ THE FIX: 
                    // "If it is NOT me (!isHost) AND they are NOT admin, ignore them."
                    // Since isHost is TRUE, this line is FALSE, so you PASS.
                    if (!isHost && (!participant || !participant.isAdmin)) {
                        return; 
                    }
                } else {
                    // DM: Only Host allowed
                    if (!isHost) return;
                }
            }

            // Parse Command
            const args = body.slice(1).trim().split(/ +/);
            const commandName = args.shift().toLowerCase();

            if (client.commands && client.commands.has(commandName)) {
                const command = client.commands.get(commandName);
                if (command.dmOnly === true && chat.isGroup) return; 
                
                await command.execute(client, msg, args);
            }
            return; 
        }

        // ➤ PATH B: AUTO-RESPONDER
        const autoReply = findAnswer(body);
        if (autoReply) {
             await chat.sendStateTyping(); 
             await msg.reply(autoReply);
        }

    } catch (error) {
        if (!error.message.includes('Evaluation failed')) {
            console.error("❌ CRITICAL ERROR:", error.message);
        }
    }
};

async function executeBan(client, chat, userId, reason) {
    try { await chat.removeParticipants([userId]); } catch (e) {}
    try { await chat.sendMessage(`🛡️ **BANNED** @${userId.split('@')[0]}\nReason: ${reason}`, { mentions: [userId] }); } catch (e) {}
}

module.exports = onMessage;