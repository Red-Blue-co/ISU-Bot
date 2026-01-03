const fs = require('fs');
const path = require('path');

const DATA_FOLDER = path.join(__dirname, '../../data');
const FILE_PATH = path.join(DATA_FOLDER, 'banned.json');

class BanManager {
    constructor() {
        this.bannedUsers = new Set();
        
        // 2. Ensure the 'data' folder exists
        if (!fs.existsSync(DATA_FOLDER)) {
            try {
                fs.mkdirSync(DATA_FOLDER, { recursive: true });
                console.log('📂 Created "data" folder.');
            } catch (e) {
                console.error('❌ Could not create data folder:', e);
            }
        }

        // 3. Load data immediately
        this.load();
    }

    load() {
        try {
            if (fs.existsSync(FILE_PATH)) {
                const rawData = fs.readFileSync(FILE_PATH, 'utf8');
                const parsedData = JSON.parse(rawData);
                
                // Convert array back to Set
                this.bannedUsers = new Set(parsedData);
                
                console.log(`✅ [BanManager] Loaded ${this.bannedUsers.size} users from banned.json`);
                console.log(`   (Path: ${FILE_PATH})`);
            } else {
                console.log('ℹ️ [BanManager] No banned.json found. Starting fresh.');
                this.save(); // Create the empty file
            }
        } catch (error) {
            console.error('❌ [BanManager] Failed to load data:', error);
            // If corrupt, start fresh to prevent crashing
            this.bannedUsers = new Set();
        }
    }

    save() {
        try {
            // Convert Set to Array for JSON saving
            const data = JSON.stringify([...this.bannedUsers], null, 2);
            fs.writeFileSync(FILE_PATH, data, 'utf8');
            // console.log('💾 Ban list saved.'); // Commented out to reduce spam
        } catch (error) {
            console.error('❌ [BanManager] Failed to save data:', error);
        }
    }

    add(userId) {
        if (!userId) return;
        this.bannedUsers.add(userId);
        this.save();
    }

    remove(userId) {
        if (this.bannedUsers.has(userId)) {
            this.bannedUsers.delete(userId);
            this.save();
            return true;
        }
        return false;
    }

    isBanned(userId) {
        return this.bannedUsers.has(userId);
    }
}

// Export a SINGLE instance (Singleton)
module.exports = new BanManager();