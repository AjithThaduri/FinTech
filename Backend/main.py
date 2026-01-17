from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
from database import engine, Base, get_db
from schemas import (
    FullState, PrimaryUser, SpouseInfo, ContactDetails, UserProfile,
    FamilyMember, Goal, RealEstateAsset, BankAccount, InvestmentAsset,
    InsurancePolicy, Liability, CashFlow, Assumptions, AnalysisResult
)
import models
import crud
from engine import FinancialEngine
import uvicorn

# Calculator imports
import calculator_models
from calculator_schemas import (
    CalculatorDefinition, CalculatorExecutionRequest, CalculatorExecutionResult,
    CalculatorGenerationRequest, ConversationContinueRequest, CalculatorGenerationResponse,
    CalculatorSummary, CalculatorVersionInfo, CalculatorApprovalRequest,
    ExplanationRequest, ExplanationResponse, CalculatorCategory, PreviewExecutionRequest
)
import calculator_crud
from calculator_engine import CalculatorEngine, create_sample_calculators
from calculator_generator_service import (
    orchestrator, run_explanation_agent, generate_result_explanation
)

# Initialize Database tables
models.Base.metadata.create_all(bind=engine)
calculator_models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AI Financial Planner API",
    description="Comprehensive financial planning API with AI-powered insights",
    version="1.0.0"
)

# CORS setup for Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================================
# ROOT
# ============================================================================

@app.get("/")
def read_root():
    return {
        "message": "AI Financial Planner Engine Ready",
        "version": "1.0.0",
        "docs": "/docs"
    }


# ============================================================================
# USER PROFILE ENDPOINTS
# ============================================================================

@app.post("/api/users", status_code=201)
def create_user_profile(
    user_profile: UserProfile,
    db: Session = Depends(get_db)
):
    """Create a new user with complete profile."""
    try:
        # Create primary user
        db_user = crud.create_user(
            db,
            user_profile.primary,
            user_profile.contact_details,
            user_profile.address
        )
        
        # Create spouse if provided
        if user_profile.spouse:
            crud.create_spouse(db, db_user.id, user_profile.spouse)
        
        # Create family members if provided
        for member in user_profile.family_members:
            crud.create_family_member(db, db_user.id, member)
        
        # Create default assumptions
        default_assumptions = Assumptions()
        crud.create_or_update_assumptions(db, db_user.id, default_assumptions)
        
        return {"user_id": db_user.id, "message": "User profile created successfully"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/users/{user_id}")
def get_user_profile(user_id: str, db: Session = Depends(get_db)):
    """Get complete user profile with all related data."""
    db_user = crud.get_user(db, user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get all related data
    spouse = crud.get_spouse(db, user_id)
    family_members = crud.get_family_members(db, user_id)
    goals = crud.get_goals(db, user_id)
    
    return {
        "user": db_user,
        "spouse": spouse,
        "family_members": family_members,
        "goals": goals
    }


@app.put("/api/users/{user_id}")
def update_user_profile(
    user_id: str,
    user_data: dict,
    db: Session = Depends(get_db)
):
    """Update user profile."""
    db_user = crud.update_user(db, user_id, user_data)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "User updated successfully", "user": db_user}


@app.delete("/api/users/{user_id}")
def delete_user_profile(user_id: str, db: Session = Depends(get_db)):
    """Delete user and all related data."""
    success = crud.delete_user(db, user_id)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "User deleted successfully"}


# ============================================================================
# SPOUSE ENDPOINTS
# ============================================================================

@app.post("/api/users/{user_id}/spouse", status_code=201)
def create_or_update_spouse(
    user_id: str,
    spouse_data: SpouseInfo,
    db: Session = Depends(get_db)
):
    """Create or update spouse information."""
    # Check if user exists
    user = crud.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if spouse already exists
    existing_spouse = crud.get_spouse(db, user_id)
    if existing_spouse:
        # Update
        updated_spouse = crud.update_spouse(db, user_id, spouse_data.dict())
        return {"message": "Spouse updated successfully", "spouse": updated_spouse}
    else:
        # Create
        new_spouse = crud.create_spouse(db, user_id, spouse_data)
        return {"message": "Spouse created successfully", "spouse": new_spouse}


@app.get("/api/users/{user_id}/spouse")
def get_spouse_info(user_id: str, db: Session = Depends(get_db)):
    """Get spouse information."""
    spouse = crud.get_spouse(db, user_id)
    if not spouse:
        raise HTTPException(status_code=404, detail="Spouse not found")
    return spouse


