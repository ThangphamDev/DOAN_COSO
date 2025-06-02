// load-components.js - Utility for loading header and footer components

document.addEventListener('DOMContentLoaded', function() {
    // Load header and footer components
    loadComponent('../components/header.html', 'header-container');
    loadComponent('../components/footer.html', 'footer-container');
});

/**
 * Load a component into a target container
 * @param {string} url - The URL of the component to load
 * @param {string} targetId - The ID of the container element
 */
function loadComponent(url, targetId) {
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to fetch ${url}: ${response.status}`);
            }
            return response.text();
        })
        .then(data => {
            const targetElement = document.getElementById(targetId);
            if (!targetElement) {
                console.error(`Target element with ID '${targetId}' not found`);
                return;
            }
            
            targetElement.innerHTML = data;
            
            // Execute scripts in the loaded HTML
            const scripts = targetElement.querySelectorAll('script');
            scripts.forEach(script => {
                const newScript = document.createElement('script');
                if (script.src) {
                    newScript.src = script.src;
                } else {
                    newScript.textContent = script.textContent;
                }
                document.body.appendChild(newScript);
            });
            
            // If this is the header, highlight the active menu item
            if (url.includes('header.html')) {
                setTimeout(highlightActiveMenuItem, 100);
            }
        })
        .catch(error => {
            console.error(`Error loading component ${url}:`, error);
            document.getElementById(targetId).innerHTML = `
                <div style="color: red; padding: 20px;">
                    Không thể tải thành phần: ${error.message}
                </div>
            `;
        });
}

/**
 * Highlight the active menu item based on the current page
 */
function highlightActiveMenuItem() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.main-nav a');
    
    navLinks.forEach(link => {
        const linkPath = link.getAttribute('href');
        if (currentPath === linkPath || 
            currentPath.endsWith(linkPath) || 
            (linkPath.includes('/') && currentPath.includes(linkPath.split('/').pop()))) {
            link.parentElement.classList.add('active');
        }
    });
} 