from flask import Blueprint, request, jsonify
from database import db
from models import Product

offers_bp = Blueprint('offers', __name__)

@offers_bp.route('/api/offers/daily', methods=['GET'])
def get_daily_offers():
    offers = Product.query.filter(
        Product.is_daily_offer == True,
        Product.is_active == True,
        Product.discount > 0
    ).all()
    
    return jsonify({
        'success': True,
        'offers': [product_to_dict(offer) for offer in offers]
    })

@offers_bp.route('/api/offers', methods=['GET'])
def get_all_offers():
    offers = Product.query.filter(
        Product.is_active == True,
        Product.discount > 0
    ).all()
    
    return jsonify({
        'success': True,
        'offers': [product_to_dict(offer) for offer in offers]
    })

@offers_bp.route('/api/offers/<int:offer_id>/stock', methods=['PUT'])
def update_offer_stock(offer_id):
    product = Product.query.get_or_404(offer_id)
    data = request.json
    
    if 'sold' in data:
        product.sold = data['sold']
    
    if 'stock' in data:
        product.stock = data['stock']
    
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': 'Stock actualizado exitosamente',
        'product': product_to_dict(product)
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
        'is_daily_offer': product.is_daily_offer,
        'available_stock': product.stock - product.sold
    }