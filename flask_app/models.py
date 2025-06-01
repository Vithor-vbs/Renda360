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


class Transaction(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.String(20), nullable=False)
    description = db.Column(db.String(256), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    pdf_id = db.Column(db.Integer, db.ForeignKey(
        'pdf_extractable.id'), nullable=False)

# outras tabelinhas pussy ...
