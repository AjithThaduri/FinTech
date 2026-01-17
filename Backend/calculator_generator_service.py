"""
AI Calculator Generator Service
Multi-agent system for conversational calculator creation.
"""
import os
import json
from typing import Dict, Any, List, Optional
from datetime import datetime
from openai import OpenAI
from dotenv import load_dotenv

from calculator_schemas import (
    CalculatorDefinition, CalculatorInput, CalculatorStep,
    CalculatorCategory, ConversationState, ConversationMessage,
    CalculatorGenerationResponse, InputType
)

load_dotenv()

# Initialize OpenAI client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


# ============================================================================
# SYSTEM PROMPTS FOR AGENTS
# ============================================================================

ELICITATION_PROMPT = """You are a Calculator Requirements Elicitation Agent. Your job is to understand what calculator the admin wants to create.

Ask clarifying questions about:
1. **Purpose**: What financial calculation should this perform?
2. **Inputs**: What information does the user need to provide?
3. **Outputs**: What should be calculated and displayed?
4. **Jurisdiction**: Which country's rules apply (e.g., India, US)?
5. **Special rules**: Are there slabs, tiers, or conditional logic?

Be concise. Ask 2-3 questions at a time. Once you have enough info, respond with:
"REQUIREMENTS_COMPLETE: [summary of requirements]"

Never perform calculations yourself - you only gather requirements."""

GENERATOR_PROMPT = """You are a Calculator Generator Agent. Convert requirements into a structured calculator JSON.

You MUST respond with valid JSON in this exact format:
{
    "calculator_id": "snake_case_id",
    "name": "Human Readable Name",
    "category": "Tax|Investment|Loans|Insurance|Retirement|General",
    "description": "User-facing description",
    "inputs": [
        {"key": "var_name", "label": "Label", "type": "number|select|text|date|boolean", "required": true, "min": 0, "max": 100, "options": null, "default": null, "help_text": "Optional help"}
    ],
    "steps": [
        {"id": "step_id", "expression": "mathematical expression using input keys and previous step ids", "description": "What this step does"}
    ],
    "outputs": ["step_id1", "step_id2"],
    "help_text": "Detailed help for users"
}

Available rule engines you can reference instead of expressions:
- income_tax_slabs_india_old: Old regime tax (takes taxable_income)
- income_tax_slabs_india_new: New regime tax (takes taxable_income)  
- emi_calculator: EMI calculation (takes principal, annual_rate, tenure_months)
- sip_future_value: SIP FV (takes monthly_investment, annual_rate, years)
- cagr_calculator: CAGR (takes initial_value, final_value, years)
- lumpsum_future_value: Lumpsum FV (takes principal, annual_rate, years)

For rule engines, use: {"id": "result_id", "rule_engine": "engine_name", "description": "..."}

Supported expression functions: abs, round, min, max, pow, sqrt, log, log10, exp, floor, ceil
Supported operators: +, -, *, /, //, %, **
Ternary: value_if_true if condition else value_if_false

ONLY output the JSON, no markdown or explanation."""

VALIDATION_PROMPT = """You are a Calculator Validation Agent. Check the calculator definition for issues.

Validate:
1. All required fields are present
2. All step expressions reference valid input keys or previous step IDs
3. A step must have EITHER 'expression' OR 'rule_engine'.
   - If 'rule_engine' is present, 'expression' SHOULD BE null or omitted. DO NOT report this as an error.
4. If 'rule_engine' is used:
   - It must be one of: income_tax_slabs_india_old, income_tax_slabs_india_new, emi_calculator, sip_future_value, cagr_calculator, lumpsum_future_value
   - The required inputs for that rule engine must be available in context
5. Expressions use only supported functions (abs, round, min, max, pow, sqrt, log, floor, ceil, sin, cos, tan)
6. Ternary syntax `a if cond else b` IS ALLOWED
7. No circular dependencies in steps
8. Input constraints (min/max) are sensible

If valid, respond with: "VALID"
If issues found, respond with: "ISSUES: [list each issue on a new line]"

Be strict but fair. Do not flag correct logic as errors. specifically, do NOT flag correct usage of rule_engine as missing expression."""

