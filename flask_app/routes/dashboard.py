from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models import db, Card, PDFExtractable, Transaction
from sqlalchemy import func, and_, extract
from datetime import datetime, timedelta
import calendar
import traceback

dashboard_bp = Blueprint('dashboard', __name__)


@dashboard_bp.route('/transactions/debug', methods=['GET'])
def get_transactions_debug():
    """Debug transactions endpoint to see what data exists"""
    try:
        from ..models import Transaction

        # Get a sample of transactions
        transactions = db.session.query(Transaction).limit(10).all()

        result = []
        for t in transactions:
            result.append({
                'id': t.id,
                'date': str(t.date) if t.date else None,
                'amount': float(t.amount) if t.amount else 0,
                'description': t.description,
                'category': t.category,
                'pdf_id': t.pdf_id
            })

        return jsonify({
            'count': len(result),
            'transactions': result
        }), 200

    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"Transactions debug error: {str(e)}")
        print(f"Full traceback: {error_details}")
        return jsonify({'error': f'Failed to get transactions: {str(e)}'}), 500


@dashboard_bp.route('/dashboard/debug')
def get_dashboard_debug():
    """Debug endpoint - simplified version"""
    try:
        user_id = 1  # Use the actual existing user
        start_date = datetime.strptime('2025-08-01', '%Y-%m-%d')
        end_date = datetime.strptime('2025-12-31', '%Y-%m-%d')

        # Get dashboard data
        monthly_spending = get_monthly_spending(user_id, start_date, end_date)
        spending_by_category = get_spending_by_category(
            user_id, start_date, end_date)
        cards_summary = get_cards_summary(user_id)

        return jsonify({
            'monthly_spending': monthly_spending,
            'spending_by_category': spending_by_category,
            'cards_summary': cards_summary,
            'period': {
                'start_date': start_date,
                'end_date': end_date
            }
        })

    except Exception as e:
        print(f"Dashboard debug error: {e}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@dashboard_bp.route('/dashboard', methods=['GET'])
@jwt_required()
def get_dashboard_data():
    """Get complete dashboard data including overview, monthly spending, and spending by category"""
    try:
        user_id = get_jwt_identity()
        print(f"Dashboard request for user_id: {user_id}")

        # Get date range from query params
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')

        if start_date:
            start_date = datetime.strptime(start_date, '%Y-%m-%d')
        else:
            # Default to last 6 months
            start_date = datetime.now() - timedelta(days=180)

        if end_date:
            end_date = datetime.strptime(end_date, '%Y-%m-%d')
        else:
            end_date = datetime.now()

        print(f"Date range: {start_date} to {end_date}")

        # Get cards summary
        try:
            cards_summary = get_cards_summary(user_id)
            print(f"Cards summary: {cards_summary}")
        except Exception as e:
            print(f"Error getting cards summary: {str(e)}")
            raise

        # Get monthly spending
        try:
            monthly_spending = get_monthly_spending(
                user_id, start_date, end_date)
            print(f"Monthly spending: {monthly_spending}")
        except Exception as e:
            print(f"Error getting monthly spending: {str(e)}")
            raise

        # Get spending by category
        try:
            spending_by_category = get_spending_by_category(
                user_id, start_date, end_date)
            print(f"Spending by category: {spending_by_category}")
        except Exception as e:
            print(f"Error getting spending by category: {str(e)}")
            raise

        result = {
            'cards_summary': cards_summary,
            'monthly_spending': monthly_spending,
            'spending_by_category': spending_by_category,
            'period': {
                'start_date': start_date.isoformat(),
                'end_date': end_date.isoformat()
            }
        }

        print(f"Returning result: {result}")
        return jsonify(result), 200

    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"Dashboard error: {str(e)}")
        print(f"Full traceback: {error_details}")
        return jsonify({'error': f'Failed to get dashboard data: {str(e)}'}), 500


