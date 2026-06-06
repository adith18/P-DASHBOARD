def make_project(client, token, name="Test Project"):
    return client.post(
        "/api/projects",
        json={"name": name, "description": "A test project"},
        headers={"Authorization": f"Bearer {token}"},
    )


def test_create_project(client, admin_token):
    resp = make_project(client, admin_token)
    assert resp.status_code == 201
    assert resp.json()["name"] == "Test Project"


def test_list_projects(client, admin_token):
    make_project(client, admin_token, "P1")
    make_project(client, admin_token, "P2")
    resp = client.get("/api/projects", headers={"Authorization": f"Bearer {admin_token}"})
    assert resp.status_code == 200
    assert resp.json()["total"] >= 2


def test_get_project_by_id(client, admin_token):
    created = make_project(client, admin_token).json()
    resp = client.get(f"/api/projects/{created['id']}", headers={"Authorization": f"Bearer {admin_token}"})
    assert resp.status_code == 200
    assert resp.json()["id"] == created["id"]


def test_update_project(client, admin_token):
    created = make_project(client, admin_token).json()
    resp = client.put(
        f"/api/projects/{created['id']}",
        json={"name": "Updated Project"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert resp.status_code == 200
    assert resp.json()["name"] == "Updated Project"


def test_delete_project(client, admin_token):
    created = make_project(client, admin_token).json()
    resp = client.delete(
        f"/api/projects/{created['id']}",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert resp.status_code == 204


def test_delete_project_not_found(client, admin_token):
    resp = client.delete("/api/projects/99999", headers={"Authorization": f"Bearer {admin_token}"})
    assert resp.status_code == 404


def test_dev_cannot_delete_others_project(client, admin_token, dev_token):
    created = make_project(client, admin_token).json()
    resp = client.delete(
        f"/api/projects/{created['id']}",
        headers={"Authorization": f"Bearer {dev_token}"},
    )
    assert resp.status_code == 403