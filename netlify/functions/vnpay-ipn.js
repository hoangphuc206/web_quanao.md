const { VNPay } = require('vnpay/vnpay');
// const moment = require('moment'); // Giữ lại nếu cần cho logic khác

// Lấy cấu hình từ Netlify Environment Variables
const tmnCode = process.env.VNP_TMNCODE;
const secureSecret = process.env.VNP_HASHSECRET;
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
    // ⚠️ LƯU Ý: VNPAY có thể dùng GET hoặc POST cho IPN, nhưng hầu hết là GET cho Return URL
    // Ta không cần kiểm tra httpMethod nữa, mà sẽ dùng header để phân biệt.
    
    // Kiểm tra khởi tạo
    if (!vnpay) {
        // Trả về lỗi theo chuẩn VNPAY để Server VNPAY hiểu
        return { statusCode: 500, body: JSON.stringify({ RspCode: '99', Message: 'System initialization error' }) };
    }

    try {
        const query = event.queryStringParameters;
        
        // Kiểm tra xem yêu cầu này có phải là từ VNPAY Server (IPN) hay không.
        // IPN thường không có User-Agent của trình duyệt thông thường.
        // Cách đơn giản nhất là giả định nếu nó không có header 'sec-fetch-dest' 
        // hoặc các header liên quan đến trình duyệt, thì đó là server-to-server.
        // 🚨 CÁCH TỐT HƠN: Dùng header 'User-Agent' để xác định VNPAY IPN (nếu VNPAY cung cấp)
        const isServerRequest = !event.headers['sec-fetch-dest'];

        // Lấy URL gốc của website (ví dụ: https://23dh.netlify.app/)
        const siteUrl = event.headers.host ? `https://${event.headers.host}` : 'https://cheery-tapioca-04ea65.netlify.app/';

        // Sử dụng hàm verifyReturnUrl của thư viện để xác thực cả IPN
        const verify = vnpay.verifyReturnUrl(query); 
        
        if (verify.isSuccess) {
            // Giao dịch hợp lệ (Hash đúng)
            
            if (query.vnp_ResponseCode === '00' && query.vnp_TransactionStatus === '00') {
                
                // 1. 🚨 Xử lý Logic nghiệp vụ tại đây (CẬP NHẬT TRẠNG THÁI ĐƠN HÀNG VÀO DATABASE)
                // Ví dụ: await updateOrder(query.vnp_TxnRef, 'SUCCESS', query.vnp_Amount / 100);
                
                // 2. Phản hồi cho VNPAY Server (IPN)
                if (isServerRequest) {
                    return { 
                        statusCode: 200, 
                        body: JSON.stringify({ RspCode: '00', Message: 'Confirm Success' }) 
                    };
                }
                
                // 3. Chuyển hướng cho Trình duyệt (RETURN)
                return {
                    statusCode: 302, // Mã chuyển hướng (Redirect)
                    headers: {
                        'Location': `${siteUrl}/ketqua.html?status=success&orderId=${query.vnp_TxnRef}&amount=${query.vnp_Amount / 100}`,
                    },
                    body: ''
                };
            } else {
                // Giao dịch thất bại (Hash đúng nhưng ngân hàng từ chối)

                // 🚨 Xử lý Logic nghiệp vụ tại đây (CẬP NHẬT TRẠNG THÁI ĐƠN HÀNG VÀO DATABASE: FAILED)
                
                // Phản hồi cho VNPAY Server (IPN) nếu là lỗi
                if (isServerRequest) {
                    return { 
                        statusCode: 200, 
                        body: JSON.stringify({ RspCode: '00', Message: 'Confirm Success' }) 
                    };
                }
                
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
            
            // Phản hồi lỗi cho VNPAY Server (IPN)
            if (isServerRequest) {
                return { 
                    statusCode: 200, 
                    body: JSON.stringify({ RspCode: '97', Message: 'Invalid Checksum' }) 
                };
            }
            
            return {
                statusCode: 302,
                headers: {
                    'Location': `${siteUrl}/ketqua.html?status=hash_error`,
