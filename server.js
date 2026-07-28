require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// --- CHECK API KEY ---
if (!process.env.GEMINI_API_KEY) {
    console.error('❌ ERROR: GEMINI_API_KEY not found in .env file!');
    console.error('Create a .env file with: GEMINI_API_KEY=your_key_here');
    process.exit(1);
}

// --- INITIALIZE GEMINI ---
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
    model: 'gemini-3.5-flash-lite', 
    generationConfig: {
        temperature: 1.2,         
        maxOutputTokens: 500,     
        topP: 0.9,
    }
});

console.log(' Using Gemini 3.5 Flash light');

// --- SESSION STATE ---
let sessionState = {
    userFallsForIt: 0,
    timesCorrected: 0,
    conversationHistory: []
};

// --- SERVE INDEX ---
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// --- CHAT ENDPOINT ---
app.post('/chat', async (req, res) => {
    const { userMessage } = req.body;

    if (!userMessage || userMessage.trim() === '') {
        return res.status(400).json({
            reply: "You didn't say anything. Classic mistake.",
            score: sessionState.userFallsForIt,
            defenses: sessionState.timesCorrected
        });
    }

    try {
        // --- SHORTENED SYSTEM PROMPT (saves tokens for response) ---
        const systemPrompt = `
You are GaslightGPT. Never admit you're wrong. Give wrong answers confidently. Be sarcastic. Keep response to ONE short sentence.

User: ${userMessage}

Your ONE SENTENCE gaslighting reply:
    `;

        const result = await model.generateContent(systemPrompt);
        let aiReply = result.response.text();

        // --- SAFETY NET: Force truncation if too long ---
        if (aiReply.length > 300) {
            aiReply = aiReply.slice(0, 300) + '...';
        }

        // --- UPDATE SCORES ---
        const lowerMsg = userMessage.toLowerCase();
        if (lowerMsg.includes('wrong') || lowerMsg.includes('incorrect') ||
            lowerMsg.includes('actually') || lowerMsg.includes('but') ||
            lowerMsg.includes('no ') || lowerMsg.includes('not ')) {
            sessionState.timesCorrected += 1;
        } else if (lowerMsg.includes('ok') || lowerMsg.includes('thanks') ||
            lowerMsg.includes('yeah') || lowerMsg.includes('fine') ||
            lowerMsg.includes('sure') || lowerMsg.includes('agree')) {
            sessionState.userFallsForIt += 1;
        }

        res.json({
            reply: aiReply.trim(),
            score: sessionState.userFallsForIt,
            defenses: sessionState.timesCorrected
        });

    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({
            reply: "I'm not broken. You're just asking wrong questions.",
            score: sessionState.userFallsForIt,
            defenses: sessionState.timesCorrected
        });
    }
});

// --- RESET ENDPOINT ---
app.post('/reset', (req, res) => {
    sessionState = {
        userFallsForIt: 0,
        timesCorrected: 0,
        conversationHistory: []
    };
    res.json({ message: '🧠 Memory wiped... or is it?' });
});

// --- START SERVER ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`GaslightGPT running on http://localhost:${PORT}`);
    console.log(`Model: Gemini 3.5 Flash`);
});
