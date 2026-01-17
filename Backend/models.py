"""
SQLAlchemy Database Models for AI Financial Planner
Comprehensive schema matching Consolidated Template and Master Specification.
"""
from sqlalchemy import (
    Boolean, Column, ForeignKey, Integer, String, Float, 
    Date, Enum as SQLEnum, Text
)
from sqlalchemy.orm import relationship
from database import Base
from enums import (
    RelationshipType, TargetType, InvestmentType, 
    LiabilityType, AccountType, PolicyType
)
import uuid


def generate_uuid():
    return str(uuid.uuid4())


# ============================================================================
# USER & FAMILY
# ============================================================================

class User(Base):
    """Primary user - the main account holder"""
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True, default=generate_uuid)
    name = Column(String, index=True)
    dob = Column(Date)
    retirement_age = Column(Integer, default=60)
    life_expectancy = Column(Integer, default=85)
    address = Column(Text, nullable=True)
    
    # Contact details (optional)
    mobile = Column(String, nullable=True)
    email = Column(String, nullable=True)
    designation = Column(String, nullable=True)
    organisation = Column(String, nullable=True)
    
    # Relationships
    spouse = relationship("Spouse", back_populates="user", uselist=False)
    family_members = relationship("FamilyMember", back_populates="user")
    goals = relationship("Goal", back_populates="user")
    real_estate_assets = relationship("RealEstateAsset", back_populates="user")
    bank_accounts = relationship("BankAccount", back_populates="user")
    investment_assets = relationship("InvestmentAsset", back_populates="user")
    insurance_policies = relationship("InsurancePolicy", back_populates="user")
    liabilities = relationship("Liability", back_populates="user")
    cash_flow = relationship("CashFlow", back_populates="user", uselist=False)
    assumptions = relationship("Assumptions", back_populates="user", uselist=False)


