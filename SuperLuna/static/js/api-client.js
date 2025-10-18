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

    // Productos
    async getProducts(category = null) {
        const params = new URLSearchParams();
        if (category) params.append('category', category);
        
        return this.request(`/products?${params}`);
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

    // Ofertas
    async getDailyOffers() {
        return this.request('/offers/daily');
    }

    async getAllOffers() {
        return this.request('/offers');
    }

    async updateOfferStock(id, stockData) {
        return this.request(`/offers/${id}/stock`, {
            method: 'PUT',
            body: JSON.stringify(stockData)
        });
    }

    // Categorías
    async getCategories() {
        return this.request('/categories');
    }

    async getCategory(id) {
        return this.request(`/categories/${id}`);
    }
}

// Instancia global
const apiClient = new ApiClient();