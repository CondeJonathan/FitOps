"""Seed the local SQLite database with richer demo data."""

from __future__ import annotations

import os
from datetime import date, datetime, time, timedelta

from backend.db.database import SessionLocal, init_db, reset_db
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
from backend.security import hash_password


def upsert_user(db, *, name: str, email: str, password: str, role: UserRole) -> User:
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        user = User(email=email, name=name, role=role, password_hash=hash_password(password))
        db.add(user)
        db.flush()
        return user

    user.name = name
    user.role = role
    if not user.password_hash.startswith("pbkdf2_sha256$"):
        user.password_hash = hash_password(password)
    return user


def upsert_staff(db, *, user: User, position: StaffPosition) -> Staff:
    staff = db.query(Staff).filter(Staff.user_id == user.id).first()
    if staff is None:
        staff = Staff(user_id=user.id, position=position)
        db.add(staff)
        db.flush()
        return staff

    staff.position = position
    return staff


def upsert_member(
    db,
    *,
    user: User,
    membership_type: MembershipType,
    status: MemberStatus,
    join_date: date,
    expiry_date: date,
    phone: str,
    emergency_contact: str,
    emergency_phone: str,
    notes: str | None,
) -> Member:
    member = db.query(Member).filter(Member.user_id == user.id).first()
    if member is None:
        member = Member(
            user_id=user.id,
            membership_type=membership_type,
            status=status,
            join_date=join_date,
            expiry_date=expiry_date,
            phone=phone,
            emergency_contact=emergency_contact,
            emergency_phone=emergency_phone,
            notes=notes,
        )
        db.add(member)
        db.flush()
        return member

    member.membership_type = membership_type
    member.status = status
    member.join_date = join_date
    member.expiry_date = expiry_date
    member.phone = phone
    member.emergency_contact = emergency_contact
    member.emergency_phone = emergency_phone
    member.notes = notes
    return member


def upsert_session(
    db,
    *,
    title: str,
    trainer_id: int,
    session_date: date,
    start_time: time,
    end_time: time,
    room: str,
    capacity: int,
    description: str | None = None,
) -> TrainingSession:
    session = (
        db.query(TrainingSession)
        .filter(
            TrainingSession.title == title,
            TrainingSession.date == session_date,
            TrainingSession.start_time == start_time,
        )
        .first()
    )
    if session is None:
        session = TrainingSession(
            title=title,
            trainer_id=trainer_id,
            date=session_date,
            start_time=start_time,
            end_time=end_time,
            room=room,
            capacity=capacity,
            description=description,
        )
        db.add(session)
        db.flush()
        return session

    session.trainer_id = trainer_id
    session.end_time = end_time
    session.room = room
    session.capacity = capacity
    session.description = description
    return session


def upsert_booking(
    db,
    *,
    member_id: int,
    session_id: int,
    status: SessionBookingStatus,
) -> SessionBooking:
    booking = (
        db.query(SessionBooking)
        .filter(SessionBooking.member_id == member_id, SessionBooking.session_id == session_id)
        .first()
    )
    if booking is None:
        booking = SessionBooking(member_id=member_id, session_id=session_id, status=status)
        db.add(booking)
        db.flush()
        return booking

    booking.status = status
    return booking


def upsert_ticket(
    db,
    *,
    staff_id: int,
    subject: str,
    description: str,
    status: TicketStatus,
    urgency: TicketUrgency,
) -> Ticket:
    ticket = db.query(Ticket).filter(Ticket.subject == subject).first()
    if ticket is None:
        ticket = Ticket(
            staff_id=staff_id,
            subject=subject,
            description=description,
            status=status,
            urgency=urgency,
        )
        db.add(ticket)
        db.flush()
        return ticket

    ticket.staff_id = staff_id
    ticket.description = description
    ticket.status = status
    ticket.urgency = urgency
    return ticket


