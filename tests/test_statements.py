import pytest
import io
import json
from unittest.mock import patch, MagicMock

def test_get_cards(client, db, auth_headers):
    """Test getting user cards"""
    with client.application.app_context():
        from flask_app.routes.auth import User, Card
        
        user = User.query.filter_by(email='test@example.com').first()
        
        # Adicionar cartões de teste
        card1 = Card(
            user_id=user.id,
            number="1111 2222 3333 4444",
            expiration_date="12/25",
            card_type="credito",
            available_limit=5000.0,
            used_limit=1500.0,
            brand="Visa",
            name="Cartão Principal"
        )
        card2 = Card(
            user_id=user.id,
            number="5555 6666 7777 8888", 
            expiration_date="06/26",
            card_type="debito",
            available_limit=0.0,
            used_limit=0.0,
            brand="Mastercard",
            name="Cartão Débito"
        )
        db.session.add_all([card1, card2])
        db.session.commit()

    # Test
    response = client.get('/cards', headers=auth_headers)
    
    assert response.status_code == 200
    data = response.json
    assert len(data) == 2
    assert data[0]['number'] == "1111 2222 3333 4444"
    assert data[1]['number'] == "5555 6666 7777 8888"
    # ✅ VERIFICAÇÕES ADICIONAIS
    assert data[0]['card_type'] == "credito"
    assert data[1]['card_type'] == "debito"

def test_get_cards_unauthorized(client):
    """Test getting cards without authentication"""
    response = client.get('/cards')
    assert response.status_code == 401

def test_get_pdfs_for_card(client, db, auth_headers):
    """Test getting PDFs for a specific card"""
    card_id = None
    
    with client.application.app_context():
        from flask_app.routes.auth import User, Card
        from flask_app.routes.statements import PDFExtractable
        
        user = User.query.filter_by(email='test@example.com').first()
        
        # Criar card e PDFs
        card = Card(
            user_id=user.id,
            number="1111 2222 3333 4444",
            expiration_date="12/25",
            card_type="credito"
        )
        db.session.add(card)
        db.session.flush()
        card_id = card.id
        
        pdf1 = PDFExtractable(
            card_id=card.id,
            file_name="extrato_jan.pdf",
            statement_date="2024-01-31",
            statement_period_start="2024-01-01",
            statement_period_end="2024-01-31",
            total_to_pay=1500.0
        )
        pdf2 = PDFExtractable(
            card_id=card.id,
            file_name="extrato_fev.pdf", 
            statement_date="2024-02-29",
            statement_period_start="2024-02-01",
            statement_period_end="2024-02-29",
            total_to_pay=1800.0
        )
        db.session.add_all([pdf1, pdf2])
        db.session.commit()

    # Test
    response = client.get(f'/cards/{card_id}/pdfs', headers=auth_headers)
    
    assert response.status_code == 200
    data = response.json
    assert len(data) == 2
    assert data[0]['file_name'] == "extrato_jan.pdf"
    assert data[1]['file_name'] == "extrato_fev.pdf"
    # ✅ VERIFICAÇÕES ADICIONAIS
    assert data[0]['total_to_pay'] == 1500.0
    assert data[1]['total_to_pay'] == 1800.0

def test_get_pdfs_for_nonexistent_card(client, auth_headers):
    """Test getting PDFs for a card that doesn't exist"""
    response = client.get('/cards/999/pdfs', headers=auth_headers)
    assert response.status_code == 404

def test_get_transactions_for_pdf(client, db, auth_headers):
    """Test getting transactions for a PDF"""
    pdf_id = None
    
    with client.application.app_context():
        from flask_app.routes.auth import User, Card
        from flask_app.routes.statements import PDFExtractable, Transaction
        
        user = User.query.filter_by(email='test@example.com').first()
        
        # Criar card, PDF e transações
        card = Card(
            user_id=user.id,
            number="1111 2222 3333 4444",
            expiration_date="12/25",
            card_type="credito"
        )
        db.session.add(card)
        db.session.flush()
        
        pdf = PDFExtractable(
            card_id=card.id,
            file_name="extrato_mar.pdf"
        )
        db.session.add(pdf)
        db.session.flush()
        pdf_id = pdf.id
        
        transaction1 = Transaction(
            pdf_id=pdf.id,
            date="2024-03-15",
            description="Supermercado",
            amount=-150.50
        )
        transaction2 = Transaction(
            pdf_id=pdf.id,
            date="2024-03-20", 
            description="Posto de Gasolina",
            amount=-80.00
        )
        db.session.add_all([transaction1, transaction2])
        db.session.commit()

    # Test
    response = client.get(f'/pdfs/{pdf_id}/transactions', headers=auth_headers)
    
    assert response.status_code == 200
    data = response.json
    assert len(data) == 2
    assert data[0]['description'] == "Supermercado"
    assert data[1]['description'] == "Posto de Gasolina"
    # ✅ VERIFICAÇÕES ADICIONAIS
    assert data[0]['amount'] == -150.50
    assert data[1]['amount'] == -80.00