@app.delete("/api/users/{user_id}/spouse")
def delete_spouse_info(user_id: str, db: Session = Depends(get_db)):
    """Delete spouse information."""
    success = crud.delete_spouse(db, user_id)
    if not success:
        raise HTTPException(status_code=404, detail="Spouse not found")
    return {"message": "Spouse deleted successfully"}


# ============================================================================
# FAMILY MEMBER ENDPOINTS
# ============================================================================

@app.post("/api/users/{user_id}/family-members", status_code=201)
def add_family_member(
    user_id: str,
    member_data: FamilyMember,
    db: Session = Depends(get_db)
):
    """Add a family member."""
    # Check if user exists
    user = crud.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    new_member = crud.create_family_member(db, user_id, member_data)
    return {"message": "Family member added successfully", "member": new_member}


@app.get("/api/users/{user_id}/family-members")
def get_all_family_members(user_id: str, db: Session = Depends(get_db)):
    """Get all family members."""
    members = crud.get_family_members(db, user_id)
    return {"family_members": members, "count": len(members)}


@app.put("/api/users/{user_id}/family-members/{member_id}")
def update_family_member_info(
    member_id: str,
    member_data: dict,
    db: Session = Depends(get_db)
):
    """Update family member information."""
    updated_member = crud.update_family_member(db, member_id, member_data)
    if not updated_member:
        raise HTTPException(status_code=404, detail="Family member not found")
    return {"message": "Family member updated successfully", "member": updated_member}


@app.delete("/api/users/{user_id}/family-members/{member_id}")
def remove_family_member(member_id: str, db: Session = Depends(get_db)):
    """Delete a family member."""
    success = crud.delete_family_member(db, member_id)
    if not success:
        raise HTTPException(status_code=404, detail="Family member not found")
    return {"message": "Family member deleted successfully"}


# ============================================================================
# GOAL ENDPOINTS
# ============================================================================

@app.post("/api/users/{user_id}/goals", status_code=201)
def add_goal(user_id: str, goal_data: Goal, db: Session = Depends(get_db)):
    """Add a financial goal."""
    user = crud.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    new_goal = crud.create_goal(db, user_id, goal_data)
    return {"message": "Goal added successfully", "goal": new_goal}


@app.get("/api/users/{user_id}/goals")
def get_all_goals(user_id: str, db: Session = Depends(get_db)):
    """Get all goals for a user."""
    goals = crud.get_goals(db, user_id)
    return {"goals": goals, "count": len(goals)}


@app.put("/api/users/{user_id}/goals/{goal_id}")
def update_goal_info(goal_id: str, goal_data: dict, db: Session = Depends(get_db)):
    """Update a goal."""
    updated_goal = crud.update_goal(db, goal_id, goal_data)
    if not updated_goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    return {"message": "Goal updated successfully", "goal": updated_goal}


@app.delete("/api/users/{user_id}/goals/{goal_id}")
def remove_goal(goal_id: str, db: Session = Depends(get_db)):
    """Delete a goal."""
    success = crud.delete_goal(db, goal_id)
    if not success:
        raise HTTPException(status_code=404, detail="Goal not found")
    return {"message": "Goal deleted successfully"}


# ============================================================================
# REAL ESTATE ENDPOINTS
# ============================================================================

@app.post("/api/users/{user_id}/assets/real-estate", status_code=201)
def add_real_estate(user_id: str, asset_data: RealEstateAsset, db: Session = Depends(get_db)):
    """Add a real estate asset."""
    user = crud.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    new_asset = crud.create_real_estate(db, user_id, asset_data)
    return {"message": "Real estate asset added successfully", "asset": new_asset}


@app.get("/api/users/{user_id}/assets/real-estate")
def get_all_real_estate(user_id: str, db: Session = Depends(get_db)):
    """Get all real estate assets."""
    assets = crud.get_real_estate_assets(db, user_id)
    return {"real_estate": assets, "count": len(assets)}


@app.put("/api/users/{user_id}/assets/real-estate/{asset_id}")
def update_real_estate_info(asset_id: str, asset_data: dict, db: Session = Depends(get_db)):
    """Update real estate asset."""
    updated_asset = crud.update_real_estate(db, asset_id, asset_data)
    if not updated_asset:
        raise HTTPException(status_code=404, detail="Real estate asset not found")
    return {"message": "Real estate updated successfully", "asset": updated_asset}


