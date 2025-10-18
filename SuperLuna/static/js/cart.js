// cart.js - Funcionalidad del carrito
class Cart {
    constructor() {
        this.items = [];
        this.loadCart();
        this.initEventListeners();
    }

    initEventListeners() {
        // Abrir/cerrar carrito
        const openCartBtn = document.getElementById('open-cart');
        const closeCartBtn = document.getElementById('close-cart');
        const cartOverlay = document.getElementById('cart-overlay');
        const checkoutBtn = document.querySelector('.checkout-btn');
        const mobileCartBtn = document.getElementById('mobile-cart');

        if (openCartBtn) {
            openCartBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.openCart();
            });
        }

        if (closeCartBtn) {
            closeCartBtn.addEventListener('click', () => {
                this.closeCart();
            });
        }

        if (cartOverlay) {
            cartOverlay.addEventListener('click', () => {
                this.closeCart();
            });
        }

        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', () => {
                this.checkout();
            });
        }

        if (mobileCartBtn) {
            mobileCartBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.openCart();
            });
        }

        // Cerrar con ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeCart();
            }
        });
    }

    openCart() {
        const cartOverlay = document.getElementById('cart-overlay');
        const cartSidebar = document.getElementById('cart-sidebar');
        
        if (cartOverlay && cartSidebar) {
            cartOverlay.classList.add('active');
            cartSidebar.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    closeCart() {
        const cartOverlay = document.getElementById('cart-overlay');
        const cartSidebar = document.getElementById('cart-sidebar');
        
        if (cartOverlay && cartSidebar) {
            cartOverlay.classList.remove('active');
            cartSidebar.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    async addItem(product) {
        try {
            // Verificar stock antes de agregar
            const response = await fetch(`/api/products/${product.id}`);
            const data = await response.json();
            
            if (data.success && data.product) {
                const productData = data.product;
                
                const existingItem = this.items.find(item => item.id === product.id);
                
                if (existingItem) {
                    const newQuantity = existingItem.quantity + 1;
                    if (newQuantity > productData.stock) {
                        this.showMessage(`Solo hay ${productData.stock} unidades disponibles`, 'warning');
                        return false;
                    }
                    existingItem.quantity = newQuantity;
                } else {
                    if (productData.stock < 1) {
                        this.showMessage('Producto sin stock disponible', 'warning');
                        return false;
                    }
                    this.items.push({
                        id: product.id,
                        name: product.name,
                        price: product.price,
                        icon: product.icon || '',
                        stock: productData.stock,
                        quantity: 1,
                        category: product.category_name || 'Sin categoría'
                    });
                }
                
                this.saveCart();
                this.updateCartDisplay();
                this.showAddedToCartMessage(product.name);
                return true;
            }
        } catch (error) {
            console.error('Error adding item to cart:', error);
            this.showMessage('Error al agregar producto al carrito', 'error');
            return false;
        }
    }

    removeItem(productId) {
        this.items = this.items.filter(item => item.id !== productId);
        this.saveCart();
        this.updateCartDisplay();
        this.showMessage('Producto eliminado del carrito', 'info');
    }

    updateQuantity(productId, newQuantity) {
        if (newQuantity <= 0) {
            this.removeItem(productId);
            return;
        }

        const item = this.items.find(item => item.id === productId);
        if (item) {
            if (newQuantity > item.stock) {
                this.showMessage(`Solo hay ${item.stock} unidades disponibles`, 'warning');
                return;
            }
            item.quantity = newQuantity;
            this.saveCart();
            this.updateCartDisplay();
        }
    }

    getTotal() {
        return this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    }

    getTotalItems() {
        return this.items.reduce((sum, item) => sum + item.quantity, 0);
    }

    updateCartDisplay() {
        const cartCount = document.querySelector('.cart-count');
        const mobileCartCount = document.querySelector('.mobile-cart-count');
        const cartItems = document.getElementById('cart-items');
        const cartTotal = document.getElementById('cart-total');
        const checkoutBtn = document.querySelector('.checkout-btn');

        // Actualizar contadores
        const totalItems = this.getTotalItems();
        if (cartCount) {
            cartCount.textContent = totalItems;
            cartCount.style.display = totalItems > 0 ? 'flex' : 'none';
        }
        
        if (mobileCartCount) {
            mobileCartCount.textContent = totalItems;
            mobileCartCount.style.display = totalItems > 0 ? 'flex' : 'none';
        }

        // Actualizar items del carrito
        if (cartItems) {
            if (this.items.length === 0) {
                cartItems.innerHTML = `
                    <div class="empty-cart-state">
                        <div class="empty-cart-icon">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                                <path d="M3 3H5L5.4 5M7 13H17L21 5H5.4M7 13L5.4 5M7 13L4.7 15.3C4.3 15.7 4.6 16.4 5.2 16.4H17M17 13V16.4M9 21C9 21.6 8.6 22 8 22C7.4 22 7 21.6 7 21C7 20.4 7.4 20 8 20C8.6 20 9 20.4 9 21ZM17 21C17 21.6 16.6 22 16 22C15.4 22 15 21.6 15 21C15 20.4 15.4 20 16 20C16.6 20 17 20.4 17 21Z" 
                                    stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </div>
                        <h3>Tu carrito está vacío</h3>
                        <p>Agrega algunos productos para comenzar</p>
                    </div>
                `;
            } else {
                cartItems.innerHTML = this.items.map(item => `
                    <div class="cart-item" data-product-id="${item.id}">
                        <div class="cart-item-image">
                            <span class="cart-item-icon">${item.icon}</span>
                        </div>
                        
                        <div class="cart-item-details">
                            <h4 class="cart-item-name">${item.name}</h4>
                            <p class="cart-item-category">${item.category}</p>
                            <div class="cart-item-price">$${item.price} c/u</div>
                        </div>
                        
                        <div class="cart-item-controls">
                            <button class="quantity-btn minus" onclick="cart.updateQuantity(${item.id}, ${item.quantity - 1})">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                    <path d="M5 12H19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                </svg>
                            </button>
                            
                            <span class="cart-item-quantity">${item.quantity}</span>
                            
                            <button class="quantity-btn plus" onclick="cart.updateQuantity(${item.id}, ${item.quantity + 1})" 
                                    ${item.quantity >= item.stock ? 'disabled' : ''}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                    <path d="M12 5V19M5 12H19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                </svg>
                            </button>
                        </div>
                        
                        <div class="cart-item-total">
                            $${(item.price * item.quantity).toFixed(2)}
                        </div>
                        
                        <button class="cart-item-remove" onclick="cart.removeItem(${item.id})">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                            </svg>
                        </button>
                    </div>
                `).join('');
            }
        }

        // Actualizar total
        if (cartTotal) {
            cartTotal.textContent = `$${this.getTotal().toFixed(2)}`;
        }

        // Actualizar estado del botón de checkout
        if (checkoutBtn) {
            checkoutBtn.disabled = this.items.length === 0;
        }
    }

    showAddedToCartMessage(productName) {
        const notification = document.createElement('div');
        notification.className = 'cart-notification';
        notification.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" 
                    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>${productName} agregado al carrito</span>
        `;
        
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: #10b981;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            display: flex;
            align-items: center;
            gap: 8px;
            z-index: 1002;
            animation: slideInRight 0.3s ease-out;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }, 3000);
    }

    showMessage(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `cart-message ${type}`;
        notification.textContent = message;
        
        const colors = {
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6'
        };
        
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: ${colors[type] || colors.info};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 1002;
            animation: slideInRight 0.3s ease-out;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }, 3000);
    }

    checkout() {
        if (this.items.length === 0) {
            this.showMessage('Tu carrito está vacío', 'warning');
            return;
        }

        // Simular proceso de checkout
        this.showMessage('Procesando tu pedido...', 'info');
        
        setTimeout(() => {
            const total = this.getTotal();
            this.showMessage(`¡Gracias por tu compra! Total: $${total.toFixed(2)}`, 'success');
            
            // Limpiar carrito después de checkout exitoso
            this.items = [];
            this.saveCart();
            this.updateCartDisplay();
            this.closeCart();
        }, 2000);
    }

    saveCart() {
        localStorage.setItem('superluna_cart', JSON.stringify(this.items));
    }

    loadCart() {
        try {
            const savedCart = localStorage.getItem('superluna_cart');
            if (savedCart) {
                this.items = JSON.parse(savedCart);
                this.updateCartDisplay();
            }
        } catch (error) {
            console.error('Error loading cart from localStorage:', error);
            this.items = [];
            this.saveCart();
        }
    }

    clearCart() {
        this.items = [];
        this.saveCart();
        this.updateCartDisplay();
        this.showMessage('Carrito limpiado', 'info');
    }

    // Método para obtener resumen del carrito
    getSummary() {
        return {
            items: this.items,
            total: this.getTotal(),
            totalItems: this.getTotalItems()
        };
    }
}

// Inicializar carrito cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    const cart = new Cart();
    window.cart = cart;
    
    console.log('Carrito inicializado');
});


if (typeof module !== 'undefined' && module.exports) {
    module.exports = Cart;
}