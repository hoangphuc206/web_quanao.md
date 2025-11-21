// FUNCTION SỬ DỤNG ĐỂ TẠO PAYURL MOMO CHO MÔI TRƯỜNG TRIỂN KHAI NETLIFY

const https = require('https');
const crypto = require('crypto');

// -----------------------------------------------------------------------------
// 1. CẤU HÌNH MOMO (Sử dụng biến môi trường là cách TỐT NHẤT)
// --------------------------------------------------------

// Các giá trị này PHẢI được lấy từ Netlify Environment Variables
const accessKey = process.env.MOMO_ACCESS_KEY;
const secretKey = process.env.MOMO_SECRET_KEY;
const partnerCode = process.env.MOMO_PARTNER_CODE;

// URL trả về và IPN
const redirectUrl = process.env.MOMO_REDIRECT_URL;
const ipnUrl = process.env.MOMO_IPN_URL; 


//--------------------------
// LƯU Ý: Nếu bạn dùng key Production, hãy thay thế host này bằng "payment.momo.vn"
const host = "test-payment.momo.vn"; // TEST HOST
const endpoint = "/v2/gateway/api/create";
const requestType = "payWithMethod";
const autoCapture = true;
const lang = 'vi';


// HÀM XỬ LÝ CHÍNH CỦA NETLIFY FUNCTION
exports.handler = async (event, context) => {
    
    // [DEBUG CHECK 1]: Kiểm tra các biến môi trường đã được tải chưa
    if (!accessKey || !secretKey || !partnerCode || !redirectUrl || !ipnUrl) {
        const missing = [];
        if (!accessKey) missing.push("MOMO_ACCESS_KEY");
        if (!secretKey) missing.push("MOMO_SECRET_KEY");
        if (!partnerCode) missing.push("MOMO_PARTNER_CODE");
        if (!redirectUrl) missing.push("MOMO_REDIRECT_URL");
        if (!ipnUrl) missing.push("MOMO_IPN_URL");

        console.error("Lỗi: Thiếu biến môi trường quan trọng:", missing.join(", "));
        return { 
            statusCode: 500, 
            body: JSON.stringify({ 
                error: "Internal Server Error: Missing required environment variables.",
                details: missing.join(", ") 
            }) 
        };
    }
    
    // 1. Chỉ chấp nhận phương thức POST
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ message: "Method Not Allowed" }) };
    }
    
    // 2. Lấy data từ body (dữ liệu gửi từ frontend)
    let bodyData;
    try {
        bodyData = JSON.parse(event.body);
    } catch (e) {
        return { statusCode: 400, body: JSON.stringify({ message: "Invalid JSON body" }) };
    }
    
    // Lấy thông tin orderId, amount từ frontend, nếu không có sẽ dùng giá trị mặc định
    const requestedAmount = bodyData.totalAmount;
    const amount = requestedAmount && requestedAmount > 0 ? requestedAmount : 50000;
    
    const orderInfo = bodyData.orderInfo || 'pay with MoMo Netlify Function'; 
    const orderId = bodyData.orderId || (partnerCode + new Date().getTime()); 
    
    const requestId = orderId;
    const extraData = ''; 
    
    // 3. Tạo raw signature string
    const rawSignature = 
        "accessKey=" + accessKey + 
        "&amount=" + amount + 
        "&extraData=" + extraData + 
        "&ipnUrl=" + ipnUrl + 
        "&orderId=" + orderId + 
        "&orderInfo=" + orderInfo + 
        "&partnerCode=" + partnerCode + 
        "&redirectUrl=" + redirectUrl + 
        "&requestId=" + requestId + 
        "&requestType=" + requestType;

    // [DEBUG CHECK 2]: Log rawSignature để kiểm tra tham số
    console.log("MoMo Host:", host);
    console.log("Redirect URL:", redirectUrl);
    console.log("IPN URL:", ipnUrl);
    console.log("Raw Signature String:", rawSignature);


    // 4. Mã hóa chữ ký (SHA256)
    const signature = crypto.createHmac('sha256', secretKey)
        .update(rawSignature)
        .digest('hex');

    // 5. Tạo body data gửi lên Momo
    const body = JSON.stringify({
        partnerCode : partnerCode,
        partnerName : "Test",
        storeId : "MomoTestStore",
        requestId : requestId,
        amount : amount,
        orderId : orderId,
        orderInfo : orderInfo,
       redirectUrl : redirectUrl,
        ipnUrl : ipnUrl,
        lang : lang,
        requestType: requestType,
        autoCapture: autoCapture,
        extraData : extraData,
        signature : signature
    });

    // 6. Gửi request đến Momo (dùng Promise để xử lý async/await)
    return new Promise((resolve, reject) => {
        const options = {
            hostname: host,
            port: 443,
            path: endpoint,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(body)
            }
        };

        const reqMomo = https.request(options, (resMomo) => { 
            let bodyMomo = '';
            resMomo.on('data', (chunk) => bodyMomo += chunk);
            resMomo.on('end', () => {
                console.log("Momo Response Status:", resMomo.statusCode);
                console.log("Momo Response Body (Raw):", bodyMomo);

                try {
                    const responseData = JSON.parse(bodyMomo); 

                    // [DEBUG CHECK 3]: Kiểm tra MoMo trả về lỗi gì
                    if (responseData.errorCode !== 0) {
                        console.error("MoMo Error Response:", responseData);
                    }
                    
                    // Trả về cho frontend payUrl
                    resolve({
                        statusCode: 200,
                        body: JSON.stringify({
                            message: "Order creation attempted.",
                            data: responseData 
                        })
                    });
                } catch (e) {
                    console.error("Lỗi parse JSON từ Momo:", e, "Body nhận được:", bodyMomo);
                    resolve({ statusCode: 500, body: JSON.stringify({ error: "Error processing Momo response" }) });
                }
            });
        });

        reqMomo.on('error', (e) => {
            console.error(`Lỗi request đến Momo: ${e.message}`);
            resolve({ statusCode: 500, body: JSON.stringify({ error: "Failed to connect to Momo API" }) });
        });

        reqMomo.write(body);
        reqMomo.end();
    });
};
