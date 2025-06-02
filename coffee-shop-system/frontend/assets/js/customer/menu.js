document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM Fully loaded");
    function toggleCart() {
        console.log("Toggle cart function called");
        const orderPanel = document.querySelector('.order-panel');
        
        orderPanel.style.display = 'block';
        setTimeout(() => {
            orderPanel.classList.toggle('visible');
            
            if (orderPanel.classList.contains('visible')) {
                const overlay = document.createElement('div');
                overlay.className = 'cart-overlay';
                overlay.style.position = 'fixed';
                overlay.style.top = '0';
                overlay.style.left = '0';
                overlay.style.width = '100%';
                overlay.style.height = '100%';
                overlay.style.backgroundColor = 'rgba(0,0,0,0.5)';
                overlay.style.zIndex = '1000';
                document.body.appendChild(overlay);
                
                overlay.addEventListener('click', function() {
                    orderPanel.classList.remove('visible');
                    setTimeout(() => {
                        if (window.innerWidth <= 1919) {
                            orderPanel.style.display = 'none';
                        }
                    }, 300); 
                    this.remove();
                });
            } else {
                const overlay = document.querySelector('.cart-overlay');
                if (overlay) overlay.remove();
                setTimeout(() => {
                    if (window.innerWidth <= 1919) {
                        orderPanel.style.display = 'none';
                    }
                }, 300);
            }
        }, 10);
    }
    
    const toggleCartBtn = document.getElementById('toggleCartBtn');
    console.log("Toggle cart button:", toggleCartBtn);
    
    if (toggleCartBtn) {
        toggleCartBtn.addEventListener('click', function(e) {
            console.log("Toggle cart button clicked");
            e.preventDefault();
            toggleCart();
        });
    } else {
        console.error("Toggle cart button not found");
    }
    
    // Components are loaded by load-components.js
    
    if (!document.querySelector('.menu-items')) {
        const menuItems = document.createElement('div');
        menuItems.className = 'menu-items';
        document.querySelector('.menu-container').appendChild(menuItems);
    }
    
    const menuItemsContainer = document.querySelector('.menu-items');

    let cart = [];
    
    try {
        fetchCategoriesAndProducts();
        fetchTables();
    } catch (error) {
        console.error("Không thể kết nối tới API. Vui lòng kiểm tra kết nối mạng và thử lại sau.", error);
    }
    
    function fetchCategoriesAndProducts() {
        fetch(`${API.BASE_URL}${API.CATEGORIES}`)
            .then(response => response.json())
            .then(categories => {
                renderCategories(categories);
                let allProducts = [];
                categories.forEach(category => {
                    if (category.products && Array.isArray(category.products)) {
                        category.products.forEach(product => {
                            product.idCategory = category.idCategory;
                            allProducts.push(product);
                        });
                    }
                });
                displayProducts(allProducts);
                window._allProducts = allProducts;
            })
            .catch(error => {
                console.error('Lỗi khi tải danh mục và sản phẩm:', error);
            });
    }
    
    function renderCategories(categories) {
        const categoryTabsContainer = document.querySelector('.category-tabs');
        categoryTabsContainer.innerHTML = ''; 
        
        // Tạo tab "All" mặc định
        const allTab = document.createElement('button');
        allTab.className = 'category-tab active';
        allTab.textContent = 'Tất cả';
        allTab.dataset.category = 'all';
        categoryTabsContainer.appendChild(allTab);
        
        categories.forEach(category => {
            let categoryId;
            let categoryName;
            
            if (category.ID_Category !== undefined) {
                categoryId = category.ID_Category;
                categoryName = category.category_name || 'Danh mục';
            } else if (category.idCategory !== undefined) {
                categoryId = category.idCategory;
                categoryName = category.categoryName || 'Danh mục';
            } else {
                console.warn('Không tìm thấy ID danh mục:', category);
                return; 
            }
            const tab = document.createElement('button');
            tab.className = 'category-tab';
            tab.textContent = categoryName;
            tab.dataset.category = categoryId.toString();
            categoryTabsContainer.appendChild(tab);
        });

        document.querySelectorAll('.category-tab').forEach(tab => {
            tab.addEventListener('click', function() {
                console.log('Đã nhấp vào tab danh mục:', this.dataset.category);
                document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
                this.classList.add('active');
                filterItems(this.dataset.category);
            });
        });
    }
    
    function displayProducts(products) {
        const menuContainer = document.querySelector('#menuContainer');
        menuContainer.innerHTML = ''; 
        
        if (!products || products.length === 0) {
            console.warn('No products to display.');
            menuContainer.innerHTML = '<div class="no-products-message"><i class="fas fa-exclamation-circle"></i><br>Không có sản phẩm nào. Vui lòng thêm sản phẩm trước.</div>';
            return;
        }
        
        // Lọc chỉ lấy sản phẩm đang bán
        const availableProducts = products.filter(product => {
            return product.isAvailable === true || 
                   product.status === 'active' || 
                   product.status === true || 
                   product.status === 1;
        });
        
        if (availableProducts.length === 0) {
            menuContainer.innerHTML = '<div class="no-products-message"><i class="fas fa-exclamation-circle"></i><br>Hiện không có sản phẩm nào đang bán.</div>';
            return;
        }
        
        console.log(`Displaying ${availableProducts.length} available products.`);
        availableProducts.forEach((product, index) => {
            console.log('Processing product:', product);
            const item = document.createElement('div');
            item.className = 'menu-item';
            item.style.animation = `fadeIn 0.5s ease forwards ${0.1 * index}s`;
            item.style.opacity = '0';
            
           
            let categoryId = product.ID_Category || 
                            (product.category ? product.category.idCategory : null) || 
                            (product.category ? product.category.ID_Category : null);
            
            
            if (!categoryId) {
                categoryId = 1;
            }
            
            
            item.setAttribute('data-category', categoryId.toString());
            let imageUrl = '../assets/images/no-image.png';
            let imageClass = 'no-image';
            if (product.image) {
                if (typeof product.image === 'string') {
                    if (product.image.startsWith('data:image')) {
                        // Nếu là dữ liệu Base64
                        imageUrl = product.image;
                        imageClass = '';
                    } else if (product.image.startsWith('http')) {
                        // Nếu là URL đầy đủ
                        imageUrl = product.image;
                        imageClass = '';
                    } else {
                        // Nếu là tên file (định dạng mới)
                        imageUrl = `${API.BASE_URL}/products/images/${product.image}`;
                        imageClass = '';
                        console.log(`Đường dẫn ảnh mới: ${imageUrl}`);
                    }
                } else if (product.image.data) {
                    const byteArray = new Uint8Array(product.image.data);
                    let binary = '';
                    byteArray.forEach(byte => binary += String.fromCharCode(byte));
                    const base64 = btoa(binary);
                    imageUrl = `data:image/jpeg;base64,${base64}`;
                    imageClass = '';
                }
            }
            
            if (imageClass === 'no-image') {
            }
            
            const badges = ['Mới', 'Bán chạy', 'Ưu đãi'];
            const showBadge = Math.random() > 0.7;
            const badgeText = badges[Math.floor(Math.random() * badges.length)];
            
            const productName = product.productName || product.product_name;
            const description = product.description || 'Không có mô tả';
            const price = product.price;
            const productId = product.idProduct || product.ID_Product;
            
            item.innerHTML = `
                ${showBadge ? `<div class="badge">${badgeText}</div>` : ''}
                <a href="product-detail.html?id=${productId}" class="product-link" style="text-decoration: none; color: inherit; display: block;">
                    <div class="menu-item-image ${imageClass}">
                        <img src="${imageUrl}" alt="${productName}" loading="lazy" 
                            onerror="this.parentElement.className='menu-item-image no-image'; this.style.display='none';">
                    </div>
                    <div class="menu-item-info" style="padding-bottom: 70px;">
                        <div>
                            <h3>${productName}</h3>
                            <p>${description}</p>
                            <div class="menu-item-price">${price.toLocaleString('vi-VN')} đ</div>
                        </div>
                    </div>
                </a>
                <button class="add-to-cart-btn" data-id="${productId}" data-name="${productName}" data-price="${price}" style="position: absolute; bottom: 20px; left: 20px; width: calc(100% - 40px);">
                    <i class="fas fa-shopping-cart"></i> Thêm vào giỏ
                </button>
            `;
            menuContainer.appendChild(item);
            
            item.querySelector('.add-to-cart-btn').addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                this.innerHTML = '<i class="fas fa-check"></i> Đã thêm';
                this.classList.add('added');
                
                setTimeout(() => {
                    this.innerHTML = '<i class="fas fa-shopping-cart"></i> Thêm vào giỏ';
                    this.classList.remove('added');
                }, 1500);
                
                const id = this.getAttribute('data-id');
                const name = this.getAttribute('data-name');
                const price = parseFloat(this.getAttribute('data-price'));
                
                addToCartWithVariants(id, name, price);
            });
        });
    }
    
    function fetchTables() {
        console.log('Đang tải danh sách bàn...');
        try {
            if (window.CafeAPI && window.CafeAPI.getAllTables) {
                window.CafeAPI.getAllTables()
                    .then(tables => {
                        console.log('Đã nhận dữ liệu bàn từ API:', tables);
                        if (!tables || tables.length === 0) {
                            console.warn('Không có bàn nào từ API');
                            return;
                        }
                        
                        const tableSelect = document.getElementById('tableSelect');
                        tableSelect.innerHTML = '<option value="">Chọn bàn</option>';
                        
                        const availableTables = tables.filter(table => {
                            return table.status === 'Available' || table.status === 'Trống';
                        });
                        
                        if (availableTables.length === 0) {
                            console.warn('Không có bàn trống nào');
                            return;
                        }
                        
                        availableTables.forEach(table => {
                            const option = document.createElement('option');
                            option.value = table.idTable || table.ID_Table;
                            option.textContent = `Bàn ${table.tableNumber || table.number || table.idTable || table.ID_Table} (${table.location || ''} - ${table.capacity || table.Capacity || '2'} người)`;
                            tableSelect.appendChild(option);
                        });
                        
                        const takeawayOption = document.createElement('option');
                        takeawayOption.value = 'takeaway';
                        takeawayOption.textContent = 'Mang đi';
                        tableSelect.appendChild(takeawayOption);
                    })
                    .catch(error => {
                        console.error('Lỗi khi tải bàn:', error);
                    });
            } else {
                console.warn('CafeAPI.getAllTables không được tìm thấy, sử dụng fetch trực tiếp');
                fetch(`${API.BASE_URL}${API.TABLES}`, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    }
                })
                .then(response => {
                    console.log('API bàn phản hồi status:', response.status);
                    if (!response.ok) {
                        throw new Error(`HTTP error! Status: ${response.status}`);
                    }
                    return response.json();
                })
                .then(tables => handleTablesData(tables))
                .catch(error => {
                    console.error('Lỗi khi tải bàn:', error);
                });
            }
        } catch (error) {
            console.error('Lỗi khi tải bàn:', error);
        }
        
        function handleTablesData(tables) {
            console.log('Đã nhận dữ liệu bàn từ API:', tables);
            if (!tables || tables.length === 0) {
                console.warn('Không có bàn nào từ API');
                return;
            }
            
            const tableSelect = document.getElementById('tableSelect');
            tableSelect.innerHTML = '<option value="">Chọn bàn</option>';
            
            const availableTables = tables.filter(table => {
                return table.status === 'Available' || table.status === 'Trống';
            });
            
            if (availableTables.length === 0) {
                console.warn('Không có bàn trống nào');
                return;
            }
            
            availableTables.forEach(table => {
                const option = document.createElement('option');
                option.value = table.idTable || table.ID_Table;
                option.textContent = `Bàn ${table.tableNumber || table.number || table.idTable || table.ID_Table} (${table.location || ''} - ${table.capacity || table.Capacity || '2'} người)`;
                tableSelect.appendChild(option);
            });
            
            const takeawayOption = document.createElement('option');
            takeawayOption.value = 'takeaway';
            takeawayOption.textContent = 'Mang đi';
            tableSelect.appendChild(takeawayOption);
        }
    }
    
    function filterItems(category) {
        if (!window._allProducts) return;
        
        // Lọc sản phẩm theo trạng thái đang bán
        const availableProducts = window._allProducts.filter(product => {
            return product.isAvailable === true || 
                   product.status === 'active' || 
                   product.status === true || 
                   product.status === 1;
        });
        
        // Lọc theo danh mục từ danh sách sản phẩm đang bán
        const filteredProducts = category === 'all' 
            ? availableProducts 
            : availableProducts.filter(product => {
                const productCategoryId = product.idCategory || 
                                        (product.category ? product.category.idCategory : null) || 
                                        (product.category ? product.category.ID_Category : null);
                return productCategoryId && productCategoryId.toString() === category;
            });
        
        displayProducts(filteredProducts);
    }
    
    function getCart() {
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
            return JSON.parse(savedCart);
        }
        
        return cart || [];
    }
    
    function addToCartWithVariants(id, name, price) {
        const cartItems = getCart();
        
        const cartItem = {
            id: id,
            name: name,
            basePrice: price,
            price: price, 
            quantity: 1,
            variants: {
                size: 'S',
                ice: '100', 
                sugar: '100', 
                toppings: [] 
            },
            totalPrice: price
        };

        const existingItemIndex = cartItems.findIndex(item => {
            if (item.id != cartItem.id) return false;
            
            if (!item.variants) return true;
            
            const sameSize = item.variants.size === cartItem.variants.size;
            const sameIce = item.variants.ice === cartItem.variants.ice;
            const sameSugar = item.variants.sugar === cartItem.variants.sugar;
            const noToppings = (!item.variants.toppings || item.variants.toppings.length === 0) && 
                              cartItem.variants.toppings.length === 0;
            
            return sameSize && sameIce && sameSugar && noToppings;
        });

        if (existingItemIndex !== -1) {
            cartItems[existingItemIndex].quantity += 1;
            cartItems[existingItemIndex].totalPrice = cartItems[existingItemIndex].price * cartItems[existingItemIndex].quantity;
        } else {
            cartItems.push(cartItem);
        }

        localStorage.setItem('cart', JSON.stringify(cartItems));
        
        cart = cartItems;
        
        updateCartDisplay();
    }
    
    function updateCartDisplay() {
        const cartItems = getCart();
        const cartItemsPreview = document.getElementById('cartItemsPreview');
        const cartCountBadge = document.getElementById('cartCountBadge');
        const mobileCartCount = document.getElementById('mobileCartCount');
        const orderTotal = document.getElementById('orderTotal');
        
        const itemCount = cartItems.reduce((total, item) => total + item.quantity, 0);
        cartCountBadge.textContent = itemCount;
        
        if (mobileCartCount) {
            mobileCartCount.textContent = itemCount;
        }
        
        if (cartItems.length === 0) {
            cartItemsPreview.innerHTML = `
                <p style="text-align: center; color: #7f8c8d; padding: 20px 0;">
                    <i class="fas fa-shopping-basket" style="font-size: 2rem; color: #ddd; display: block; margin-bottom: 10px;"></i>
                    Giỏ hàng trống
                </p>
            `;
            orderTotal.textContent = '0 đ';
            return;
        }
        
        let cartHTML = '';
        let totalAmount = 0;
        
        cartItems.forEach(item => {
            const itemTotal = item.price * item.quantity;
            totalAmount += itemTotal;
            
            cartHTML += `
                <div class="cart-item" data-id="${item.id}">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-quantity">
                        <button class="quantity-btn decrease-btn" data-id="${item.id}">-</button>
                        <span>${item.quantity}</span>
                        <button class="quantity-btn increase-btn" data-id="${item.id}">+</button>
                    </div>
                    <div class="cart-item-price">${formatPrice(itemTotal).replace(' đ', '')}</div>
                    <button class="remove-item-btn" data-id="${item.id}" title="Xóa sản phẩm">×</button>
                </div>
            `;
        });
        
        cartItemsPreview.innerHTML = cartHTML;
        orderTotal.textContent = formatPrice(totalAmount);
        
        document.querySelectorAll('.increase-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                updateItemQuantity(id, 1);
            });
        });
        
        document.querySelectorAll('.decrease-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                updateItemQuantity(id, -1);
            });
        });
        
        document.querySelectorAll('.remove-item-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                removeFromCart(id);
            });
        });
    }
    
    function formatPrice(price) {
        return price.toLocaleString('vi-VN') + ' đ';
    }
    
    function updateItemQuantity(id, change) {
        const cartItems = getCart();
        const item = cartItems.find(item => item.id === id);
        
        if (item) {
            item.quantity += change;
            
            if (item.quantity <= 0) {
                removeFromCart(id);
            } else {
                localStorage.setItem('cart', JSON.stringify(cartItems));
                cart = cartItems;
                updateCartDisplay();
            }
        }
    }
    
    function removeFromCart(id) {
        const cartItems = getCart();
        const updatedCart = cartItems.filter(item => item.id !== id);
        localStorage.setItem('cart', JSON.stringify(updatedCart));
        cart = updatedCart;
        updateCartDisplay();
    }
      const proceedBtn = document.getElementById('proceedBtn');
    if (proceedBtn) {
        proceedBtn.addEventListener('click', function() {
            // Check if cart has items
            const cartItems = JSON.parse(localStorage.getItem('cart') || '[]');
            if (cartItems.length === 0) {
                alert('Giỏ hàng của bạn đang trống!');
                return;
            }
            
            // Get table ID (optional - can be empty for takeaway)
            const tableId = document.getElementById('tableSelect').value;
            
            // Save selected table (can be empty)
            localStorage.setItem('selectedTable', tableId || '');
            
            // Proceed to checkout
            window.location.href = "checkout.html";
        });
    } else {
        console.error('Không tìm thấy nút THANH TOÁN (proceedBtn)');
    }
    
    updateCartDisplay();
    
    document.getElementById('clearCartBtn').addEventListener('click', function() {
        if (confirm('Bạn có chắc muốn xóa toàn bộ giỏ hàng?')) {
            localStorage.removeItem('cart');
            cart = [];
            updateCartDisplay();
        }
    });

    function checkScreenSize() {
        const orderPanel = document.querySelector('.order-panel');
        const toggleCartBtn = document.getElementById('toggleCartBtn');
        
        if (window.innerWidth <= 1919) {
            toggleCartBtn.style.display = 'flex';
            
            if (!orderPanel.classList.contains('visible')) {
                orderPanel.style.display = 'none';
            }
        }
    }
    
    checkScreenSize();
    
    window.addEventListener('resize', checkScreenSize);

    function updateCartCountDisplay() {
        const cartCount = document.querySelector('.cart-count');
        const itemCount = cart.reduce((total, item) => total + item.quantity, 0);
        cartCount.textContent = itemCount;
    }

    document.addEventListener('DOMContentLoaded', function() {
        loadComponent('header.html', 'header-container');
        loadComponent('footer.html', 'footer-container');
        
        loadMenuData();
        
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
            cart = JSON.parse(savedCart);
            displayCart();
            calculateTotal();
            updateCartCountDisplay();
        }

        setTimeout(() => {
            document.querySelector('.category-tab').click();
        }, 500);
        
        const mediaQuery = window.matchMedia('(max-width: 1700px)');
        if (mediaQuery.matches) {
            const orderPanel = document.querySelector('.order-panel');
            const toggleCartBtn = document.querySelector('.toggle-cart');
            
            orderPanel.style.display = 'none';
            toggleCartBtn.style.display = 'flex';
        }
    });

    function updateCart(item, quantity) {
        const existingItem = cart.find(cartItem => cartItem.id === item.id);
        
        if (existingItem) {
            if (existingItem.quantity + quantity <= 0) {
                cart = cart.filter(cartItem => cartItem.id !== item.id);
            } else {
                existingItem.quantity += quantity;
            }
        } else if (quantity > 0) {
            cart.push({
                id: item.id,
                name: item.name,
                price: item.price,
                quantity: quantity
            });
        }
        
        updateCartCountDisplay();
        displayCart();
        calculateTotal();
        
        localStorage.setItem('cart', JSON.stringify(cart));
    }

    function displayCart() {
        const cartItems = getCart();
        const cartItemsPreview = document.getElementById('cartItemsPreview');
        
        if (cartItems.length === 0) {
            cartItemsPreview.innerHTML = `
                <p style="text-align: center; color: #7f8c8d; padding: 20px 0;">
                    <i class="fas fa-shopping-basket" style="font-size: 2rem; color: #ddd; display: block; margin-bottom: 10px;"></i>
                    Giỏ hàng trống
                </p>
            `;
            return;
        }
        
        let cartHTML = '';
        
        cartItems.forEach(item => {
            cartHTML += `
                <div class="cart-item" data-id="${item.id}">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-quantity">
                        <button class="quantity-btn decrease-btn" data-id="${item.id}">-</button>
                        <span>${item.quantity}</span>
                        <button class="quantity-btn increase-btn" data-id="${item.id}">+</button>
                    </div>
                    <div class="cart-item-price">${(item.price * item.quantity).toLocaleString('vi-VN')}</div>
                    <button class="remove-item-btn" data-id="${item.id}" title="Xóa sản phẩm">×</button>
                </div>
            `;
        });
        
        cartItemsPreview.innerHTML = cartHTML;
        
        document.querySelectorAll('.increase-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                const item = cartItems.find(item => item.id === id);
                if (item) updateCart(item, 1);
            });
        });
        
        document.querySelectorAll('.decrease-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                const item = cartItems.find(item => item.id === id);
                if (item) updateCart(item, -1);
            });
        });
        
        document.querySelectorAll('.remove-item-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                removeFromCart(id);
            });
        });
    }
    
    function calculateTotal() {
        const cartItems = getCart();
        const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const orderTotal = document.getElementById('orderTotal');
        
        if (orderTotal) {
            orderTotal.textContent = formatPrice(total);
        }
    }
    
    function loadMenuData() {
        document.getElementById('menuContainer').innerHTML = `
            <div class="loading">
                <i class="fas fa-spinner"></i> Đang tải sản phẩm...
            </div>
        `;
        
        try {
            fetchCategoriesAndProducts();
        } catch (error) {
            console.error("Error loading menu data:", error);
        }
    }
});

function clearCart() {
    localStorage.removeItem('cart');
    cart = [];
    updateCartDisplay();
}

function addToCart(id, name, price) {
    
    addToCartWithVariants(id, name, price);
}