def upsert_maintenance(
    db,
    *,
    staff_id: int,
    area: str,
    description: str,
    status: MaintenanceStatus,
    log_date: date,
) -> MaintenanceLog:
    item = (
        db.query(MaintenanceLog)
        .filter(MaintenanceLog.area == area, MaintenanceLog.log_date == log_date)
        .first()
    )
    if item is None:
        item = MaintenanceLog(
            staff_id=staff_id,
            area=area,
            description=description,
            status=status,
            log_date=log_date,
        )
        db.add(item)
        db.flush()
        return item

    item.staff_id = staff_id
    item.description = description
    item.status = status
    return item


def upsert_payment(
    db,
    *,
    member_id: int,
    amount: float,
    status: PaymentStatus,
    due_date: date,
    note: str | None = None,
    paid_at: datetime | None = None,
) -> Payment:
    payment = db.query(Payment).filter(Payment.member_id == member_id, Payment.due_date == due_date).first()
    if payment is None:
        payment = Payment(
            member_id=member_id,
            amount=amount,
            status=status,
            due_date=due_date,
            note=note,
            paid_at=paid_at,
        )
        db.add(payment)
        db.flush()
        return payment

    payment.amount = amount
    payment.status = status
    payment.note = note
    payment.paid_at = paid_at
    return payment


