document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const errorMsg = document.getElementById('errorMsg');
    
    const API_BASE_URL = 'http://localhost:8081';
    
    const token = localStorage.getItem('token');
    if (token) {
        const role = localStorage.getItem('role');
        redirectBasedOnRole(role);
    }
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    async function handleLogin(e) {
    e.preventDefault();
  
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();
        
        if (!username || !password) {
            showError('Vui lòng nhập tên đăng nhập và mật khẩu');
            return;
        }
        
        clearError();
        
        const submitButton = loginForm.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;
        submitButton.textContent = 'Đang đăng nhập...';
        submitButton.disabled = true;
        
        try {
            const loginUrl = `${API_BASE_URL}/api/accounts/login`;
            
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
            
            if (response.ok) {
                const data = await response.json();
                handleSuccessfulLogin(data);
                submitButton.textContent = originalText;
                submitButton.disabled = false;
            } else {
                let errorMsg = 'Đăng nhập thất bại. Vui lòng thử lại.';
                try {
                    const text = await response.text();
                    const errJson = JSON.parse(text);
                    errorMsg = errJson.message || errorMsg;
                } catch (e) {
                }
                showError(errorMsg);
                submitButton.textContent = originalText;
                submitButton.disabled = false;
            }
        } catch (error) {
            console.error('Lỗi đăng nhập:', error);
            submitButton.textContent = originalText;
            submitButton.disabled = false;
            showError('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng hoặc máy chủ.');
            showError('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng hoặc máy chủ.');
        }
    }
    
    function handleSuccessfulLogin(data) {
        if (!data.role) {
            showError('Lỗi đăng nhập: Không nhận được quyền hạn người dùng từ máy chủ.');
            return;
        }
        
        localStorage.setItem('token', data.token);
        localStorage.setItem('role', data.role);
        localStorage.setItem('userId', data.userId);
        localStorage.setItem('fullName', data.fullName);
        
        showSuccess('Đăng nhập thành công! Đang chuyển hướng...');
        
        setTimeout(() => {
            redirectBasedOnRole(data.role);
        }, 1000);
    }
    
    function redirectBasedOnRole(role) {
        if (!role) {
            showError('Không thể xác định quyền hạn người dùng (role không tồn tại).');
            localStorage.removeItem('token');
            localStorage.removeItem('role');
            return;
        }
        
        const roleLower = role.toLowerCase();
        
        const redirectPath = localStorage.getItem('redirectAfterLogin');
        
        if (roleLower.includes('admin')) {
            if (redirectPath && redirectPath.includes('/admin/')) {
                window.location.href = redirectPath;
                localStorage.removeItem('redirectAfterLogin'); 
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
            localStorage.removeItem('token');
            localStorage.removeItem('role');
        }
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
});
  