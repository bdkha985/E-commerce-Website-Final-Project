// public/javascripts/chatbot.js
document.addEventListener('DOMContentLoaded', () => {
    const chatBubble = document.getElementById('chatbot-bubble');
    const chatWindow = document.getElementById('chatbot-window');
    const closeBtn = document.getElementById('chatbot-close');
    const sendBtn = document.getElementById('chatbot-send');
    const textInput = document.getElementById('chatbot-input-text');
    const messagesContainer = document.getElementById('chatbot-messages');

    if (!chatBubble || !chatWindow) return;

    // --- 1. Logic Bật/Tắt Cửa sổ Chat ---
    chatBubble.addEventListener('click', () => {
        chatWindow.classList.add('active');
        chatBubble.style.display = 'none';
    });
    closeBtn.addEventListener('click', () => {
        chatWindow.classList.remove('active');
        chatBubble.style.display = 'flex';
    });

    // --- 2. NÂNG CẤP: Logic Gửi Tin nhắn (Gọi API AI) ---
    const handleSend = async () => { // Thêm async
        const message = textInput.value.trim();
        if (message === '') return;

        // 1. Hiển thị tin nhắn của User
        appendMessage('user', message);
        textInput.value = '';
        sendBtn.disabled = true; // Khóa nút gửi

        // 2. Thêm bong bóng loading
        const loadingBubble = appendMessage('bot', null); // Giữ tham chiếu đến bubble loading

        // 3. GỌI API BACKEND
        try {
            const res = await fetch('/api/chatbot/query', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: message })
            });
            const data = await res.json();
            
            // 4. Xóa loading và hiển thị trả lời
            loadingBubble.remove();
            appendMessage('bot', data.reply || "Xin lỗi, có lỗi xảy ra.");

        } catch (err) {
            // 5. Xử lý lỗi mạng
            loadingBubble.remove();
            appendMessage('bot', "Không thể kết nối đến trợ lý. Vui lòng thử lại.");
        } finally {
            sendBtn.disabled = false; // Mở lại nút gửi
            textInput.focus();
        }
    };

    textInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSend();
        }
    });
    sendBtn.addEventListener('click', handleSend);

    // --- 3. Hàm Helper để vẽ tin nhắn ---
    function appendMessage(sender, text) {
        let bubbleHtml;
        if (text === null) {
            bubbleHtml = `<div class="bubble"><div class="typing-indicator"><span></span><span></span><span></span></div></div>`;
        } else {
            // Đơn giản hóa: Chuyển đổi markdown cơ bản (như *bold*) sang HTML
            text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            bubbleHtml = `<div class="bubble">${text}</div>`;
        }
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${sender}`;
        messageDiv.innerHTML = bubbleHtml;

        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        return messageDiv; // Trả về element
    }
});