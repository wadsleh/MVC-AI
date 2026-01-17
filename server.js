const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const GROQ_API_KEY = process.env.MURTA;

app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body; // نركز على النص حالياً لضمان الاستقرار
    
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${GROQ_API_KEY}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            messages: [
                { 
                    // ⚠️ شخصية البوت الاحترافية
                    role: "system", 
                    content: "You are MVC AI, a highly professional assistant created by Murtada. You are fluent in both English and Arabic. If the user speaks English, reply in perfect English. If the user speaks Arabic, reply in clear Arabic. Be concise, smart, and helpful." 
                },
                { role: "user", content: message }
            ],
            // ✅ الموديل الوحيد المستقر والفعال حالياً (الأقوى في النصوص)
            model: "llama-3.3-70b-versatile",
            temperature: 0.7
        })
    });

    const data = await response.json();

    if (data.error) throw new Error(data.error.message);
    
    res.json({ reply: data.choices[0].message.content });

  } catch (error) {
    console.error("Server Error:", error);
    res.status(500).json({ reply: "System update in progress. Please try again in a moment." });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
