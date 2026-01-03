const Fuse = require('fuse.js');
const path = require('path');
const fs = require('fs');

const dataPath = path.join(__dirname, '../data/knowledgeBase.json');

function loadKnowledgeBase() {
    try {
        if (!fs.existsSync(dataPath)) return [];
        const rawData = fs.readFileSync(dataPath, 'utf8');
        return JSON.parse(rawData);
    } catch (err) {
        console.error("❌ Error loading knowledge base:", err.message);
        return [];
    }
}

let knowledgeBase = loadKnowledgeBase();

// Fuse options for Typos (Fallback)
const fuseOptions = {
    keys: ['keys'],
    threshold: 0.4, 
    includeScore: true
};
let fuse = new Fuse(knowledgeBase, fuseOptions);

function findAnswer(userMessage) {
    if (!userMessage) return null;
    
    const cleanMessage = userMessage.toLowerCase();
    
    // =========================================================
    // 🧠 METHOD A: BEST MATCH SCORING (Context Aware)
    // =========================================================
    // Instead of stopping at the first match, we check ALL of them
    // and see which one has the MOST matching keywords.

    let bestMatchItem = null;
    let highestScore = 0;

    if (knowledgeBase && Array.isArray(knowledgeBase)) {
        for (const item of knowledgeBase) {
            if (!item.keys) continue;

            let currentScore = 0;

            // Check how many keys exist in the user's message
            item.keys.forEach(key => {
                const k = key.toLowerCase();
                if (cleanMessage.includes(k)) {
                    // +1 Point for every keyword found
                    currentScore += 1;
                    
                    // +1 Bonus Point if it's an exact word (avoids partial matches like 'mess' in 'message')
                    // This splits the sentence into words and checks distinct matches
                    if (cleanMessage.split(/\s+/).includes(k)) {
                        currentScore += 1;
                    }
                }
            });

            // If this item has a higher score than the previous best, it becomes the new winner
            if (currentScore > highestScore) {
                highestScore = currentScore;
                bestMatchItem = item;
            }
        }
    }

    // 🏆 DECIDE WINNER
    // If we found a strong match (Score > 1 means it matched multiple words or a strong exact keyword)
    if (bestMatchItem && highestScore > 0) {
        console.log(`🧠 Smart Match: "${bestMatchItem.answer.substring(0, 20)}..." | Score: ${highestScore}`);
        return bestMatchItem.answer;
    }

    // =========================================================
    // 🔍 METHOD B: FUZZY SEARCH (Fallback for Typos)
    // =========================================================
    // Only runs if Method A failed to find a clear winner
    if (fuse) {
        const results = fuse.search(userMessage);
        if (results.length > 0) {
            console.log(`🔍 Fuzzy Match: Score ${results[0].score}`);
            return results[0].item.answer;
        }
    }
    
    return null; 
}

function reloadData() {
    knowledgeBase = loadKnowledgeBase();
    fuse = new Fuse(knowledgeBase, fuseOptions);
    console.log("🔄 Knowledge Base Reloaded.");
}

module.exports = { findAnswer, reloadData };