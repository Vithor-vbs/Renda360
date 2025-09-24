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
    # Optional: frontend can provide session ID
    session_id = data.get('session_id')
    optimization_level = data.get('optimization_level', 'aggressive')

    logger.info(
        f"User question: {question} (User ID: {user_id}, Session: {session_id})")

    try:
        # Create Julius AI instance with conversation memory support
        ai = JuliusAI(
            user_id, optimization_level=optimization_level, session_id=session_id)

        # Use new context-aware ask method
        result = ai.ask_with_context(question)

        logger.info(
            f"AI response: {result['response']} (Query type: {result.get('query_type', 'unknown')})")

        return jsonify({
            "answer": result['response'],
            "session_id": result['session_id'],
            "response_time_ms": result.get('response_time_ms'),
            "query_type": result.get('query_type'),
            "optimization_level": result.get('optimization_level'),
            "error": result.get('error', False)
        }), 200

    except Exception as e:
        logger.exception(f"Error in /ask endpoint: {str(e)}")
        return jsonify({
            "answer": "Desculpe, ocorreu um erro ao processar sua pergunta. Tente novamente.",
            "error": str(e)
        }), 500

# Add endpoint to update embeddings when new data is added


@julius_bp.route('/conversation/history', methods=['GET'])
@jwt_required()
def get_conversation_history():
    """Get conversation history for the current session"""
    user_id = get_jwt_identity()
    session_id = request.args.get('session_id')
    limit = int(request.args.get('limit', 20))

    try:
        ai = JuliusAI(user_id, session_id=session_id)
        history = ai.get_conversation_history(limit=limit)

        return jsonify({
            "history": history,
            "session_id": ai.session_id,
            "count": len(history)
        }), 200

    except Exception as e:
        logger.exception(f"Error in /conversation/history: {str(e)}")
        return jsonify({"error": str(e)}), 500


@julius_bp.route('/conversation/clear', methods=['POST'])
@jwt_required()
def clear_conversation():
    """Clear current conversation and start fresh"""
    user_id = get_jwt_identity()
    data = request.get_json() or {}
    session_id = data.get('session_id')

    try:
        ai = JuliusAI(user_id, session_id=session_id)
        cleared = ai.clear_conversation()

        return jsonify({
            "cleared": cleared,
            "message": "Conversa limpa com sucesso!" if cleared else "Nenhuma conversa ativa encontrada."
        }), 200

    except Exception as e:
        logger.exception(f"Error in /conversation/clear: {str(e)}")
        return jsonify({"error": str(e)}), 500


@julius_bp.route('/conversation/status', methods=['GET'])
@jwt_required()
def conversation_status():
    """Get current conversation session status"""
    user_id = get_jwt_identity()

    try:
        from ..models import ConversationSession

        active_session = ConversationSession.query.filter_by(
            user_id=user_id,
            is_active=True
        ).first()

        if active_session:
            # Count messages in session
            message_count = len(active_session.messages)

            return jsonify({
                "has_active_session": True,
                "session_id": active_session.session_id,
                "message_count": message_count,
                "created_at": active_session.created_at.isoformat(),
                "updated_at": active_session.updated_at.isoformat()
            }), 200
        else:
            return jsonify({
                "has_active_session": False,
                "session_id": None,
                "message_count": 0
            }), 200

    except Exception as e:
        logger.exception(f"Error in /conversation/status: {str(e)}")
        return jsonify({"error": str(e)}), 500


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
