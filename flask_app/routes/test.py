from flask import Blueprint, jsonify

test_bp = Blueprint('test', __name__)


@test_bp.route('/test', methods=['GET'])
def test_endpoint():
    """Simple test endpoint without authentication"""
    return jsonify({'message': 'Server is working!'}), 200


@test_bp.route('/dashboard/test', methods=['GET'])
def dashboard_test():
    """Test dashboard endpoint without authentication"""
    return jsonify({
        'cards_summary': {
            'total_cards': 2,
            'total_available_limit': 5000.0,
            'total_used_limit': 1200.0
        },
        'monthly_spending': [
            {'month': '2024-01-01', 'amount': 800.0},
            {'month': '2024-02-01', 'amount': 950.0}
        ],
        'spending_by_category': [
            {'category': 'Alimentação', 'amount': 400.0},
            {'category': 'Transporte', 'amount': 300.0}
        ]
    }), 200
