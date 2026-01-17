"""
Calculator Schemas for AI-Driven Calculator Generation Platform.
Defines Pydantic models for calculator definitions, inputs, steps, and execution.
"""
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Literal
from datetime import datetime
from enum import Enum
import uuid


# ============================================================================
# ENUMS
# ============================================================================

class CalculatorCategory(str, Enum):
    TAX = "Tax"
    INVESTMENT = "Investment"
    LOANS = "Loans"
    INSURANCE = "Insurance"
    RETIREMENT = "Retirement"
    GENERAL = "General"


class InputType(str, Enum):
    NUMBER = "number"
    SELECT = "select"
    TEXT = "text"
    DATE = "date"
    BOOLEAN = "boolean"


class CalculatorStatus(str, Enum):
    DRAFT = "draft"
    PENDING_APPROVAL = "pending_approval"
    APPROVED = "approved"
    DEPRECATED = "deprecated"


class ConversationState(str, Enum):
    ELICITING = "eliciting"
    GENERATING = "generating"
    VALIDATING = "validating"
    AWAITING_APPROVAL = "awaiting_approval"
    COMPLETED = "completed"


# ============================================================================
# CALCULATOR DEFINITION SCHEMAS
# ============================================================================

class CalculatorInput(BaseModel):
    """Defines an input field for a calculator."""
    key: str = Field(..., description="Unique identifier for this input")
    label: str = Field(..., description="User-facing label")
    type: InputType = Field(default=InputType.NUMBER)
    required: bool = Field(default=True)
    options: Optional[List[str]] = Field(default=None, description="Options for select type")
    min: Optional[float] = Field(default=None, description="Minimum value for number type")
    max: Optional[float] = Field(default=None, description="Maximum value for number type")
    default: Optional[Any] = Field(default=None, description="Default value")
    help_text: Optional[str] = Field(default=None, description="Help text for user")
    
    class Config:
        use_enum_values = True


class CalculatorStep(BaseModel):
    """Defines a calculation step."""
    id: str = Field(..., description="Step identifier, used as variable name")
    expression: Optional[str] = Field(default=None, description="Mathematical expression")
    rule_engine: Optional[str] = Field(default=None, description="Reference to pre-built rule engine")
    description: str = Field(..., description="Human-readable description of this step")
    
    class Config:
        use_enum_values = True


class CalculatorDefinition(BaseModel):
    """Complete calculator definition schema."""
    calculator_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str = Field(..., description="Calculator name")
    category: CalculatorCategory = Field(default=CalculatorCategory.GENERAL)
    description: str = Field(..., description="User-facing description")
    inputs: List[CalculatorInput] = Field(default_factory=list)
    steps: List[CalculatorStep] = Field(default_factory=list)
    outputs: List[str] = Field(default_factory=list, description="List of step IDs to include in output")
    help_text: Optional[str] = Field(default=None, description="Detailed help text")
    tags: List[str] = Field(default_factory=list, description="Search tags")
    
    class Config:
        use_enum_values = True


# ============================================================================
# EXECUTION SCHEMAS
# ============================================================================

class CalculatorExecutionRequest(BaseModel):
    """Request to execute a calculator."""
    inputs: Dict[str, Any] = Field(..., description="Input values keyed by input key")


class PreviewExecutionRequest(BaseModel):
    """Request to execute a draft calculator definition."""
    definition: CalculatorDefinition
    inputs: Dict[str, Any]


class StepTrace(BaseModel):
    """Trace of a single calculation step."""
    step_id: str
    description: str
    expression: Optional[str] = None
    rule_engine: Optional[str] = None
    input_values: Dict[str, Any] = Field(default_factory=dict)
    result: Any
    

class CalculatorExecutionResult(BaseModel):
    """Result of calculator execution."""
    calculator_id: str
    calculator_name: str
    inputs: Dict[str, Any]
    steps: List[StepTrace] = Field(default_factory=list)
    outputs: Dict[str, Any] = Field(default_factory=dict)
    execution_time_ms: float
    success: bool = True
    error: Optional[str] = None


# ============================================================================
# AI GENERATION SCHEMAS
# ============================================================================

class CalculatorGenerationRequest(BaseModel):
    """Request to start AI-driven calculator generation."""
    description: str = Field(..., description="Natural language description of desired calculator")
    category: Optional[CalculatorCategory] = None
    jurisdiction: Optional[str] = Field(default="India", description="Tax/legal jurisdiction")


class ConversationMessage(BaseModel):
    """A message in the generation conversation."""
    role: Literal["user", "assistant", "system"]
    content: str
    timestamp: datetime = Field(default_factory=datetime.now)


class ConversationContinueRequest(BaseModel):
    """Request to continue generation conversation."""
    conversation_id: str
    user_message: str


class CalculatorGenerationResponse(BaseModel):
    """Response from calculator generation endpoint."""
    conversation_id: str
    state: ConversationState
    messages: List[ConversationMessage] = Field(default_factory=list)
    draft_calculator: Optional[CalculatorDefinition] = None
    validation_errors: List[str] = Field(default_factory=list)
    is_complete: bool = False

    class Config:
        use_enum_values = True


# ============================================================================
# MANAGEMENT SCHEMAS
# ============================================================================

class CalculatorSummary(BaseModel):
    """Summary info for calculator listing."""
    calculator_id: str
    name: str
    category: CalculatorCategory
    description: str
    is_active: bool
    version: str
    created_at: datetime
    
    class Config:
        use_enum_values = True


class CalculatorVersionInfo(BaseModel):
    """Version information for a calculator."""
    version_id: str
    version: str
    status: CalculatorStatus
    created_by: Optional[str] = None
    created_at: datetime
    definition: CalculatorDefinition
    
    class Config:
        use_enum_values = True


class CalculatorApprovalRequest(BaseModel):
    """Request to approve/reject a calculator."""
    approved: bool
    feedback: Optional[str] = None


# ============================================================================
# EXPLANATION SCHEMAS
# ============================================================================

class ExplanationRequest(BaseModel):
    """Request for AI-generated explanation of results."""
    execution_result: CalculatorExecutionResult
    detail_level: Literal["brief", "detailed", "expert"] = "detailed"


class ExplanationResponse(BaseModel):
    """AI-generated explanation of calculation results."""
    summary: str
    step_explanations: List[str] = Field(default_factory=list)
    recommendations: List[str] = Field(default_factory=list)
    caveats: List[str] = Field(default_factory=list)
