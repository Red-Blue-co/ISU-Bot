
/**
 * Pauses execution for a set amount of time.
 * @param {number} ms - Milliseconds to sleep (e.g., 1000 = 1 sec)
 * @returns {Promise}
 */
const sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Pauses execution for a RANDOM amount of time between min and max.
 * This makes the bot behave more like a human.
 * @param {number} min - Minimum wait time (ms)
 * @param {number} max - Maximum wait time (ms)
 * @returns {Promise}
 */
const randomDelay = async (min = 1000, max = 3000) => {
    // Generate a random number between min and max
    const delay = Math.floor(Math.random() * (max - min + 1) + min);
    await sleep(delay);
};

/**
 * Cleans a WhatsApp ID to get just the phone number.
 * useful for logs: "123456789@c.us" -> "123456789"
 * @param {string} id 
 * @returns {string}
 */
const cleanId = (id) => {
    if (!id) return 'Unknown';
    return id.split('@')[0];
};

module.exports = {
    sleep,
    randomDelay,
    cleanId
};