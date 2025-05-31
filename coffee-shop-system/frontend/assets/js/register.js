// register.js - Handle registration functionality

document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.getElementById('registerForm');
    const errorMsg = document.getElementById('errorMsg');
    
    // API URL configuration - set the correct port
    const API_BASE_URL = 'http://localhost:8081';
    
    // Add event listener to registration form
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegistration);
    }
    
    // Handle the registration process
    async function handleRegistration(e) {
        e.preventDefault();
        
        // Get form values
        const username = document.getElementById('username').value.trim();
        const fullName = document.getElementById('fullName').value.trim();
        const password = document.getElementById('password').value.trim();
        const confirmPassword = document.getElementById('confirmPassword').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const address = document.getElementById('address').value.trim();
        
        // Form validation
        if (!username || !fullName || !password || !confirmPassword) {
            showError('Vui lòng điền đầy đủ thông tin bắt buộc');
            return;
        }
        
        if (password !== confirmPassword) {
            showError('Mật khẩu xác nhận không khớp');
            return;
        }
        
        if (password.length < 6) {
            showError('Mật khẩu phải có ít nhất 6 ký tự');
            return;
        }
        
        // Clear previous error messages
        clearError();
        
        // Show loading state
        const submitButton = registerForm.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;
        submitButton.textContent = 'Đang đăng ký...';
        submitButton.disabled = true;
        
        try {
            const registerUrl = `${API_BASE_URL}/api/auth/signup`;
            
            // Send registration request
            const response = await fetch(registerUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ 
                    userName: username,
                    fullName: fullName,
                    passWord: password,
                    phone: phone || null,
                    address: address || null,
                    image: null,
                    role: 'CUSTOMER',
                    status: 'active'
                })
            });
            
            // Reset button state
            submitButton.textContent = originalText;
            submitButton.disabled = false;
            
            // Parse response
            const data = await response.json();
            
            if (response.ok) {
                // Registration successful
                handleSuccessfulRegistration(data);
            } else {
                // Registration failed
                if (response.status === 400 && data.message.includes('Username is already taken')) {
                    showError('Tên đăng nhập đã tồn tại. Vui lòng chọn tên đăng nhập khác.');
                } else {
                    showError(data.message || 'Đăng ký thất bại. Vui lòng thử lại.');
                }
            }
            
        } catch (error) {
            console.error('Lỗi đăng ký:', error);
            
            // Reset button state
            submitButton.textContent = originalText;
            submitButton.disabled = false;
            
            // Show connection error message
            showError('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.');
        }
    }
    
    // Handle successful registration
    function handleSuccessfulRegistration(data) {
        // Show success message
        showSuccess('Đăng ký thành công! Chuyển hướng đến trang đăng nhập...');
        
        // Redirect to login page after a delay
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
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
    
    // Add a touch of toast notification like in promotion-manager.js
    function showToast(message, type = 'success') {
        // Remove existing toast if any
        const existingToast = document.querySelector('.register-toast');
        if (existingToast) existingToast.remove();
        
        // Create toast element
        const toast = document.createElement('div');
        toast.className = `register-toast ${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <span>${message}</span>
                <button class="toast-close">&times;</button>
            </div>
        `;
        
        // Add styles if not already in the document
        if (!document.getElementById('register-toast-style')) {
            const style = document.createElement('style');
            style.id = 'register-toast-style';
            style.textContent = `
                .register-toast {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: white;
                    color: #333;
                    border-radius: 8px;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.15);
                    padding: 15px 20px;
                    z-index: 1000;
                    transition: all 0.3s ease;
                    transform: translateX(100%);
                    border-left: 5px solid #e67e22;
                }
                .register-toast.success { border-color: #2ecc71; }
                .register-toast.error { border-color: #e74c3c; }
                .register-toast.show { transform: translateX(0); }
                .toast-content {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }
                .toast-close {
                    background: none;
                    border: none;
                    font-size: 18px;
                    cursor: pointer;
                    margin-left: 15px;
                    color: #777;
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(toast);
        
        // Show toast
        setTimeout(() => toast.classList.add('show'), 10);
        
        // Setup close button
        toast.querySelector('.toast-close').addEventListener('click', () => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        });
        
        // Auto hide after 5 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 5000);
    }
}); 