# Technical Requirements Specification (TRS)
## Personal Financial Planning AI Application

### Version 1.0
### Date: January 17, 2026

---

## 1. Purpose

This document defines the technical requirements, calculation formulas, data validation rules, and interconnection logic for the Personal Financial Planning AI Application.

---

## 2. System Architecture

### 2.1 Technology Stack

**Backend**:
- FastAPI (Python 3.12+)
- SQLAlchemy ORM
- Alembic (Database Migrations)
- Pydantic (Data Validation)
- OpenAI API (LLM Integration)
- SQLite (Development) / PostgreSQL (Production)

**Frontend**:
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Zustand (State Management)
- Lucide React (Icons)

---

## 3. Calculation Formulas

All calculations must use exact mathematical formulas as specified below.

### 3.1 Time-Based Calculations

#### Current Age
```
Age = DATEDIF(DateOfBirth, TODAY, "YEARS")
   = (TODAY - DateOfBirth) / 365.25 days
```

**Implementation**:
```python
from datetime import date

def calculate_age(dob: date) -> float:
    days_lived = (date.today() - dob).days
    return days_lived / 365.25
```

#### Years to Retirement
```
YearsToRetire = RetirementAge - CurrentAge
```

#### Months to Retirement
```
MonthsToRetire = YearsToRetire × 12
```

#### Years to Goal (Age-Based)
```
YearsToGoal = TargetAge - CurrentAge (of associated person)
```

#### Years to Goal (Date-Based)
```
YearsToGoal = DATEDIF(TODAY, TargetDate, "YEARS")
            = (TargetDate - TODAY) / 365.25
```

---

### 3.2 Future Value Calculations

#### Goal Future Cost (with Inflation)
```
FutureCost = CurrentCost × (1 + InflationRate)^YearsToGoal
```

**Example**:
- Current Cost = ₹1,000,000
- Inflation = 6%
- Years = 12
- Future Cost = 1,000,000 × (1.06)^12 = ₹2,012,196

**Implementation**:
```python
def calculate_future_cost(current_cost: float, inflation: float, years: float) -> float:
    return current_cost * ((1 + inflation) ** years)
```

#### Expense at Retirement
```
ExpenseAtRetirement = CurrentMonthlyExpenses × (1 + Inflation)^YearsToRetire
```

---

### 3.3 Retirement Corpus Calculation

#### Step 1: Calculate Real Rate of Return
```
RealRate = ((1 + PostRetirementROI) / (1 + Inflation)) - 1
```

**Example**:
- Post-Retirement ROI = 8%
- Inflation = 6%
- Real Rate = ((1.08) / (1.06)) - 1 = 0.0189 = 1.89%

#### Step 2: Calculate Pension Period
```
PensionYears = LifeExpectancy - RetirementAge
PensionMonths = PensionYears × 12
```

#### Step 3: Calculate Corpus Required (Annuity Formula)
```
CorpusRequired = MonthlyExpense × [(1 - (1 + r)^(-n)) / r]

Where:
  MonthlyExpense = ExpenseAtRetirement
  r = RealRate (monthly) = RealRate (calculated above)
  n = PensionMonths
```

**Special Case**: If RealRate = 0:
```
CorpusRequired = MonthlyExpense × PensionMonths
```

**Implementation**:
```python
def calculate_corpus_required(
    monthly_expense: float,
    pension_months: int,
    real_rate: float
) -> float:
    if real_rate == 0:
        return monthly_expense * pension_months
    else:
        return monthly_expense * (
            (1 - (1 + real_rate) ** (-pension_months)) / real_rate
        )
```

#### Step 4: Money Required to Retire Now (Present Value)
```
MoneyToRetireNow = CorpusRequired / (1 + MonthlyROI)^MonthsToRetire

Where:
  MonthlyROI = PreRetirementROI / 12
```

**Implementation**:
```python
def calculate_money_to_retire_now(
    corpus_required: float,
    months_to_retire: int,
    annual_roi: float
) -> float:
    monthly_rate = annual_roi / 12
    if months_to_retire > 0:
        return corpus_required / ((1 + monthly_rate) ** months_to_retire)
    else:
        return corpus_required
```

