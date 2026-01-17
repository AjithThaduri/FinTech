"""
Test Data Seed Script
Seeds comprehensive test data for Financial Report testing.
This file provides sample data that can be loaded into the frontend store.
"""

# Full test data payload that matches the frontend store structure
TEST_FINANCIAL_DATA = {
    "user_profile": {
        "primary": {
            "name": "Rahul Sharma",
            "dob": "1986-03-15",
            "retire_age": 60,
            "life_expectancy": 85
        },
        "spouse": {
            "name": "Priya Sharma",
            "dob": "1990-07-22",
            "working_status": True
        },
        "family_members": [
            {
                "id": "child-1",
                "name": "Arjun Sharma",
                "dob": "2015-05-10",
                "relation_type": "CHILD"
            },
            {
                "id": "child-2", 
                "name": "Ananya Sharma",
                "dob": "2018-09-25",
                "relation_type": "CHILD"
            }
        ]
    },
    "goals": [
        {
            "id": "goal-1",
            "person_name": "Arjun Sharma",
            "name": "Graduation",
            "current_cost": 1500000,
            "target_type": "AGE",
            "target_value": "18"
        },
        {
            "id": "goal-2",
            "person_name": "Arjun Sharma", 
            "name": "Post Graduation",
            "current_cost": 2500000,
            "target_type": "AGE",
            "target_value": "22"
        },
        {
            "id": "goal-3",
            "person_name": "Arjun Sharma",
            "name": "Marriage",
            "current_cost": 3000000,
            "target_type": "AGE",
            "target_value": "28"
        },
        {
            "id": "goal-4",
            "person_name": "Ananya Sharma",
            "name": "Graduation",
            "current_cost": 2000000,
            "target_type": "AGE",
            "target_value": "18"
        },
        {
            "id": "goal-5",
            "person_name": "Ananya Sharma",
            "name": "Marriage",
            "current_cost": 3500000,
            "target_type": "AGE",
            "target_value": "26"
        },
        {
            "id": "goal-6",
            "name": "Buy New Car",
            "current_cost": 1200000,
            "target_type": "AGE",
            "target_value": "42"
        }
    ],
    "assets": {
        "real_estate": [
            {
                "id": "re-1",
                "name": "Primary Residence",
                "present_value": 8500000,
                "outstanding_loan": 3000000,
                "emi": 35000,
                "interest_rate": 8.5
            }
        ],
        "bank_accounts": [
            {
                "id": "ba-1",
                "bank_name": "HDFC Bank",
                "account_type": "Savings",
                "balance": 500000
            },
            {
                "id": "ba-2",
                "bank_name": "SBI",
                "account_type": "FD",
                "balance": 1000000,
                "interest_rate": 7.5
            }
        ],
        "investments": [
            {
                "id": "inv-1",
                "type": "MF",
                "current_value": 2500000,
                "invested_amount": 1800000,
                "monthly_sip": 25000
            },
            {
                "id": "inv-2",
                "type": "Stock",
                "current_value": 800000,
                "invested_amount": 600000,
                "monthly_sip": 10000
            }
        ],
        "insurance_policies": [
            {
                "id": "ins-1",
                "policy_name": "LIC Term Plan",
                "policy_type": "Term",
                "sum_assured": 10000000,
                "premium": 15000,
                "premium_frequency": "Annual"
            },
            {
                "id": "ins-2",
                "policy_name": "HDFC Health",
                "policy_type": "Health",
                "sum_assured": 500000,
                "premium": 25000,
                "premium_frequency": "Annual"
            }
        ],
        "liquid_cash": 200000
    },
    "liabilities": [
        {
            "id": "lib-1",
            "type": "Home",
            "total_loan_amount": 5000000,
            "outstanding": 3000000,
            "emi": 35000,
            "interest_rate": 8.5,
            "tenure_months": 180
        },
        {
            "id": "lib-2",
            "type": "Car",
            "total_loan_amount": 800000,
            "outstanding": 400000,
            "emi": 18000,
            "interest_rate": 9.0,
            "tenure_months": 48
        }
    ],
    "cash_flow": {
        "inflows": {
            "primary_income": 150000,
            "spouse_income": 80000,
            "rental_income": 0,
            "additional_income": 5000,
            "other": 0
        },
        "outflows": {
            "essential": 60000,
            "lifestyle": 25000,
            "linked_emis": 53000,
            "linked_investments": 35000,
            "essential_details": {
                "house_rent": 0,
                "maintenance": 5000,
                "property_tax": 1000,
                "utilities": 5000,
                "groceries": 15000,
                "transportation": 8000,
                "medical_expenses": 5000,
                "children_school_fees": 15000,
                "insurance_premiums": 3000,
                "other": 3000
            },
            "lifestyle_details": {
                "maid_expense": 5000,
                "shopping": 8000,
                "travel": 4000,
                "dining_entertainment": 6000,
                "other": 2000
            }
        }
    },
    "assumptions": {
        "inflation": 0.06,
        "pre_retire_roi": 0.12,
        "post_retire_roi": 0.08
    }
}

if __name__ == "__main__":
    import json
    print("=== TEST FINANCIAL DATA ===")
    print(json.dumps(TEST_FINANCIAL_DATA, indent=2))
    print("\n\nTo use this data:")
    print("1. Copy the above JSON")
    print("2. Load it into the frontend via the load-test-data page")
    print("3. Navigate to /app/financial-report to see the report")
