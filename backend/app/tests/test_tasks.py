def make_project(client, token, name="Task Project"):
    return client.post(
        "/api/projects",
        json={"name": name},
        headers={"Authorization": f"Bearer {token}"},
    ).json()


def make_task(client, token, project_id, title="Test Task", assigned_to=None):
    body = {"title": title, "project_id": project_id}
    if assigned_to:
        body["assigned_to"] = assigned_to
    return client.post("/api/tasks", json=body, headers={"Authorization": f"Bearer {token}"})


def test_create_task(client, admin_token):
    project = make_project(client, admin_token)
    resp = make_task(client, admin_token, project["id"])
    assert resp.status_code == 201
    assert resp.json()["title"] == "Test Task"
    assert resp.json()["status"] == "todo"


def test_create_task_invalid_project(client, admin_token):
    resp = make_task(client, admin_token, 99999)
    assert resp.status_code == 404


def test_list_tasks_filter_by_project(client, admin_token):
    p1 = make_project(client, admin_token, "Project A")
    p2 = make_project(client, admin_token, "Project B")
    make_task(client, admin_token, p1["id"], "Task A1")
    make_task(client, admin_token, p1["id"], "Task A2")
    make_task(client, admin_token, p2["id"], "Task B1")
    resp = client.get(
        f"/api/tasks?project_id={p1['id']}",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert resp.status_code == 200
    assert resp.json()["total"] == 2


def test_list_tasks_filter_by_status(client, admin_token):
    project = make_project(client, admin_token)
    make_task(client, admin_token, project["id"], "T1")
    task2 = make_task(client, admin_token, project["id"], "T2").json()
    client.patch(
        f"/api/tasks/{task2['id']}/status",
        json={"status": "done"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    resp = client.get(
        "/api/tasks?status=done",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert resp.status_code == 200
    for item in resp.json()["items"]:
        assert item["status"] == "done"


def test_assign_task(client, admin_token, dev_user):
    project = make_project(client, admin_token)
    task = make_task(client, admin_token, project["id"]).json()
    resp = client.patch(
        f"/api/tasks/{task['id']}/assign",
        json={"assigned_to": dev_user.id},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert resp.status_code == 200
    assert resp.json()["assigned_to"] == dev_user.id


def test_update_task_status_as_admin(client, admin_token):
    project = make_project(client, admin_token)
    task = make_task(client, admin_token, project["id"]).json()
    resp = client.patch(
        f"/api/tasks/{task['id']}/status",
        json={"status": "in_progress"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "in_progress"


def test_update_task_status_as_non_assignee_forbidden(client, admin_token, dev_token):
    project = make_project(client, admin_token)
    task = make_task(client, admin_token, project["id"]).json()
    resp = client.patch(
        f"/api/tasks/{task['id']}/status",
        json={"status": "done"},
        headers={"Authorization": f"Bearer {dev_token}"},
    )
    assert resp.status_code == 403