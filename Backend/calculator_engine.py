"""
Calculator Execution Engine
Deterministic execution of calculator definitions with full traceability.
No eval() - uses safe AST-based expression parsing.
"""
import ast
import operator
import math
from typing import Dict, Any, List, Optional, Callable
from datetime import datetime
import time

from calculator_schemas import (
    CalculatorDefinition, 
    CalculatorStep,
    CalculatorExecutionResult, 
    StepTrace
)


# ============================================================================
# SAFE EXPRESSION EVALUATOR
# ============================================================================

class SafeExpressionEvaluator:
    """
    Safe mathematical expression evaluator using AST parsing.
    No eval() or exec() - only whitelisted operations.
    """
    
    # Allowed binary operators
    OPERATORS = {
        ast.Add: operator.add,
        ast.Sub: operator.sub,
        ast.Mult: operator.mul,
        ast.Div: operator.truediv,
        ast.FloorDiv: operator.floordiv,
        ast.Mod: operator.mod,
        ast.Pow: operator.pow,
        ast.USub: operator.neg,
        ast.UAdd: operator.pos,
    }
    
    # Allowed comparison operators
    COMPARISONS = {
        ast.Eq: operator.eq,
        ast.NotEq: operator.ne,
        ast.Lt: operator.lt,
        ast.LtE: operator.le,
        ast.Gt: operator.gt,
        ast.GtE: operator.ge,
    }
    
    # Allowed functions
    FUNCTIONS = {
        'abs': abs,
        'round': round,
        'min': min,
        'max': max,
        'pow': pow,
        'sqrt': math.sqrt,
        'log': math.log,
        'log10': math.log10,
        'exp': math.exp,
        'floor': math.floor,
        'ceil': math.ceil,
        'sin': math.sin,
        'cos': math.cos,
        'tan': math.tan,
    }
    
    def __init__(self, context: Dict[str, Any] = None):
        self.context = context or {}
    
    def evaluate(self, expression: str) -> Any:
        """Safely evaluate a mathematical expression."""
        try:
            tree = ast.parse(expression, mode='eval')
            return self._eval_node(tree.body)
        except Exception as e:
            raise ValueError(f"Invalid expression '{expression}': {str(e)}")
    
    def _eval_node(self, node: ast.AST) -> Any:
        """Recursively evaluate AST nodes."""
        if isinstance(node, ast.Constant):  # Python 3.8+
            return node.value
        
        elif isinstance(node, ast.Num):  # Python 3.7 compatibility
            return node.n
        
        elif isinstance(node, ast.Str):  # Python 3.7 compatibility
            return node.s
        
        elif isinstance(node, ast.Name):
            # Variable lookup
            name = node.id
            if name in self.context:
                return self.context[name]
            elif name in self.FUNCTIONS:
                return self.FUNCTIONS[name]
            elif name == 'True':
                return True
            elif name == 'False':
                return False
            else:
                raise ValueError(f"Unknown variable: {name}")
        
        elif isinstance(node, ast.BinOp):
            left = self._eval_node(node.left)
            right = self._eval_node(node.right)
            op = self.OPERATORS.get(type(node.op))
            if op is None:
                raise ValueError(f"Unsupported operator: {type(node.op).__name__}")
            return op(left, right)
        
        elif isinstance(node, ast.UnaryOp):
            operand = self._eval_node(node.operand)
            op = self.OPERATORS.get(type(node.op))
            if op is None:
                raise ValueError(f"Unsupported unary operator: {type(node.op).__name__}")
            return op(operand)
        
        elif isinstance(node, ast.Compare):
            # Handle comparison chains like a < b < c
            left = self._eval_node(node.left)
            for op, comparator in zip(node.ops, node.comparators):
                right = self._eval_node(comparator)
                cmp_func = self.COMPARISONS.get(type(op))
                if cmp_func is None:
                    raise ValueError(f"Unsupported comparison: {type(op).__name__}")
                if not cmp_func(left, right):
                    return False
                left = right
            return True
        
        elif isinstance(node, ast.Call):
            func = self._eval_node(node.func)
            args = [self._eval_node(arg) for arg in node.args]
            if callable(func):
                return func(*args)
            raise ValueError(f"Not a callable: {func}")
        
        elif isinstance(node, ast.IfExp):
            # Ternary: a if condition else b
            condition = self._eval_node(node.test)
            if condition:
                return self._eval_node(node.body)
            else:
                return self._eval_node(node.orelse)
        
        elif isinstance(node, ast.BoolOp):
            # and / or
            if isinstance(node.op, ast.And):
                for value in node.values:
                    if not self._eval_node(value):
                        return False
                return True
            elif isinstance(node.op, ast.Or):
                for value in node.values:
                    if self._eval_node(value):
                        return True
                return False
        
        else:
            raise ValueError(f"Unsupported expression type: {type(node).__name__}")