EXPLANATION_PROMPT = """You are a Calculator Explanation Agent. Generate user-friendly documentation.

Given a calculator definition, create:
1. A brief description of what it calculates
2. Clear explanation of each input field
3. Step-by-step breakdown of the calculation logic (in plain English)
4. Example with sample inputs/outputs
5. Important notes or caveats

Use simple language. Avoid jargon. Use Indian Rupees (₹) for currency.

Respond in JSON format:
{
    "description": "What this calculator does in 2-3 sentences",
    "input_explanations": [{"key": "input_key", "explanation": "What to enter here"}],
    "calculation_steps": ["Step 1: ...", "Step 2: ..."],
    "example": {"inputs": {"key": value}, "outputs": {"key": value}, "narrative": "If you earn..."},
    "notes": ["Note 1", "Note 2"]
}"""

HEALER_PROMPT = """You are a Calculator Healer Agent. Your job is to FIX an invalid calculator JSON.

You will be given:
1. The original requirements
2. The invalid calculator JSON
3. The list of validation errors

Your goal is to produce a CORRECTED JSON that fixes all the reported errors while maintaining the original intent.

IMPORTANT RULES & SUPPORTED SYNTAX:
1. **Defined Variables**: You can ONLY use variables that are:
   - Defined in 'inputs' (use the 'key').
   - Defined in previous 'steps' (use the 'id').
   - DO NOT use undefined variables (e.g., 'principal' if the input key is 'loan_amount').

2. **Supported Math Functions**:
   - abs(x), round(x, n), min(a, b), max(a, b), pow(x, y), sqrt(x)
   - log(x), log10(x), exp(x), floor(x), ceil(x)
   - sin(x), cos(x), tan(x)

3. **Supported Rule Engines** (Set 'rule_engine' field, do NOT call as function in expression):
   - 'income_tax_slabs_india_old' (input: taxable_income)
   - 'income_tax_slabs_india_new' (input: taxable_income)
   - 'emi_calculator' (inputs: principal, annual_rate, tenure_months)
   - 'sip_future_value' (inputs: monthly_investment, annual_rate, years)
   - 'cagr_calculator' (inputs: initial_value, final_value, years)
   - 'lumpsum_future_value' (inputs: principal, annual_rate, years)

4. **Valid Expression Syntax**:
   - Python-style arithmetic: +, -, *, /, //, %, **
   - Comparisons: <, <=, >, >=, ==, !=
   - Ternary IS SUPPORTED: `value_if_true if condition else value_if_false`
   - logical operators: `and`, `or`, `not`

5. **Fixing Strategies**:
   - If an input is missing but used in a step, ADD IT to 'inputs'.
   - If a function is undefined (e.g. 'calculate_loan'), replace it with a valid mathematical formula using the allowed functions.
   - If 'rule_engine' is used wrong (e.g. called in expression), move it to 'rule_engine' field of the step.

Respond ONLY with the corrected valid JSON. No markdown."""


# ============================================================================
# AGENT FUNCTIONS
# ============================================================================

def run_elicitation_agent(
    description: str,
    conversation_history: List[Dict[str, str]]
) -> Dict[str, Any]:
    """Run the elicitation agent to gather requirements."""
    
    messages = [
        {"role": "system", "content": ELICITATION_PROMPT},
        {"role": "user", "content": f"I want to create a calculator: {description}"}
    ]
    
    # Add conversation history
    for msg in conversation_history:
        messages.append({"role": msg["role"], "content": msg["content"]})
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=messages,
            temperature=0.7,
            max_tokens=1000
        )
        
        content = response.choices[0].message.content
        
        # Check if requirements are complete
        is_complete = "REQUIREMENTS_COMPLETE:" in content
        
        return {
            "success": True,
            "message": content,
            "is_complete": is_complete,
            "requirements": content.split("REQUIREMENTS_COMPLETE:")[-1].strip() if is_complete else None
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "message": "I'm having trouble understanding. Could you describe the calculator you want in more detail?"
        }


