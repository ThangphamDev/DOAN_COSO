export function showLoadingMessage(message) {
    if (window.AdminCore && window.AdminCore.showNotification) {
        window.AdminCore.showNotification(message, 'info');
    } else {
        console.log('Info:', message);
    }
}

export function showSuccessMessage(message) {
    if (window.AdminCore && window.AdminCore.showNotification) {
        window.AdminCore.showNotification(message, 'success');
    } else {
        console.log('Success:', message);
    }
}

export function showErrorMessage(message) {
    if (window.AdminCore && window.AdminCore.showNotification) {
        window.AdminCore.showNotification(message, 'error');
    } else {
        console.error('Error:', message);
    }
}

export function hideLoadingMessage() {
    if (window.AdminCore && window.AdminCore.hideNotification) {
        window.AdminCore.hideNotification();
    }
}

export function initializeModal(modalId, openBtnId) {
    const modal = document.getElementById(modalId);
    const openBtn = document.getElementById(openBtnId);
    
    if (!modal || !openBtn) return;
    
    const closeBtn = modal.querySelector('.close-btn');
    
    openBtn.addEventListener('click', function() {
        const form = modal.querySelector('form');
        if (form) form.reset();
        
        const hiddenFields = modal.querySelectorAll('input[type="hidden"]');
        hiddenFields.forEach(field => field.value = '');
        
        const title = modal.querySelector('h2');
        if (title) {
            title.textContent = title.textContent.replace('Chỉnh sửa', 'Thêm mới');
        }
        
        modal.style.display = 'flex';
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
    });
    
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            closeModal(modalId);
        });
    }
    
    window.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal(modalId);
        }
    });
}

export function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    
    modal.classList.remove('show');
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);
}

export function setupSearchFilter(inputId, filterFunction) {
    const searchInput = document.getElementById(inputId);
    if (!searchInput) return;
    
    searchInput.addEventListener('input', debounce(function() {
        filterFunction(this.value);
    }, 300));
}

export function debounce(func, wait) {
    let timeout;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

export function formatRole(role) {
    if (role === 'admin') {
        return 'Quản trị viên';
    } else if (role === 'staff') {
        return 'Nhân viên';
    }
    return role;
} 