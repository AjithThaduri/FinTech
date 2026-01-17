"""
Centralized Enum Definitions for the Financial Planner
All enums used across schemas and models are defined here.
"""
from enum import Enum


class RelationshipType(str, Enum):
    """Type of family member relationship"""
    PRIMARY = "PRIMARY"
    SPOUSE = "SPOUSE"
    CHILD = "CHILD"
    FATHER = "FATHER"
    MOTHER = "MOTHER"


class TargetType(str, Enum):
    """How goal target is specified"""
    AGE = "AGE"
    DATE = "DATE"


class InvestmentType(str, Enum):
    """Types of investment assets"""
    MF = "MF"
    STOCK = "Stock"
    FD = "FD"
    RD = "RD"
    CHIT = "Chit"
    OTHER = "Other"


class LiabilityType(str, Enum):
    """Types of loans/liabilities"""
    HOME = "Home"
    CAR = "Car"
    PERSONAL = "Personal"
    OTHER = "Other"


class AccountType(str, Enum):
    """Types of bank accounts"""
    SAVINGS = "Savings"
    CURRENT = "Current"
    FD = "FD"
    RD = "RD"


class PolicyType(str, Enum):
    """Types of insurance policies"""
    TERM = "Term"
    ENDOWMENT = "Endowment"
    ULIP = "ULIP"
    WHOLE_LIFE = "Whole Life"
    HEALTH = "Health"
    OTHER = "Other"