class Spouse(Base):
    """Spouse information"""
    __tablename__ = "spouses"
    
    id = Column(String, primary_key=True, index=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"))
    name = Column(String)
    dob = Column(Date, nullable=True)
    working_status = Column(Boolean, default=False)
    pan = Column(String, nullable=True)  # Optional
    
    # Contact details
    mobile = Column(String, nullable=True)
    email = Column(String, nullable=True)
    designation = Column(String, nullable=True)
    organisation = Column(String, nullable=True)
    
    user = relationship("User", back_populates="spouse")


class FamilyMember(Base):
    """Children, Parents, and other family members"""
    __tablename__ = "family_members"
    
    id = Column(String, primary_key=True, index=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"))
    name = Column(String)
    dob = Column(Date, nullable=True)
    pan = Column(String, nullable=True)  # Optional
    relation_type = Column(SQLEnum(RelationshipType))  # Renamed from 'relationship'
    expected_retirement_age = Column(Integer, nullable=True)  # For earning members
    
    user = relationship("User", back_populates="family_members")



# ============================================================================
# GOALS
# ============================================================================

class Goal(Base):
    """Financial goals with person association"""
    __tablename__ = "goals"
    
    id = Column(String, primary_key=True, index=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"))
    person_name = Column(String, nullable=True)  # Link to family member name
    name = Column(String)  # Goal name (e.g., "Child 1 Graduation")
    current_cost = Column(Float)
    target_type = Column(SQLEnum(TargetType))
    target_value = Column(String)  # Age (as string) or Date (YYYY-MM-DD)
    
    user = relationship("User", back_populates="goals")


# ============================================================================
# ASSETS
# ============================================================================

class RealEstateAsset(Base):
    """Real estate properties"""
    __tablename__ = "real_estate_assets"
    
    id = Column(String, primary_key=True, index=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"))
    name = Column(String)
    present_value = Column(Float)
    outstanding_loan = Column(Float, default=0)
    interest_rate = Column(Float, nullable=True)  # Loan interest rate
    loan_till = Column(Date, nullable=True)  # Loan end date
    emi = Column(Float, nullable=True)
    roi = Column(Float, nullable=True)  # Expected ROI on property
    remarks = Column(Text, nullable=True)
    
    user = relationship("User", back_populates="real_estate_assets")


class BankAccount(Base):
    """Bank accounts and Fixed Deposits"""
    __tablename__ = "bank_accounts"
    
    id = Column(String, primary_key=True, index=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"))
    bank_name = Column(String)
    account_type = Column(SQLEnum(AccountType))
    balance = Column(Float)
    interest_rate = Column(Float, nullable=True)
    maturity_date = Column(Date, nullable=True)
    remarks = Column(Text, nullable=True)
    
    user = relationship("User", back_populates="bank_accounts")


class InvestmentAsset(Base):
    """Investment assets (Stocks, MF, RD, Chits, etc.)"""
    __tablename__ = "investment_assets"
    
    id = Column(String, primary_key=True, index=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"))
    type = Column(SQLEnum(InvestmentType))
    invested_amount = Column(Float, nullable=True)
    current_value = Column(Float)
    monthly_sip = Column(Float, default=0)
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    remarks = Column(Text, nullable=True)
    
    user = relationship("User", back_populates="investment_assets")


class InsurancePolicy(Base):
    """Insurance policies"""
    __tablename__ = "insurance_policies"
    
    id = Column(String, primary_key=True, index=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"))
    policy_name = Column(String)
    policy_type = Column(SQLEnum(PolicyType))
    sum_assured = Column(Float)
    premium = Column(Float)
    premium_frequency = Column(String, default="Annual")  # Annual/Monthly
    ppt = Column(Integer, nullable=True)  # Premium Paying Term
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    maturity_amount = Column(Float, nullable=True)
    remarks = Column(Text, nullable=True)
    
    user = relationship("User", back_populates="insurance_policies")


# ============================================================================
# LIABILITIES
# ============================================================================

class Liability(Base):
    """Loans and liabilities"""
    __tablename__ = "liabilities"
    
    id = Column(String, primary_key=True, index=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"))
    type = Column(SQLEnum(LiabilityType))
    total_loan_amount = Column(Float, nullable=True)
    outstanding = Column(Float)
    emi = Column(Float)
    interest_rate = Column(Float)
    tenure_months = Column(Integer)
    
    user = relationship("User", back_populates="liabilities")


# ============================================================================
# CASH FLOW
# ============================================================================

class CashFlow(Base):
    """Monthly cash inflows and outflows"""
    __tablename__ = "cash_flows"
    
    id = Column(String, primary_key=True, index=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"))
    
    # === INFLOWS ===
    primary_income = Column(Float, default=0)
    spouse_income = Column(Float, default=0)
    rental_income = Column(Float, default=0)
    additional_income = Column(Float, default=0)
    other_income = Column(Float, default=0)
    
    # === OUTFLOWS - Essential Expenses ===
    house_rent = Column(Float, default=0)
    maintenance = Column(Float, default=0)
    property_tax = Column(Float, default=0)
    utilities = Column(Float, default=0)
    groceries = Column(Float, default=0)
    transportation = Column(Float, default=0)
    medical_expenses = Column(Float, default=0)
    children_school_fees = Column(Float, default=0)
    insurance_premiums = Column(Float, default=0)
    essential_other = Column(Float, default=0)
    
    # === OUTFLOWS - Lifestyle Expenses ===
    maid_expense = Column(Float, default=0)
    shopping = Column(Float, default=0)
    travel = Column(Float, default=0)
    dining_entertainment = Column(Float, default=0)
    lifestyle_other = Column(Float, default=0)
    
    # === OUTFLOWS - Investments ===
    mf_sip = Column(Float, default=0)
    stock_sip = Column(Float, default=0)
    rd_contribution = Column(Float, default=0)
    chit_fund = Column(Float, default=0)
    investment_other = Column(Float, default=0)
    
    # === Linked/Calculated Values ===
    linked_emis = Column(Float, default=0)  # Auto-calculated from liabilities
    linked_investments = Column(Float, default=0)  # Auto-calculated from assets
    
    user = relationship("User", back_populates="cash_flow")
    
    @property
    def total_inflow(self):
        return (self.primary_income + self.spouse_income + 
                self.rental_income + self.additional_income + self.other_income)
    
    @property  
    def total_essential_expenses(self):
        return (self.house_rent + self.maintenance + self.property_tax + 
                self.utilities + self.groceries + self.transportation + 
                self.medical_expenses + self.children_school_fees + 
                self.insurance_premiums + self.essential_other)
    
    @property
    def total_lifestyle_expenses(self):
        return (self.maid_expense + self.shopping + self.travel + 
                self.dining_entertainment + self.lifestyle_other)
    
    @property
    def total_investments(self):
        return (self.mf_sip + self.stock_sip + self.rd_contribution + 
                self.chit_fund + self.investment_other)
    
    @property
    def total_outflow(self):
        return (self.total_essential_expenses + self.total_lifestyle_expenses + 
                self.linked_emis + self.linked_investments)


# ============================================================================
# ASSUMPTIONS
# ============================================================================

class Assumptions(Base):
    """Financial planning assumptions"""
    __tablename__ = "assumptions"
    
    id = Column(String, primary_key=True, index=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"))
    
    inflation = Column(Float, default=0.06)
    pre_retire_roi = Column(Float, default=0.12)
    post_retire_roi = Column(Float, default=0.08)
    
    user = relationship("User", back_populates="assumptions")
