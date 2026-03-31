from __future__ import annotations

import os
import tempfile
import unittest


TEST_DB_DIR = tempfile.mkdtemp(prefix="fitops-test-db-")
os.environ["FITOPS_DATABASE_URL"] = f"sqlite:///{TEST_DB_DIR}/test.db"
os.environ["FITOPS_RESET_DB"] = "1"

from backend.app import create_app
from backend.db.database import engine
from backend.scripts.seed import seed


class FitOpsApiTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.app = create_app()
        cls.app.testing = True
        cls.client = cls.app.test_client()

    @classmethod
    def tearDownClass(cls):
        engine.dispose()

    def setUp(self):
        seed()

    def auth_headers(self, *, email: str, password: str, role: str) -> dict:
        response = self.client.post(
            "/api/login",
            json={"email": email, "password": password, "role": role},
        )
        self.assertEqual(response.status_code, 200)
        token = response.get_json()["token"]
        return {"Authorization": f"Bearer {token}"}

    def member_headers(self) -> dict:
        return self.auth_headers(email="member@test.com", password="member123", role="member")

    def staff_headers(self) -> dict:
        return self.auth_headers(email="staff@test.com", password="staff123", role="staff")

    def test_login_success(self):
        response = self.client.post(
            "/api/login",
            json={"email": "member@test.com", "password": "member123", "role": "member"},
        )
        self.assertEqual(response.status_code, 200)
        body = response.get_json()
        self.assertTrue(body["success"])
        self.assertEqual(body["role"], "member")
        self.assertEqual(body["profile"]["membership_type"], "premium")

    def test_staff_dashboard_seed_counts(self):
        response = self.client.get("/api/dashboard/staff", headers=self.staff_headers())
        self.assertEqual(response.status_code, 200)
        body = response.get_json()
        self.assertEqual(body["stats"]["total_members"], 6)
        self.assertEqual(body["stats"]["total_sessions"], 6)
        self.assertGreaterEqual(body["stats"]["open_tickets"], 2)

    def test_member_can_book_session(self):
        response = self.client.post("/api/sessions/2/book", json={"member_id": 1}, headers=self.member_headers())
        self.assertEqual(response.status_code, 201)
        body = response.get_json()
        self.assertTrue(body["success"])
        self.assertEqual(body["booking"]["member_id"], 1)
        self.assertEqual(body["booking"]["session_id"], 2)
        self.assertTrue(body["booking"]["session"]["booked_by_me"])

    def test_create_ticket(self):
        response = self.client.post(
            "/api/tickets",
            json={
                "staff_id": 1,
                "subject": "Front desk tablet needs charging",
                "description": "Battery is dropping too fast during check-in.",
                "urgency": "low",
            },
            headers=self.staff_headers(),
        )
        self.assertEqual(response.status_code, 201)
        body = response.get_json()
        self.assertEqual(body["ticket"]["subject"], "Front desk tablet needs charging")
        self.assertEqual(body["ticket"]["status"], "open")

    def test_create_maintenance_log(self):
        response = self.client.post(
            "/api/maintenance",
            json={
                "staff_id": 6,
                "area": "Locker Room",
                "description": "Inspect leaking faucet in sink area.",
                "status": "open",
                "log_date": "2026-03-30",
            },
            headers=self.staff_headers(),
        )
        self.assertEqual(response.status_code, 201)
        body = response.get_json()
        self.assertEqual(body["maintenance"]["area"], "Locker Room")
        self.assertEqual(body["maintenance"]["status"], "open")

    def test_create_and_update_member(self):
        create_response = self.client.post(
            "/api/members",
            json={
                "name": "Backend Demo Member",
                "email": "backend.demo@fitops.demo",
                "password": "demo123",
                "membership_type": "standard",
                "status": "active",
                "phone": "555-7777",
            },
            headers=self.staff_headers(),
        )
        self.assertEqual(create_response.status_code, 201)
        member = create_response.get_json()["member"]

        update_response = self.client.patch(
            f"/api/members/{member['id']}",
            json={"status": "expired", "notes": "Updated during API demo."},
            headers=self.staff_headers(),
        )
        self.assertEqual(update_response.status_code, 200)
        updated = update_response.get_json()["member"]
        self.assertEqual(updated["status"], "expired")

    def test_payment_endpoints(self):
        create_response = self.client.post(
            "/api/payments",
            json={
                "member_id": 1,
                "amount": 49.99,
                "due_date": "2026-04-15",
                "status": "pending",
                "note": "April add-on package",
            },
            headers=self.staff_headers(),
        )
        self.assertEqual(create_response.status_code, 201)
        payment = create_response.get_json()["payment"]
        self.assertEqual(payment["status"], "pending")

        update_response = self.client.patch(
            f"/api/payments/{payment['id']}",
            json={"status": "paid"},
            headers=self.staff_headers(),
        )
        self.assertEqual(update_response.status_code, 200)
        updated = update_response.get_json()["payment"]
        self.assertEqual(updated["status"], "paid")
        self.assertIsNotNone(updated["paid_at"])

    def test_meta_and_demo_reset_endpoints(self):
        meta_response = self.client.get("/api/meta/enums")
        self.assertEqual(meta_response.status_code, 200)
        meta = meta_response.get_json()
        self.assertIn("membership_types", meta)

        reset_response = self.client.post("/api/demo/reset", headers=self.staff_headers())
        self.assertEqual(reset_response.status_code, 200)
        reset_body = reset_response.get_json()
        self.assertTrue(reset_body["success"])
        self.assertEqual(reset_body["counts"]["members"], 6)

    def test_member_cannot_view_another_member(self):
        response = self.client.get("/api/members/2", headers=self.member_headers())
        self.assertEqual(response.status_code, 403)

    def test_member_cannot_change_membership_fields(self):
        response = self.client.patch(
            "/api/members/1",
            json={"membership_type": "premium"},
            headers=self.member_headers(),
        )
        self.assertEqual(response.status_code, 403)

    def test_trainer_schedule_conflict_is_rejected(self):
        response = self.client.post(
            "/api/sessions",
            json={
                "title": "Conflicting HIIT",
                "trainer_id": 2,
                "date": "2026-03-31",
                "start_time": "07:30",
                "end_time": "08:15",
                "room": "Studio C",
                "capacity": 10,
            },
            headers=self.staff_headers(),
        )
        self.assertEqual(response.status_code, 409)

    def test_list_endpoints_include_pagination_meta(self):
        response = self.client.get("/api/sessions?page=1&page_size=2", headers=self.member_headers())
        self.assertEqual(response.status_code, 200)
        body = response.get_json()
        self.assertTrue(body["success"])
        self.assertEqual(len(body["items"]), 2)
        self.assertEqual(body["meta"]["page"], 1)
        self.assertEqual(body["meta"]["page_size"], 2)
        self.assertGreaterEqual(body["meta"]["total"], 6)

    def test_invalid_pagination_args_return_validation_error(self):
        response = self.client.get("/api/members?page=0", headers=self.staff_headers())
        self.assertEqual(response.status_code, 400)
        body = response.get_json()
        self.assertFalse(body["success"])
        self.assertIn("page must be at least 1", body["message"])


if __name__ == "__main__":
    unittest.main()