def test_get_pdf_with_transactions(client, db, auth_headers):
    """Test getting PDF details with transactions"""
    pdf_id = None
    
    with client.application.app_context():
        from flask_app.routes.auth import User, Card
        from flask_app.routes.statements import PDFExtractable, Transaction
        
        user = User.query.filter_by(email='test@example.com').first()
        
        card = Card(
            user_id=user.id,
            number="1111 2222 3333 4444",
            expiration_date="12/25",
            card_type="credito"
        )
        db.session.add(card)
        db.session.flush()
        
        pdf = PDFExtractable(
            card_id=card.id,
            file_name="extrato_abr.pdf",
            statement_date="2024-04-30",
            total_to_pay=1200.0
        )
        db.session.add(pdf)
        db.session.flush()
        pdf_id = pdf.id
        
        transaction = Transaction(
            pdf_id=pdf.id,
            date="2024-04-10",
            description="Restaurante",
            amount=-75.00
        )
        db.session.add(transaction)
        db.session.commit()

    # Test
    response = client.get(f'/pdfs/{pdf_id}', headers=auth_headers)
    
    assert response.status_code == 200
    data = response.json
    assert data['file_name'] == "extrato_abr.pdf"
    assert data['total_to_pay'] == 1200.0
    assert len(data['transactions']) == 1
    assert data['transactions'][0]['description'] == "Restaurante"
    # ✅ VERIFICAÇÕES ADICIONAIS
    assert data['statement_date'] == "2024-04-30"

def test_get_all_transactions(client, db, auth_headers):
    """Test getting all transactions with filters"""
    with client.application.app_context():
        from flask_app.routes.auth import User, Card
        from flask_app.routes.statements import PDFExtractable, Transaction
        
        user = User.query.filter_by(email='test@example.com').first()
        
        card = Card(
            user_id=user.id,
            number="1111 2222 3333 4444",
            expiration_date="12/25",
            card_type="credito"
        )
        db.session.add(card)
        db.session.flush()
        
        pdf = PDFExtractable(card_id=card.id, file_name="test.pdf")
        db.session.add(pdf)
        db.session.flush()
        
        # Criar transações com diferentes categorias
        transactions = [
            Transaction(pdf_id=pdf.id, date="2024-01-15", description="Mercado", amount=-100.0, category="Alimentação"),
            Transaction(pdf_id=pdf.id, date="2024-01-20", description="Posto", amount=-80.0, category="Transporte"),
            Transaction(pdf_id=pdf.id, date="2024-02-05", description="Shopping", amount=-200.0, category="Vestuário"),
        ]
        db.session.add_all(transactions)
        db.session.commit()

    # Test sem filtros
    response = client.get('/transactions', headers=auth_headers)
    assert response.status_code == 200
    data = response.json
    assert len(data) == 3

    # Test com filtro de data
    response = client.get('/transactions?start_date=2024-02-01', headers=auth_headers)
    assert response.status_code == 200
    data = response.json
    assert len(data) == 1
    assert data[0]['description'] == "Shopping"

    # Test com filtro de categoria
    response = client.get('/transactions?category=Alimentação', headers=auth_headers)
    assert response.status_code == 200
    data = response.json
    assert len(data) == 1
    assert data[0]['category'] == "Alimentação"

