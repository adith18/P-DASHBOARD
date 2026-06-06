def test_create_user_as_admin(client, admin_token):
    resp = client.post(
        "/api/users",
        json={"name": "New Dev", "email": "newdev@test.com", "password": "pass123", "role": "developer"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert resp.status_code == 201
    assert resp.json()["email"] == "newdev@test.com"


def test_create_user_as_dev_forbidden(client, dev_token):
    resp = client.post(
        "/api/users",
        json={"name": "Another", "email": "another@test.com", "password": "pass123", "role": "developer"},
        headers={"Authorization": f"Bearer {dev_token}"},
    )
    assert resp.status_code == 403


def test_create_user_duplicate_email(client, admin_token, admin_user):
    resp = client.post(
        "/api/users",
        json={"name": "Dup", "email": "admin@test.com", "password": "pass123", "role": "developer"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert resp.status_code == 400


def test_list_users(client, admin_token, admin_user, dev_user):
    resp = client.get("/api/users", headers={"Authorization": f"Bearer {admin_token}"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] >= 2
    assert "items" in data


def test_list_users_pagination(client, admin_token, admin_user):
    resp = client.get("/api/users?page=1&page_size=1", headers={"Authorization": f"Bearer {admin_token}"})
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["items"]) == 1
    assert data["page_size"] == 1