---

### 3.4 SIP Requirement Calculation

#### Future Value of Existing Lumpsum
```
FV_Lumpsum = CurrentInvestibleAssets × (1 + MonthlyROI)^MonthsToRetire
```

#### Future Value of Current SIP (Annuity Due)
```
FV_SIP = CurrentSIP × [((1 + r)^n - 1) / r] × (1 + r)

Where:
  r = MonthlyROI = AnnualROI / 12
  n = MonthsToRetire
```

#### Projected Corpus
```
ProjectedCorpus = FV_Lumpsum + FV_SIP
```

#### Retirement Gap
```
RetirementGap = CorpusRequired - ProjectedCorpus
```

#### Extra SIP Required (PMT Formula)
```
If RetirementGap > 0:
  ExtraSIP = (RetirementGap × r) / [((1 + r)^n - 1) × (1 + r)]
  
  Where:
    r = MonthlyROI
    n = MonthsToRetire

Else:
  ExtraSIP = 0
```

**Implementation**:
```python
def calculate_extra_sip_required(
    retirement_gap: float,
    months_to_retire: int,
    annual_roi: float
) -> float:
    if retirement_gap <= 0 or months_to_retire <= 0:
        return 0
    
    monthly_rate = annual_roi / 12
    
    if monthly_rate > 0:
        return (retirement_gap * monthly_rate) / (
            ((1 + monthly_rate) ** months_to_retire - 1) * (1 + monthly_rate)
        )
    else:
        return retirement_gap / months_to_retire
```

---

### 3.5 Cash Flow Calculations

#### Total Monthly Inflow
```
TotalInflow = PrimaryIncome + SpouseIncome + RentalIncome + AdditionalIncome + OtherIncome
```

#### Total Essential Expenses
```
TotalEssential = HouseRent + Maintenance + PropertyTax + Utilities + 
                 Groceries + Transportation + MedicalExpenses + 
                 ChildrenSchoolFees + InsurancePremiums + Other
```

#### Total Lifestyle Expenses
```
TotalLifestyle = MaidExpense + Shopping + Travel + DiningEntertainment + Other
```

#### Total Investments (Monthly)
```
TotalInvestments = MutualFundSIP + StockSIP + RecurringDeposit + ChitFund + Other
```

#### Total EMIs
```
TotalEMIs = SUM(Liabilities.EMI)
```
**Note**: This is auto-linked from the Liabilities table.

#### Total Outflows
```
TotalOutflows = TotalEssential + TotalLifestyle + TotalEMIs + TotalInvestments
```

#### Leftover / Savings
```
Leftover = TotalInflow - TotalOutflows
```

---

### 3.6 Financial Ratios (Dashboard Metrics)

All percentages are calculated as a ratio of Total Inflow:

#### Savings Rate
```
SavingsRate% = (Leftover / TotalInflow) × 100
```

#### EMI Burden
```
EMIBurden% = (TotalEMIs / TotalInflow) × 100
```

#### Investment Rate
```
InvestmentRate% = (TotalInvestments / TotalInflow) × 100
```

#### Essential Expense Percentage
```
EssentialExpense% = (TotalEssential / TotalInflow) × 100
```

#### Lifestyle Expense Percentage
```
LifestyleExpense% = (TotalLifestyle / TotalInflow) × 100
```

**Validation Rule**: 
```
SavingsRate% + EMIBurden% + InvestmentRate% + EssentialExpense% + LifestyleExpense% = 100%
```

---

### 3.7 Net Worth Calculation

#### Total Assets
```
TotalAssets = RealEstateValue + BankBalance + InvestmentsValue + 
              InsuranceMaturityValue + LiquidCash

Where:
  RealEstateValue = SUM(RealEstate.PresentValue)
  BankBalance = SUM(BankAccounts.Balance)
  InvestmentsValue = SUM(Investments.CurrentValue)
  InsuranceMaturityValue = SUM(Insurance.MaturityAmount) [if available]
  LiquidCash = User input
```

#### Total Liabilities
```
TotalLiabilities = SUM(Liabilities.Outstanding)
```

