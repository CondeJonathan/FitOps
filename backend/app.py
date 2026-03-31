"""Runnable Flask API for the FitOps demo backend."""

from __future__ import annotations

import os
from contextlib import contextmanager
from datetime import UTC, date, datetime, time, timedelta
from functools import wraps

from flask import Flask, g, jsonify, request
from flask_cors import CORS
from sqlalchemy.exc import IntegrityError
from sqlalchemy import or_
from sqlalchemy.orm import joinedload

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
from backend.security import generate_auth_token, hash_password, verify_auth_token, verify_password

TOKEN_MAX_AGE_SECONDS = int(os.getenv("FITOPS_TOKEN_MAX_AGE_SECONDS", str(60 * 60 * 12)))
DEFAULT_PAGE_SIZE = int(os.getenv("FITOPS_DEFAULT_PAGE_SIZE", "20"))
MAX_PAGE_SIZE = int(os.getenv("FITOPS_MAX_PAGE_SIZE", "100"))


def normalize_enum_value(value: str | None) -> str | None:
    if value is None:
        return None
    return str(value).strip().lower().replace("-", "_").replace(" ", "_")


def parse_enum(enum_cls, value, field_name: str):
    normalized = normalize_enum_value(value)
    if not normalized:
        raise ValueError(f"{field_name} is required.")

    try:
        return enum_cls(normalized)
    except ValueError as exc:
        valid = ", ".join(item.value for item in enum_cls)
        raise ValueError(f"{field_name} must be one of: {valid}.") from exc


def parse_date(value, field_name: str) -> date:
    if not value:
        raise ValueError(f"{field_name} is required.")
    try:
        return date.fromisoformat(str(value))
    except ValueError as exc:
        raise ValueError(f"{field_name} must be in YYYY-MM-DD format.") from exc


def parse_time(value, field_name: str) -> time:
    if not value:
        raise ValueError(f"{field_name} is required.")
    try:
        return time.fromisoformat(str(value))
    except ValueError as exc:
        raise ValueError(f"{field_name} must be in HH:MM or HH:MM:SS format.") from exc


def parse_datetime(value, field_name: str) -> datetime:
    if not value:
        raise ValueError(f"{field_name} is required.")
    try:
        return datetime.fromisoformat(str(value))
    except ValueError as exc:
        raise ValueError(f"{field_name} must be a valid ISO datetime string.") from exc


def enum_label(enum_member) -> str | None:
    if enum_member is None:
        return None
    return enum_member.value.replace("_", " ").title()


def enum_values(enum_cls) -> list[dict]:
    return [{"value": item.value, "label": enum_label(item)} for item in enum_cls]


def json_error(message: str, status_code: int = 400):
    return jsonify({"success": False, "message": message}), status_code


def success_payload(**kwargs):
    payload = {"success": True}
    payload.update(kwargs)
    return jsonify(payload)


def created_payload(**kwargs):
    return success_payload(**kwargs), 201


def parse_pagination_args():
    try:
        page = int(request.args.get("page", 1))
        page_size = int(request.args.get("page_size", DEFAULT_PAGE_SIZE))
    except ValueError as exc:
        raise ValueError("page and page_size must be integers.") from exc

    if page < 1:
        raise ValueError("page must be at least 1.")
    if page_size < 1:
        raise ValueError("page_size must be at least 1.")
    if page_size > MAX_PAGE_SIZE:
        page_size = MAX_PAGE_SIZE

    return page, page_size


def paginate_query(query, serializer):
    page, page_size = parse_pagination_args()
    total = query.count()
    offset = (page - 1) * page_size
    records = query.offset(offset).limit(page_size).all()
    return {
        "items": [serializer(record) for record in records],
        "meta": {
            "page": page,
            "page_size": page_size,
            "total": total,
            "total_pages": (total + page_size - 1) // page_size if total else 0,
            "has_next": offset + page_size < total,
            "has_previous": page > 1,
        },
    }


def paginate_items(items, serializer):
    page, page_size = parse_pagination_args()
    total = len(items)
    offset = (page - 1) * page_size
    records = items[offset : offset + page_size]
    return {
        "items": [serializer(record) for record in records],
        "meta": {
            "page": page,
            "page_size": page_size,
            "total": total,
            "total_pages": (total + page_size - 1) // page_size if total else 0,
            "has_next": offset + page_size < total,
            "has_previous": page > 1,
        },
    }


@contextmanager
def session_scope():
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def get_bearer_token() -> str | None:
    authorization = request.headers.get("Authorization", "")
    if authorization.startswith("Bearer "):
        return authorization[7:].strip()
    return None


def load_request_identity():
    cached_identity = getattr(g, "current_identity", None)
    if cached_identity is not None:
        return cached_identity

    token = get_bearer_token()
    if not token:
        return None

    payload = verify_auth_token(token, max_age=TOKEN_MAX_AGE_SECONDS)
    if not payload or "user_id" not in payload:
        return None

    db = SessionLocal()
    try:
        user = (
            db.query(User)
            .options(joinedload(User.member), joinedload(User.staff))
            .filter(User.id == payload["user_id"])
            .first()
        )
        if user is None:
            return None

        identity = {
            "user_id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role.value,
            "member_id": user.member.id if user.member else None,
            "staff_id": user.staff.id if user.staff else None,
        }
        g.current_identity = identity
        return identity
    finally:
        db.close()


def auth_required(*roles: str):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            identity = load_request_identity()
            if identity is None:
                return json_error("Authentication required. Send a Bearer token from /api/login.", 401)

            if roles and identity["role"] not in roles:
                return json_error("You do not have permission to access this resource.", 403)

            return func(*args, **kwargs)

        return wrapper

    return decorator


def current_identity() -> dict:
    identity = getattr(g, "current_identity", None)
    if identity is None:
        raise RuntimeError("Authentication was not initialized for this request.")
    return identity


def is_staff(identity: dict | None = None) -> bool:
    identity = identity or current_identity()
    return identity["role"] == UserRole.staff.value


