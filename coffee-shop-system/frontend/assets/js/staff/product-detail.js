const API_URL = 'http://localhost:8081/api';

let currentProduct = null;
let variants = [];
let selectedOptions = {
    size: null,
    ice: null,
    sugar: null,
    toppings: []
};

function getAuthToken() {
    return localStorage.getItem('token');
}

function getAuthHeaders() {
    const token = getAuthToken();
    const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    };
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
}

document.addEventListener('DOMContentLoaded', async function() {
    if (checkAuthentication()) {
        const urlParams = new URLSearchParams(window.location.search);
        const productId = urlParams.get('id');
        if (productId) {
            await loadProductDetails(productId);
            await loadVariants();
        }
    }
});

function checkAuthentication() {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    
    if (!token || !role || !(role.toLowerCase().includes('staff') || role.toLowerCase().includes('admin'))) {
        window.location.href = '../../auth/login.html';
        return false;
    }
    
    return true;
}

async function loadProductDetails(productId) {
    try {
        const response = await fetch(`${API_URL}/products/${productId}`, {
            method: 'GET',
            headers: getAuthHeaders()
        });
        
        if (!response.ok) throw new Error('Failed to load product details');
        
        currentProduct = await response.json();
        displayProductDetails(currentProduct);
    } catch (error) {
        console.error('Error loading product details:', error);
        showNotification('Không thể tải thông tin sản phẩm', 'error');
    }
}

async function loadVariants() {
    try {
        const response = await fetch(`${API_URL}/variants`, {
            method: 'GET',
            headers: getAuthHeaders()
        });
        
        if (!response.ok) throw new Error('Failed to load variants');
        
        const allVariants = await response.json();
        
        const productId = new URLSearchParams(window.location.search).get('id');
        variants = [];
        
        if (currentProduct) {
            variants = allVariants.filter(variant => {
                if (!variant.category || !variant.category.products) return false;
                
                return variant.category.products.some(product => 
                    product.idProduct.toString() === productId
                );
            });
            
        }
       
        displayVariants();
    } catch (error) {
        console.error('Error loading variants:', error);
        showNotification('Không thể tải thông tin biến thể', 'error');
        variants = [];
        displayVariants();
    }
}

function displayProductDetails(product) {
    const productImage = document.getElementById('productImage');
    if (product.image) {
        productImage.src = `${API_URL}/products/images/${product.image}`;
    } else {
        productImage.src = '../assets/images/no-image.png';
    }

    document.getElementById('productName').textContent = product.productName;
    document.getElementById('productCategory').textContent = product.categoryName || product.category?.categoryName || 'Chưa phân loại';
    document.getElementById('productStatus').textContent = product.isAvailable ? 'Đang bán' : 'Ngừng bán';
    document.getElementById('productStatus').className = product.isAvailable ? 'status available' : 'status unavailable';
    document.getElementById('productPrice').textContent = formatCurrency(product.price);
    document.getElementById('productDescription').textContent = product.description;
}

