// cart.js - Funcionalidad del carrito
class Cart {
    constructor() {
        this.items = [];
        this.loadCart();
        this.initEventListeners();
    }

    initEventListeners() {
        // Abrir/cerrar carrito
        document.getElementById('open-cart').addEventListener('click', (e) => {
            e.preventDefault();
            this.openCart();
        });

        document.getElementById('close-cart').addEventListener('click', () => {
            this.closeCart();
        });

        document.getElementById('cart-overlay').addEventListener('click', () => {
            this.closeCart();
        });

        // Finalizar compra
        document.querySelector('.checkout-btn').addEventListener('click', () => {
            this.checkout();
        });

        // Menú móvil - carrito
        document.getElementById('mobile-cart').addEventListener('click', (e) => {
            e.preventDefault();
            this.openCart();
        });
    }

    openCart() {
        document.getElementById('cart-overlay').classList.add('active');
        document.getElementById('cart-sidebar').classList.add('active');
    }

    closeCart() {
        document.getElementById('cart-overlay').classList.remove('active');
        document.getElementById('cart-sidebar').classList.remove('active');
    }

    addItem(product) {
        const existingItem = this.items.find(item => item.id === product.id);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            this.items.push({
                ...product,
                quantity: 1
            });
        }
        
        this.saveCart();
        this.updateCartDisplay();
        this.showAddedToCartMessage(product.name);
    }

    removeItem(productId) {
        this.items = this.items.filter(item => item.id !== productId);
        this.saveCart();
        this.updateCartDisplay();
    }

    updateQuantity(productId, newQuantity) {
        if (newQuantity <= 0) {
            this.removeItem(productId);
            return;
        }

        const item = this.items.find(item => item.id === productId);
        if (item) {
            item.quantity = newQuantity;
            this.saveCart();
            this.updateCartDisplay();
        }
    }

    getTotal() {
        return this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    }

    updateCartDisplay() {
        const cartCount = document.querySelector('.cart-count');
        const mobileCartCount = document.querySelector('.mobile-cart-count');
        const cartItems = document.getElementById('cart-items');
        const cartTotal = document.getElementById('cart-total');

        // Actualizar contadores
        const totalItems = this.items.reduce((sum, item) => sum + item.quantity, 0);
        cartCount.textContent = totalItems;
        if (mobileCartCount) {
            mobileCartCount.textContent = totalItems;
        }

        // Actualizar items del carrito
        if (this.items.length === 0) {
            cartItems.innerHTML = '<div class="empty-cart"><i class="fas fa-shopping-cart"></i><p>Tu carrito está vacío</p></div>';
        } else {
            cartItems.innerHTML = this.items.map(item => `
                <div class="cart-item">
                    <div class="cart-item-image" style="background-image: url('${item.image}')"></div>
                    <div class="cart-item-details">
                        <div class="cart-item-title">${item.name}</div>
                        <div class="cart-item-price">$${item.price.toFixed(2)}</div>
                        <div class="cart-item-quantity">
                            <button class="quantity-btn minus" onclick="cart.updateQuantity(${item.id}, ${item.quantity - 1})">-</button>
                            <span>${item.quantity}</span>
                            <button class="quantity-btn plus" onclick="cart.updateQuantity(${item.id}, ${item.quantity + 1})">+</button>
                            <button class="cart-item-remove" onclick="cart.removeItem(${item.id})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');
        }

        // Actualizar total
        cartTotal.textContent = `$${this.getTotal().toFixed(2)}`;
    }

    showAddedToCartMessage(productName) {
        // Crear notificación temporal
        const notification = document.createElement('div');
        notification.className = 'cart-notification';
        notification.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <span>${productName} agregado al carrito</span>
        `;
        
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: var(--secondary);
            color: white;
            padding: 1rem 1.5rem;
            border-radius: var(--border-radius);
            box-shadow: var(--shadow-lg);
            display: flex;
            align-items: center;
            gap: 0.5rem;
            z-index: 1002;
            animation: slideInRight 0.3s ease-out;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    checkout() {
        if (this.items.length === 0) {
            alert('Tu carrito está vacío');
            return;
        }

        // Aquí iría la lógica de checkout
        alert('¡Gracias por tu compra! Total: $' + this.getTotal().toFixed(2));
        this.items = [];
        this.saveCart();
        this.updateCartDisplay();
        this.closeCart();
    }

    saveCart() {
        localStorage.setItem('superluna-cart', JSON.stringify(this.items));
    }

    loadCart() {
        const savedCart = localStorage.getItem('superluna-cart');
        if (savedCart) {
            this.items = JSON.parse(savedCart);
            this.updateCartDisplay();
        }
    }
}

// Inicializar carrito
const cart = new Cart();

// Hacer el carrito global para los event listeners
window.cart = cart;