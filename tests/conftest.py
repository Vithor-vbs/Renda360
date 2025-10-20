# tests/conftest.py - VERSÃO FINAL FUNCIONAL
import sys
import os
import pytest

# Configura paths
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.join(current_dir, '..')
sys.path.insert(0, project_root)
sys.path.insert(0, os.path.join(project_root, 'flask_app'))

@pytest.fixture(scope="session")
def app():
    """Cria aplicação Flask para testes - VERSÃO SIMPLIFICADA"""
    from flask import Flask
    from flask_sqlalchemy import SQLAlchemy
    from flask_jwt_extended import JWTManager
    from flask_cors import CORS
    
    # ✅ 1. NOVA APLICAÇÃO
    app = Flask(__name__)
    
    # ✅ 2. CONFIGURAÇÃO
    app.config.update({
        "TESTING": True,
        "SQLALCHEMY_DATABASE_URI": "sqlite:///test.db",
        "SQLALCHEMY_TRACK_MODIFICATIONS": False,
        "JWT_SECRET_KEY": "test-secret-key-for-tests",
        "SQLALCHEMY_ECHO": True,
    })
    
    # ✅ 3. UMA ÚNICA INSTÂNCIA DO DB (usando a mesma em todo lugar)
    db = SQLAlchemy(app)  # ✅ Inicializa DIRETAMENTE com o app
    
    # ✅ 4. DEFINE MODELOS LOCAIS
    class User(db.Model):
        __tablename__ = 'user'
        id = db.Column(db.Integer, primary_key=True)
        username = db.Column(db.String(80), unique=True, nullable=False)
        email = db.Column(db.String(120), unique=True, nullable=False)
        password = db.Column(db.String(256), nullable=False)
        
        def __repr__(self):
            return f'<User {self.username}>'
    
    class Card(db.Model):
        __tablename__ = 'card'
        id = db.Column(db.Integer, primary_key=True)
        user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
        number = db.Column(db.String(32), nullable=False)
        expiration_date = db.Column(db.String(10), nullable=False)
        card_type = db.Column(db.String(16), nullable=False)
        available_limit = db.Column(db.Float)
        used_limit = db.Column(db.Float)
        brand = db.Column(db.String(32))
        name = db.Column(db.String(64))
        
        def __repr__(self):
            return f'<Card {self.number}>'
        
    class PDFExtractable(db.Model):
        __tablename__ = 'pdf_extractable'
        id = db.Column(db.Integer, primary_key=True)
        card_id = db.Column(db.Integer, db.ForeignKey('card.id'), nullable=False)
        file_name = db.Column(db.String(256), nullable=False)
        file_hash = db.Column(db.String(32))
        uploaded_at = db.Column(db.DateTime, server_default=db.func.now())
        statement_date = db.Column(db.String(20))
        statement_period_start = db.Column(db.String(20))
        statement_period_end = db.Column(db.String(20))
        previous_invoice = db.Column(db.Float)
        payment_received = db.Column(db.Float)
        total_purchases = db.Column(db.Float)
        other_charges = db.Column(db.Float)
        total_to_pay = db.Column(db.Float)
        next_closing_date = db.Column(db.String(20))
        next_invoice_balance = db.Column(db.Float)
        total_open_balance = db.Column(db.Float)
        summary_json = db.Column(db.Text)
        pdf_content_oid = db.Column(db.Integer)
        
        def __repr__(self):
            return f'<PDFExtractable {self.file_name}>'
        
    class Transaction(db.Model):
        __tablename__ = 'transaction'
        id = db.Column(db.Integer, primary_key=True)
        date = db.Column(db.String(20), nullable=False)
        description = db.Column(db.String(256), nullable=False)
        description_original = db.Column(db.String(500))
        amount = db.Column(db.Float, nullable=False)
        pdf_id = db.Column(db.Integer, db.ForeignKey('pdf_extractable.id'), nullable=False)
        category = db.Column(db.String(50))
        merchant = db.Column(db.String(200))
        is_installment = db.Column(db.Boolean, nullable=False, default=False)
        installment_info = db.Column(db.String(20))
        created_at = db.Column(db.DateTime, server_default=db.func.now())
        updated_at = db.Column(db.DateTime, server_default=db.func.now(), onupdate=db.func.now())
        
        def __repr__(self):
            return f'<Transaction {self.description}>'
    
    # ✅ 5. INICIALIZA OUTRAS EXTENSÕES
    JWTManager(app)
    CORS(app)
    
    # ✅ 6. REGISTRA BLUEPRINTS
    from flask_app.routes.auth import auth_bp
    from flask_app.routes.user import user_bp  
    from flask_app.routes.julius import julius_bp
    from flask_app.routes.statements import statements_bp
    from flask_app.routes.dashboard import dashboard_bp
    
    app.register_blueprint(auth_bp)
    app.register_blueprint(user_bp, url_prefix='/users')
    app.register_blueprint(statements_bp)
    app.register_blueprint(julius_bp, url_prefix='/julius')
    app.register_blueprint(dashboard_bp)
    
    # ✅ 7. SUBSTITUI MODELOS NAS ROTAS
    import flask_app.routes.auth
    flask_app.routes.auth.User = User
    flask_app.routes.auth.Card = Card
    flask_app.routes.auth.db = db

    import flask_app.routes.user
    flask_app.routes.user.User = User
    flask_app.routes.user.db = db

    # ✅ ✅ ✅ ADICIONE ESTAS LINHAS PARA STATEMENTS!
    import flask_app.routes.statements
    flask_app.routes.statements.User = User
    flask_app.routes.statements.Card = Card
    flask_app.routes.statements.PDFExtractable = PDFExtractable 
    flask_app.routes.statements.Transaction = Transaction       
    flask_app.routes.statements.db = db

    # ✅ E também para outras rotas que usam database
    import flask_app.routes.julius
    flask_app.routes.julius.User = User
    flask_app.routes.julius.db = db

    import flask_app.routes.dashboard
    flask_app.routes.dashboard.User = User
    flask_app.routes.dashboard.db = db
    
    # ✅ 8. CRIA TABELAS
    with app.app_context():
        db.create_all()
        print("✅ Tabelas criadas no SQLite!")
    
    yield app
    
    # ✅ 9. LIMPEZA
    with app.app_context():
        db.drop_all()
        if os.path.exists("test.db"):
            os.remove("test.db")
        print("✅ Banco de teste limpo")

@pytest.fixture
def client(app):
    return app.test_client()

@pytest.fixture
def db(app):
    """Fornece transação isolada - usa a MESMA instância do app"""
    # ✅ USA a mesma instância já registrada no app
    db = app.extensions['sqlalchemy']
    
    with app.app_context():
        connection = db.engine.connect()
        transaction = connection.begin()
        
        from sqlalchemy.orm import sessionmaker, scoped_session
        session_factory = sessionmaker(bind=connection)
        Session = scoped_session(session_factory)
        db.session = Session
        
        yield db
        
        transaction.rollback()
        connection.close()
        Session.remove()

@pytest.fixture
def auth_headers(client, db):
    """Cria headers de autenticação"""
    with client.application.app_context():
        from flask_app.routes.auth import User
        from flask_jwt_extended import create_access_token
        
        user = User(username='testuser', email='test@example.com', password='testpass')
        db.session.add(user)
        db.session.commit()

        token = create_access_token(identity=str(user.id))
        return {'Authorization': f'Bearer {token}'}