const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());

// ⚠️ مهم جداً: زيادة سعة البيانات لاستقبال الصور الكبيرة (Base64)
app.use(express.json({ limit: '50mb' }));
app.use(express.static('public'));

// جلب المفتاح من متغيرات البيئة (حسب تسميتك في Render)
const GROQ_API_KEY = process.env.MURTA;

app.post('/api/chat', async (req, res) => {
  try {
    const { message, image } = req.body;
    
    // تجهيز محتوى الرسالة (نص + صورة إن وجدت)
    let userContent = [{ type: "text", text: message }];
    
    if (image) {
        userContent.push({
            type: "image_url",
            image_url: { url: image } // الصورة تأتي بصيغة Base64
        });
    }

    // الاتصال بـ Groq
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
                    content: "You are MVC AI, a helpful and smart assistant. Reply in the same language the user uses." 
                },
                { 
                    role: "user", 
                    content: userContent 
                }
            ],
            // ⚠️ استخدام موديل الرؤية الجديد والسريع (لتفادي أخطاء Decommissioned)
            model: "llama-3.2-11b-vision-preview",
            temperature: 0.7
        })
    });

    const data = await response.json();

    if (data.error) {
        throw new Error(data.error.message);
    }
    
    // إرسال الرد للواجهة
    res.json({ reply: data.choices[0].message.content });

  } catch (error) {
    console.error("Server Error:", error);
    res.status(500).json({ reply: "آسف، حدث خطأ في النظام أو الموديل مشغول حالياً." });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
