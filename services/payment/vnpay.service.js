// services/payment/vnpay.service.js
const crypto = require('crypto');
const moment = require('moment');
const qs = require('qs'); // <-- Import qs

function sortObject(obj) {
	let sorted = {};
	let str = [];
	let key;
	for (key in obj){
		if (obj.hasOwnProperty(key)) {
		str.push(encodeURIComponent(key));
		}
	}
	str.sort();
    for (key = 0; key < str.length; key++) {
        sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
    }
    return sorted;
}

/**
 * Tạo URL thanh toán VNPAY (Giữ nguyên)
 */
function createPaymentUrl(req, order) {
    const tmnCode = process.env.VNP_TMNCODE;
    const secretKey = process.env.VNP_HASHSECRET;
    let vnpUrl = process.env.VNP_URL;
    const returnUrl = process.env.VNP_RETURN_URL;

    const createDate = moment(new Date()).format('YYYYMMDDHHmmss');
    const orderId = order.code; 
    const amount = order.total;
    const orderInfo = `Thanh toan don hang ${orderId}`;
    
    let vnp_Params = {};
    vnp_Params['vnp_Version'] = '2.1.0';
    vnp_Params['vnp_Command'] = 'pay';
    vnp_Params['vnp_TmnCode'] = tmnCode;
    vnp_Params['vnp_Locale'] = 'vn';
    vnp_Params['vnp_CurrCode'] = 'VND';
    vnp_Params['vnp_TxnRef'] = orderId;
    vnp_Params['vnp_OrderInfo'] = orderInfo;
    vnp_Params['vnp_OrderType'] = 'other';
    vnp_Params['vnp_Amount'] = amount * 100;
    vnp_Params['vnp_ReturnUrl'] = returnUrl;
    vnp_Params['vnp_IpAddr'] = req.ip.replace('::ffff:', '');
    vnp_Params['vnp_CreateDate'] = createDate;
    
    vnp_Params = sortObject(vnp_Params);
    
    const signData = qs.stringify(vnp_Params, { encode: false }); // <-- Dùng qs
    const hmac = crypto.createHmac("sha512", secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex"); 
    
    vnp_Params['vnp_SecureHash'] = signed;
    vnpUrl += '?' + qs.stringify(vnp_Params, { encode: false }); // <-- Dùng qs
    
    return vnpUrl;
}

// === THÊM HÀM MỚI NÀY VÀO ===
/**
 * Xác thực chữ ký VNPAY trả về
 */
function verifyReturnUrl(vnp_Params) {
    const secretKey = process.env.VNP_HASHSECRET;
    const secureHash = vnp_Params['vnp_SecureHash'];

    // Xóa 2 trường hash ra khỏi params
    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];

    // Sắp xếp và stringify
    const sortedParams = sortObject(vnp_Params);
    const signData = qs.stringify(sortedParams, { encode: false });
    
    // Tạo hash
    const hmac = crypto.createHmac("sha512", secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex"); 

    // So sánh
    return secureHash === signed;
}
// === KẾT THÚC HÀM MỚI ===

module.exports = {
    createPaymentUrl,
    verifyReturnUrl // <-- Export hàm mới
};