// ==================== ADMIN APP - TODO EN UNO ====================

class AdminApp {
    static isAuthenticated = false;
    static currentUser = null;
    static editingProduct = null;
    static editingCategory = null;
    static currentSection = 'dashboard';

    static init() {
        console.log('Inicializando Admin...');
        this.checkAuth();
        this.bindEvents();
    }

    // Verificar autenticación
    static async checkAuth() {
        try {
            const response = await fetch('/api/admin/verify');
            const data = await response.json();
            
            if (data.success) {
                this.isAuthenticated = true;
                this.currentUser = data.user;
                this.showAdminPanel();
                console.log('Usuario autenticado:', data.user);
            } else {
                this.showLoginPanel();
                console.log('No autenticado');
            }
        } catch (error) {
            console.error('Error verificando autenticación:', error);
            this.showLoginPanel();
        }
    }

    static showLoginPanel() {
        document.getElementById('login-panel').style.display = 'flex';
        document.getElementById('admin-panel').style.display = 'none';
        this.isAuthenticated = false;
        console.log('Mostrando panel de login');
    }

    static showAdminPanel() {
        document.getElementById('login-panel').style.display = 'none';
        document.getElementById('admin-panel').style.display = 'flex';
        this.isAuthenticated = true;
        console.log('Mostrando panel admin');
        
        this.loadSection('dashboard');
    }