def test_get_transaction_summary(client, db, auth_headers):
    """Test getting transaction summary"""
    with client.application.app_context():
        from flask_app.routes.auth import User, Card
        from flask_app.routes.statements import PDFExtractable, Transaction
        
        user = User.query.filter_by(email='test@example.com').first()
        
        card = Card(
            user_id=user.id, 
            number="1111 2222 3333 4444", 
            expiration_date="12/25",
            card_type="credito"
        )
        db.session.add(card)
        db.session.flush()
        
        pdf = PDFExtractable(card_id=card.id, file_name="test.pdf")
        db.session.add(pdf)
        db.session.flush()
        
        # Criar transações de diferentes tipos
        transactions = [
            Transaction(pdf_id=pdf.id, date="2024-01-15", description="Compra cartão", amount=-100.0),
            Transaction(pdf_id=pdf.id, date="2024-01-20", description="Pix recebido", amount=500.0),
            Transaction(pdf_id=pdf.id, date="2024-02-05", description="Boleto pago", amount=-150.0),
        ]
        db.session.add_all(transactions)
        db.session.commit()

    response = client.get('/transactions/summary', headers=auth_headers)
    
    assert response.status_code == 200
    data = response.json
    
    # ✅ VERIFICAÇÕES MELHORADAS
    types_data = {item['type']: item for item in data}
    
    assert 'Cartão de Crédito' in types_data
    assert types_data['Cartão de Crédito']['total'] == 100.0
    assert types_data['Cartão de Crédito']['count'] == 1
    
    assert 'Pix' in types_data
    assert types_data['Pix']['total'] == 500.0
    
    assert 'Boleto' in types_data
    assert types_data['Boleto']['total'] == 150.0

def test_get_spending_by_category(client, db, auth_headers):
    """Test getting spending by category"""
    with client.application.app_context():
        from flask_app.routes.auth import User, Card
        from flask_app.routes.statements import PDFExtractable, Transaction
        
        user = User.query.filter_by(email='test@example.com').first()
        
        card = Card(
            user_id=user.id, 
            number="1111 2222 3333 4444", 
            expiration_date="12/25",
            card_type="credito"
        )
        db.session.add(card)
        db.session.flush()
        
        pdf = PDFExtractable(card_id=card.id, file_name="test.pdf")
        db.session.add(pdf)
        db.session.flush()
        
        # Criar transações com categorias
        transactions = [
            Transaction(pdf_id=pdf.id, date="2024-01-15", description="Supermercado", amount=-200.0, category="Alimentação"),
            Transaction(pdf_id=pdf.id, date="2024-01-20", description="Posto", amount=-150.0, category="Transporte"),
            Transaction(pdf_id=pdf.id, date="2024-01-25", description="Mercado", amount=-100.0, category="Alimentação"),
        ]
        db.session.add_all(transactions)
        db.session.commit()

    response = client.get('/transactions/categories', headers=auth_headers)
    
    assert response.status_code == 200
    data = response.json
    
    # ✅ VERIFICAÇÕES MELHORADAS
    categories_data = {item['category']: item for item in data}
    
    alimentacao = categories_data['Alimentação']
    transporte = categories_data['Transporte']
    
    assert alimentacao['amount'] == 300.0
    assert alimentacao['transaction_count'] == 2
    assert alimentacao['percentage'] == 66.67  # 300/450 * 100
    
    assert transporte['amount'] == 150.0
    assert transporte['transaction_count'] == 1
    assert transporte['percentage'] == 33.33  # 150/450 * 100

