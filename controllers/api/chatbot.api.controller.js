// controllers/api/chatbot.api.controller.js
const { runConversation } = require("../../services/ai/gemini.service");

const handleQuery = async (req, res) => {
    try {
        const message = (req.body.message || "").trim();
        const userId = req.user?._id || req.session?.userId || null;

        // 1. Khởi tạo hoặc lấy lịch sử chat từ session
        if (!req.session.chatHistory) {
            req.session.chatHistory = [];
        }

        // 2. Chạy logic AI
        const aiReply = await runConversation(
            message,
            req.session.chatHistory,
            userId
        );

        // 3. Cập nhật lịch sử chat trong session
        req.session.chatHistory.push({
            role: "user",
            parts: [{ text: message }],
        });
        req.session.chatHistory.push({
            role: "model",
            parts: [{ text: aiReply }],
        });
        req.session.chatHistory = req.session.chatHistory.slice(-10);

        // 4. Trả lời frontend
        res.json({ ok: true, reply: aiReply });
    } catch (err) {
        console.error("Lỗi Chatbot API:", err);
        res.status(500).json({ ok: false, reply: "Lỗi máy chủ chatbot." });
    }
};

module.exports = { handleQuery };
