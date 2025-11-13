// Xử lý các nút bộ lọc trên trang danh mục sản phẩm
document.addEventListener('DOMContentLoaded', function() {
    // Lấy tất cả các nút bộ lọc
    const filterButtons = document.querySelectorAll('.filter-button');
    
    // Lấy tất cả các sản phẩm
    const products = document.querySelectorAll('.product-item');
    
    // Thêm event listener cho mỗi nút
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Loại bỏ trạng thái active từ tất cả các nút
            filterButtons.forEach(btn => btn.classList.remove('active'));
            
            // Thêm trạng thái active vào nút được nhấp
            this.classList.add('active');
            
            // Lấy loại bộ lọc từ nút (text của nút)
            const filterType = this.textContent.trim();
            
            // Hiển thị tất cả sản phẩm nếu chọn "Tất cả"
            if (filterType === 'Tất cả') {
                products.forEach(product => {
                    product.style.display = 'block';
                });
                return;
            }
            
            // Lọc sản phẩm theo loại
            products.forEach(product => {
                // Kiểm tra xem sản phẩm có thuộc loại được chọn không
                // Mới nhất: Hiển thị 2 sản phẩm đầu tiên
                // Giảm giá: Hiển thị sản phẩm có class "discount-price"
                // Phổ biến: Hiển thị sản phẩm thứ 3
                
                if (filterType === 'Mới nhất') {
                    // Giả sử 2 sản phẩm đầu tiên là mới nhất
                    const isNew = Array.from(products).indexOf(product) < 2;
                    product.style.display = isNew ? 'block' : 'none';
                } else if (filterType === 'Giảm giá') {
                    // Kiểm tra xem sản phẩm có giảm giá không
                    const isDiscounted = product.querySelector('.discount-price') !== null;
                    product.style.display = isDiscounted ? 'block' : 'none';
                } else if (filterType === 'Phổ biến') {
                    // Giả sử sản phẩm thứ 3 là phổ biến nhất
                    const isPopular = Array.from(products).indexOf(product) === 2 || 
                                    product.querySelector('p').textContent.includes('Classic');
                    product.style.display = isPopular ? 'block' : 'none';
                }
            });
        });
    });
    
    // Hiển thị thông báo khi không có sản phẩm nào được tìm thấy
    function checkNoProducts() {
        const visibleProducts = document.querySelectorAll('.product-item[style="display: block;"]');
        const noProductsMessage = document.querySelector('.no-products');
        
        if (visibleProducts.length === 0 && !noProductsMessage) {
            const productList = document.querySelector('.product-list');
            const message = document.createElement('div');
            message.classList.add('no-products');
            message.innerHTML = `
                <i class="bi bi-emoji-frown"></i>
                <h3>Không tìm thấy sản phẩm nào</h3>
                <p>Vui lòng thử lại với bộ lọc khác</p>
            `;
            productList.appendChild(message);
        } else if (visibleProducts.length > 0 && noProductsMessage) {
            noProductsMessage.remove();
        }
    }
    
    // Kiểm tra khi bộ lọc thay đổi
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            setTimeout(checkNoProducts, 100);
        });
    });
});
const closePopupBtn = document.getElementById('closePopupBtn');
const popup = document.getElementById('popup');

// Đóng popup khi nhấn nút đóng
closePopupBtn.addEventListener('click', () => {
    popup.style.display = 'none';
});

// Đóng popup khi nhấn ngoài popup
window.addEventListener('click', (event) => {
    if (event.target === popup) {
        popup.style.display = 'none';
    }
});
document.addEventListener("DOMContentLoaded", function () {
    const sliderWrapper = document.querySelector(".slider-wrapper");
    const dots = document.querySelectorAll(".dot");
    let index = 0;

    function updateSlider() {
        sliderWrapper.style.transform = `translateX(-${index * 100}%)`;
        dots.forEach((dot, i) => dot.classList.toggle("active", i === index));
    }

    function nextSlide() {
        index = (index + 1) % dots.length; // Lặp lại khi hết ảnh
        updateSlider();
    }

    // Tự động trượt ảnh mỗi 3 giây
    setInterval(nextSlide, 3000);

    // Điều khiển bằng dots
    dots.forEach((dot, i) => {
        dot.addEventListener("click", () => {
            index = i;
            updateSlider();
        });
    });
});
document.addEventListener("DOMContentLoaded", function () {
    const loggedInUser = localStorage.getItem("loggedInUser");
    const loginBtn = document.querySelector(".bi-person-circle").parentElement;
    const registerBtn = document.querySelector(".bi-pencil-square").parentElement;

    if (loggedInUser) {
        loginBtn.innerHTML = `<a href="#" onclick="logout()">Đăng Xuất</a>`;
        registerBtn.style.display = "none";
    }
});

function logout() {
    localStorage.removeItem("loggedInUser");
    alert("Bạn đã đăng xuất!");
    location.reload();
}

const imgPosition = document.querySelectorAll(".aspect-ratio-169 img")
const imgContainer = document.querySelector('.aspect-ratio-169')
const dotItem = document.querySelectorAll(".dot")
let imgNuber = imgPosition.length
let index = 0
imgPosition.forEach(function (image, index) {
    image.style.left = index * 100 + "%"
    dotItem[index].addEventListener("click", function () {
        slider(index)
    })
});
function imgSlide() {
    index++;
    console.log(index)
    if (index >= imgNuber) { index = 0 }
    slider(index)
}
function slider(index) {
    imgContainer.style.left = "-" + index * 100 + "%"
    const dotActive = document.querySelector('.active')
    dotActive.classList.remove("active")
    dotItem[index].classList.add("active")
}

setInterval(imgSlide, 5000)