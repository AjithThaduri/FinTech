"""
AI Service for generating financial insights using OpenAI.
"""
import os
import json
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

# Initialize OpenAI client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def generate_financial_insights(analysis_data: dict) -> dict:
    """
    Generate comprehensive AI-powered financial insights.
    """
    # Build a comprehensive prompt with all the data
    prompt = build_analysis_prompt(analysis_data)
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "system",
                    "content": """You are an expert Certified Financial Planner (CFP) and Wealth Manager with 20+ years of experience.
                    
Your role is to analyze financial data and provide:
1. A detailed executive summary of the client's financial health
2. Specific, actionable recommendations with exact amounts
3. Risk assessment and warnings
4. Goal-specific advice
5. Retirement planning insights

Use Indian Rupees (₹) for all currency. Be specific with numbers.
Format your response as JSON with the following structure:
{
    "executive_summary": "3-4 paragraph comprehensive summary",
    "health_score": 0-100,
    "health_status": "Excellent/Good/Needs Attention/Critical",
    "key_strengths": ["list of financial strengths"],
    "areas_of_concern": ["list of concerns"],
    "recommendations": [
        {"priority": 1-5, "category": "category", "action": "specific action", "impact": "expected impact", "timeline": "when to do"}
    ],
    "retirement_insight": "detailed retirement analysis",
    "goal_insights": [{"goal_name": "name", "status": "On Track/At Risk/Critical", "advice": "specific advice"}],
    "emergency_fund_status": {"current": amount, "required": amount, "status": "Adequate/Needs Improvement"},
    "insurance_adequacy": {"life_coverage": amount, "recommended": amount, "gap": amount, "advice": "advice"},
    "monthly_action_plan": ["list of immediate actions"],
    "long_term_strategy": "paragraph on long-term wealth building"
}"""
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.7,
            max_tokens=4000,
            response_format={"type": "json_object"}
        )
        
        # Parse the response
        content = response.choices[0].message.content
        ai_insights = json.loads(content)
        
        return {
            "success": True,
            "insights": ai_insights
        }
        
    except Exception as e:
        print(f"OpenAI API Error: {str(e)}")
        # Return fallback insights
        return generate_fallback_insights(analysis_data)


