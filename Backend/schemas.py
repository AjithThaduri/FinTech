"""
Comprehensive Pydantic Schemas for AI Financial Planner
Matches the Consolidated Template and Master Specification exactly.
"""
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import date
import uuid

from enums import (
    RelationshipType, TargetType, InvestmentType, 
    LiabilityType, AccountType, PolicyType
)


# ============================================================================
# SECTION 1: FAMILY & PROFILE
# ============================================================================

class FamilyMember(BaseModel):
    """Represents any family member (Primary, Spouse, Child, Parent)"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    dob: Optional[date] = None
    pan: Optional[str] = None  # Optional as per user request
    relation_type: RelationshipType  # Renamed from 'relationship' to avoid conflict
    expected_retirement_age: Optional[int] = None  # Only for earning members
    
    class Config:
        use_enum_values = True


class ContactDetails(BaseModel):
    """Contact information (optional section)"""
    mobile: Optional[str] = None
    email: Optional[str] = None
    designation: Optional[str] = None
    organisation: Optional[str] = None


class PrimaryUser(BaseModel):
    """Primary user profile - maps to Master Spec user_profile.primary_user"""
    name: str
    dob: date
    retirement_age: int = Field(default=60, alias="retire_age")
    pension_till_age: int = Field(default=85, description="Age until pension is required")
    life_expectancy: int = 85
    
    class Config:
        populate_by_name = True


class SpouseInfo(BaseModel):
    """Spouse information - maps to Master Spec user_profile.spouse"""
    name: str
    dob: date
    working_status: bool = False
    retirement_age: Optional[int] = Field(default=60, description="Spouse retirement age")
    pension_till_age: Optional[int] = Field(default=85, description="Age until pension is required")


class UserProfile(BaseModel):
    """Complete user profile section"""
    primary: PrimaryUser
    spouse: Optional[SpouseInfo] = None
    family_members: List[FamilyMember] = []  # Children, Parents
    contact_details: Optional[ContactDetails] = None
    address: Optional[str] = None


# ============================================================================
# SECTION 2: GOALS
# ============================================================================

class Goal(BaseModel):
    """
    Financial goal with person association.
    Supports both AGE-based and DATE-based targets.
    """
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    person_name: Optional[str] = None  # Link to family member
    name: str  # e.g., "Child 1 Graduation", "Buying House"
    current_cost: float
    target_type: TargetType = TargetType.AGE
    target_value: str  # Age (int as string) or Date (YYYY-MM-DD)
    
    class Config:
        use_enum_values = True


# ============================================================================
# SECTION 3: ASSETS
# ============================================================================

class RealEstateAsset(BaseModel):
    """Real estate property with full details from Consolidated Template"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    present_value: float = Field(alias="value")
    outstanding_loan: float = Field(default=0, alias="loan_outstanding")
    interest_rate: Optional[float] = None  # Loan interest rate
    loan_till: Optional[date] = None  # Loan end date
    emi: Optional[float] = None
    roi: Optional[float] = None  # Expected ROI on property
    remarks: Optional[str] = None
    
    class Config:
        populate_by_name = True


class BankAccount(BaseModel):
    """Bank accounts and Fixed Deposits"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    bank_name: str
    account_type: AccountType
    balance: float
    interest_rate: Optional[float] = None
    maturity_date: Optional[date] = None
    remarks: Optional[str] = None
    
    class Config:
        use_enum_values = True


class InvestmentAsset(BaseModel):
    """Investment asset (Stocks, MF, RD, Chits, etc.)"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    type: InvestmentType
    invested_amount: Optional[float] = None
    current_value: float
    monthly_sip: float = Field(default=0, description="Monthly SIP/Chit amount")
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    remarks: Optional[str] = None
    
    class Config:
        use_enum_values = True


class InsurancePolicy(BaseModel):
    """Insurance policy details"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    policy_name: str
    policy_type: PolicyType
    sum_assured: float
    premium: float  # Annual or monthly premium
    premium_frequency: str = "Annual"  # Annual/Monthly
    ppt: Optional[int] = None  # Premium Paying Term in years
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    maturity_amount: Optional[float] = None
    remarks: Optional[str] = None
    
    class Config:
        use_enum_values = True


class Assets(BaseModel):
    """Complete assets section"""
    real_estate: List[RealEstateAsset] = []
    bank_accounts: List[BankAccount] = []
    investments: List[InvestmentAsset] = []
    insurance_policies: List[InsurancePolicy] = []
    liquid_cash: float = 0.0  # Additional liquid cash not in bank accounts


# ============================================================================
# SECTION 4: LIABILITIES
# ============================================================================

class Liability(BaseModel):
    """Loan/Liability with full details"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    type: LiabilityType
    total_loan_amount: Optional[float] = None
    outstanding: float = Field(alias="outstanding_amount")
    emi: float = Field(alias="monthly_emi")
    interest_rate: float  # Annual percentage
    tenure_months: int
    
    class Config:
        populate_by_name = True
        use_enum_values = True


# ============================================================================
# SECTION 5: CASH FLOW (Detailed breakdown)
# ============================================================================

class Inflows(BaseModel):
    """Monthly income inflows - matches Master Spec"""
    primary_income: float = Field(default=0, alias="primary_salary")
    spouse_income: float = Field(default=0, alias="spouse_salary")
    rental_income: float = 0
    additional_income: float = Field(default=0, alias="other_income")
    other: float = 0  # Legacy field for compatibility
    
    class Config:
        populate_by_name = True