    static bindEvents() {
        console.log('Vinculando eventos...');
        
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
            console.log('Login form vinculado');
        }
     
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleLogout();
            });
            console.log('Logout button vinculado');
        }

        const menuItems = document.querySelectorAll('.admin-menu-item[data-tab]');
        console.log(`Encontrados ${menuItems.length} items del menú`);
        
        menuItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const tab = e.currentTarget.getAttribute('data-tab');
                console.log(`Cambiando a pestaña: ${tab}`);
                this.switchTab(tab);
            });
        });

        console.log('Todos los eventos vinculados correctamente');
    }
 
    static async handleLogin() {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        console.log(`Intentando login con usuario: ${username}`);

        try {
            const response = await fetch('/api/admin/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (data.success) {
                this.isAuthenticated = true;
                this.currentUser = data.user;
                this.showAdminPanel();
                this.showMessage('Login exitoso', 'success');
                console.log('Login exitoso');
            } else {
                this.showMessage(data.message || 'Error en login', 'error');
                console.log('Login fallido:', data.message);
            }
        } catch (error) {
            console.error('Error en login:', error);
            this.showMessage('Error de conexión', 'error');
        }
    }

    static handleLogout() {
        this.isAuthenticated = false;
        this.currentUser = null;
        this.showLoginPanel();
        this.showMessage('Sesión cerrada', 'info');
        console.log('Sesión cerrada');
    }

    static switchTab(tabName) {
        console.log(`Cambiando a pestaña: ${tabName}`);
        
        document.querySelectorAll('.admin-menu-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const activeMenuItem = document.querySelector(`[data-tab="${tabName}"]`);
        if (activeMenuItem) {
            activeMenuItem.classList.add('active');
        }
   
        const titles = {
            'dashboard': 'Dashboard',
            'products': 'Gestión de Productos',
            'offers': 'Ofertas del Día',
            'categories': 'Categorías'
        };
        
        const titleElement = document.getElementById('admin-page-title');
        if (titleElement) {
            titleElement.textContent = titles[tabName] || 'Panel';
        }

        // Ocultar todos los contenidos
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
            content.style.display = 'none';
        });

        // Mostrar contenido activo
        const activeContent = document.getElementById(tabName);
        if (activeContent) {
            activeContent.classList.add('active');
            activeContent.style.display = 'block';
        }

        this.currentSection = tabName;

        // Cargar contenido específico
        this.loadSection(tabName);
    }

    // Cargar sección
    static async loadSection(sectionName) {
        console.log(`Cargando sección: ${sectionName}`);
        
        switch(sectionName) {
            case 'dashboard':
                await this.loadDashboard();
                break;
            case 'products':
                await this.loadProducts();
                break;
            case 'offers':
                await this.loadOffers();
                break;
            case 'categories':
                await this.loadCategories();
                break;
            default:
                console.warn(`Sección desconocida: ${sectionName}`);
        }
    }

    // ==================== DASHBOARD ====================
    static async loadDashboard() {
        try {
            console.log('Cargando dashboard...');
            // CORREGIDO: Cambiar '/admin' por '/api/admin/dashboard'
            const response = await fetch('/api/admin/dashboard');
            const data = await response.json();

            if (data.success) {
                this.renderDashboard(data.stats);
                console.log('Dashboard cargado correctamente');
            } else {
                document.getElementById('dashboard').innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon"></div>
                        <h3>Error cargando dashboard</h3>
                        <p>No se pudieron cargar las estadísticas</p>
                    </div>
                `;
                console.error('Error en respuesta del dashboard:', data);
            }
        } catch (error) {
            console.error('Error loading dashboard:', error);
            document.getElementById('dashboard').innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon"></div>
                    <h3>Error de conexión</h3>
                    <p>No se pudo conectar con el servidor</p>
                </div>
            `;
        }
    }

    static renderDashboard(stats) {
        console.log('Renderizando dashboard con stats:', stats);
        
        const dashboardHTML = `
            <div class="dashboard-stats">
                <div class="stat-card">
                    <div class="stat-icon"></div>
                    <div class="stat-info">
                        <div class="stat-value">${stats.totalProducts || 0}</div>
                        <div class="stat-label">Productos Totales</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon"></div>
                    <div class="stat-info">
                        <div class="stat-value">${stats.totalCategories || 0}</div>
                        <div class="stat-label">Categorías</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon"></div>
                    <div class="stat-info">
                        <div class="stat-value">${stats.activeOffers || 0}</div>
                        <div class="stat-label">Ofertas Activas</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon"></div>
                    <div class="stat-info">
                        <div class="stat-value">${stats.lowStock || 0}</div>
                        <div class="stat-label">Stock Bajo</div>
                    </div>
                </div>
            </div>
            <div class="dashboard-actions">
                <button class="btn btn-primary" onclick="AdminApp.switchTab('products')">
                    Gestionar Productos
                </button>
                <button class="btn btn-success" onclick="AdminApp.showProductForm()">
                    Agregar Producto
                </button>
                <button class="btn btn-outline" onclick="AdminApp.switchTab('categories')">
                    Gestionar Categorías
                </button>
            </div>
        `;

        const dashboardElement = document.getElementById('dashboard');
        if (dashboardElement) {
            dashboardElement.innerHTML = dashboardHTML;
            console.log('Dashboard renderizado');
        }
    }

    // ==================== PRODUCTOS ====================
    static async loadProducts() {
        try {
            console.log('Cargando productos...');
            const response = await fetch('/api/admin/products');
            const data = await response.json();

            if (data.success) {
                this.renderProductsTable(data.products);
                console.log(`${data.products.length} productos cargados`);
            } else {
                document.getElementById('products').innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon"></div>
                        <h3>Error cargando productos</h3>
                        <p>${data.message || 'Error desconocido'}</p>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error loading products:', error);
            document.getElementById('products').innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon"></div>
                    <h3>Error de conexión</h3>
                    <p>No se pudieron cargar los productos</p>
                </div>
            `;
        }
    }

    static renderProductsTable(products) {
        console.log('Renderizando tabla de productos');
        
        const productsHTML = `
            <div class="section-header">
                <h2>Gestión de Productos</h2>
                <button class="btn btn-primary" onclick="AdminApp.showProductForm()">
                    Agregar Producto
                </button>
            </div>
            <div class="table-container">
                ${products && products.length > 0 ? `
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Producto</th>
                                <th>Precio</th>
                                <th>Stock</th>
                                <th>Categoría</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${products.map(product => `
                                <tr>
                                    <td>${product.id}</td>
                                    <td>
                                        <div class="product-info">
                                            <span class="product-icon">${product.icon || ''}</span>
                                            <div>
                                                <div class="product-name">${product.name}</div>
                                                <div class="product-description">${product.description || 'Sin descripción'}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div class="price-info">
                                            <div class="current-price">$${product.price}</div>
                                            ${product.original_price > product.price ? 
                                                `<div class="original-price">$${product.original_price}</div>` : ''
                                            }
                                        </div>
                                    </td>
                                    <td>
                                        <span class="stock-badge ${product.stock <= 10 ? 'low-stock' : 'good-stock'}">
                                            ${product.stock} unidades
                                        </span>
                                    </td>
                                    <td>${product.category_name || 'Sin categoría'}</td>
                                    <td>
                                        <span class="status-badge ${product.is_active ? 'active' : 'inactive'}">
                                            ${product.is_active ? 'Activo' : 'Inactivo'}
                                        </span>
                                        ${product.is_daily_offer ? '<span class="offer-badge">Oferta</span>' : ''}
                                    </td>
                                    <td>
                                        <div class="action-buttons">
                                            <button class="btn btn-sm btn-outline" 
                                                    onclick="AdminApp.editProduct(${product.id})">
                                                Editar
                                            </button>
                                            <button class="btn btn-sm btn-danger" 
                                                    onclick="AdminApp.deleteProduct(${product.id})">
                                                Eliminar
                                            </button>
                                            <button class="btn btn-sm ${product.is_daily_offer ? 'btn-warning' : 'btn-outline'}" 
                                                    onclick="AdminApp.toggleDailyOffer(${product.id}, ${!product.is_daily_offer})">
                                                ${product.is_daily_offer ? 'Quitar Oferta' : 'Oferta Día'}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                ` : `
                    <div class="empty-state">
                        <div class="empty-icon"></div>
                        <h3>No hay productos</h3>
                        <p>Comienza agregando tu primer producto</p>
                        <button class="btn btn-primary" onclick="AdminApp.showProductForm()">
                            Agregar Producto
                        </button>
                    </div>
                `}
            </div>
        `;

        const productsElement = document.getElementById('products');
        if (productsElement) {
            productsElement.innerHTML = productsHTML;
            console.log('Tabla de productos renderizada');
        }
    }

    // ==================== FORMULARIO DE PRODUCTOS ====================
    static async showProductForm(product = null) {
        console.log(`${product ? 'Editando' : 'Creando'} producto`);
        this.editingProduct = product;
        
        const modalHTML = `
            <div id="product-modal" class="modal" style="display: block;">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>${product ? 'Editar Producto' : 'Agregar Producto'}</h3>
                        <span class="close" onclick="AdminApp.hideProductForm()">&times;</span>
                    </div>
                    <div class="modal-body">
                        <form id="product-form">
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="product-name">Nombre del Producto *</label>
                                    <input type="text" id="product-name" class="form-control" 
                                           value="${product ? product.name : ''}" required>
                                </div>
                                <div class="form-group">
                                    <label for="product-category">Categoría *</label>
                                    <select id="product-category" class="form-control" required>
                                        <option value="">Seleccionar categoría</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="product-price">Precio Actual *</label>
                                    <input type="number" id="product-price" class="form-control" 
                                           step="0.01" min="0"
                                           value="${product ? product.price : ''}" required>
                                </div>
                                <div class="form-group">
                                    <label for="product-original-price">Precio Original</label>
                                    <input type="number" id="product-original-price" class="form-control"
                                           step="0.01" min="0"
                                           value="${product ? (product.original_price || '') : ''}">
                                </div>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="product-stock">Stock *</label>
                                    <input type="number" id="product-stock" class="form-control" 
                                           min="0" value="${product ? product.stock : 0}" required>
                                </div>
                                <div class="form-group">
                                    <label for="product-icon">Icono</label>
                                    <select id="product-icon" class="form-control">
                                        ${[
                                            ['', 'Genérico'],
                                            ['', 'Fruta'],
                                            ['', 'Pollo'],
                                            ['', 'Lácteo'],
                                            ['', 'Aceite'],
                                            ['', 'Bebida'],
                                            ['', 'Pan'],
                                            ['', 'Huevos']
                                        ].map(([icon, label]) => 
                                            `<option value="${icon}" ${product && product.icon === icon ? 'selected' : ''}>${label}</option>`
                                        ).join('')}
                                    </select>
                                </div>
                            </div>

                            <div class="form-group">
                                <label for="product-description">Descripción</label>
                                <textarea id="product-description" class="form-control" rows="3">${product ? product.description : ''}</textarea>
                            </div>

                            <div class="form-row">
                                <div class="form-group">
                                    <label>
                                        <input type="checkbox" id="product-daily-offer" ${product?.is_daily_offer ? 'checked' : ''}> 
                                        Oferta del Día
                                    </label>
                                </div>
                                <div class="form-group">
                                    <label>
                                        <input type="checkbox" id="product-active" ${product === null || product.is_active ? 'checked' : ''}> 
                                        Producto Activo
                                    </label>
                                </div>
                            </div>

                            <div class="form-group">
                                <button type="submit" class="btn btn-success">
                                    ${product ? 'Actualizar Producto' : 'Crear Producto'}
                                </button>
                                <button type="button" class="btn btn-outline" onclick="AdminApp.hideProductForm()">
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;

        // Eliminar modal previo si existe
        document.getElementById('product-modal')?.remove();

        // Insertar nuevo modal
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Cargar categorías
        await this.loadCategoriesForSelect();

        // Asignar categoría si estamos editando
        if (product) {
            const categorySelect = document.getElementById('product-category');
            if (categorySelect) categorySelect.value = product.category_id;
        }

        // Evento de submit
        document.getElementById('product-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveProduct();
        });

        console.log('Formulario de producto mostrado');
    }

    static hideProductForm() {
        document.getElementById('product-modal')?.remove();
        this.editingProduct = null;
        console.log('Formulario de producto cerrado');
    }

    static async loadCategoriesForSelect() {
        try {
            console.log('Cargando categorías para select...');
            const response = await fetch('/api/categories');
            const data = await response.json();

            if (data.success && Array.isArray(data.categories)) {
                const select = document.getElementById('product-category');
                if (select) {
                    select.innerHTML = `
                        <option value="">Seleccionar categoría</option>
                        ${data.categories.map(cat => 
                            `<option value="${cat.id}">${cat.name}</option>`
                        ).join('')}
                    `;
                    console.log(`${data.categories.length} categorías cargadas`);
                }
            } else {
                console.warn('No se recibieron categorías válidas del servidor.');
            }
        } catch (error) {
            console.error('Error loading categories:', error);
        }
    }

    static async saveProduct() {
        console.log('Guardando producto...');
        
        const formData = {
            name: document.getElementById('product-name').value.trim(),
            description: document.getElementById('product-description').value.trim(),
            price: parseFloat(document.getElementById('product-price').value),
            original_price: document.getElementById('product-original-price').value 
                ? parseFloat(document.getElementById('product-original-price').value)
                : null,
            stock: parseInt(document.getElementById('product-stock').value),
            category_id: parseInt(document.getElementById('product-category').value),
            icon: document.getElementById('product-icon').value,
            is_daily_offer: document.getElementById('product-daily-offer').checked,
            is_active: document.getElementById('product-active').checked
        };

        console.log('Datos del producto:', formData);

        // Validaciones básicas
        if (!formData.name || isNaN(formData.price) || isNaN(formData.stock) || isNaN(formData.category_id)) {
            this.showMessage('Por favor complete todos los campos obligatorios correctamente.', 'error');
            return;
        }

        try {
            const url = this.editingProduct 
                ? `/api/products/${this.editingProduct.id}` 
                : '/api/products';
            const method = this.editingProduct ? 'PUT' : 'POST';

            console.log(`Enviando datos: ${method} ${url}`);

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (data.success) {
                this.showMessage(
                    this.editingProduct ? 'Producto actualizado exitosamente' : 'Producto creado exitosamente',
                    'success'
                );
                this.hideProductForm();
                await this.loadProducts(); // Recargar la lista de productos
            } else {
                this.showMessage(data.message || 'Error al guardar el producto', 'error');
            }
        } catch (error) {
            console.error('Error saving product:', error);
            this.showMessage('Error de conexión al guardar', 'error');
        }
    }

    static async editProduct(productId) {
        try {
            console.log(`Editando producto ${productId}`);
            const response = await fetch(`/api/products/${productId}`);
            const data = await response.json();
            
            if (data.success && data.product) {
                this.showProductForm(data.product);
            } else {
                this.showMessage('Error al cargar el producto', 'error');
            }
        } catch (error) {
            console.error('Error loading product:', error);
            this.showMessage('Error de conexión', 'error');
        }
    }

    static async deleteProduct(productId) {
        if (!confirm('¿Estás seguro de que quieres eliminar este producto?\n\nEl producto se marcará como inactivo y dejará de mostrarse en la tienda.')) {
            return;
        }

        try {
            console.log(`Eliminando producto ${productId}`);
            const response = await fetch(`/api/products/${productId}`, { method: 'DELETE' });
            const data = await response.json();

            if (data.success) {
                this.showMessage('Producto eliminado exitosamente', 'success');
                await this.loadProducts();
            } else {
                this.showMessage(data.message || 'Error al eliminar el producto', 'error');
            }
        } catch (error) {
            console.error('Error deleting product:', error);
            this.showMessage('Error de conexión al eliminar', 'error');
        }
    }

    static async toggleDailyOffer(productId, isDailyOffer) {
        try {
            console.log(`${isDailyOffer ? 'Activando' : 'Desactivando'} oferta para producto ${productId}`);
            
            const response = await fetch(`/api/products/${productId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_daily_offer: isDailyOffer })
            });

            const data = await response.json();

            if (data.success) {
                this.showMessage(
                    isDailyOffer 
                        ? 'Producto marcado como oferta del día' 
                        : 'Producto quitado de ofertas del día',
                    'success'
                );
                await this.loadOffers();
                await this.loadProducts(); // Actualizar ambas vistas
            } else {
                this.showMessage(data.message || 'Error al actualizar', 'error');
            }
        } catch (error) {
            console.error('Error toggling daily offer:', error);
            this.showMessage('Error de conexión', 'error');
        }
    }

    // ==================== OFERTAS ====================
    static async loadOffers() {
        try {
            console.log('Cargando ofertas...');
            const response = await fetch('/api/offers/daily');
            const data = await response.json();

            if (data.success) {
                this.renderOffersTable(data.offers);
                console.log(`${data.offers.length} ofertas cargadas`);
            } else {
                document.getElementById('offers').innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon"></div>
                        <h3>Error cargando ofertas</h3>
                        <p>${data.message || 'Error desconocido'}</p>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error loading offers:', error);
            document.getElementById('offers').innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon"></div>
                    <h3>Error de conexión</h3>
                    <p>No se pudieron cargar las ofertas</p>
                </div>
            `;
        }
    }

    static renderOffersTable(offers) {
        console.log('Renderizando tabla de ofertas');
        
        const offersHTML = `
            <div class="section-header">
                <h2>Ofertas del Día</h2>
                <button class="btn btn-primary" onclick="AdminApp.switchTab('products')">
                    Gestionar Productos
                </button>
            </div>
            <div class="table-container">
                ${offers && offers.length > 0 ? `
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Producto</th>
                                <th>Precio Original</th>
                                <th>Precio Oferta</th>
                                <th>Descuento</th>
                                <th>Stock</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${offers.map(offer => `
                                <tr>
                                    <td>
                                        <div class="product-info">
                                            <span class="product-icon">${offer.icon || ''}</span>
                                            <div class="product-name">${offer.name}</div>
                                        </div>
                                    </td>
                                    <td class="original-price">$${offer.original_price}</td>
                                    <td class="offer-price">$${offer.price}</td>
                                    <td>
                                        <span class="discount-badge">${offer.discount || 0}% OFF</span>
                                    </td>
                                    <td>${offer.stock} unidades</td>
                                    <td>
                                        <button class="btn btn-sm btn-warning" 
                                                onclick="AdminApp.toggleDailyOffer(${offer.id}, false)">
                                            Quitar Oferta
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                ` : `
                    <div class="empty-state">
                        <div class="empty-icon"></div>
                        <h3>No hay ofertas activas</h3>
                        <p>Activa ofertas del día desde la gestión de productos</p>
                        <button class="btn btn-primary" onclick="AdminApp.switchTab('products')">
                            Ir a Productos
                        </button>
                    </div>
                `}
            </div>
        `;

        const offersElement = document.getElementById('offers');
        if (offersElement) {
            offersElement.innerHTML = offersHTML;
            console.log('Tabla de ofertas renderizada');
        }
    }

    // ==================== CATEGORÍAS (CRUD COMPLETO) ====================
    static async loadCategories() {
        try {
            console.log('Cargando categorías...');
            const response = await fetch('/api/categories');
            
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Respuesta de categorías:', data);

            if (data.success) {
                this.renderCategoriesTable(data.categories);
                console.log(`${data.categories.length} categorías cargadas`);
            } else {
                console.error('Error en respuesta:', data);
                document.getElementById('categories').innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon"></div>
                        <h3>Error cargando categorías</h3>
                        <p>${data.message || 'Error del servidor'}</p>
                        <button class="btn btn-outline" onclick="AdminApp.loadCategories()">
                            Reintentar
                        </button>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error loading categories:', error);
            document.getElementById('categories').innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon"></div>
                    <h3>Error de conexión</h3>
                    <p>No se pudieron cargar las categorías: ${error.message}</p>
                    <button class="btn btn-outline" onclick="AdminApp.loadCategories()">
                        Reintentar
                    </button>
                </div>
            `;
        }
    }

    static renderCategoriesTable(categories) {
        console.log('Renderizando tabla de categorías con:', categories);
        
        // Verificar que categories sea un array
        if (!Array.isArray(categories)) {
            console.error('categories no es un array:', categories);
            categories = [];
        }
        
        const categoriesHTML = `
            <div class="section-header">
                <h2>Gestión de Categorías</h2>
                <button class="btn btn-primary" onclick="AdminApp.showCategoryForm()">
                    Nueva Categoría
                </button>
            </div>
            <div class="table-container">
                ${categories.length > 0 ? `
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Nombre</th>
                                <th>Slug</th>
                                <th>Icono</th>
                                <th>Descripción</th>
                                <th>Productos</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${categories.map(category => `
                                <tr>
                                    <td>${category.id || 'N/A'}</td>
                                    <td>
                                        <div class="category-info">
                                            <span class="category-icon">${category.icon || ''}</span>
                                            ${category.name || 'Sin nombre'}
                                        </div>
                                    </td>
                                    <td>
                                        <code style="background: #f1f5f9; padding: 4px 8px; border-radius: 4px; font-size: 0.8rem;">
                                            ${category.slug || 'sin-slug'}
                                        </code>
                                    </td>
                                    <td>${category.icon || ''}</td>
                                    <td>${category.description || 'Sin descripción'}</td>
                                    <td>
                                        <span class="product-count">${category.product_count || 0} productos</span>
                                    </td>
                                    <td>
                                        <div class="action-buttons">
                                            <button class="btn btn-sm btn-outline" 
                                                    onclick="AdminApp.editCategory(${category.id})">
                                                Editar
                                            </button>
                                            <button class="btn btn-sm btn-danger" 
                                                    onclick="AdminApp.deleteCategory(${category.id})">
                                                Eliminar
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                ` : `
                    <div class="empty-state">
                        <div class="empty-icon"></div>
                        <h3>No hay categorías</h3>
                        <p>Comienza creando tu primera categoría</p>
                        <button class="btn btn-primary" onclick="AdminApp.showCategoryForm()">
                            Nueva Categoría
                        </button>
                    </div>
                `}
            </div>
        `;

        const categoriesElement = document.getElementById('categories');
        if (categoriesElement) {
            categoriesElement.innerHTML = categoriesHTML;
            console.log('Tabla de categorías renderizada');
        } else {
            console.error('No se encontró el elemento categories');
        }
    }

    // ==================== FORMULARIO DE CATEGORÍAS ====================
    static async showCategoryForm(category = null) {
        console.log(`${category ? 'Editando' : 'Creando'} categoría`);
        this.editingCategory = category;
        
        const modalHTML = `
            <div id="category-modal" class="modal" style="display: block;">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>${category ? 'Editar Categoría' : 'Nueva Categoría'}</h3>
                        <span class="close" onclick="AdminApp.hideCategoryForm()">&times;</span>
                    </div>
                    <div class="modal-body">
                        <form id="category-form">
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="category-name">Nombre de la Categoría *</label>
                                    <input type="text" id="category-name" class="form-control" 
                                           value="${category ? category.name : ''}" required
                                           placeholder="Ej: Frutas y Verduras">
                                </div>
                                <div class="form-group">
                                    <label for="category-slug">Slug *</label>
                                    <input type="text" id="category-slug" class="form-control" 
                                           value="${category ? category.slug : ''}" required
                                           placeholder="Ej: frutas-verduras">
                                    <small style="color: #64748b; font-size: 0.8rem; margin-top: 4px;">
                                        Identificador único en URL (solo letras, números y guiones)
                                    </small>
                                </div>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="category-icon">Icono</label>
                                    <select id="category-icon" class="form-control">
                                        ${[
                                            ['', 'Genérico'],
                                            ['', 'Fruta'],
                                            ['', 'Carne'],
                                            ['', 'Lácteo'],
                                            ['', 'Aceite'],
                                            ['', 'Bebida'],
                                            ['', 'Pan'],
                                            ['', 'Huevos'],
                                            ['', 'Verdura'],
                                            ['', 'Pescado'],
                                            ['', 'Galletas'],
                                            ['', 'Café'],
                                            ['', 'Congelados'],
                                            ['', 'Vinos'],
                                            ['', 'Limpieza'],
                                            ['', 'Mascotas']
                                        ].map(([icon, label]) => 
                                            `<option value="${icon}" ${category && category.icon === icon ? 'selected' : ''}>${label}</option>`
                                        ).join('')}
                                    </select>
                                </div>
                            </div>

                            <div class="form-group">
                                <label for="category-description">Descripción</label>
                                <textarea id="category-description" class="form-control" rows="3" 
                                          placeholder="Descripción opcional de la categoría">${category ? category.description : ''}</textarea>
                            </div>

                            <div class="form-group">
                                <button type="submit" class="btn btn-success">
                                    ${category ? 'Actualizar Categoría' : 'Crear Categoría'}
                                </button>
                                <button type="button" class="btn btn-outline" onclick="AdminApp.hideCategoryForm()">
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;

        // Eliminar modal previo si existe
        document.getElementById('category-modal')?.remove();

        // Insertar nuevo modal
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Auto-generar slug si está creando nueva categoría
        if (!category) {
            const nameInput = document.getElementById('category-name');
            const slugInput = document.getElementById('category-slug');
            
            nameInput.addEventListener('input', function() {
                if (!category) { // Solo auto-generar para nuevas categorías
                    const slug = this.value
                        .toLowerCase()
                        .trim()
                        .replace(/[^a-z0-9áéíóúüñ\s]/g, '')
                        .replace(/\s+/g, '-');
                    slugInput.value = slug;
                }
            });
        }

        // Evento de submit
        document.getElementById('category-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveCategory(category);
        });

        console.log('Formulario de categoría mostrado');
    }

    static hideCategoryForm() {
        document.getElementById('category-modal')?.remove();
        this.editingCategory = null;
        console.log('Formulario de categoría cerrado');
    }

    static async saveCategory(category = null) {
        console.log('Guardando categoría...');
        
        const formData = {
            name: document.getElementById('category-name').value.trim(),
            slug: document.getElementById('category-slug').value.trim(),
            icon: document.getElementById('category-icon').value,
            description: document.getElementById('category-description').value.trim()
        };

        console.log('Datos de la categoría:', formData);

        // Validaciones básicas
        if (!formData.name || !formData.slug) {
            this.showMessage('Nombre y slug son obligatorios', 'error');
            return;
        }

        // Validar formato del slug
        if (!/^[a-z0-9\-]+$/.test(formData.slug)) {
            this.showMessage('El slug solo puede contener letras minúsculas, números y guiones', 'error');
            return;
        }

        try {
            const url = category 
                ? `/api/categories/${category.id}` 
                : '/api/categories';
            const method = category ? 'PUT' : 'POST';

            console.log(`Enviando datos: ${method} ${url}`);

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (data.success) {
                this.showMessage(
                    category ? 'Categoría actualizada exitosamente' : 'Categoría creada exitosamente',
                    'success'
                );
                this.hideCategoryForm();
                await this.loadCategories(); // Recargar la lista de categorías
            } else {
                this.showMessage(data.message || 'Error al guardar la categoría', 'error');
            }
        } catch (error) {
            console.error('Error saving category:', error);
            this.showMessage('Error de conexión al guardar', 'error');
        }
    }

    static async editCategory(categoryId) {
        try {
            console.log(`Editando categoría ${categoryId}`);
            const response = await fetch(`/api/categories/${categoryId}`);
            const data = await response.json();
            
            if (data.success && data.category) {
                this.showCategoryForm(data.category);
            } else {
                this.showMessage('Error al cargar la categoría', 'error');
            }
        } catch (error) {
            console.error('Error loading category:', error);
            this.showMessage('Error de conexión', 'error');
        }
    }

    static async deleteCategory(categoryId) {
        if (!confirm('¿Estás seguro de que quieres eliminar esta categoría?\n\nEsta acción no se puede deshacer.')) {
            return;
        }

        try {
            console.log(`Eliminando categoría ${categoryId}`);
            const response = await fetch(`/api/categories/${categoryId}`, { 
                method: 'DELETE' 
            });
            const data = await response.json();

            if (data.success) {
                this.showMessage('Categoría eliminada exitosamente', 'success');
                await this.loadCategories();
            } else {
                this.showMessage(data.message || 'Error al eliminar la categoría', 'error');
            }
        } catch (error) {
            console.error('Error deleting category:', error);
            this.showMessage('Error de conexión al eliminar', 'error');
        }
    }

    // ==================== UTILIDADES ====================
    static showMessage(message, type = 'info') {
        console.log(`[${type}] ${message}`);
        
        const containerId = 'admin-message-container';
        let container = document.getElementById(containerId);
        
        if (!container) {
            container = document.createElement('div');
            container.id = containerId;
            container.style.position = 'fixed';
            container.style.top = '20px';
            container.style.right = '20px';
            container.style.zIndex = '9999';
            document.body.appendChild(container);
        }
        
        const msg = document.createElement('div');
        msg.textContent = message;
        msg.style.marginBottom = '10px';
        msg.style.padding = '16px 20px';
        msg.style.borderRadius = 'var(--border-radius)';
        msg.style.fontWeight = '500';
        msg.style.boxShadow = 'var(--shadow)';
        msg.style.borderLeft = '4px solid transparent';
        msg.style.animation = 'slideInRight 0.3s ease';
        
        // Estilos según el tipo
        switch(type) {
            case 'success':
                msg.style.background = '#f0fdf4';
                msg.style.color = '#166534';
                msg.style.borderLeftColor = '#22c55e';
                break;
            case 'error':
                msg.style.background = '#fef2f2';
                msg.style.color = '#dc2626';
                msg.style.borderLeftColor = '#ef4444';
                break;
            case 'info':
                msg.style.background = '#f0f9ff';
                msg.style.color = '#0369a1';
                msg.style.borderLeftColor = '#0ea5e9';
                break;
            default:
                msg.style.background = '#f8fafc';
                msg.style.color = '#334155';
                msg.style.borderLeftColor = '#94a3b8';
        }
        
        container.appendChild(msg);
        
        // Auto-eliminar después de 4 segundos
        setTimeout(() => {
            msg.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => msg.remove(), 300);
        }, 4000);
    }
}

// Agregar animación de salida para mensajes
const style = document.createElement('style');
style.textContent = `
    @keyframes slideOutRight {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100%);
        }
    }
`;
document.head.appendChild(style);

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM cargado, inicializando AdminApp...');
    AdminApp.init();
});


window.AdminApp = AdminApp;