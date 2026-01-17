'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFinancialStore } from '../../../store/useFinancialStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2, Database, ArrowRight, User, Users } from 'lucide-react';

// Profile 1: Young Family with 2 Children
const PROFILE_FAMILY = {
    name: "Young Family (Rahul & Priya)",
    description: "Age 38, 2 kids, ₹2.35L/mo income, dual earning",
    data: {
        user_profile: {
            primary: { name: "Rahul Sharma", dob: "1986-03-15", retire_age: 60, pension_till_age: 85, life_expectancy: 85 },
            spouse: { name: "Priya Sharma", dob: "1990-07-22", working_status: true, retirement_age: 58, pension_till_age: 85 },
            family_members: [
                { id: "child-1", name: "Arjun Sharma", dob: "2015-05-10", relation_type: "CHILD" as const },
                { id: "child-2", name: "Ananya Sharma", dob: "2018-09-25", relation_type: "CHILD" as const }
            ]
        },
        goals: [
            { id: "g1", person_name: "Arjun Sharma", name: "Graduation", current_cost: 1500000, target_type: "AGE" as const, target_value: "18" },
            { id: "g2", person_name: "Arjun Sharma", name: "Post Graduation", current_cost: 2500000, target_type: "AGE" as const, target_value: "22" },
            { id: "g3", person_name: "Arjun Sharma", name: "Marriage", current_cost: 3000000, target_type: "AGE" as const, target_value: "28" },
            { id: "g4", person_name: "Ananya Sharma", name: "Graduation", current_cost: 2000000, target_type: "AGE" as const, target_value: "18" },
            { id: "g5", person_name: "Ananya Sharma", name: "Marriage", current_cost: 3500000, target_type: "AGE" as const, target_value: "26" },
            { id: "g6", name: "Buy New Car", current_cost: 1200000, target_type: "AGE" as const, target_value: "42" }
        ],
        assets: {
            real_estate: [{ id: "re-1", name: "Primary Residence", present_value: 8500000, outstanding_loan: 3000000, emi: 35000, interest_rate: 8.5 }],
            bank_accounts: [
                { id: "ba-1", bank_name: "HDFC Bank", account_type: "Savings" as const, balance: 500000 },
                { id: "ba-2", bank_name: "SBI", account_type: "FD" as const, balance: 1000000, interest_rate: 7.5 }
            ],
            investments: [
                { id: "inv-1", type: "MF" as const, current_value: 2500000, invested_amount: 1800000, monthly_sip: 25000 },
                { id: "inv-2", type: "Stock" as const, current_value: 800000, invested_amount: 600000, monthly_sip: 10000 }
            ],
            insurance_policies: [
                { id: "ins-1", policy_name: "LIC Term Plan", policy_type: "Term" as const, sum_assured: 10000000, premium: 15000, premium_frequency: "Annual" },
                { id: "ins-2", policy_name: "HDFC Health", policy_type: "Health" as const, sum_assured: 500000, premium: 25000, premium_frequency: "Annual" }
            ],
            liquid_cash: 200000
        },
        liabilities: [
            { id: "lib-1", type: "Home" as const, total_loan_amount: 5000000, outstanding: 3000000, emi: 35000, interest_rate: 8.5, tenure_months: 180 },
            { id: "lib-2", type: "Car" as const, total_loan_amount: 800000, outstanding: 400000, emi: 18000, interest_rate: 9.0, tenure_months: 48 }
        ],
        cash_flow: {
            inflows: { primary_income: 150000, spouse_income: 80000, rental_income: 0, additional_income: 5000, other: 0 },
            outflows: {
                essential: 60000, lifestyle: 25000, linked_emis: 53000, linked_investments: 35000,
                essential_details: { house_rent: 0, maintenance: 5000, property_tax: 1000, utilities: 5000, groceries: 15000, transportation: 8000, medical_expenses: 5000, children_school_fees: 15000, insurance_premiums: 3000, other: 3000 },
                lifestyle_details: { maid_expense: 5000, shopping: 8000, travel: 4000, dining_entertainment: 6000, other: 2000 }
            }
        },
        assumptions: { inflation: 0.06, child_inflation: 0.10, pre_retire_roi: 0.12, post_retire_roi: 0.08 }
    }
};