@app.delete("/api/users/{user_id}/assets/real-estate/{asset_id}")
def remove_real_estate(asset_id: str, db: Session = Depends(get_db)):
    """Delete real estate asset."""
    success = crud.delete_real_estate(db, asset_id)
    if not success:
        raise HTTPException(status_code=404, detail="Real estate asset not found")
    return {"message": "Real estate deleted successfully"}


# ============================================================================
# BANK ACCOUNT ENDPOINTS
# ============================================================================

@app.post("/api/users/{user_id}/assets/bank-accounts", status_code=201)
def add_bank_account(user_id: str, account_data: BankAccount, db: Session = Depends(get_db)):
    """Add a bank account."""
    user = crud.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    new_account = crud.create_bank_account(db, user_id, account_data)
    return {"message": "Bank account added successfully", "account": new_account}


@app.get("/api/users/{user_id}/assets/bank-accounts")
def get_all_bank_accounts(user_id: str, db: Session = Depends(get_db)):
    """Get all bank accounts."""
    accounts = crud.get_bank_accounts(db, user_id)
    return {"bank_accounts": accounts, "count": len(accounts)}


@app.put("/api/users/{user_id}/assets/bank-accounts/{account_id}")
def update_bank_account_info(account_id: str, account_data: dict, db: Session = Depends(get_db)):
    """Update bank account."""
    updated_account = crud.update_bank_account(db, account_id, account_data)
    if not updated_account:
        raise HTTPException(status_code=404, detail="Bank account not found")
    return {"message": "Bank account updated successfully", "account": updated_account}


@app.delete("/api/users/{user_id}/assets/bank-accounts/{account_id}")
def remove_bank_account(account_id: str, db: Session = Depends(get_db)):
    """Delete bank account."""
    success = crud.delete_bank_account(db, account_id)
    if not success:
        raise HTTPException(status_code=404, detail="Bank account not found")
    return {"message": "Bank account deleted successfully"}


# ============================================================================
# INVESTMENT ENDPOINTS
# ============================================================================

@app.post("/api/users/{user_id}/assets/investments", status_code=201)
def add_investment(user_id: str, investment_data: InvestmentAsset, db: Session = Depends(get_db)):
    """Add an investment."""
    user = crud.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    new_investment = crud.create_investment(db, user_id, investment_data)
    return {"message": "Investment added successfully", "investment": new_investment}


@app.get("/api/users/{user_id}/assets/investments")
def get_all_investments(user_id: str, db: Session = Depends(get_db)):
    """Get all investments."""
    investments = crud.get_investments(db, user_id)
    return {"investments": investments, "count": len(investments)}


@app.put("/api/users/{user_id}/assets/investments/{investment_id}")
def update_investment_info(investment_id: str, investment_data: dict, db: Session = Depends(get_db)):
    """Update investment."""
    updated_investment = crud.update_investment(db, investment_id, investment_data)
    if not updated_investment:
        raise HTTPException(status_code=404, detail="Investment not found")
    return {"message": "Investment updated successfully", "investment": updated_investment}


@app.delete("/api/users/{user_id}/assets/investments/{investment_id}")
def remove_investment(investment_id: str, db: Session = Depends(get_db)):
    """Delete investment."""
    success = crud.delete_investment(db, investment_id)
    if not success:
        raise HTTPException(status_code=404, detail="Investment not found")
    return {"message": "Investment deleted successfully"}


# ============================================================================
# INSURANCE ENDPOINTS
# ============================================================================

@app.post("/api/users/{user_id}/assets/insurance", status_code=201)
def add_insurance_policy(user_id: str, policy_data: InsurancePolicy, db: Session = Depends(get_db)):
    """Add an insurance policy."""
    user = crud.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    new_policy = crud.create_insurance(db, user_id, policy_data)
    return {"message": "Insurance policy added successfully", "policy": new_policy}


@app.get("/api/users/{user_id}/assets/insurance")
def get_all_insurance_policies(user_id: str, db: Session = Depends(get_db)):
    """Get all insurance policies."""
    policies = crud.get_insurance_policies(db, user_id)
    return {"insurance_policies": policies, "count": len(policies)}


