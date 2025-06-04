document.addEventListener('DOMContentLoaded', function() {
    const currentPath = window.location.pathname;
    let basePath = "";

    if (currentPath.includes("/admin/") || currentPath.includes("/customer/") || currentPath.includes("/staff/") || currentPath.includes("/auth/")) {
        basePath = "../components/";
    } else {
        basePath = "./components/";
    }

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
    
    initCommonFeatures();
});

function loadComponent(path, targetSelector) {
    const targetElement = document.querySelector(targetSelector) || document.getElementById(targetSelector.replace('#',''));
    if (!targetElement) {
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
            targetElement.outerHTML = `<div class="component-error">Failed to load component</div>`;
        });
}

function initCommonFeatures() {
    console.log('Initializing common features...');
}