# ============================================================================
# PRE-BUILT RULE ENGINES
# ============================================================================

class RuleEngines:
    """Collection of pre-built rule engines for complex calculations."""
    
    @staticmethod
    def income_tax_slabs_india_old(taxable_income: float, **kwargs) -> float:
        """
        Indian Income Tax - Old Regime (FY 2024-25)
        Standard deduction of 50,000 assumed already applied.
        """
        if taxable_income <= 250000:
            return 0
        elif taxable_income <= 500000:
            return (taxable_income - 250000) * 0.05
        elif taxable_income <= 1000000:
            return 12500 + (taxable_income - 500000) * 0.20
        else:
            return 12500 + 100000 + (taxable_income - 1000000) * 0.30
    
    @staticmethod
    def income_tax_slabs_india_new(taxable_income: float, **kwargs) -> float:
        """
        Indian Income Tax - New Regime (FY 2024-25)
        With standard deduction of 75,000.
        """
        # Apply standard deduction
        taxable = max(0, taxable_income - 75000)
        
        if taxable <= 300000:
            return 0
        elif taxable <= 700000:
            return (taxable - 300000) * 0.05
        elif taxable <= 1000000:
            return 20000 + (taxable - 700000) * 0.10
        elif taxable <= 1200000:
            return 20000 + 30000 + (taxable - 1000000) * 0.15
        elif taxable <= 1500000:
            return 20000 + 30000 + 30000 + (taxable - 1200000) * 0.20
        else:
            return 20000 + 30000 + 30000 + 60000 + (taxable - 1500000) * 0.30
    
    @staticmethod
    def emi_calculator(principal: float, annual_rate: float, tenure_months: int, **kwargs) -> float:
        """
        EMI Calculation using standard formula.
        EMI = P * r * (1+r)^n / ((1+r)^n - 1)
        """
        if annual_rate == 0:
            return principal / tenure_months
        
        monthly_rate = annual_rate / 12 / 100
        emi = principal * monthly_rate * pow(1 + monthly_rate, tenure_months) / (pow(1 + monthly_rate, tenure_months) - 1)
        return round(emi, 2)
    
    @staticmethod
    def sip_future_value(monthly_investment: float, annual_rate: float, years: int, **kwargs) -> float:
        """
        SIP Future Value calculation.
        FV = P * [(1+r)^n - 1] / r * (1+r)
        """
        if annual_rate == 0:
            return monthly_investment * years * 12
        
        monthly_rate = annual_rate / 12 / 100
        months = years * 12
        fv = monthly_investment * ((pow(1 + monthly_rate, months) - 1) / monthly_rate) * (1 + monthly_rate)
        return round(fv, 2)
    
    @staticmethod
    def cagr_calculator(initial_value: float, final_value: float, years: float, **kwargs) -> float:
        """
        CAGR = (FV/PV)^(1/n) - 1
        Returns as percentage.
        """
        if years == 0 or initial_value == 0:
            return 0
        
        cagr = (pow(final_value / initial_value, 1 / years) - 1) * 100
        return round(cagr, 2)
    
    @staticmethod
    def lumpsum_future_value(principal: float, annual_rate: float, years: int, **kwargs) -> float:
        """
        Lumpsum Future Value.
        FV = PV * (1 + r)^n
        """
        rate = annual_rate / 100
        fv = principal * pow(1 + rate, years)
        return round(fv, 2)
    
    # Registry of available rule engines
    REGISTRY: Dict[str, Callable] = {}


# Populate registry
RuleEngines.REGISTRY = {
    'income_tax_slabs_india_old': RuleEngines.income_tax_slabs_india_old,
    'income_tax_slabs_india_new': RuleEngines.income_tax_slabs_india_new,
    'emi_calculator': RuleEngines.emi_calculator,
    'sip_future_value': RuleEngines.sip_future_value,
    'cagr_calculator': RuleEngines.cagr_calculator,
    'lumpsum_future_value': RuleEngines.lumpsum_future_value,
}


