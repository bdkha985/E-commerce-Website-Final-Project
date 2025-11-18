const crypto = require("crypto");
const moment = require("moment");
const qs = require("qs");

function normalizeValue(v) {
    if (v === null || v === undefined) return "";
    // ensure string, trim, no thousands separators
    let s = String(v).trim();
    // remove comma separators if any (e.g. "1,000")
    s = s.replace(/,/g, "");
    return s;
}

function buildSignString(params) {
    // Build exactly: key1=value1&key2=value2 ... with values encoded by encodeURIComponent then %20 -> +
    const pairs = [];
    const keys = Object.keys(params).sort();
    for (const k of keys) {
        const v = normalizeValue(params[k]);
        // encode value the same way VNPAY expects
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

    // Ensure total is a Number and round to integer of VND*100
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

    // Build sign string using deterministic encoding
    const signData = buildSignString(vnp_Params);

    // Logging for debug (remove/comment in production)
    // console.log("VNPAY signData:", signData);
    // console.log("VNPAY amount (vnp_Amount):", vnp_Params.vnp_Amount);

    const hmac = crypto.createHmac("sha512", secretKey);
    const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

    vnp_Params["vnp_SecureHash"] = signed;

    // Build URL: use same encoding for query string as in sign (encodeURIComponent with %20->+)
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
    // console.log(
    //     "VNPAY finalUrl (first 200 chars):",
    //     finalUrl.substring(0, 200)
    // );
    return finalUrl;
}

function verifyReturnUrl(vnp_ParamsIn) {
    const secretKey = process.env.VNP_HASHSECRET;
    // Make a shallow copy so we don't mutate original
    const vnp_Params = Object.assign({}, vnp_ParamsIn);

    const secureHash =
        vnp_Params["vnp_SecureHash"] ||
        vnp_Params["vnp_SecureHash".toLowerCase()];
    // delete hash fields
    delete vnp_Params["vnp_SecureHash"];
    delete vnp_Params["vnp_SecureHashType"];

    // Build signData in same deterministic way
    const signData = buildSignString(vnp_Params);

    // Logging for debug
    // console.log("VNPAY verify signData:", signData);
    // console.log("VNPAY incoming secureHash:", secureHash);

    const hmac = crypto.createHmac("sha512", secretKey);
    const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

    // console.log("VNPAY computed signed:", signed);

    // compare ignoring case
    return (secureHash || "").toLowerCase() === (signed || "").toLowerCase();
}

module.exports = {
    createPaymentUrl,
    verifyReturnUrl,
};
