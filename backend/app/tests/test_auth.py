def test_login_success(client, admin_user):
    resp = client.post("/api/auth/login", json={"email": "admin@test.com", "password": "adminpass"})
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_login_wrong_password(client, admin_user):
    resp = client.post("/api/auth/login", json={"email": "admin@test.com", "password": "wrong"})
    assert resp.status_code == 401


def test_login_unknown_email(client):
    resp = client.post("/api/auth/login", json={"email": "noone@test.com", "password": "pass"})
    assert resp.status_code == 401


def test_get_me(client, admin_token):
    resp = client.get("/api/users/me", headers={"Authorization": f"Bearer {admin_token}"})
    assert resp.status_code == 200
    assert resp.json()["email"] == "admin@test.com"


def test_protected_route_no_token(client):
    resp = client.get("/api/users/me")
    assert resp.status_code == 401