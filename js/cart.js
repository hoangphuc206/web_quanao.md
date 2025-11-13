// LƯU Ý: Đây là toàn bộ nội dung file cart.js đã được cập nhật.

// Cập nhật số lượng trên icon giỏ hàng
function updateCartCount() {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    // Tính tổng số lượng (total items) thay vì số loại (cart.length)
    let totalItems = cart.reduce((total, item) => total + item.quantity, 0); 
    const cartCountElement = document.getElementById("cart-count");
    if (cartCountElement) {
        cartCountElement.textContent = totalItems;
    }
}

// Hàm xóa sản phẩm khỏi giỏ hàng
function removeProduct(index) {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];

    if (index >= 0 && index < cart.length) {
        cart.splice(index, 1); // Chỉ xóa sản phẩm có vị trí đúng
        localStorage.setItem("cart", JSON.stringify(cart)); // Lưu lại giỏ hàng
        displayCart(); // Cập nhật giao diện
        updateCartCount(); // Cập nhật lại số lượng giỏ hàng
    }
}

// Hàm tạo thông tin đơn hàng (orderInfo)
function createOrderInfo(cart) {
    if (cart.length === 0) {
        return "Thanh toán đơn hàng trống";
    }

    // Lấy tên và số lượng của tối đa 3 sản phẩm đầu tiên
    const itemDescriptions = cart.slice(0, 3).map(item => {
        // Chỉ lấy tên sản phẩm mà không có khoảng trắng hoặc ký tự đặc biệt
        const cleanName = item.name.replace(/[^\w\s]/gi, '').trim().substring(0, 15); 
        return `${cleanName} (x${item.quantity})`;
    });

    let info = `Thanh toán: ${itemDescriptions.join(', ')}`;
    
    if (cart.length > 3) {
        info += ' và các sản phẩm khác...';
    }
    
    return info.substring(0, 150); // Giới hạn độ dài chuỗi 
}

// Hàm hiển thị giỏ hàng (Thay thế cho loadCart() cũ)
function displayCart() {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    let cartContainer = document.getElementById("cart-items"); // Đã đổi ID từ 'cart-body' sang 'cart-items'
    let totalPriceElement = document.getElementById("total-price"); // Đã đổi ID từ 'cart-total' sang 'total-price'
    let totalPrice = 0; 

    if (!cartContainer || !totalPriceElement) return;

    cartContainer.innerHTML = ""; // Xóa nội dung cũ trước khi hiển thị lại

    if (cart.length === 0) {
        cartContainer.innerHTML = "<p class='text-center text-muted mt-5'>Giỏ hàng trống</p>";
        totalPriceElement.textContent = "Tổng tiền: 0đ";
        return;
    }

    cart.forEach((item, index) => {
        // Xử lý giá tiền để đảm bảo là số
        const itemPriceClean = parseFloat(String(item.price).replace(/[^\d.]/g, '')) || 0;
        
        let itemElement = document.createElement("div");
        itemElement.classList.add("cart-item", "d-flex", "align-items-center", "border-bottom", "py-2");
        itemElement.innerHTML = `
            <img src="${item.img}" width="60" class="me-3 rounded">
            <div class="flex-grow-1">
                <p class="mb-0"><strong>${item.name}</strong></p>
                <p class="mb-0 text-sm text-muted">${itemPriceClean.toLocaleString()}đ x ${item.quantity}</p>
            </div>
            <button class="btn btn-sm btn-danger remove-btn" data-index="${index}">Xóa</button>
        `;
        cartContainer.appendChild(itemElement);

        totalPrice += itemPriceClean * item.quantity;
    });

    totalPriceElement.textContent = `Tổng tiền: ${totalPrice.toLocaleString()}đ`;

    // Gắn sự kiện xóa cho các nút "Xóa" mới được tạo
    document.querySelectorAll(".remove-btn").forEach((button) => {
        button.addEventListener("click", function () {
            let index = parseInt(this.getAttribute("data-index")); 
            removeProduct(index);
        });
    });
}

