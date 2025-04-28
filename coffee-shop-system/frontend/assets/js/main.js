document.addEventListener('DOMContentLoaded', function() {
    // Tính đường dẫn tới components/ theo vị trí trang hiện tại
    const currentPath = window.location.pathname;
    let basePath = "";

    if (currentPath.includes("/admin/") || currentPath.includes("/customer/") || currentPath.includes("/staff/") || currentPath.includes("/auth/")) {
        basePath = "../components/";
    } else {
        basePath = "./components/";
    }

    // Load header và footer
    loadComponent(basePath + 'header.html', '.main-header');
    loadComponent(basePath + 'footer.html', '.main-footer');
    
    // Initialize common features
    initCommonFeatures();
});

function loadComponent(path, targetSelector) {
    const targetElement = document.querySelector(targetSelector);
    if (!targetElement) {
        console.error(`Target element not found: ${targetSelector}`);
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
            console.error(`Error loading component from ${path}:`, error);
            // Fallback
            targetElement.outerHTML = `<div class="component-error">Failed to load component</div>`;
        });
}

function initCommonFeatures() {
    console.log('Initializing common features...');
}
