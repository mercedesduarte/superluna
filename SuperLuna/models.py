from flask_sqlalchemy import SQLAlchemy

from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()

class Usuarios(db.Model):
    __tablename__ = 'usuarios'
    
    id = db.Column(db.Integer, primary_key=True)
    correo = db.Column(db.String(120), unique=True, nullable=False)
    nombre_usuario = db.Column(db.String(100), unique=True, nullable=False)
    telefono = db.Column(db.String(20), nullable=True)
    password_hash = db.Column(db.String(200), nullable=False)
    is_staff = db.Column(db.Boolean, default=False)
    is_superuser = db.Column(db.Boolean, default=False)
    activo = db.Column(db.Boolean, default=True)
    codigo_activacion = db.Column(db.Integer, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def __repr__(self):
        return f'<Usuario {self.correo}>'

class CategoriasProducto(db.Model):
    __tablename__ = 'categorias_producto'
    
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), unique=True, nullable=False)
    slug = db.Column(db.String(100), unique=True, nullable=False)
    icono = db.Column(db.String(50), nullable=True)
    descripcion = db.Column(db.Text, nullable=True)
    imagen = db.Column(db.String(500), nullable=True)  # Para Flask, usamos string para la ruta
    fecha_creacion = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f'<Categoria {self.nombre}>'

class Productos(db.Model):
    __tablename__ = 'productos'
    
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(200), nullable=False)
    descripcion = db.Column(db.Text, nullable=True)
    precio = db.Column(db.Float, nullable=False)
    precio_original = db.Column(db.Float, nullable=True)
    precio_oferta = db.Column(db.Float, nullable=True)
    categoria_id = db.Column(db.Integer, db.ForeignKey('categorias_producto.id'), nullable=False)
    stock = db.Column(db.Integer, default=0)
    vendidos = db.Column(db.Integer, default=0)
    icono = db.Column(db.String(50), nullable=True)
    imagen = db.Column(db.String(500), nullable=True)
    imagen_url = db.Column(db.String(500), nullable=True)
    activo = db.Column(db.Boolean, default=True)
    fecha_creacion = db.Column(db.DateTime, default=datetime.utcnow)
    fecha_actualizacion = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    es_oferta_dia = db.Column(db.Boolean, default=False)
    fecha_inicio_oferta = db.Column(db.DateTime, nullable=True)
    fecha_fin_oferta = db.Column(db.DateTime, nullable=True)
    destacado = db.Column(db.Boolean, default=False)
    orden_destacado = db.Column(db.Integer, default=0)

    # Relación
    categoria = db.relationship('CategoriasProducto', backref='productos')

    @property
    def oferta_activa(self):
        """Verifica si la oferta está actualmente activa"""
        if not self.es_oferta_dia or not self.precio_oferta:
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
        if not self.precio_oferta or self.precio == 0:
            return 0
        return int(((self.precio - self.precio_oferta) / self.precio) * 100)

    @property
    def dias_restantes_oferta(self):
        """Calcula dias restantes para ofertas con fecha fin"""
        if not self.fecha_fin_oferta:
            return None
        ahora = datetime.utcnow()
        if ahora > self.fecha_fin_oferta:
            return 0
        return (self.fecha_fin_oferta - ahora).days

    def __repr__(self):
        return f'<Producto {self.nombre} - ${self.precio}>'

class Direcciones(db.Model):
    __tablename__ = 'direcciones'
    
    id = db.Column(db.Integer, primary_key=True)
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuarios.id'), nullable=False)
    alias = db.Column(db.String(100), nullable=False)
    direccion = db.Column(db.String(255), nullable=False)
    ciudad = db.Column(db.String(100), nullable=False)
    provincia = db.Column(db.String(100), nullable=False)
    codigo_postal = db.Column(db.String(20), nullable=False)
    referencia = db.Column(db.Text, nullable=True)
    principal = db.Column(db.Boolean, default=False)

    # Relación
    usuario = db.relationship('Usuarios', backref='direcciones')

    def __repr__(self):
        return f'<Direccion {self.alias} - {self.usuario.nombre_usuario}>'

class CarritoCompras(db.Model):
    __tablename__ = 'carrito_compras'
    
    id = db.Column(db.Integer, primary_key=True)
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuarios.id'), nullable=False)
    fecha_creacion = db.Column(db.DateTime, default=datetime.utcnow)
    activo = db.Column(db.Boolean, default=True)

    # Relación
    usuario = db.relationship('Usuarios', backref='carritos')
    items = db.relationship('ItemsCarrito', backref='carrito', lazy=True)

    @property
    def total(self):
        return sum(item.subtotal for item in self.items)

    def __repr__(self):
        return f'<Carrito de {self.usuario.nombre_usuario} - ${self.total}>'

class ItemsCarrito(db.Model):
    __tablename__ = 'items_carrito'
    
    id = db.Column(db.Integer, primary_key=True)
    carrito_id = db.Column(db.Integer, db.ForeignKey('carrito_compras.id'), nullable=False)
    producto_id = db.Column(db.Integer, db.ForeignKey('productos.id'), nullable=False)
    cantidad = db.Column(db.Integer, default=1)

    # Relaciones
    producto = db.relationship('Productos')

    @property
    def subtotal(self):
        precio = self.producto.precio_oferta if self.producto.oferta_activa else self.producto.precio
        return precio * self.cantidad

    def __repr__(self):
        return f'<Item {self.cantidad} x {self.producto.nombre}>'