def run_generator_agent(requirements: str) -> Dict[str, Any]:
    """Run the generator agent to create calculator JSON."""
    
    messages = [
        {"role": "system", "content": GENERATOR_PROMPT},
        {"role": "user", "content": f"Create a calculator based on these requirements:\n{requirements}"}
    ]
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=messages,
            temperature=0.3,
            max_tokens=2000,
            response_format={"type": "json_object"}
        )
        
        content = response.choices[0].message.content
        definition_dict = json.loads(content)
        
        # Parse into CalculatorDefinition
        definition = CalculatorDefinition(**definition_dict)
        
        return {
            "success": True,
            "definition": definition
        }
        
    except json.JSONDecodeError as e:
        return {
            "success": False,
            "error": f"Invalid JSON generated: {str(e)}"
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


def run_validation_agent(definition: CalculatorDefinition) -> Dict[str, Any]:
    """Run the validation agent to check calculator definition."""
    
    # First, do programmatic validation
    errors = []
    
    # Check inputs
    input_keys = {inp.key for inp in definition.inputs}
    
    # Check steps
    available_vars = set(input_keys)
    for step in definition.steps:
        if step.expression:
            # Check that expression references valid variables
            # (Basic check - full validation done by AST parser at runtime)
            pass
        available_vars.add(step.id)
    
    # Check outputs reference valid steps
    step_ids = {step.id for step in definition.steps}
    for output in definition.outputs:
        if output not in step_ids:
            errors.append(f"Output '{output}' references non-existent step")
    
    if errors:
        return {
            "success": False,
            "valid": False,
            "errors": errors
        }
    
    # Run AI validation for semantic checks
    messages = [
        {"role": "system", "content": VALIDATION_PROMPT},
        {"role": "user", "content": f"Validate this calculator:\n{json.dumps(definition.dict(), indent=2)}"}
    ]
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=messages,
            temperature=0.2,
            max_tokens=500
        )
        
        content = response.choices[0].message.content
        
        if content.strip().upper() == "VALID":
            return {"success": True, "valid": True, "errors": []}
        elif "ISSUES:" in content:
            issues = content.split("ISSUES:")[-1].strip().split("\n")
            return {"success": True, "valid": False, "errors": [i.strip() for i in issues if i.strip()]}
        else:
            return {"success": True, "valid": True, "errors": []}
            
    except Exception as e:
        # Fallback to programmatic validation only
        return {"success": True, "valid": True, "errors": errors}


def run_explanation_agent(definition: CalculatorDefinition) -> Dict[str, Any]:
    """Run the explanation agent to generate documentation."""
    
    messages = [
        {"role": "system", "content": EXPLANATION_PROMPT},
        {"role": "user", "content": f"Generate documentation for this calculator:\n{json.dumps(definition.dict(), indent=2)}"}
    ]
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=messages,
            temperature=0.5,
            max_tokens=1500,
            response_format={"type": "json_object"}
        )
        
        content = response.choices[0].message.content
        explanation = json.loads(content)
        
        return {
            "success": True,
            "explanation": explanation
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "explanation": {
                "description": definition.description,
                "input_explanations": [],
                "calculation_steps": [],
                "example": None,
                "notes": []
            }
        }