// Profile 2: Single High Earner, No Children
const PROFILE_SINGLE = {
    name: "Single Professional (Vikram)",
    description: "Age 32, single, ₹3L/mo income, aggressive investor",
    data: {
        user_profile: {
            primary: { name: "Vikram Malhotra", dob: "1992-08-20", retire_age: 55, pension_till_age: 90, life_expectancy: 90 },
            family_members: []
        },
        goals: [
            { id: "g1", name: "Buy Apartment", current_cost: 12000000, target_type: "AGE" as const, target_value: "38" },
            { id: "g2", name: "World Travel Fund", current_cost: 2000000, target_type: "AGE" as const, target_value: "40" },
            { id: "g3", name: "Start Business", current_cost: 5000000, target_type: "AGE" as const, target_value: "45" }
        ],
        assets: {
            real_estate: [],
            bank_accounts: [
                { id: "ba-1", bank_name: "ICICI Bank", account_type: "Savings" as const, balance: 800000 },
                { id: "ba-2", bank_name: "Axis Bank", account_type: "FD" as const, balance: 2000000, interest_rate: 7.0 }
            ],
            investments: [
                { id: "inv-1", type: "MF" as const, current_value: 4500000, invested_amount: 3000000, monthly_sip: 50000 },
                { id: "inv-2", type: "Stock" as const, current_value: 2000000, invested_amount: 1200000, monthly_sip: 25000 }
            ],
            insurance_policies: [
                { id: "ins-1", policy_name: "Max Term Plan", policy_type: "Term" as const, sum_assured: 20000000, premium: 25000, premium_frequency: "Annual" }
            ],
            liquid_cash: 500000
        },
        liabilities: [
            { id: "lib-1", type: "Personal" as const, total_loan_amount: 500000, outstanding: 200000, emi: 15000, interest_rate: 12.0, tenure_months: 24 }
        ],
        cash_flow: {
            inflows: { primary_income: 300000, spouse_income: 0, rental_income: 0, additional_income: 20000, other: 0 },
            outflows: {
                essential: 40000, lifestyle: 50000, linked_emis: 15000, linked_investments: 75000,
                essential_details: { house_rent: 25000, maintenance: 2000, property_tax: 0, utilities: 3000, groceries: 5000, transportation: 5000, medical_expenses: 0, children_school_fees: 0, insurance_premiums: 0, other: 0 },
                lifestyle_details: { maid_expense: 3000, shopping: 15000, travel: 15000, dining_entertainment: 12000, other: 5000 }
            }
        },
        assumptions: { inflation: 0.07, child_inflation: 0.10, pre_retire_roi: 0.14, post_retire_roi: 0.09 }
    }
};

// Profile 3: Retired Couple
const PROFILE_RETIRED = {
    name: "Near Retirement (Suresh & Lakshmi)",
    description: "Age 55, empty nest, ₹4L/mo income, 1 child grown",
    data: {
        user_profile: {
            primary: { name: "Suresh Iyer", dob: "1969-12-05", retire_age: 60, pension_till_age: 85, life_expectancy: 85 },
            spouse: { name: "Lakshmi Iyer", dob: "1972-03-18", working_status: false, retirement_age: 60, pension_till_age: 85 },
            family_members: [
                { id: "child-1", name: "Karthik Iyer", dob: "1998-06-12", relation_type: "CHILD" as const }
            ]
        },
        goals: [
            { id: "g1", person_name: "Karthik Iyer", name: "Higher Studies Abroad", current_cost: 5000000, target_type: "AGE" as const, target_value: "28" },
            { id: "g2", person_name: "Karthik Iyer", name: "Marriage", current_cost: 4000000, target_type: "AGE" as const, target_value: "30" },
            { id: "g3", name: "Pilgrimage Trip", current_cost: 1000000, target_type: "AGE" as const, target_value: "62" }
        ],
        assets: {
            real_estate: [
                { id: "re-1", name: "Own House", present_value: 15000000, outstanding_loan: 0, emi: 0, interest_rate: 0 },
                { id: "re-2", name: "Rental Property", present_value: 6000000, outstanding_loan: 0, emi: 0, interest_rate: 0 }
            ],
            bank_accounts: [
                { id: "ba-1", bank_name: "SBI", account_type: "Savings" as const, balance: 1500000 },
                { id: "ba-2", bank_name: "HDFC", account_type: "FD" as const, balance: 5000000, interest_rate: 7.5 }
            ],
            investments: [
                { id: "inv-1", type: "MF" as const, current_value: 8000000, invested_amount: 5000000, monthly_sip: 30000 }
            ],
            insurance_policies: [
                { id: "ins-1", policy_name: "LIC Endowment", policy_type: "Endowment" as const, sum_assured: 5000000, premium: 50000, premium_frequency: "Annual", maturity_amount: 6000000 }
            ],
            liquid_cash: 1000000
        },
        liabilities: [],
        cash_flow: {
            inflows: { primary_income: 350000, spouse_income: 0, rental_income: 50000, additional_income: 0, other: 0 },
            outflows: {
                essential: 80000, lifestyle: 40000, linked_emis: 0, linked_investments: 30000,
                essential_details: { house_rent: 0, maintenance: 10000, property_tax: 5000, utilities: 8000, groceries: 20000, transportation: 10000, medical_expenses: 15000, children_school_fees: 0, insurance_premiums: 5000, other: 7000 },
                lifestyle_details: { maid_expense: 8000, shopping: 10000, travel: 10000, dining_entertainment: 8000, other: 4000 }
            }
        },
        assumptions: { inflation: 0.05, child_inflation: 0.10, pre_retire_roi: 0.10, post_retire_roi: 0.07 }
    }
};