@app.put("/api/users/{user_id}/assets/insurance/{policy_id}")
def update_insurance_policy_info(policy_id: str, policy_data: dict, db: Session = Depends(get_db)):
    """Update insurance policy."""
    updated_policy = crud.update_insurance(db, policy_id, policy_data)
    if not updated_policy:
        raise HTTPException(status_code=404, detail="Insurance policy not found")
    return {"message": "Insurance policy updated successfully", "policy": updated_policy}


@app.delete("/api/users/{user_id}/assets/insurance/{policy_id}")
def remove_insurance_policy(policy_id: str, db: Session = Depends(get_db)):
    """Delete insurance policy."""
    success = crud.delete_insurance(db, policy_id)
    if not success:
        raise HTTPException(status_code=404, detail="Insurance policy not found")
    return {"message": "Insurance policy deleted successfully"}


# ============================================================================
# LIABILITY ENDPOINTS
# ============================================================================

@app.post("/api/users/{user_id}/liabilities", status_code=201)
def add_liability(user_id: str, liability_data: Liability, db: Session = Depends(get_db)):
    """Add a liability."""
    user = crud.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    new_liability = crud.create_liability(db, user_id, liability_data)
    return {"message": "Liability added successfully", "liability": new_liability}


@app.get("/api/users/{user_id}/liabilities")
def get_all_liabilities(user_id: str, db: Session = Depends(get_db)):
    """Get all liabilities."""
    liabilities = crud.get_liabilities(db, user_id)
    return {"liabilities": liabilities, "count": len(liabilities)}


@app.put("/api/users/{user_id}/liabilities/{liability_id}")
def update_liability_info(liability_id: str, liability_data: dict, db: Session = Depends(get_db)):
    """Update liability."""
    updated_liability = crud.update_liability(db, liability_id, liability_data)
    if not updated_liability:
        raise HTTPException(status_code=404, detail="Liability not found")
    return {"message": "Liability updated successfully", "liability": updated_liability}


@app.delete("/api/users/{user_id}/liabilities/{liability_id}")
def remove_liability(liability_id: str, db: Session = Depends(get_db)):
    """Delete liability."""
    success = crud.delete_liability(db, liability_id)
    if not success:
        raise HTTPException(status_code=404, detail="Liability not found")
    return {"message": "Liability deleted successfully"}


# ============================================================================
# CASH FLOW ENDPOINTS
# ============================================================================

@app.put("/api/users/{user_id}/cash-flow")
def update_cash_flow_data(user_id: str, cash_flow_data: CashFlow, db: Session = Depends(get_db)):
    """Create or update cash flow."""
    user = crud.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    cash_flow = crud.create_or_update_cash_flow(db, user_id, cash_flow_data)
    return {"message": "Cash flow updated successfully", "cash_flow": cash_flow}


@app.get("/api/users/{user_id}/cash-flow")
def get_cash_flow_data(user_id: str, db: Session = Depends(get_db)):
    """Get cash flow."""
    cash_flow = crud.get_cash_flow(db, user_id)
    if not cash_flow:
        raise HTTPException(status_code=404, detail="Cash flow not found")
    return cash_flow


# ============================================================================
# ASSUMPTIONS ENDPOINTS
# ============================================================================

@app.put("/api/users/{user_id}/assumptions")
def update_assumptions_data(user_id: str, assumptions_data: Assumptions, db: Session = Depends(get_db)):
    """Create or update assumptions."""
    user = crud.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    assumptions = crud.create_or_update_assumptions(db, user_id, assumptions_data)
    return {"message": "Assumptions updated successfully", "assumptions": assumptions}


@app.get("/api/users/{user_id}/assumptions")
def get_assumptions_data(user_id: str, db: Session = Depends(get_db)):
    """Get assumptions."""
    assumptions = crud.get_assumptions(db, user_id)
    if not assumptions:
        # Return defaults
        return {"inflation": 0.06, "pre_retire_roi": 0.12, "post_retire_roi": 0.08}
    return assumptions


# ============================================================================
# ANALYSIS ENDPOINTS
# ============================================================================

from ai_service import generate_financial_insights

