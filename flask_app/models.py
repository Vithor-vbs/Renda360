from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(256), nullable=False)


class Card(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    number = db.Column(db.String(32), nullable=False)
    expiration_date = db.Column(db.String(10), nullable=False)
    # 'credito' ou 'debito'
    card_type = db.Column(db.String(16), nullable=False)
    available_limit = db.Column(db.Float, nullable=True)
    used_limit = db.Column(db.Float, nullable=True)
    brand = db.Column(db.String(32), nullable=True)
    name = db.Column(db.String(64), nullable=True)
    created_at = db.Column(db.DateTime, server_default=db.func.now())
    updated_at = db.Column(
        db.DateTime, server_default=db.func.now(), onupdate=db.func.now())
    statements = db.relationship('PDFExtractable', backref='card', lazy=True)


class PDFExtractable(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    card_id = db.Column(db.Integer, db.ForeignKey('card.id'), nullable=False)
    file_name = db.Column(db.String(256), nullable=False)
    # MD5 hash for duplicate detection
    file_hash = db.Column(db.String(32), nullable=True, index=True)
    uploaded_at = db.Column(db.DateTime, server_default=db.func.now())
    statement_date = db.Column(db.String(20), nullable=True)
    statement_period_start = db.Column(db.String(20), nullable=True)
    statement_period_end = db.Column(db.String(20), nullable=True)
    previous_invoice = db.Column(db.Float, nullable=True)
    payment_received = db.Column(db.Float, nullable=True)
    total_purchases = db.Column(db.Float, nullable=True)
    other_charges = db.Column(db.Float, nullable=True)
    total_to_pay = db.Column(db.Float, nullable=True)
    next_closing_date = db.Column(db.String(20), nullable=True)
    next_invoice_balance = db.Column(db.Float, nullable=True)
    total_open_balance = db.Column(db.Float, nullable=True)
    # For extra data or categories
    summary_json = db.Column(db.Text, nullable=True)
    transactions = db.relationship('Transaction', backref='pdf', lazy=True)
    pdf_content_oid = db.Column(db.Integer, nullable=True)


class Transaction(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.String(20), nullable=False)  # ISO format: "2025-08-21"
    # Cleaned description
    description = db.Column(db.String(256), nullable=False)
    description_original = db.Column(
        db.String(500), nullable=True)  # Original raw description
    amount = db.Column(db.Float, nullable=False)
    pdf_id = db.Column(db.Integer, db.ForeignKey(
        'pdf_extractable.id'), nullable=False)

    # Enhanced fields for intelligent categorization
    # e.g., "food_delivery", "groceries"
    category = db.Column(db.String(50), nullable=True)
    # e.g., "Uber Eats", "Carrefour"
    merchant = db.Column(db.String(200), nullable=True)
    is_installment = db.Column(db.Boolean, default=False, nullable=False)
    installment_info = db.Column(db.String(20), nullable=True)  # e.g., "2/6"

    # Timestamps for better tracking
    created_at = db.Column(db.DateTime, server_default=db.func.now())
    updated_at = db.Column(
        db.DateTime, server_default=db.func.now(), onupdate=db.func.now())


class ConversationSession(db.Model):
    """Chat session for Julius AI conversations"""
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    session_id = db.Column(db.String(50), nullable=False,
                           unique=True)  # UUID for frontend
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, server_default=db.func.now())
    updated_at = db.Column(
        db.DateTime, server_default=db.func.now(), onupdate=db.func.now())

    # Relationships
    messages = db.relationship(
        'ConversationMessage', backref='session', lazy=True, cascade='all, delete-orphan')

    # Index for faster queries
    __table_args__ = (
        db.Index('idx_user_active_session', 'user_id', 'is_active'),)


class ConversationMessage(db.Model):
    """Individual messages in Julius AI conversations"""
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.String(50), db.ForeignKey(
        'conversation_session.session_id'), nullable=False)
    # 'user' or 'assistant'
    message_type = db.Column(db.String(20), nullable=False)
    content = db.Column(db.Text, nullable=False)

    # Metadata for Julius AI context
    # 'pattern_match', 'vector_search', 'llm_query'
    query_type = db.Column(db.String(50), nullable=True)
    # 'aggressive', 'balanced', 'quality'
    optimization_level = db.Column(db.String(20), nullable=True)
    response_time_ms = db.Column(
        db.Integer, nullable=True)  # Performance tracking
    cost_estimate = db.Column(db.Float, nullable=True)  # Cost tracking

    created_at = db.Column(db.DateTime, server_default=db.func.now())

    # Index for faster message retrieval
    __table_args__ = (db.Index('idx_session_created',
                      'session_id', 'created_at'),)

# outras tabelinhas pussy ...
