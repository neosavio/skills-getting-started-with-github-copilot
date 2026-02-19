from fastapi.testclient import TestClient
from urllib.parse import quote
from src.app import app

client = TestClient(app)


def test_get_activities():
    res = client.get("/activities")
    assert res.status_code == 200
    data = res.json()
    # basic sanity check
    assert "Chess Club" in data


def test_signup_and_unregister_cycle():
    activity = "Basketball Team"
    email = "test_integration@example.com"

    # Sign up
    signup_path = f"/activities/{quote(activity)}/signup"
    res = client.post(signup_path, params={"email": email})
    assert res.status_code == 200
    assert res.json().get("message") == f"Signed up {email} for {activity}"

    # Verify participant appears in activities
    res2 = client.get("/activities")
    assert res2.status_code == 200
    participants = res2.json()[activity]["participants"]
    assert email in participants

    # Unregister
    delete_path = f"/activities/{quote(activity)}/participants"
    res3 = client.delete(delete_path, params={"email": email})
    assert res3.status_code == 200
    assert res3.json().get("message") == f"Unregistered {email} from {activity}"

    # Verify participant removed
    res4 = client.get("/activities")
    participants_after = res4.json()[activity]["participants"]
    assert email not in participants_after
