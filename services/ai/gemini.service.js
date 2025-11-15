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

module.exports = { runConversation };