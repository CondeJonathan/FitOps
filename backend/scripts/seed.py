from __future__ import annotations

from datetime import date, datetime

from werkzeug.security import generate_password_hash

from backend.db.database import reset_db, SessionLocal
from backend.db.models import (
    MaintenanceLog,
    MaintenanceStatus,
    Member,
    MemberStatus,
    MembershipType,
    Payment,
    PaymentStatus,
    SessionBooking,
    SessionBookingStatus,
    Staff,
    StaffPosition,
    Ticket,
    TicketStatus,
    TicketUrgency,
    TrainingSession,
    User,
    UserRole,
)


def seed() -> None:
    reset_db()
    db = SessionLocal()
    try:
        staff_users = [
            ("Nina Park", "nina@fitops.com", StaffPosition.admin),
            ("Mike Ramos", "mike@fitops.com", StaffPosition.maintenance),
            ("Jordan Lee", "jordan@fitops.com", StaffPosition.trainer),
            ("Leila Chen", "leila@fitops.com", StaffPosition.support),
        ]
        staff_rows = {}
        for name, email, position in staff_users:
            user = User(
                name=name,
                email=email,
                password_hash=generate_password_hash("Password123!"),
                role=UserRole.staff,
            )
            db.add(user)
            db.flush()
            staff = Staff(user_id=user.id, position=position)
            db.add(staff)
            db.flush()
            staff_rows[email] = staff

        member_users = [
            "Ava Brooks",
            "Mason Johnson",
            "Chloe Patel",
            "Sophia Carter",
            "Daniel Rivera",
            "Noah Lee",
            "Kylie Evans",
            "Ryan Howard",
            "James Kim",
            "Liam Hall",
            "Paula Gray",
            "Ben Scott",
        ]
        member_rows = []
        for idx, name in enumerate(member_users, start=1):
            email = f"member{idx}@example.com"
            user = User(
                name=name,
                email=email,
                password_hash=generate_password_hash("Password123!"),
                role=UserRole.member,
            )
            db.add(user)
            db.flush()
            member = Member(
                user_id=user.id,
                membership_type=MembershipType.standard,
                status=MemberStatus.active,
                join_date=date(2026, 1, 1),
                expiry_date=date(2026, 12, 31),
                phone="",
                emergency_contact="",
                emergency_phone="",
                notes="Priority booking|Guest passes|Locker + towel|Trainer consult",
            )
            db.add(member)
            db.flush()
            member_rows.append(member)

        sessions_data = [
            ("Strength Foundations", "jordan@fitops.com", date(2026, 4, 1), "18:00", "19:00", "Floor A", 16, "Full body strength"),
            ("HIIT Express", "jordan@fitops.com", date(2026, 4, 6), "07:30", "08:15", "Studio B", 14, "Conditioning"),
            ("Mobility + Core", "leila@fitops.com", date(2026, 4, 14), "17:30", "18:15", "Studio C", 12, "Mobility and core"),
            ("Power Spin", "jordan@fitops.com", date(2026, 4, 21), "09:00", "10:00", "Spin Room", 18, "Cardio ride"),
            ("Morning Yoga", "leila@fitops.com", date(2026, 4, 28), "07:00", "08:00", "Studio A", 20, "Yoga flow"),
        ]
        sessions = []
        for title, trainer_email, d, start, end, room, capacity, description in sessions_data:
            session = TrainingSession(
                title=title,
                trainer_id=staff_rows[trainer_email].id,
                date=d,
                start_time=datetime.strptime(start, "%H:%M").time(),
                end_time=datetime.strptime(end, "%H:%M").time(),
                room=room,
                capacity=capacity,
                description=description,
            )
            db.add(session)
            db.flush()
            sessions.append(session)

        booking_pairs = [
            (0, 0), (1, 0), (2, 0), (3, 0),
            (4, 1), (5, 1), (6, 1), (7, 1), (8, 1),
            (9, 2), (10, 2), (11, 2),
            (0, 3), (1, 4),
        ]
        for member_idx, session_idx in booking_pairs:
            db.add(
                SessionBooking(
                    member_id=member_rows[member_idx].id,
                    session_id=sessions[session_idx].id,
                    status=SessionBookingStatus.booked,
                )
            )

        for member in member_rows:
            db.add_all(
                [
                    Payment(
                        member_id=member.id,
                        amount=49.00,
                        status=PaymentStatus.pending,
                        due_date=date(2026, 4, 10),
                        note="Monthly Membership",
                    ),
                    Payment(
                        member_id=member.id,
                        amount=49.00,
                        status=PaymentStatus.paid,
                        due_date=date(2026, 3, 10),
                        paid_at=datetime(2026, 3, 10, 9, 30),
                        note="Monthly Membership",
                    ),
                    Payment(
                        member_id=member.id,
                        amount=15.00,
                        status=PaymentStatus.paid,
                        due_date=date(2026, 3, 2),
                        paid_at=datetime(2026, 3, 2, 18, 0),
                        note="Drop-in Class",
                    ),
                    Payment(
                        member_id=member.id,
                        amount=49.00,
                        status=PaymentStatus.paid,
                        due_date=date(2026, 2, 10),
                        paid_at=datetime(2026, 2, 10, 10, 0),
                        note="Monthly Membership",
                    ),
                ]
            )

        db.add_all(
            [
                Ticket(
                    staff_id=staff_rows["mike@fitops.com"].id,
                    subject="Treadmill #4",
                    description="Belt slipping and motor noise during speed changes.",
                    status=TicketStatus.processing,
                    urgency=TicketUrgency.high,
                ),
                Ticket(
                    staff_id=staff_rows["nina@fitops.com"].id,
                    subject="Locker Room Sink",
                    description="Slow drain, minor leak under pipe.",
                    status=TicketStatus.open,
                    urgency=TicketUrgency.medium,
                ),
                Ticket(
                    staff_id=staff_rows["leila@fitops.com"].id,
                    subject="Spin Bike #2",
                    description="Seat post clamp replaced and tested.",
                    status=TicketStatus.closed,
                    urgency=TicketUrgency.low,
                ),
            ]
        )

        db.add_all(
            [
                MaintenanceLog(
                    staff_id=staff_rows["mike@fitops.com"].id,
                    area="Locker Rooms",
                    description="Refilled paper towels in all locker rooms.",
                    status=MaintenanceStatus.completed,
                    log_date=date(2026, 3, 28),
                ),
                MaintenanceLog(
                    staff_id=staff_rows["leila@fitops.com"].id,
                    area="Yoga Storage",
                    description="Deep cleaned yoga mats and storage racks.",
                    status=MaintenanceStatus.completed,
                    log_date=date(2026, 3, 29),
                ),
                MaintenanceLog(
                    staff_id=staff_rows["mike@fitops.com"].id,
                    area="Rowing Area",
                    description="Inspect rowing machines for loose straps.",
                    status=MaintenanceStatus.open,
                    log_date=date(2026, 3, 31),
                ),
            ]
        )

        db.commit()
    finally:
        db.close()


if __name__ == "__main__":
    seed()