def is_member(identity: dict | None = None) -> bool:
    identity = identity or current_identity()
    return identity["role"] == UserRole.member.value


def ensure_member_access(member_id: int):
    identity = current_identity()
    if is_staff(identity):
        return None
    if identity["member_id"] != member_id:
        return json_error("Members can only access their own records.", 403)
    return None


def ensure_staff_or_same_member(member_id: int):
    identity = current_identity()
    if is_staff(identity):
        return None
    if identity["member_id"] != member_id:
        return json_error("This action is only allowed for your own member account.", 403)
    return None


def times_overlap(start_a: time, end_a: time, start_b: time, end_b: time) -> bool:
    return start_a < end_b and start_b < end_a


def trainer_has_schedule_conflict(
    db,
    *,
    trainer_id: int,
    session_date: date,
    start_time_value: time,
    end_time_value: time,
    exclude_session_id: int | None = None,
) -> bool:
    query = db.query(TrainingSession).filter(
        TrainingSession.trainer_id == trainer_id,
        TrainingSession.date == session_date,
    )
    if exclude_session_id is not None:
        query = query.filter(TrainingSession.id != exclude_session_id)

    for existing in query.all():
        if times_overlap(existing.start_time, existing.end_time, start_time_value, end_time_value):
            return True
    return False


def member_has_booking_conflict(
    db,
    *,
    member_id: int,
    session_date: date,
    start_time_value: time,
    end_time_value: time,
    exclude_session_id: int | None = None,
) -> bool:
    bookings = (
        db.query(SessionBooking)
        .options(joinedload(SessionBooking.session))
        .filter(
            SessionBooking.member_id == member_id,
            SessionBooking.status == SessionBookingStatus.booked,
        )
        .all()
    )
    for booking in bookings:
        session = booking.session
        if exclude_session_id is not None and session.id == exclude_session_id:
            continue
        if session.date != session_date:
            continue
        if times_overlap(session.start_time, session.end_time, start_time_value, end_time_value):
            return True
    return False


def active_bookings_for_session(session: TrainingSession) -> list[SessionBooking]:
    return [booking for booking in session.bookings if booking.status == SessionBookingStatus.booked]


def serialize_user(user: User) -> dict:
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role.value,
        "created_at": user.created_at.isoformat() if user.created_at else None,
    }


def serialize_member(member: Member) -> dict:
    active_bookings = [booking for booking in member.session_bookings if booking.status == SessionBookingStatus.booked]
    return {
        "id": member.id,
        "user_id": member.user_id,
        "name": member.user.name,
        "email": member.user.email,
        "phone": member.phone,
        "membership_type": member.membership_type.value,
        "membership_label": enum_label(member.membership_type),
        "status": member.status.value,
        "status_label": enum_label(member.status),
        "join_date": member.join_date.isoformat(),
        "expiry_date": member.expiry_date.isoformat(),
        "emergency_contact": member.emergency_contact,
        "emergency_phone": member.emergency_phone,
        "notes": member.notes,
        "booked_class_ids": [booking.session_id for booking in active_bookings],
        "booking_count": len(active_bookings),
    }


def serialize_staff(staff: Staff) -> dict:
    return {
        "id": staff.id,
        "user_id": staff.user_id,
        "name": staff.user.name,
        "email": staff.user.email,
        "position": staff.position.value,
        "position_label": enum_label(staff.position),
    }


def serialize_session(session: TrainingSession, member_id: int | None = None) -> dict:
    active_bookings = active_bookings_for_session(session)
    return {
        "id": session.id,
        "title": session.title,
        "trainer_id": session.trainer_id,
        "trainer_name": session.trainer.user.name,
        "date": session.date.isoformat(),
        "start_time": session.start_time.strftime("%H:%M"),
        "end_time": session.end_time.strftime("%H:%M"),
        "room": session.room,
        "capacity": session.capacity,
        "description": session.description,
        "booked_count": len(active_bookings),
        "spots_left": max(session.capacity - len(active_bookings), 0),
        "available": len(active_bookings) < session.capacity,
        "booked_by_me": any(
            booking.member_id == member_id and booking.status == SessionBookingStatus.booked
            for booking in session.bookings
        )
        if member_id is not None
        else False,
        "created_at": session.created_at.isoformat() if session.created_at else None,
    }


def serialize_booking(booking: SessionBooking) -> dict:
    return {
        "id": booking.id,
        "member_id": booking.member_id,
        "member_name": booking.member.user.name,
        "session_id": booking.session_id,
        "status": booking.status.value,
        "status_label": enum_label(booking.status),
        "created_at": booking.created_at.isoformat() if booking.created_at else None,
        "session": serialize_session(booking.session, booking.member_id),
    }


def serialize_ticket(ticket: Ticket) -> dict:
    return {
        "id": ticket.id,
        "staff_id": ticket.staff_id,
        "staff_name": ticket.staff.user.name,
        "subject": ticket.subject,
        "description": ticket.description,
        "status": ticket.status.value,
        "status_label": enum_label(ticket.status),
        "urgency": ticket.urgency.value,
        "urgency_label": enum_label(ticket.urgency),
        "created_at": ticket.created_at.isoformat() if ticket.created_at else None,
        "updated_at": ticket.updated_at.isoformat() if ticket.updated_at else None,
    }


def serialize_maintenance(log: MaintenanceLog) -> dict:
    return {
        "id": log.id,
        "staff_id": log.staff_id,
        "staff_name": log.staff.user.name,
        "area": log.area,
        "description": log.description,
        "status": log.status.value,
        "status_label": enum_label(log.status),
        "log_date": log.log_date.isoformat(),
        "created_at": log.created_at.isoformat() if log.created_at else None,
    }


def serialize_payment(payment: Payment) -> dict:
    return {
        "id": payment.id,
        "member_id": payment.member_id,
        "member_name": payment.member.user.name if payment.member and payment.member.user else None,
        "amount": payment.amount,
        "status": payment.status.value,
        "status_label": enum_label(payment.status),
        "due_date": payment.due_date.isoformat(),
        "paid_at": payment.paid_at.isoformat() if payment.paid_at else None,
        "note": payment.note,
    }