@app.post("/api/analyze")
def analyze_financial_state(state: FullState):
    """
    Core Endpoint: Receives Full User State -> Returns Financial Plan & Insights
    Uses OpenAI for comprehensive AI-powered analysis.
    """
    try:
        # 1. Initialize Engine
        engine_instance = FinancialEngine(state)
        
        # 2. Run Calculations
        results = engine_instance.calculate()
        
        # 3. Generate AI Insights using OpenAI
        ai_response = generate_financial_insights(results)
        
        if ai_response.get("success"):
            results["ai_analysis"] = ai_response["insights"]
        else:
            # Fallback to basic analysis
            results["ai_analysis"] = {
                "executive_summary": "Based on the analysis, your financial health is stable but requires attention to retirement savings.",
                "health_score": 65,
                "health_status": "Good",
                "recommendations": [
                    {"priority": 1, "category": "Retirement", "action": f"Increase SIP by ₹{results['summary']['extra_sip_required']:,.0f}", "impact": "Bridge retirement gap", "timeline": "Immediately"}
                ]
            }
        
        return results
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/users/{user_id}/analysis")
def get_user_analysis(user_id: str, db: Session = Depends(get_db)):
    """
    Get comprehensive analysis for a user based on stored data.
    Constructs FullState from database and runs analysis.
    """
    try:
        # Get all user data
        db_user = crud.get_user(db, user_id)
        if not db_user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Construct FullState from database
        # This is a simplified version - you may need to expand this
        # to properly convert database models to Pydantic schemas
        
        from schemas import FullState, UserProfile, PrimaryUser, SpouseInfo, Assets
        
        # Build user profile
        primary = PrimaryUser(
            name=db_user.name,
            dob=db_user.dob,
            retire_age=db_user.retirement_age,
            life_expectancy=db_user.life_expectancy
        )
        
        # Get spouse
        spouse_data = None
        db_spouse = crud.get_spouse(db, user_id)
        if db_spouse:
            spouse_data = SpouseInfo(
                name=db_spouse.name,
                dob=db_spouse.dob,
                working_status=db_spouse.working_status
            )
        
        # Get family members
        family_members = crud.get_family_members(db, user_id)
        
        # Build profile
        user_profile = UserProfile(
            primary=primary,
            spouse=spouse_data,
            family_members=family_members,
            address=db_user.address
        )
        
        # Get goals
        goals = crud.get_goals(db, user_id)
        
        # Get assets
        real_estate = crud.get_real_estate_assets(db, user_id)
        bank_accounts = crud.get_bank_accounts(db, user_id)
        investments = crud.get_investments(db, user_id)
        insurance_policies = crud.get_insurance_policies(db, user_id)
        
        assets = Assets(
            real_estate=real_estate,
            bank_accounts=bank_accounts,
            investments=investments,
            insurance_policies=insurance_policies
        )
        
        # Get liabilities
        liabilities = crud.get_liabilities(db, user_id)
        
        # Get cash flow
        cash_flow = crud.get_cash_flow(db, user_id)
        if not cash_flow:
            raise HTTPException(status_code=404, detail="Cash flow data not found")
        
        # Get assumptions
        assumptions = crud.get_assumptions(db, user_id)
        if not assumptions:
            assumptions = Assumptions()
        
        # Build FullState
        full_state = FullState(
            user_profile=user_profile,
            goals=goals,
            assets=assets,
            liabilities=liabilities,
            cash_flow=cash_flow,
            assumptions=assumptions
        )
        
        # Run analysis
        engine_instance = FinancialEngine(full_state)
        results = engine_instance.calculate()
        
        # Add AI analysis (mocked)
        results["ai_analysis"] = {
            "summary": "Based on your financial profile, here are personalized insights...",
            "recommendations": [
                f"Increase SIP by ₹{results['summary']['extra_sip_required']:.0f} to meet retirement goals.",
                "Your EMI burden is healthy. Keep it under 40%.",
                "Consider building an emergency fund of 6 months expenses."
            ]
        }
        
        return results
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# CALCULATOR GENERATION ENDPOINTS (Admin/AI-Assisted)
# ============================================================================

