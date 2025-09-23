from flask import Blueprint, jsonify, request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask_app.pdf_extractor.pdf_extractor import NubankExtractor
from ..models import Card, PDFExtractable, Transaction, User, db
from flask_app.julius_ai import update_embeddings_for_user


statements_bp = Blueprint('statements', __name__)


@statements_bp.route('/upload_pdf', methods=['POST'])
@jwt_required()
def upload_pdf():
    if 'file' not in request.files or 'card_number' not in request.form:
        return jsonify({"msg": "File and card_number are required"}), 400
    file = request.files['file']
    card_number = request.form['card_number']
    if file.filename == '':
        return jsonify({"msg": "No selected file"}), 400

    # Save the uploaded file temporarily
    temp_path = f"/tmp/{file.filename}"
    file.save(temp_path)

    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(int(current_user_id))
        if not user:
            return jsonify({"msg": "User not found"}), 404

        # Find the card for this user
        card = Card.query.filter_by(
            user_id=user.id, number=card_number).first()
        if not card:
            return jsonify({"msg": "Card not found"}), 404

        with NubankExtractor(temp_path, year=2025) as extractor:
            # Extract all info using new normalized methods
            statement_summary = extractor.extract_nubank_summary()
            categories = extractor.get_spending_by_category()  # Enhanced categories
            period = extractor.extract_statement_period()
            invoice_summary = extractor.extract_invoice_summary()
            limits = extractor.extract_available_limits()
            next_info = extractor.extract_next_invoices()
            normalized_transactions = extractor.extract_normalized_transactions()  # New method

            # Update card limits
            if limits:
                card.used_limit = limits.get('used_limit')
                card.available_limit = limits.get('available_limit')
                db.session.add(card)

            # Create PDFExtractable
            pdf = PDFExtractable(
                card_id=card.id,
                file_name=file.filename,
                statement_date=statement_summary.get('statement_date'),
                statement_period_start=period.get('start_date'),
                statement_period_end=period.get('end_date'),
                previous_invoice=invoice_summary.get('previous_invoice'),
                payment_received=invoice_summary.get('payment_received'),
                total_purchases=invoice_summary.get('total_purchases'),
                other_charges=invoice_summary.get('other_charges'),
                total_to_pay=invoice_summary.get('total_to_pay'),
                next_closing_date=next_info.get('next_closing_date'),
                next_invoice_balance=next_info.get('next_invoice_balance'),
                total_open_balance=next_info.get('total_open_balance'),

                # Still thinking on how to store summary
                summary_json=str(categories)
            )
            db.session.add(pdf)
            db.session.flush()

            # Add normalized transactions with enhanced data
            for t in normalized_transactions:
                transaction = Transaction(
                    # Use normalized date format (YYYY-MM-DD)
                    date=t.date_formatted,
                    description=t.description,  # Use cleaned description
                    description_original=t.description_original,  # Preserve original
                    amount=t.amount,
                    category=t.category.value,  # Store category enum value
                    merchant=t.merchant,  # Store extracted merchant name
                    is_installment=t.is_installment,  # Installment detection
                    installment_info=t.installment_info,  # Installment details
                    pdf_id=pdf.id
                )
                db.session.add(transaction)

            db.session.commit()
            try:
                update_embeddings_for_user(user.id, pdf.id)
            except Exception as e:
                current_app.logger.error(
                    f"Failed to update embeddings: {str(e)}")
        return jsonify({"msg": f"{len(normalized_transactions)} transactions and PDF info saved"}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"msg": f"Error processing PDF: {e}"}), 500
    finally:
        # Clean up the temp file
        import os
        if os.path.exists(temp_path):
            os.remove(temp_path)


# Get all cards for the current user
@statements_bp.route('/cards', methods=['GET'])
@jwt_required()
def get_cards():
    current_user_id = get_jwt_identity()
    user = User.query.get(int(current_user_id))
    if not user:
        return jsonify({"msg": "User not found"}), 404
    cards = Card.query.filter_by(user_id=user.id).all()
    return jsonify([{
        "id": card.id,
        "number": card.number,
        "expiration_date": card.expiration_date,
        "card_type": card.card_type,
        "available_limit": card.available_limit,
        "used_limit": card.used_limit,
        "brand": card.brand,
        "name": card.name
    } for card in cards]), 200


# Get all PDFExtractables for a card
@statements_bp.route('/cards/<int:card_id>/pdfs', methods=['GET'])
@jwt_required()
def get_pdfs_for_card(card_id):
    card = Card.query.get(card_id)
    if not card:
        return jsonify({"msg": "Card not found"}), 404
    pdfs = PDFExtractable.query.filter_by(card_id=card_id).all()
    return jsonify([{
        "id": pdf.id,
        "file_name": pdf.file_name,
        "uploaded_at": pdf.uploaded_at,
        "statement_date": pdf.statement_date,
        "statement_period_start": pdf.statement_period_start,
        "statement_period_end": pdf.statement_period_end,
        "previous_invoice": pdf.previous_invoice,
        "payment_received": pdf.payment_received,
        "total_purchases": pdf.total_purchases,
        "other_charges": pdf.other_charges,
        "total_to_pay": pdf.total_to_pay,
        "next_closing_date": pdf.next_closing_date,
        "next_invoice_balance": pdf.next_invoice_balance,
        "total_open_balance": pdf.total_open_balance,
        "summary_json": pdf.summary_json
    } for pdf in pdfs]), 200


# Get all transactions for a PDFExtractable
@statements_bp.route('/pdfs/<int:pdf_id>/transactions', methods=['GET'])
@jwt_required()
def get_transactions_for_pdf(pdf_id):
    pdf = PDFExtractable.query.get(pdf_id)
    if not pdf:
        return jsonify({"msg": "PDFExtractable not found"}), 404
    transactions = Transaction.query.filter_by(pdf_id=pdf_id).all()
    return jsonify([{
        "id": t.id,
        "date": t.date,
        "description": t.description,
        "amount": t.amount
    } for t in transactions]), 200


# Get a single PDFExtractable with its transactions
@statements_bp.route('/pdfs/<int:pdf_id>', methods=['GET'])
@jwt_required()
def get_pdf_with_transactions(pdf_id):
    pdf = PDFExtractable.query.get(pdf_id)
    if not pdf:
        return jsonify({"msg": "PDFExtractable not found"}), 404
    transactions = Transaction.query.filter_by(pdf_id=pdf_id).all()
    return jsonify({
        "id": pdf.id,
        "file_name": pdf.file_name,
        "uploaded_at": pdf.uploaded_at,
        "statement_date": pdf.statement_date,
        "statement_period_start": pdf.statement_period_start,
        "statement_period_end": pdf.statement_period_end,
        "previous_invoice": pdf.previous_invoice,
        "payment_received": pdf.payment_received,
        "total_purchases": pdf.total_purchases,
        "other_charges": pdf.other_charges,
        "total_to_pay": pdf.total_to_pay,
        "next_closing_date": pdf.next_closing_date,
        "next_invoice_balance": pdf.next_invoice_balance,
        "total_open_balance": pdf.total_open_balance,
        "summary_json": pdf.summary_json,
        "transactions": [{
            "id": t.id,
            "date": t.date,
            "description": t.description,
            "amount": t.amount
        } for t in transactions]
    }), 200
