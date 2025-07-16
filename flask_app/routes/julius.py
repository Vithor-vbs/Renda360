import logging
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..julius_ai import JuliusAI

logger = logging.getLogger(__name__)
julius_bp = Blueprint('julius', __name__)


@julius_bp.route('/ask', methods=['POST'])
@jwt_required()
def ask_julius():
    user_id = get_jwt_identity()
    data = request.get_json()
    question = data.get('question')

    logger.info(f"User question: {question} (User ID: {user_id})")

    try:
        ai = JuliusAI(user_id)
        response = ai.ask(question)
        logger.info(f"AI response: {response}")
        return jsonify({"answer": response}), 200
    except Exception as e:
        logger.exception(f"Error in /ask endpoint: {str(e)}")
        return jsonify({
            "answer": "Sorry, I encountered an error processing your request",
            "error": str(e)
        }), 500

# Add endpoint to update embeddings when new data is added


@julius_bp.route('/update_embeddings', methods=['POST'])
@jwt_required()
def update_embeddings():
    user_id = get_jwt_identity()
    data = request.get_json()
    pdf_id = data.get('pdf_id')

    try:
        from ..vector_store import FinancialVectorStore
        vector_store = FinancialVectorStore(user_id)
        count = vector_store.update_user_data(pdf_id)
        return jsonify({"message": f"Updated {count} documents"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
