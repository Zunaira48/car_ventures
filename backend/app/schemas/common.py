from enum import Enum


class BookingStatus(str, Enum):
    """Shared status lifecycle for vehicle bookings and tour bookings.

    Storage stays a plain SQLAlchemy String column (no DB-level enum type,
    no migration needed) - this only tightens validation at the API boundary
    so an admin PATCH can no longer set a booking to an arbitrary string.
    """
    PENDING = "PENDING"
    CONFIRMED = "CONFIRMED"
    CANCELLED = "CANCELLED"
    COMPLETED = "COMPLETED"


class TourStatus(str, Enum):
    """Active/inactive lifecycle for a tour listing itself (not its bookings).

    Same rationale as BookingStatus: plain String column in the DB, validation
    only tightened at the API boundary (TourUpdate.status).
    """
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"


class VehicleStatus(str, Enum):
    """Moderation lifecycle for a vehicle listing.

    Same rationale as BookingStatus/TourStatus: plain String column in the DB,
    validation only tightened at the API boundary (VehicleUpdate.status).
    """
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    SUSPENDED = "SUSPENDED"