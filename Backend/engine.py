"""
Financial Calculation Engine
Implements exact mathematical logic from Master Specification.
All formulas match the TRS document precisely.
"""
from schemas import FullState, TargetType, GoalAnalysis, RetirementAnalysis, DashboardMetrics
from datetime import date
from typing import List, Dict, Any


class FinancialEngine:
    """
    Core calculation engine for the AI Financial Planner.
    Processes FullState and returns comprehensive analysis.
    """
    
    def __init__(self, state: FullState):
        self.state = state

    def calculate(self) -> Dict[str, Any]:
        """
        Executes all calculations and returns the results.
        This is the main entry point called by the API.
        """
        results = {}
        
        # 1. Update Linked Values (Interconnection Map from TRS)
        self._update_linked_values()
        
        # 2. Time Metrics
        results["time_metrics"] = self._calculate_time_metrics()
        
        # 3. Retirement Analysis
        results["retirement"] = self._calculate_retirement_corpus()
        
        # 4. Goal Analysis
        results["goals"] = self._calculate_goals()
        
        # 5. Dashboard Summary
        results["summary"] = self._generate_dashboard_metrics(
            results["retirement"]["corpus_required"]
        )
        
        # === NEW EXTENDED CALCULATIONS ===
        
        # 6. Retirement Cashflow Table (Year-by-Year)
        results["retirement_cashflow_table"] = self._calculate_retirement_cashflow_table(
            results["retirement"]
        )
        
        # 7. Child Future Planning
        results["child_planning"] = self._calculate_child_planning()
        
        # 8. Contingency Fund
        results["contingency_fund"] = self._calculate_contingency_fund()
        
        # 9. Insurance Cover Required
        results["insurance_cover"] = self._calculate_insurance_cover()
        
        return results

    def _update_linked_values(self):
        """
        Enforce Interconnection Map from TRS:
        1. Liabilities → Cash Flow: Sum of EMIs
        2. Assets → Cash Flow: Sum of SIPs
        """
        # Rule 1: Liabilities -> linked_emis
        total_emi = sum(l.emi for l in self.state.liabilities)
        self.state.cash_flow.outflows.linked_emis = total_emi
        
        # Rule 2: Assets.investments -> linked_investments
        total_sip = sum(inv.monthly_sip for inv in self.state.assets.investments)
        self.state.cash_flow.outflows.linked_investments = total_sip

    def _calculate_time_metrics(self) -> Dict[str, Any]:
        """
        Calculate time-based metrics from TRS Section 3.1
        - Current Age
        - Years to Retirement
        - Months to Retirement
        """
        primary = self.state.user_profile.primary
        today = date.today()
        
        # Current Age = (Today - DOB) / 365.25
        days_lived = (today - primary.dob).days
        current_age = days_lived / 365.25
        
        # Years to Retire = Retirement Age - Current Age
        retirement_age = primary.retirement_age if hasattr(primary, 'retirement_age') else primary.retire_age
        years_to_retire = retirement_age - current_age
        months_to_retire = int(years_to_retire * 12)
        
        return {
            "current_age": round(current_age, 2),
            "retirement_age": retirement_age,
            "years_to_retire": round(max(0, years_to_retire), 2),
            "months_to_retire": max(0, months_to_retire)
        }

    def _get_monthly_expenses(self) -> float:
        """
        Get current monthly expenses (Essential + Lifestyle).
        TRS Rule: Do NOT include EMIs or Investments in retirement expense baseline.
        """
        outflows = self.state.cash_flow.outflows
        
        # If detailed breakdown exists, use it
        essential = outflows.essential
        lifestyle = outflows.lifestyle
        
        # Add detailed breakdowns if available
        if outflows.essential_details:
            details = outflows.essential_details
            essential = (
                details.house_rent + details.maintenance + details.property_tax +
                details.utilities + details.groceries + details.transportation +
                details.medical_expenses + details.children_school_fees +
                details.insurance_premiums + details.other
            )
        
        if outflows.lifestyle_details:
            details = outflows.lifestyle_details
            lifestyle = (
                details.maid_expense + details.shopping + details.travel +
                details.dining_entertainment + details.other
            )
        
        return essential + lifestyle

    def _calculate_retirement_corpus(self) -> Dict[str, Any]:
        """
        Implements TRS Section 3.3 Retirement Corpus Logic exactly.
        
        Step A: Project Monthly Expense at Retirement (FV)
        Step B: Calculate Real Rate of Return
        Step C: Calculate Corpus Required using Annuity formula
        """
        metrics = self._calculate_time_metrics()
        assumptions = self.state.assumptions
        primary = self.state.user_profile.primary
        
        # Current Monthly Expenses (Essential + Lifestyle only)
        current_monthly_expense = self._get_monthly_expenses()
        
        inflation = assumptions.inflation
        years_to_retire = metrics["years_to_retire"]
        retirement_age = metrics["retirement_age"]
        # Use pension_till_age for pension period (per Master Spec), fallback to life_expectancy
        pension_till_age = getattr(primary, 'pension_till_age', primary.life_expectancy)
        
        # Step A: Project Monthly Expense at Retirement
        # Formula: FV = CurrentExpense * (1 + inflation)^years
        expense_at_retirement = current_monthly_expense * ((1 + inflation) ** years_to_retire)
        
        # Step B: Real Rate of Return (post-retirement, adjusted for inflation)
        # Formula: Real Rate = ((1 + Post_Retire_ROI) / (1 + Inflation)) - 1
        post_retire_roi = assumptions.post_retire_roi
        real_rate = ((1 + post_retire_roi) / (1 + inflation)) - 1
        
        # Step C: Corpus Required
        # Pension Period = Pension Till Age - Retirement Age (per Master Spec Section 6)
        pension_years = pension_till_age - retirement_age
        
        # IMPORTANT: Use ANNUAL periods and ANNUAL expense to match cashflow table 
        # (which uses annual compounding in Approach A)
        annual_expense_at_retirement = expense_at_retirement * 12
        
        # Formula: Corpus = AnnualExpense * (1 - (1 + real_rate)^(-years)) / real_rate
        # This is Present Value of Growing Annuity
        if real_rate == 0:
            corpus_required = annual_expense_at_retirement * pension_years
        else:
            corpus_required = (
                annual_expense_at_retirement * 
                (1 - (1 + real_rate) ** (-pension_years)) / 
                real_rate
            )
        
        # Money Required to Retire Now (present value of corpus)
        # Formula: PV = Corpus / (1 + ROI/12)^months
        pre_retire_roi = assumptions.pre_retire_roi
        monthly_rate = pre_retire_roi / 12
        months_to_retire = metrics["months_to_retire"]
        
        if months_to_retire > 0:
            money_to_retire_now = corpus_required / ((1 + monthly_rate) ** months_to_retire)
        else:
            money_to_retire_now = corpus_required
            
        return {
            "current_monthly_expenses": round(current_monthly_expense, 2),
            "expense_at_retirement_monthly": round(expense_at_retirement, 2),
            "real_rate_percent": round(real_rate * 100, 2),
            "pension_years": pension_years,
            "corpus_required": round(corpus_required, 2),
            "money_to_retire_now": round(money_to_retire_now, 2)
        }

    def _calculate_goals(self) -> List[Dict[str, Any]]:
        """
        Calculate goal analysis with future values AND achievability metrics.
        Implements TRS Section 3.1 (Years to Goal), 3.2 (Future Value), 
        and NEW: Goal Achievability Analysis.
        """
        goals_analysis = []
        current_age = self._calculate_time_metrics()["current_age"]
        inflation = self.state.assumptions.inflation
        pre_retire_roi = self.state.assumptions.pre_retire_roi
        today = date.today()
        
        # Get monthly surplus available for goals
        total_inflow = self._get_total_inflow()
        outflows = self.state.cash_flow.outflows
        essential = outflows.essential
        lifestyle = outflows.lifestyle
        
        if outflows.essential_details:
            d = outflows.essential_details
            essential = (d.house_rent + d.maintenance + d.property_tax + 
                        d.utilities + d.groceries + d.transportation + 
                        d.medical_expenses + d.children_school_fees + 
                        d.insurance_premiums + d.other)
        
        if outflows.lifestyle_details:
            d = outflows.lifestyle_details
            lifestyle = (d.maid_expense + d.shopping + d.travel + 
                        d.dining_entertainment + d.other)
                        
        total_outflow = essential + lifestyle + outflows.linked_emis + outflows.linked_investments
        monthly_surplus = max(0, total_inflow - total_outflow)
        
        # Calculate total SIP required for all goals
        total_sip_for_goals = 0

        for goal in self.state.goals:
            # Calculate Years to Goal based on target_type
            years_to_goal = 0
            
            if goal.target_type == TargetType.AGE or goal.target_type == "AGE":
                # Target is an age
                target_age = int(goal.target_value)
                
                # If goal is for a family member, find their current age
                if goal.person_name:
                    member_age = self._get_family_member_age(goal.person_name)
                    if member_age is not None:
                        years_to_goal = target_age - member_age
                    else:
                        years_to_goal = target_age - current_age
                else:
                    years_to_goal = target_age - current_age
                    
            elif goal.target_type == TargetType.DATE or goal.target_type == "DATE":
                # Target is a date
                try:
                    target_date = date.fromisoformat(str(goal.target_value))
                    years_to_goal = (target_date - today).days / 365.25
                except ValueError:
                    years_to_goal = 0
            
            years_to_goal = max(0, years_to_goal)
            months_to_goal = int(years_to_goal * 12)
            
            # Calculate Future Cost using inflation
            # Formula: FV = CurrentCost * (1 + inflation)^years
            future_cost = goal.current_cost * ((1 + inflation) ** years_to_goal)
            
            # ============================================
            # NEW: GOAL ACHIEVABILITY ANALYSIS
            # ============================================
            
            # Calculate Monthly SIP required to achieve goal
            # Formula: PMT = FV * r / ((1+r)^n - 1) for ordinary annuity
            monthly_rate = pre_retire_roi / 12
            sip_required = 0
            
            if months_to_goal > 0 and monthly_rate > 0:
                sip_required = (future_cost * monthly_rate) / (((1 + monthly_rate) ** months_to_goal) - 1)
            elif months_to_goal > 0:
                sip_required = future_cost / months_to_goal
            else:
                sip_required = future_cost  # Immediate goal
            
            total_sip_for_goals += sip_required
            
            # Determine goal status
            if months_to_goal <= 0:
                status = "PAST_DUE"
                feasibility = "Critical"
            elif sip_required <= 0:
                status = "ACHIEVED"
                feasibility = "Excellent"
            elif sip_required <= monthly_surplus * 0.3:  # Can be achieved with < 30% of surplus
                status = "ON_TRACK"
                feasibility = "Highly Achievable"
            elif sip_required <= monthly_surplus * 0.6:  # Needs 30-60% of surplus
                status = "NEEDS_ATTENTION"
                feasibility = "Achievable with Focus"
            elif sip_required <= monthly_surplus:  # Needs most of surplus
                status = "AT_RISK"
                feasibility = "Challenging"
            else:
                status = "CRITICAL"
                feasibility = "Needs Revision"
            
            # Calculate what percentage of surplus this goal needs
            surplus_allocation_percent = (sip_required / monthly_surplus * 100) if monthly_surplus > 0 else 100
            
            goals_analysis.append({
                "id": goal.id,
                "name": goal.name,
                "person_name": goal.person_name,
                "current_cost": goal.current_cost,
                "years_to_goal": round(years_to_goal, 2),
                "months_to_goal": months_to_goal,
                "future_cost": round(future_cost, 2),
                # NEW: Achievability fields
                "monthly_sip_required": round(sip_required, 2),
                "status": status,
                "feasibility": feasibility,
                "surplus_allocation_percent": round(min(surplus_allocation_percent, 100), 1)
            })
        
        # Add summary metrics
        all_goals_sip = total_sip_for_goals
        surplus_after_goals = monthly_surplus - all_goals_sip
        
        # Attach goal summary to first goal for easy access (or could be separate)
        if goals_analysis:
            goals_analysis[0]["_summary"] = {
                "total_monthly_sip_for_all_goals": round(all_goals_sip, 2),
                "monthly_surplus_available": round(monthly_surplus, 2),
                "surplus_after_all_goals": round(surplus_after_goals, 2),
                "all_goals_feasible": surplus_after_goals >= 0
            }
            
        return goals_analysis

    def _get_family_member_age(self, name: str) -> float | None:
        """Get current age of a family member by name."""
        today = date.today()
        
        # Check in family_members list
        for member in self.state.user_profile.family_members:
            if member.name.lower() == name.lower() and member.dob:
                days = (today - member.dob).days
                return days / 365.25
        
        # Check spouse
        if self.state.user_profile.spouse:
            if self.state.user_profile.spouse.name.lower() == name.lower():
                if self.state.user_profile.spouse.dob:
                    days = (today - self.state.user_profile.spouse.dob).days
                    return days / 365.25
        
        return None

    def _get_total_inflow(self) -> float:
        """Calculate total monthly inflow from all sources."""
        inflows = self.state.cash_flow.inflows
        
        return (
            inflows.primary_income + 
            getattr(inflows, 'spouse_income', 0) +
            inflows.rental_income + 
            getattr(inflows, 'additional_income', 0) +
            getattr(inflows, 'other', 0)
        )

    def _get_total_assets(self) -> float:
        """Calculate total asset value."""
        assets = self.state.assets
        
        # Real Estate (present value)
        real_estate_value = sum(
            getattr(a, 'present_value', getattr(a, 'value', 0)) 
            for a in assets.real_estate
        )
        
        # Bank Accounts
        bank_balance = sum(
            a.balance for a in getattr(assets, 'bank_accounts', [])
        )
        
        # Investments
        investment_value = sum(a.current_value for a in assets.investments)
        
        # Insurance (maturity amounts if available)
        insurance_value = sum(
            p.maturity_amount or 0 
            for p in getattr(assets, 'insurance_policies', [])
        )
        
        # Liquid Cash
        liquid_cash = assets.liquid_cash
        
        return real_estate_value + bank_balance + investment_value + insurance_value + liquid_cash

    def _get_total_liabilities(self) -> float:
        """Calculate total liability value."""
        return sum(l.outstanding for l in self.state.liabilities)

    def _generate_dashboard_metrics(self, corpus_required: float) -> Dict[str, Any]:
        """
        Generate final dashboard metrics as per TRS Section 6.
        
        Implements:
        - Net Worth
        - Savings Rate
        - EMI Burden
        - Investment Rate
        - Expense category percentages
        - Retirement Gap & SIP Required
        """
        inflows = self.state.cash_flow.inflows
        outflows = self.state.cash_flow.outflows
        assumptions = self.state.assumptions
        
        # === Total Inflow ===
        total_inflow = self._get_total_inflow()
        
        # === Asset & Liability Totals ===
        total_assets = self._get_total_assets()
        total_liabilities = self._get_total_liabilities()
        net_worth = total_assets - total_liabilities
        
        # === Expense Categories ===
        essential = outflows.essential
        lifestyle = outflows.lifestyle
        
        # Add detailed if available
        if outflows.essential_details:
            d = outflows.essential_details
            essential = (d.house_rent + d.maintenance + d.property_tax + 
                        d.utilities + d.groceries + d.transportation + 
                        d.medical_expenses + d.children_school_fees + 
                        d.insurance_premiums + d.other)
        
        if outflows.lifestyle_details:
            d = outflows.lifestyle_details
            lifestyle = (d.maid_expense + d.shopping + d.travel + 
                        d.dining_entertainment + d.other)
        
        total_emi = outflows.linked_emis
        total_investments = outflows.linked_investments
        
        # === Total Outflow ===
        total_outflow = essential + lifestyle + total_emi + total_investments
        leftover = total_inflow - total_outflow
        
        # === Key Ratios (TRS Section 6) ===
        if total_inflow > 0:
            savings_rate = (leftover / total_inflow) * 100
            emi_burden = (total_emi / total_inflow) * 100
            investment_rate = (total_investments / total_inflow) * 100
            essential_percent = (essential / total_inflow) * 100
            lifestyle_percent = (lifestyle / total_inflow) * 100
        else:
            savings_rate = emi_burden = investment_rate = 0
            essential_percent = lifestyle_percent = 0
        
        # === Retirement Projections ===
        pre_retire_roi = assumptions.pre_retire_roi
        monthly_rate = pre_retire_roi / 12
        months_to_retire = self._calculate_time_metrics()["months_to_retire"]
        
        # Current investible assets (financial assets, not real estate)
        current_investible = (
            sum(a.current_value for a in self.state.assets.investments) + 
            sum(a.balance for a in getattr(self.state.assets, 'bank_accounts', [])) +
            self.state.assets.liquid_cash
        )
        
        # Future Value of Current Lumpsum
        # FV = PV * (1 + r)^n
        fv_lumpsum = current_investible * ((1 + monthly_rate) ** months_to_retire)
        
        # Future Value of SIP (using annuity formula)
        # FV = PMT * ((1 + r)^n - 1) / r * (1 + r)  [Annuity Due]
        current_sip = total_investments
        if monthly_rate > 0 and months_to_retire > 0:
            fv_sip = current_sip * (((1 + monthly_rate) ** months_to_retire - 1) / monthly_rate) * (1 + monthly_rate)
        else:
            fv_sip = current_sip * months_to_retire
        
        projected_corpus = fv_lumpsum + fv_sip
        retirement_gap = corpus_required - projected_corpus
        
        # === Extra SIP Needed (TRS Section 3.4) ===
        # Formula: PMT = (FV * r) / ((1 + r)^n - 1) / (1 + r)
        extra_sip_needed = 0
        if retirement_gap > 0 and months_to_retire > 0:
            if monthly_rate > 0:
                extra_sip_needed = (retirement_gap * monthly_rate) / (((1 + monthly_rate) ** months_to_retire - 1) * (1 + monthly_rate))
            else:
                extra_sip_needed = retirement_gap / months_to_retire

        return {
            "total_assets": round(total_assets, 2),
            "total_liabilities": round(total_liabilities, 2),
            "net_worth": round(net_worth, 2),
            "total_monthly_inflow": round(total_inflow, 2),
            "total_monthly_outflow": round(total_outflow, 2),
            "leftover_savings": round(leftover, 2),
            "savings_rate": round(savings_rate, 2),
            "emi_burden": round(emi_burden, 2),
            "investment_rate": round(investment_rate, 2),
            "essential_expense_percent": round(essential_percent, 2),
            "lifestyle_expense_percent": round(lifestyle_percent, 2),
            "projected_corpus": round(projected_corpus, 2),
            "retirement_gap": round(retirement_gap, 2),
            "extra_sip_required": round(extra_sip_needed, 2)
        }

    # =========================================================================
    # EXTENDED CALCULATIONS - Section 4.5, 5.1, 5.2, 5.3
    # =========================================================================

    def _calculate_retirement_cashflow_table(self, retirement_data: Dict) -> List[Dict]:
        """
        Generate year-by-year retirement cashflow table (Section 4.5).
        Shows corpus balance from retirement age to life expectancy.
        
        Uses Approach A (annual compounding):
        End Value = Begin Value * (1 + Return) - Pension Paid for Year
        Monthly pension grows by inflation each year.
        """
        primary = self.state.user_profile.primary
        assumptions = self.state.assumptions
        
        retirement_age = primary.retirement_age if hasattr(primary, 'retirement_age') else primary.retire_age
        # Use pension_till_age per Master Spec Section 7
        pension_till_age = getattr(primary, 'pension_till_age', primary.life_expectancy)
        
        corpus_return = assumptions.post_retire_roi
        inflation = assumptions.inflation
        
        # Starting values
        begin_value = retirement_data["corpus_required"]
        monthly_pension = retirement_data["expense_at_retirement_monthly"]
        
        cashflow_table = []
        
        for age in range(retirement_age, pension_till_age + 1):
            pension_yearly = monthly_pension * 12
            
            # End value using annual compounding (Approach A)
            end_value = begin_value * (1 + corpus_return) - pension_yearly
            
            cashflow_table.append({
                "year": age,
                "begin_value": round(begin_value, 2),
                "monthly_pension": round(monthly_pension, 2),
                "pension_paid_yearly": round(pension_yearly, 2),
                "end_value": round(max(0, end_value), 2)  # Prevent negative
            })
            
            # Next year setup
            begin_value = max(0, end_value)
            monthly_pension = monthly_pension * (1 + inflation)  # Pension grows with inflation
        
        return cashflow_table

    def _calculate_child_planning(self, child_inflation: float = None) -> List[Dict]:
        """
        Calculate future planning for each child's goals (Section 5.1).
        Links goals by person_name to children in family_members.
        
        For each child:
        - Finds all goals where person_name matches child's name
        - Calculates: months_left, cost_at_target, monthly_sip_required
        
        Uses PMT formula for SIP:
        PMT = (FV * r) / ((1 + r)^n - 1) for ordinary annuity
        """
        from enums import RelationshipType
        
        # Use child_inflation (10%) from assumptions per Master Spec Section 8
        if child_inflation is None:
            child_inflation = getattr(self.state.assumptions, 'child_inflation', self.state.assumptions.inflation)
        
        expected_return = self.state.assumptions.pre_retire_roi
        today = date.today()
        
        child_planning_results = []
        
        # Find all children in family members
        children = [
            m for m in self.state.user_profile.family_members 
            if m.relation_type == RelationshipType.CHILD or m.relation_type == "CHILD"
        ]
        
        for child in children:
            if not child.dob:
                continue
                
            # Calculate child's current age
            child_age = (today - child.dob).days / 365.25
            
            # Find goals linked to this child
            child_goals = [g for g in self.state.goals if g.person_name and g.person_name.lower() == child.name.lower()]
            
            goal_plans = []
            total_sip = 0
            
            for goal in child_goals:
                try:
                    target_age = int(goal.target_value)
                except (ValueError, TypeError):
                    continue
                
                # Months left until goal
                years_left = target_age - child_age
                if years_left <= 0:
                    continue
                    
                months_left = int(years_left * 12)
                
                # Cost at target age (inflation adjusted)
                cost_at_target = goal.current_cost * ((1 + child_inflation) ** years_left)
                
                # Monthly SIP required using PMT formula
                monthly_rate = expected_return / 12
                if monthly_rate > 0 and months_left > 0:
                    # PMT for ordinary annuity: PMT = FV * r / ((1+r)^n - 1)
                    sip_required = (cost_at_target * monthly_rate) / (((1 + monthly_rate) ** months_left) - 1)
                else:
                    sip_required = cost_at_target / max(months_left, 1)
                
                goal_plans.append({
                    "goal_name": goal.name,
                    "present_cost": round(goal.current_cost, 2),
                    "target_age": target_age,
                    "months_left": months_left,
                    "inflation": round(child_inflation * 100, 2),
                    "cost_at_target": round(cost_at_target, 2),
                    "expected_return": round(expected_return * 100, 2),
                    "monthly_sip_required": round(sip_required, 2)
                })
                
                total_sip += sip_required
            
            if goal_plans:  # Only add if child has goals
                child_planning_results.append({
                    "child_name": child.name,
                    "child_current_age": round(child_age, 1),
                    "goals": goal_plans,
                    "total_monthly_sip": round(total_sip, 2)
                })
        
        return child_planning_results

    def _calculate_contingency_fund(self, months: int = 6) -> Dict:
        """
        Calculate emergency fund requirement (Section 5.2).
        
        Formula: Contingency Fund = Monthly Expenses × Number of Months
        Uses the same monthly expenses as retirement calculation (Essential + Lifestyle).
        """
        monthly_expenses = self._get_monthly_expenses()
        
        return {
            "monthly_expenses": round(monthly_expenses, 2),
            "months_required": months,
            "contingency_fund_required": round(monthly_expenses * months, 2)
        }

    def _calculate_insurance_cover(self, growth: float = 0.05) -> List[Dict]:
        """
        Calculate life insurance cover required for earning members (Section 5.3).
        
        Formula: InsuranceCover = AnnualIncome × (((1+g)^YearsLeft - 1) / g)
        This is the sum of growing income from now until retirement.
        
        Safe handling: If growth is 0, use simple multiplication.
        """
        today = date.today()
        primary = self.state.user_profile.primary
        inflows = self.state.cash_flow.inflows
        
        insurance_results = []
        
        # Primary user
        primary_dob = primary.dob
        primary_age = (today - primary_dob).days / 365.25
        retirement_age = primary.retirement_age if hasattr(primary, 'retirement_age') else primary.retire_age
        years_left = max(0, retirement_age - primary_age)
        
        primary_monthly = inflows.primary_income
        if primary_monthly > 0:
            annual_income = primary_monthly * 12
            
            if growth > 0 and years_left > 0:
                insurance_cover = annual_income * (((1 + growth) ** years_left - 1) / growth)
            else:
                insurance_cover = annual_income * years_left
            
            insurance_results.append({
                "member_name": primary.name,
                "monthly_income": round(primary_monthly, 2),
                "current_age": round(primary_age, 2),
                "retirement_age": retirement_age,
                "expected_growth": round(growth * 100, 2),
                "years_left": int(years_left),
                "insurance_cover_required": round(insurance_cover, 2)
            })
        
        # Spouse (if working)
        if self.state.user_profile.spouse and inflows.spouse_income > 0:
            spouse = self.state.user_profile.spouse
            spouse_age = (today - spouse.dob).days / 365.25
            # Use spouse's own retirement age per Master Spec Section 10
            spouse_retirement_age = getattr(spouse, 'retirement_age', retirement_age) or retirement_age
            spouse_years_left = max(0, spouse_retirement_age - spouse_age)
            
            spouse_monthly = inflows.spouse_income
            annual_income = spouse_monthly * 12
            
            if growth > 0 and spouse_years_left > 0:
                insurance_cover = annual_income * (((1 + growth) ** spouse_years_left - 1) / growth)
            else:
                insurance_cover = annual_income * spouse_years_left
            
            insurance_results.append({
                "member_name": spouse.name,
                "monthly_income": round(spouse_monthly, 2),
                "current_age": round(spouse_age, 2),
                "retirement_age": spouse_retirement_age,
                "expected_growth": round(growth * 100, 2),
                "years_left": int(spouse_years_left),
                "insurance_cover_required": round(insurance_cover, 2)
            })
        
        return insurance_results
