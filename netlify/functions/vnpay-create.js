const { VNPay } = require('vnpay/vnpay');
const moment = require('moment'); 

// ------------------------------------------------------------------
// Lấy cấu hình từ Netlify Environment Variables
// ------------------------------------------------------------------
const tmnCode = process.env.VNP_TMNCODE;
const secureSecret = process.env.VNP_HASHSECRET;
// VNP_URL trong Netlify là 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html'
// VNPay library chỉ cần Host name: 'https://sandbox.vnpayment.vn'
const vnpayHost = process.env.VNP_URL ? process.env.VNP_URL.replace('/paymentv2/vpcpay.html', '') : ''; 
const returnUrl = process.env.VNP_RETURN_URL;

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
        const ipAddr = event.headers['x-forwarded-for'] || '';
        
        // Sử dụng hàm buildPaymentUrl của thư viện
        const paymentUrl = vnpay.buildPaymentUrl({
            vnp_Amount: amount * 1, // VNPAY yêu cầu giá trị tính bằng Cent
            vnp_IpAddr: ipAddr,
            vnp_ReturnUrl: returnUrl,
            vnp_TxnRef: orderId,
            vnp_OrderInfo: orderInfo || `Thanh toán đơn hàng ${orderId}`,
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
