const { VNPay } = require('vnpay/vnpay');
const moment = require('moment'); // (Không dùng nhưng giữ lại)

// ------------------------------------------------------------------
// Lấy cấu hình từ Netlify Environment Variables
// ------------------------------------------------------------------
const tmnCode = process.env.VNP_TMNCODE;
const secureSecret = process.env.VNP_HASHSECRET;
// VNP_URL là 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html'
const vnpayHost = process.env.VNP_URL ? process.env.VNP_URL.replace('/paymentv2/vpcpay.html', '') : ''; 
// 🚨 LƯU Ý: Biến returnUrl tĩnh bị loại bỏ để dùng URL động

let vnpay;
try {
    // Khởi tạo VNPay
    vnpay = new VNPay({
        tmnCode: tmnCode,
        secureSecret: secureSecret,
        vnpayHost: vnpayHost, 
        testMode: true, 
    });
} catch (error) {
    console.error("VNPAY INITIALIZATION ERROR:", error);
}

// HÀM XỬ LÝ CHÍNH CỦA NETLIFY FUNCTION
exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    // Kiểm tra khởi tạo
    if (!vnpay) {
        return { statusCode: 500, body: JSON.stringify({ message: "VNPAY initialization failed. Check ENV variables." }) };
    }

    try {
        const { amount, orderId, orderInfo } = JSON.parse(event.body);
        const ipAddr = event.headers['x-forwarded-for'] || '127.0.0.1'; // Dùng IP mặc định nếu không có
        
        // 🚨 Tự động xây dựng Return URL
        // Đảm bảo URL này trỏ đến file vnpay-ipn.js của bạn
        const siteDomain = event.headers.host;
        if (!siteDomain) {
            console.error("Site domain not found in headers.");
            return { statusCode: 500, body: JSON.stringify({ message: "Site domain could not be determined." }) };
        }
        
        const siteUrl = `https://${siteDomain}`;
        const dynamicReturnUrl = `${siteUrl}/.netlify/functions/vnpay-ipn`; // ⬅️ Dùng URL động

        // Sử dụng hàm buildPaymentUrl của thư viện
        const paymentUrl = vnpay.buildPaymentUrl({
            // 🚨 SỬA: Đảm bảo amount là VNĐ. Nếu vẫn lỗi, thử amount * 100
            vnp_Amount: amount, 
            vnp_IpAddr: ipAddr,
            // 🚨 SỬA: Thay thế returnUrl tĩnh bằng dynamicReturnUrl
            vnp_ReturnUrl: dynamicReturnUrl, 
            vnp_TxnRef: orderId,
            vnp_OrderInfo: orderInfo || `Thanh toán đơn hàng ${orderId}`,
            vnp_Locale: 'vn', // Thêm ngôn ngữ
            vnp_CurrCode: 'VND', // Thêm đơn vị tiền tệ
            vnp_Command: 'pay', // Thêm command
        });

        // Trả về URL cho Frontend
        return {
            statusCode: 200,
            body: JSON.stringify({ vnpUrl: paymentUrl }),
        };

    } catch (error) {
        console.error("VNPAY CREATE ERROR (LIB):", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Lỗi tạo URL VNPAY bằng thư viện.", error: error.message }),
        };
    }
};
