const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' })); // زيادة الحد المسموح لرفع الصور
app.use(express.static('public'));

const GROQ_API_KEY = process.env.MURTA;

app.post('/api/chat', async (req, res) => {
  const { message, image, language } = req.body;

  try {
    let messagesContent = [];
    let selectedModel = "llama-3.3-70b-versatile"; // الموديل الافتراضي للنصوص

    // إعداد رسالة النظام حسب اللغة
    const systemInstruction = language === 'ar-SA' 
        ? "أنت MVC AI، مساعد ذكي. رد باللغة العربية دائماً. إذا تم إرسال صورة، قم بتحليلها ووصفها بدقة."
        : "You are MVC AI, a smart assistant. Reply in English. If an image is provided, analyze and describe it.";

    // تجهيز محتوى الرسالة
    let userContent = [{ type: "text", text: message || "Describe this image" }];

    // ✅ إذا وجدنا صورة، نغير الموديل إلى موديل الرؤية ونضيف الصورة
    if (image) {
        userContent.push({
            type: "image_url",
            image_url: { url: image }
        });
        // استخدام موديل Vision القوي
        selectedModel = "llama-3.2-90b-vision-preview"; 
    }

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
            model: selectedModel,
            temperature: 0.7
        })
    });

    const data = await response.json();
    
    // معالجة الأخطاء المحتملة من Groq
    if (data.error) {
        console.error("Groq Error:", data.error);
        throw new Error(data.error.message);
    }
    
    res.json({ reply: data.choices[0].message.content });

  } catch (error) {
    console.error("Server Error:", error);
    res.status(500).json({ reply: "عذراً، حدث خطأ أثناء معالجة الطلب (أو أن موديل الصور مشغول حالياً)." });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
