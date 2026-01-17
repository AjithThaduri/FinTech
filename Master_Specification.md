# Master Specification Document
## Personal Financial Planning AI Application

### Version 1.0
### Date: January 17, 2026

---

## 1. Executive Summary

The Personal Financial Planning AI Application is a comprehensive web-based platform that combines traditional financial planning calculations with AI-powered insights to help users plan their financial future. The system acts as a virtual financial advisor, guiding users through data collection, performing complex calculations, and providing personalized recommendations.

---

## 2. System Overview

### 2.1 Purpose
To provide users with:
- Comprehensive financial health assessment
- Retirement planning with corpus calculation
- Goal-based financial planning
- AI-powered insights and recommendations
- Interactive chat-based data collection

### 2.2 Target Users
- Individual investors (age 25-60)
- Families planning for major life goals
- Professionals seeking retirement planning
- Anyone wanting to understand their financial position

---

## 3. System Architecture

### 3.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        User Browser                          │
│  ┌────────────────────────────────────────────────────────┐ │
│  │          Next.js Frontend (TypeScript)                 │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐ │ │
│  │  │   Chat   │  │  Forms   │  │  Summary Dashboard   │ │ │
│  │  │Interface │  │ Widgets  │  │                      │ │ │
│  │  └────┬─────┘  └────┬─────┘  └──────────┬───────────┘ │ │
│  │       └─────────────┴────────────────────┘             │ │
│  │                      │                                  │ │
│  │              Zustand State Store                        │ │
│  └──────────────────────┼──────────────────────────────────┘ │
└─────────────────────────┼──────────────────────────────────┘
                          │ REST API (JSON)
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              FastAPI Backend (Python)                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                  API Endpoints                        │   │
│  │  /api/users, /api/goals, /api/assets, /api/analyze   │   │
│  └────┬─────────────────────────────┬───────────────────┘   │
│       │                             │                        │
│  ┌────▼─────────┐  ┌───────────────▼───────────────┐       │
│  │ CRUD Service │  │  Financial Calculation Engine  │       │
│  └────┬─────────┘  └───────────────┬───────────────┘       │
│       │                             │                        │
│       │            ┌────────────────▼───────────────┐       │
│       │            │      AI Service (OpenAI)       │       │
│       │            └────────────────────────────────┘       │
│  ┌────▼─────────────────────────────────────────────────┐  │
│  │  SQLAlchemy ORM + Alembic Migrations                 │  │
│  └────┬─────────────────────────────────────────────────┘  │
└───────┼──────────────────────────────────────────────────────┘
        │
┌───────▼──────────────────────────────────────────────────────┐
│              Database (SQLite / PostgreSQL)                  │
│  Tables: users, spouses, family_members, goals, assets,     │
│          liabilities, cash_flows, assumptions                │
└──────────────────────────────────────────────────────────────┘
```

### 3.2 Component Breakdown

#### Frontend Components
1. **ChatInterface**: Conversational UI for guided data collection
2. **Form Widgets**: Specialized forms for each data category
   - FamilyDetailsForm
   - GoalForm
   - AssetsForm
   - LiabilityForm
   - CashFlowForm
3. **SummaryDashboard**: Visual display of financial metrics
4. **State Management**: Zustand store for application state

#### Backend Services
1. **API Layer**: RESTful endpoints for all operations
2. **CRUD Service**: Database operations
3. **Financial Engine**: Mathematical calculations
4. **AI Service**: LLM integration for insights
5. **Authentication Service**: User management and security

---

## 4. Data Model

### 4.1 Entity Relationship Diagram

```
┌─────────────┐
│    User     │
│ (Primary)   │
└──────┬──────┘
       │
       ├─────────────┬──────────────┬─────────────┬──────────────┬──────────────┐
       │             │              │             │              │              │
   ┌───▼───┐   ┌────▼────┐   ┌─────▼─────┐  ┌──▼──────┐  ┌────▼─────┐  ┌────▼────┐
   │Spouse │   │ Family  │   │   Goals   │  │ Assets  │  │Liabilities│  │CashFlow │
   │       │   │ Members │   │           │  │         │  │           │  │         │
   └───────┘   └─────────┘   └───────────┘  └─────────┘  └───────────┘  └─────────┘
                                                  │
                                    ┌─────────────┼─────────────┬──────────────┐
                                    │             │             │              │
                              ┌─────▼──────┐ ┌───▼────┐  ┌────▼──────┐  ┌───▼─────┐
                              │Real Estate │ │ Bank   │  │Investments│  │Insurance│
                              │   Assets   │ │Accounts│  │  Assets   │  │ Policies│
                              └────────────┘ └────────┘  └───────────┘  └─────────┘
