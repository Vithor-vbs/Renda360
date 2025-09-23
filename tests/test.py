import os
import sys
import pytest
from app import create_app
from flask_jwt_extended import create_access_token

sys.path.insert(0, os.path.abspath(
    os.path.join(os.path.dirname(__file__), '..')))


@pytest.fixture
def client():
    app = create_app()
    app.config['TESTING'] = True
    with app.test_client() as client:
        with app.app_context():
            yield client


@pytest.fixture
def auth_headers(client):
    # Create test user directly
    from flask_app.models import User, db
    user = User(username='test', email='test@example.com', password='test')
    db.session.add(user)
    db.session.commit()

    token = create_access_token(identity=user.id)
    return {'Authorization': f'Bearer {token}'}


def test_empty_vector_store(client, auth_headers):
    """Test Julius with no financial data"""
    response = client.post(
        '/api/julius/ask',
        headers=auth_headers,
        json={"question": "What are my spending patterns?"}
    )

    assert response.status_code == 200
    response_data = response.json
    assert "don't have any financial data" in response_data['answer']
    print("Test passed! Response:", response_data['answer'])


if __name__ == '__main__':
    pytest.main([__file__])
