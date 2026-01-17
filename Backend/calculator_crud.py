"""
CRUD Operations for Calculator Platform.
Database operations for calculators, versions, logs, and conversations.
"""
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime

from calculator_models import (
    Calculator, CalculatorVersion, CalculationLog, CalculatorConversation
)
from calculator_schemas import CalculatorDefinition, CalculatorStatus


# ============================================================================
# CALCULATOR CRUD
# ============================================================================

def create_calculator(
    db: Session,
    name: str,
    category: str,
    description: str = None
) -> Calculator:
    """Create a new calculator."""
    calculator = Calculator(
        name=name,
        category=category,
        description=description,
        is_active=False
    )
    db.add(calculator)
    db.commit()
    db.refresh(calculator)
    return calculator


def get_calculator(db: Session, calculator_id: str) -> Optional[Calculator]:
    """Get a calculator by ID."""
    return db.query(Calculator).filter(Calculator.id == calculator_id).first()


def get_calculator_by_slug(db: Session, slug: str) -> Optional[Calculator]:
    """Get a calculator by its slug/calculator_id from definition."""
    # First check if it matches the database ID
    calc = db.query(Calculator).filter(Calculator.id == slug).first()
    if calc:
        return calc
    
    # Otherwise search through versions for matching calculator_id in definition
    versions = db.query(CalculatorVersion).filter(
        CalculatorVersion.status == CalculatorStatus.APPROVED.value
    ).all()
    
    for version in versions:
        if version.definition_json.get('calculator_id') == slug:
            return version.calculator
    
    return None


def get_all_calculators(
    db: Session,
    category: str = None,
    is_active: bool = None
) -> List[Calculator]:
    """Get all calculators with optional filters."""
    query = db.query(Calculator)
    
    if category:
        query = query.filter(Calculator.category == category)
    
    if is_active is not None:
        query = query.filter(Calculator.is_active == is_active)
    
    return query.order_by(Calculator.created_at.desc()).all()


def update_calculator(
    db: Session,
    calculator_id: str,
    updates: Dict[str, Any]
) -> Optional[Calculator]:
    """Update a calculator."""
    calculator = get_calculator(db, calculator_id)
    if not calculator:
        return None
    
    for key, value in updates.items():
        if hasattr(calculator, key):
            setattr(calculator, key, value)
    
    calculator.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(calculator)
    return calculator


def delete_calculator(db: Session, calculator_id: str) -> bool:
    """Delete a calculator and all related data."""
    calculator = get_calculator(db, calculator_id)
    if not calculator:
        return False
    
    db.delete(calculator)
    db.commit()
    return True


def activate_calculator(db: Session, calculator_id: str) -> Optional[Calculator]:
    """Activate a calculator for public use."""
    return update_calculator(db, calculator_id, {"is_active": True})


def deactivate_calculator(db: Session, calculator_id: str) -> Optional[Calculator]:
    """Deactivate a calculator."""
    return update_calculator(db, calculator_id, {"is_active": False})


# ============================================================================
# VERSION CRUD
# ============================================================================

def create_calculator_version(
    db: Session,
    calculator_id: str,
    definition: CalculatorDefinition,
    created_by: str = None
) -> CalculatorVersion:
    """Create a new version of a calculator."""
    # Get existing versions to determine version number
    existing_versions = get_calculator_versions(db, calculator_id)
    
    if existing_versions:
        # Parse latest version and increment
        latest = existing_versions[0]
        parts = latest.version.split('.')
        major, minor = int(parts[0]), int(parts[1]) if len(parts) > 1 else 0
        new_version = f"{major}.{minor + 1}"
    else:
        new_version = "1.0"
    
    version = CalculatorVersion(
        calculator_id=calculator_id,
        version=new_version,
        definition_json=definition.dict(),
        status="draft",
        created_by=created_by
    )
    db.add(version)
    db.commit()
    db.refresh(version)
    return version


def get_calculator_version(db: Session, version_id: str) -> Optional[CalculatorVersion]:
    """Get a specific version by ID."""
    return db.query(CalculatorVersion).filter(CalculatorVersion.id == version_id).first()


def get_calculator_versions(
    db: Session,
    calculator_id: str
) -> List[CalculatorVersion]:
    """Get all versions of a calculator, newest first."""
    return db.query(CalculatorVersion).filter(
        CalculatorVersion.calculator_id == calculator_id
    ).order_by(CalculatorVersion.created_at.desc()).all()