def seed() -> None:
    if os.getenv("FITOPS_RESET_DB") == "1":
        reset_db()
    else:
        init_db()

    db = SessionLocal()
    try:
        # Fail early when an old DB contains incompatible enum values.
        try:
            db.query(User.role).limit(1).all()
        except LookupError as exc:
            raise SystemExit(
                "Your existing `gym.db` appears to use an older schema.\n"
                "Delete `gym.db` or rerun with `FITOPS_RESET_DB=1`, then seed again.\n"
                f"Details: {exc}"
            ) from exc

        today = date.today()

        staff_specs = [
            {
                "name": "FitOps Admin",
                "email": "staff@test.com",
                "password": "staff123",
                "position": StaffPosition.admin,
            },
            {
                "name": "Sarah L.",
                "email": "sarah@fitops.demo",
                "password": "demo123",
                "position": StaffPosition.trainer,
            },
            {
                "name": "Mike T.",
                "email": "mike@fitops.demo",
                "password": "demo123",
                "position": StaffPosition.trainer,
            },
            {
                "name": "Carlos R.",
                "email": "carlos@fitops.demo",
                "password": "demo123",
                "position": StaffPosition.trainer,
            },
            {
                "name": "Maria G.",
                "email": "maria@fitops.demo",
                "password": "demo123",
                "position": StaffPosition.trainer,
            },
            {
                "name": "Jordan M.",
                "email": "maintenance@fitops.demo",
                "password": "demo123",
                "position": StaffPosition.maintenance,
            },
        ]

        member_specs = [
            {
                "name": "John Doe",
                "email": "member@test.com",
                "password": "member123",
                "membership_type": MembershipType.premium,
                "status": MemberStatus.active,
                "join_date": today - timedelta(days=450),
                "expiry_date": today + timedelta(days=180),
                "phone": "555-0101",
                "emergency_contact": "Jane Doe",
                "emergency_phone": "555-0102",
                "notes": "Primary demo member account.",
            },
            {
                "name": "Emily Chen",
                "email": "emily.chen@fitops.demo",
                "password": "demo123",
                "membership_type": MembershipType.standard,
                "status": MemberStatus.active,
                "join_date": today - timedelta(days=390),
                "expiry_date": today + timedelta(days=90),
                "phone": "555-0203",
                "emergency_contact": "Tom Chen",
                "emergency_phone": "555-0204",
                "notes": "Prefers morning classes.",
            },
            {
                "name": "Marcus Rivera",
                "email": "marcus.rivera@fitops.demo",
                "password": "demo123",
                "membership_type": MembershipType.premium,
                "status": MemberStatus.active,
                "join_date": today - timedelta(days=760),
                "expiry_date": today + timedelta(days=30),
                "phone": "555-0305",
                "emergency_contact": "Ana Rivera",
                "emergency_phone": "555-0306",
                "notes": None,
            },
            {
                "name": "Aisha Patel",
                "email": "aisha.patel@fitops.demo",
                "password": "demo123",
                "membership_type": MembershipType.basic,
                "status": MemberStatus.expired,
                "join_date": today - timedelta(days=680),
                "expiry_date": today - timedelta(days=40),
                "phone": "555-0407",
                "emergency_contact": "Raj Patel",
                "emergency_phone": "555-0408",
                "notes": "Renewal pending.",
            },
            {
                "name": "Tyler Brooks",
                "email": "tyler.brooks@fitops.demo",
                "password": "demo123",
                "membership_type": MembershipType.standard,
                "status": MemberStatus.active,
                "join_date": today - timedelta(days=210),
                "expiry_date": today + timedelta(days=150),
                "phone": "555-0509",
                "emergency_contact": "Lisa Brooks",
                "emergency_phone": "555-0510",
                "notes": None,
            },
            {
                "name": "Sophie Nguyen",
                "email": "sophie.nguyen@fitops.demo",
                "password": "demo123",
                "membership_type": MembershipType.premium,
                "status": MemberStatus.suspended,
                "join_date": today - timedelta(days=720),
                "expiry_date": today + timedelta(days=60),
                "phone": "555-0611",
                "emergency_contact": "Minh Nguyen",
                "emergency_phone": "555-0612",
                "notes": "Account suspended due to payment issue.",
            },
        ]

        staff_by_email = {}
        for spec in staff_specs:
            user = upsert_user(
                db,
                name=spec["name"],
                email=spec["email"],
                password=spec["password"],
                role=UserRole.staff,
            )
            staff_by_email[spec["email"]] = upsert_staff(db, user=user, position=spec["position"])

        members_by_email = {}
        for spec in member_specs:
            user = upsert_user(
                db,
                name=spec["name"],
                email=spec["email"],
                password=spec["password"],
                role=UserRole.member,
            )
            members_by_email[spec["email"]] = upsert_member(
                db,
                user=user,
                membership_type=spec["membership_type"],
                status=spec["status"],
                join_date=spec["join_date"],
                expiry_date=spec["expiry_date"],
                phone=spec["phone"],
                emergency_contact=spec["emergency_contact"],
                emergency_phone=spec["emergency_phone"],
                notes=spec["notes"],
            )

        session_specs = [
            {
                "title": "Yoga Flow",
                "trainer_email": "sarah@fitops.demo",
                "date": today + timedelta(days=1),
                "start_time": time(7, 0),
                "end_time": time(8, 0),
                "room": "Studio A",
                "capacity": 15,
                "description": "Morning mobility and balance session.",
            },
            {
                "title": "HIIT Blast",
                "trainer_email": "mike@fitops.demo",
                "date": today + timedelta(days=1),
                "start_time": time(9, 0),
                "end_time": time(9, 45),
                "room": "Main Floor",
                "capacity": 20,
                "description": "Fast-paced interval training.",
            },
            {
                "title": "Pilates Core",
                "trainer_email": "sarah@fitops.demo",
                "date": today + timedelta(days=2),
                "start_time": time(10, 0),
                "end_time": time(11, 0),
                "room": "Studio A",
                "capacity": 12,
                "description": "Core-focused stability workout.",
            },
            {
                "title": "Boxing Basics",
                "trainer_email": "carlos@fitops.demo",
                "date": today + timedelta(days=3),
                "start_time": time(18, 0),
                "end_time": time(19, 0),
                "room": "Boxing Ring",
                "capacity": 10,
                "description": "Entry-level boxing fundamentals.",
            },
            {
                "title": "Zumba Dance",
                "trainer_email": "maria@fitops.demo",
                "date": today + timedelta(days=3),
                "start_time": time(19, 30),
                "end_time": time(20, 30),
                "room": "Studio B",
                "capacity": 25,
                "description": "Dance cardio class.",
            },
            {
                "title": "Strength & Power",
                "trainer_email": "mike@fitops.demo",
                "date": today + timedelta(days=4),
                "start_time": time(7, 0),
                "end_time": time(8, 15),
                "room": "Weight Room",
                "capacity": 12,
                "description": "Strength training with compound lifts.",
            },
        ]

        sessions_by_title = {}
        for spec in session_specs:
            session = upsert_session(
                db,
                title=spec["title"],
                trainer_id=staff_by_email[spec["trainer_email"]].id,
                session_date=spec["date"],
                start_time=spec["start_time"],
                end_time=spec["end_time"],
                room=spec["room"],
                capacity=spec["capacity"],
                description=spec["description"],
            )
            sessions_by_title[spec["title"]] = session

        booking_specs = [
            ("member@test.com", "Yoga Flow", SessionBookingStatus.booked),
            ("member@test.com", "Zumba Dance", SessionBookingStatus.booked),
            ("emily.chen@fitops.demo", "Yoga Flow", SessionBookingStatus.booked),
            ("emily.chen@fitops.demo", "Strength & Power", SessionBookingStatus.booked),
            ("marcus.rivera@fitops.demo", "HIIT Blast", SessionBookingStatus.booked),
            ("tyler.brooks@fitops.demo", "Pilates Core", SessionBookingStatus.booked),
            ("sophie.nguyen@fitops.demo", "Boxing Basics", SessionBookingStatus.cancelled),
        ]

        for member_email, session_title, booking_status in booking_specs:
            upsert_booking(
                db,
                member_id=members_by_email[member_email].id,
                session_id=sessions_by_title[session_title].id,
                status=booking_status,
            )

        upsert_ticket(
            db,
            staff_id=staff_by_email["staff@test.com"].id,
            subject="Treadmill needs inspection",
            description="Customer reported unusual noise during use.",
            status=TicketStatus.open,
            urgency=TicketUrgency.medium,
        )
        upsert_ticket(
            db,
            staff_id=staff_by_email["maintenance@fitops.demo"].id,
            subject="Pool pump maintenance needed",
            description="Pressure dropped during morning checks.",
            status=TicketStatus.processing,
            urgency=TicketUrgency.high,
        )
        upsert_ticket(
            db,
            staff_id=staff_by_email["staff@test.com"].id,
            subject="Studio B AC unit repaired",
            description="Repair completed and verified by facilities team.",
            status=TicketStatus.closed,
            urgency=TicketUrgency.low,
        )

        upsert_maintenance(
            db,
            staff_id=staff_by_email["maintenance@fitops.demo"].id,
            area="Pool",
            description="Pool pump inspection scheduled.",
            status=MaintenanceStatus.in_progress,
            log_date=today - timedelta(days=1),
        )
        upsert_maintenance(
            db,
            staff_id=staff_by_email["maintenance@fitops.demo"].id,
            area="Studio B",
            description="Air conditioning unit repaired and tested.",
            status=MaintenanceStatus.completed,
            log_date=today - timedelta(days=4),
        )
        upsert_maintenance(
            db,
            staff_id=staff_by_email["maintenance@fitops.demo"].id,
            area="Main Floor",
            description="Dumbbell rack bolts tightened during safety check.",
            status=MaintenanceStatus.open,
            log_date=today,
        )

        upsert_payment(
            db,
            member_id=members_by_email["member@test.com"].id,
            amount=79.99,
            status=PaymentStatus.paid,
            due_date=today - timedelta(days=15),
            paid_at=datetime.now() - timedelta(days=13),
            note="Monthly premium membership",
        )
        upsert_payment(
            db,
            member_id=members_by_email["sophie.nguyen@fitops.demo"].id,
            amount=79.99,
            status=PaymentStatus.overdue,
            due_date=today - timedelta(days=20),
            note="Suspension triggered by overdue payment.",
        )

        db.commit()
        print("Seeding complete.")
        print("Demo credentials:")
        print("  member@test.com / member123")
        print("  staff@test.com  / staff123")
        print("  all other *.demo accounts / demo123")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
