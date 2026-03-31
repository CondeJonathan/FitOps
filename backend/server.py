import os
from datetime import date, datetime, timedelta

from flask import Flask, jsonify, request
from flask_cors import CORS
from sqlalchemy import func
from werkzeug.security import check_password_hash, generate_password_hash

from backend.db.database import SessionLocal, init_db
from backend.db.models import (
    MaintenanceLog,
    MaintenanceStatus,
    Member,
    MembershipAuditLog,
    Payment,
    PaymentStatus,
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


def create_app() -> Flask:
    app = Flask(__name__)
    CORS(app)
    init_db()

    def json_body():
        return request.get_json(silent=True) or {}

    def normalize_email(value):
        return (value or "").strip().lower()

    def is_staff_domain(email: str) -> bool:
        return email.endswith("@fitops.com")

    def verify_password(stored_hash: str, provided_password: str) -> bool:
     
        return check_password_hash(stored_hash, provided_password) or stored_hash == provided_password

    def parse_priority(value: str) -> TicketUrgency:
        normalized = (value or "").strip().lower()
        if normalized in {urgency.value for urgency in TicketUrgency}:
            return TicketUrgency(normalized)
        return TicketUrgency.medium

    def parse_ticket_status(value: str) -> TicketStatus:
        normalized = (value or "").strip().lower().replace(" ", "_")
        alias = {"in_progress": "processing"}
        normalized = alias.get(normalized, normalized)
        if normalized in {status.value for status in TicketStatus}:
            return TicketStatus(normalized)
        return TicketStatus.open

    def parse_maintenance_status(value: str) -> MaintenanceStatus:
        normalized = (value or "").strip().lower().replace(" ", "_")
        alias = {"done": "completed"}
        normalized = alias.get(normalized, normalized)
        if normalized in {status.value for status in MaintenanceStatus}:
            return MaintenanceStatus(normalized)
        return MaintenanceStatus.open

    def ticket_status_label(value: TicketStatus) -> str:
        return {"open": "Open", "processing": "In Progress", "closed": "Closed"}[value.value]

    def maintenance_status_label(value: MaintenanceStatus) -> str:
        return {"open": "Pending", "in_progress": "In Progress", "completed": "Done"}[value.value]

    def member_status_label(value: MemberStatus) -> str:
        return {"active": "Active", "expired": "Expired", "suspended": "Suspended"}[value.value]

    def membership_type_label(value: MembershipType) -> str:
        return value.value.capitalize()

    def parse_member_status(value: str, fallback: MemberStatus) -> MemberStatus:
        normalized = (value or "").strip().lower()
        alias = {"inactive": "expired"}
        normalized = alias.get(normalized, normalized)
        if normalized in {status.value for status in MemberStatus}:
            return MemberStatus(normalized)
        return fallback

    def parse_membership_type(value: str, fallback: MembershipType) -> MembershipType:
        normalized = (value or "").strip().lower()
        if normalized in {membership.value for membership in MembershipType}:
            return MembershipType(normalized)
        return fallback

    def payment_status_label(value: PaymentStatus | None) -> str:
        if value is None:
            return "N/A"
        return value.value.capitalize()

    def perks_for_plan(plan: MembershipType) -> list[str]:
        perk_map = {
            MembershipType.basic: ["Gym access", "Standard locker access"],
            MembershipType.standard: ["Gym access", "Group classes", "Locker + towel service"],
            MembershipType.premium: ["Gym access", "Unlimited classes", "Sauna access", "Priority booking", "Guest pass"],
        }
        return perk_map.get(plan, ["Gym access"])

    def serialize_class_session(db, session: TrainingSession, member_id: int | None = None):
        enrolled = (
            db.query(func.count(SessionBooking.id))
            .filter(
                SessionBooking.session_id == session.id,
                SessionBooking.status == SessionBookingStatus.booked,
            )
            .scalar()
            or 0
        )
        joined = False
        if member_id:
            joined = (
                db.query(SessionBooking.id)
                .filter(
                    SessionBooking.member_id == member_id,
                    SessionBooking.session_id == session.id,
                    SessionBooking.status == SessionBookingStatus.booked,
                )
                .first()
                is not None
            )

        trainer_name = session.trainer.user.name if session.trainer and session.trainer.user else "Staff"
        return {
            "id": session.id,
            "name": session.title,
            "trainer": trainer_name,
            "schedule": f"{session.date.strftime('%b %d')} {session.start_time.strftime('%I:%M %p').lstrip('0')}",
            "scheduleDate": session.date.isoformat(),
            "startTime": session.start_time.strftime("%H:%M"),
            "endTime": session.end_time.strftime("%H:%M"),
            "level": "All Levels",
            "capacity": session.capacity,
            "enrolled": int(enrolled),
            "joined": joined,
            "room": session.room,
            "description": session.description or "",
        }

    @app.get("/api/health")
    def health():
        return jsonify({"ok": True})

    @app.get("/")
    def index():
        return jsonify(
            {
                "ok": True,
                "routes": ["/api/health", "/api/register", "/api/login", "/api/staff/grant-role"],
            }
        )

    @app.post("/api/register")
    def register():
        data = json_body()
        name = (data.get("name") or "").strip()
        email = normalize_email(data.get("email"))
        password = data.get("password") or ""
        role_value = UserRole.staff.value if is_staff_domain(email) else UserRole.member.value

        if not name or not email or not password:
            return jsonify({"success": False, "message": "name, email, and password are required."}), 400

        db = SessionLocal()
        try:
            existing = db.query(User).filter(User.email == email).first()
            if existing:
                return jsonify({"success": False, "message": "Email is already registered."}), 409

            user = User(
                name=name,
                email=email,
                password_hash=generate_password_hash(password),
                role=UserRole(role_value),
            )
            db.add(user)
            db.flush()

            if user.role == UserRole.member:
                db.add(
                    Member(
                        user_id=user.id,
                        membership_type=MembershipType.basic,
                        status=MemberStatus.active,
                        join_date=date.today(),
                        expiry_date=date.today(),
                        phone="",
                        emergency_contact="",
                        emergency_phone="",
                        notes=None,
                    )
                )
            else:
                db.add(Staff(user_id=user.id, position=StaffPosition.admin))

            db.commit()
            return jsonify(
                {
                    "success": True,
                    "role": user.role.value,
                    "name": user.name,
                    "email": user.email,
                    "position": None,
                }
            )
        finally:
            db.close()

    @app.post("/api/login")
    def login():
        data = json_body()
        email = normalize_email(data.get("email"))
        password = data.get("password") or ""

        if not email or not password:
            return jsonify({"success": False, "message": "email and password are required."}), 400

        db = SessionLocal()
        try:
            user = db.query(User).filter(User.email == email).first()
            if not user:
                return jsonify({"success": False, "message": "Invalid email or password."}), 401
            if not verify_password(user.password_hash, password):
                return jsonify({"success": False, "message": "Invalid email or password."}), 401
            position = user.staff.position.value if user.role == UserRole.staff and user.staff else None
            resolved_role = UserRole.staff.value if is_staff_domain(user.email) else user.role.value
            return jsonify(
                {
                    "success": True,
                    "role": resolved_role,
                    "name": user.name,
                    "email": user.email,
                    "position": position,
                }
            )
        finally:
            db.close()

    @app.get("/api/classes")
    def get_classes():
        email = normalize_email(request.args.get("email"))
        db = SessionLocal()
        try:
            member_id = None
            if email:
                user = db.query(User).filter(User.email == email).first()
                if user and user.member:
                    member_id = user.member.id

            sessions = db.query(TrainingSession).order_by(TrainingSession.date.asc(), TrainingSession.start_time.asc()).all()
            return jsonify({"success": True, "classes": [serialize_class_session(db, session, member_id) for session in sessions]})
        finally:
            db.close()

    @app.get("/api/member/dashboard")
    def get_member_dashboard():
        email = normalize_email(request.args.get("email"))
        if not email:
            return jsonify({"success": False, "message": "email is required."}), 400

        db = SessionLocal()
        try:
            user = db.query(User).filter(User.email == email).first()
            if not user or not user.member:
                return jsonify({"success": False, "message": "Member not found."}), 404

            member = user.member
            payments = (
                db.query(Payment)
                .filter(Payment.member_id == member.id)
                .order_by(Payment.due_date.desc())
                .all()
            )

            perks = []
            if member.notes:
                perks = [item.strip() for item in member.notes.split("|") if item.strip()]

            payment_rows = []
            for payment in payments:
                amount = f"${payment.amount:,.2f}"
                if payment.note:
                    label = payment.note
                elif payment.status == PaymentStatus.pending:
                    label = "Upcoming Membership Charge"
                else:
                    label = "Membership Charge"
                payment_rows.append(
                    {
                        "id": payment.id,
                        "amount": amount,
                        "date": payment.due_date.strftime("%b %d"),
                        "label": label,
                        "status": payment.status.value,
                    }
                )

            upcoming_charge = next((item for item in payment_rows if item["status"] == PaymentStatus.pending.value), None)
            if upcoming_charge is None and payment_rows:
                upcoming_charge = payment_rows[0]

            previous_charges = [item for item in payment_rows if upcoming_charge is None or item["id"] != upcoming_charge["id"]]

            return jsonify(
                {
                    "success": True,
                    "memberStatus": member.status.value.capitalize(),
                    "membershipType": member.membership_type.value.capitalize(),
                    "perks": perks,
                    "upcomingCharge": upcoming_charge,
                    "previousCharges": previous_charges[:10],
                }
            )
        finally:
            db.close()

    @app.post("/api/classes/<int:session_id>/toggle-booking")
    def toggle_class_booking(session_id: int):
        data = json_body()
        email = normalize_email(data.get("email"))
        if not email:
            return jsonify({"success": False, "message": "email is required."}), 400

        db = SessionLocal()
        try:
            user = db.query(User).filter(User.email == email).first()
            if not user or not user.member:
                return jsonify({"success": False, "message": "Only members can book classes."}), 403
            session = db.query(TrainingSession).filter(TrainingSession.id == session_id).first()
            if not session:
                return jsonify({"success": False, "message": "Class not found."}), 404

            booking = (
                db.query(SessionBooking)
                .filter(SessionBooking.member_id == user.member.id, SessionBooking.session_id == session.id)
                .first()
            )
            if booking and booking.status == SessionBookingStatus.booked:
                booking.status = SessionBookingStatus.cancelled
                db.commit()
                return jsonify({"success": True, "action": "dropped", "class": serialize_class_session(db, session, user.member.id)})

            enrolled = (
                db.query(func.count(SessionBooking.id))
                .filter(SessionBooking.session_id == session.id, SessionBooking.status == SessionBookingStatus.booked)
                .scalar()
                or 0
            )
            if enrolled >= session.capacity:
                return jsonify({"success": False, "message": "This class is currently full."}), 409

            if booking:
                booking.status = SessionBookingStatus.booked
            else:
                db.add(SessionBooking(member_id=user.member.id, session_id=session.id, status=SessionBookingStatus.booked))
            db.commit()
            return jsonify({"success": True, "action": "joined", "class": serialize_class_session(db, session, user.member.id)})
        finally:
            db.close()

    @app.get("/api/staff/dashboard")
    def get_staff_dashboard():
        db = SessionLocal()
        try:
            sessions = db.query(TrainingSession).order_by(TrainingSession.date.asc(), TrainingSession.start_time.asc()).all()
            tickets = db.query(Ticket).order_by(Ticket.updated_at.desc()).all()
            maintenance = db.query(MaintenanceLog).order_by(MaintenanceLog.log_date.desc(), MaintenanceLog.id.desc()).all()
            staff_rows = db.query(Staff).all()
            members = db.query(Member).join(User).order_by(User.name.asc()).all()
            membership_audits = db.query(MembershipAuditLog).order_by(MembershipAuditLog.created_at.desc()).limit(200).all()

            class_rows = []
            for session in sessions:
                booked_names = [
                    booking.member.user.name
                    for booking in session.bookings
                    if booking.status == SessionBookingStatus.booked and booking.member and booking.member.user
                ]
                class_rows.append(
                    {
                        "id": f"c{session.id}",
                        "name": session.title,
                        "trainer": session.trainer.user.name if session.trainer and session.trainer.user else "Staff",
                        "schedule": f"{session.date.strftime('%b %d')} {session.start_time.strftime('%I:%M %p').lstrip('0')}",
                        "members": booked_names,
                        "capacity": session.capacity,
                    }
                )

            shift_rows = [
                {
                    "day": session.date.strftime("%b %d"),
                    "shift": f"{session.start_time.strftime('%I:%M %p').lstrip('0')} - {session.end_time.strftime('%I:%M %p').lstrip('0')}",
                    "lead": session.trainer.user.name if session.trainer and session.trainer.user else "Staff",
                    "staff": ", ".join(sorted({row.user.name for row in staff_rows if row.user})) or "N/A",
                    "area": session.room,
                }
                for session in sessions
            ]

            ticket_rows = [
                {
                    "id": f"T-{ticket.id}",
                    "equipment": ticket.subject,
                    "location": "Facility",
                    "issue": ticket.description,
                    "priority": ticket.urgency.value.capitalize(),
                    "status": ticket_status_label(ticket.status),
                    "assignedTo": ticket.staff.user.name if ticket.staff and ticket.staff.user else "Unassigned",
                }
                for ticket in tickets
            ]

            maintenance_rows = [
                {
                    "id": f"M-{entry.id}",
                    "date": entry.log_date.isoformat(),
                    "staff": entry.staff.user.name if entry.staff and entry.staff.user else "Staff",
                    "task": f"{entry.area}: {entry.description}",
                    "status": maintenance_status_label(entry.status),
                }
                for entry in maintenance
            ]

            membership_rows = []
            for member in members:
                latest_payment = (
                    db.query(Payment)
                    .filter(Payment.member_id == member.id)
                    .order_by(Payment.due_date.desc(), Payment.id.desc())
                    .first()
                )
                perks = [item.strip() for item in (member.notes or "").split("|") if item.strip()]
                membership_rows.append(
                    {
                        "id": member.id,
                        "displayId": f"M-{member.id}",
                        "name": member.user.name if member.user else f"Member {member.id}",
                        "status": member.status.value,
                        "statusLabel": member_status_label(member.status),
                        "isActive": member.status == MemberStatus.active,
                        "planType": member.membership_type.value,
                        "planTypeLabel": membership_type_label(member.membership_type),
                        "paymentStatus": payment_status_label(latest_payment.status if latest_payment else None),
                        "perks": perks,
                    }
                )

            audit_rows = [
                {
                    "id": entry.id,
                    "memberId": entry.member_id,
                    "memberDisplayId": f"M-{entry.member_id}",
                    "memberName": entry.member.user.name if entry.member and entry.member.user else f"Member {entry.member_id}",
                    "staffName": entry.staff.user.name if entry.staff and entry.staff.user else "Staff",
                    "action": entry.action,
                    "oldStatus": member_status_label(entry.old_status),
                    "newStatus": member_status_label(entry.new_status),
                    "oldPlanType": membership_type_label(entry.old_membership_type),
                    "newPlanType": membership_type_label(entry.new_membership_type),
                    "note": entry.note or "",
                    "timestamp": entry.created_at.isoformat() if entry.created_at else "",
                }
                for entry in membership_audits
            ]

            active_member_count = sum(1 for member in membership_rows if member["isActive"])
            return jsonify(
                {
                    "success": True,
                    "classes": class_rows,
                    "schedule": shift_rows,
                    "tickets": ticket_rows,
                    "maintenance": maintenance_rows,
                    "memberships": membership_rows,
                    "membershipAudit": audit_rows,
                    "membershipSummary": {
                        "activeCount": active_member_count,
                        "inactiveCount": len(membership_rows) - active_member_count,
                        "totalCount": len(membership_rows),
                    },
                }
            )
        finally:
            db.close()

    @app.patch("/api/staff/memberships/<int:member_id>")
    def update_membership(member_id: int):
        data = json_body()
        requester_email = normalize_email(data.get("requesterEmail"))
        action = (data.get("action") or "").strip().lower()
        requested_status = (data.get("status") or "").strip()
        requested_plan = (data.get("planType") or "").strip()
        note = (data.get("note") or "").strip()

        if not requester_email:
            return jsonify({"success": False, "message": "requesterEmail is required."}), 400

        db = SessionLocal()
        try:
            requester = db.query(User).filter(User.email == requester_email).first()
            if not requester or not requester.staff:
                return jsonify({"success": False, "message": "Only staff users can update memberships."}), 403

            member = db.query(Member).filter(Member.id == member_id).first()
            if not member:
                return jsonify({"success": False, "message": "Member not found."}), 404

            old_status = member.status
            old_membership_type = member.membership_type
            new_status = old_status
            new_membership_type = old_membership_type

            if action == "renew":
                new_status = MemberStatus.active
                anchor_date = member.expiry_date or date.today()
                if anchor_date < date.today():
                    anchor_date = date.today()
                member.expiry_date = anchor_date + timedelta(days=30)
            elif action == "suspend":
                new_status = MemberStatus.suspended
            elif action == "upgrade":
                if old_membership_type == MembershipType.basic:
                    new_membership_type = MembershipType.standard
                elif old_membership_type == MembershipType.standard:
                    new_membership_type = MembershipType.premium
                new_status = MemberStatus.active
            elif action == "downgrade":
                if old_membership_type == MembershipType.premium:
                    new_membership_type = MembershipType.standard
                elif old_membership_type == MembershipType.standard:
                    new_membership_type = MembershipType.basic
                new_status = MemberStatus.active

            if requested_status:
                new_status = parse_member_status(requested_status, new_status)
            if requested_plan:
                new_membership_type = parse_membership_type(requested_plan, new_membership_type)

            member.status = new_status
            member.membership_type = new_membership_type
            member.notes = "|".join(perks_for_plan(new_membership_type))

            db.add(
                MembershipAuditLog(
                    member_id=member.id,
                    staff_id=requester.staff.id,
                    action=action or "update",
                    old_status=old_status,
                    new_status=new_status,
                    old_membership_type=old_membership_type,
                    new_membership_type=new_membership_type,
                    note=note or None,
                )
            )
            db.commit()
            return jsonify({"success": True})
        finally:
            db.close()

    @app.post("/api/staff/tickets")
    def create_staff_ticket():
        data = json_body()
        requester_email = normalize_email(data.get("requesterEmail"))
        equipment = (data.get("equipment") or "").strip()
        location = (data.get("location") or "").strip()
        issue = (data.get("issue") or "").strip()
        priority = parse_priority(data.get("priority"))

        if not requester_email or not equipment or not issue:
            return jsonify({"success": False, "message": "requesterEmail, equipment, and issue are required."}), 400

        db = SessionLocal()
        try:
            requester = db.query(User).filter(User.email == requester_email).first()
            if not requester or not requester.staff:
                return jsonify({"success": False, "message": "Only staff users can create tickets."}), 403

            subject = equipment if not location else f"{equipment} ({location})"
            ticket = Ticket(
                staff_id=requester.staff.id,
                subject=subject,
                description=issue,
                status=TicketStatus.open,
                urgency=priority,
            )
            db.add(ticket)
            db.commit()
            return jsonify({"success": True, "id": ticket.id})
        finally:
            db.close()

    @app.patch("/api/staff/tickets/<int:ticket_id>")
    def update_staff_ticket(ticket_id: int):
        data = json_body()
        next_status = parse_ticket_status(data.get("status"))
        db = SessionLocal()
        try:
            ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
            if not ticket:
                return jsonify({"success": False, "message": "Ticket not found."}), 404
            ticket.status = next_status
            db.commit()
            return jsonify({"success": True})
        finally:
            db.close()

    @app.post("/api/staff/maintenance")
    def create_maintenance_log():
        data = json_body()
        requester_email = normalize_email(data.get("requesterEmail"))
        task = (data.get("task") or "").strip()
        area = (data.get("area") or "Facility").strip()
        date_value = (data.get("date") or "").strip()
        status = parse_maintenance_status(data.get("status"))

        if not requester_email or not task:
            return jsonify({"success": False, "message": "requesterEmail and task are required."}), 400

        db = SessionLocal()
        try:
            requester = db.query(User).filter(User.email == requester_email).first()
            if not requester or not requester.staff:
                return jsonify({"success": False, "message": "Only staff users can add maintenance logs."}), 403

            log_date = date.today()
            if date_value:
                try:
                    log_date = datetime.strptime(date_value, "%Y-%m-%d").date()
                except ValueError:
                    return jsonify({"success": False, "message": "date must be YYYY-MM-DD."}), 400

            entry = MaintenanceLog(
                staff_id=requester.staff.id,
                area=area,
                description=task,
                status=status,
                log_date=log_date,
            )
            db.add(entry)
            db.commit()
            return jsonify({"success": True, "id": entry.id})
        finally:
            db.close()

    @app.patch("/api/staff/maintenance/<int:log_id>")
    def update_maintenance_log(log_id: int):
        data = json_body()
        next_status = parse_maintenance_status(data.get("status"))
        db = SessionLocal()
        try:
            entry = db.query(MaintenanceLog).filter(MaintenanceLog.id == log_id).first()
            if not entry:
                return jsonify({"success": False, "message": "Maintenance log not found."}), 404
            entry.status = next_status
            db.commit()
            return jsonify({"success": True})
        finally:
            db.close()

    @app.post("/api/staff/grant-role")
    def grant_staff_role():
        data = json_body()
        requester_email = normalize_email(data.get("requesterEmail"))
        requester_password = data.get("requesterPassword") or ""
        target_email = normalize_email(data.get("targetEmail"))
        target_position_value = (data.get("targetPosition") or StaffPosition.support.value).strip().lower()

        if not requester_email or not requester_password or not target_email:
            return jsonify({"success": False, "message": "requesterEmail, requesterPassword, and targetEmail are required."}), 400

        if target_position_value not in {position.value for position in StaffPosition}:
            return jsonify({"success": False, "message": "Invalid targetPosition."}), 400

        db = SessionLocal()
        try:
            requester = db.query(User).filter(User.email == requester_email).first()
            if not requester or not verify_password(requester.password_hash, requester_password):
                return jsonify({"success": False, "message": "Invalid requester credentials."}), 401

            requester_staff = requester.staff
            is_management = requester.role == UserRole.staff and requester_staff and requester_staff.position == StaffPosition.admin
            if not is_management:
                return jsonify({"success": False, "message": "Only management can grant staff role."}), 403

            target = db.query(User).filter(User.email == target_email).first()
            if not target:
                return jsonify({"success": False, "message": "Target user not found."}), 404

            if target.role == UserRole.staff and target.staff:
                target.staff.position = StaffPosition(target_position_value)
                db.commit()
                return jsonify(
                    {
                        "success": True,
                        "message": "User is already staff. Position updated.",
                        "targetEmail": target.email,
                        "role": target.role.value,
                        "position": target.staff.position.value,
                    }
                )

            if target.member:
                db.delete(target.member)

            target.role = UserRole.staff
            db.add(Staff(user_id=target.id, position=StaffPosition(target_position_value)))
            db.commit()

            return jsonify(
                {
                    "success": True,
                    "message": "User promoted to staff.",
                    "targetEmail": target.email,
                    "role": target.role.value,
                    "position": target_position_value,
                }
            )
        finally:
            db.close()

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(host="127.0.0.1", port=int(os.environ.get("PORT", "5000")), debug=True)

