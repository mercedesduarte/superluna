from flask import Blueprint, request, jsonify
from database import db
from models import Product, Category
from datetime import datetime, timedelta


offers_bp = Blueprint('offers', __name__)

def product_to_dict(product):
    """Convierte un producto a diccionario para JSON"""
    try:
        category_name = ""
        if product.category:
            category_name = product.category.name
        
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
            'category_name': category_name,
            'is_daily_offer': bool(product.is_daily_offer),
            'is_active': bool(product.is_active),
            'available_stock': (product.stock or 0) - (product.sold or 0),
            'fecha_inicio_oferta': product.fecha_inicio_oferta.isoformat() if product.fecha_inicio_oferta else None,
            'fecha_fin_oferta': product.fecha_fin_oferta.isoformat() if product.fecha_fin_oferta else None,
            'destacado': bool(product.destacado),
            'orden_destacado': product.orden_destacado or 0
        }
    except Exception as e:
        print(f"Error en product_to_dict: {str(e)}")
        return {}

@offers_bp.route('/api/offers/daily', methods=['GET'])
def get_daily_offers():
    """Obtiene todas las ofertas del día activas"""
    try:
        # Obtener ofertas del día que estén activas y tengan descuento
        offers = Product.query.filter(
            Product.is_daily_offer == True,
            Product.is_active == True
        ).all()
        
        # Filtrar ofertas que estén activas según sus fechas
        active_offers = []
        now = datetime.utcnow()
        
        for offer in offers:
            # Verificar si la oferta está activa según las fechas
            if offer.fecha_inicio_oferta and offer.fecha_fin_oferta:
                if offer.fecha_inicio_oferta <= now <= offer.fecha_fin_oferta:
                    active_offers.append(offer)
            elif offer.fecha_inicio_oferta and not offer.fecha_fin_oferta:
                if offer.fecha_inicio_oferta <= now:
                    active_offers.append(offer)
            elif not offer.fecha_inicio_oferta and offer.fecha_fin_oferta:
                if now <= offer.fecha_fin_oferta:
                    active_offers.append(offer)
            else:
                # Sin fechas específicas, siempre está activa
                active_offers.append(offer)
        
        print(f"Encontradas {len(active_offers)} ofertas del día activas")
        
        return jsonify({
            'success': True,
            'offers': [product_to_dict(offer) for offer in active_offers],
            'count': len(active_offers)
        })
        
    except Exception as e:
        print(f"Error en get_daily_offers: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Error interno del servidor',
            'message': str(e)
        }), 500

@offers_bp.route('/api/offers', methods=['GET'])
def get_all_offers():
    """Obtiene todas las ofertas activas (con descuento)"""
    try:
        # Obtener productos con descuento que estén activos
        offers = Product.query.filter(
            Product.is_active == True,
            Product.discount > 0
        ).all()
        
        # Filtrar ofertas que estén activas según sus fechas
        active_offers = []
        now = datetime.utcnow()
        
        for offer in offers:
            # Solo incluir si es oferta del día o tiene fechas válidas
            if offer.is_daily_offer:
                if offer.fecha_inicio_oferta and offer.fecha_fin_oferta:
                    if offer.fecha_inicio_oferta <= now <= offer.fecha_fin_oferta:
                        active_offers.append(offer)
                elif offer.fecha_inicio_oferta and not offer.fecha_fin_oferta:
                    if offer.fecha_inicio_oferta <= now:
                        active_offers.append(offer)
                elif not offer.fecha_inicio_oferta and offer.fecha_fin_oferta:
                    if now <= offer.fecha_fin_oferta:
                        active_offers.append(offer)
                else:
                    active_offers.append(offer)
            else:
                # Productos con descuento pero no son ofertas del día
                active_offers.append(offer)
        
        print(f"Encontradas {len(active_offers)} ofertas activas")
        
        return jsonify({
            'success': True,
            'offers': [product_to_dict(offer) for offer in active_offers],
            'count': len(active_offers)
        })
        
    except Exception as e:
        print(f"Error en get_all_offers: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Error interno del servidor',
            'message': str(e)
        }), 500