function displayVariants() {
    const sizeVariants = variants.filter(v => v.variantType === 'size');
    const sizeSection = document.querySelector('.size-options');
    const sizeOptions = document.getElementById('sizeOptions');
    
    if (sizeVariants.length > 0 && sizeOptions) {
        if (sizeSection) sizeSection.style.display = 'block';
        sizeOptions.innerHTML = sizeVariants
            .sort((a, b) => a.displayOrder - b.displayOrder)
            .map(variant => `
                <button class="size-btn${variant.isDefault ? ' active' : ''}" 
                        data-size="${variant.variantValue}"
                        data-price="${variant.additionalPrice}">
                    ${variant.variantName}
                    ${variant.additionalPrice > 0 ? `(+${formatCurrency(variant.additionalPrice)})` : ''}
                </button>
            `).join('');
        const defaultSize = sizeVariants.find(v => v.isDefault);
        if (defaultSize) selectedOptions.size = defaultSize.variantValue;
    } else {
        if (sizeSection) sizeSection.style.display = 'none';
        selectedOptions.size = null;
    }

    const iceVariants = variants.filter(v => v.variantType === 'ice');
    const iceSection = document.querySelector('.ice-options');
    const iceOptions = document.getElementById('iceOptions');
    
    if (iceVariants.length > 0 && iceOptions) {
        if (iceSection) iceSection.style.display = 'block';
        iceOptions.innerHTML = iceVariants
            .sort((a, b) => a.displayOrder - b.displayOrder)
            .map(variant => `
                <button class="size-btn${variant.isDefault ? ' active' : ''}" 
                        data-ice="${variant.variantValue}">
                    ${variant.variantName}
                </button>
            `).join('');
        const defaultIce = iceVariants.find(v => v.isDefault);
        if (defaultIce) selectedOptions.ice = defaultIce.variantValue;
    } else {
        if (iceSection) iceSection.style.display = 'none';
        selectedOptions.ice = null;
    }

    const sugarVariants = variants.filter(v => v.variantType === 'sugar');
    const sugarSection = document.querySelector('.sugar-options');
    const sugarOptions = document.getElementById('sugarOptions');
    
    if (sugarVariants.length > 0 && sugarOptions) {
        if (sugarSection) sugarSection.style.display = 'block';
        sugarOptions.innerHTML = sugarVariants
            .sort((a, b) => a.displayOrder - b.displayOrder)
            .map(variant => `
                <button class="size-btn${variant.isDefault ? ' active' : ''}" 
                        data-sugar="${variant.variantValue}">
                    ${variant.variantName}
                </button>
            `).join('');
        const defaultSugar = sugarVariants.find(v => v.isDefault);
        if (defaultSugar) selectedOptions.sugar = defaultSugar.variantValue;
    } else {
        if (sugarSection) sugarSection.style.display = 'none';
        selectedOptions.sugar = null;
    }

    const toppingVariants = variants.filter(v => v.variantType === 'topping');
    const toppingSection = document.querySelector('.toppings-section');
    const toppingOptions = document.getElementById('toppingOptions');
    
    if (toppingVariants.length > 0 && toppingOptions) {
        if (toppingSection) toppingSection.style.display = 'block';
        toppingOptions.innerHTML = toppingVariants.map((variant, index) => `
            <span class="topping-checkbox">
                <input type="checkbox" 
                    id="topping-${index}"
                    data-topping="${variant.variantValue}" 
                    data-price="${variant.additionalPrice}">
                <label for="topping-${index}">
                    ${variant.variantName} ${variant.additionalPrice > 0 ? `(+${formatCurrency(variant.additionalPrice)})` : ''}
                </label>
            </span>
        `).join('');
    } else {
        if (toppingSection) toppingSection.style.display = 'none';
        selectedOptions.toppings = [];
    }

    setupEventListeners();
}

function selectSize(button) {
    document.querySelectorAll('.size-btn[data-size]').forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');
    selectedOptions.size = button.dataset.size;
    updateTotalPrice();
}

function selectIceLevel(button) {
    document.querySelectorAll('.size-btn[data-ice]').forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');
    selectedOptions.ice = button.dataset.ice;
}

function selectSugarLevel(button) {
    document.querySelectorAll('.size-btn[data-sugar]').forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');
    selectedOptions.sugar = button.dataset.sugar;
}

function onToppingChange(checkbox) {
    const value = checkbox.getAttribute('data-topping');
    const price = parseInt(checkbox.getAttribute('data-price')) || 0;
    if (checkbox.checked) {
        selectedOptions.toppings.push({ value, price });
    } else {
        selectedOptions.toppings = selectedOptions.toppings.filter(t => t.value !== value);
    }
    updateTotalPrice();
}

function updateQuantity(change) {
    const quantityInput = document.getElementById('quantity');
    let newValue = parseInt(quantityInput.value) + change;
    if (newValue < 1) newValue = 1;
    if (newValue > 99) newValue = 99;
    quantityInput.value = newValue;
    updateTotalPrice();
}

function updateTotalPrice() {
    if (!currentProduct) return;
    let basePrice = currentProduct.price;
    const quantity = parseInt(document.getElementById('quantity').value);
    
    if (selectedOptions.size) {
        const selectedSize = variants.find(v => v.variantType === 'size' && v.variantValue === selectedOptions.size);
        if (selectedSize) {
            basePrice += selectedSize.additionalPrice;
        }
    }
    
    let toppingTotal = 0;
    if (selectedOptions.toppings && selectedOptions.toppings.length > 0) {
        toppingTotal = selectedOptions.toppings.reduce((sum, t) => sum + t.price, 0);
    }
    const totalPrice = (basePrice + toppingTotal) * quantity;
    document.getElementById('productPrice').textContent = formatCurrency(totalPrice);
}

function toppingsEqual(a, b) {
    if (a.length !== b.length) return false;
    const sortFn = (x, y) => {
        if (x.value !== y.value) return x.value.localeCompare(y.value);
        return x.price - y.price;
    };
    const aSorted = [...a].sort(sortFn);
    const bSorted = [...b].sort(sortFn);
    
    for (let i = 0; i < aSorted.length; i++) {
        if (aSorted[i].value !== bSorted[i].value || aSorted[i].price !== bSorted[i].price) {
            return false;
        }
    }
    return true;
}

