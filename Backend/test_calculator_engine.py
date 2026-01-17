"""
Unit Tests for Calculator Execution Engine
Tests expression evaluator, rule engines, and full calculator execution.
"""
from datetime import datetime
from calculator_engine import (
    SafeExpressionEvaluator, RuleEngines, CalculatorEngine, 
    create_sample_calculators
)
from calculator_schemas import CalculatorDefinition, CalculatorInput, CalculatorStep


class TestSafeExpressionEvaluator:
    """Test the AST-based expression evaluator."""
    
    def test_basic_arithmetic(self):
        evaluator = SafeExpressionEvaluator()
        
        assert evaluator.evaluate("2 + 3") == 5
        assert evaluator.evaluate("10 - 4") == 6
        assert evaluator.evaluate("3 * 4") == 12
        assert evaluator.evaluate("15 / 3") == 5
        assert evaluator.evaluate("10 // 3") == 3
        assert evaluator.evaluate("10 % 3") == 1
        assert evaluator.evaluate("2 ** 3") == 8
    
    def test_complex_expressions(self):
        evaluator = SafeExpressionEvaluator()
        
        assert evaluator.evaluate("(2 + 3) * 4") == 20
        assert evaluator.evaluate("2 + 3 * 4") == 14
        assert evaluator.evaluate("10 / 2 + 3") == 8
    
    def test_variable_substitution(self):
        evaluator = SafeExpressionEvaluator({
            "x": 10,
            "y": 5,
            "rate": 0.1
        })
        
        assert evaluator.evaluate("x + y") == 15
        assert evaluator.evaluate("x * rate") == 1.0
        assert evaluator.evaluate("x - y * 2") == 0
    
    def test_functions(self):
        evaluator = SafeExpressionEvaluator({"x": -5, "y": 16})
        
        assert evaluator.evaluate("abs(x)") == 5
        assert evaluator.evaluate("sqrt(y)") == 4
        assert evaluator.evaluate("pow(2, 3)") == 8
        assert evaluator.evaluate("max(3, 7, 2)") == 7
        assert evaluator.evaluate("min(3, 7, 2)") == 2
        assert evaluator.evaluate("round(3.7)") == 4
    
    def test_comparisons(self):
        evaluator = SafeExpressionEvaluator({"a": 5, "b": 10})
        
        assert evaluator.evaluate("a < b") == True
        assert evaluator.evaluate("a > b") == False
        assert evaluator.evaluate("a == 5") == True
        assert evaluator.evaluate("a != b") == True
    
    def test_ternary_expression(self):
        evaluator = SafeExpressionEvaluator({
            "regime": "old",
            "tax_old": 50000,
            "tax_new": 30000
        })
        
        result = evaluator.evaluate("tax_old if regime == 'old' else tax_new")
        assert result == 50000
        
        evaluator.context["regime"] = "new"
        result = evaluator.evaluate("tax_old if regime == 'old' else tax_new")
        assert result == 30000
    
    def test_emi_formula(self):
        """Test the EMI formula expression."""
        evaluator = SafeExpressionEvaluator({
            "principal": 1000000,
            "monthly_rate": 0.01,  # 12% annual = 1% monthly
            "tenure_months": 12
        })
        
        # EMI = P * r * (1+r)^n / ((1+r)^n - 1)
        result = evaluator.evaluate(
            "principal * monthly_rate * pow(1 + monthly_rate, tenure_months) / "
            "(pow(1 + monthly_rate, tenure_months) - 1)"
        )
        
        # Expected EMI is approximately 88849
        assert abs(result - 88849) < 1
    
    def test_invalid_expression_raises_error(self):
        evaluator = SafeExpressionEvaluator()
        
        with pytest.raises(ValueError):
            evaluator.evaluate("undefined_var + 5")
        
        with pytest.raises(ValueError):
            evaluator.evaluate("import os")  # Should fail to parse


