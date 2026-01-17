"""
SQLAlchemy Database Models for AI-Driven Calculator Platform.
Stores calculator definitions, versions, and execution logs.
"""
from sqlalchemy import (
    Boolean, Column, ForeignKey, Integer, String, Float,
    DateTime, Text, JSON
)
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime
import uuid


def generate_uuid():
    return str(uuid.uuid4())


# ============================================================================
# CALCULATOR MODELS
# ============================================================================

class Calculator(Base):
    """Main calculator entity."""
    __tablename__ = "calculators"
    
    id = Column(String, primary_key=True, index=True, default=generate_uuid)
    name = Column(String, nullable=False, index=True)
    category = Column(String, nullable=False, index=True)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=False)
    current_version = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    versions = relationship("CalculatorVersion", back_populates="calculator", cascade="all, delete-orphan")
    logs = relationship("CalculationLog", back_populates="calculator", cascade="all, delete-orphan")


class CalculatorVersion(Base):
    """Versioned calculator definitions for auditability."""
    __tablename__ = "calculator_versions"
    
    id = Column(String, primary_key=True, index=True, default=generate_uuid)
    calculator_id = Column(String, ForeignKey("calculators.id"), nullable=False)
    version = Column(String, nullable=False)  # e.g., "1.0", "1.1", "2.0"
    definition_json = Column(JSON, nullable=False)  # Full CalculatorDefinition as JSON
    status = Column(String, default="draft")  # draft, pending_approval, approved, deprecated
    created_by = Column(String, nullable=True)  # Admin who created this version
    approved_by = Column(String, nullable=True)  # Admin who approved
    approved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    calculator = relationship("Calculator", back_populates="versions")
    logs = relationship("CalculationLog", back_populates="version")


class CalculationLog(Base):
    """Audit log for all calculator executions."""
    __tablename__ = "calculation_logs"
    
    id = Column(String, primary_key=True, index=True, default=generate_uuid)
    calculator_id = Column(String, ForeignKey("calculators.id"), nullable=False)
    version_id = Column(String, ForeignKey("calculator_versions.id"), nullable=False)
    inputs_json = Column(JSON, nullable=False)  # Input values
    outputs_json = Column(JSON, nullable=False)  # Output values
    trace_json = Column(JSON, nullable=False)  # Full calculation trace
    execution_time_ms = Column(Float, nullable=True)
    user_id = Column(String, nullable=True)  # Optional: who ran this
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    calculator = relationship("Calculator", back_populates="logs")
    version = relationship("CalculatorVersion", back_populates="logs")


# ============================================================================
# AI CONVERSATION MODELS
# ============================================================================

class CalculatorConversation(Base):
    """Stores AI conversation state for calculator generation."""
    __tablename__ = "calculator_conversations"
    
    id = Column(String, primary_key=True, index=True, default=generate_uuid)
    state = Column(String, default="eliciting")  # eliciting, generating, validating, awaiting_approval, completed
    initial_description = Column(Text, nullable=False)
    messages_json = Column(JSON, default=list)  # List of conversation messages
    draft_definition_json = Column(JSON, nullable=True)  # Draft calculator definition
    validation_errors_json = Column(JSON, default=list)  # List of validation errors
    final_calculator_id = Column(String, nullable=True)  # If completed, link to created calculator
    created_by = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
