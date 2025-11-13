
function loadCart() {
    const cartBody = document.getElementById('cart-body');
    const cartTotal = document.getElementById('cart-total');

    if (!cartBody || !cartTotal) {
        console.warn("Phần tử cart-body hoặc cart-total chưa có trong DOM.");
        return;
    }

    cartBody.innerHTML = "";

    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    console.log("Cart hiện tại:", cart);
    let total = 0;

    cart.forEach((item) => {
        const row = document.createElement('tr');

        const price = Number(item.price) || 0;
        const itemTotal = price * item.quantity;

        const productCell = `<td><img src="${item.image}" alt="${item.name}" width="50"/> ${item.name} </td>`;
        const priceCell = `<td>${price.toLocaleString()} VNĐ</td>`;
        const quantityCell = `<td>${item.quantity}</td>`;
        const itemTotalCell = `<td>${itemTotal.toLocaleString()} VNĐ</td>`;
 
        row.innerHTML = productCell + priceCell + quantityCell + itemTotalCell + actionCell;
        cartBody.appendChild(row);

        total += itemTotal;
    });

    cartTotal.textContent = "Tổng Cộng: " + total.toLocaleString() + " VNĐ";
}

// Hàm xử lý thanh toán
function checkout() {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];

    if (cart.length === 0) {
        alert("Giỏ hàng của bạn đang trống. Vui lòng thêm sản phẩm trước khi thanh toán!");
        return;
    }

    // Hiển thị thông báo thanh toán thành công
    alert("Thanh toán thành công! Cảm ơn bạn đã mua hàng.");

    // Xóa giỏ hàng sau khi thanh toán thành công
    localStorage.removeItem('cart');

    // Cập nhật lại giao diện giỏ hàng
    loadCart();
}

// Thêm sự kiện cho nút thanh toán sau khi DOM đã tải
document.addEventListener('DOMContentLoaded', function () {
    loadCart();

    const checkoutButton = document.getElementById('checkout-button');
    if (checkoutButton) {
        checkoutButton.addEventListener('click', checkout);
    }
});
