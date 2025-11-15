// File: netlify/functions/vnpay-create.js

const moment = require('moment-timezone'); 
const crypto = require('crypto');
const querystring = require('querystring');

// --- Khai báo Biến Môi trường ---
const tmnCode = process.env.VNP_TMN_CODE;
const hashSecret = process.env.VNP_HASH_SECRET;
const vnpUrl = process.env.VNP_URL; // URL API của VNPAY
const returnUrl = process.env.VNP_RETURN_URL; // URL trả về (sẽ là netlify function vnpay-return.js)

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ message: "Method Not Allowed" })
        };
    }

    let bodyData;
    try {
        bodyData = JSON.parse(event.body);
    } catch (e) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: "Invalid JSON body" })
        };
    }

    // Lấy dữ liệu cần thiết từ frontend
    const { amount, orderId, orderInfo, locale } = bodyData; 
    
    if (!amount || !orderId || !orderInfo) {
         return {
            statusCode: 400,
            body: JSON.stringify({ message: "Missing required fields: amount, orderId, or orderInfo" })
        };
    }
    
    // --- 1. Chuẩn bị các tham số VNPAY ---
    const vnp_Params = {};
    vnp_Params['vnp_Version'] = '2.1.0';
    vnp_Params['vnp_Command'] = 'pay'; 
    vnp_Params['vnp_TmnCode'] = tmnCode;
    vnp_Params['vnp_Amount'] = amount * 100; // Nhân 100 vì VNPAY tính bằng 'cent'
    vnp_Params['vnp_CurrCode'] = 'VND';
    vnp_Params['vnp_TxnRef'] = orderId; // Mã đơn hàng duy nhất
    vnp_Params['vnp_OrderInfo'] = orderInfo;
    vnp_Params['vnp_OrderType'] = 'other'; 
    vnp_Params['vnp_Locale'] = locale || 'vn'; 
    vnp_Params['vnp_ReturnUrl'] = returnUrl;
    
    // Ngày giờ tạo giao dịch theo múi giờ Việt Nam
    const createDate = moment().tz('Asia/Ho_Chi_Minh').format('YYYYMMDDHHmmss');
    vnp_Params['vnp_CreateDate'] = createDate;
    
    // Lấy IP của client
    vnp_Params['vnp_IpAddr'] = event.headers['client-ip'] || event.headers['x-forwarded-for'] || '127.0.0.1';

    // --- 2. Sắp xếp và Tạo Chuỗi Hash (Secure Hash) ---
    
    // Sắp xếp các tham số theo thứ tự Alphabet
    const sortedParams = Object.keys(vnp_Params).sort().reduce((acc, key) => {
        acc[key] = vnp_Params[key];
        return acc;
    }, {});
    
    // Nối các tham số thành chuỗi raw
    const signData = querystring.stringify(sortedParams, { encode: false });
    
    // Tạo Secure Hash bằng thuật toán SHA-512
    const hmac = crypto.createHmac("sha512", hashSecret);
    const secureHash = hmac.update(signData).digest("hex");
    
    // --- 3. Tạo URL Thanh toán và trả về ---
    const paymentUrl = vnpUrl + '?' + querystring.stringify(sortedParams) + '&vnp_SecureHash=' + secureHash;

    return {
        statusCode: 200,
        body: JSON.stringify({ paymentUrl: paymentUrl })
    };
};
