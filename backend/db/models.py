from __future__ import annotations

import enum

from sqlalchemy import (
    Column,
    Date,
    DateTime,
    Enum as SAEnum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    Time,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import relationship

from backend.db.database import Base


class UserRole(enum.Enum):
    member = "member"
    staff = "staff"


class MembershipType(enum.Enum):
    basic = "basic"
    standard = "standard"
    premium = "premium"


class MemberStatus(enum.Enum):
    active = "active"
    expired = "expired"
    suspended = "suspended"


class StaffPosition(enum.Enum):
    trainer = "trainer"
    admin = "admin"
    maintenance = "maintenance"
    support = "support"


class SessionBookingStatus(enum.Enum):
    booked = "booked"
    cancelled = "cancelled"


class TicketStatus(enum.Enum):
    open = "open"
    processing = "processing"
    closed = "closed"


class TicketUrgency(enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"


class MaintenanceStatus(enum.Enum):
    open = "open"
    in_progress = "in_progress"
    completed = "completed"


class PaymentStatus(enum.Enum):
    pending = "pending"
    paid = "paid"
    overdue = "overdue"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    name = Column(String(120), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(SAEnum(UserRole, name="user_role"), nullable=False)
    created_at = Column(DateTime, nullable=False, server_default=func.now())

    member = relationship("Member", back_populates="user", uselist=False)
    staff = relationship("Staff", back_populates="user", uselist=False)


class Member(Base):
    __tablename__ = "members"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    membership_type = Column(SAEnum(MembershipType, name="membership_type"), nullable=False)
    status = Column(SAEnum(MemberStatus, name="member_status"), nullable=False)
    join_date = Column(Date, nullable=False)
    expiry_date = Column(Date, nullable=False)
    phone = Column(String(40))
    emergency_contact = Column(String(120))
    emergency_phone = Column(String(40))
    notes = Column(Text)

    user = relationship("User", back_populates="member")
    session_bookings = relationship("SessionBooking", back_populates="member", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="member", cascade="all, delete-orphan")
    membership_audit_logs = relationship("MembershipAuditLog", back_populates="member", cascade="all, delete-orphan")


class Staff(Base):
    __tablename__ = "staff"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    position = Column(SAEnum(StaffPosition, name="staff_position"), nullable=False)

    user = relationship("User", back_populates="staff")
    training_sessions = relationship("TrainingSession", back_populates="trainer", cascade="all, delete-orphan")
    tickets = relationship("Ticket", back_populates="staff", cascade="all, delete-orphan")
    maintenance_logs = relationship("MaintenanceLog", back_populates="staff", cascade="all, delete-orphan")
    membership_audit_logs = relationship("MembershipAuditLog", back_populates="staff", cascade="all, delete-orphan")


class TrainingSession(Base):
    __tablename__ = "training_sessions"

    id = Column(Integer, primary_key=True)
    title = Column(String(150), nullable=False)
    trainer_id = Column(Integer, ForeignKey("staff.id"), nullable=False)
    date = Column(Date, nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    room = Column(String(120), nullable=False)
    capacity = Column(Integer, nullable=False)
    description = Column(Text)
    created_at = Column(DateTime, nullable=False, server_default=func.now())

    trainer = relationship("Staff", back_populates="training_sessions")
    bookings = relationship("SessionBooking", back_populates="session", cascade="all, delete-orphan")


class SessionBooking(Base):
    __tablename__ = "session_bookings"
    __table_args__ = (UniqueConstraint("member_id", "session_id", name="uq_member_session"),)

    id = Column(Integer, primary_key=True)
    member_id = Column(Integer, ForeignKey("members.id"), nullable=False)
    session_id = Column(Integer, ForeignKey("training_sessions.id"), nullable=False)
    status = Column(SAEnum(SessionBookingStatus, name="session_booking_status"), nullable=False)
    created_at = Column(DateTime, nullable=False, server_default=func.now())

    member = relationship("Member", back_populates="session_bookings")
    session = relationship("TrainingSession", back_populates="bookings")


class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(Integer, primary_key=True)
    staff_id = Column(Integer, ForeignKey("staff.id"), nullable=False)
    subject = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    status = Column(SAEnum(TicketStatus, name="ticket_status"), nullable=False)
    urgency = Column(SAEnum(TicketUrgency, name="ticket_urgency"), nullable=False)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())

    staff = relationship("Staff", back_populates="tickets")


class MaintenanceLog(Base):
    __tablename__ = "maintenance_logs"

    id = Column(Integer, primary_key=True)
    staff_id = Column(Integer, ForeignKey("staff.id"), nullable=False)
    area = Column(String(120), nullable=False)
    description = Column(Text, nullable=False)
    status = Column(SAEnum(MaintenanceStatus, name="maintenance_status"), nullable=False)
    log_date = Column(Date, nullable=False)
    created_at = Column(DateTime, nullable=False, server_default=func.now())

    staff = relationship("Staff", back_populates="maintenance_logs")


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True)
    member_id = Column(Integer, ForeignKey("members.id"), nullable=False)
    amount = Column(Float, nullable=False)
    status = Column(SAEnum(PaymentStatus, name="payment_status"), nullable=False)
    due_date = Column(Date, nullable=False)
    paid_at = Column(DateTime)
    note = Column(Text)

    member = relationship("Member", back_populates="payments")


class MembershipAuditLog(Base):
    __tablename__ = "membership_audit_logs"

    id = Column(Integer, primary_key=True)
    member_id = Column(Integer, ForeignKey("members.id"), nullable=False)
    staff_id = Column(Integer, ForeignKey("staff.id"), nullable=False)
    action = Column(String(50), nullable=False)
    old_status = Column(SAEnum(MemberStatus, name="member_status"), nullable=False)
    new_status = Column(SAEnum(MemberStatus, name="member_status"), nullable=False)
    old_membership_type = Column(SAEnum(MembershipType, name="membership_type"), nullable=False)
    new_membership_type = Column(SAEnum(MembershipType, name="membership_type"), nullable=False)
    note = Column(Text)
    created_at = Column(DateTime, nullable=False, server_default=func.now())

    member = relationship("Member", back_populates="membership_audit_logs")
    staff = relationship("Staff", back_populates="membership_audit_logs")