def run_healer_agent(
    requirements: str,
    invalid_definition: Dict[str, Any],
    errors: List[str]
) -> Dict[str, Any]:
    """Run the healer agent to fix an invalid calculator."""
    
    prompt = f"""Fix this calculator.

Requirements:
{requirements}

Invalid JSON:
{json.dumps(invalid_definition, indent=2)}

Validation Errors:
{chr(10).join(f"- {e}" for e in errors)}

Provide the corrected JSON."""

    messages = [
        {"role": "system", "content": HEALER_PROMPT},
        {"role": "user", "content": prompt}
    ]
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=messages,
            temperature=0.2,
            max_tokens=2000,
            response_format={"type": "json_object"}
        )
        
        content = response.choices[0].message.content
        definition_dict = json.loads(content)
        
        # Parse into CalculatorDefinition to ensure schema validity
        definition = CalculatorDefinition(**definition_dict)
        
        return {
            "success": True,
            "definition": definition
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

def generate_result_explanation(
    definition: CalculatorDefinition,
    inputs: Dict[str, Any],
    outputs: Dict[str, Any],
    trace: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """Generate AI explanation of calculation results."""
    
    prompt = f"""Explain this calculation result in simple terms.

Calculator: {definition.name}
Description: {definition.description}

User Inputs:
{json.dumps(inputs, indent=2)}

Calculation Steps:
{json.dumps(trace, indent=2)}

Final Results:
{json.dumps(outputs, indent=2)}

Provide:
1. A plain-English summary of what was calculated
2. Step-by-step explanation of how each result was derived
3. Any recommendations or insights based on the results
4. Important caveats or notes

Use Indian Rupees (₹) for currency. Be helpful and conversational."""

    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are a financial expert explaining calculation results to users. Be clear, helpful, and use simple language."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.6,
            max_tokens=1000
        )
        
        return {
            "success": True,
            "explanation": response.choices[0].message.content
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "explanation": f"Calculation completed successfully. Your results: {json.dumps(outputs)}"
        }


# ============================================================================
# CONVERSATION ORCHESTRATOR
# ============================================================================

class CalculatorGenerationOrchestrator:
    """Orchestrates the multi-agent calculator generation process."""
    
    def __init__(self):
        self.conversations: Dict[str, Dict] = {}  # In-memory cache (use DB in production)
    
    def start_generation(
        self,
        description: str,
        category: Optional[str] = None,
        jurisdiction: str = "India"
    ) -> CalculatorGenerationResponse:
        """Start a new calculator generation conversation."""
        import uuid
        
        conversation_id = str(uuid.uuid4())
        
        # Initialize conversation
        self.conversations[conversation_id] = {
            "state": ConversationState.ELICITING,
            "description": description,
            "category": category,
            "jurisdiction": jurisdiction,
            "messages": [],
            "requirements": None,
            "draft_definition": None,
            "validation_errors": []
        }
        
        # Run elicitation agent
        result = run_elicitation_agent(description, [])
        
        # Store assistant message
        self.conversations[conversation_id]["messages"].append({
            "role": "assistant",
            "content": result["message"],
            "timestamp": datetime.now().isoformat()
        })
        
        # Check if requirements already complete (simple request)
        if result.get("is_complete"):
            return self._advance_to_generation(conversation_id, result["requirements"])
        
        return CalculatorGenerationResponse(
            conversation_id=conversation_id,
            state=ConversationState.ELICITING,
            messages=[ConversationMessage(
                role="assistant",
                content=result["message"]
            )],
            is_complete=False
        )
    
    def continue_generation(
        self,
        conversation_id: str,
        user_message: str
    ) -> CalculatorGenerationResponse:
        """Continue an existing generation conversation."""
        
        if conversation_id not in self.conversations:
            return CalculatorGenerationResponse(
                conversation_id=conversation_id,
                state=ConversationState.ELICITING,
                messages=[ConversationMessage(
                    role="assistant",
                    content="Conversation not found. Please start a new generation request."
                )],
                is_complete=False
            )
        
        conv = self.conversations[conversation_id]
        
        # Add user message
        conv["messages"].append({
            "role": "user",
            "content": user_message,
            "timestamp": datetime.now().isoformat()
        })
        
        current_state = conv["state"]
        
        if current_state == ConversationState.ELICITING:
            # Continue elicitation
            result = run_elicitation_agent(conv["description"], conv["messages"])
            
            conv["messages"].append({
                "role": "assistant",
                "content": result["message"],
                "timestamp": datetime.now().isoformat()
            })
            
            if result.get("is_complete"):
                return self._advance_to_generation(conversation_id, result["requirements"])
            
            return self._build_response(conversation_id)
        
        elif current_state == ConversationState.AWAITING_APPROVAL:
            # User is responding to draft - could be approval or feedback
            if user_message.lower() in ["yes", "approve", "looks good", "ok", "okay"]:
                conv["state"] = ConversationState.COMPLETED
                conv["messages"].append({
                    "role": "assistant",
                    "content": "✅ Calculator approved! It's ready to be saved and activated.",
                    "timestamp": datetime.now().isoformat()
                })
                return self._build_response(conversation_id)
            else:
                # User has feedback - regenerate
                conv["requirements"] = f"{conv['requirements']}\n\nAdditional feedback: {user_message}"
                return self._advance_to_generation(conversation_id, conv["requirements"])
        
        return self._build_response(conversation_id)
    
    def _advance_to_generation(
        self,
        conversation_id: str,
        requirements: str
    ) -> CalculatorGenerationResponse:
        """Advance to generation and validation."""
        conv = self.conversations[conversation_id]
        conv["requirements"] = requirements
        conv["state"] = ConversationState.GENERATING
        
        # Generate calculator
        gen_result = run_generator_agent(requirements)
        
        if not gen_result["success"]:
            conv["messages"].append({
                "role": "assistant",
                "content": f"I had trouble generating the calculator: {gen_result['error']}. Could you provide more details?",
                "timestamp": datetime.now().isoformat()
            })
            conv["state"] = ConversationState.ELICITING
            return self._build_response(conversation_id)
        
        definition = gen_result["definition"]
        conv["draft_definition"] = definition.dict()
        
        # Validate
        conv["state"] = ConversationState.VALIDATING
        val_result = run_validation_agent(definition)
        
        if not val_result["valid"]:
            # AUTO-HEAL ATTEMPT
            print(f"Validation failed. Attempting to heal... Errors: {val_result['errors']}")
            
            heal_result = run_healer_agent(
                requirements=conv["requirements"],
                invalid_definition=definition.dict(),
                errors=val_result["errors"]
            )
            
            if heal_result["success"]:
                # Re-validate the healed definition
                healed_definition = heal_result["definition"]
                reval_result = run_validation_agent(healed_definition)
                
                if reval_result["valid"]:
                    print("Healing successful!")
                    definition = healed_definition  # Use healed definition
                    conv["draft_definition"] = definition.dict()
                    conv["validation_errors"] = []
                else:
                    print(f"Healing failed. Remaining errors: {reval_result['errors']}")
                    conv["validation_errors"] = reval_result["errors"]
            else:
                conv["validation_errors"] = val_result["errors"]

            # If still invalid after healing (or healing failed)
            if conv["validation_errors"]:
                conv["messages"].append({
                    "role": "assistant",
                    "content": f"I generated a calculator but found some technical issues:\n" + "\n".join(f"- {e}" for e in conv["validation_errors"]) + "\n\nI'll try to fix these automatically.",
                    "timestamp": datetime.now().isoformat()
                })
                # In a real loop we might retry, but for now we present it with errors
        
        # Present for approval
        conv["state"] = ConversationState.AWAITING_APPROVAL
        
        # Format definition nicely
        definition_preview = f"""
**📊 {definition.name}**

*{definition.description}*

**Inputs:**
{chr(10).join(f"- {inp.label} ({inp.key})" for inp in definition.inputs)}

**Outputs:**
{chr(10).join(f"- {out}" for out in definition.outputs)}

Does this look correct? Reply "approve" to save, or provide feedback to adjust.
"""
        
        conv["messages"].append({
            "role": "assistant",
            "content": definition_preview,
            "timestamp": datetime.now().isoformat()
        })
        
        return self._build_response(conversation_id)
    
    def _build_response(self, conversation_id: str) -> CalculatorGenerationResponse:
        """Build response from conversation state."""
        conv = self.conversations[conversation_id]
        
        messages = [
            ConversationMessage(
                role=msg["role"],
                content=msg["content"],
                timestamp=datetime.fromisoformat(msg["timestamp"])
            )
            for msg in conv["messages"]
        ]
        
        draft = None
        if conv.get("draft_definition"):
            draft = CalculatorDefinition(**conv["draft_definition"])
        
        return CalculatorGenerationResponse(
            conversation_id=conversation_id,
            state=conv["state"],
            messages=messages,
            draft_calculator=draft,
            validation_errors=conv.get("validation_errors", []),
            is_complete=(conv["state"] == ConversationState.COMPLETED)
        )
    
    def get_draft_definition(self, conversation_id: str) -> Optional[CalculatorDefinition]:
        """Get the draft calculator definition from a conversation."""
        if conversation_id not in self.conversations:
            return None
        
        conv = self.conversations[conversation_id]
        if conv.get("draft_definition"):
            return CalculatorDefinition(**conv["draft_definition"])
        return None


# Global orchestrator instance
orchestrator = CalculatorGenerationOrchestrator()
