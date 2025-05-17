document.addEventListener('DOMContentLoaded', function() {
    // Tính đường dẫn tới components/ theo vị trí trang hiện tại
    const currentPath = window.location.pathname;
    let basePath = "";

    if (currentPath.includes("/admin/") || currentPath.includes("/customer/") || currentPath.includes("/staff/") || currentPath.includes("/auth/")) {
        basePath = "../components/";
    } else {
        basePath = "./components/";
    }

    // Chỉ load header/footer nếu phần tử tồn tại
    if (document.querySelector('.main-header')) {
        loadComponent(basePath + 'header.html', '.main-header');
    }
    if (document.querySelector('.main-footer')) {
        loadComponent(basePath + 'footer.html', '.main-footer');
    }
    if (document.getElementById('header-container')) {
        loadComponent(basePath + 'header.html', '#header-container');
    }
    if (document.getElementById('footer-container')) {
        loadComponent(basePath + 'footer.html', '#footer-container');
    }
    
    // Initialize common features
    initCommonFeatures();
});

function loadComponent(path, targetSelector) {
    const targetElement = document.querySelector(targetSelector) || document.getElementById(targetSelector.replace('#',''));
    if (!targetElement) {
        // Không log lỗi nữa để tránh spam console
        return;
    }
    
    fetch(path)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.text();
        })
        .then(html => {
            targetElement.outerHTML = html;
        })
        .catch(error => {
            // Không log lỗi nữa để tránh spam console
            targetElement.outerHTML = `<div class="component-error">Failed to load component</div>`;
        });
}

function initCommonFeatures() {
    console.log('Initializing common features...');
}
