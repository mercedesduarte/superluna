from flask import Flask, render_template, jsonify, request, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from datetime import datetime, timedelta
import os

# Configuración de la app
app = Flask(__name__, 
            static_folder='static',
            template_folder='templates')
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///superluna.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = 'superluna-secret-key-2023'

db = SQLAlchemy(app)
CORS(app)

# Modelos actualizados
class Category(db.Model):
    __tablename__ = 'categories'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    slug = db.Column(db.String(100), unique=True, nullable=False)
    icon = db.Column(db.String(50))
    description = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Product(db.Model):
    __tablename__ = 'products'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    price = db.Column(db.Float, nullable=False)
    original_price = db.Column(db.Float)
    discount = db.Column(db.Float, default=0)
    icon = db.Column(db.String(50))
    image_url = db.Column(db.String(500))
    stock = db.Column(db.Integer, default=0)
    sold = db.Column(db.Integer, default=0)
    category_id = db.Column(db.Integer, db.ForeignKey('categories.id'), nullable=False)
    is_daily_offer = db.Column(db.Boolean, default=False)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Nuevos campos
    destacado = db.Column(db.Boolean, default=False)
    orden_destacado = db.Column(db.Integer, default=0)
    fecha_inicio_oferta = db.Column(db.DateTime, nullable=True)
    fecha_fin_oferta = db.Column(db.DateTime, nullable=True)

    # Relación
    category = db.relationship('Category', backref='products')

    # PROPIEDADES CALCULADAS PARA OFERTAS
    @property
    def oferta_activa(self):
        """Verifica si la oferta está actualmente activa"""
        if not self.is_daily_offer or not self.original_price or self.original_price <= self.price:
            return False
        
        ahora = datetime.utcnow()
        
        # Si no tiene fechas, siempre está activa mientras sea oferta del día
        if not self.fecha_inicio_oferta and not self.fecha_fin_oferta:
            return True

        if self.fecha_inicio_oferta and not self.fecha_fin_oferta:
            return self.fecha_inicio_oferta <= ahora

        if not self.fecha_inicio_oferta and self.fecha_fin_oferta:
            return ahora <= self.fecha_fin_oferta

        return self.fecha_inicio_oferta <= ahora <= self.fecha_fin_oferta

    @property
    def porcentaje_descuento(self):
        """Calcula el porcentaje de descuento automaticamente"""
        if not self.original_price or self.original_price <= self.price or self.price == 0:
            return 0
        return int(((self.original_price - self.price) / self.original_price) * 100)

    @property
    def dias_restantes_oferta(self):
        """Calcula dias restantes para ofertas con fecha fin"""
        if not self.fecha_fin_oferta:
            return None
        ahora = datetime.utcnow()
        if ahora > self.fecha_fin_oferta:
            return 0
        diferencia = self.fecha_fin_oferta - ahora
        return diferencia.days

class AdminUser(db.Model):
    __tablename__ = 'admin_users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    role = db.Column(db.String(50), default='admin')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

# ==================== RUTAS PRINCIPALES ====================
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/admin')
def admin_page():
    return render_template('admin.html')

