module.exports = {
    name: 'purge',
    description: 'Deletes last X messages, optionally filtering by a keyword.',
    usage: '!purge 10 [keyword]', 
    dmOnly: false,

    execute: async (client, msg, args) => {
        try {
            const chat = await msg.getChat();

            // 1. Group Check
            if (!chat.isGroup) {
                await msg.reply("❌ This command only works in groups.");
                return;
            }

            // 2. Admin Check (Safe Mode)
            const participants = chat.participants || [];
            const botId = client.info.wid._serialized;
            const botParticipant = participants.find(p => p.id._serialized === botId);
            
            if (botParticipant && !botParticipant.isAdmin) {
                await msg.reply("❌ I cannot delete messages. Please make me an **Admin**.");
                return;
            }

            // 3. Parse Arguments
            let amount = parseInt(args[0]);
            let targetKeyword = args[1] ? args[1].toLowerCase() : null; 

            if (isNaN(amount) || amount < 1 || amount > 100) {
                await msg.reply("⚠️ Please provide a number between 1 and 100.\nExample: `!purge 10`");
                return;
            }

            // 4. Fetch Messages (CRASH FIX IS HERE)
            // We fetch messages, but we wrap it in a try-catch in case fetch fails entirely
            let messages = [];
            try {
                messages = await chat.fetchMessages({ limit: amount + 2 }); // Fetch a few extra
            } catch (e) {
                console.log("⚠️ Fetch failed. Chat might be empty or syncing.");
                await msg.reply("❌ Could not fetch chat history. Try sending a text message first.");
                return;
            }

            let deletedCount = 0;
            let scannedCount = 0;

            for (const m of messages) {
                // 🛡️ SKIP SYSTEM MESSAGES & SAFEGUARDS
                // If message is undefined, or has no ID, or is a system notification -> SKIP
                if (!m || !m.id || m.type === 'e2e_notification' || m.type === 'gp2' || m.type === 'call_log') {
                    continue; 
                }

                // Skip the command message itself (so you can see the result)
                if (m.id.id === msg.id.id) continue; 

                let shouldDelete = false;

                if (targetKeyword) {
                    // Keyword Mode (Safe Check for Body)
                    if (m.body && m.body.toLowerCase().includes(targetKeyword)) {
                        shouldDelete = true;
                    }
                } else {
                    // Nuclear Mode
                    shouldDelete = true;
                }

                if (shouldDelete) {
                    try {
                        await m.delete(true);
                        deletedCount++;
                        // Tiny delay to avoid rate limits
                        await new Promise(r => setTimeout(r, 200)); 
                    } catch (e) {
                        // Ignore delete errors (too old, permissions, etc)
                    }
                }
                scannedCount++;
                
                // Stop if we hit the requested amount (since we fetched extra)
                if (deletedCount >= amount) break;
            }

            // 5. Report
            let reportMsg = targetKeyword 
                ? `🗑️ Scanned ${scannedCount} messages.\n✅ Found and deleted **${deletedCount}** containing "${targetKeyword}".`
                : `🗑️ Purged **${deletedCount}** messages.`;

            const feedback = await chat.sendMessage(reportMsg);
            
            setTimeout(() => {
                feedback.delete(true).catch(() => {});
            }, 3000);

        } catch (err) {
            console.error("❌ Purge Error:", err.message);
            await msg.reply("❌ Failed to purge messages.");
        }
    }
};