#### Net Worth
```
NetWorth = TotalAssets - TotalLiabilities
```

---

## 4. Data Interconnection Rules

These rules define how data flows between different sections.

### 4.1 Liabilities → Cash Flow
```
CashFlow.Outflows.LinkedEMIs = SUM(Liabilities.EMI)
```
**Trigger**: Whenever a liability is added/updated/deleted

### 4.2 Investments → Cash Flow
```
CashFlow.Outflows.LinkedInvestments = SUM(Investments.MonthlySIP)
```
**Trigger**: Whenever an investment is added/updated/deleted

### 4.3 Cash Flow → Retirement Planning
```
RetirementPlanning.CurrentMonthlyExpenses = CashFlow.TotalEssential + CashFlow.TotalLifestyle
```
**Note**: Does NOT include EMIs or Investments

### 4.4 Family Details → Retirement Planning
```
RetirementPlanning.YearsToRetire = User.RetirementAge - User.CurrentAge
```

### 4.5 Family Details → Goals
```
For each goal with person_name:
  If goal.target_type == "AGE":
    YearsToGoal = goal.target_value - GetPersonAge(goal.person_name)
```

---

## 5. Data Validation Rules

### 5.1 Required Fields

**User Profile**:
- ✅ Name (non-empty string)
- ✅ Date of Birth (valid date, not in future)
- ✅ Retirement Age (18-100, > Current Age)
- ✅ Life Expectancy (> Retirement Age, typically 75-100)

**Goals**:
- ✅ Name (non-empty)
- ✅ Current Cost (> 0)
- ✅ Target Type (AGE or DATE)
- ✅ Target Value (valid age or future date)

**Assets**:
- ✅ All monetary values >= 0
- ✅ Interest rates: 0-30%
- ✅ Dates: Start Date <= End Date

**Liabilities**:
- ✅ Outstanding > 0
- ✅ EMI > 0
- ✅ Interest Rate > 0
- ✅ Tenure > 0

**Cash Flow**:
- ✅ All values >= 0
- ✅ Total Inflow > 0 (cannot be zero)

### 5.2 Logical Validations

```
1. RetirementAge > CurrentAge
2. LifeExpectancy > RetirementAge
3. For Real Estate: OutstandingLoan <= PresentValue
4. For Liabilities: Outstanding <= TotalLoanAmount
5. For Goals with AGE: TargetAge > CurrentAge (of person)
6. For Goals with DATE: TargetDate > TODAY
7. Leftover = TotalInflow - TotalOutflows (must balance)
```

### 5.3 Data Type Validations

```python
# Dates
- Format: YYYY-MM-DD
- Type: date object (not string)

# Monetary Values
- Type: float
- Precision: 2 decimal places
- Min: 0
- Max: 999,999,999,999 (1 trillion)

# Percentages (for ROI, Interest, Inflation)
- Type: float (stored as decimal, e.g., 0.06 for 6%)
- Min: 0
- Max: 1 (100%)

# Ages
- Type: integer
- Min: 0
- Max: 120

# Enums
- Must match defined enum values exactly
- Case-sensitive
```

---

## 6. Quality Checks

### 6.1 Financial Health Indicators

```
Healthy Ranges (Industry Standard):
- Savings Rate: >= 20%
- EMI Burden: <= 40%
- Investment Rate: >= 15%
- Essential Expenses: <= 50%
- Lifestyle Expenses: <= 30%
```

**Warnings to Display**:
- ⚠️ If EMI Burden > 40%: "Your EMI burden is high. Consider debt consolidation."
- ⚠️ If Savings Rate < 10%: "Your savings rate is low. Review expenses."
- ⚠️ If Investment Rate < 10%: "Increase investments for long-term goals."

### 6.2 Retirement Adequacy Check

```
Insurance Coverage Rule (10x Rule):
  RecommendedCoverage = AnnualIncome × 10
  If TotalSumAssured < RecommendedCoverage:
    ⚠️ Warning: "Increase life insurance coverage"

Emergency Fund Rule (6-month Rule):
  RequiredEmergencyFund = MonthlyExpenses × 6
  If LiquidAssets < RequiredEmergencyFund:
    ⚠️ Warning: "Build emergency fund"
```