function addToOrder() {
    if (!currentProduct) {
        showNotification('Không thể thêm sản phẩm vào đơn hàng', 'error');
        return;
    }

    const quantity = parseInt(document.getElementById('quantity').textContent) || 1;
    
    let currentOrder = JSON.parse(localStorage.getItem('T2K_CURRENT_ORDER')) || {
        items: [],
        tableId: null,
        total: 0,
        note: '',
        notes: ''
    };
    
    const newItem = {
        id: currentProduct.idProduct,
        name: currentProduct.productName,
        price: currentProduct.price,
        quantity: quantity,
        options: {}
    };
    
    if (selectedOptions.size) {
        const sizeVariant = variants.find(v => v.variantType === 'size' && v.variantValue === selectedOptions.size);
        if (sizeVariant) {
            newItem.options.size = {
                name: sizeVariant.variantName,
                value: sizeVariant.variantValue,
                additionalPrice: sizeVariant.additionalPrice || 0
            };
            newItem.price += sizeVariant.additionalPrice || 0;
        }
    }
    
    if (selectedOptions.ice) {
        const iceVariant = variants.find(v => v.variantType === 'ice' && v.variantValue === selectedOptions.ice);
        if (iceVariant) {
            newItem.options.ice = {
                name: iceVariant.variantName,
                value: iceVariant.variantValue
            };
        }
    }
    
    if (selectedOptions.sugar) {
        const sugarVariant = variants.find(v => v.variantType === 'sugar' && v.variantValue === selectedOptions.sugar);
        if (sugarVariant) {
            newItem.options.sugar = {
                name: sugarVariant.variantName,
                value: sugarVariant.variantValue
            };
        }
    }
    
    if (selectedOptions.toppings && selectedOptions.toppings.length > 0) {
        newItem.options.toppings = selectedOptions.toppings.map(t => {
            const toppingVariant = variants.find(v => v.variantType === 'topping' && v.variantValue === t.value);
            newItem.price += t.price || 0;
            return {
                name: toppingVariant ? toppingVariant.variantName : t.value,
                value: t.value,
                additionalPrice: t.price || 0
            };
        });
    }
    
    const existingItemIndex = currentOrder.items.findIndex(item => 
        item.id === newItem.id && 
        JSON.stringify(item.options) === JSON.stringify(newItem.options)
    );
    
    if (existingItemIndex !== -1) {
        currentOrder.items[existingItemIndex].quantity += quantity;
    } else {
        currentOrder.items.push(newItem);
    }
    
    currentOrder.total = currentOrder.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    localStorage.setItem('T2K_CURRENT_ORDER', JSON.stringify(currentOrder));
    
    updateCartCount(currentOrder.items.reduce((sum, item) => sum + item.quantity, 0));
    
    showNotification('Đã thêm sản phẩm vào đơn hàng', 'success');
    
    setTimeout(() => {
        window.location.href = '../staff/order.html';
    }, 1000);
}

function updateCartCount(count) {
    const cartBadge = document.getElementById('cartBadge');
    if (cartBadge) {
        cartBadge.textContent = count;
        if (count > 0) {
            cartBadge.style.display = 'block';
        } else {
            cartBadge.style.display = 'none';
        }
    }
}

function setupEventListeners() {
    document.querySelectorAll('.size-btn[data-size]').forEach(button => {
        button.addEventListener('click', function() { selectSize(this); });
    });
    document.querySelectorAll('.size-btn[data-ice]').forEach(button => {
        button.addEventListener('click', function() { selectIceLevel(this); });
    });
    document.querySelectorAll('.size-btn[data-sugar]').forEach(button => {
        button.addEventListener('click', function() { selectSugarLevel(this); });
    });
    document.querySelectorAll('input[type="checkbox"][data-topping]').forEach(checkbox => {
        checkbox.addEventListener('change', function() { onToppingChange(this); });
    });
    const quantityInput = document.getElementById('quantity');
    quantityInput.addEventListener('change', () => {
        let value = parseInt(quantityInput.value);
        if (isNaN(value) || value < 1) value = 1;
        if (value > 99) value = 99;
        quantityInput.value = value;
        updateTotalPrice();
    });
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(amount);
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.right = '20px';
    notification.style.padding = '15px 25px';
    notification.style.borderRadius = '5px';
    notification.style.backgroundColor = type === 'error' ? '#f44336' : '#1abc9c';
    notification.style.color = 'white';
    notification.style.zIndex = '1000';
    notification.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
    notification.style.animation = 'slideIn 0.5s ease';
    document.body.appendChild(notification);
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.5s ease';
        setTimeout(() => notification.remove(), 500);
    }, 3000);
} 