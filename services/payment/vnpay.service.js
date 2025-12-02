const crypto = require("crypto");
const moment = require("moment");
const qs = require("qs");

function normalizeValue(v) {
    if (v === null || v === undefined) return "";
    let s = String(v).trim();
    s = s.replace(/,/g, "");
    return s;
}

function buildSignString(params) {
    const pairs = [];
    const keys = Object.keys(params).sort();
    for (const k of keys) {
        const v = normalizeValue(params[k]);
        const ev = encodeURIComponent(v).replace(/%20/g, "+");
        pairs.push(`${k}=${ev}`);
    }
    return pairs.join("&");
}

function createPaymentUrl(req, order) {
    const tmnCode = process.env.VNP_TMNCODE;
    const secretKey = process.env.VNP_HASHSECRET;
    let vnpUrl = process.env.VNP_URL;
    const returnUrl = process.env.VNP_RETURN_URL;

    const createDate = moment().format("YYYYMMDDHHmmss");
    const orderId = String(order.code);

    const totalNumber = Number(order.total);
    if (Number.isNaN(totalNumber)) {
        throw new Error("order.total is not a number");
    }
    const amount = Math.round(totalNumber * 100);

    const orderInfo = `Thanh toan don hang ${orderId}`;

    const vnp_Params = {
        vnp_Version: "2.1.0",
        vnp_Command: "pay",
        vnp_TmnCode: tmnCode,
        vnp_Locale: "vn",
        vnp_CurrCode: "VND",
        vnp_TxnRef: orderId,
        vnp_OrderInfo: orderInfo,
        vnp_OrderType: "other",
        vnp_Amount: String(amount),
        vnp_ReturnUrl: returnUrl,
        vnp_IpAddr: (req.ip || "").replace("::ffff:", ""),
        vnp_CreateDate: createDate,
    };

    const signData = buildSignString(vnp_Params);

    const hmac = crypto.createHmac("sha512", secretKey);
    const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

    vnp_Params["vnp_SecureHash"] = signed;

    const qsPairs = [];
    Object.keys(vnp_Params)
        .sort()
        .forEach((k) => {
            const ev = encodeURIComponent(String(vnp_Params[k] || "")).replace(
                /%20/g,
                "+"
            );
            qsPairs.push(`${k}=${ev}`);
        });
    const queryString = qsPairs.join("&");

    const finalUrl = `${vnpUrl}?${queryString}`;
    return finalUrl;
}

function verifyReturnUrl(vnp_ParamsIn) {
    const secretKey = process.env.VNP_HASHSECRET;
    const vnp_Params = Object.assign({}, vnp_ParamsIn);

    const secureHash =
        vnp_Params["vnp_SecureHash"] ||
        vnp_Params["vnp_SecureHash".toLowerCase()];
    delete vnp_Params["vnp_SecureHash"];
    delete vnp_Params["vnp_SecureHashType"];

    const signData = buildSignString(vnp_Params);
    const hmac = crypto.createHmac("sha512", secretKey);
    const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

    return (secureHash || "").toLowerCase() === (signed || "").toLowerCase();
}

module.exports = {
    createPaymentUrl,
    verifyReturnUrl,
};
