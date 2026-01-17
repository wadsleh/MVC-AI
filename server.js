const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
// ✅ ضروري جداً: زيادة حجم البيانات المسموح بها لاستقبال الصور
app.use(express.json({ limit: '50mb' })); 
app.use(express.static('public'));

const GROQ_API_KEY = process.env.MURTA;

app.post('/api/chat', async (req, res) => {
  const { message, image, language } = req.body;

  try {
    let userContent = [];
    
    // إذا كان هناك نص (أو محتوى ملف نصي تم دمجه في الرسالة)
    if (message) {
        userContent.push({ type: "text", text: message });
    } else {
        // إذا رفع صورة بدون كلام، نضع نصاً افتراضياً ليقوم الموديل بالشرح
        userContent.push({ type: "text", text: "Describe this content / اشرح هذا المحتوى" });
    }

    // تحديد الموديل المناسب
    let selectedModel = "llama-3.3-70b-versatile"; // الموديل الافتراضي للنصوص

    // ✅ إذا تم إرسال صورة، نستخدم موديل الرؤية (Vision)
    if (image) {
        userContent.push({
            type: "image_url",
            image_url: { url: image }
        });
        selectedModel = "llama-3.2-90b-vision-preview"; 
    }

    // تعليمات النظام
    const systemInstruction = language === 'ar-SA' 
        ? "أنت MVC AI، مساعد ذكي. رد باللغة العربية. إذا أرسل المستخدم كوداً أو صورة، قم بتحليلها وشرحها."
        : "You are MVC AI. Reply in English. Analyze any images or code provided.";

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
    
    if (data.error) throw new Error(data.error.message);
    res.json({ reply: data.choices[0].message.content });

  } catch (error) {
    console.error("Server Error:", error);
    res.status(500).json({ reply: "عذراً، حدث خطأ أثناء المعالجة (تأكد أن حجم الصورة ليس ضخماً جداً)." });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