@dashboard_bp.route('/dashboard/overview', methods=['GET'])
@jwt_required()
def get_financial_overview():
    """Get financial overview with total balance, spending, and cards summary"""
    try:
        user_id = get_jwt_identity()

        # Get date range from query params
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')

        if start_date:
            start_date = datetime.strptime(start_date, '%Y-%m-%d')
        else:
            # Default to current month
            now = datetime.now()
            start_date = datetime(now.year, now.month, 1)

        if end_date:
            end_date = datetime.strptime(end_date, '%Y-%m-%d')
        else:
            end_date = datetime.now()

        # Get cards summary
        cards_summary = get_cards_summary(user_id)

        # Calculate spending this period
        total_spent_query = db.session.query(
            func.sum(func.abs(Transaction.amount))
        ).join(PDFExtractable).join(Card).filter(
            and_(
                Card.user_id == user_id,
                Transaction.date >= start_date,
                Transaction.date <= end_date,
                Transaction.amount < 0  # Only expenses
            )
        ).scalar()

        total_spent_this_month = float(
            total_spent_query) if total_spent_query else 0.0

        # Calculate income this period (positive transactions)
        total_income_query = db.session.query(
            func.sum(Transaction.amount)
        ).join(PDFExtractable).join(Card).filter(
            and_(
                Card.user_id == user_id,
                Transaction.date >= start_date,
                Transaction.date <= end_date,
                Transaction.amount > 0  # Only income
            )
        ).scalar()

        total_income_this_month = float(
            total_income_query) if total_income_query else 0.0

        # Total balance is available limit minus used limit
        total_balance = cards_summary['total_available_limit'] - \
            cards_summary['total_used_limit']

        return jsonify({
            'total_balance': total_balance,
            'total_spent_this_month': total_spent_this_month,
            'total_income_this_month': total_income_this_month,
            'cards_summary': cards_summary
        }), 200

    except Exception as e:
        return jsonify({'error': f'Failed to get financial overview: {str(e)}'}), 500


def get_cards_summary(user_id):
    """Get summary of user's credit cards"""
    cards = Card.query.filter_by(user_id=user_id).all()

    total_cards = len(cards)
    total_available_limit = sum(card.available_limit or 0 for card in cards)
    total_used_limit = sum(card.used_limit or 0 for card in cards)

    return {
        'total_cards': total_cards,
        'total_available_limit': float(total_available_limit),
        'total_used_limit': float(total_used_limit)
    }


def get_monthly_spending(user_id, start_date, end_date):
    """Get monthly income vs expenses breakdown"""
    from sqlalchemy import text

    # Since date is stored as string and amounts are positive (expenses from credit card statements)
    # We'll treat all transactions as expenses and generate mock income

    # Convert start and end dates to string format for comparison
    start_str = start_date.strftime('%Y-%m-%d')
    end_str = end_date.strftime('%Y-%m-%d')

    # Get expenses using string date comparison and split_part for date extraction
    expense_data = db.session.query(
        func.split_part(Transaction.date, '-',
                        1).label('year'),   # Extract year
        func.split_part(Transaction.date, '-',
                        2).label('month'),  # Extract month
        func.sum(Transaction.amount).label('expenses')
    ).join(PDFExtractable).join(Card).filter(
        and_(
            Card.user_id == user_id,
            Transaction.date >= start_str,
            Transaction.date <= end_str
        )
    ).group_by(
        func.split_part(Transaction.date, '-', 1),
        func.split_part(Transaction.date, '-', 2)
    ).all()

    # Combine the data
    monthly_dict = {}

    # Add expenses and generate mock income
    for year, month, expenses in expense_data:
        try:
            # Convert to int for formatting
            year_int = int(year) if year else 2025
            month_int = int(month) if month else 1
            key = f"{year_int}-{month_int:02d}"
            expense_amount = float(expenses) if expenses else 0.0
            # Generate mock income that's 20-50% higher than expenses for demo purposes
            mock_income = expense_amount * \
                (1.2 + (hash(key) % 30) / 100)  # 20-50% more than expenses

            monthly_dict[key] = {
                'year': year_int,
                'month': month_int,
                'expenses': expense_amount,
                'income': mock_income
            }
        except Exception as e:
            print(
                f"Error processing monthly data: year={year}, month={month}, expenses={expenses}, error={e}")
            continue

    # Convert to result format
    result = []
    for key in sorted(monthly_dict.keys()):
        data = monthly_dict[key]
        year = int(data['year'])
        month = int(data['month'])
        month_name = calendar.month_name[month]
        result.append({
            'month': f"{year}-{month:02d}-01",
            'expenses': data['expenses'],
            'income': data['income'],
            'label': f"{month_name[:3]} {year}"
        })

    return result


def get_spending_by_category(user_id, start_date, end_date):
    """Get spending breakdown by category"""
    # Convert start and end dates to string format for comparison
    start_str = start_date.strftime('%Y-%m-%d')
    end_str = end_date.strftime('%Y-%m-%d')

    category_data = db.session.query(
        Transaction.category,
        # Amounts are already positive in credit card statements
        func.sum(Transaction.amount).label('amount')
    ).join(PDFExtractable).join(Card).filter(
        and_(
            Card.user_id == user_id,
            Transaction.date >= start_str,
            Transaction.date <= end_str,
            Transaction.category.isnot(None)  # Only categorized transactions
        )
    ).group_by(Transaction.category).order_by(
        func.sum(Transaction.amount).desc()
    ).all()

    result = []
    for category, amount in category_data:
        if category and amount:  # Skip null categories and zero amounts
            result.append({
                'category': category,
                'amount': float(amount)
            })

    return result
