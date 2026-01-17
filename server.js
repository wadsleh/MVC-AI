const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static('public'));

const GROQ_API_KEY = process.env.MURTA;

app.post('/api/chat', async (req, res) => {
  const { message, image } = req.body;

  try {
    let userContent = [{ type: "text", text: message }];
    
    // ملاحظة: موديلات الصور في Groq غير مستقرة حالياً
    // سنعتمد على أقوى موديل نصوص لضمان عمل التطبيق دون توقف
    // ونضيف تعليمات صارمة لفهم اللغة
    
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${GROQ_API_KEY}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            messages: [
                { 
                    role: "system", 
                    // ⚠️ هذا السطر هو السر لجعل البوت يفهم كل اللغات
                    content: "You are a helpful and smart AI assistant. You must reply in the EXACT SAME LANGUAGE the user speaks. If they speak Arabic, reply in Arabic. If English, reply in English." 
                },
                { role: "user", content: userContent }
            ],
            // ✅ الموديل الجوكر: قوي، سريع، ويدعم العربية بطلاقة
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
