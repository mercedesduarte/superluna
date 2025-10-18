class ApiClient {
    constructor() {
        this.baseUrl = 'http://localhost:5000/api';
    }

    async request(endpoint, options = {}) {
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    // ==================== PRODUCTOS ====================
    async getProducts(category = null) {
        const params = new URLSearchParams();
        if (category) params.append('category', category);
        
        return this.request(`/products?${params}`);
    }

    async getAdminProducts() {
        return this.request('/admin/products');
    }

    async getProduct(id) {
        return this.request(`/products/${id}`);
    }

    async createProduct(productData) {
        return this.request('/products', {
            method: 'POST',
            body: JSON.stringify(productData)
        });
    }

    async updateProduct(id, productData) {
        return this.request(`/products/${id}`, {
            method: 'PUT',
            body: JSON.stringify(productData)
        });
    }

    async deleteProduct(id) {
        return this.request(`/products/${id}`, {
            method: 'DELETE'
        });
    }

    // ==================== OFERTAS ====================
    async getDailyOffers() {
        return this.request('/offers/daily');
    }

    async getAllOffers() {
        return this.request('/offers');
    }

    async toggleDailyOffer(id, isDailyOffer) {
        return this.request(`/products/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ is_daily_offer: isDailyOffer })
        });
    }

    // ==================== CATEGORÍAS ====================
    async getCategories() {
        return this.request('/categories');
    }

    async getCategory(id) {
        return this.request(`/categories/${id}`);
    }

    async createCategory(categoryData) {
        return this.request('/categories', {
            method: 'POST',
            body: JSON.stringify(categoryData)
        });
    }

    async updateCategory(id, categoryData) {
        return this.request(`/categories/${id}`, {
            method: 'PUT',
            body: JSON.stringify(categoryData)
        });
    }

    async deleteCategory(id) {
        return this.request(`/categories/${id}`, {
            method: 'DELETE'
        });
    }

    // ==================== ADMIN ====================
    async adminLogin(credentials) {
        return this.request('/admin/login', {
            method: 'POST',
            body: JSON.stringify(credentials)
        });
    }

    async verifyAdmin() {
        return this.request('/admin/verify');
    }

    async getDashboard() {
        return this.request('/admin/dashboard');
    }

    // ==================== UTILIDADES ====================
    async searchProducts(query) {
        const params = new URLSearchParams();
        if (query) params.append('q', query);
        
        return this.request(`/products/search?${params}`);
    }

    async getProductsByCategory(categoryId) {
        return this.request(`/categories/${categoryId}/products`);
    }
}

// Instancia global
const apiClient = new ApiClient();