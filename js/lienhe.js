document.addEventListener("DOMContentLoaded", function() {
    // Form submission handling
    const contactForm = document.getElementById('contactForm');
    
    contactForm.addEventListener('submit', function(event) {
        event.preventDefault();
        
        // Form validation
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const message = document.getElementById('message').value;
        
        if (!name || !email || !message) {
            alert('Vui lòng điền đầy đủ thông tin bắt buộc!');
            return;
        }
        
        // Form submission simulation
        alert('Cảm ơn bạn đã liên hệ với chúng tôi! Chúng tôi sẽ phản hồi sớm nhất có thể.');
        contactForm.reset();
    });

    // User login status check
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