class TestRuleEngines:
    """Test pre-built rule engines."""
    
    def test_income_tax_old_regime_below_250k(self):
        tax = RuleEngines.income_tax_slabs_india_old(200000)
        assert tax == 0
    
    def test_income_tax_old_regime_5_percent_slab(self):
        # 400000 - 250000 = 150000 @ 5% = 7500
        tax = RuleEngines.income_tax_slabs_india_old(400000)
        assert tax == 7500
    
    def test_income_tax_old_regime_20_percent_slab(self):
        # First 250k = 0
        # 250k - 500k = 250k @ 5% = 12500
        # 500k - 800k = 300k @ 20% = 60000
        # Total = 72500
        tax = RuleEngines.income_tax_slabs_india_old(800000)
        assert tax == 72500
    
    def test_income_tax_old_regime_30_percent_slab(self):
        # First 250k = 0
        # 250k - 500k = 12500
        # 500k - 1000k = 100000
        # 1000k - 1500k = 150000
        # Total = 262500
        tax = RuleEngines.income_tax_slabs_india_old(1500000)
        assert tax == 262500
    
    def test_emi_calculator(self):
        # Loan: 10 lakh, 12% annual, 12 months
        emi = RuleEngines.emi_calculator(
            principal=1000000,
            annual_rate=12,
            tenure_months=12
        )
        # Expected EMI around 88849
        assert abs(emi - 88849) < 1
    
    def test_emi_calculator_zero_rate(self):
        emi = RuleEngines.emi_calculator(
            principal=1200000,
            annual_rate=0,
            tenure_months=12
        )
        assert emi == 100000
    
    def test_sip_future_value(self):
        # Monthly 10000, 12% annual, 10 years
        fv = RuleEngines.sip_future_value(
            monthly_investment=10000,
            annual_rate=12,
            years=10
        )
        # Expected around 23 lakhs
        assert fv > 2000000
        assert fv < 2500000
    
    def test_cagr_calculator(self):
        # 100 to 200 in 5 years
        cagr = RuleEngines.cagr_calculator(
            initial_value=100,
            final_value=200,
            years=5
        )
        # Expected around 14.87%
        assert abs(cagr - 14.87) < 0.1
    
    def test_lumpsum_future_value(self):
        # 100000 at 10% for 5 years
        fv = RuleEngines.lumpsum_future_value(
            principal=100000,
            annual_rate=10,
            years=5
        )
        # 100000 * 1.1^5 = 161051
        assert abs(fv - 161051) < 1


class TestCalculatorEngine:
    """Test the full calculator execution engine."""
    
    def test_emi_calculator_execution(self):
        """Test EMI calculator end-to-end."""
        samples = create_sample_calculators()
        emi_calc = next(c for c in samples if c.name == "EMI Calculator")
        
        engine = CalculatorEngine(emi_calc)
        result = engine.execute({
            "principal": 5000000,
            "annual_rate": 8.5,
            "tenure_months": 240
        })
        
        assert result.success == True
        assert "emi" in result.outputs
        assert "total_payment" in result.outputs
        assert "total_interest" in result.outputs
        
        # EMI should be around 43391 for these inputs
        assert abs(result.outputs["emi"] - 43391) < 100
        
        # Check trace
        assert len(result.steps) == 4
        assert result.steps[0].step_id == "monthly_rate"
    
    def test_sip_calculator_execution(self):
        """Test SIP calculator end-to-end."""
        samples = create_sample_calculators()
        sip_calc = next(c for c in samples if c.name == "SIP Calculator")
        
        engine = CalculatorEngine(sip_calc)
        result = engine.execute({
            "monthly_investment": 10000,
            "annual_rate": 12,
            "years": 10
        })
        
        assert result.success == True
        assert "future_value" in result.outputs
        assert "total_invested" in result.outputs
        assert "wealth_gained" in result.outputs
        
        assert result.outputs["total_invested"] == 1200000  # 10k * 12 * 10
        assert result.outputs["future_value"] > result.outputs["total_invested"]
    
    def test_tax_calculator_old_regime(self):
        """Test tax calculator with old regime."""
        samples = create_sample_calculators()
        tax_calc = next(c for c in samples if c.name == "Income Tax Calculator (India)")
        
        engine = CalculatorEngine(tax_calc)
        result = engine.execute({
            "annual_income": 1500000,
            "deductions": 150000,
            "regime": "old"
        })
        
        assert result.success == True
        assert "total_tax" in result.outputs
        assert "effective_rate" in result.outputs
        
        # Check that old regime was used
        assert result.outputs["selected_tax"] == result.outputs["tax_old"]
    
    def test_tax_calculator_new_regime(self):
        """Test tax calculator with new regime."""
        samples = create_sample_calculators()
        tax_calc = next(c for c in samples if c.name == "Income Tax Calculator (India)")
        
        engine = CalculatorEngine(tax_calc)
        result = engine.execute({
            "annual_income": 1500000,
            "deductions": 0,
            "regime": "new"
        })
        
        assert result.success == True
        assert result.outputs["selected_tax"] == result.outputs["tax_new"]
    
    def test_input_validation_missing_required(self):
        """Test that missing required inputs cause validation errors."""
        samples = create_sample_calculators()
        emi_calc = next(c for c in samples if c.name == "EMI Calculator")
        
        engine = CalculatorEngine(emi_calc)
        result = engine.execute({
            "principal": 5000000
            # Missing annual_rate and tenure_months
        })
        
        assert result.success == False
        assert "required" in result.error.lower()
    
    def test_execution_time_tracking(self):
        """Test that execution time is tracked."""
        samples = create_sample_calculators()
        emi_calc = next(c for c in samples if c.name == "EMI Calculator")
        
        engine = CalculatorEngine(emi_calc)
        result = engine.execute({
            "principal": 5000000,
            "annual_rate": 8.5,
            "tenure_months": 240
        })
        
        assert result.execution_time_ms > 0
        assert result.execution_time_ms < 1000  # Should be fast


