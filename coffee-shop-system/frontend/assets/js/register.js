document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.getElementById('registerForm');
    const errorMsg = document.getElementById('errorMsg');
    
    const API_BASE_URL = 'http://localhost:8081';
    
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegistration);
    }
    
    async function handleRegistration(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value.trim();
        const fullName = document.getElementById('fullName').value.trim();
        const password = document.getElementById('password').value.trim();
        const confirmPassword = document.getElementById('confirmPassword').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const address = document.getElementById('address').value.trim();
        
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
        
        clearError();
        
        const submitButton = registerForm.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;
        submitButton.textContent = 'Đang đăng ký...';
        submitButton.disabled = true;
        
        try {
            const registerUrl = `${API_BASE_URL}/api/accounts`;
            
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
                    role: 'CUSTOMER' 
                })
            });
            
            submitButton.textContent = originalText;
            submitButton.disabled = false;
            
            const data = await response.json();
            
            if (response.ok) {
                handleSuccessfulRegistration(data);
            } else {
                if (response.status === 409) {
                    showError('Tên đăng nhập đã tồn tại. Vui lòng chọn tên đăng nhập khác.');
                } else {
                    showError(data.message || 'Đăng ký thất bại. Vui lòng thử lại.');
                }
            }
            
        } catch (error) {
            console.error('Lỗi đăng ký:', error);
            
            submitButton.textContent = originalText;
            submitButton.disabled = false;
            
            showError('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.');
        }
    }
    
    function handleSuccessfulRegistration(data) {
        showSuccess('Đăng ký thành công! Chuyển hướng đến trang đăng nhập...');
        
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
    }
    
    function showError(message) {
        if (errorMsg) {
            errorMsg.textContent = message;
            errorMsg.style.color = 'var(--error-color)';
            errorMsg.style.display = 'block';
        }
    }
    
    function showSuccess(message) {
        if (errorMsg) {
            errorMsg.textContent = message;
            errorMsg.style.color = 'var(--success-color)';
            errorMsg.style.display = 'block';
        }
    }
    
    function clearError() {
        if (errorMsg) {
            errorMsg.textContent = '';
            errorMsg.style.display = 'none';
        }
    }
    
    function showToast(message, type = 'success') {
        const existingToast = document.querySelector('.register-toast');
        if (existingToast) existingToast.remove();
        
        const toast = document.createElement('div');
        toast.className = `register-toast ${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <span>${message}</span>
                <button class="toast-close">&times;</button>
            </div>
        `;
        
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
        
        setTimeout(() => toast.classList.add('show'), 10);
        
        toast.querySelector('.toast-close').addEventListener('click', () => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        });
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 5000);
    }
}); 