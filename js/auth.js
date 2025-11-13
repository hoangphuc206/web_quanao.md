
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            const user = users.find(u => u.username === username && u.password === password);
            
            if (user) {
                localStorage.setItem('loggedInUser', username);
                alert('Đăng nhập thành công!');
                window.location.href = 'index.html';
            } else {
                alert('Tên đăng nhập hoặc mật khẩu không đúng!');
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const username = document.getElementById('newUsername').value;
            const password = document.getElementById('newPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;

            if (password !== confirmPassword) {
                alert('Mật khẩu xác nhận không khớp!');
                return;
            }

            const users = JSON.parse(localStorage.getItem('users') || '[]');
            if (users.some(u => u.username === username)) {
                alert('Tên đăng nhập đã tồn tại!');
                return;
            }

            users.push({ username, password });
            localStorage.setItem('users', JSON.stringify(users));
            alert('Đăng ký thành công!');
            window.location.href = 'login.html';
        });
    }
});
