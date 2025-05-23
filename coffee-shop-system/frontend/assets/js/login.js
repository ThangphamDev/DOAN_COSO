// login.js - Handle login functionality

document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const errorMsg = document.getElementById('errorMsg');
    
    // API URL configuration - set the correct port
    const API_BASE_URL = 'http://localhost:8081';
    
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    if (token) {
        const role = localStorage.getItem('role');
        redirectBasedOnRole(role);
    }
    
    // Add event listener to login form
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Handle the login process
    async function handleLogin(e) {
    e.preventDefault();
  
        // Get form values
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();
        
        if (!username || !password) {
            showError('Vui lòng nhập tên đăng nhập và mật khẩu');
            return;
        }
        
        // Clear previous error messages
        clearError();
        
        // Show loading state
        const submitButton = loginForm.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;
        submitButton.textContent = 'Đang đăng nhập...';
        submitButton.disabled = true;
        
        try {
            const loginUrl = `${API_BASE_URL}/api/accounts/login`;
            
            // Send login request
            const response = await fetch(loginUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ 
                    userName: username,
                    passWord: password
                })
            });
            
            // Parse response data
            const data = await response.json();
            
            // Reset button state
            submitButton.textContent = originalText;
            submitButton.disabled = false;
            
            if (response.ok) {
                // Login successful
                handleSuccessfulLogin(data);
            } else {
                // Login failed
                showError(data.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
            }
            
        } catch (error) {
            console.error('Lỗi đăng nhập:', error);
            
            // Reset button state
            submitButton.textContent = originalText;
            submitButton.disabled = false;
            
            // Show connection error message
            showError('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng hoặc máy chủ.');
        }
    }
    
    // Handle successful login
    function handleSuccessfulLogin(data) {
        // Kiểm tra và đảm bảo có role
        if (!data.role) {
            showError('Lỗi đăng nhập: Không nhận được quyền hạn người dùng từ máy chủ.');
            return;
        }
        
        // Save data to local storage
        localStorage.setItem('token', data.token);
        localStorage.setItem('role', data.role);
        localStorage.setItem('userId', data.userId);
        localStorage.setItem('fullName', data.fullName);
        
        // Flash success message
        showSuccess('Đăng nhập thành công! Đang chuyển hướng...');
        
        // Redirect based on role
        setTimeout(() => {
            redirectBasedOnRole(data.role);
        }, 1000);
    }
    
    // Redirect user based on role
    function redirectBasedOnRole(role) {
        if (!role) {
            showError('Không thể xác định quyền hạn người dùng (role không tồn tại).');
            localStorage.removeItem('token');
            localStorage.removeItem('role');
            return;
        }
        
        // Chuyển đổi role về chữ thường để dễ so sánh
        const roleLower = role.toLowerCase();
        
        // Kiểm tra xem có đường dẫn redirect sau đăng nhập không
        const redirectPath = localStorage.getItem('redirectAfterLogin');
        
        // So sánh không phân biệt hoa thường
        if (roleLower.includes('admin')) {
            // Nếu là Admin và có đường dẫn redirect tới trang admin, sử dụng đường dẫn đó
            if (redirectPath && redirectPath.includes('/admin/')) {
                window.location.href = redirectPath;
                localStorage.removeItem('redirectAfterLogin'); // Xóa sau khi sử dụng
            } else {
                window.location.href = '../admin/dashboard.html';
            }
        } 
        else if (roleLower.includes('staff')) {
            window.location.href = '../staff/dashboard.html';
        }
        else if (roleLower.includes('customer')) {
            window.location.href = '../index.html';
        }
        else {
            showError('Không thể xác định quyền hạn người dùng: "' + role + '"');
            // Clear local storage if role is not recognized
            localStorage.removeItem('token');
            localStorage.removeItem('role');
        }
    }
    
    // Show error message
    function showError(message) {
        if (errorMsg) {
            errorMsg.textContent = message;
            errorMsg.style.color = 'var(--error-color)';
            errorMsg.style.display = 'block';
        }
    }
    
    // Show success message
    function showSuccess(message) {
        if (errorMsg) {
            errorMsg.textContent = message;
            errorMsg.style.color = 'var(--success-color)';
            errorMsg.style.display = 'block';
        }
    }
    
    // Clear error message
    function clearError() {
        if (errorMsg) {
            errorMsg.textContent = '';
            errorMsg.style.display = 'none';
        }
    }
});
  