# ==================== API - PRODUCTOS ====================
@app.route('/api/products', methods=['GET'])
def get_products():
    try:
        print("Solicitando todos los productos...")
        
        # Obtener todos los productos activos
        products = Product.query.filter_by(is_active=True).all()
        
        print(f"Encontrados {len(products)} productos activos")
        
        return jsonify({
            'success': True,
            'products': [product_to_dict(product) for product in products]
        })
    except Exception as e:
        print(f"Error en get_products: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

# Obtener producto específico
@app.route('/api/products/<int:product_id>', methods=['GET'])
def get_product(product_id):
    try:
        product = Product.query.get(product_id)
        if not product:
            return jsonify({'success': False, 'message': 'Producto no encontrado'}), 404
        
        return jsonify({
            'success': True,
            'product': product_to_dict(product)
        })
    except Exception as e:
        print(f"Error en get_product: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

# Obtener todos los productos (para admin)
@app.route('/api/admin/products')
def get_admin_products():
    try:
        products = Product.query.all()
        return jsonify({
            'success': True,
            'products': [product_to_dict(product) for product in products]
        })
    except Exception as e:
        print(f"Error en get_admin_products: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

# ==================== API - OFERTAS ====================
@app.route('/api/offers/daily')
def get_daily_offers():
    try:
        offers = Product.query.filter(
            Product.is_daily_offer == True,
            Product.is_active == True
        ).all()
        
        return jsonify({
            'success': True,
            'offers': [product_to_dict(offer) for offer in offers]
        })
    except Exception as e:
        print(f"Error en get_daily_offers: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/offers')
def get_all_offers():
    try:
        offers = Product.query.filter(
            Product.is_active == True,
            Product.discount > 0
        ).all()
        
        return jsonify({
            'success': True,
            'offers': [product_to_dict(offer) for offer in offers]
        })
    except Exception as e:
        print(f"Error en get_all_offers: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

# ==================== API - CATEGORÍAS (CRUD COMPLETO) ====================
@app.route('/api/categories', methods=['GET'])
def get_categories():
    try:
        categories = Category.query.all()
        return jsonify({
            'success': True,
            'categories': [category_to_dict(category) for category in categories]
        })
    except Exception as e:
        print(f"Error en get_categories: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/categories', methods=['POST'])
def create_category():
    try:
        data = request.get_json()
        print("Creando categoría:", data)
        
        if not data.get('name') or not data.get('slug'):
            return jsonify({'success': False, 'message': 'Nombre y slug son requeridos'}), 400
        
        # Verificar si ya existe
        existing_category = Category.query.filter_by(slug=data['slug']).first()
        if existing_category:
            return jsonify({'success': False, 'message': 'Ya existe una categoría con ese slug'}), 400
        
        nueva_categoria = Category(
            name=data['name'],
            slug=data['slug'],
            icon=data.get('icon', ''),
            description=data.get('description', '')
        )
        
        db.session.add(nueva_categoria)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Categoría creada exitosamente',
            'category': category_to_dict(nueva_categoria)
        }), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"Error creando categoría: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/categories/<int:category_id>', methods=['PUT'])
def update_category(category_id):
    try:
        data = request.get_json()
        print(f"Actualizando categoría {category_id}:", data)
        
        categoria = Category.query.get(category_id)
        if not categoria:
            return jsonify({'success': False, 'message': 'Categoría no encontrada'}), 404
        
        if 'name' in data:
            categoria.name = data['name']
        if 'slug' in data:
            existing = Category.query.filter(Category.slug == data['slug'], Category.id != category_id).first()
            if existing:
                return jsonify({'success': False, 'message': 'Ya existe otra categoría con ese slug'}), 400
            categoria.slug = data['slug']
        if 'icon' in data:
            categoria.icon = data['icon']
        if 'description' in data:
            categoria.description = data['description']
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Categoría actualizada exitosamente',
            'category': category_to_dict(categoria)
        })
        
    except Exception as e:
        db.session.rollback()
        print(f"Error actualizando categoría: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/categories/<int:category_id>', methods=['DELETE'])
def delete_category(category_id):
    try:
        print(f"Eliminando categoría {category_id}")
        
        categoria = Category.query.get(category_id)
        if not categoria:
            return jsonify({'success': False, 'message': 'Categoría no encontrada'}), 404
        
        # Verificar si hay productos asociados
        productos_asociados = Product.query.filter_by(category_id=category_id).count()
        if productos_asociados > 0:
            return jsonify({
                'success': False, 
                'message': f'No se puede eliminar la categoría porque tiene {productos_asociados} productos asociados'
            }), 400
        
        db.session.delete(categoria)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Categoría eliminada exitosamente'
        })
        
    except Exception as e:
        db.session.rollback()
        print(f"Error eliminando categoría: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/categories/<int:category_id>', methods=['GET'])
def get_category(category_id):
    try:
        categoria = Category.query.get(category_id)
        if not categoria:
            return jsonify({'success': False, 'message': 'Categoría no encontrada'}), 404
        
        return jsonify({
            'success': True,
            'category': category_to_dict(categoria)
        })
    except Exception as e:
        print(f"Error en get_category: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

# ==================== API - AUTENTICACIÓN ====================
@app.route('/api/admin/login', methods=['POST'])
def admin_login():
    try:
        data = request.get_json()
        print(f"Intento de login: {data}")
        
        if not data or 'username' not in data or 'password' not in data:
            return jsonify({'success': False, 'message': 'Datos incompletos'}), 400
        
        user = AdminUser.query.filter_by(username=data['username']).first()
        
        if user and user.password == data['password']:
            print(f"Login exitoso para: {data['username']}")
            return jsonify({
                'success': True,
                'token': 'dev-token-123',
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email
                }
            })
        else:
            print(f"Login fallido para: {data['username']}")
            return jsonify({'success': False, 'message': 'Credenciales inválidas'}), 401
            
    except Exception as e:
        print(f"Error en admin_login: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/verify')
def verify_token():
    try:
        return jsonify({
            'success': True,
            'user': {
                'id': 1,
                'username': 'admin',
                'email': 'admin@superluna.com'
            }
        })
    except Exception as e:
        print(f"Error en verify_token: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

# ==================== API - DASHBOARD ====================
@app.route('/api/admin/dashboard')
def get_dashboard():
    try:
        total_products = Product.query.filter_by(is_active=True).count()
        total_categories = Category.query.count()
        active_offers = Product.query.filter_by(is_daily_offer=True, is_active=True).count()
        low_stock = Product.query.filter(Product.stock <= 10, Product.is_active == True).count()
        
        print(f"Estadísticas: productos={total_products}, categorías={total_categories}")
        
        return jsonify({
            'success': True,
            'stats': {
                'totalProducts': total_products,
                'totalCategories': total_categories,
                'activeOffers': active_offers,
                'lowStock': low_stock,
                'todayOrders': 24,
                'todayRevenue': 1250.00
            }
        })
    except Exception as e:
        print(f"Error en get_dashboard: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

# ==================== FUNCIONES AUXILIARES ====================
def product_to_dict(product):
    try:
        return {
            'id': product.id,
            'name': product.name,
            'description': product.description or '',
            'price': float(product.price),
            'original_price': float(product.original_price or product.price),
            'discount': float(product.discount or 0),
            'icon': product.icon or '',
            'image_url': product.image_url or '',
            'stock': product.stock or 0,
            'sold': product.sold or 0,
            'category_id': product.category_id,
            'category_name': product.category.name if product.category else '',
            'is_daily_offer': bool(product.is_daily_offer),
            'is_active': bool(product.is_active),
            'available_stock': (product.stock or 0) - (product.sold or 0),
            # Nuevas propiedades
            'destacado': bool(product.destacado),
            'orden_destacado': product.orden_destacado or 0,
            'fecha_inicio_oferta': product.fecha_inicio_oferta.isoformat() if product.fecha_inicio_oferta else None,
            'fecha_fin_oferta': product.fecha_fin_oferta.isoformat() if product.fecha_fin_oferta else None,
            'oferta_activa': product.oferta_activa,
            'porcentaje_descuento': product.porcentaje_descuento,
            'dias_restantes_oferta': product.dias_restantes_oferta
        }
    except Exception as e:
        print(f"Error en product_to_dict: {str(e)}")
        return {}

def category_to_dict(category):
    try:
        return {
            'id': category.id,
            'name': category.name,
            'slug': category.slug,
            'icon': category.icon or '',
            'description': category.description or '',
            'product_count': Product.query.filter_by(category_id=category.id, is_active=True).count()
        }
    except Exception as e:
        print(f"Error en category_to_dict: {str(e)}")
        return {}

# ==================== INICIALIZACIÓN ====================
def create_sample_data():
    with app.app_context():
        try:
            print("Creando tablas...")
            db.create_all()
            
            if Category.query.count() == 0:
                print("Creando categorías...")
                categories = [
                    Category(name='Frutas y Verduras', slug='frutas-verduras', icon='', description='Productos frescos y naturales'),
                    Category(name='Carnes y Pescados', slug='carnes-pescados', icon='', description='Calidad y frescura garantizada'),
                    Category(name='Lácteos y Huevos', slug='lacteos-huevos', icon='', description='Nutrición y sabor'),
                    Category(name='Despensa', slug='despensa', icon='', description='Todo lo esencial para tu hogar'),
                    Category(name='Bebidas', slug='bebidas', icon='', description='Refrescos, jugos y más'),
                ]
                
                for category in categories:
                    db.session.add(category)
                db.session.commit()
                print("Categorías creadas")

            if Product.query.count() == 0:
                print("Creando productos de ejemplo...")
                categories = Category.query.all()
                categories_dict = {cat.slug: cat.id for cat in categories}
                
                products = [
                    Product(
                        name='Manzanas Fuji Importadas',
                        description='Manzanas frescas y crujientes',
                        price=1.99, original_price=3.49, discount=43, icon='',
                        stock=30, sold=22, category_id=categories_dict['frutas-verduras'],
                        is_daily_offer=True,
                        destacado=True,
                        orden_destacado=1,
                        fecha_inicio_oferta=datetime.utcnow(),
                        fecha_fin_oferta=datetime.utcnow() + timedelta(days=7)
                    ),
                    Product(
                        name='Pechuga de Pollo Premium',
                        description='Pechuga de pollo fresca',
                        price=6.99, original_price=9.99, discount=30, icon='',
                        stock=15, sold=8, category_id=categories_dict['carnes-pescados'],
                        is_daily_offer=True,
                        destacado=True,
                        orden_destacado=2
                    ),
                    Product(
                        name='Leche Entera 1L',
                        description='Leche fresca pasteurizada',
                        price=2.49, original_price=2.49, discount=0, icon='',
                        stock=50, sold=15, category_id=categories_dict['lacteos-huevos'],
                        is_daily_offer=False
                    ),
                    Product(
                        name='Arroz Integral 1kg',
                        description='Arroz integral de grano largo',
                        price=3.99, original_price=4.99, discount=20, icon='',
                        stock=25, sold=10, category_id=categories_dict['despensa'],
                        is_daily_offer=False,
                        destacado=True,
                        orden_destacado=3
                    ),
                    Product(
                        name='Agua Mineral 500ml',
                        description='Agua mineral natural',
                        price=1.20, original_price=1.20, discount=0, icon='',
                        stock=100, sold=45, category_id=categories_dict['bebidas'],
                        is_daily_offer=False
                    )
                ]
                
                for product in products:
                    db.session.add(product)
                db.session.commit()
                print("Productos creados")

            if AdminUser.query.filter_by(username='admin').first() is None:
                print("Creando usuario admin...")
                admin = AdminUser(
                    username='admin',
                    password='admin123',
                    email='admin@superluna.com'
                )
                db.session.add(admin)
                db.session.commit()
                print("Usuario admin creado")
                
            print("Base de datos inicializada correctamente!")
            
        except Exception as e:
            print(f"Error en create_sample_data: {str(e)}")
            db.session.rollback()

# ==================== MANEJO DE ERRORES ====================
@app.errorhandler(404)
def not_found(error):
    return jsonify({'success': False, 'error': 'Endpoint no encontrado'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'success': False, 'error': 'Error interno del servidor'}), 500


@app.route('/api/products', methods=['POST'])
def create_product():
    try:
        data = request.get_json()
        print("Creando producto:", data)
        
        # Validaciones básicas
        if not data.get('name') or not data.get('price'):
            return jsonify({'success': False, 'message': 'Nombre y precio son requeridos'}), 400
        
        # Calcular descuento automáticamente
        original_price = data.get('original_price', data['price'])
        discount = 0
        if original_price > data['price']:
            discount = ((original_price - data['price']) / original_price) * 100
        
        # Procesar fechas de oferta
        fecha_inicio_oferta = None
        fecha_fin_oferta = None
        
        if data.get('fecha_inicio_oferta'):
            fecha_inicio_oferta = datetime.fromisoformat(data['fecha_inicio_oferta'].replace('Z', '+00:00'))
        if data.get('fecha_fin_oferta'):
            fecha_fin_oferta = datetime.fromisoformat(data['fecha_fin_oferta'].replace('Z', '+00:00'))
        
        nuevo_producto = Product(
            name=data['name'],
            description=data.get('description', ''),
            price=float(data['price']),
            original_price=float(original_price),
            discount=round(discount, 1),
            icon=data.get('icon', ''),
            stock=int(data.get('stock', 0)),
            category_id=int(data['category_id']),
            is_daily_offer=bool(data.get('is_daily_offer', False)),
            is_active=True,
            destacado=bool(data.get('destacado', False)),
            orden_destacado=int(data.get('orden_destacado', 0)),
            fecha_inicio_oferta=fecha_inicio_oferta,
            fecha_fin_oferta=fecha_fin_oferta
        )
        
        db.session.add(nuevo_producto)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Producto creado exitosamente',
            'product': product_to_dict(nuevo_producto)
        }), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"Error creando producto: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/products/<int:product_id>', methods=['PUT'])
def update_product(product_id):
    try:
        data = request.get_json()
        print(f"Actualizando producto {product_id}:", data)
        
        producto = Product.query.get(product_id)
        if not producto:
            return jsonify({'success': False, 'message': 'Producto no encontrado'}), 404
        
        # Actualizar campos
        if 'name' in data:
            producto.name = data['name']
        if 'description' in data:
            producto.description = data['description']
        if 'price' in data:
            producto.price = float(data['price'])
        if 'original_price' in data:
            producto.original_price = float(data['original_price'])
        if 'stock' in data:
            producto.stock = int(data['stock'])
        if 'category_id' in data:
            producto.category_id = int(data['category_id'])
        if 'is_daily_offer' in data:
            producto.is_daily_offer = bool(data['is_daily_offer'])
        if 'is_active' in data:
            producto.is_active = bool(data['is_active'])
        if 'icon' in data:
            producto.icon = data['icon']
        if 'destacado' in data:
            producto.destacado = bool(data['destacado'])
        if 'orden_destacado' in data:
            producto.orden_destacado = int(data['orden_destacado'])
        if 'fecha_inicio_oferta' in data:
            producto.fecha_inicio_oferta = datetime.fromisoformat(data['fecha_inicio_oferta'].replace('Z', '+00:00')) if data['fecha_inicio_oferta'] else None
        if 'fecha_fin_oferta' in data:
            producto.fecha_fin_oferta = datetime.fromisoformat(data['fecha_fin_oferta'].replace('Z', '+00:00')) if data['fecha_fin_oferta'] else None
        
        # Recalcular descuento
        if producto.original_price and producto.original_price > producto.price:
            producto.discount = ((producto.original_price - producto.price) / producto.original_price) * 100
        else:
            producto.discount = 0
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Producto actualizado exitosamente',
            'product': product_to_dict(producto)
        })
        
    except Exception as e:
        db.session.rollback()
        print(f"Error actualizando producto: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/products/<int:product_id>', methods=['DELETE'])
def delete_product(product_id):
    try:
        print(f"Eliminando producto {product_id}")
        
        producto = Product.query.get(product_id)
        if not producto:
            return jsonify({'success': False, 'message': 'Producto no encontrado'}), 404
        
        # Soft delete - marcar como inactivo en lugar de eliminar
        producto.is_active = False
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Producto eliminado exitosamente'
        })
        
    except Exception as e:
        db.session.rollback()
        print(f"Error eliminando producto: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

# ==================== EJECUCIÓN ====================
if __name__ == '__main__':
    print("Iniciando SuperLuna...")
    create_sample_data()
    print("Servidor listo en http://localhost:5000")
    app.run(debug=True, port=5000, host='0.0.0.0')