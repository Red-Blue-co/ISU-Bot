/**
 * src/services/spamFilter.js
 * Tracks user messages and returns the list of messages to delete if they spam.
 */
const config = require('../utils/config');

class SpamFilter {
    constructor() {
        // We store an ARRAY of message objects for each user
        // Map<UserId, Array<{timestamp, msg}>>
        this.history = new Map();
    }

    /**
     * Records a message and checks for spam.
     * @param {string} userId - The sender's ID
     * @param {object} msg - The actual WhatsApp message object
     * @returns {Array|null} - Returns ARRAY of messages to delete if spam detected, otherwise null.
     */
    checkAndGetSpam(userId, msg) {
        const now = Date.now();
        
        if (!this.history.has(userId)) {
            this.history.set(userId, []);
        }

        const userHistory = this.history.get(userId);

        // 1. Add new message to history
        userHistory.push({ timestamp: now, msg: msg });

        // 2. Filter out old messages (keep only those within the time window)
        // e.g., Keep messages from the last 5 seconds
        const validHistory = userHistory.filter(entry => now - entry.timestamp < config.spam.timeWindow);
        this.history.set(userId, validHistory);

        // 3. CHECK: Did they exceed the limit?
        if (validHistory.length >= config.spam.maxMessages) {
            // SPAM DETECTED!
            // Return ALL the messages currently in the history so we can delete them
            return validHistory.map(entry => entry.msg);
        }

        return null; // Not spam yet
    }

    /**
     * Clears history for a user (called after banning)
     */
    reset(userId) {
        this.history.delete(userId);
    }
}

module.exports = new SpamFilter();