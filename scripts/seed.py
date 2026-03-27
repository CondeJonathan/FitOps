"""Seed the local SQLite database with sample data.

Creates tables in `gym.db` and inserts a small set of test rows. Safe to run
multiple times (it checks for existing data before inserting).
"""

from __future__ import annotations

from datetime import date, time
from fitops.db.database import Base, SessionLocal, engine
from fitops.db.models import (
    Member,
    MemberStatus,
    MembershipType,
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
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # If you have an older `gym.db` with different Enum values, SQLAlchemy can
        # fail to deserialize rows. In that case, delete `gym.db` and rerun.
        try:
            # Select an Enum column so mismatched DB values fail fast.
            db.query(User.role).limit(1).all()
        except LookupError as e:
            db.close()
            raise SystemExit(
                "Your existing `gym.db` appears to use an older schema (Enum values changed).\n"
                "Fix: close DB Browser (if open), delete `gym.db`, then run `python -m scripts.seed` again.\n"
                f"Details: {e}"
            )

        member_user = db.query(User).filter(User.email == "member@test.com").first()
        staff_user = db.query(User).filter(User.email == "staff@test.com").first()

        if not staff_user:
            staff_user = User(
                name="Test Staff User",
                email="staff@test.com",
                password_hash="hashed_password_staff",
                role=UserRole.staff,
            )
            db.add(staff_user)
            db.flush()

        staff = db.query(Staff).filter(Staff.user_id == staff_user.id).first()
        if not staff:
            staff = Staff(user_id=staff_user.id, position=StaffPosition.trainer)
            db.add(staff)
            db.flush()

        if not member_user:
            member_user = User(
                name="Test Member User",
                email="member@test.com",
                password_hash="hashed_password_member",
                role=UserRole.member,
            )
            db.add(member_user)
            db.flush()

        member = db.query(Member).filter(Member.user_id == member_user.id).first()
        if not member:
            member = Member(
                user_id=member_user.id,
                membership_type=MembershipType.basic,
                status=MemberStatus.active,
                join_date=date.today(),
            )
            db.add(member)
            db.flush()

        session = db.query(TrainingSession).filter(TrainingSession.title == "Intro to Strength").first()
        if not session:
            session = TrainingSession(
                title="Intro to Strength",
                trainer_id=staff.id,
                date=date.today(),
                start_time=time(9, 0),
                end_time=time(10, 0),
                capacity=10,
            )
            db.add(session)
            db.flush()

        booking = (
            db.query(SessionBooking)
            .filter(SessionBooking.member_id == member.id, SessionBooking.session_id == session.id)
            .first()
        )
        if not booking:
            booking = SessionBooking(
                member_id=member.id,
                session_id=session.id,
                status=SessionBookingStatus.booked,
            )
            db.add(booking)

        ticket = db.query(Ticket).filter(Ticket.subject == "Treadmill needs inspection").first()
        if not ticket:
            ticket = Ticket(
                staff_id=staff.id,
                subject="Treadmill needs inspection",
                description="Customer reported unusual noise during use.",
                status=TicketStatus.open,
                urgency=TicketUrgency.medium,
            )
            db.add(ticket)

        db.commit()
        print("Seeding complete. (users, member, staff, session, booking, ticket)")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()