class TestSampleCalculators:
    """Test sample calculator creation."""
    
    def test_sample_calculators_created(self):
        samples = create_sample_calculators()
        
        assert len(samples) == 3
        
        names = [c.name for c in samples]
        assert "EMI Calculator" in names
        assert "SIP Calculator" in names
        assert "Income Tax Calculator (India)" in names
    
    def test_sample_calculators_have_required_fields(self):
        samples = create_sample_calculators()
        
        for calc in samples:
            assert calc.calculator_id
            assert calc.name
            assert calc.category
            assert calc.description
            assert len(calc.inputs) > 0
            assert len(calc.steps) > 0
            assert len(calc.outputs) > 0


def run_tests():
    """Run all tests and print results."""
    print("\n" + "="*60)
    print("CALCULATOR ENGINE UNIT TESTS")
    print("="*60)
    
    # Test Expression Evaluator
    print("\n📐 Testing SafeExpressionEvaluator...")
    test_eval = TestSafeExpressionEvaluator()
    test_eval.test_basic_arithmetic()
    test_eval.test_complex_expressions()
    test_eval.test_variable_substitution()
    test_eval.test_functions()
    test_eval.test_comparisons()
    test_eval.test_ternary_expression()
    test_eval.test_emi_formula()
    print("   ✅ All expression evaluator tests passed!")
    
    # Test Rule Engines
    print("\n📊 Testing RuleEngines...")
    test_rules = TestRuleEngines()
    test_rules.test_income_tax_old_regime_below_250k()
    test_rules.test_income_tax_old_regime_5_percent_slab()
    test_rules.test_income_tax_old_regime_20_percent_slab()
    test_rules.test_income_tax_old_regime_30_percent_slab()
    test_rules.test_emi_calculator()
    test_rules.test_emi_calculator_zero_rate()
    test_rules.test_sip_future_value()
    test_rules.test_cagr_calculator()
    test_rules.test_lumpsum_future_value()
    print("   ✅ All rule engine tests passed!")
    
    # Test Calculator Engine
    print("\n🔧 Testing CalculatorEngine...")
    test_engine = TestCalculatorEngine()
    test_engine.test_emi_calculator_execution()
    test_engine.test_sip_calculator_execution()
    test_engine.test_tax_calculator_old_regime()
    test_engine.test_tax_calculator_new_regime()
    test_engine.test_input_validation_missing_required()
    test_engine.test_execution_time_tracking()
    print("   ✅ All calculator engine tests passed!")
    
    # Test Sample Calculators
    print("\n📝 Testing Sample Calculators...")
    test_samples = TestSampleCalculators()
    test_samples.test_sample_calculators_created()
    test_samples.test_sample_calculators_have_required_fields()
    print("   ✅ All sample calculator tests passed!")
    
    print("\n" + "="*60)
    print("🎉 ALL TESTS PASSED!")
    print("="*60 + "\n")


if __name__ == "__main__":
    run_tests()