```

### 4.2 Core Entities

#### User (Primary Account Holder)
```json
{
  "id": "uuid",
  "name": "string",
  "dob": "date",
  "retirement_age": "integer",
  "life_expectancy": "integer",
  "address": "string",
  "mobile": "string",
  "email": "string",
  "designation": "string",
  "organisation": "string"
}
```

#### Spouse
```json
{
  "id": "uuid",
  "user_id": "foreign_key",
  "name": "string",
  "dob": "date",
  "working_status": "boolean",
  "pan": "string",
  "mobile": "string",
  "email": "string",
  "designation": "string",
  "organisation": "string"
}
```

#### Family Members
```json
{
  "id": "uuid",
  "user_id": "foreign_key",
  "name": "string",
  "dob": "date",
  "pan": "string",
  "relation_type": "enum(PRIMARY, SPOUSE, CHILD, FATHER, MOTHER)",
  "expected_retirement_age": "integer"
}
```

#### Goals
```json
{
  "id": "uuid",
  "user_id": "foreign_key",
  "person_name": "string",
  "name": "string",
  "current_cost": "float",
  "target_type": "enum(AGE, DATE)",
  "target_value": "string"
}
```

#### Assets (Multiple Tables)
```json
// Real Estate
{
  "id": "uuid",
  "user_id": "foreign_key",
  "name": "string",
  "present_value": "float",
  "outstanding_loan": "float",
  "interest_rate": "float",
  "loan_till": "date",
  "emi": "float",
  "roi": "float",
  "remarks": "string"
}

// Bank Accounts
{
  "id": "uuid",
  "user_id": "foreign_key",
  "bank_name": "string",
  "account_type": "enum(Savings, Current, FD, RD)",
  "balance": "float",
  "interest_rate": "float",
  "maturity_date": "date",
  "remarks": "string"
}

// Investments
{
  "id": "uuid",
  "user_id": "foreign_key",
  "type": "enum(MF, Stock, FD, RD, Chit, Other)",
  "invested_amount": "float",
  "current_value": "float",
  "monthly_sip": "float",
  "start_date": "date",
  "end_date": "date",
  "remarks": "string"
}

// Insurance
{
  "id": "uuid",
  "user_id": "foreign_key",
  "policy_name": "string",
  "policy_type": "enum(Term, Endowment, ULIP, Whole Life, Health, Other)",
  "sum_assured": "float",
  "premium": "float",
  "premium_frequency": "string",
  "ppt": "integer",
  "start_date": "date",
  "end_date": "date",
  "maturity_amount": "float",
  "remarks": "string"
}
```

#### Liabilities
```json
{
  "id": "uuid",
  "user_id": "foreign_key",
  "type": "enum(Home, Car, Personal, Other)",
  "total_loan_amount": "float",
  "outstanding": "float",
  "emi": "float",
  "interest_rate": "float",
  "tenure_months": "integer"
}
```

#### Cash Flow
```json
{
  "id": "uuid",
  "user_id": "foreign_key",
  
  // Inflows
  "primary_income": "float",
  "spouse_income": "float",
  "rental_income": "float",
  "additional_income": "float",
  "other_income": "float",
  
  // Essential Expenses
  "house_rent": "float",
  "maintenance": "float",
  "property_tax": "float",
  "utilities": "float",
  "groceries": "float",
  "transportation": "float",
  "medical_expenses": "float",
  "children_school_fees": "float",
  "insurance_premiums": "float",
  "essential_other": "float",
  
  // Lifestyle Expenses
  "maid_expense": "float",
  "shopping": "float",
  "travel": "float",
  "dining_entertainment": "float",
  "lifestyle_other": "float",
  
  // Investments
  "mf_sip": "float",
  "stock_sip": "float",
  "rd_contribution": "float",
  "chit_fund": "float",
  "investment_other": "float",
  
  // Linked (calculated)
  "linked_emis": "float",
  "linked_investments": "float"
}
```

#### Assumptions
```json
{
  "id": "uuid",
  "user_id": "foreign_key",
  "inflation": "float",
  "pre_retire_roi": "float",
  "post_retire_roi": "float"
}
```

---

## 5. API Specification

### 5.1 Base URL
- Development: `http://localhost:8000/api`
- Production: `https://api.financialplanner.com/api`

