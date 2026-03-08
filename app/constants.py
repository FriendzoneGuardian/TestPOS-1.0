class Roles:
    """Centralized user role constants for authorization checks."""
    ADMIN = 'admin'
    MANAGER = 'manager'
    CASHIER = 'cashier'
    ACCOUNTING = 'accounting'

    @classmethod
    def all(cls):
        return [cls.ADMIN, cls.MANAGER, cls.CASHIER, cls.ACCOUNTING]


class ShiftStatus:
    """Centralized shift status constants."""
    OPEN = 'open'
    CLOSED = 'closed'


class TransactionType:
    """Centralized vault transaction types."""
    DEPOSIT = 'Deposit'
    WITHDRAWAL = 'Withdrawal'
