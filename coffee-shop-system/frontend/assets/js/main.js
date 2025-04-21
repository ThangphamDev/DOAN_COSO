document.addEventListener('DOMContentLoaded', function() {
    // Load header and footer components
    loadComponent('header', '.main-header');
    loadComponent('footer', '.main-footer');
    
    // Initialize any common functionality
    initCommonFeatures();
});

function loadComponent(componentName, targetSelector) {
    const targetElement = document.querySelector(targetSelector);
    if (!targetElement) return;

    fetch(`components/${componentName}.html`)
        .then(response => response.text())
        .then(html => {
            targetElement.outerHTML = html;
        })
        .catch(error => {
            console.error(`Error loading ${componentName}:`, error);
        });
}


function initCommonFeatures() {
    // Common functionality like cart management can go here
    console.log('Initializing common features...');
    
    // Example: Initialize cart if it doesn't exist
    if (!localStorage.getItem('cart')) {
        localStorage.setItem('cart', JSON.stringify([]));
    }
}