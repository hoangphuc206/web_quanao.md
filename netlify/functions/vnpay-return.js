// File: netlify/functions/vnpay-return.js

const crypto = require('crypto');
const querystring = require('querystring');

// --- Khai báo Biến Môi trường ---
const hashSecret = process.env.VNP_HASH_SECRET;

exports.handler = async (event) => {
    // VNPAY thường gửi kết quả bằng method GET
    if (event.httpMethod !== 'GET') {
        return {
            statusCode: 405,
            body: JSON.stringify({ RspCode: '99', Message: 'Method Not Allowed' })
        };
    }

    const vnp_Params = event.queryStringParameters;
    let secureHash = vnp_Params['vnp_SecureHash'];

    // --- 1. Loại bỏ SecureHash để kiểm tra tính toàn vẹn của dữ liệu ---
    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];
    
    // Sắp xếp các tham số theo thứ tự Alphabet
    const sortedParams = Object.keys(vnp_Params).sort().reduce((acc, key) => {
        acc[key] = vnp_Params[key];
        return acc;
    }, {});
    
    // Nối các tham số thành chuỗi raw
    const signData = querystring.stringify(sortedParams, { encode: false });
    
    // Tạo Secure Hash từ dữ liệu nhận được
    const hmac = crypto.createHmac("sha512", hashSecret);
    const calculatedHash = hmac.update(signData).digest("hex");
    
    // --- 2. Kiểm tra tính hợp lệ và xác nhận giao dịch ---
    
    if (secureHash === calculatedHash) {
        // Dữ liệu hợp lệ
        const responseCode = vnp_Params['vnp_ResponseCode'];
        const transactionStatus = vnp_Params['vnp_TransactionStatus'];
        const orderId = vnp_Params['vnp_TxnRef'];
        const amount = vnp_Params['vnp_Amount'] / 100; // Chia lại 100 để có số tiền thực

        if (responseCode === '00' && transactionStatus === '00') {
            // **THÀNH CÔNG**
            // TODO: Tìm đơn hàng (orderId) trong DB của bạn và cập nhật trạng thái là "Đã Thanh Toán"
            
            return {
                statusCode: 200,
                body: JSON.stringify({ RspCode: '00', Message: 'Success', orderId: orderId, amount: amount })
            };
        } else {
            // Giao dịch LỖI (TransactionStatus khác 00)
             // TODO: Cập nhật trạng thái đơn hàng (orderId) là "Thất Bại"
            return {
                statusCode: 200,
                body: JSON.stringify({ RspCode: '00', Message: 'Payment Failed', orderId: orderId, responseCode: responseCode })
            };
        }
    } else {
        // Dữ liệu KHÔNG HỢP LỆ (Bảo mật bị vi phạm)
        return {
            statusCode: 200,
            body: JSON.stringify({ RspCode: '97', Message: 'Invalid Signature' })
        };
    }
};
