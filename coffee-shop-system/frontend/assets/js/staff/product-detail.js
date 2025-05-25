const API_URL = 'http://localhost:8081/api';

let currentProduct = null;
let variants = [];
let selectedOptions = {
    size: null,
    ice: null,
    sugar: null,
    toppings: []
};

document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    if (productId) {
        loadProductDetails(productId);
        loadVariants();
    }
});

async function loadProductDetails(productId) {
    try {
        const response = await fetch(`${API_URL}/products/${productId}`);
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
        const response = await fetch(`${API_URL}/variants`);
        if (!response.ok) throw new Error('Failed to load variants');
        
        variants = await response.json();
        displayVariants();
    } catch (error) {
        console.error('Error loading variants:', error);
        showNotification('Không thể tải thông tin biến thể', 'error');
    }
}

function displayProductDetails(product) {
    // Update product image
    const productImage = document.getElementById('productImage');
    if (product.image) {
        productImage.src = `${API_URL}/products/images/${product.image}`;
    } else {
        productImage.src = '../assets/images/no-image.png';
    }

    // Update product info
    document.getElementById('productName').textContent = product.productName;
    document.getElementById('productCategory').textContent = product.categoryName || product.category?.categoryName || 'Chưa phân loại';
    document.getElementById('productStatus').textContent = product.isAvailable ? 'Đang bán' : 'Ngừng bán';
    document.getElementById('productStatus').className = product.isAvailable ? 'status available' : 'status unavailable';
    document.getElementById('productPrice').textContent = formatCurrency(product.price);
    document.getElementById('productDescription').textContent = product.description;
}

function displayVariants() {
    // Size
    const sizeVariants = variants.filter(v => v.variantType === 'size');
    const sizeOptions = document.getElementById('sizeOptions');
    if (sizeOptions) {
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
        // Set default
        const defaultSize = sizeVariants.find(v => v.isDefault);
        if (defaultSize) selectedOptions.size = defaultSize.variantValue;
    }
    // Ice
    const iceVariants = variants.filter(v => v.variantType === 'ice');
    const iceOptions = document.getElementById('iceOptions');
    if (iceOptions) {
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
    }
    // Sugar
    const sugarVariants = variants.filter(v => v.variantType === 'sugar');
    const sugarOptions = document.getElementById('sugarOptions');
    if (sugarOptions) {
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
    }
    // Topping
    const toppingVariants = variants.filter(v => v.variantType === 'topping');
    const toppingOptions = document.getElementById('toppingOptions');
    if (toppingOptions) {
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
    // Size price
    if (selectedOptions.size) {
        const selectedSize = variants.find(v => v.variantType === 'size' && v.variantValue === selectedOptions.size);
        if (selectedSize) {
            basePrice += selectedSize.additionalPrice;
        }
    }
    // Topping price
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
    return aSorted.every((t, i) => t.value === bSorted[i].value && t.price === bSorted[i].price);
}

function addToOrder() {
    if (!currentProduct || !selectedOptions.size) {
        showNotification('Vui lòng chọn kích cỡ sản phẩm', 'error');
        return;
    }

    // Tính toán giá dựa trên các lựa chọn
    let totalPrice = currentProduct.price;
    
    // Thêm giá của size
    const selectedSizeBtn = document.querySelector('.size-btn[data-size="' + selectedOptions.size + '"]');
    if (selectedSizeBtn) {
        totalPrice += parseFloat(selectedSizeBtn.dataset.price || 0);
    }

    // Thêm giá của topping
    if (selectedOptions.toppings && selectedOptions.toppings.length > 0) {
        totalPrice += selectedOptions.toppings.reduce((sum, t) => sum + t.price, 0);
    }

    const quantity = parseInt(document.getElementById('quantity').value);
    
    const orderItem = {
        id: currentProduct.idProduct,
        name: currentProduct.productName,
        price: totalPrice,
        quantity: quantity,
        variants: {
            size: selectedOptions.size,
            ice: selectedOptions.ice,
            sugar: selectedOptions.sugar,
            toppings: selectedOptions.toppings || []
        },
        totalPrice: totalPrice * quantity
    };

    let currentOrder = JSON.parse(localStorage.getItem('T2K_CURRENT_ORDER')) || { items: [] };
    
    // Kiểm tra xem sản phẩm với cùng biến thể đã có trong đơn hàng chưa
    const existingItemIndex = currentOrder.items.findIndex(item => {
        if (item.id !== orderItem.id) return false;
        if (!item.variants || !orderItem.variants) return false;
        const sameSize = item.variants.size === orderItem.variants.size;
        const sameIce = item.variants.ice === orderItem.variants.ice;
        const sameSugar = item.variants.sugar === orderItem.variants.sugar;
        const itemToppings = item.variants.toppings || [];
        const orderToppings = orderItem.variants.toppings || [];
        const sameToppings = toppingsEqual(itemToppings, orderToppings);
        return sameSize && sameIce && sameSugar && sameToppings;
    });

    if (existingItemIndex !== -1) {
        // Nếu sản phẩm đã tồn tại, tăng số lượng
        currentOrder.items[existingItemIndex].quantity += quantity;
        currentOrder.items[existingItemIndex].totalPrice = 
            currentOrder.items[existingItemIndex].price * currentOrder.items[existingItemIndex].quantity;
    } else {
        // Nếu là sản phẩm mới, thêm vào danh sách
        currentOrder.items.push(orderItem);
    }

    localStorage.setItem('T2K_CURRENT_ORDER', JSON.stringify(currentOrder));
    showNotification('Đã thêm sản phẩm vào đơn hàng', 'success');
    window.location.href = 'order.html';
}

function setupEventListeners() {
    // Size
    document.querySelectorAll('.size-btn[data-size]').forEach(button => {
        button.addEventListener('click', function() { selectSize(this); });
    });
    // Ice
    document.querySelectorAll('.size-btn[data-ice]').forEach(button => {
        button.addEventListener('click', function() { selectIceLevel(this); });
    });
    // Sugar
    document.querySelectorAll('.size-btn[data-sugar]').forEach(button => {
        button.addEventListener('click', function() { selectSugarLevel(this); });
    });
    // Topping
    document.querySelectorAll('input[type="checkbox"][data-topping]').forEach(checkbox => {
        checkbox.addEventListener('change', function() { onToppingChange(this); });
    });
    // Quantity
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