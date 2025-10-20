import pytest
import json

def test_register_user(client, db):
    payload = {
        "username": "testuser",
        "email": "testuser@example.com",
        "password": "TestPass123!"
    }
    resp = client.post("/register", json=payload)
    
    print(f"Status: {resp.status_code}")
    print(f"Response: {resp.get_data(as_text=True)}")
    
    assert resp.status_code in (200, 201), f"Resposta inesperada: {resp.status_code} - {resp.data}"

    with client.application.app_context():
        from flask_app.routes.auth import User  
        user = User.query.filter_by(email=payload["email"]).first()
        assert user is not None, "Usuário não foi encontrado no banco de dados"
        assert user.username == payload["username"]

def test_login_user(client, db):   
    # Primeiro cria um usuário via registro
    register_payload = {
        "username": "loginuser",
        "email": "login@example.com", 
        "password": "TestPass123!"
    }
    client.post("/register", json=register_payload)

    login_payload = {
        "email": "login@example.com",
        "password": "TestPass123!"
    }
    resp = client.post("/login", json=login_payload)
    
    print(f"Login Status: {resp.status_code}")
    print(f"Login Response: {resp.get_data(as_text=True)}")
    
    assert resp.status_code == 200
    data = json.loads(resp.data)
    assert "access_token" in data
    assert "refresh_token" in data

def test_protected_endpoint(client, auth_headers):
    """Test accessing protected endpoint with JWT - COM URL CORRETA"""
    resp = client.get("/protected", headers=auth_headers)
    print(f"Protected Status: {resp.status_code}")
    print(f"Protected Response: {resp.get_data(as_text=True)}")
    
    assert resp.status_code == 200
    data = json.loads(resp.data)
    assert "logged_user_id" in data

def test_duplicate_email_registration(client, db):
    """Test registration with duplicate email"""
    payload = {
        "username": "user1",
        "email": "duplicate@example.com",
        "password": "TestPass123!"
    }
    
    # Primeiro registro
    resp1 = client.post("/register", json=payload)
    assert resp1.status_code in (200, 201)
    
    # Segundo registro com mesmo email
    resp2 = client.post("/register", json=payload)
    assert resp2.status_code == 400
    assert b"Email already exists" in resp2.data