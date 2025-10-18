 from flask import Blueprint, request, jsonify
from database import db
from models import Product, Category

products_bp = Blueprint('products', __name__)

@products_bp.route('/api/products', methods=['GET'])
def get_products():
    category = request.args.get('category')
    is_offer = request.args.get('is_offer')
    
    query = Product.query.filter_by(is_active=True)
    
    if category:
        query = query.filter_by(category_id=category)
    
    if is_offer:
        query = query.filter(Product.discount > 0)
    
    products = query.all()
    
    return jsonify({
        'success': True,
        'products': [product_to_dict(product) for product in products]
    })

@products_bp.route('/api/products/<int:product_id>', methods=['GET'])
def get_product(product_id):
    product = Product.query.get_or_404(product_id)
    return jsonify({
        'success': True,
        'product': product_to_dict(product)
    })

@products_bp.route('/api/products', methods=['POST'])
def create_product():
    data = request.json
    
    product = Product(
        name=data['name'],
        description=data.get('description', ''),
        price=data['price'],
        original_price=data.get('original_price', data['price']),
        discount=data.get('discount', 0),
        icon=data.get('icon', '📦'),
        image_url=data.get('image_url', ''),
        stock=data.get('stock', 0),
        category_id=data['category_id'],
        is_daily_offer=data.get('is_daily_offer', False)
    )
    
    db.session.add(product)
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': 'Producto creado exitosamente',
        'product': product_to_dict(product)
    }), 201

@products_bp.route('/api/products/<int:product_id>', methods=['PUT'])
def update_product(product_id):
    product = Product.query.get_or_404(product_id)
    data = request.json
    
    product.name = data.get('name', product.name)
    product.description = data.get('description', product.description)
    product.price = data.get('price', product.price)
    product.original_price = data.get('original_price', product.original_price)
    product.discount = data.get('discount', product.discount)
    product.icon = data.get('icon', product.icon)
    product.image_url = data.get('image_url', product.image_url)
    product.stock = data.get('stock', product.stock)
    product.category_id = data.get('category_id', product.category_id)
    product.is_daily_offer = data.get('is_daily_offer', product.is_daily_offer)
    product.is_active = data.get('is_active', product.is_active)
    
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': 'Producto actualizado exitosamente',
        'product': product_to_dict(product)
    })

@products_bp.route('/api/products/<int:product_id>', methods=['DELETE'])
def delete_product(product_id):
    product = Product.query.get_or_404(product_id)
    
    # Soft delete
    product.is_active = False
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': 'Producto eliminado exitosamente'
    })

def product_to_dict(product):
    return {
        'id': product.id,
        'name': product.name,
        'description': product.description,
        'price': product.price,
        'original_price': product.original_price,
        'discount': product.discount,
        'icon': product.icon,
        'image_url': product.image_url,
        'stock': product.stock,
        'sold': product.sold,
        'category_id': product.category_id,
        'category_name': product.category_ref.name if product.category_ref else '',
        'is_daily_offer': product.is_daily_offer,
        'is_active': product.is_active,
        'available_stock': product.stock - product.sold
    }