### 5.2 Authentication
All endpoints (except `/auth/login` and `/auth/register`) require JWT token in header:
```
Authorization: Bearer <token>
```

### 5.3 Endpoint Categories

#### 5.3.1 Authentication
- `POST /auth/register` - Create new user account
- `POST /auth/login` - Login and get JWT token
- `POST /auth/refresh` - Refresh JWT token
- `POST /auth/logout` - Logout

#### 5.3.2 User Profile
- `POST /users` - Create user profile
- `GET /users/{user_id}` - Get user profile
- `PUT /users/{user_id}` - Update user profile
- `DELETE /users/{user_id}` - Delete user

#### 5.3.3 Family Members
- `POST /users/{user_id}/family-members`
- `GET /users/{user_id}/family-members`
- `PUT /users/{user_id}/family-members/{member_id}`
- `DELETE /users/{user_id}/family-members/{member_id}`

#### 5.3.4 Goals
- `POST /users/{user_id}/goals`
- `GET /users/{user_id}/goals`
- `PUT /users/{user_id}/goals/{goal_id}`
- `DELETE /users/{user_id}/goals/{goal_id}`

#### 5.3.5 Assets
- Real Estate: `/users/{user_id}/assets/real-estate`
- Bank Accounts: `/users/{user_id}/assets/bank-accounts`
- Investments: `/users/{user_id}/assets/investments`
- Insurance: `/users/{user_id}/assets/insurance`

Each supports GET, POST, PUT, DELETE operations.

#### 5.3.6 Liabilities
- `POST /users/{user_id}/liabilities`
- `GET /users/{user_id}/liabilities`
- `PUT /users/{user_id}/liabilities/{liability_id}`
- `DELETE /users/{user_id}/liabilities/{liability_id}`

#### 5.3.7 Cash Flow
- `PUT /users/{user_id}/cash-flow` - Update cash flow
- `GET /users/{user_id}/cash-flow` - Get cash flow

#### 5.3.8 Analysis
- `POST /analyze` - Run financial analysis (existing)
- `GET /users/{user_id}/analysis` - Get cached analysis
- `GET /users/{user_id}/dashboard` - Get dashboard metrics

#### 5.3.9 AI Insights
- `POST /ai/query` - Ask natural language question
- `POST /ai/recommendations` - Get personalized recommendations
- `GET /ai/insights/{user_id}` - Get AI-generated insights

---

## 6. User Workflows

### 6.1 New User Onboarding

```
1. User visits application
2. Chat interface greets user
3. System asks for family details
   └─> FamilyDetailsForm appears
4. User enters: Primary user, Spouse, Children, Parents
5. System asks about financial goals
   └─> GoalForm appears
6. User adds goals (education, house, car, etc.)
7. System asks about assets
   └─> AssetsForm appears (with tabs)
8. User enters: Real Estate, Bank Accounts, Investments, Insurance
9. System asks about liabilities
   └─> LiabilityForm appears
10. User enters loans and EMIs
11. System asks about monthly cash flow
    └─> CashFlowForm appears
12. User enters income and expenses
13. System performs analysis
14. Summary Dashboard displays:
    - Net Worth
    - Cash Flow Summary
    - Retirement Planning
    - Goal Analysis
    - AI Insights
15. User can interact with AI for questions
```

### 6.2 Returning User

```
1. User logs in
2. Dashboard loads with latest data
3. User can:
   - Update any section
   - Add new goals/assets/liabilities
   - Run fresh analysis
   - Ask AI questions
4. System auto-saves changes
5. Analysis updates in real-time
```

---

## 7. AI Integration

### 7.1 LLM Provider
- Primary: OpenAI GPT-4
- Fallback: GPT-3.5-turbo (cost optimization)

### 7.2 AI Capabilities

#### 7.2.1 Financial Insights Generation
```python
Input: Complete financial analysis results
Output: Natural language summary of financial health

Example:
"Based on your financial profile, you're on track for a comfortable retirement.
Your net worth of ₹1.15 Cr is healthy for your age (38). However, your EMI 
burden at 21% is slightly high. Consider prepaying your car loan to reduce 
monthly obligations. Your current SIP of ₹40,000 is good, but you'll need to 
increase it by ₹15,432/month to meet your retirement corpus goal."
```

