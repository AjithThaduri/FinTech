"""
Test Script for Financial Engine Calculations
Validates corpus calculations and AI summary generation.
"""
import json
from datetime import date
from schemas import FullState
from engine import FinancialEngine
from ai_service import generate_financial_insights

def load_test_payload():
    """Load the test payload from JSON file."""
    with open('test_payload.json', 'r') as f:
        return json.load(f)

def manual_calculation(payload):
    """
    Perform manual calculations for comparison.
    Based on TRS formulas.
    """
    print("\n" + "="*60)
    print("MANUAL CALCULATION (Expected Values)")
    print("="*60)
    
    # Extract data
    primary = payload['user_profile']['primary']
    assumptions = payload['assumptions']
    outflows = payload['cash_flow']['outflows']
    
    # 1. Current Age
    dob = date.fromisoformat(primary['dob'])
    today = date.today()
    current_age = (today - dob).days / 365.25
    print(f"\n[1] Current Age: {current_age:.2f} years")
    
    # 2. Years to Retirement
    retirement_age = primary['retire_age']
    years_to_retire = retirement_age - current_age
    months_to_retire = int(years_to_retire * 12)
    print(f"[2] Retirement Age: {retirement_age}")
    print(f"[3] Years to Retire: {years_to_retire:.2f} years")
    print(f"[4] Months to Retire: {months_to_retire}")
    
    # 3. Monthly Expenses (Essential + Lifestyle)
    essential = outflows.get('essential', 0)
    lifestyle = outflows.get('lifestyle', 0)
    
    # If detailed breakdown exists, calculate from it
    if outflows.get('essential_details'):
        d = outflows['essential_details']
        essential = sum([
            d.get('house_rent', 0), d.get('maintenance', 0), d.get('property_tax', 0),
            d.get('utilities', 0), d.get('groceries', 0), d.get('transportation', 0),
            d.get('medical_expenses', 0), d.get('children_school_fees', 0),
            d.get('insurance_premiums', 0), d.get('other', 0)
        ])
    
    if outflows.get('lifestyle_details'):
        d = outflows['lifestyle_details']
        lifestyle = sum([
            d.get('maid_expense', 0), d.get('shopping', 0), d.get('travel', 0),
            d.get('dining_entertainment', 0), d.get('other', 0)
        ])
    
    monthly_expenses = essential + lifestyle
    print(f"[5] Essential Expenses: ₹{essential:,.0f}")
    print(f"[6] Lifestyle Expenses: ₹{lifestyle:,.0f}")
    print(f"[7] Total Monthly Expenses: ₹{monthly_expenses:,.0f}")
    
    # 4. Expense at Retirement (Future Value)
    inflation = assumptions['inflation']
    expense_at_retirement = monthly_expenses * ((1 + inflation) ** years_to_retire)
    print(f"\n[8] Inflation Rate: {inflation * 100:.1f}%")
    print(f"[9] Expense at Retirement: ₹{expense_at_retirement:,.0f}/month")
    
    # 5. Real Rate of Return
    post_retire_roi = assumptions['post_retire_roi']
    real_rate = ((1 + post_retire_roi) / (1 + inflation)) - 1
    print(f"[10] Post-Retire ROI: {post_retire_roi * 100:.1f}%")
    print(f"[11] Real Rate: {real_rate * 100:.3f}%")
    
    # 6. Pension Period
    life_expectancy = primary['life_expectancy']
    pension_years = life_expectancy - retirement_age
    pension_months = pension_years * 12
    print(f"[12] Life Expectancy: {life_expectancy}")
    print(f"[13] Pension Years: {pension_years}")
    print(f"[14] Pension Months: {pension_months}")
    
    # 7. Corpus Required (Annuity Formula)
    # Corpus = Expense * (1 - (1 + r)^(-n)) / r
    if real_rate != 0:
        corpus_required = expense_at_retirement * (1 - (1 + real_rate) ** (-pension_months)) / real_rate
    else:
        corpus_required = expense_at_retirement * pension_months
    
    print(f"\n[15] CORPUS REQUIRED: ₹{corpus_required:,.0f}")
    print(f"     (₹{corpus_required/10000000:.2f} Cr)")
    
    return {
        'current_age': current_age,
        'years_to_retire': years_to_retire,
        'monthly_expenses': monthly_expenses,
        'expense_at_retirement': expense_at_retirement,
        'real_rate': real_rate,
        'corpus_required': corpus_required
    }

