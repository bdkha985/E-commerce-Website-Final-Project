// services/ai/gemini.service.js
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { searchProducts } = require('../search/elastic.service');
const Order = require('../../models/order.model');
const User = require('../../models/user.model');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 1. Định nghĩa các "công cụ" (functions)
const tools = [
    {
        functionDeclarations: [
            {
                name: "findProducts",
                description: "Tìm kiếm sản phẩm dựa trên mô tả hoặc tên. Dùng khi khách hàng hỏi về sản phẩm (vd: 'áo thun', 'giày sneaker').",
                parameters: { type: "OBJECT", properties: { query: { type: "STRING" } }, required: ["query"] },
            },
            {
                name: "getOrderStatus",
                // === SỬA LỖI 1: Sửa ví dụ ===
                description: "Lấy thông tin và trạng thái của một đơn hàng cụ thể. Dùng khi khách hỏi 'đơn hàng của tôi đâu?', 'check đơn KSHOP-123456'.",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        orderCode: { type: "STRING", description: "Mã đơn hàng đầy đủ, phải bao gồm tiền tố 'KSHOP-'. Ví dụ: 'KSHOP-987654'" }
                    },
                    required: ["orderCode"]
                },
            },
        ],
    },
];

const model = genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash",
    // model: "gemini-flash-latest",
    tools: tools
});

// 2. System Prompt (Linh hồn của Chatbot)
const systemPrompt = `
    Bạn là "K Shopping Assistant", một trợ lý AI bán hàng thân thiện, thông minh và chuyên nghiệp của shop thời trang K Shopping.
    Nhiệm vụ của bạn là trả lời câu hỏi của khách hàng.

    QUY TẮC:
    1. Luôn luôn trả lời bằng tiếng Việt.
    2. Khi khách hàng hỏi về sản phẩm, hãy SỬ DỤNG công cụ 'findProducts'.
    3. Khi khách hàng hỏi về đơn hàng, hãy SỬ DỤNG công cụ 'getOrderStatus'.
    
    // === SỬA LỖI 2: Thêm quy tắc xử lý mã đơn hàng ===
    4. QUAN TRỌNG: Mã đơn hàng của shop luôn có dạng 'KSHOP-' (ví dụ: KSHOP-123456). Nếu khách hàng chỉ cung cấp số (ví dụ: 'đơn 123456'), HÃY HỎI LẠI khách hàng mã đơn hàng đầy đủ, vì bạn không thể tìm kiếm nếu thiếu tiền tố 'KSHOP-'.
    
    5. Nếu câu hỏi không liên quan (chính trị, thời tiết...), hãy lịch sự từ chối.
    6. Nếu khách hàng chỉ chào hỏi, hãy chào lại một cách thân thiện.
`;

/**
 * Xử lý cuộc hội thoại
 */
async function runConversation(message, history, userId) {
    
    const chat = model.startChat({
        history: [
            { role: "user", parts: [{ text: "Hãy bắt đầu" }] },
            { role: "model", parts: [{ text: systemPrompt }] },
            ...history
        ],
    });

    let result = await chat.sendMessage(message);
    
    while (true) {
        const responsePart = result.response.candidates[0].content.parts[0];

        if (responsePart.functionCall) {
            const call = responsePart.functionCall;
            const args = call.args;
            console.log(`[Chatbot] AI yêu cầu gọi hàm: ${call.name}`);

            let functionResponse;
            try {
                switch (call.name) {
                    case "findProducts":
                        const products = await searchProducts(args.query);
                        functionResponse = products.length 
                            ? products.slice(0, 5) 
                            : { error: "Không tìm thấy sản phẩm." };
                        break;
                    
                    case "getOrderStatus":
                        if (!userId) { 
                           functionResponse = { error: "Bạn cần đăng nhập để xem đơn hàng." };
                           break;
                        }
                        
                        // (Logic tìm kiếm đơn hàng của bạn đã chính xác, giữ nguyên)
                        const user = await User.findById(userId).select('email').lean();
                        if (!user) {
                            functionResponse = { error: "Lỗi: Không tìm thấy người dùng." };
                            break;
                        }
                        const order = await Order.findOne({ 
                                code: args.orderCode, // Code này phải là 'KSHOP-...'
                                $or: [ { userId: userId }, { email: user.email } ]
                            })
                            .select('status code total paymentStatus createdAt')
                            .lean();
                        
                        functionResponse = order || { error: "Không tìm thấy đơn hàng này (đảm bảo mã đơn hàng chính xác và thuộc tài khoản của bạn)." };
                        break;
                    
                    default:
                        functionResponse = { error: "Hàm không xác định" };
                }
            } catch (err) {
                functionResponse = { error: `Lỗi khi thực thi hàm: ${err.message}` };
            }
            
            result = await chat.sendMessage(JSON.stringify(functionResponse));

        } else {
            // AI trả về text
            const finalReply = responsePart.text;
            return finalReply;
        }
    }
}

