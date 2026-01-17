"""
CRUD Operations for AI Financial Planner
Provides database operations for all entities.
"""
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date
import models
import schemas
from enums import RelationshipType, TargetType, InvestmentType, LiabilityType, AccountType, PolicyType


# ============================================================================
# USER OPERATIONS
# ============================================================================

def create_user(db: Session, user_data: schemas.PrimaryUser, contact: Optional[schemas.ContactDetails] = None, address: Optional[str] = None) -> models.User:
    """Create a new user profile."""
    db_user = models.User(
        name=user_data.name,
        dob=user_data.dob,
        retirement_age=user_data.retirement_age,
        life_expectancy=user_data.life_expectancy,
        address=address,
        mobile=contact.mobile if contact else None,
        email=contact.email if contact else None,
        designation=contact.designation if contact else None,
        organisation=contact.organisation if contact else None
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def get_user(db: Session, user_id: str) -> Optional[models.User]:
    """Get user by ID."""
    return db.query(models.User).filter(models.User.id == user_id).first()


def get_users(db: Session, skip: int = 0, limit: int = 100) -> List[models.User]:
    """Get all users (paginated)."""
    return db.query(models.User).offset(skip).limit(limit).all()


def update_user(db: Session, user_id: str, user_data: dict) -> Optional[models.User]:
    """Update user profile."""
    db_user = get_user(db, user_id)
    if not db_user:
        return None
    
    for key, value in user_data.items():
        if hasattr(db_user, key):
            setattr(db_user, key, value)
    
    db.commit()
    db.refresh(db_user)
    return db_user


def delete_user(db: Session, user_id: str) -> bool:
    """Delete user and all related data."""
    db_user = get_user(db, user_id)
    if not db_user:
        return False
    
    db.delete(db_user)
    db.commit()
    return True


# ============================================================================
# SPOUSE OPERATIONS
# ============================================================================

def create_spouse(db: Session, user_id: str, spouse_data: schemas.SpouseInfo) -> models.Spouse:
    """Create spouse record."""
    db_spouse = models.Spouse(
        user_id=user_id,
        name=spouse_data.name,
        dob=spouse_data.dob,
        working_status=spouse_data.working_status
    )
    db.add(db_spouse)
    db.commit()
    db.refresh(db_spouse)
    return db_spouse


def get_spouse(db: Session, user_id: str) -> Optional[models.Spouse]:
    """Get spouse by user ID."""
    return db.query(models.Spouse).filter(models.Spouse.user_id == user_id).first()


def update_spouse(db: Session, user_id: str, spouse_data: dict) -> Optional[models.Spouse]:
    """Update spouse record."""
    db_spouse = get_spouse(db, user_id)
    if not db_spouse:
        return None
    
    for key, value in spouse_data.items():
        if hasattr(db_spouse, key):
            setattr(db_spouse, key, value)
    
    db.commit()
    db.refresh(db_spouse)
    return db_spouse


def delete_spouse(db: Session, user_id: str) -> bool:
    """Delete spouse record."""
    db_spouse = get_spouse(db, user_id)
    if not db_spouse:
        return False
    
    db.delete(db_spouse)
    db.commit()
    return True


# ============================================================================
# FAMILY MEMBER OPERATIONS
# ============================================================================

def create_family_member(db: Session, user_id: str, member_data: schemas.FamilyMember) -> models.FamilyMember:
    """Create a family member."""
    db_member = models.FamilyMember(
        user_id=user_id,
        name=member_data.name,
        dob=member_data.dob,
        pan=member_data.pan,
        relation_type=member_data.relation_type,
        expected_retirement_age=member_data.expected_retirement_age
    )
    db.add(db_member)
    db.commit()
    db.refresh(db_member)
    return db_member


def get_family_members(db: Session, user_id: str) -> List[models.FamilyMember]:
    """Get all family members for a user."""
    return db.query(models.FamilyMember).filter(models.FamilyMember.user_id == user_id).all()


def get_family_member(db: Session, member_id: str) -> Optional[models.FamilyMember]:
    """Get a specific family member."""
    return db.query(models.FamilyMember).filter(models.FamilyMember.id == member_id).first()


def update_family_member(db: Session, member_id: str, member_data: dict) -> Optional[models.FamilyMember]:
    """Update a family member."""
    db_member = get_family_member(db, member_id)
    if not db_member:
        return None
    
    for key, value in member_data.items():
        if hasattr(db_member, key):
            setattr(db_member, key, value)
    
    db.commit()
    db.refresh(db_member)
    return db_member


def delete_family_member(db: Session, member_id: str) -> bool:
    """Delete a family member."""
    db_member = get_family_member(db, member_id)
    if not db_member:
        return False
    
    db.delete(db_member)
    db.commit()
    return True


# ============================================================================
# GOAL OPERATIONS
# ============================================================================

def create_goal(db: Session, user_id: str, goal_data: schemas.Goal) -> models.Goal:
    """Create a financial goal."""
    db_goal = models.Goal(
        user_id=user_id,
        person_name=goal_data.person_name,
        name=goal_data.name,
        current_cost=goal_data.current_cost,
        target_type=goal_data.target_type,
        target_value=goal_data.target_value
    )
    db.add(db_goal)
    db.commit()
    db.refresh(db_goal)
    return db_goal


def get_goals(db: Session, user_id: str) -> List[models.Goal]:
    """Get all goals for a user."""
    return db.query(models.Goal).filter(models.Goal.user_id == user_id).all()


def get_goal(db: Session, goal_id: str) -> Optional[models.Goal]:
    """Get a specific goal."""
    return db.query(models.Goal).filter(models.Goal.id == goal_id).first()


def update_goal(db: Session, goal_id: str, goal_data: dict) -> Optional[models.Goal]:
    """Update a goal."""
    db_goal = get_goal(db, goal_id)
    if not db_goal:
        return None
    
    for key, value in goal_data.items():
        if hasattr(db_goal, key):
            setattr(db_goal, key, value)
    
    db.commit()
    db.refresh(db_goal)
    return db_goal


def delete_goal(db: Session, goal_id: str) -> bool:
    """Delete a goal."""
    db_goal = get_goal(db, goal_id)
    if not db_goal:
        return False
    
    db.delete(db_goal)
    db.commit()
    return True


# ============================================================================
# REAL ESTATE ASSET OPERATIONS
# ============================================================================

def create_real_estate(db: Session, user_id: str, asset_data: schemas.RealEstateAsset) -> models.RealEstateAsset:
    """Create a real estate asset."""
    db_asset = models.RealEstateAsset(
        user_id=user_id,
        name=asset_data.name,
        present_value=asset_data.present_value,
        outstanding_loan=asset_data.outstanding_loan,
        interest_rate=asset_data.interest_rate,
        loan_till=asset_data.loan_till,
        emi=asset_data.emi,
        roi=asset_data.roi,
        remarks=asset_data.remarks
    )
    db.add(db_asset)
    db.commit()
    db.refresh(db_asset)
    return db_asset


def get_real_estate_assets(db: Session, user_id: str) -> List[models.RealEstateAsset]:
    """Get all real estate assets for a user."""
    return db.query(models.RealEstateAsset).filter(models.RealEstateAsset.user_id == user_id).all()


def get_real_estate(db: Session, asset_id: str) -> Optional[models.RealEstateAsset]:
    """Get a specific real estate asset."""
    return db.query(models.RealEstateAsset).filter(models.RealEstateAsset.id == asset_id).first()


def update_real_estate(db: Session, asset_id: str, asset_data: dict) -> Optional[models.RealEstateAsset]:
    """Update a real estate asset."""
    db_asset = get_real_estate(db, asset_id)
    if not db_asset:
        return None
    
    for key, value in asset_data.items():
        if hasattr(db_asset, key):
            setattr(db_asset, key, value)
    
    db.commit()
    db.refresh(db_asset)
    return db_asset


def delete_real_estate(db: Session, asset_id: str) -> bool:
    """Delete a real estate asset."""
    db_asset = get_real_estate(db, asset_id)
    if not db_asset:
        return False
    
    db.delete(db_asset)
    db.commit()
    return True


# ============================================================================
# BANK ACCOUNT OPERATIONS
# ============================================================================

def create_bank_account(db: Session, user_id: str, account_data: schemas.BankAccount) -> models.BankAccount:
    """Create a bank account."""
    db_account = models.BankAccount(
        user_id=user_id,
        bank_name=account_data.bank_name,
        account_type=account_data.account_type,
        balance=account_data.balance,
        interest_rate=account_data.interest_rate,
        maturity_date=account_data.maturity_date,
        remarks=account_data.remarks
    )
    db.add(db_account)
    db.commit()
    db.refresh(db_account)
    return db_account


def get_bank_accounts(db: Session, user_id: str) -> List[models.BankAccount]:
    """Get all bank accounts for a user."""
    return db.query(models.BankAccount).filter(models.BankAccount.user_id == user_id).all()


def get_bank_account(db: Session, account_id: str) -> Optional[models.BankAccount]:
    """Get a specific bank account."""
    return db.query(models.BankAccount).filter(models.BankAccount.id == account_id).first()


def update_bank_account(db: Session, account_id: str, account_data: dict) -> Optional[models.BankAccount]:
    """Update a bank account."""
    db_account = get_bank_account(db, account_id)
    if not db_account:
        return None
    
    for key, value in account_data.items():
        if hasattr(db_account, key):
            setattr(db_account, key, value)
    
    db.commit()
    db.refresh(db_account)
    return db_account


def delete_bank_account(db: Session, account_id: str) -> bool:
    """Delete a bank account."""
    db_account = get_bank_account(db, account_id)
    if not db_account:
        return False
    
    db.delete(db_account)
    db.commit()
    return True


# ============================================================================
# INVESTMENT ASSET OPERATIONS
# ============================================================================

def create_investment(db: Session, user_id: str, investment_data: schemas.InvestmentAsset) -> models.InvestmentAsset:
    """Create an investment asset."""
    db_investment = models.InvestmentAsset(
        user_id=user_id,
        type=investment_data.type,
        invested_amount=investment_data.invested_amount,
        current_value=investment_data.current_value,
        monthly_sip=investment_data.monthly_sip,
        start_date=investment_data.start_date,
        end_date=investment_data.end_date,
        remarks=investment_data.remarks
    )
    db.add(db_investment)
    db.commit()
    db.refresh(db_investment)
    return db_investment


def get_investments(db: Session, user_id: str) -> List[models.InvestmentAsset]:
    """Get all investments for a user."""
    return db.query(models.InvestmentAsset).filter(models.InvestmentAsset.user_id == user_id).all()


def get_investment(db: Session, investment_id: str) -> Optional[models.InvestmentAsset]:
    """Get a specific investment."""
    return db.query(models.InvestmentAsset).filter(models.InvestmentAsset.id == investment_id).first()


def update_investment(db: Session, investment_id: str, investment_data: dict) -> Optional[models.InvestmentAsset]:
    """Update an investment."""
    db_investment = get_investment(db, investment_id)
    if not db_investment:
        return None
    
    for key, value in investment_data.items():
        if hasattr(db_investment, key):
            setattr(db_investment, key, value)
    
    db.commit()
    db.refresh(db_investment)
    return db_investment


def delete_investment(db: Session, investment_id: str) -> bool:
    """Delete an investment."""
    db_investment = get_investment(db, investment_id)
    if not db_investment:
        return False
    
    db.delete(db_investment)
    db.commit()
    return True


# ============================================================================
# INSURANCE POLICY OPERATIONS
# ============================================================================

def create_insurance(db: Session, user_id: str, policy_data: schemas.InsurancePolicy) -> models.InsurancePolicy:
    """Create an insurance policy."""
    db_policy = models.InsurancePolicy(
        user_id=user_id,
        policy_name=policy_data.policy_name,
        policy_type=policy_data.policy_type,
        sum_assured=policy_data.sum_assured,
        premium=policy_data.premium,
        premium_frequency=policy_data.premium_frequency,
        ppt=policy_data.ppt,
        start_date=policy_data.start_date,
        end_date=policy_data.end_date,
        maturity_amount=policy_data.maturity_amount,
        remarks=policy_data.remarks
    )
    db.add(db_policy)
    db.commit()
    db.refresh(db_policy)
    return db_policy


def get_insurance_policies(db: Session, user_id: str) -> List[models.InsurancePolicy]:
    """Get all insurance policies for a user."""
    return db.query(models.InsurancePolicy).filter(models.InsurancePolicy.user_id == user_id).all()


def get_insurance(db: Session, policy_id: str) -> Optional[models.InsurancePolicy]:
    """Get a specific insurance policy."""
    return db.query(models.InsurancePolicy).filter(models.InsurancePolicy.id == policy_id).first()


def update_insurance(db: Session, policy_id: str, policy_data: dict) -> Optional[models.InsurancePolicy]:
    """Update an insurance policy."""
    db_policy = get_insurance(db, policy_id)
    if not db_policy:
        return None
    
    for key, value in policy_data.items():
        if hasattr(db_policy, key):
            setattr(db_policy, key, value)
    
    db.commit()
    db.refresh(db_policy)
    return db_policy


def delete_insurance(db: Session, policy_id: str) -> bool:
    """Delete an insurance policy."""
    db_policy = get_insurance(db, policy_id)
    if not db_policy:
        return False
    
    db.delete(db_policy)
    db.commit()
    return True


# ============================================================================
# LIABILITY OPERATIONS
# ============================================================================

def create_liability(db: Session, user_id: str, liability_data: schemas.Liability) -> models.Liability:
    """Create a liability."""
    db_liability = models.Liability(
        user_id=user_id,
        type=liability_data.type,
        total_loan_amount=liability_data.total_loan_amount,
        outstanding=liability_data.outstanding,
        emi=liability_data.emi,
        interest_rate=liability_data.interest_rate,
        tenure_months=liability_data.tenure_months
    )
    db.add(db_liability)
    db.commit()
    db.refresh(db_liability)
    return db_liability


def get_liabilities(db: Session, user_id: str) -> List[models.Liability]:
    """Get all liabilities for a user."""
    return db.query(models.Liability).filter(models.Liability.user_id == user_id).all()


def get_liability(db: Session, liability_id: str) -> Optional[models.Liability]:
    """Get a specific liability."""
    return db.query(models.Liability).filter(models.Liability.id == liability_id).first()


def update_liability(db: Session, liability_id: str, liability_data: dict) -> Optional[models.Liability]:
    """Update a liability."""
    db_liability = get_liability(db, liability_id)
    if not db_liability:
        return None
    
    for key, value in liability_data.items():
        if hasattr(db_liability, key):
            setattr(db_liability, key, value)
    
    db.commit()
    db.refresh(db_liability)
    return db_liability


def delete_liability(db: Session, liability_id: str) -> bool:
    """Delete a liability."""
    db_liability = get_liability(db, liability_id)
    if not db_liability:
        return False
    
    db.delete(db_liability)
    db.commit()
    return True


# ============================================================================
# CASH FLOW OPERATIONS
# ============================================================================

def create_or_update_cash_flow(db: Session, user_id: str, cash_flow_data: schemas.CashFlow) -> models.CashFlow:
    """Create or update cash flow (upsert operation)."""
    # Check if cash flow exists
    db_cash_flow = db.query(models.CashFlow).filter(models.CashFlow.user_id == user_id).first()
    
    inflows = cash_flow_data.inflows
    outflows = cash_flow_data.outflows
    
    if db_cash_flow:
        # Update existing
        db_cash_flow.primary_income = inflows.primary_income
        db_cash_flow.spouse_income = getattr(inflows, 'spouse_income', 0)
        db_cash_flow.rental_income = inflows.rental_income
        db_cash_flow.additional_income = getattr(inflows, 'additional_income', 0)
        db_cash_flow.other_income = getattr(inflows, 'other', 0)
        
        # Update outflows
        db_cash_flow.essential = outflows.essential
        db_cash_flow.lifestyle = outflows.lifestyle
        
        # Update detailed expenses if provided
        if outflows.essential_details:
            ed = outflows.essential_details
            db_cash_flow.house_rent = ed.house_rent
            db_cash_flow.maintenance = ed.maintenance
            db_cash_flow.property_tax = ed.property_tax
            db_cash_flow.utilities = ed.utilities
            db_cash_flow.groceries = ed.groceries
            db_cash_flow.transportation = ed.transportation
            db_cash_flow.medical_expenses = ed.medical_expenses
            db_cash_flow.children_school_fees = ed.children_school_fees
            db_cash_flow.insurance_premiums = ed.insurance_premiums
            db_cash_flow.essential_other = ed.other
        
        if outflows.lifestyle_details:
            ld = outflows.lifestyle_details
            db_cash_flow.maid_expense = ld.maid_expense
            db_cash_flow.shopping = ld.shopping
            db_cash_flow.travel = ld.travel
            db_cash_flow.dining_entertainment = ld.dining_entertainment
            db_cash_flow.lifestyle_other = ld.other
        
        if outflows.investment_details:
            inv = outflows.investment_details
            db_cash_flow.mf_sip = inv.mutual_fund_sip
            db_cash_flow.stock_sip = inv.stock_sip
            db_cash_flow.rd_contribution = inv.recurring_deposit
            db_cash_flow.chit_fund = inv.chit_fund
            db_cash_flow.investment_other = inv.other
        
        db_cash_flow.linked_emis = outflows.linked_emis
        db_cash_flow.linked_investments = outflows.linked_investments
    else:
        # Create new
        db_cash_flow = models.CashFlow(
            user_id=user_id,
            primary_income=inflows.primary_income,
            spouse_income=getattr(inflows, 'spouse_income', 0),
            rental_income=inflows.rental_income,
            additional_income=getattr(inflows, 'additional_income', 0),
            other_income=getattr(inflows, 'other', 0),
            essential=outflows.essential,
            lifestyle=outflows.lifestyle,
            linked_emis=outflows.linked_emis,
            linked_investments=outflows.linked_investments
        )
        db.add(db_cash_flow)
    
    db.commit()
    db.refresh(db_cash_flow)
    return db_cash_flow


def get_cash_flow(db: Session, user_id: str) -> Optional[models.CashFlow]:
    """Get cash flow for a user."""
    return db.query(models.CashFlow).filter(models.CashFlow.user_id == user_id).first()


# ============================================================================
# ASSUMPTIONS OPERATIONS
# ============================================================================

def create_or_update_assumptions(db: Session, user_id: str, assumptions_data: schemas.Assumptions) -> models.Assumptions:
    """Create or update assumptions (upsert operation)."""
    db_assumptions = db.query(models.Assumptions).filter(models.Assumptions.user_id == user_id).first()
    
    if db_assumptions:
        # Update existing
        db_assumptions.inflation = assumptions_data.inflation
        db_assumptions.pre_retire_roi = assumptions_data.pre_retire_roi
        db_assumptions.post_retire_roi = assumptions_data.post_retire_roi
    else:
        # Create new
        db_assumptions = models.Assumptions(
            user_id=user_id,
            inflation=assumptions_data.inflation,
            pre_retire_roi=assumptions_data.pre_retire_roi,
            post_retire_roi=assumptions_data.post_retire_roi
        )
        db.add(db_assumptions)
    
    db.commit()
    db.refresh(db_assumptions)
    return db_assumptions


def get_assumptions(db: Session, user_id: str) -> Optional[models.Assumptions]:
    """Get assumptions for a user."""
    return db.query(models.Assumptions).filter(models.Assumptions.user_id == user_id).first()
