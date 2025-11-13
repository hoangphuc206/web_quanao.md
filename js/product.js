document.addEventListener('DOMContentLoaded', function () {
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('modalImage');
    const closeBtn = document.getElementsByClassName('close-modal')[0];
    const mainImage = document.getElementById('main-product-image');
    const thumbnails = document.querySelectorAll('.thumbnail');

    mainImage.addEventListener('click', function () {
        modal.style.display = 'block';
        modalImg.src = this.src;
    });

    thumbnails.forEach(thumbnail => {
        thumbnail.addEventListener('click', function () {
            thumbnails.forEach(t => t.classList.remove('active'));
            thumbnail.classList.add('active');
            mainImage.src = thumbnail.src;
            mainImage.alt = thumbnail.alt;
        });

        thumbnail.addEventListener('dblclick', function () {
            modal.style.display = 'block';
            modalImg.src = this.src;
        });
    });

    closeBtn.addEventListener('click', function () {
        modal.style.display = 'none';
    });

    modal.addEventListener('click', function (event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
});

function selectSize(element) {
    document.querySelectorAll('.size-option').forEach(option => option.classList.remove('active'));
    element.classList.add('active');
}

function changeQuantity(amount) {
    let quantityInput = document.getElementById('productQuantity');
    let newValue = parseInt(quantityInput.value) + amount;
    if (newValue >= 1 && newValue <= 10) {
        quantityInput.value = newValue;
    }
}

let quantityInput = document.getElementById('quantity');

function addToCart() {
  console.log("🛒 addToCart được gọi!");

  const name = document.querySelector('.product-info h2').textContent;
  const basePrice = parseInt(document.querySelector('.price').textContent.replace(/\D/g, ''));
  const image = document.getElementById('mainImage').src;
  const quantity = parseInt(quantityInput.value);
  const selectedSizeElement = document.querySelector('.size-option.active');
  const size = selectedSizeElement ? selectedSizeElement.textContent : "Không xác định";

  if (isNaN(quantity) || quantity < 1) {
      alert("Vui lòng chọn số lượng hợp lệ!");
      return;
  }

  console.log(`🔍 Thông tin sản phẩm: ${name}, Giá: ${basePrice}, SL: ${quantity}, Size: ${size}`);

  const product = {
      name,
      price: basePrice,
      image,
      quantity,
      size: size // Thêm kích thước vào sản phẩm
  };

  let cart = JSON.parse(localStorage.getItem('cart')) || [];

  const index = cart.findIndex(item => item.name === name && item.size === size); // Kiểm tra cả tên và size
  if (index >= 0) {
      cart[index].quantity += quantity;
  } else {
      cart.push(product);
  }

  localStorage.setItem('cart', JSON.stringify(cart));
  alert("Đã thêm vào giỏ hàng!");

  if (typeof loadCart === "function" && document.getElementById('cart-body')) {
      loadCart();
  }
}

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

      const productCell = `<td><img src="${item.image}" alt="${item.name}" width="50"/> ${item.name} (Size: ${item.size})</td>`; // Hiển thị size
      const priceCell = `<td>${price.toLocaleString()} VNĐ</td>`;
      const quantityCell = `<td>${item.quantity}</td>`;
      const itemTotalCell = `<td>${itemTotal.toLocaleString()} VNĐ</td>`;

      row.innerHTML = productCell + priceCell + quantityCell + itemTotalCell;
      cartBody.appendChild(row);

      total += itemTotal;
  });

  cartTotal.textContent = "Tổng Cộng: " + total.toLocaleString() + " VNĐ";
}
// Function to open the image modal
function openModal(img) {
    var modal = document.getElementById("imageModal");
    var modalImg = document.getElementById("modalImage");
    
    modal.style.display = "block";
    modalImg.src = img.src;
    
    // Disable scrolling on the body when modal is open
    document.body.style.overflow = "hidden";
}

// Close the modal when clicking on the X
document.querySelector(".close-modal").onclick = function() {
    document.getElementById("imageModal").style.display = "none";
    // Re-enable scrolling
    document.body.style.overflow = "auto";
}

// Close the modal when clicking outside the image
document.getElementById("imageModal").onclick = function(event) {
    if (event.target === this) {
        this.style.display = "none";
        // Re-enable scrolling
        document.body.style.overflow = "auto";
    }
}