@patch('flask_app.routes.statements.NubankExtractor')
def test_upload_pdf_success(mock_extractor, client, db, auth_headers):
    """Test successful PDF upload"""
    with client.application.app_context():
        from flask_app.routes.auth import User, Card
        
        user = User.query.filter_by(email='test@example.com').first()
        
        # Criar card para teste
        card = Card(
            user_id=user.id,
            number="0000 0000 0000 1515",
            expiration_date="12/30",
            card_type="credito"
        )
        db.session.add(card)
        db.session.commit()

    # Mock do extrator
    mock_instance = MagicMock()
    mock_extractor.return_value.__enter__.return_value = mock_instance
    
    # ✅ DADOS FICTÍCIOS MAIS REALISTAS
    mock_instance.extract_nubank_summary.return_value = {
        'statement_date': '2024-01-31'
    }
    mock_instance.get_spending_by_category.return_value = {
        'Alimentação': 300.0, 
        'Transporte': 150.0,
        'Lazer': 50.0
    }
    mock_instance.extract_statement_period.return_value = {
        'start_date': '2024-01-01', 
        'end_date': '2024-01-31'
    }
    mock_instance.extract_invoice_summary.return_value = {
        'previous_invoice': 100.0, 
        'payment_received': 100.0,
        'total_purchases': 450.0, 
        'other_charges': 10.0, 
        'total_to_pay': 450.0
    }
    mock_instance.extract_available_limits.return_value = {
        'used_limit': 450.0, 
        'available_limit': 4550.0
    }
    mock_instance.extract_next_invoices.return_value = {
        'next_closing_date': '2024-02-05', 
        'next_invoice_balance': 0.0, 
        'total_open_balance': 450.0
    }
    
    # Mock das transações normalizadas
    class MockTransaction:
        def __init__(self, date, description, amount, category, merchant, is_installment, installment_info, description_original):
            self.date_formatted = date
            self.description = description
            self.amount = amount
            self.category = category
            self.merchant = merchant
            self.is_installment = is_installment
            self.installment_info = installment_info
            self.description_original = description_original
    
    mock_instance.extract_normalized_transactions.return_value = [
        MockTransaction('2024-01-15', 'Supermercado XPTO', -150.0, 
                       MagicMock(value='Alimentação'), 'Supermercado XPTO', False, None, 'SUPERMERCADO XPTO'),
        MockTransaction('2024-01-20', 'Posto Shell', -80.0,
                       MagicMock(value='Transporte'), 'Posto Shell', False, None, 'POSTO SHELL'),
    ]

    # Mock do update_embeddings
    with patch('flask_app.routes.statements.update_embeddings_for_user') as mock_embed:
        # ✅ PDF MAIS REALISTA
        pdf_content = b'%PDF-1.4 fake pdf content for testing'
        
        data = {
            'card_number': '0000 0000 0000 1515',
            'file': (io.BytesIO(pdf_content), 'extrato_jan_2024.pdf', 'application/pdf')
        }
        
        response = client.post(
            '/upload_pdf', 
            data=data,
            content_type='multipart/form-data',
            headers=auth_headers
        )
        
        assert response.status_code == 201
        assert "2 transactions" in response.json['msg']
        
        # ✅ VERIFICAÇÃO ADICIONAL: Verificar se os dados foram salvos no banco
        with client.application.app_context():
            from flask_app.routes.statements import PDFExtractable, Transaction
            pdf_record = PDFExtractable.query.filter_by(file_name='extrato_jan_2024.pdf').first()
            assert pdf_record is not None
            assert pdf_record.total_to_pay == 450.0
            
            transactions = Transaction.query.filter_by(pdf_id=pdf_record.id).all()
            assert len(transactions) == 2
        
        # Verificar se o update_embeddings foi chamado
        mock_embed.assert_called_once()

def test_upload_pdf_missing_file(client, auth_headers):
    """Test PDF upload without file"""
    response = client.post('/upload_pdf', headers=auth_headers)
    assert response.status_code == 400
    assert "File and card_number are required" in response.json['msg']

def test_upload_pdf_invalid_card(client, auth_headers):
    """Test PDF upload with invalid card number"""
    pdf_content = b'%PDF-1.4 fake pdf content'
    
    data = {
        'card_number': '9999 9999 9999 9999',
        'file': (io.BytesIO(pdf_content), 'extrato.pdf', 'application/pdf')
    }
    
    response = client.post(
        '/upload_pdf', 
        data=data,
        content_type='multipart/form-data',
        headers=auth_headers
    )
    
    assert response.status_code == 404
    assert "Card not found" in response.json['msg']

def test_delete_pdf(client, db, auth_headers):
    """Test PDF deletion"""
    pdf_id = None
    
    with client.application.app_context():
        from flask_app.routes.auth import User, Card
        from flask_app.routes.statements import PDFExtractable, Transaction
        
        user = User.query.filter_by(email='test@example.com').first()
        
        card = Card(
            user_id=user.id, 
            number="1111 2222 3333 4444", 
            expiration_date="12/25",
            card_type="credito"
        )
        db.session.add(card)
        db.session.flush()
        
        pdf = PDFExtractable(card_id=card.id, file_name="test_delete.pdf")
        db.session.add(pdf)
        db.session.flush()
        pdf_id = pdf.id
        
        # Adicionar algumas transações
        transaction = Transaction(pdf_id=pdf.id, date="2024-01-15", description="Test", amount=-50.0)
        db.session.add(transaction)
        db.session.commit()

    # Deletar PDF
    response = client.delete(f'/pdf/{pdf_id}', headers=auth_headers)
    
    assert response.status_code == 200
    assert "deleted successfully" in response.json['msg']
    
    # ✅ VERIFICAÇÃO ADICIONAL: Confirmar que foi realmente deletado
    response = client.get(f'/pdfs/{pdf_id}', headers=auth_headers)
    assert response.status_code == 404

def test_delete_nonexistent_pdf(client, auth_headers):
    """Test deleting PDF that doesn't exist"""
    response = client.delete('/pdf/999', headers=auth_headers)
    assert response.status_code == 404