def create_app() -> Flask:
    init_db()

    app = Flask(__name__)
    CORS(app)

    @app.errorhandler(ValueError)
    def handle_value_error(exc):
        return json_error(str(exc), 400)

    @app.errorhandler(IntegrityError)
    def handle_integrity_error(exc):
        app.logger.warning("Integrity error: %s", exc)
        return json_error("The request conflicts with existing database data.", 409)

    @app.errorhandler(Exception)
    def handle_unexpected_error(exc):
        app.logger.exception("Unhandled server error")
        return json_error("Internal server error.", 500)

    @app.get("/")
    def index():
        return success_payload(
            message="FitOps backend is running.",
            health_url="/api/health",
        )

    @app.get("/api/health")
    def health():
        with session_scope() as db:
            return success_payload(
                database="ok",
                counts={
                    "users": db.query(User).count(),
                    "members": db.query(Member).count(),
                    "staff": db.query(Staff).count(),
                    "sessions": db.query(TrainingSession).count(),
                    "bookings": db.query(SessionBooking).count(),
                    "tickets": db.query(Ticket).count(),
                    "maintenance_logs": db.query(MaintenanceLog).count(),
                    "payments": db.query(Payment).count(),
                },
            )

    @app.get("/api/meta/enums")
    def get_enum_metadata():
        return success_payload(
            membership_types=enum_values(MembershipType),
            member_statuses=enum_values(MemberStatus),
            staff_positions=enum_values(StaffPosition),
            session_booking_statuses=enum_values(SessionBookingStatus),
            ticket_statuses=enum_values(TicketStatus),
            ticket_urgencies=enum_values(TicketUrgency),
            maintenance_statuses=enum_values(MaintenanceStatus),
            payment_statuses=enum_values(PaymentStatus),
        )

    @app.post("/api/demo/reset")
    @auth_required("staff")
    def reset_demo_data():
        from backend.scripts.seed import seed

        reset_db()
        seed()
        with session_scope() as db:
            return success_payload(
                message="Demo data reset successfully.",
                counts={
                    "users": db.query(User).count(),
                    "members": db.query(Member).count(),
                    "staff": db.query(Staff).count(),
                    "sessions": db.query(TrainingSession).count(),
                    "tickets": db.query(Ticket).count(),
                },
            )

    @app.post("/api/login")
    def login():
        payload = request.get_json(silent=True) or {}
        email = (payload.get("email") or "").strip().lower()
        password = payload.get("password") or ""
        requested_role = normalize_enum_value(payload.get("role"))

        if not email or not password:
            return json_error("Email and password are required.")

        with session_scope() as db:
            user = (
                db.query(User)
                .options(joinedload(User.member), joinedload(User.staff))
                .filter(User.email.ilike(email))
                .first()
            )
            if not user or not verify_password(password, user.password_hash):
                return json_error("Invalid email or password.", 401)

            if requested_role and user.role.value != requested_role:
                return json_error("That account does not match the selected role.", 403)

            profile = serialize_member(user.member) if user.role == UserRole.member else serialize_staff(user.staff)
            return success_payload(
                message="Login successful.",
                token=generate_auth_token(
                    {
                        "user_id": user.id,
                        "role": user.role.value,
                    }
                ),
                token_type="Bearer",
                expires_in_seconds=TOKEN_MAX_AGE_SECONDS,
                role=user.role.value,
                name=user.name,
                user=serialize_user(user),
                profile=profile,
            )

    @app.get("/api/me")
    @auth_required("member", "staff")
    def me():
        identity = current_identity()
        with session_scope() as db:
            user = (
                db.query(User)
                .options(joinedload(User.member), joinedload(User.staff))
                .filter(User.id == identity["user_id"])
                .first()
            )
            profile = serialize_member(user.member) if user.role == UserRole.member else serialize_staff(user.staff)
            return success_payload(user=serialize_user(user), profile=profile)

    @app.get("/api/staff")
    @auth_required("staff")
    def list_staff():
        position_filter = normalize_enum_value(request.args.get("position"))
        with session_scope() as db:
            query = db.query(Staff).options(joinedload(Staff.user)).order_by(Staff.id)
            if position_filter:
                try:
                    query = query.filter(Staff.position == parse_enum(StaffPosition, position_filter, "position"))
                except ValueError as exc:
                    return json_error(str(exc))

            return success_payload(**paginate_query(query, serialize_staff))

    @app.get("/api/members")
    @app.get("/api/member-status")
    @auth_required("member", "staff")
    def list_members():
        status_filter = normalize_enum_value(request.args.get("status"))
        membership_filter = normalize_enum_value(request.args.get("membership_type"))
        search = (request.args.get("q") or "").strip()

        identity = current_identity()
        with session_scope() as db:
            query = (
                db.query(Member)
                .options(joinedload(Member.user), joinedload(Member.session_bookings))
                .order_by(Member.id)
            )
            try:
                if status_filter:
                    query = query.filter(Member.status == parse_enum(MemberStatus, status_filter, "status"))
                if membership_filter:
                    query = query.filter(
                        Member.membership_type == parse_enum(MembershipType, membership_filter, "membership_type")
                    )
            except ValueError as exc:
                return json_error(str(exc))

            if is_member(identity):
                query = query.filter(Member.id == identity["member_id"])
            if search:
                like_pattern = f"%{search}%"
                query = query.join(Member.user).filter(
                    or_(User.name.ilike(like_pattern), User.email.ilike(like_pattern))
                )

            return success_payload(**paginate_query(query, serialize_member))

    @app.post("/api/members")
    @auth_required("staff")
    def create_member():
        payload = request.get_json(silent=True) or {}
        try:
            name = (payload.get("name") or "").strip()
            email = (payload.get("email") or "").strip().lower()
            password = payload.get("password") or ""
            membership_type = parse_enum(
                MembershipType,
                payload.get("membership_type") or "basic",
                "membership_type",
            )
            status = parse_enum(MemberStatus, payload.get("status") or "active", "status")
            join_date = parse_date(payload.get("join_date") or date.today().isoformat(), "join_date")
            expiry_date = parse_date(
                payload.get("expiry_date") or (join_date + timedelta(days=365)).isoformat(),
                "expiry_date",
            )
        except ValueError as exc:
            return json_error(str(exc))

        if not name or not email or not password:
            return json_error("name, email, and password are required.")
        if expiry_date <= join_date:
            return json_error("expiry_date must be after join_date.")

        with session_scope() as db:
            existing = db.query(User).filter(User.email.ilike(email)).first()
            if existing:
                return json_error("A user with that email already exists.", 409)

            user = User(
                name=name,
                email=email,
                password_hash=hash_password(password),
                role=UserRole.member,
            )
            db.add(user)
            db.flush()

            member = Member(
                user_id=user.id,
                membership_type=membership_type,
                status=status,
                join_date=join_date,
                expiry_date=expiry_date,
                phone=(payload.get("phone") or "").strip() or None,
                emergency_contact=(payload.get("emergency_contact") or "").strip() or None,
                emergency_phone=(payload.get("emergency_phone") or "").strip() or None,
                notes=(payload.get("notes") or "").strip() or None,
            )
            db.add(member)
            db.flush()
            member = (
                db.query(Member)
                .options(joinedload(Member.user), joinedload(Member.session_bookings), joinedload(Member.payments))
                .filter(Member.id == member.id)
                .first()
            )
            return created_payload(message="Member created.", member=serialize_member(member))

    @app.get("/api/members/<int:member_id>")
    @auth_required("member", "staff")
    def get_member(member_id: int):
        access_error = ensure_member_access(member_id)
        if access_error:
            return access_error

        with session_scope() as db:
            member = (
                db.query(Member)
                .options(
                    joinedload(Member.user),
                    joinedload(Member.session_bookings).joinedload(SessionBooking.session).joinedload(TrainingSession.trainer).joinedload(Staff.user),
                    joinedload(Member.payments),
                )
                .filter(Member.id == member_id)
                .first()
            )
            if not member:
                return json_error("Member not found.", 404)

            return success_payload(
                member=serialize_member(member),
                bookings=[serialize_booking(booking) for booking in member.session_bookings],
                payments=[serialize_payment(payment) for payment in member.payments],
            )

    @app.patch("/api/members/<int:member_id>")
    @auth_required("member", "staff")
    def update_member(member_id: int):
        access_error = ensure_staff_or_same_member(member_id)
        if access_error:
            return access_error

        payload = request.get_json(silent=True) or {}
        identity = current_identity()
        if is_member(identity):
            restricted_fields = {"membership_type", "status", "join_date", "expiry_date"}
            attempted_restricted_fields = sorted(restricted_fields.intersection(payload.keys()))
            if attempted_restricted_fields:
                return json_error(
                    "Members cannot change restricted account fields: "
                    + ", ".join(attempted_restricted_fields)
                    + ".",
                    403,
                )

        with session_scope() as db:
            member = (
                db.query(Member)
                .options(joinedload(Member.user), joinedload(Member.session_bookings), joinedload(Member.payments))
                .filter(Member.id == member_id)
                .first()
            )
            if not member:
                return json_error("Member not found.", 404)

            try:
                if "name" in payload:
                    member.user.name = (payload.get("name") or "").strip() or member.user.name
                if "email" in payload:
                    email = (payload.get("email") or "").strip().lower()
                    if email and email != member.user.email:
                        duplicate = db.query(User).filter(User.email.ilike(email), User.id != member.user.id).first()
                        if duplicate:
                            return json_error("A user with that email already exists.", 409)
                        member.user.email = email
                if "password" in payload:
                    password = payload.get("password") or ""
                    if not password:
                        return json_error("password cannot be blank.")
                    member.user.password_hash = hash_password(password)
                if "membership_type" in payload:
                    member.membership_type = parse_enum(MembershipType, payload.get("membership_type"), "membership_type")
                if "status" in payload:
                    member.status = parse_enum(MemberStatus, payload.get("status"), "status")
                if "join_date" in payload:
                    member.join_date = parse_date(payload.get("join_date"), "join_date")
                if "expiry_date" in payload:
                    member.expiry_date = parse_date(payload.get("expiry_date"), "expiry_date")
            except ValueError as exc:
                return json_error(str(exc))

            if member.expiry_date <= member.join_date:
                return json_error("expiry_date must be after join_date.")

            if "phone" in payload:
                member.phone = (payload.get("phone") or "").strip() or None
            if "emergency_contact" in payload:
                member.emergency_contact = (payload.get("emergency_contact") or "").strip() or None
            if "emergency_phone" in payload:
                member.emergency_phone = (payload.get("emergency_phone") or "").strip() or None
            if "notes" in payload:
                member.notes = (payload.get("notes") or "").strip() or None

            db.flush()
            return success_payload(message="Member updated.", member=serialize_member(member))

    @app.delete("/api/members/<int:member_id>")
    @auth_required("staff")
    def delete_member(member_id: int):
        force_delete = request.args.get("force", "").lower() == "true"
        with session_scope() as db:
            member = (
                db.query(Member)
                .options(joinedload(Member.user), joinedload(Member.session_bookings), joinedload(Member.payments))
                .filter(Member.id == member_id)
                .first()
            )
            if not member:
                return json_error("Member not found.", 404)

            active_bookings = [booking for booking in member.session_bookings if booking.status == SessionBookingStatus.booked]
            outstanding_payments = [
                payment for payment in member.payments if payment.status in {PaymentStatus.pending, PaymentStatus.overdue}
            ]
            if (active_bookings or outstanding_payments) and not force_delete:
                return json_error(
                    "Member has active bookings or outstanding payments. Retry with ?force=true to delete anyway.",
                    409,
                )

            user = member.user
            db.delete(member)
            if user is not None:
                db.delete(user)
            return success_payload(message="Member deleted.")

    @app.get("/api/sessions")
    @auth_required("member", "staff")
    def list_sessions():
        member_id = request.args.get("member_id", type=int)
        trainer_id = request.args.get("trainer_id", type=int)
        search = (request.args.get("q") or "").strip()
        identity = current_identity()

        if is_member(identity):
            member_id = identity["member_id"]

        with session_scope() as db:
            query = (
                db.query(TrainingSession)
                .options(
                    joinedload(TrainingSession.trainer).joinedload(Staff.user),
                    joinedload(TrainingSession.bookings),
                )
                .order_by(TrainingSession.date, TrainingSession.start_time, TrainingSession.id)
            )

            if trainer_id:
                query = query.filter(TrainingSession.trainer_id == trainer_id)
            if search:
                like_pattern = f"%{search}%"
                query = query.filter(or_(TrainingSession.title.ilike(like_pattern), TrainingSession.room.ilike(like_pattern)))

            return success_payload(
                **paginate_query(query, lambda session: serialize_session(session, member_id=member_id))
            )

    @app.post("/api/sessions")
    @auth_required("staff")
    def create_session():
        payload = request.get_json(silent=True) or {}
        try:
            title = (payload.get("title") or "").strip()
            room = (payload.get("room") or "").strip()
            description = (payload.get("description") or "").strip() or None
            trainer_id = int(payload.get("trainer_id"))
            capacity = int(payload.get("capacity"))
            session_date = parse_date(payload.get("date"), "date")
            start_time = parse_time(payload.get("start_time"), "start_time")
            end_time = parse_time(payload.get("end_time"), "end_time")
        except (TypeError, ValueError) as exc:
            return json_error(str(exc))

        if not title or not room:
            return json_error("title and room are required.")
        if capacity <= 0:
            return json_error("capacity must be greater than 0.")
        if end_time <= start_time:
            return json_error("end_time must be later than start_time.")

        with session_scope() as db:
            trainer = db.query(Staff).options(joinedload(Staff.user)).filter(Staff.id == trainer_id).first()
            if not trainer:
                return json_error("Trainer not found.", 404)
            if trainer_has_schedule_conflict(
                db,
                trainer_id=trainer_id,
                session_date=session_date,
                start_time_value=start_time,
                end_time_value=end_time,
            ):
                return json_error("Trainer already has another session during that time.", 409)

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
            db.refresh(session)
            session = (
                db.query(TrainingSession)
                .options(joinedload(TrainingSession.trainer).joinedload(Staff.user), joinedload(TrainingSession.bookings))
                .filter(TrainingSession.id == session.id)
                .first()
            )
            return created_payload(message="Session created.", session=serialize_session(session))

    @app.patch("/api/sessions/<int:session_id>")
    @auth_required("staff")
    def update_session(session_id: int):
        payload = request.get_json(silent=True) or {}

        with session_scope() as db:
            session = (
                db.query(TrainingSession)
                .options(joinedload(TrainingSession.trainer).joinedload(Staff.user), joinedload(TrainingSession.bookings))
                .filter(TrainingSession.id == session_id)
                .first()
            )
            if not session:
                return json_error("Session not found.", 404)

            try:
                if "title" in payload:
                    session.title = (payload.get("title") or "").strip() or session.title
                if "room" in payload:
                    session.room = (payload.get("room") or "").strip() or session.room
                if "description" in payload:
                    session.description = (payload.get("description") or "").strip() or None
                if "trainer_id" in payload:
                    trainer = db.query(Staff).filter(Staff.id == int(payload["trainer_id"])).first()
                    if not trainer:
                        return json_error("Trainer not found.", 404)
                    session.trainer_id = trainer.id
                if "date" in payload:
                    session.date = parse_date(payload["date"], "date")
                if "start_time" in payload:
                    session.start_time = parse_time(payload["start_time"], "start_time")
                if "end_time" in payload:
                    session.end_time = parse_time(payload["end_time"], "end_time")
                if "capacity" in payload:
                    capacity = int(payload["capacity"])
                    if capacity <= 0:
                        return json_error("capacity must be greater than 0.")
                    if capacity < len(active_bookings_for_session(session)):
                        return json_error("capacity cannot be lower than the number of active bookings.")
                    session.capacity = capacity
            except (TypeError, ValueError) as exc:
                return json_error(str(exc))

            if session.end_time <= session.start_time:
                return json_error("end_time must be later than start_time.")
            if trainer_has_schedule_conflict(
                db,
                trainer_id=session.trainer_id,
                session_date=session.date,
                start_time_value=session.start_time,
                end_time_value=session.end_time,
                exclude_session_id=session.id,
            ):
                return json_error("Trainer already has another session during that time.", 409)

            db.flush()
            return success_payload(message="Session updated.", session=serialize_session(session))

    @app.delete("/api/sessions/<int:session_id>")
    @auth_required("staff")
    def delete_session(session_id: int):
        force_delete = request.args.get("force", "").lower() == "true"
        with session_scope() as db:
            session = (
                db.query(TrainingSession)
                .options(joinedload(TrainingSession.bookings))
                .filter(TrainingSession.id == session_id)
                .first()
            )
            if not session:
                return json_error("Session not found.", 404)
            if active_bookings_for_session(session) and not force_delete:
                return json_error(
                    "Session has active bookings. Retry with ?force=true to delete it and its bookings.",
                    409,
                )

            db.delete(session)
            return success_payload(message="Session deleted.")

    @app.post("/api/sessions/<int:session_id>/book")
    @auth_required("member", "staff")
    def book_session(session_id: int):
        payload = request.get_json(silent=True) or {}
        identity = current_identity()
        member_id = payload.get("member_id")

        if is_member(identity):
            member_id = identity["member_id"]
        elif member_id is None:
            return json_error("member_id is required.")

        with session_scope() as db:
            session = (
                db.query(TrainingSession)
                .options(
                    joinedload(TrainingSession.trainer).joinedload(Staff.user),
                    joinedload(TrainingSession.bookings),
                )
                .filter(TrainingSession.id == session_id)
                .first()
            )
            if not session:
                return json_error("Session not found.", 404)

            member = (
                db.query(Member)
                .options(joinedload(Member.user))
                .filter(Member.id == int(member_id))
                .first()
            )
            if not member:
                return json_error("Member not found.", 404)
            if member.status != MemberStatus.active:
                return json_error("Only active members can book sessions.", 403)
            if datetime.combine(session.date, session.start_time) <= datetime.now():
                return json_error("Cannot book a session that has already started.", 409)
            if member_has_booking_conflict(
                db,
                member_id=member.id,
                session_date=session.date,
                start_time_value=session.start_time,
                end_time_value=session.end_time,
                exclude_session_id=session.id,
            ):
                return json_error("Member already has another booked session during that time.", 409)

            existing_booking = (
                db.query(SessionBooking)
                .options(
                    joinedload(SessionBooking.member).joinedload(Member.user),
                    joinedload(SessionBooking.session).joinedload(TrainingSession.trainer).joinedload(Staff.user),
                )
                .filter(SessionBooking.member_id == member.id, SessionBooking.session_id == session.id)
                .first()
            )

            active_count = len(active_bookings_for_session(session))
            if existing_booking and existing_booking.status == SessionBookingStatus.booked:
                return json_error("Member is already booked into this session.")

            if not existing_booking and active_count >= session.capacity:
                return json_error("Session is already full.", 409)

            if existing_booking:
                existing_booking.status = SessionBookingStatus.booked
                booking = existing_booking
            else:
                booking = SessionBooking(
                    member_id=member.id,
                    session_id=session.id,
                    status=SessionBookingStatus.booked,
                )
                db.add(booking)
                db.flush()

            db.expire_all()
            booking = (
                db.query(SessionBooking)
                .options(
                    joinedload(SessionBooking.member).joinedload(Member.user),
                    joinedload(SessionBooking.session).joinedload(TrainingSession.trainer).joinedload(Staff.user),
                    joinedload(SessionBooking.session).joinedload(TrainingSession.bookings),
                )
                .filter(SessionBooking.id == booking.id)
                .first()
            )
            return created_payload(message="Session booked.", booking=serialize_booking(booking))

    @app.get("/api/bookings")
    @auth_required("member", "staff")
    def list_bookings():
        member_id = request.args.get("member_id", type=int)
        status_filter = normalize_enum_value(request.args.get("status"))
        identity = current_identity()

        with session_scope() as db:
            query = (
                db.query(SessionBooking)
                .options(
                    joinedload(SessionBooking.member).joinedload(Member.user),
                    joinedload(SessionBooking.session).joinedload(TrainingSession.trainer).joinedload(Staff.user),
                    joinedload(SessionBooking.session).joinedload(TrainingSession.bookings),
                )
                .order_by(SessionBooking.id)
            )

            if is_member(identity):
                member_id = identity["member_id"]
            if member_id:
                query = query.filter(SessionBooking.member_id == member_id)
            if status_filter:
                try:
                    query = query.filter(
                        SessionBooking.status
                        == parse_enum(SessionBookingStatus, status_filter, "status")
                    )
                except ValueError as exc:
                    return json_error(str(exc))

            return success_payload(**paginate_query(query, serialize_booking))

    @app.post("/api/bookings/<int:booking_id>/cancel")
    @auth_required("member", "staff")
    def cancel_booking(booking_id: int):
        identity = current_identity()
        with session_scope() as db:
            booking = (
                db.query(SessionBooking)
                .options(
                    joinedload(SessionBooking.member).joinedload(Member.user),
                    joinedload(SessionBooking.session).joinedload(TrainingSession.trainer).joinedload(Staff.user),
                    joinedload(SessionBooking.session).joinedload(TrainingSession.bookings),
                )
                .filter(SessionBooking.id == booking_id)
                .first()
            )
            if not booking:
                return json_error("Booking not found.", 404)
            if is_member(identity) and booking.member_id != identity["member_id"]:
                return json_error("Members can only cancel their own bookings.", 403)

            if booking.status == SessionBookingStatus.cancelled:
                return json_error("Booking is already cancelled.")

            booking.status = SessionBookingStatus.cancelled
            return success_payload(message="Booking cancelled.", booking=serialize_booking(booking))

    @app.get("/api/tickets")
    @auth_required("staff")
    def list_tickets():
        status_filter = normalize_enum_value(request.args.get("status"))
        urgency_filter = normalize_enum_value(request.args.get("urgency"))
        staff_id = request.args.get("staff_id", type=int)

        with session_scope() as db:
            query = (
                db.query(Ticket)
                .options(joinedload(Ticket.staff).joinedload(Staff.user))
                .order_by(Ticket.created_at.desc(), Ticket.id.desc())
            )
            try:
                if status_filter:
                    query = query.filter(Ticket.status == parse_enum(TicketStatus, status_filter, "status"))
                if urgency_filter:
                    query = query.filter(Ticket.urgency == parse_enum(TicketUrgency, urgency_filter, "urgency"))
            except ValueError as exc:
                return json_error(str(exc))
            if staff_id:
                query = query.filter(Ticket.staff_id == staff_id)

            return success_payload(**paginate_query(query, serialize_ticket))

    @app.post("/api/tickets")
    @auth_required("staff")
    def create_ticket():
        payload = request.get_json(silent=True) or {}
        try:
            identity = current_identity()
            staff_id = int(payload.get("staff_id") or identity["staff_id"])
            subject = (payload.get("subject") or "").strip()
            description = (payload.get("description") or "").strip()
            urgency = parse_enum(TicketUrgency, payload.get("urgency") or "medium", "urgency")
            status = parse_enum(TicketStatus, payload.get("status") or "open", "status")
        except (TypeError, ValueError) as exc:
            return json_error(str(exc))

        if not subject or not description:
            return json_error("subject and description are required.")

        with session_scope() as db:
            staff = db.query(Staff).options(joinedload(Staff.user)).filter(Staff.id == staff_id).first()
            if not staff:
                return json_error("Staff member not found.", 404)

            ticket = Ticket(
                staff_id=staff_id,
                subject=subject,
                description=description,
                urgency=urgency,
                status=status,
            )
            db.add(ticket)
            db.flush()
            ticket = (
                db.query(Ticket)
                .options(joinedload(Ticket.staff).joinedload(Staff.user))
                .filter(Ticket.id == ticket.id)
                .first()
            )
            return created_payload(message="Ticket created.", ticket=serialize_ticket(ticket))

    @app.patch("/api/tickets/<int:ticket_id>")
    @auth_required("staff")
    def update_ticket(ticket_id: int):
        payload = request.get_json(silent=True) or {}
        with session_scope() as db:
            ticket = (
                db.query(Ticket)
                .options(joinedload(Ticket.staff).joinedload(Staff.user))
                .filter(Ticket.id == ticket_id)
                .first()
            )
            if not ticket:
                return json_error("Ticket not found.", 404)

            try:
                if "subject" in payload:
                    ticket.subject = (payload.get("subject") or "").strip() or ticket.subject
                if "description" in payload:
                    ticket.description = (payload.get("description") or "").strip() or ticket.description
                if "status" in payload:
                    ticket.status = parse_enum(TicketStatus, payload.get("status"), "status")
                if "urgency" in payload:
                    ticket.urgency = parse_enum(TicketUrgency, payload.get("urgency"), "urgency")
            except ValueError as exc:
                return json_error(str(exc))

            db.flush()
            return success_payload(message="Ticket updated.", ticket=serialize_ticket(ticket))

    @app.get("/api/maintenance")
    @auth_required("staff")
    def list_maintenance():
        status_filter = normalize_enum_value(request.args.get("status"))
        staff_id = request.args.get("staff_id", type=int)

        with session_scope() as db:
            query = (
                db.query(MaintenanceLog)
                .options(joinedload(MaintenanceLog.staff).joinedload(Staff.user))
                .order_by(MaintenanceLog.log_date.desc(), MaintenanceLog.id.desc())
            )
            if status_filter:
                try:
                    query = query.filter(
                        MaintenanceLog.status == parse_enum(MaintenanceStatus, status_filter, "status")
                    )
                except ValueError as exc:
                    return json_error(str(exc))
            if staff_id:
                query = query.filter(MaintenanceLog.staff_id == staff_id)

            return success_payload(**paginate_query(query, serialize_maintenance))

    @app.post("/api/maintenance")
    @auth_required("staff")
    def create_maintenance():
        payload = request.get_json(silent=True) or {}
        try:
            identity = current_identity()
            staff_id = int(payload.get("staff_id") or identity["staff_id"])
            area = (payload.get("area") or "").strip()
            description = (payload.get("description") or "").strip()
            status = parse_enum(MaintenanceStatus, payload.get("status") or "open", "status")
            log_date = parse_date(payload.get("log_date") or date.today().isoformat(), "log_date")
        except (TypeError, ValueError) as exc:
            return json_error(str(exc))

        if not area or not description:
            return json_error("area and description are required.")

        with session_scope() as db:
            staff = db.query(Staff).options(joinedload(Staff.user)).filter(Staff.id == staff_id).first()
            if not staff:
                return json_error("Staff member not found.", 404)

            item = MaintenanceLog(
                staff_id=staff_id,
                area=area,
                description=description,
                status=status,
                log_date=log_date,
            )
            db.add(item)
            db.flush()
            item = (
                db.query(MaintenanceLog)
                .options(joinedload(MaintenanceLog.staff).joinedload(Staff.user))
                .filter(MaintenanceLog.id == item.id)
                .first()
            )
            return created_payload(
                message="Maintenance log created.",
                maintenance=serialize_maintenance(item),
            )

    @app.patch("/api/maintenance/<int:maintenance_id>")
    @auth_required("staff")
    def update_maintenance(maintenance_id: int):
        payload = request.get_json(silent=True) or {}
        with session_scope() as db:
            item = (
                db.query(MaintenanceLog)
                .options(joinedload(MaintenanceLog.staff).joinedload(Staff.user))
                .filter(MaintenanceLog.id == maintenance_id)
                .first()
            )
            if not item:
                return json_error("Maintenance log not found.", 404)

            try:
                if "staff_id" in payload:
                    staff = db.query(Staff).filter(Staff.id == int(payload["staff_id"])).first()
                    if not staff:
                        return json_error("Staff member not found.", 404)
                    item.staff_id = staff.id
                if "status" in payload:
                    item.status = parse_enum(MaintenanceStatus, payload.get("status"), "status")
                if "log_date" in payload:
                    item.log_date = parse_date(payload.get("log_date"), "log_date")
            except (TypeError, ValueError) as exc:
                return json_error(str(exc))

            if "area" in payload:
                item.area = (payload.get("area") or "").strip() or item.area
            if "description" in payload:
                item.description = (payload.get("description") or "").strip() or item.description

            db.flush()
            return success_payload(
                message="Maintenance log updated.",
                maintenance=serialize_maintenance(item),
            )

    @app.get("/api/payments")
    @auth_required("member", "staff")
    def list_payments():
        member_id = request.args.get("member_id", type=int)
        status_filter = normalize_enum_value(request.args.get("status"))
        identity = current_identity()

        with session_scope() as db:
            query = (
                db.query(Payment)
                .options(joinedload(Payment.member).joinedload(Member.user))
                .order_by(Payment.due_date.desc(), Payment.id.desc())
            )
            if is_member(identity):
                member_id = identity["member_id"]
            if member_id:
                query = query.filter(Payment.member_id == member_id)
            if status_filter:
                try:
                    query = query.filter(Payment.status == parse_enum(PaymentStatus, status_filter, "status"))
                except ValueError as exc:
                    return json_error(str(exc))

            return success_payload(**paginate_query(query, serialize_payment))

    @app.post("/api/payments")
    @auth_required("staff")
    def create_payment():
        payload = request.get_json(silent=True) or {}
        try:
            member_id = int(payload.get("member_id"))
            amount = float(payload.get("amount"))
            due_date = parse_date(payload.get("due_date"), "due_date")
            status = parse_enum(PaymentStatus, payload.get("status") or "pending", "status")
            paid_at = None
            if payload.get("paid_at"):
                paid_at = parse_datetime(payload.get("paid_at"), "paid_at")
        except (TypeError, ValueError) as exc:
            return json_error(str(exc))

        if amount <= 0:
            return json_error("amount must be greater than 0.")

        with session_scope() as db:
            member = db.query(Member).options(joinedload(Member.user)).filter(Member.id == member_id).first()
            if not member:
                return json_error("Member not found.", 404)

            payment = Payment(
                member_id=member_id,
                amount=amount,
                due_date=due_date,
                status=status,
                note=(payload.get("note") or "").strip() or None,
                paid_at=paid_at if status == PaymentStatus.paid else None,
            )
            db.add(payment)
            db.flush()
            payment = (
                db.query(Payment)
                .options(joinedload(Payment.member).joinedload(Member.user))
                .filter(Payment.id == payment.id)
                .first()
            )
            return created_payload(message="Payment created.", payment=serialize_payment(payment))

    @app.patch("/api/payments/<int:payment_id>")
    @auth_required("staff")
    def update_payment(payment_id: int):
        payload = request.get_json(silent=True) or {}
        with session_scope() as db:
            payment = (
                db.query(Payment)
                .options(joinedload(Payment.member).joinedload(Member.user))
                .filter(Payment.id == payment_id)
                .first()
            )
            if not payment:
                return json_error("Payment not found.", 404)

            try:
                if "member_id" in payload:
                    member = db.query(Member).filter(Member.id == int(payload["member_id"])).first()
                    if not member:
                        return json_error("Member not found.", 404)
                    payment.member_id = member.id
                if "amount" in payload:
                    amount = float(payload["amount"])
                    if amount <= 0:
                        return json_error("amount must be greater than 0.")
                    payment.amount = amount
                if "due_date" in payload:
                    payment.due_date = parse_date(payload.get("due_date"), "due_date")
                if "status" in payload:
                    payment.status = parse_enum(PaymentStatus, payload.get("status"), "status")
                if "paid_at" in payload:
                    payment.paid_at = parse_datetime(payload.get("paid_at"), "paid_at") if payload.get("paid_at") else None
            except (TypeError, ValueError) as exc:
                return json_error(str(exc))

            if "note" in payload:
                payment.note = (payload.get("note") or "").strip() or None

            if payment.status == PaymentStatus.paid and payment.paid_at is None:
                payment.paid_at = datetime.now(UTC).replace(tzinfo=None)
            if payment.status != PaymentStatus.paid:
                payment.paid_at = None

            db.flush()
            return success_payload(message="Payment updated.", payment=serialize_payment(payment))

    @app.get("/api/dashboard/member/<int:member_id>")
    @auth_required("member", "staff")
    def member_dashboard(member_id: int):
        access_error = ensure_member_access(member_id)
        if access_error:
            return access_error

        with session_scope() as db:
            member = (
                db.query(Member)
                .options(
                    joinedload(Member.user),
                    joinedload(Member.session_bookings).joinedload(SessionBooking.session).joinedload(TrainingSession.trainer).joinedload(Staff.user),
                    joinedload(Member.session_bookings).joinedload(SessionBooking.session).joinedload(TrainingSession.bookings),
                    joinedload(Member.payments),
                )
                .filter(Member.id == member_id)
                .first()
            )
            if not member:
                return json_error("Member not found.", 404)

            active_bookings = [booking for booking in member.session_bookings if booking.status == SessionBookingStatus.booked]
            upcoming = sorted(active_bookings, key=lambda booking: (booking.session.date, booking.session.start_time))
            return success_payload(
                member=serialize_member(member),
                stats={
                    "booked_classes": len(active_bookings),
                    "payments_due": len(
                        [payment for payment in member.payments if payment.status != PaymentStatus.paid]
                    ),
                },
                upcoming_bookings=[serialize_booking(booking) for booking in upcoming],
            )

    @app.get("/api/dashboard/staff")
    @auth_required("staff")
    def staff_dashboard():
        with session_scope() as db:
            members = db.query(Member).all()
            sessions = (
                db.query(TrainingSession)
                .options(joinedload(TrainingSession.bookings))
                .all()
            )
            tickets = db.query(Ticket).all()
            maintenance_items = db.query(MaintenanceLog).all()
            payments = db.query(Payment).all()

            return success_payload(
                stats={
                    "total_members": len(members),
                    "active_members": len([member for member in members if member.status == MemberStatus.active]),
                    "expired_members": len([member for member in members if member.status == MemberStatus.expired]),
                    "total_sessions": len(sessions),
                    "total_bookings": sum(
                        len([booking for booking in session.bookings if booking.status == SessionBookingStatus.booked])
                        for session in sessions
                    ),
                    "open_tickets": len([ticket for ticket in tickets if ticket.status != TicketStatus.closed]),
                    "open_maintenance": len(
                        [item for item in maintenance_items if item.status != MaintenanceStatus.completed]
                    ),
                    "payments_overdue": len(
                        [payment for payment in payments if payment.status == PaymentStatus.overdue]
                    ),
                    "payments_pending": len(
                        [payment for payment in payments if payment.status == PaymentStatus.pending]
                    ),
                    "monthly_revenue_collected": round(
                        sum(payment.amount for payment in payments if payment.status == PaymentStatus.paid),
                        2,
                    ),
                }
            )

    return app


app = create_app()


if __name__ == "__main__":
    app.run(
        debug=True,
        host="0.0.0.0",
        port=int(os.getenv("FITOPS_PORT", "5000")),
    )