def build_analysis_prompt(data: dict) -> str:
    """Build a comprehensive prompt from analysis data."""
    
    summary = data.get("summary", {})
    retirement = data.get("retirement", {})
    goals = data.get("goals", [])
    time_metrics = data.get("time_metrics", {})
    contingency = data.get("contingency_fund", {})
    insurance_cover = data.get("insurance_cover", [])
    
    prompt = f"""
## CLIENT FINANCIAL DATA FOR ANALYSIS

### Time Metrics
- Current Age: {time_metrics.get('current_age', 'N/A')} years
- Retirement Age: {time_metrics.get('retirement_age', 60)} years
- Years to Retirement: {time_metrics.get('years_to_retire', 'N/A')} years
- Months to Retirement: {time_metrics.get('months_to_retire', 'N/A')} months

### Net Worth Summary
- Total Assets: ₹{summary.get('total_assets', 0):,.2f}
- Total Liabilities: ₹{summary.get('total_liabilities', 0):,.2f}
- Net Worth: ₹{summary.get('net_worth', 0):,.2f}

### Monthly Cash Flow
- Total Monthly Inflow: ₹{summary.get('total_monthly_inflow', 0):,.2f}
- Total Monthly Outflow: ₹{summary.get('total_monthly_outflow', 0):,.2f}
- Leftover Savings: ₹{summary.get('leftover_savings', 0):,.2f}

### Key Financial Ratios
- Savings Rate: {summary.get('savings_rate', 0):.1f}%
- EMI Burden: {summary.get('emi_burden', 0):.1f}%
- Investment Rate: {summary.get('investment_rate', 0):.1f}%
- Essential Expense %: {summary.get('essential_expense_percent', 0):.1f}%
- Lifestyle Expense %: {summary.get('lifestyle_expense_percent', 0):.1f}%

### Retirement Planning
- Current Monthly Expenses: ₹{retirement.get('current_monthly_expenses', 0):,.2f}
- Projected Monthly Expense at Retirement: ₹{retirement.get('expense_at_retirement_monthly', 0):,.2f}
- Required Retirement Corpus: ₹{retirement.get('corpus_required', 0):,.2f}
- Projected Corpus at Retirement: ₹{summary.get('projected_corpus', 0):,.2f}
- Retirement Gap: ₹{summary.get('retirement_gap', 0):,.2f}
- Extra SIP Required to Bridge Gap: ₹{summary.get('extra_sip_required', 0):,.2f}/month

### Contingency Fund Analysis
- Monthly Expenses: ₹{contingency.get('monthly_expenses', 0):,.2f}
- Months Required: {contingency.get('months_required', 6)}
- Emergency Fund Required: ₹{contingency.get('contingency_fund_required', 0):,.2f}

### Financial Goals - ACHIEVABILITY ANALYSIS
"""
    
    # Extract goal summary if available
    goal_summary = {}
    for goal in goals:
        if "_summary" in goal:
            goal_summary = goal["_summary"]
            break
    
    if goal_summary:
        prompt += f"""
GOAL SUMMARY:
- Total Monthly SIP Required for ALL Goals: ₹{goal_summary.get('total_monthly_sip_for_all_goals', 0):,.2f}
- Monthly Surplus Available: ₹{goal_summary.get('monthly_surplus_available', 0):,.2f}
- Surplus After All Goals: ₹{goal_summary.get('surplus_after_all_goals', 0):,.2f}
- All Goals Feasible: {'Yes' if goal_summary.get('all_goals_feasible', False) else 'NO - NEEDS ATTENTION'}

"""
    
    for goal in goals:
        status = goal.get('status', 'UNKNOWN')
        status_label = {
            'ON_TRACK': '✅ On Track',
            'NEEDS_ATTENTION': '⚠️ Needs Attention',
            'AT_RISK': '🔶 At Risk',
            'CRITICAL': '🔴 Critical',
            'PAST_DUE': '❌ Past Due',
            'ACHIEVED': '✓ Achieved'
        }.get(status, status)
        
        prompt += f"""
- Goal: {goal.get('name', 'Unknown')} | Status: {status_label}
  - Person: {goal.get('person_name', 'Self')}
  - Current Cost: ₹{goal.get('current_cost', 0):,.2f}
  - Years to Goal: {goal.get('years_to_goal', 0):.1f} years ({goal.get('months_to_goal', 0)} months)
  - Future Cost (Inflation Adjusted): ₹{goal.get('future_cost', 0):,.2f}
  - Monthly SIP Required: ₹{goal.get('monthly_sip_required', 0):,.2f}
  - Feasibility: {goal.get('feasibility', 'Unknown')}
  - Surplus Allocation Needed: {goal.get('surplus_allocation_percent', 0):.1f}%
"""

    prompt += """

### Insurance Cover Analysis
"""
    for ins in insurance_cover:
        prompt += f"""
- {ins.get('member_name', 'Member')}: 
  - Monthly Income: ₹{ins.get('monthly_income', 0):,.2f}
  - Cover Required: ₹{ins.get('insurance_cover_required', 0):,.2f}
"""

    prompt += """

Please analyze this data comprehensively and provide detailed, personalized insights.
Focus on:
1. Goal achievability - Which goals are at risk and how to prioritize them
2. Specific monthly SIP recommendations for each goal
3. Retirement readiness and gap bridging strategy
4. Emergency fund adequacy
5. Insurance coverage gaps

Be specific with numbers. Every recommendation should include exact amounts and timelines.
"""
    
    return prompt


