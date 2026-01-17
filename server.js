const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' })); // لدعم الصور
app.use(express.static('public'));

const GROQ_API_KEY = process.env.MURTA;

app.post('/api/chat', async (req, res) => {
  try {
    const { message, image } = req.body;
    
    // تجهيز الرسالة
    let userContent = [{ type: "text", text: message }];
    if (image) {
        userContent.push({ type: "image_url", image_url: { url: image } });
    }

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${GROQ_API_KEY}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            messages: [
                { role: "system", content: "You are MVC AI. Helpful assistant." },
                { role: "user", content: userContent }
            ],
            // موديل الصور السريع والمتاح حالياً
            model: "llama-3.2-11b-vision-preview",
            temperature: 0.7
        })
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    
    res.json({ reply: data.choices[0].message.content });

  } catch (error) {
    console.error(error);
    res.status(500).json({ reply: "حدث خطأ في الاتصال بالسيرفر." });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
