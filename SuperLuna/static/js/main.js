    // main.js - ARCHIVO COMPLETO Y FUNCIONAL
    class SuperLunaApp {
        constructor() {
            this.currentCategory = null;
            this.products = [];
            this.categories = [];
            this.categoryMap = {};
            this.cart = null;
            this.init();
        }

        async init() {
            console.log('🚀 Inicializando SuperLuna App...');
            
            try {
                // Inicializar componentes en el orden correcto
                this.initEventListeners();
                this.initCart();
                this.initNavigation();
                
                // Cargar datos iniciales
                await this.loadInitialData();
                
                console.log('✅ SuperLuna App inicializada correctamente');
            } catch (error) {
                console.error('❌ Error inicializando la app:', error);
            }
        }

        initEventListeners() {
            console.log('🔗 Inicializando event listeners...');
            
            // Carrito
            const openCartBtn = document.getElementById('open-cart');
            const closeCartBtn = document.getElementById('close-cart');
            const cartOverlay = document.getElementById('cart-overlay');
            
            if (openCartBtn) {
                openCartBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.cart.openCart();
                });
            }
            
            if (closeCartBtn) {
                closeCartBtn.addEventListener('click', () => {
                    this.cart.closeCart();
                });
            }
            
            if (cartOverlay) {
                cartOverlay.addEventListener('click', () => {
                    this.cart.closeCart();
                });
            }

            // Menú móvil
            const menuToggle = document.getElementById('menu-toggle');
            const mobileMenu = document.getElementById('mobile-menu');
            
            if (menuToggle && mobileMenu) {
                menuToggle.addEventListener('click', () => {
                    mobileMenu.classList.toggle('active');
                    console.log('📱 Menú móvil toggled');
                });
            }

            // Búsqueda
            this.initSearch();
        }

        initSearch() {
            const searchInput = document.querySelector('.search-bar input');
            const searchButton = document.querySelector('.search-bar button');
            
            if (searchInput && searchButton) {
                const performSearch = () => {
                    const searchTerm = searchInput.value.trim().toLowerCase();
                    if (searchTerm) {
                        this.showNotification(`Buscando: ${searchTerm}`, 'info');
                        // Aquí iría la lógica de búsqueda real
                    }
                };
                
                searchButton.addEventListener('click', performSearch);
                searchInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') performSearch();
                });
            }
        }

        initNavigation() {
            console.log('🧭 Inicializando navegación...');
            
            const navLinks = document.querySelectorAll('.nav-link');
            const categoryLinks = document.querySelectorAll('.category-link');
            const mobileMenuItems = document.querySelectorAll('.mobile-menu-item');
            
            // Navegación desktop
            navLinks.forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const sectionId = e.target.getAttribute('data-section');
                    this.navigateToSection(sectionId);
                });
            });
            
            // Enlaces de categorías
            categoryLinks.forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const sectionId = e.target.getAttribute('data-section');
                    this.navigateToSection(sectionId);
                });
            });

            // Menú móvil
            mobileMenuItems.forEach(item => {
                item.addEventListener('click', (e) => {
                    e.preventDefault();
                    const sectionId = e.currentTarget.getAttribute('data-section');
                    if (sectionId) {
                        this.navigateToSection(sectionId);
                        document.getElementById('mobile-menu').classList.remove('active');
                    }
                });
            });

            // Manejar URLs con hash
            window.addEventListener('hashchange', () => {
                const hash = window.location.hash.substring(1);
                if (hash) {
                    this.navigateToSection(hash);
                }
            });
            
            // Cargar sección desde URL al inicio
            const initialHash = window.location.hash.substring(1);
            if (initialHash) {
                this.navigateToSection(initialHash);
            }
        }

        navigateToSection(sectionId) {
            console.log(`🔄 Navegando a sección: ${sectionId}`);
            
            // Ocultar todas las secciones
            document.querySelectorAll('.content-section').forEach(section => {
                section.classList.remove('active');
            });
            
            // Mostrar sección objetivo
            const targetSection = document.getElementById(sectionId);
            if (targetSection) {
                targetSection.classList.add('active');
                
                // Scroll suave
                targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                
                // Actualizar navegación activa
                document.querySelectorAll('.nav-link').forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('data-section') === sectionId) {
                        link.classList.add('active');
                    }
                });
                
                console.log(`✅ Sección ${sectionId} activada`);
            } else {
                console.warn(`❌ Sección ${sectionId} no encontrada`);
            }
        }

        initCart() {
            console.log('🛒 Inicializando carrito...');
            this.cart = new Cart();
        }

        async loadInitialData() {
            try {
                console.log('📦 Cargando datos iniciales...');
                
                // Cargar categorías
                const categoriesResponse = await fetch('/api/categories');
                if (!categoriesResponse.ok) throw new Error(`Error HTTP: ${categoriesResponse.status}`);
                
                const categoriesData = await categoriesResponse.json();
                console.log('📊 Respuesta categorías:', categoriesData);
                
                if (categoriesData.success) {
                    this.categories = categoriesData.categories;
                    this.buildCategoryMap();
                    console.log(`✅ ${this.categories.length} categorías cargadas`);
                }

                // Cargar productos
                const productsResponse = await fetch('/api/products');
                if (!productsResponse.ok) throw new Error(`Error HTTP: ${productsResponse.status}`);
                
                const productsData = await productsResponse.json();
                console.log('📊 Respuesta productos:', productsData);
                
                if (productsData.success) {
                    this.products = productsData.products;
                    console.log(`✅ ${this.products.length} productos cargados`);
                    
                    // Renderizar productos
                    this.renderAllProducts();
                }

                // Cargar ofertas del día
                await this.loadDailyOffers();

            } catch (error) {
                console.error('❌ Error cargando datos:', error);
                this.showErrorState();
            }
        }

        buildCategoryMap() {
            this.categoryMap = {};
            this.categories.forEach(category => {
                this.categoryMap[category.id] = category.slug;
            });
            console.log('🗺️ Mapa de categorías:', this.categoryMap);
        }

        renderAllProducts() {
            console.log('🎨 Renderizando productos...');
            
            if (this.products.length === 0) {
                this.showNoProductsMessage();
                return;
            }

            // Renderizar por categoría
            this.categories.forEach(category => {
                this.renderCategoryProducts(category);
            });

            // Renderizar ofertas
            this.renderOffers();
            
            console.log('✅ Productos renderizados');
        }

        renderCategoryProducts(category) {
            const sectionId = `${category.slug}-grid`;
            const section = document.getElementById(sectionId);
            
            if (!section) {
                console.warn(`❌ Sección no encontrada: ${sectionId}`);
                return;
            }

            const categoryProducts = this.products.filter(product => 
                product.category_id === category.id && product.is_active !== false
            );

            console.log(`📊 ${categoryProducts.length} productos para ${category.name}`);

            if (categoryProducts.length === 0) {
                section.innerHTML = this.getEmptyCategoryHTML(category.name);
                return;
            }

            section.innerHTML = categoryProducts.map(product => this.getProductHTML(product)).join('');
        }

        getProductHTML(product) {
            const hasDiscount = product.original_price > product.price;
            const discountPercent = hasDiscount ? 
                Math.round((1 - product.price / product.original_price) * 100) : 0;
            
            const stockPercentage = Math.min((product.stock / 50) * 100, 100);
            const isLowStock = product.stock <= 10;

            return `
                <div class="product-card" data-product-id="${product.id}">
                    <div class="product-badge-container">
                        ${product.is_daily_offer ? '<span class="product-badge offer">🔥 Oferta</span>' : ''}
                        ${isLowStock ? '<span class="product-badge low-stock">⚠️ Poco Stock</span>' : ''}
                    </div>
                    
                    <div class="product-image">
                        <span class="product-icon">${product.icon || '📦'}</span>
                    </div>
                    
                    <div class="product-info">
                        <h3 class="product-name">${product.name}</h3>
                        <p class="product-description">${product.description || 'Producto de calidad premium'}</p>
                        
                        <div class="product-pricing">
                            ${hasDiscount ? `
                                <div class="price-original">$${product.original_price}</div>
                                <div class="price-discount">-${discountPercent}%</div>
                            ` : ''}
                            <div class="price-current">$${product.price}</div>
                        </div>
                        
                        <div class="product-stock">
                            <span class="stock-text">Stock: ${product.stock} unidades</span>
                            <div class="stock-bar">
                                <div class="stock-progress" style="width: ${stockPercentage}%"></div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="product-actions">
                        <button class="btn-add-cart" onclick="superLunaApp.addToCart(${product.id})" 
                                ${product.stock === 0 ? 'disabled' : ''}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M3 3H5L5.4 5M7 13H17L21 5H5.4M7 13L5.4 5M7 13L4.7 15.3C4.3 15.7 4.6 16.4 5.2 16.4H17M17 13V16.4M9 21C9 21.6 8.6 22 8 22C7.4 22 7 21.6 7 21C7 20.4 7.4 20 8 20C8.6 20 9 20.4 9 21ZM17 21C17 21.6 16.6 22 16 22C15.4 22 15 21.6 15 21C15 20.4 15.4 20 16 20C16.6 20 17 20.4 17 21Z" 
                                    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            ${product.stock === 0 ? 'Sin Stock' : 'Agregar'}
                        </button>
                    </div>
                </div>
            `;
        }

        getEmptyCategoryHTML(categoryName) {
            return `
                <div class="empty-products">
                    <div class="empty-icon">📦</div>
                    <h3>No hay productos en ${categoryName}</h3>
                    <p>Pronto tendremos nuevos productos en esta categoría</p>
                </div>
            `;
        }

        renderOffers() {
            const offersSection = document.getElementById('offers-grid');
            if (!offersSection) return;

            const offers = this.products.filter(product => 
                product.is_daily_offer && product.is_active !== false
            );

            console.log(`🔥 ${offers.length} ofertas especiales`);

            if (offers.length === 0) {
                offersSection.innerHTML = `
                    <div class="empty-offers">
                        <div class="empty-icon">🔥</div>
                        <h3>No hay ofertas disponibles</h3>
                        <p>Vuelve pronto para descubrir nuestras promociones</p>
                    </div>
                `;
                return;
            }

            offersSection.innerHTML = offers.map(product => this.getOfferHTML(product)).join('');
        }

        getOfferHTML(product) {
            const hasDiscount = product.original_price > product.price;
            const discountPercent = hasDiscount ? 
                Math.round((1 - product.price / product.original_price) * 100) : 0;
            const savings = hasDiscount ? (product.original_price - product.price).toFixed(2) : 0;

            return `
                <div class="offer-card" data-product-id="${product.id}">
                    <div class="offer-badge">OFERTA ESPECIAL</div>
                    
                    <div class="offer-content">
                        <div class="offer-image">
                            <span class="offer-icon">${product.icon || '🔥'}</span>
                        </div>
                        
                        <div class="offer-info">
                            <h3 class="offer-name">${product.name}</h3>
                            <p class="offer-description">${product.description || 'Oferta limitada por tiempo'}</p>
                            
                            <div class="offer-pricing">
                                ${hasDiscount ? `
                                    <div class="offer-original">$${product.original_price}</div>
                                ` : ''}
                                <div class="offer-current">$${product.price}</div>
                                ${hasDiscount ? `
                                    <div class="offer-discount">-${discountPercent}%</div>
                                ` : ''}
                            </div>
                            
                            ${hasDiscount ? `
                                <div class="offer-save">
                                    Ahorras: $${savings}
                                </div>
                            ` : ''}
                        </div>
                    </div>
                    
                    <button class="btn-offer-add" onclick="superLunaApp.addToCart(${product.id})" 
                            ${product.stock === 0 ? 'disabled' : ''}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                            <path d="M12 6V12M12 12V18M12 12H18M12 12H6" 
                                stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                        ${product.stock === 0 ? 'Sin Stock' : 'Agregar al Carrito'}
                    </button>
                </div>
            `;
        }

        async loadDailyOffers() {
            try {
                const response = await fetch('/api/offers/daily');
                const data = await response.json();
                
                if (data.success) {
                    this.renderDailyOffers(data.offers);
                }
            } catch (error) {
                console.error('Error loading daily offers:', error);
            }
        }

        renderDailyOffers(offers) {
            const dailyOffersGrid = document.getElementById('daily-offers-grid');
            if (!dailyOffersGrid) return;

            if (!offers || offers.length === 0) {
                dailyOffersGrid.innerHTML = `
                    <div class="empty-daily-offers">
                        <p>No hay ofertas del día disponibles</p>
                    </div>
                `;
                return;
            }

            dailyOffersGrid.innerHTML = offers.map(offer => `
                <div class="daily-offer-card">
                    <div class="daily-offer-tag">OFERTA DEL DÍA</div>
                    
                    <div class="daily-offer-content">
                        <div class="daily-offer-img">
                            <span class="daily-offer-icon">${offer.icon}</span>
                        </div>
                        
                        <div class="daily-offer-info">
                            <h4 class="daily-offer-name">${offer.name}</h4>
                            
                            <div class="daily-offer-prices">
                                <span class="original-price">$${offer.original_price}</span>
                                <span class="discounted-price">$${offer.price}</span>
                                <span class="discount-badge">-${offer.discount}%</span>
                            </div>
                            
                            <div class="daily-offer-save">
                                Ahorras: $${(offer.original_price - offer.price).toFixed(2)}
                            </div>
                            
                            <div class="daily-offer-stock">
                                <div class="stock-info">
                                    <span>Disponible: ${offer.stock} unidades</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <button class="daily-offer-btn" onclick="superLunaApp.addToCart(${offer.id})">
                        Agregar al Carrito
                    </button>
                </div>
            `).join('');
        }

        async addToCart(productId) {
            const success = await this.cart.addToCart(productId, 1);
            if (success) {
                this.showNotification('Producto agregado al carrito', 'success');
            } else {
                this.showNotification('Error al agregar el producto', 'error');
            }
        }

        showNoProductsMessage() {
            const sections = ['frutas-verduras-grid', 'carnes-pescados-grid', 'lacteos-huevos-grid', 'despensa-grid', 'bebidas-grid', 'offers-grid'];
            
            sections.forEach(sectionId => {
                const section = document.getElementById(sectionId);
                if (section) {
                    section.innerHTML = `
                        <div class="empty-products">
                            <div class="empty-icon">😔</div>
                            <h3>No hay productos disponibles</h3>
                            <p>No se pudieron cargar los productos del catálogo</p>
                            <button class="btn-retry" onclick="superLunaApp.loadInitialData()">
                                🔄 Reintentar
                            </button>
                        </div>
                    `;
                }
            });
        }

        showErrorState() {
            const mainSections = document.querySelectorAll('.container-products');
            mainSections.forEach(section => {
                section.innerHTML = `
                    <div class="empty-products error">
                        <div class="empty-icon">❌</div>
                        <h3>Error al cargar productos</h3>
                        <p>No se pudo conectar con el servidor</p>
                        <button class="btn-retry" onclick="superLunaApp.loadInitialData()">
                            🔄 Reintentar
                        </button>
                    </div>
                `;
            });
        }

        showNotification(message, type = 'info') {
            const notification = document.createElement('div');
            notification.className = `notification ${type}`;
            notification.innerHTML = `
                <span class="notification-message">${message}</span>
                <button class="notification-close">&times;</button>
            `;
            
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
                color: white;
                padding: 12px 20px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                z-index: 10000;
                display: flex;
                align-items: center;
                gap: 10px;
                animation: slideInRight 0.3s ease;
            `;
            
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.style.animation = 'slideOutRight 0.3s ease';
                setTimeout(() => notification.remove(), 300);
            }, 3000);
            
            notification.querySelector('.notification-close').addEventListener('click', () => {
                notification.remove();
            });
        }
    }

    // Clase Cart - INCLUIDA EN EL MISMO ARCHIVO
    class Cart {
        constructor() {
            this.items = JSON.parse(localStorage.getItem('superluna_cart')) || [];
            this.init();
        }

        init() {
            this.updateCartUI();
        }

        async addToCart(productId, quantity = 1) {
            try {
                const response = await fetch(`/api/products/${productId}`);
                const data = await response.json();
                
                if (data.success && data.product) {
                    const product = data.product;
                    
                    if (product.stock < quantity) {
                        this.showMessage(`Solo quedan ${product.stock} unidades disponibles`, 'warning');
                        return false;
                    }
                    
                    const existingItemIndex = this.items.findIndex(item => item.id === productId);
                    
                    if (existingItemIndex > -1) {
                        const newQuantity = this.items[existingItemIndex].quantity + quantity;
                        if (newQuantity > product.stock) {
                            this.showMessage(`No puedes agregar más de ${product.stock} unidades`, 'warning');
                            return false;
                        }
                        this.items[existingItemIndex].quantity = newQuantity;
                    } else {
                        this.items.push({
                            id: product.id,
                            name: product.name,
                            price: product.price,
                            icon: product.icon,
                            stock: product.stock,
                            quantity: quantity,
                            category: product.category_name
                        });
                    }
                    
                    this.saveCart();
                    this.updateCartUI();
                    return true;
                }
            } catch (error) {
                console.error('Error adding to cart:', error);
                return false;
            }
        }

        removeFromCart(productId) {
            this.items = this.items.filter(item => item.id !== productId);
            this.saveCart();
            this.updateCartUI();
        }

        updateQuantity(productId, newQuantity) {
            if (newQuantity < 1) {
                this.removeFromCart(productId);
                return;
            }
            
            const item = this.items.find(item => item.id === productId);
            if (item && newQuantity > item.stock) {
                this.showMessage(`Solo hay ${item.stock} unidades disponibles`, 'warning');
                return;
            }
            
            const itemIndex = this.items.findIndex(item => item.id === productId);
            if (itemIndex > -1) {
                this.items[itemIndex].quantity = newQuantity;
                this.saveCart();
                this.updateCartUI();
            }
        }

        saveCart() {
            localStorage.setItem('superluna_cart', JSON.stringify(this.items));
        }

        updateCartUI() {
            this.updateCartCount();
            this.renderCartItems();
            this.updateCartTotal();
        }

        updateCartCount() {
            const totalItems = this.items.reduce((sum, item) => sum + item.quantity, 0);
            const cartCounts = document.querySelectorAll('.cart-count, .mobile-cart-count');
            cartCounts.forEach(element => {
                element.textContent = totalItems;
                element.style.display = totalItems > 0 ? 'flex' : 'none';
            });
        }

        renderCartItems() {
            const cartItemsContainer = document.getElementById('cart-items');
            if (!cartItemsContainer) return;

            if (this.items.length === 0) {
                cartItemsContainer.innerHTML = `
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
                return;
            }

            cartItemsContainer.innerHTML = this.items.map(item => `
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
                        <button class="quantity-btn minus" onclick="superLunaApp.cart.updateQuantity(${item.id}, ${item.quantity - 1})">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                <path d="M5 12H19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                            </svg>
                        </button>
                        
                        <span class="cart-item-quantity">${item.quantity}</span>
                        
                        <button class="quantity-btn plus" onclick="superLunaApp.cart.updateQuantity(${item.id}, ${item.quantity + 1})" 
                                ${item.quantity >= item.stock ? 'disabled' : ''}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                <path d="M12 5V19M5 12H19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                            </svg>
                        </button>
                    </div>
                    
                    <div class="cart-item-total">
                        $${(item.price * item.quantity).toFixed(2)}
                    </div>
                    
                    <button class="cart-item-remove" onclick="superLunaApp.cart.removeFromCart(${item.id})">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                    </button>
                </div>
            `).join('');
        }

        updateCartTotal() {
            const cartTotalElement = document.getElementById('cart-total');
            if (!cartTotalElement) return;
            const total = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            cartTotalElement.textContent = `$${total.toFixed(2)}`;
        }

        openCart() {
            const cartSidebar = document.getElementById('cart-sidebar');
            const cartOverlay = document.getElementById('cart-overlay');
            if (cartSidebar && cartOverlay) {
                cartSidebar.classList.add('active');
                cartOverlay.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
        }

        closeCart() {
            const cartSidebar = document.getElementById('cart-sidebar');
            const cartOverlay = document.getElementById('cart-overlay');
            if (cartSidebar && cartOverlay) {
                cartSidebar.classList.remove('active');
                cartOverlay.classList.remove('active');
                document.body.style.overflow = '';
            }
        }

        showMessage(message, type = 'info') {
            if (window.superLunaApp) {
                superLunaApp.showNotification(message, type);
            }
        }
    }

    // Inicializar la aplicación
    const superLunaApp = new SuperLunaApp();

    // Funciones de debug
    window.debugApp = {
        showData: () => {
            console.log('📦 Productos:', superLunaApp.products);
            console.log('🏷️ Categorías:', superLunaApp.categories);
        },
        reload: () => superLunaApp.loadInitialData()
    };