def generate_fallback_insights(data: dict) -> dict:
    """Generate fallback insights when OpenAI is unavailable - now fully data-driven."""
    
    summary = data.get("summary", {})
    retirement = data.get("retirement", {})
    goals = data.get("goals", [])
    contingency = data.get("contingency_fund", {})
    insurance_cover = data.get("insurance_cover", [])
    
    savings_rate = summary.get("savings_rate", 0)
    emi_burden = summary.get("emi_burden", 0)
    retirement_gap = summary.get("retirement_gap", 0)
    extra_sip = summary.get("extra_sip_required", 0)
    
    # Extract goal summary
    goal_summary = {}
    for goal in goals:
        if "_summary" in goal:
            goal_summary = goal["_summary"]
            break
    
    # Determine health status based on multiple factors
    health_score = 50  # Base score
    
    if savings_rate >= 30:
        health_score += 15
    elif savings_rate >= 20:
        health_score += 10
    elif savings_rate >= 10:
        health_score += 5
    
    if emi_burden <= 20:
        health_score += 10
    elif emi_burden <= 30:
        health_score += 5
    elif emi_burden > 40:
        health_score -= 10
    
    if retirement_gap <= 0:
        health_score += 15
    elif retirement_gap < summary.get("total_assets", 1) * 0.2:
        health_score += 5
    else:
        health_score -= 10
    
    # Goals feasibility impact
    if goal_summary.get("all_goals_feasible", False):
        health_score += 10
    else:
        health_score -= 5
    
    health_score = max(20, min(95, health_score))
    
    if health_score >= 80:
        health_status = "Excellent"
    elif health_score >= 65:
        health_status = "Good"
    elif health_score >= 45:
        health_status = "Needs Attention"
    else:
        health_status = "Critical"
    
    # Build recommendations based on actual data
    recommendations = []
    priority = 1
    
    # Retirement gap recommendation
    if retirement_gap > 0:
        recommendations.append({
            "priority": priority,
            "category": "Retirement",
            "action": f"Start an additional SIP of ₹{extra_sip:,.0f}/month in equity mutual funds",
            "impact": f"Bridge retirement corpus gap of ₹{retirement_gap:,.0f}",
            "timeline": "Start within this month"
        })
        priority += 1
    
    # Goal-specific recommendations for at-risk goals
    for goal in goals:
        if goal.get("status") in ["CRITICAL", "AT_RISK"]:
            recommendations.append({
                "priority": priority,
                "category": f"Goal: {goal.get('name', 'Unknown')}",
                "action": f"Allocate ₹{goal.get('monthly_sip_required', 0):,.0f}/month towards this goal",
                "impact": f"Achieve future cost of ₹{goal.get('future_cost', 0):,.0f} in {goal.get('years_to_goal', 0):.1f} years",
                "timeline": f"Duration: {goal.get('months_to_goal', 0)} months"
            })
            priority += 1
            if priority > 5:
                break
    
    # EMI burden recommendation
    if emi_burden > 40:
        recommendations.append({
            "priority": priority,
            "category": "Debt Management",
            "action": "Consider prepaying high-interest loans or refinancing",
            "impact": f"Reduce EMI burden from {emi_burden:.1f}% to below 40%",
            "timeline": "Within 6 months"
        })
        priority += 1
    
    # Savings rate recommendation
    if savings_rate < 20:
        target_savings = summary.get("total_monthly_inflow", 0) * 0.2
        current_savings = summary.get("leftover_savings", 0)
        gap = target_savings - current_savings
        recommendations.append({
            "priority": priority,
            "category": "Savings",
            "action": f"Increase monthly savings by ₹{max(0, gap):,.0f}",
            "impact": "Achieve healthy savings rate of 20%+",
            "timeline": "Within 3 months"
        })
        priority += 1
    
    # Build goal insights from actual data
    goal_insights = []
    for goal in goals:
        status_map = {
            "ON_TRACK": "On Track",
            "NEEDS_ATTENTION": "Needs Attention",
            "AT_RISK": "At Risk",
            "CRITICAL": "Critical",
            "PAST_DUE": "Past Due",
            "ACHIEVED": "Achieved"
        }
        
        if goal.get("status") in ["CRITICAL", "PAST_DUE"]:
            advice = f"This goal requires ₹{goal.get('monthly_sip_required', 0):,.0f}/month which exceeds your available surplus. Consider extending timeline or reducing target amount."
        elif goal.get("status") == "AT_RISK":
            advice = f"Commit ₹{goal.get('monthly_sip_required', 0):,.0f}/month now. Consider automating this via SIP."
        elif goal.get("status") == "NEEDS_ATTENTION":
            advice = f"Start a SIP of ₹{goal.get('monthly_sip_required', 0):,.0f}/month. You have adequate surplus to achieve this."
        else:
            advice = f"On track. Continue with ₹{goal.get('monthly_sip_required', 0):,.0f}/month allocation."
        
        goal_insights.append({
            "goal_name": goal.get("name", "Unknown"),
            "status": status_map.get(goal.get("status", "UNKNOWN"), "Unknown"),
            "monthly_sip_required": goal.get("monthly_sip_required", 0),
            "years_to_goal": goal.get("years_to_goal", 0),
            "future_cost": goal.get("future_cost", 0),
            "feasibility": goal.get("feasibility", "Unknown"),
            "advice": advice
        })
    
    # Calculate emergency fund status
    monthly_expenses = contingency.get("monthly_expenses", summary.get("total_monthly_outflow", 0))
    emergency_required = monthly_expenses * 6
    liquid_available = summary.get("total_assets", 0) * 0.1  # Assume 10% of assets are liquid
    # Build executive summary parts
    goal_feasibility_msg = "All your financial goals are achievable with current surplus."
    if not goal_summary.get('all_goals_feasible', False):
        total_sip = goal_summary.get('total_monthly_sip_for_all_goals', 0)
        surplus = goal_summary.get('monthly_surplus_available', 0)
        goal_feasibility_msg = f"Your goals require ₹{total_sip:,.0f}/month but you have ₹{surplus:,.0f}/month surplus. Some goals may need to be reprioritized."
    
    retirement_msg = "You are on track for retirement."
    if retirement_gap > 0:
        retirement_msg = f"You need to increase investments by ₹{extra_sip:,.0f}/month to meet retirement goals."
    
    emi_msg = "are within healthy limits" if emi_burden <= 40 else "need attention"
    
    return {
        "success": True,
        "insights": {
            "executive_summary": (
                f"Based on comprehensive analysis, your financial health is {health_status.lower()}. "
                f"Your current savings rate of {savings_rate:.1f}% and EMI burden of {emi_burden:.1f}% {emi_msg}. "
                f"{retirement_msg} {goal_feasibility_msg}"
            ),
            "health_score": health_score,
            "health_status": health_status,
            "key_strengths": [
                f"Net Worth of ₹{summary.get('net_worth', 0):,.0f}" if summary.get('net_worth', 0) > 0 else "Building wealth foundation",
                f"Savings Rate of {savings_rate:.1f}%" if savings_rate >= 15 else "Regular income stream",
                f"Low EMI Burden of {emi_burden:.1f}%" if emi_burden <= 30 else "Debt being managed"
            ],
            "areas_of_concern": [
                f"Retirement corpus gap of ₹{retirement_gap:,.0f}" if retirement_gap > 0 else "Monitor inflation impact",
                f"EMI burden at {emi_burden:.1f}% of income" if emi_burden > 30 else "Continue optimizing expenses",
                f"Goal funding shortfall" if not goal_summary.get('all_goals_feasible', True) else "Review insurance adequacy"
            ],
            "recommendations": recommendations,
            "retirement_insight": f"You require a corpus of ₹{retirement.get('corpus_required', 0):,.0f} for a comfortable retirement "
                f"(providing ₹{retirement.get('expense_at_retirement_monthly', 0):,.0f}/month adjusted for inflation). "
                f"At current trajectory, you'll have ₹{summary.get('projected_corpus', 0):,.0f}. "
                f"{'You are on track!' if retirement_gap <= 0 else f'Gap: ₹{retirement_gap:,.0f}. Start extra SIP of ₹{extra_sip:,.0f}/month.'}",
            "goal_insights": goal_insights,
            "emergency_fund_status": {
                "current": liquid_available,
                "required": emergency_required,
                "status": "Adequate" if liquid_available >= emergency_required else "Needs Improvement",
                "advice": f"Maintain ₹{emergency_required:,.0f} (6 months expenses) in liquid funds"
            },
            "insurance_adequacy": {
                "advice": f"Ensure life coverage of 10x annual income (₹{summary.get('total_monthly_inflow', 0) * 12 * 10:,.0f})"
            },
            "monthly_action_plan": [
                f"Set up SIP of ₹{extra_sip:,.0f}/month for retirement" if extra_sip > 0 else "Continue current retirement savings",
                f"Allocate ₹{goal_summary.get('total_monthly_sip_for_all_goals', 0):,.0f}/month across goals" if goals else "Define financial goals",
                f"Build emergency fund of ₹{emergency_required:,.0f}" if liquid_available < emergency_required else "Emergency fund adequate",
                "Review and optimize monthly expenses",
                "Maximize tax-saving investments under 80C"
            ],
            "long_term_strategy": f"With a net worth of ₹{summary.get('net_worth', 0):,.0f} and "
                f"{summary.get('total_monthly_inflow', 0) - summary.get('total_monthly_outflow', 0):,.0f}/month investable surplus, "
                f"focus on building a diversified portfolio. Target asset allocation: 60% equity for growth, "
                f"30% debt for stability, 10% gold/alternates. Regularly review and rebalance your portfolio annually."
        }
    }
