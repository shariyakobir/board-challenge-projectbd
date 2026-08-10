const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

// CORS সেটআপ
app.use(cors({ origin: '*' }));
app.options('*', cors());
app.use(express.json());

// ===== আপনার টেলিগ্রাম তথ্য (আপনি দেওয়া) =====
const BOT_TOKEN = '8877012481:AAEHi3hFN0fqac0p8nap_7Jl7z2Wpw1MkHI';
const CHAT_ID = '8214404377';

const boardCodeMap = {
    dhaka: 'DHA', rajshahi: 'RAJ', cumilla: 'COM', jashore: 'JES',
    chattogram: 'CHI', barishal: 'BAR', sylhet: 'SYL', dinajpur: 'DIN',
    mymensingh: 'MYM', madrasah: 'MAD', technical: 'TEC'
};

async function sendTelegramMessage(data) {
    const { board, name, roll, registration, phone, subjects, totalFee, paymentMethod, transactionId } = data;

    const subjectList = subjects.map(s => {
        const parts = s.split('|');
        return `${parts[0]} - ${parts[1]}`;
    }).join(', ');
    const subjectCodes = subjects.map(s => s.split('|')[0]).join(',');
    const boardCode = boardCodeMap[board] || board.toUpperCase();

    let firstSms = '';
    if (board === 'technical') firstSms = `SSC TEC ${roll} 2026 ${subjectCodes}`;
    else if (board === 'madrasah') firstSms = `Dakhil MAD ${roll} 2026 ${subjectCodes}`;
    else firstSms = `SSC ${boardCode} ${roll} 2026 ${subjectCodes}`;

    const secondSms = `${boardCode} YES [PIN] ${phone}`;

    const fullMessage = `
📌 **বোর্ড চ্যালেঞ্জ - নতুন আবেদন**

🎓 **বোর্ড:** ${board}
👤 **নাম:** ${name}
🔢 **রোল:** ${roll}
📋 **রেজি:** ${registration}
📱 **ফোন:** ${phone}

📚 **সাবজেক্ট:** ${subjectList}
💰 **মোট ফি:** ${totalFee} টাকা

💳 **পেমেন্ট মেথড:** ${paymentMethod}
🧾 **ট্রানজেকশন আইডি:** ${transactionId}

⏰ সময়: ${new Date().toLocaleString('bn-BD', { timeZone: 'Asia/Dhaka' })}

─────────────────────
📱 **SMS টেমপ্লেট (কপি করে পাঠান)**

🔹 **প্রথম SMS (আবেদন):**
\`${firstSms}\`
পাঠান: **16222** বা **16140**

🔹 **দ্বিতীয় SMS (কনফার্মেশন):**
\`${secondSms}\`
(উপরের SMS-এর জবাবে বোর্ড থেকে PIN আসবে)

📌 **বোর্ড কোড:** ${boardCode}
    `;

    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: CHAT_ID,
            text: fullMessage,
            parse_mode: 'Markdown'
        })
    });

    if (!response.ok) {
        const err = await response.json();
        throw new Error(`Telegram API error: ${err.description}`);
    }
    return response.json();
}

app.post('/api/submit', async (req, res) => {
    console.log("✅ রিকোয়েস্ট এসেছে!");
    try {
        const data = req.body;
        const required = ['board', 'name', 'roll', 'registration', 'phone', 'subjects', 'totalFee', 'paymentMethod', 'transactionId'];
        for (let field of required) {
            if (!data[field]) {
                return res.status(400).json({ success: false, message: `'${field}' খালি` });
            }
        }
        await sendTelegramMessage(data);
        res.status(200).json({ success: true, message: 'আবেদন সফল' });
    } catch (error) {
        console.error("❌ এরর:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

app.listen(PORT, () => console.log(`🚀 ব্যাকএন্ড চলছে: ${PORT}`));