#### 7.2.2 Personalized Recommendations
```python
Analyzes:
- Savings rate vs industry benchmarks
- Debt-to-income ratio
- Insurance coverage adequacy
- Emergency fund status
- Goal funding gaps

Generates:
- Top 3-5 actionable recommendations
- Prioritized by impact
- Specific amounts and timelines
```

#### 7.2.3 Natural Language Queries
```python
User: "When can I retire comfortably?"
AI: "Based on your current savings rate and investments, you can retire 
     at age 58 with a corpus of ₹5.8 Cr. To retire at 55, increase your 
     monthly SIP by ₹25,000."

User: "Can I afford to buy a ₹80L house in 3 years?"
AI: "Yes, but it will require adjustments. You'll need a down payment of 
     ₹16L. Start a dedicated monthly investment of ₹35,000 in debt funds 
     to reach this goal."
```

### 7.3 Prompt Engineering

#### System Prompt Template
```
You are an expert financial advisor helping users understand their finances.
You have their complete financial profile including:
- Net Worth: {net_worth}
- Monthly Income: {income}
- Monthly Expenses: {expenses}
- Savings Rate: {savings_rate}%
- Retirement Gap: {retirement_gap}

Provide clear, actionable advice in simple language. Use Indian currency (₹).
Focus on practical steps they can take immediately.
```

---

## 8. Security & Privacy

### 8.1 Data Security
- All passwords hashed with bcrypt (cost factor 12)
- Sensitive fields (PAN) encrypted at rest (AES-256)
- HTTPS mandatory in production
- SQL injection prevention via ORM
- CORS configured for allowed origins only

### 8.2 Privacy
- Users own their data
- Data deletion on account closure
- No third-party data sharing
- Compliance with data protection regulations

---

## 9. Performance Targets

| Metric | Target |
|--------|--------|
| Page Load Time | < 2s |
| API Response (CRUD) | < 200ms |
| Analysis Calculation | < 500ms |
| LLM Response | < 3s |
| Concurrent Users | 10,000 |
| Database Query Time | < 50ms |
| Uptime | 99.9% |

---

## 10. Deployment Architecture

### 10.1 Development
- Frontend: `localhost:3000`
- Backend: `localhost:8000`
- Database: SQLite file

### 10.2 Production
```
Frontend: Vercel / Netlify
  ↓
Backend: AWS EC2 / Digital Ocean
  ↓
Database: PostgreSQL (RDS)
  ↓
Object Storage: S3 (for document uploads)
```

---

## 11. Future Enhancements

### Phase 2 Features
- PDF report generation
- Email/WhatsApp notifications
- Goal progress tracking over time
- Historical data visualization
- Tax optimization module

### Phase 3 Features  
- Portfolio rebalancing suggestions
- What-if scenario analysis
- Market data integration
- Multi-currency support
- Family account (multiple users)

---

## 12. Success Metrics

### 12.1 User Engagement
- Monthly Active Users (MAU)
- Average session duration
- Feature adoption rate
- Return user rate

### 12.2 Financial Impact
- Number of goals created
- Total assets under planning
- Average net worth of users
- SIP increase adoption rate

### 12.3 Technical Metrics
- API error rate < 0.1%
- 99.9% uptime
- Average response time < 300ms
- Code coverage > 80%

---

## Appendix: Technology Stack Details

### Backend
- **Framework**: FastAPI 0.109+
- **ORM**: SQLAlchemy 2.0+
- **Migration**: Alembic
- **Validation**: Pydantic 2.0+
- **Auth**: PyJWT, passlib
- **LLM**: OpenAI Python SDK
- **Testing**: pytest, pytest-cov

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript 5.0+
- **State**: Zustand
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **HTTP**: fetch API
- **Testing**: Jest, React Testing Library

### Database
- **Development**: SQLite
- **Production**: PostgreSQL 15+
- **Connection Pool**: SQLAlchemy pool

### DevOps
- **Version Control**: Git
- **CI/CD**: GitHub Actions
- **Monitoring**: Sentry (errors), DataDog (metrics)
- **Logging**: Python logging, structured JSON logs