@app.post("/api/calculators/generate/start", response_model=CalculatorGenerationResponse)
def start_calculator_generation(request: CalculatorGenerationRequest):
    """
    Start AI-driven conversational calculator generation.
    The AI will ask clarifying questions before generating a calculator.
    """
    try:
        response = orchestrator.start_generation(
            description=request.description,
            category=request.category.value if request.category else None,
            jurisdiction=request.jurisdiction
        )
        return response
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/calculators/generate/continue", response_model=CalculatorGenerationResponse)
def continue_calculator_generation(request: ConversationContinueRequest):
    """
    Continue an existing calculator generation conversation.
    Use this to answer AI's clarifying questions or provide feedback.
    """
    try:
        response = orchestrator.continue_generation(
            conversation_id=request.conversation_id,
            user_message=request.user_message
        )
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/calculators/{conversation_id}/save", status_code=201)
def save_generated_calculator(
    conversation_id: str,
    db: Session = Depends(get_db)
):
    """
    Save an approved calculator from a generation conversation.
    The conversation must be in 'completed' state.
    """
    try:
        # Get draft definition from conversation
        definition = orchestrator.get_draft_definition(conversation_id)
        if not definition:
            raise HTTPException(status_code=404, detail="Conversation not found or no draft available")
        
        # Create calculator in database
        calculator = calculator_crud.create_calculator(
            db,
            name=definition.name,
            category=definition.category,
            description=definition.description
        )
        
        # Create version
        version = calculator_crud.create_calculator_version(
            db,
            calculator_id=calculator.id,
            definition=definition,
            created_by="admin"
        )
        
        # Auto-approve for now
        calculator_crud.approve_version(db, version.id, approved_by="admin")
        
        return {
            "message": "Calculator saved and activated successfully",
            "calculator_id": calculator.id,
            "version": version.version
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# CALCULATOR MANAGEMENT ENDPOINTS
# ============================================================================

@app.get("/api/calculators")
def list_calculators(
    category: Optional[str] = None,
    active_only: bool = True,
    db: Session = Depends(get_db)
):
    """List all available calculators."""
    calculators = calculator_crud.get_all_calculators(
        db,
        category=category,
        is_active=active_only if active_only else None
    )
    
    result = []
    for calc in calculators:
        active_version = calculator_crud.get_active_version(db, calc.id)
        result.append({
            "id": calc.id,
            "name": calc.name,
            "category": calc.category,
            "description": calc.description,
            "is_active": calc.is_active,
            "version": active_version.version if active_version else None,
            "created_at": calc.created_at.isoformat() if calc.created_at else None
        })
    
    return {"calculators": result, "count": len(result)}


@app.get("/api/calculators/{calculator_id}")
def get_calculator(calculator_id: str, db: Session = Depends(get_db)):
    """Get a calculator's full definition."""
    calculator = calculator_crud.get_calculator(db, calculator_id)
    if not calculator:
        raise HTTPException(status_code=404, detail="Calculator not found")
    
    active_version = calculator_crud.get_active_version(db, calculator_id)
    
    return {
        "id": calculator.id,
        "name": calculator.name,
        "category": calculator.category,
        "description": calculator.description,
        "is_active": calculator.is_active,
        "version": active_version.version if active_version else None,
        "definition": active_version.definition_json if active_version else None,
        "created_at": calculator.created_at.isoformat() if calculator.created_at else None
    }


@app.get("/api/calculators/{calculator_id}/versions")
def get_calculator_versions(calculator_id: str, db: Session = Depends(get_db)):
    """Get version history for a calculator."""
    versions = calculator_crud.get_calculator_versions(db, calculator_id)
    
    return {
        "versions": [
            {
                "id": v.id,
                "version": v.version,
                "status": v.status,
                "created_by": v.created_by,
                "approved_by": v.approved_by,
                "created_at": v.created_at.isoformat() if v.created_at else None,
                "approved_at": v.approved_at.isoformat() if v.approved_at else None
            }
            for v in versions
        ],
        "count": len(versions)
    }


@app.post("/api/calculators/{calculator_id}/versions/{version_id}/approve")
def approve_calculator_version(
    calculator_id: str,
    version_id: str,
    approval: CalculatorApprovalRequest,
    db: Session = Depends(get_db)
):
    """Approve or reject a calculator version."""
    if approval.approved:
        version = calculator_crud.approve_version(db, version_id, approved_by="admin")
        if not version:
            raise HTTPException(status_code=404, detail="Version not found")
        return {"message": "Version approved and activated", "version": version.version}
    else:
        # Could add rejection logic here
        return {"message": "Version rejected", "feedback": approval.feedback}


@app.delete("/api/calculators/{calculator_id}")
def delete_calculator(calculator_id: str, db: Session = Depends(get_db)):
    """Delete a calculator and all its versions."""
    success = calculator_crud.delete_calculator(db, calculator_id)
    if not success:
        raise HTTPException(status_code=404, detail="Calculator not found")
    return {"message": "Calculator deleted successfully"}


# ============================================================================
# CALCULATOR EXECUTION ENDPOINTS
# ============================================================================

@app.post("/api/calculators/{calculator_id}/execute", response_model=CalculatorExecutionResult)
def execute_calculator(
    calculator_id: str,
    request: CalculatorExecutionRequest,
    db: Session = Depends(get_db)
):
    """
    Execute a calculator with given inputs.
    Returns full step-by-step calculation trace.
    """
    # Get calculator and active version
    calculator = calculator_crud.get_calculator(db, calculator_id)
    if not calculator:
        raise HTTPException(status_code=404, detail="Calculator not found")
    
    active_version = calculator_crud.get_active_version(db, calculator_id)
    if not active_version:
        raise HTTPException(status_code=400, detail="No active version for this calculator")
    
    # Parse definition
    try:
        definition = CalculatorDefinition(**active_version.definition_json)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Invalid calculator definition: {str(e)}")
    
    # Execute
    engine = CalculatorEngine(definition)
    result = engine.execute(request.inputs)
    
    # Log execution
    if result.success:
        calculator_crud.log_calculation(
            db,
            calculator_id=calculator_id,
            version_id=active_version.id,
            inputs=request.inputs,
            outputs=result.outputs,
            trace=[step.dict() for step in result.steps],
            execution_time_ms=result.execution_time_ms
        )
    
    return result


@app.post("/api/calculators/{calculator_id}/execute-with-explanation")
def execute_calculator_with_explanation(
    calculator_id: str,
    request: CalculatorExecutionRequest,
    db: Session = Depends(get_db)
):
    """
    Execute a calculator and get AI-generated explanation of results.
    """
    # Get calculator and execute
    calculator = calculator_crud.get_calculator(db, calculator_id)
    if not calculator:
        raise HTTPException(status_code=404, detail="Calculator not found")
    
    active_version = calculator_crud.get_active_version(db, calculator_id)
    if not active_version:
        raise HTTPException(status_code=400, detail="No active version for this calculator")
    
    definition = CalculatorDefinition(**active_version.definition_json)
    engine = CalculatorEngine(definition)
    result = engine.execute(request.inputs)
    
    if not result.success:
        return {
            "result": result.dict(),
            "explanation": None,
            "error": result.error
        }
    
    # Generate AI explanation
    explanation_result = generate_result_explanation(
        definition=definition,
        inputs=request.inputs,
        outputs=result.outputs,
        trace=[step.dict() for step in result.steps]
    )
    
    # Log execution
    calculator_crud.log_calculation(
        db,
        calculator_id=calculator_id,
        version_id=active_version.id,
        inputs=request.inputs,
        outputs=result.outputs,
        trace=[step.dict() for step in result.steps],
        execution_time_ms=result.execution_time_ms
    )
    
    return {
        "result": result.dict(),
        "explanation": explanation_result.get("explanation"),
        "success": True
    }


@app.post("/api/calculators/preview-execute", response_model=CalculatorExecutionResult)
def preview_execute_calculator(
    request: PreviewExecutionRequest
):
    """
    Execute a draft calculator definition without saving it.
    Useful for testing generated calculators before approval.
    """
    try:
        engine = CalculatorEngine(request.definition)
        result = engine.execute(request.inputs)
        if not result.success:
            print(f"Preview Execution Failed: {result.error}")
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



# ============================================================================
# SAMPLE CALCULATORS INITIALIZATION
# ============================================================================

@app.post("/api/calculators/init-samples", status_code=201)
def initialize_sample_calculators(db: Session = Depends(get_db)):
    """
    Initialize the system with sample calculators (EMI, SIP, Tax).
    Use this to bootstrap the system with working examples.
    """
    try:
        samples = create_sample_calculators()
        created = []
        
        for definition in samples:
            # Check if already exists
            existing = calculator_crud.get_all_calculators(db)
            if any(c.name == definition.name for c in existing):
                continue
            
            # Create calculator
            calculator = calculator_crud.create_calculator(
                db,
                name=definition.name,
                category=definition.category,
                description=definition.description
            )
            
            # Create and approve version
            version = calculator_crud.create_calculator_version(
                db,
                calculator_id=calculator.id,
                definition=definition,
                created_by="system"
            )
            calculator_crud.approve_version(db, version.id, approved_by="system")
            
            created.append({
                "id": calculator.id,
                "name": definition.name,
                "category": definition.category
            })
        
        return {
            "message": f"Initialized {len(created)} sample calculators",
            "calculators": created
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)