def get_active_version(db: Session, calculator_id: str) -> Optional[CalculatorVersion]:
    """Get the active (approved) version of a calculator."""
    calculator = get_calculator(db, calculator_id)
    if not calculator or not calculator.current_version:
        # Return latest approved version
        return db.query(CalculatorVersion).filter(
            CalculatorVersion.calculator_id == calculator_id,
            CalculatorVersion.status == CalculatorStatus.APPROVED.value
        ).order_by(CalculatorVersion.created_at.desc()).first()
    
    return get_calculator_version(db, calculator.current_version)


def approve_version(
    db: Session,
    version_id: str,
    approved_by: str = None
) -> Optional[CalculatorVersion]:
    """Approve a calculator version and set it as active."""
    version = get_calculator_version(db, version_id)
    if not version:
        return None
    
    # Update version status
    version.status = CalculatorStatus.APPROVED.value
    version.approved_by = approved_by
    version.approved_at = datetime.utcnow()
    
    # Set as current version and activate calculator
    calculator = version.calculator
    calculator.current_version = version_id
    calculator.is_active = True
    calculator.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(version)
    return version


def deprecate_version(db: Session, version_id: str) -> Optional[CalculatorVersion]:
    """Deprecate a calculator version."""
    version = get_calculator_version(db, version_id)
    if not version:
        return None
    
    version.status = CalculatorStatus.DEPRECATED.value
    db.commit()
    db.refresh(version)
    return version


# ============================================================================
# CALCULATION LOG CRUD
# ============================================================================

def log_calculation(
    db: Session,
    calculator_id: str,
    version_id: str,
    inputs: Dict[str, Any],
    outputs: Dict[str, Any],
    trace: List[Dict[str, Any]],
    execution_time_ms: float = None,
    user_id: str = None
) -> CalculationLog:
    """Log a calculation execution."""
    log = CalculationLog(
        calculator_id=calculator_id,
        version_id=version_id,
        inputs_json=inputs,
        outputs_json=outputs,
        trace_json=trace,
        execution_time_ms=execution_time_ms,
        user_id=user_id
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


def get_calculation_logs(
    db: Session,
    calculator_id: str = None,
    user_id: str = None,
    limit: int = 100
) -> List[CalculationLog]:
    """Get calculation logs with optional filters."""
    query = db.query(CalculationLog)
    
    if calculator_id:
        query = query.filter(CalculationLog.calculator_id == calculator_id)
    
    if user_id:
        query = query.filter(CalculationLog.user_id == user_id)
    
    return query.order_by(CalculationLog.created_at.desc()).limit(limit).all()


# ============================================================================
# CONVERSATION CRUD
# ============================================================================

def create_conversation(
    db: Session,
    initial_description: str,
    created_by: str = None
) -> CalculatorConversation:
    """Create a new calculator generation conversation."""
    conversation = CalculatorConversation(
        initial_description=initial_description,
        state="eliciting",
        messages_json=[],
        created_by=created_by
    )
    db.add(conversation)
    db.commit()
    db.refresh(conversation)
    return conversation


def get_conversation(db: Session, conversation_id: str) -> Optional[CalculatorConversation]:
    """Get a conversation by ID."""
    return db.query(CalculatorConversation).filter(
        CalculatorConversation.id == conversation_id
    ).first()


def update_conversation(
    db: Session,
    conversation_id: str,
    updates: Dict[str, Any]
) -> Optional[CalculatorConversation]:
    """Update a conversation."""
    conversation = get_conversation(db, conversation_id)
    if not conversation:
        return None
    
    for key, value in updates.items():
        if hasattr(conversation, key):
            setattr(conversation, key, value)
    
    conversation.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(conversation)
    return conversation


def add_conversation_message(
    db: Session,
    conversation_id: str,
    role: str,
    content: str
) -> Optional[CalculatorConversation]:
    """Add a message to a conversation."""
    conversation = get_conversation(db, conversation_id)
    if not conversation:
        return None
    
    messages = conversation.messages_json or []
    messages.append({
        "role": role,
        "content": content,
        "timestamp": datetime.utcnow().isoformat()
    })
    
    conversation.messages_json = messages
    conversation.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(conversation)
    return conversation


def complete_conversation(
    db: Session,
    conversation_id: str,
    calculator_id: str
) -> Optional[CalculatorConversation]:
    """Mark conversation as completed with created calculator."""
    return update_conversation(db, conversation_id, {
        "state": "completed",
        "final_calculator_id": calculator_id
    })
