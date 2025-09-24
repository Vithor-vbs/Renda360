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

            # DUPLICATE DETECTION - Check for existing PDFs with same characteristics
            import hashlib

            # Calculate file hash
            with open(temp_path, 'rb') as f:
                file_content = f.read()
                file_hash = hashlib.md5(file_content).hexdigest()

            # Check for duplicates by multiple criteria
            existing_pdf = None

            # 1. Check by file hash (most reliable)
            existing_pdf = PDFExtractable.query.filter_by(
                card_id=card.id,
                file_hash=file_hash
            ).first()

            if existing_pdf:
                return jsonify({
                    "msg": "Duplicate file detected (same file content already uploaded)",
                    "duplicate_type": "file_hash",
                    "existing_pdf_id": existing_pdf.id,
                    "existing_filename": existing_pdf.file_name
                }), 409

            # 2. Check by filename (less reliable but quick check)
            existing_pdf = PDFExtractable.query.filter_by(
                card_id=card.id,
                file_name=file.filename
            ).first()

            if existing_pdf:
                return jsonify({
                    "msg": f"File with same name '{file.filename}' already exists for this card",
                    "duplicate_type": "filename",
                    "existing_pdf_id": existing_pdf.id,
                    "suggestion": "Consider renaming the file if it's different content"
                }), 409

            # 3. Check by statement period (overlapping periods)
            if period and period.get('start_date') and period.get('end_date'):
                existing_pdf = PDFExtractable.query.filter_by(
                    card_id=card.id,
                    statement_period_start=period.get('start_date'),
                    statement_period_end=period.get('end_date')
                ).first()

                if existing_pdf:
                    return jsonify({
                        "msg": f"Statement for the same period already exists ({period.get('start_date')} to {period.get('end_date')})",
                        "duplicate_type": "statement_period",
                        "existing_pdf_id": existing_pdf.id,
                        "existing_filename": existing_pdf.file_name,
                        "suggestion": "This might be a duplicate statement for the same billing period"
                    }), 409

            # Update card limits
            if limits:
                card.used_limit = limits.get('used_limit')
                card.available_limit = limits.get('available_limit')
                db.session.add(card)

            # Create PDFExtractable
            pdf = PDFExtractable(
                card_id=card.id,
                file_name=file.filename,
                file_hash=file_hash,  # Store the hash for future duplicate detection
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


@statements_bp.route('/transactions', methods=['GET'])
@jwt_required()
def get_all_transactions():
    """Get all transactions for the authenticated user with optional filters"""
    current_user_id = get_jwt_identity()

    # Get query parameters
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    category = request.args.get('category')
    merchant = request.args.get('merchant')
    min_amount = request.args.get('min_amount', type=float)
    max_amount = request.args.get('max_amount', type=float)
    limit = request.args.get('limit', 50, type=int)
    offset = request.args.get('offset', 0, type=int)

    try:
        # Base query - get transactions for user's cards
        query = db.session.query(Transaction).join(PDFExtractable).join(Card).filter(
            Card.user_id == current_user_id
        )

        # Apply filters
        if start_date:
            query = query.filter(Transaction.date >= start_date)
        if end_date:
            query = query.filter(Transaction.date <= end_date)
        if category:
            query = query.filter(Transaction.category == category)
        if merchant:
            query = query.filter(Transaction.merchant.ilike(f'%{merchant}%'))
        if min_amount is not None:
            query = query.filter(Transaction.amount >= min_amount)
        if max_amount is not None:
            query = query.filter(Transaction.amount <= max_amount)

        # Order by date (newest first) and apply pagination
        transactions = query.order_by(
            Transaction.date.desc()).offset(offset).limit(limit).all()

        return jsonify([{
            "id": t.id,
            "date": t.date,
            "description": t.description,
            "description_original": t.description_original,
            "amount": t.amount,
            "pdf_id": t.pdf_id,
            "category": t.category,
            "merchant": t.merchant,
            "is_installment": t.is_installment,
            "installment_info": t.installment_info,
            "created_at": t.created_at.isoformat(),
            "updated_at": t.updated_at.isoformat()
        } for t in transactions]), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@statements_bp.route('/transactions/summary', methods=['GET'])
@jwt_required()
def get_transaction_summary():
    """Get transaction summary by type/category"""
    current_user_id = get_jwt_identity()
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')

    try:
        # Base query
        query = db.session.query(Transaction).join(PDFExtractable).join(Card).filter(
            Card.user_id == current_user_id
        )

        if start_date:
            query = query.filter(Transaction.date >= start_date)
        if end_date:
            query = query.filter(Transaction.date <= end_date)

        transactions = query.all()

        # Group by transaction type (simplified)
        summary = {}
        for t in transactions:
            # Determine type based on description/amount
            if 'pix' in t.description.lower():
                trans_type = 'Pix'
            elif 'ted' in t.description.lower():
                trans_type = 'TED'
            elif 'boleto' in t.description.lower():
                trans_type = 'Boleto'
            elif t.amount < 0:
                trans_type = 'Cartão de Crédito'
            else:
                trans_type = 'Cartão de Débito'

            if trans_type not in summary:
                summary[trans_type] = {'total': 0, 'count': 0}

            summary[trans_type]['total'] += abs(t.amount)
            summary[trans_type]['count'] += 1

        result = []
        for type_name, data in summary.items():
            result.append({
                'type': type_name,
                'total': data['total'],
                'count': data['count'],
                'change_percentage': 0.0
            })

        return jsonify(result), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@statements_bp.route('/transactions/categories', methods=['GET'])
@jwt_required()
def get_spending_by_category():
    """Get spending breakdown by category"""
    current_user_id = get_jwt_identity()
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')

    try:
        query = db.session.query(Transaction).join(PDFExtractable).join(Card).filter(
            Card.user_id == current_user_id
        )

        if start_date:
            query = query.filter(Transaction.date >= start_date)
        if end_date:
            query = query.filter(Transaction.date <= end_date)

        transactions = query.all()

        # Group by category
        categories = {}
        total_amount = 0

        for t in transactions:
            category = t.category or 'Não categorizado'
            amount = abs(t.amount)

            if category not in categories:
                categories[category] = {'amount': 0, 'count': 0}

            categories[category]['amount'] += amount
            categories[category]['count'] += 1
            total_amount += amount

        result = []
        for category, data in categories.items():
            percentage = (data['amount'] / total_amount *
                          100) if total_amount > 0 else 0
            result.append({
                'category': category,
                'amount': data['amount'],
                'percentage': round(percentage, 2),
                'transaction_count': data['count']
            })

        # Sort by amount (highest first)
        result.sort(key=lambda x: x['amount'], reverse=True)

        return jsonify(result), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
