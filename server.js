const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static('public'));

const GROQ_API_KEY = process.env.MURTA;

app.post('/api/chat', async (req, res) => {
  // نستقبل اللغة المختارة من الواجهة
  const { message, image, language } = req.body;

  try {
    let userContent = [{ type: "text", text: message }];
    
    // تحديد تعليمات النظام بناءً على الزر الذي ضغطته
    const systemInstruction = language === 'ar-SA' 
        ? "أنت MVC AI، مساعد ذكي ومحترف. يجب أن ترد باللغة العربية دائماً وبشكل واضح ومفيد."
        : "You are MVC AI, a smart and professional assistant. You must reply in English.";

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${GROQ_API_KEY}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            messages: [
                { role: "system", content: systemInstruction },
                { role: "user", content: userContent }
            ],
            // نستخدم الموديل الجوكر المستقر والقوي جداً في اللغات
            model: "llama-3.3-70b-versatile",
            temperature: 0.7
        })
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    
    res.json({ reply: data.choices[0].message.content });

  } catch (error) {
    console.error("Server Error:", error);
    res.status(500).json({ reply: "نواجه ضغطاً على السيرفر، حاول مرة أخرى." });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