/**
 * Phân tích cảm xúc (Bản Nâng Cấp)
 * @param {string} text - Nội dung bình luận
 * @param {number} rating - Số sao đánh giá (để fallback)
 */
async function analyzeSentiment(text, rating) {
    // 1. Nếu không có text, dùng rating để phán đoán
    if (!text || text.length < 2) {
        if (rating >= 4) return 'Positive';
        if (rating <= 2) return 'Negative';
        return 'Neutral';
    }

    // 2. Prompt chặt chẽ hơn
    const prompt = `
        Phân tích cảm xúc của bình luận sản phẩm sau.
        Chỉ trả về ĐÚNG 1 từ duy nhất: "Positive" (khen/hài lòng), "Negative" (chê/thất vọng), hoặc "Neutral" (hỏi/trung tính).
        Không giải thích thêm.
        
        Bình luận: "${text}"
        Output:
    `;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const rawText = response.text().trim().toLowerCase();
        
        console.log(`[AI Sentiment] Input: "${text}" | Output: "${rawText}"`); // Log để debug

        // 3. Phân loại dựa trên AI
        if (rawText.includes('positive') || rawText.includes('tích cực')) return 'Positive';
        if (rawText.includes('negative') || rawText.includes('tiêu cực')) return 'Negative';
        
        // 4. Nếu AI bảo Neutral (hoặc trả lời lung tung), hãy nhìn vào Rating để sửa sai!
        // (Đây là bước tối ưu quan trọng)
        if (rating) {
            if (rating <= 2) return 'Negative'; // Chửi nhẹ mà 1 sao thì là Negative
            if (rating >= 5) return 'Positive'; // Khen nhẹ mà 5 sao thì là Positive
        }

        return 'Neutral';

    } catch (err) {
        console.error("Lỗi Sentiment Analysis:", err);
        // Fallback khi lỗi mạng
        if (rating >= 4) return 'Positive';
        if (rating <= 2) return 'Negative';
        return 'Neutral';
    }
}

/**
 * Tạo từ khóa tìm kiếm từ hình ảnh (Dùng Gemini Vision)
 * @param {Buffer} imageBuffer - Buffer của file ảnh
 * @param {string} mimeType - Loại file (image/jpeg, image/png...)
 */
async function generateKeywordsFromImage(imageBuffer, mimeType) {
    // Model flash hỗ trợ cả text và image
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
        Bạn là một công cụ tìm kiếm thời trang. 
        Hãy nhìn vào hình ảnh sản phẩm này và trích xuất ra một cụm từ khóa tìm kiếm chính xác nhất bằng tiếng Việt (khoảng 2-5 từ).
        Tập trung vào: Loại sản phẩm, Màu sắc, Kiểu dáng, Thương hiệu (nếu rõ).
        Ví dụ: "áo thun nam trắng", "giày sneaker nike", "đầm hoa nhí".
        Chỉ trả về cụm từ khóa, không có dấu chấm câu hay lời dẫn.
    `;
    
    const imagePart = {
        inlineData: {
            data: imageBuffer.toString("base64"),
            mimeType
        },
    };

    try {
        const result = await model.generateContent([prompt, imagePart]);
        const response = await result.response;
        const text = response.text().trim();
        console.log(`[AI Vision] Ảnh -> Từ khóa: "${text}"`);
        return text;
    } catch (err) {
        console.error("Lỗi Gemini Vision:", err);
        return null;
    }
}

module.exports = { 
    runConversation,
    analyzeSentiment,
    generateKeywordsFromImage,
 };