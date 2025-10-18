from flask import Blueprint, request, jsonify
from database import db
from models import Category

categories_bp = Blueprint('categories', __name__)

@categories_bp.route('/api/categories', methods=['GET'])
def get_categories():
    categories = Category.query.all()
    
    return jsonify({
        'success': True,
        'categories': [category_to_dict(category) for category in categories]
    })

@categories_bp.route('/api/categories/<int:category_id>', methods=['GET'])
def get_category(category_id):
    category = Category.query.get_or_404(category_id)
    
    return jsonify({
        'success': True,
        'category': category_to_dict(category)
    })

@categories_bp.route('/api/categories', methods=['POST'])
def create_category():
    data = request.json
    
    category = Category(
        name=data['name'],
        slug=data['slug'],
        icon=data.get('icon', '📦'),
        description=data.get('description', '')
    )
    
    db.session.add(category)
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': 'Categoría creada exitosamente',
        'category': category_to_dict(category)
    }), 201

def category_to_dict(category):
    return {
        'id': category.id,
        'name': category.name,
        'slug': category.slug,
        'icon': category.icon,
        'description': category.description,
        'product_count': len(category.products) if category.products else 0
    }