@offers_bp.route('/api/offers/featured', methods=['GET'])
def get_featured_offers():
    """Obtiene ofertas destacadas"""
    try:
        featured_offers = Product.query.filter(
            Product.destacado == True,
            Product.is_active == True
        ).order_by(Product.orden_destacado.asc()).all()
        
        print(f"Encontradas {len(featured_offers)} ofertas destacadas")
        
        return jsonify({
            'success': True,
            'offers': [product_to_dict(offer) for offer in featured_offers],
            'count': len(featured_offers)
        })
        
    except Exception as e:
        print(f"Error en get_featured_offers: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Error interno del servidor',
            'message': str(e)
        }), 500

@offers_bp.route('/api/offers/<int:offer_id>/stock', methods=['PUT'])
def update_offer_stock(offer_id):
    """Actualiza el stock de una oferta"""
    try:
        product = Product.query.get(offer_id)
        if not product:
            return jsonify({
                'success': False,
                'message': 'Oferta no encontrada'
            }), 404
        
        data = request.get_json()
        if not data:
            return jsonify({
                'success': False,
                'message': 'No se proporcionaron datos'
            }), 400
        
        # Actualizar campos permitidos
        if 'sold' in data:
            try:
                product.sold = int(data['sold'])
            except (ValueError, TypeError):
                return jsonify({
                    'success': False,
                    'message': 'El valor de "sold" debe ser un número entero'
                }), 400
        
        if 'stock' in data:
            try:
                new_stock = int(data['stock'])
                if new_stock < 0:
                    return jsonify({
                        'success': False,
                        'message': 'El stock no puede ser negativo'
                    }), 400
                product.stock = new_stock
            except (ValueError, TypeError):
                return jsonify({
                    'success': False,
                    'message': 'El valor de "stock" debe ser un número entero'
                }), 400
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Stock actualizado exitosamente',
            'product': product_to_dict(product)
        })
        
    except Exception as e:
        db.session.rollback()
        print(f"Error en update_offer_stock: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Error interno del servidor',
            'message': str(e)
        }), 500

@offers_bp.route('/api/offers/<int:offer_id>/toggle', methods=['PUT'])
def toggle_daily_offer(offer_id):
    """Activa/desactiva una oferta del día"""
    try:
        product = Product.query.get(offer_id)
        if not product:
            return jsonify({
                'success': False,
                'message': 'Producto no encontrado'
            }), 404
        
        data = request.get_json()
        if not data or 'is_daily_offer' not in data:
            return jsonify({
                'success': False,
                'message': 'El campo is_daily_offer es requerido'
            }), 400
        
        product.is_daily_offer = bool(data['is_daily_offer'])
        
        # Si se activa como oferta del día, establecer fechas por defecto si no existen
        if product.is_daily_offer and not product.fecha_inicio_oferta:
            product.fecha_inicio_oferta = datetime.utcnow()
        
        db.session.commit()
        
        action = "activada" if product.is_daily_offer else "desactivada"
        return jsonify({
            'success': True,
            'message': f'Oferta del día {action} exitosamente',
            'product': product_to_dict(product)
        })
        
    except Exception as e:
        db.session.rollback()
        print(f"Error en toggle_daily_offer: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Error interno del servidor',
            'message': str(e)
        }), 500

@offers_bp.route('/api/offers/expiring', methods=['GET'])
def get_expiring_offers():
    """Obtiene ofertas que están por expirar"""
    try:
        now = datetime.utcnow()
        # Ofertas que expiran en los próximos 3 días
        three_days_later = now.replace(hour=23, minute=59, second=59) + timedelta(days=3)
        
        expiring_offers = Product.query.filter(
            Product.is_active == True,
            Product.is_daily_offer == True,
            Product.fecha_fin_oferta != None,
            Product.fecha_fin_oferta >= now,
            Product.fecha_fin_oferta <= three_days_later
        ).order_by(Product.fecha_fin_oferta.asc()).all()
        
        print(f"Encontradas {len(expiring_offers)} ofertas por expirar")
        
        return jsonify({
            'success': True,
            'offers': [product_to_dict(offer) for offer in expiring_offers],
            'count': len(expiring_offers)
        })
        
    except Exception as e:
        print(f"Error en get_expiring_offers: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Error interno del servidor',
            'message': str(e)
        }), 500