class EssentialExpenses(BaseModel):
    """Detailed essential expense breakdown"""
    house_rent: float = 0
    maintenance: float = 0
    property_tax: float = 0
    utilities: float = 0  # Electricity, Water, Gas
    groceries: float = 0
    transportation: float = 0
    medical_expenses: float = 0
    children_school_fees: float = 0
    insurance_premiums: float = 0  # Health, Term etc.
    other: float = 0


class LifestyleExpenses(BaseModel):
    """Detailed lifestyle expense breakdown"""
    maid_expense: float = 0
    shopping: float = 0
    travel: float = 0
    dining_entertainment: float = 0
    other: float = 0


class InvestmentOutflows(BaseModel):
    """Investment outflows breakdown"""
    mutual_fund_sip: float = 0
    stock_sip: float = 0
    recurring_deposit: float = 0
    chit_fund: float = 0
    other: float = 0


class Outflows(BaseModel):
    """
    Monthly expense outflows.
    Can accept either detailed breakdown or aggregate values.
    """
    # Aggregate values (for compatibility with existing system)
    essential: float = 0
    lifestyle: float = 0
    
    # Detailed breakdowns (optional)
    essential_details: Optional[EssentialExpenses] = None
    lifestyle_details: Optional[LifestyleExpenses] = None
    investment_details: Optional[InvestmentOutflows] = None
    
    # Auto-linked values (calculated from other sections)
    linked_emis: float = 0  # Auto-calculated from Liabilities
    linked_investments: float = 0  # Auto-calculated from Assets


class CashFlow(BaseModel):
    """Complete monthly cash flow"""
    inflows: Inflows
    outflows: Outflows


# ============================================================================
# SECTION 6: ASSUMPTIONS
# ============================================================================

class Assumptions(BaseModel):
    """Financial planning assumptions"""
    inflation: float = Field(default=0.06, alias="inflation_rate", description="Inflation for retirement (6%)")
    child_inflation: float = Field(default=0.10, description="Inflation for child goals (10%)")
    pre_retire_roi: float = Field(default=0.12, alias="pre_retirement_return")
    post_retire_roi: float = Field(default=0.08, alias="post_retirement_return")
    
    class Config:
        populate_by_name = True


# ============================================================================
# MAIN STATE SCHEMA
# ============================================================================

class FullState(BaseModel):
    """
    Complete application state - the "Source of Truth"
    Maps exactly to Master Specification JSON structure.
    """
    user_profile: UserProfile
    goals: List[Goal] = []
    assets: Assets = Field(default_factory=Assets)
    liabilities: List[Liability] = []
    cash_flow: CashFlow
    assumptions: Assumptions = Field(default_factory=Assumptions)


# ============================================================================
# OUTPUT SCHEMAS (Dashboard Metrics)
# ============================================================================

class GoalAnalysis(BaseModel):
    """Analysis result for a single goal"""
    id: str
    name: str
    person_name: Optional[str] = None
    current_cost: float
    years_to_goal: float
    future_cost: float


class RetirementAnalysis(BaseModel):
    """Retirement corpus calculation results"""
    current_monthly_expenses: float
    expense_at_retirement_monthly: float
    real_rate_percent: float
    pension_years: int
    pension_months: int
    corpus_required: float
    money_to_retire_now: float


class DashboardMetrics(BaseModel):
    """Final dashboard output metrics"""
    # Net Worth
    total_assets: float
    total_liabilities: float
    net_worth: float
    
    # Cash Flow Summary
    total_monthly_inflow: float
    total_monthly_outflow: float
    leftover_savings: float
    
    # Key Ratios (as percentages)
    savings_rate: float
    emi_burden: float
    investment_rate: float
    essential_expense_percent: float
    lifestyle_expense_percent: float
    
    # Retirement
    projected_corpus: float
    retirement_gap: float
    extra_sip_required: float


# ============================================================================
# EXTENDED OUTPUT SCHEMAS (New Calculations)
# ============================================================================

class RetirementCashflowRow(BaseModel):
    """Single row in the year-by-year retirement cashflow table"""
    year: int  # Age year (60, 61, 62...)
    begin_value: float
    monthly_pension: float
    pension_paid_yearly: float
    end_value: float


class ChildGoalPlanning(BaseModel):
    """Planning for a single child goal (Graduation/PG/Marriage)"""
    goal_name: str
    present_cost: float
    target_age: int
    months_left: int
    inflation: float
    cost_at_target: float
    expected_return: float
    monthly_sip_required: float


class ChildPlanningResult(BaseModel):
    """Complete planning for one child"""
    child_name: str
    child_current_age: float
    goals: List[ChildGoalPlanning]
    total_monthly_sip: float


class ContingencyFundResult(BaseModel):
    """Emergency fund calculation"""
    monthly_expenses: float
    months_required: int
    contingency_fund_required: float


class InsuranceCoverResult(BaseModel):
    """Insurance cover for one earning member"""
    member_name: str
    monthly_income: float
    current_age: float
    retirement_age: int
    expected_growth: float
    years_left: int
    insurance_cover_required: float


class AnalysisResult(BaseModel):
    """Complete analysis result returned by /analyze endpoint"""
    time_metrics: dict
    retirement: RetirementAnalysis
    goals: List[GoalAnalysis]
    summary: DashboardMetrics
    ai_analysis: dict
    # New extended analysis sections
    retirement_cashflow_table: Optional[List[RetirementCashflowRow]] = None
    child_planning: Optional[List[ChildPlanningResult]] = None
    contingency_fund: Optional[ContingencyFundResult] = None
    insurance_cover: Optional[List[InsuranceCoverResult]] = None