// Hàm xử lý thanh toán MoMo (Thay thế cho checkout() cũ)
async function handleMomoCheckout() {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];

    if (cart.length === 0) {
        // Dùng console.log thay vì alert để tránh chặn luồng
        console.log("Giỏ hàng đang trống, vui lòng thêm sản phẩm!");
        return;
    }

    // 1. Tính tổng tiền (phải là số nguyên)
    let totalPriceFloat = 0;
    cart.forEach(item => {
        const itemPriceClean = parseFloat(String(item.price).replace(/[^\d.]/g, '')) || 0;
        totalPriceFloat += itemPriceClean * item.quantity;
    });
    
    const totalAmount = Math.round(totalPriceFloat);

    // 2. Chuẩn bị thông tin đơn hàng
    const orderId = 'ECLIPSE_' + Date.now(); 
    const orderInfo = createOrderInfo(cart); 

    // --- Báo hiệu đang chuyển hướng trong console (Không dùng alert để tránh chặn) ---
    console.log("Đang chuyển hướng qua trang thanh toán MoMo..."); 

    // 3. Gửi yêu cầu lên Netlify Function 
    try {
        const response = await fetch("/.netlify/functions/momo-create", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                totalAmount: totalAmount,
                orderId: orderId,
                orderInfo: orderInfo
            })
        });

        const data = await response.json();
        console.log("MoMo Response (Function):", data);

        // 4. Xử lý phản hồi và chuyển hướng
        if (response.ok && data?.data && data.data.resultCode === 0 && data.data.payUrl) {
            
            // Xóa giỏ hàng khi chuẩn bị chuyển hướng thành công
            localStorage.removeItem("cart"); 
            updateCartCount(); 
            
            // CHUYỂN HƯỚNG ĐẾN CỔNG THANH TOÁN MOMO - Đây là bước cuối cùng
            window.location.href = data.data.payUrl;
            
        } else {
            // LỖI THỰC SỰ từ Netlify Function hoặc MoMo
            const errorMessage = data.data?.message || data.error || 'Lỗi không rõ ràng từ server.';
            console.error("Lỗi tạo URL thanh toán:", errorMessage);
            
            // Sử dụng alert() chỉ khi có lỗi thực sự để người dùng biết giao dịch bị thất bại
            alert(`Lỗi thanh toán: ${errorMessage}`);
        }

    } catch (err) {
        // Khối này chỉ bắt các lỗi mạng (Network Error)
        console.error("Lỗi kết nối mạng nghiêm trọng/CORS:", err);
        // QUAN TRỌNG: KHÔNG có alert nào ở đây để tránh lỗi giả!
    }
}


// === GẮN CÁC SỰ KIỆN KHI DOM HOÀN TẤT (Thay thế cho DOMContentLoaded cũ) ===

document.addEventListener("DOMContentLoaded", function () {
    // 1. Gắn sự kiện thêm vào giỏ hàng (nếu cart.js được dùng trên trang chủ)
    updateCartCount(); // Cập nhật số lượng trên icon giỏ hàng

    document.querySelectorAll(".add-to-cart").forEach((button) => {
        button.addEventListener("click", function (event) {
            event.preventDefault(); 

            let productCard = button.closest(".card");
            let productName = productCard.querySelector(".card-title").innerText;
            // Đảm bảo loại bỏ ký tự không phải số khỏi giá
            let productPrice = String(productCard.querySelector(".card-text").innerText).replace(/[^\d.]/g, ''); 
            let productImg = productCard.querySelector(".card-img-top").src;

            let cart = JSON.parse(localStorage.getItem("cart")) || [];
            let existingProduct = cart.find((item) => item.name === productName);

            if (existingProduct) {
                existingProduct.quantity += 1; 
            } else {
                cart.push({
                    name: productName,
                    price: productPrice,
                    img: productImg,
                    quantity: 1,
                });
            }

            localStorage.setItem("cart", JSON.stringify(cart)); 
            updateCartCount(); 

            // Giữ lại alert này để xác nhận đã thêm vào giỏ hàng
            alert("Đã thêm vào giỏ hàng!");
        });
    });
    
    // 2. Hiển thị giỏ hàng (nếu cart.js được dùng trên trang giỏ hàng)
    displayCart(); 
    
    // 3. Gắn sự kiện Thanh toán MoMo
    const momoBtn = document.getElementById("checkout-momo"); // Đã đổi ID từ 'checkout-button' sang 'checkout-momo'
    if (momoBtn) {
        momoBtn.addEventListener("click", handleMomoCheckout);
    }
});