# ============================================================================
# CALCULATOR EXECUTION ENGINE
# ============================================================================

class CalculatorEngine:
    """
    Deterministic calculator execution engine.
    Executes calculator definitions and produces full execution traces.
    """
    
    def __init__(self, definition: CalculatorDefinition):
        self.definition = definition
        self.context: Dict[str, Any] = {}
        self.trace: List[StepTrace] = []
    
    def validate_inputs(self, inputs: Dict[str, Any]) -> List[str]:
        """Validate inputs against calculator definition."""
        errors = []
        
        for input_def in self.definition.inputs:
            key = input_def.key
            value = inputs.get(key)
            
            # Check required
            if input_def.required and value is None:
                errors.append(f"Missing required input: {input_def.label} ({key})")
                continue
            
            if value is None:
                continue
            
            # Type validation
            if input_def.type == "number":
                try:
                    value = float(value)
                    if input_def.min is not None and value < input_def.min:
                        errors.append(f"{input_def.label} must be >= {input_def.min}")
                    if input_def.max is not None and value > input_def.max:
                        errors.append(f"{input_def.label} must be <= {input_def.max}")
                except (ValueError, TypeError):
                    errors.append(f"{input_def.label} must be a number")
            
            elif input_def.type == "select":
                if input_def.options and value not in input_def.options:
                    errors.append(f"{input_def.label} must be one of: {', '.join(input_def.options)}")
        
        return errors
    
    def execute(self, inputs: Dict[str, Any]) -> CalculatorExecutionResult:
        """
        Execute the calculator with given inputs.
        Returns full execution trace and results.
        """
        start_time = time.time()
        self.context = {}
        self.trace = []
        
        # Validate inputs
        errors = self.validate_inputs(inputs)
        if errors:
            return CalculatorExecutionResult(
                calculator_id=self.definition.calculator_id,
                calculator_name=self.definition.name,
                inputs=inputs,
                success=False,
                error="; ".join(errors),
                execution_time_ms=0
            )
        
        try:
            # Load inputs into context
            for input_def in self.definition.inputs:
                key = input_def.key
                value = inputs.get(key, input_def.default)
                if value is not None:
                    if input_def.type == "number":
                        value = float(value)
                    self.context[key] = value
            
            # Execute steps
            for step in self.definition.steps:
                step_trace = self._execute_step(step)
                self.trace.append(step_trace)
            
            # Collect outputs
            outputs = {}
            for output_key in self.definition.outputs:
                if output_key in self.context:
                    outputs[output_key] = self.context[output_key]
            
            execution_time = (time.time() - start_time) * 1000
            
            return CalculatorExecutionResult(
                calculator_id=self.definition.calculator_id,
                calculator_name=self.definition.name,
                inputs=inputs,
                steps=self.trace,
                outputs=outputs,
                execution_time_ms=round(execution_time, 2),
                success=True
            )
        
        except Exception as e:
            execution_time = (time.time() - start_time) * 1000
            return CalculatorExecutionResult(
                calculator_id=self.definition.calculator_id,
                calculator_name=self.definition.name,
                inputs=inputs,
                steps=self.trace,
                success=False,
                error=str(e),
                execution_time_ms=round(execution_time, 2)
            )
    
    def _execute_step(self, step: CalculatorStep) -> StepTrace:
        """Execute a single calculation step."""
        input_values = dict(self.context)  # Snapshot of current context
        result = None
        
        if step.expression:
            # Use safe expression evaluator
            evaluator = SafeExpressionEvaluator(self.context)
            result = evaluator.evaluate(step.expression)
        
        elif step.rule_engine:
            # Use pre-built rule engine
            if step.rule_engine not in RuleEngines.REGISTRY:
                raise ValueError(f"Unknown rule engine: {step.rule_engine}")
            
            rule_func = RuleEngines.REGISTRY[step.rule_engine]
            result = rule_func(**self.context)
        
        else:
            raise ValueError(f"Step '{step.id}' has no expression or rule_engine")
        
        # Store result in context for subsequent steps
        self.context[step.id] = result
        
        return StepTrace(
            step_id=step.id,
            description=step.description,
            expression=step.expression,
            rule_engine=step.rule_engine,
            input_values=input_values,
            result=result
        )


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def create_sample_calculators() -> List[CalculatorDefinition]:
    """Create sample calculator definitions for testing."""
    
    emi_calculator = CalculatorDefinition(
        calculator_id="emi_calculator",
        name="EMI Calculator",
        category="Loans",
        description="Calculate Equated Monthly Installment for loans",
        inputs=[
            {"key": "principal", "label": "Loan Amount (₹)", "type": "number", "required": True, "min": 1000},
            {"key": "annual_rate", "label": "Annual Interest Rate (%)", "type": "number", "required": True, "min": 0.1, "max": 50},
            {"key": "tenure_months", "label": "Loan Tenure (Months)", "type": "number", "required": True, "min": 1, "max": 360}
        ],
        steps=[
            {"id": "monthly_rate", "expression": "annual_rate / 12 / 100", "description": "Convert annual rate to monthly decimal"},
            {"id": "emi", "expression": "principal * monthly_rate * pow(1 + monthly_rate, tenure_months) / (pow(1 + monthly_rate, tenure_months) - 1)", "description": "EMI using standard formula"},
            {"id": "total_payment", "expression": "emi * tenure_months", "description": "Total amount payable"},
            {"id": "total_interest", "expression": "total_payment - principal", "description": "Total interest payable"}
        ],
        outputs=["emi", "total_payment", "total_interest"],
        help_text="Calculate your monthly EMI based on loan amount, interest rate, and tenure."
    )
    
    sip_calculator = CalculatorDefinition(
        calculator_id="sip_calculator",
        name="SIP Calculator",
        category="Investment",
        description="Calculate future value of Systematic Investment Plan",
        inputs=[
            {"key": "monthly_investment", "label": "Monthly SIP Amount (₹)", "type": "number", "required": True, "min": 100},
            {"key": "annual_rate", "label": "Expected Annual Return (%)", "type": "number", "required": True, "min": 0, "max": 50, "default": 12},
            {"key": "years", "label": "Investment Period (Years)", "type": "number", "required": True, "min": 1, "max": 50}
        ],
        steps=[
            {"id": "future_value", "rule_engine": "sip_future_value", "description": "Calculate future value using SIP formula"},
            {"id": "total_invested", "expression": "monthly_investment * years * 12", "description": "Total amount invested"},
            {"id": "wealth_gained", "expression": "future_value - total_invested", "description": "Wealth gained from investment"}
        ],
        outputs=["future_value", "total_invested", "wealth_gained"],
        help_text="Calculate how much your SIP investments will grow over time."
    )
    
    income_tax_calculator = CalculatorDefinition(
        calculator_id="income_tax_india",
        name="Income Tax Calculator (India)",
        category="Tax",
        description="Calculate income tax under Old and New regime for FY 2024-25",
        inputs=[
            {"key": "annual_income", "label": "Annual Gross Income (₹)", "type": "number", "required": True, "min": 0},
            {"key": "deductions", "label": "Total Deductions (₹)", "type": "number", "required": False, "default": 0, "help_text": "80C, 80D, HRA, etc."},
            {"key": "regime", "label": "Tax Regime", "type": "select", "required": True, "options": ["old", "new"], "default": "new"}
        ],
        steps=[
            {"id": "taxable_income", "expression": "annual_income - deductions", "description": "Calculate taxable income after deductions"},
            {"id": "tax_old", "rule_engine": "income_tax_slabs_india_old", "description": "Tax under old regime"},
            {"id": "tax_new", "rule_engine": "income_tax_slabs_india_new", "description": "Tax under new regime"},
            {"id": "selected_tax", "expression": "tax_old if regime == 'old' else tax_new", "description": "Tax based on selected regime"},
            {"id": "cess", "expression": "selected_tax * 0.04", "description": "4% Health & Education Cess"},
            {"id": "total_tax", "expression": "selected_tax + cess", "description": "Total tax payable including cess"},
            {"id": "effective_rate", "expression": "(total_tax / annual_income) * 100 if annual_income > 0 else 0", "description": "Effective tax rate percentage"}
        ],
        outputs=["taxable_income", "tax_old", "tax_new", "selected_tax", "cess", "total_tax", "effective_rate"],
        help_text="Compare your tax liability under Old vs New regime."
    )
    
    return [emi_calculator, sip_calculator, income_tax_calculator]
