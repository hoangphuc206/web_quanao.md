// Thư viện cần thiết cho VNPAY
const moment = require('moment-timezone'); // Dùng để định dạng thời gian
const crypto = require('crypto');
const querystring = require('querystring');
const { URL } = require('url');

// Khai báo các biến từ Netlify Environment Variables
const tmnCode = process.env.VNP_TMN_CODE;
const hashSecret = process.env.VNP_HASH_SECRET;
const vnpUrl = process.env.VNP_URL;
const returnUrl = process.env.VNP_RETURN_URL;

exports.handler = async (event) => {
    // 1. Chỉ chấp nhận phương thức POST
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ message: "Method Not Allowed" })
        };
    }

    // 2. Lấy dữ liệu từ body (amount, orderId, bankCode...)
    let bodyData;
    try {
        bodyData = JSON.parse(event.body);
    } catch (e) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: "Invalid JSON body" })
        };
    }

    const { amount, orderId, orderInfo, locale } = bodyData; 
    
    // Kiểm tra dữ liệu bắt buộc
    if (!amount || !orderId || !orderInfo) {
         return {
            statusCode: 400,
            body: JSON.stringify({ message: "Missing required fields: amount, orderId, or orderInfo" })
        };
    }
    
    // 3. Chuẩn bị các tham số VNPAY
    const vnp_Params = {};
    vnp_Params['vnp_Version'] = '2.1.0';
    vnp_Params['vnp_Command'] = 'pay'; // Lệnh mặc định là pay
    vnp_Params['vnp_TmnCode'] = tmnCode;
    vnp_Params['vnp_Amount'] = amount * 100; // VNPAY tính bằng đơn vị 'cent', nên nhân 100
    vnp_Params['vnp_CurrCode'] = 'VND';
    vnp_Params['vnp_TxnRef'] = orderId;
    vnp_Params['vnp_OrderInfo'] = orderInfo;
    vnp_Params['vnp_OrderType'] = 'other'; // Loại hàng hóa (bán hàng online)
    vnp_Params['vnp_Locale'] = locale || 'vn'; // Ngôn ngữ (vn/en)
    vnp_Params['vnp_ReturnUrl'] = returnUrl;
    
    // Lấy ngày giờ hiện tại theo múi giờ Việt Nam
    vnp_Params['vnp_CreateDate'] = moment().tz('Asia/Ho_Chi_Minh').format('YYYYMMDDHHmmss');
    
    // Lấy IP của client (nếu có thể)
    vnp_Params['vnp_IpAddr'] = event.headers['client-ip'] || event.headers['x-forwarded-for'] || '127.0.0.1';

    // 4. Sắp xếp và Tạo Chuỗi Hash (Secure Hash)
    
    // Sắp xếp các tham số theo thứ tự Alphabet
    const sortedParams = Object.keys(vnp_Params).sort().reduce((acc, key) => {
        acc[key] = vnp_Params[key];
        return acc;
    }, {});
    
    // Nối các tham số thành chuỗi raw
    const signData = querystring.stringify(sortedParams, { encode: false });
    
    // Tạo Secure Hash
    const hmac = crypto.createHmac("sha512", hashSecret);
    const secureHash = hmac.update(signData).digest("hex");
    
    // 5. Tạo URL Thanh toán
    const paymentUrl = vnpUrl + '?' + querystring.stringify(sortedParams) + '&vnp_SecureHash=' + secureHash;

    // 6. Trả về URL cho Frontend
    try {
        return {
            statusCode: 200,
            body: JSON.stringify({ paymentUrl: paymentUrl })
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Error processing VNPAY URL", error: error.message })
        };
    }
};
