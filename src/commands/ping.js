module.exports = {
    // 1. SETTINGS
    name: "ping",
    description: "Checks if the bot is online and measures response time.",
    usage: "!ping",
    dmOnly: true, // <--- Works in Groups AND Private Chats

    // 2. LOGIC
    async execute(client, msg, args) {
        // Calculate the difference between now and when the message was created
        // (This shows the lag/speed of your VPS)
        const start = Date.now();
        const messageTime = msg.timestamp * 1000; // WhatsApp gives seconds, JS needs ms
        const latency = start - messageTime;

        // Reply with the pong and the speed
        // latency might be negative if clocks are slightly off, so we use Math.abs
        await msg.reply(`🏓 **Pong!**\nBot is online.\nResponse time: ~${Math.abs(latency)}ms`);
    }
};