def engine_calculation(payload):
    """
    Run calculations through the FinancialEngine.
    """
    print("\n" + "="*60)
    print("ENGINE CALCULATION (Actual Values)")
    print("="*60)
    
    # Create FullState from payload
    state = FullState(**payload)
    
    # Run engine
    engine = FinancialEngine(state)
    results = engine.calculate()
    
    # Print results
    time_metrics = results['time_metrics']
    print(f"\n[1] Current Age: {time_metrics['current_age']:.2f} years")
    print(f"[2] Retirement Age: {time_metrics['retirement_age']}")
    print(f"[3] Years to Retire: {time_metrics['years_to_retire']:.2f} years")
    print(f"[4] Months to Retire: {time_metrics['months_to_retire']}")
    
    retirement = results['retirement']
    print(f"\n[5] Current Monthly Expenses: ₹{retirement['current_monthly_expenses']:,.0f}")
    print(f"[6] Expense at Retirement: ₹{retirement['expense_at_retirement_monthly']:,.0f}/month")
    print(f"[7] Real Rate: {retirement['real_rate_percent']:.3f}%")
    print(f"[8] Pension Years: {retirement['pension_years']}")
    print(f"[9] Pension Months: {retirement['pension_months']}")
    print(f"\n[10] CORPUS REQUIRED: ₹{retirement['corpus_required']:,.0f}")
    print(f"     (₹{retirement['corpus_required']/10000000:.2f} Cr)")
    
    summary = results['summary']
    print(f"\n[11] Total Assets: ₹{summary['total_assets']:,.0f}")
    print(f"[12] Total Liabilities: ₹{summary['total_liabilities']:,.0f}")
    print(f"[13] Net Worth: ₹{summary['net_worth']:,.0f}")
    print(f"[14] Projected Corpus: ₹{summary['projected_corpus']:,.0f}")
    print(f"[15] Retirement Gap: ₹{summary['retirement_gap']:,.0f}")
    print(f"[16] Extra SIP Required: ₹{summary['extra_sip_required']:,.0f}/month")
    
    # Goals
    print("\n" + "-"*40)
    print("GOALS ANALYSIS")
    print("-"*40)
    for goal in results['goals']:
        print(f"  • {goal['name']}: ₹{goal['current_cost']:,.0f} → ₹{goal['future_cost']:,.0f} ({goal['years_to_goal']:.1f} years)")
    
    return results

def test_ai_summary(results):
    """
    Test AI summary generation.
    """
    print("\n" + "="*60)
    print("AI SUMMARY GENERATION")
    print("="*60)
    
    ai_response = generate_financial_insights(results)
    
    if ai_response.get('success'):
        insights = ai_response['insights']
        print("\n✅ AI Summary Generated Successfully!")
        print(f"\nHealth Score: {insights.get('health_score', 'N/A')}")
        print(f"Health Status: {insights.get('health_status', 'N/A')}")
        print(f"\nExecutive Summary:\n{insights.get('executive_summary', 'N/A')[:500]}...")
        
        if insights.get('recommendations'):
            print("\nTop Recommendations:")
            for i, rec in enumerate(insights['recommendations'][:3], 1):
                print(f"  {i}. {rec.get('action', 'N/A')} ({rec.get('category', '')})")
    else:
        print("\n❌ AI Summary Generation Failed")
        print(f"Error: {ai_response.get('error', 'Unknown')}")
    
    return ai_response

def compare_results(manual, engine_results):
    """
    Compare manual vs engine calculations.
    """
    print("\n" + "="*60)
    print("VALIDATION COMPARISON")
    print("="*60)
    
    retirement = engine_results['retirement']
    
    checks = [
        ("Monthly Expenses", manual['monthly_expenses'], retirement['current_monthly_expenses'], 0),
        ("Expense at Retirement", manual['expense_at_retirement'], retirement['expense_at_retirement_monthly'], 1000),
        ("Real Rate (%)", manual['real_rate'] * 100, retirement['real_rate_percent'], 0.01),
        ("Corpus Required", manual['corpus_required'], retirement['corpus_required'], manual['corpus_required'] * 0.01),
    ]
    
    all_passed = True
    for name, expected, actual, tolerance in checks:
        diff = abs(expected - actual)
        passed = diff <= tolerance
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"\n{name}:")
        print(f"  Expected: {expected:,.2f}")
        print(f"  Actual:   {actual:,.2f}")
        print(f"  Diff:     {diff:,.2f}")
        print(f"  Status:   {status}")
        if not passed:
            all_passed = False
    
    print("\n" + "="*60)
    if all_passed:
        print("🎉 ALL VALIDATION CHECKS PASSED!")
    else:
        print("⚠️ SOME CHECKS FAILED - Review calculations")
    print("="*60)

def main():
    print("\n" + "="*60)
    print("FINANCIAL ENGINE VALIDATION TEST")
    print(f"Date: {date.today()}")
    print("="*60)
    
    # Load test data
    payload = load_test_payload()
    print(f"\nLoaded test data for: {payload['user_profile']['primary']['name']}")
    
    # Run manual calculation
    manual_results = manual_calculation(payload)
    
    # Run engine calculation
    engine_results = engine_calculation(payload)
    
    # Compare results
    compare_results(manual_results, engine_results)
    
    # Test AI summary
    test_ai_summary(engine_results)
    
    print("\n" + "="*60)
    print("TEST COMPLETE")
    print("="*60 + "\n")

if __name__ == "__main__":
    main()
