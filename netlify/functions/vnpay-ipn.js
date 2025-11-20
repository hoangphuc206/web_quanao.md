const { VNPay } = require('vnpay/vnpay');

// Lấy cấu hình từ Netlify Environment Variables
const tmnCode = process.env.VNP_TMNCODE;
const secureSecret = process.env.VNP_HASHSECRET;
// Lấy Host name từ VNP_URL, ví dụ: https://sandbox.vnpayment.vn
const vnpayHost = process.env.VNP_URL ? process.env.VNP_URL.replace('/paymentv2/vpcpay.html', '') : ''; 

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
    console.error("VNPAY IPN INITIALIZATION ERROR:", error);
}

// Hàm xử lý chính
exports.handler = async (event) => {
    // 1. Kiểm tra phương thức HTTP
    if (event.httpMethod !== 'GET') {
        // Chỉ trả về JSON cho các phương thức không phải GET (chủ yếu là IPN server-to-server)
        return { statusCode: 405, body: "Method Not Allowed" };
    }
    
    // Kiểm tra khởi tạo
    if (!vnpay) {
        return { statusCode: 500, body: JSON.stringify({ RspCode: '99', Message: 'System initialization error' }) };
    }

    try {
        const query = event.queryStringParameters;
        
  
        // Dùng header.host để lấy domain hiện tại
        const siteUrl = event.headers.host ? `https://${event.headers.host}` : 'https://cheery-tapioca-04ea65.netlify.app/';

        // Sử dụng hàm verifyReturnUrl của thư viện để xác thực cả IPN
        const verify = vnpay.verifyReturnUrl(query); 
        
        // Phản hồi cho VNPAY Server (IPN) và Chuyển hướng cho Trình duyệt (RETURN)

        if (verify.isSuccess) {
            
            // Giao dịch hợp lệ (Hash đúng)
            
            if (query.vnp_ResponseCode === '00') {
                // Giao dịch thành công, chuyển hướng người dùng đến trang kết quả
                return {
                    statusCode: 302, // Mã chuyển hướng (Redirect)
                    headers: {
                        // Chuyển hướng đến ketqua.html và đính kèm thông tin
                        'Location': `${siteUrl}/ketqua.html?status=success&orderId=${query.vnp_TxnRef}&amount=${query.vnp_Amount / 100}`,
                    },
                    body: '' // Body rỗng cho redirect
                };
            } else {
                // Giao dịch thất bại (Hash đúng nhưng ngân hàng từ chối)
                return {
                    statusCode: 302,
                    headers: {
                        'Location': `${siteUrl}/ketqua.html?status=failed&orderId=${query.vnp_TxnRef}&message=Giao dịch bị từ chối`,
                    },
                    body: ''
                };
            }
        } else {
            // Hash sai (Lỗi bảo mật/chữ ký)
            return {
                statusCode: 302,
                headers: {
                    'Location': `${siteUrl}/ketqua.html?status=hash_error`,
                },
                body: ''
            };
        }

    } catch (error) {
        console.error("VNPAY IPN ERROR:", error);
        return { statusCode: 500, body: JSON.stringify({ RspCode: '99', Message: 'System error' }) };
    }
};