const PROFILES = [PROFILE_FAMILY, PROFILE_SINGLE, PROFILE_RETIRED];

export default function LoadTestDataPage() {
    const router = useRouter();
    const store = useFinancialStore();
    const [loading, setLoading] = useState(false);
    const [loaded, setLoaded] = useState<string | null>(null);

    const handleLoadData = (profile: typeof PROFILE_FAMILY) => {
        setLoading(true);

        setTimeout(() => {
            store.reset();

            // Set profile
            store.setProfile(profile.data.user_profile);
            if (profile.data.user_profile.spouse) {
                store.setSpouse(profile.data.user_profile.spouse);
            }

            // Add all data
            profile.data.goals.forEach(goal => store.addGoal(goal));
            profile.data.assets.real_estate.forEach(re => store.addRealEstate(re));
            profile.data.assets.bank_accounts.forEach(ba => store.addBankAccount(ba));
            profile.data.assets.investments.forEach(inv => store.addInvestment(inv));
            profile.data.assets.insurance_policies.forEach(pol => store.addInsurancePolicy(pol));
            store.updateLiquidCash(profile.data.assets.liquid_cash);
            profile.data.liabilities.forEach(lib => store.addLiability(lib));

            store.updateInflows(profile.data.cash_flow.inflows);
            store.updateOutflows(profile.data.cash_flow.outflows);

            if (profile.data.cash_flow.outflows.essential_details) {
                store.updateEssentialDetails(profile.data.cash_flow.outflows.essential_details);
            }
            if (profile.data.cash_flow.outflows.lifestyle_details) {
                store.updateLifestyleDetails(profile.data.cash_flow.outflows.lifestyle_details);
            }

            store.updateAssumptions(profile.data.assumptions);
            store.recalculateLinkedValues();

            setLoading(false);
            setLoaded(profile.name);
        }, 800);
    };

    return (
        <div className="min-h-screen p-8">
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Load Test Data</h1>
                    <p className="text-gray-500">Choose a profile to test the Financial Report</p>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                    {PROFILES.map((profile, i) => (
                        <Card key={i} className={`cursor-pointer transition-all hover:shadow-lg ${loaded === profile.name ? 'ring-2 ring-green-500' : ''}`}>
                            <CardHeader className={`rounded-t-lg ${i === 0 ? 'bg-blue-600' : i === 1 ? 'bg-purple-600' : 'bg-amber-600'} text-white`}>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    {i === 0 ? <Users size={20} /> : <User size={20} />}
                                    {profile.name}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 space-y-3">
                                <p className="text-sm text-gray-600">{profile.description}</p>

                                <Button
                                    onClick={() => handleLoadData(profile)}
                                    disabled={loading}
                                    className="w-full"
                                    variant={loaded === profile.name ? "outline" : "default"}
                                >
                                    {loading ? (
                                        <Loader2 className="animate-spin mr-2" size={16} />
                                    ) : loaded === profile.name ? (
                                        <><CheckCircle className="mr-2 text-green-600" size={16} /> Loaded</>
                                    ) : (
                                        <><Database className="mr-2" size={16} /> Load This Profile</>
                                    )}
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {loaded && (
                    <Card className="border-green-200 bg-green-50">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <CheckCircle className="text-green-600" size={28} />
                                <div>
                                    <p className="font-bold text-green-800">"{loaded}" Loaded Successfully!</p>
                                    <p className="text-sm text-green-600">Navigate to view reports</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <Button onClick={() => router.push('/app/financial-report')} className="bg-gradient-to-r from-purple-600 to-pink-600">
                                    View Financial Report <ArrowRight className="ml-2" size={16} />
                                </Button>
                                <Button onClick={() => router.push('/app/report')} variant="outline">
                                    View AI Report <ArrowRight className="ml-2" size={16} />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