---

## 7. API Response Structure

### 7.1 Analysis Endpoint Response

```json
{
  "time_metrics": {
    "current_age": 38.75,
    "retirement_age": 60,
    "years_to_retire": 21.25,
    "months_to_retire": 255
  },
  "retirement": {
    "current_monthly_expenses": 60000,
    "expense_at_retirement_monthly": 205632.15,
    "real_rate_percent": 1.89,
    "pension_years": 25,
    "pension_months": 300,
    "corpus_required": 55234567.89,
    "money_to_retire_now": 12345678.90
  },
  "goals": [
    {
      "id": "goal-1",
      "name": "Child 1 Graduation",
      "person_name": "Child 1",
      "current_cost": 1000000,
      "years_to_goal": 12.5,
      "future_cost": 2012196.45
    }
  ],
  "summary": {
    "total_assets": 15000000,
    "total_liabilities": 3500000,
    "net_worth": 11500000,
    "total_monthly_inflow": 235000,
    "total_monthly_outflow": 185000,
    "leftover_savings": 50000,
    "savings_rate": 21.28,
    "emi_burden": 21.28,
    "investment_rate": 17.02,
    "essential_expense_percent": 25.53,
    "lifestyle_expense_percent": 14.89,
    "projected_corpus": 45000000,
    "retirement_gap": 10234567.89,
    "extra_sip_required": 15432.10
  },
  "ai_analysis": {
    "summary": "Based on your financial profile...",
    "recommendations": [
      "Increase SIP by ₹15,432 to bridge retirement gap",
      "Review debt-to-income ratio",
      "Build emergency fund of ₹360,000"
    ],
    "warnings": [
      "EMI burden is high at 21.28%"
    ]
  }
}
```

---

## 8. Performance Requirements

### 8.1 Response Times
- Analysis calculation: < 500ms
- CRUD operations: < 200ms
- LLM response: < 3s

### 8.2 Scalability
- Support 10,000 concurrent users
- Database query optimization with indexes
- Caching for frequently accessed data

---

## 9. Security Requirements

### 9.1 Authentication
- JWT token-based authentication
- Token expiry: 24 hours
- Refresh token: 30 days

### 9.2 Data Protection
- Passwords: Bcrypt hashing with salt
- PAN numbers: Encrypted at rest
- HTTPS only in production

### 9.3 Authorization
- Users can only access their own data
- Role-based access control (User, Admin)

---

## 10. Error Handling

### 10.1 Error Codes

```
400 - Bad Request (validation error)
401 - Unauthorized (invalid/missing token)
403 - Forbidden (insufficient permissions)
404 - Not Found (resource doesn't exist)
500 - Internal Server Error (calculation error, database error)
```

### 10.2 Error Response Format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Retirement age must be greater than current age",
    "details": {
      "field": "retirement_age",
      "value": 35,
      "current_age": 38
    }
  }
}
```

---

## 11. Testing Requirements

### 11.1 Unit Tests
- Code coverage: >= 80%
- All calculation formulas must have test cases
- Edge cases (zero values, null values, negative numbers)

### 11.2 Integration Tests
- End-to-end workflow tests
- API endpoint tests
- Database transaction tests

### 11.3 Test Data
Use realistic test data matching the Consolidated Template examples.

---

## Appendix: Formula Quick Reference

| Calculation | Formula |
|-------------|---------|
| Age | `(TODAY - DOB) / 365.25` |
| Years to Retire | `RetirementAge - CurrentAge` |
| Future Cost | `CurrentCost × (1 + Inflation)^Years` |
| Real Rate | `((1 + ROI) / (1 + Inflation)) - 1` |
| Corpus Required | `Expense × (1 - (1 + r)^(-n)) / r` |
| PV of Corpus | `Corpus / (1 + r)^n` |
| SIP Required | `(Gap × r) / ((1 + r)^n - 1) × (1 + r)` |
| Savings Rate % | `(Leftover / TotalInflow) × 100` |
| Net Worth | `TotalAssets - TotalLiabilities` |
