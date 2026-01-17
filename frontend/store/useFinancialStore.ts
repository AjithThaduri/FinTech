import { create } from 'zustand';

// ============================================================================
// TYPE DEFINITIONS - Match Backend Schemas Exactly
// ============================================================================

export type RelationshipType = 'PRIMARY' | 'SPOUSE' | 'CHILD' | 'FATHER' | 'MOTHER';
export type TargetType = 'AGE' | 'DATE';
export type InvestmentType = 'MF' | 'Stock' | 'FD' | 'RD' | 'Chit' | 'Other';
export type LiabilityType = 'Home' | 'Car' | 'Personal' | 'Other';
export type AccountType = 'Savings' | 'Current' | 'FD' | 'RD';
export type PolicyType = 'Term' | 'Endowment' | 'ULIP' | 'Whole Life' | 'Health' | 'Other';

// --- Family & Profile ---

export interface FamilyMember {
    id: string;
    name: string;
    dob?: string;
    pan?: string;
    relation_type: RelationshipType;
    expected_retirement_age?: number;
}

export interface ContactDetails {
    mobile?: string;
    email?: string;
    designation?: string;
    organisation?: string;
}

export interface PrimaryUser {
    name: string;
    dob: string;
    retire_age: number;
    pension_till_age: number;  // Age until pension is required (per Master Spec)
    life_expectancy: number;
}

export interface Spouse {
    name: string;
    dob: string;
    working_status: boolean;
    retirement_age?: number;  // Spouse's own retirement age (per Master Spec)
    pension_till_age?: number;  // Spouse's pension till age
}

export interface UserProfile {
    primary: PrimaryUser;
    spouse?: Spouse;
    family_members: FamilyMember[];
    contact_details?: ContactDetails;
    address?: string;
}

// --- Goals ---

export interface Goal {
    id: string;
    person_name?: string;
    name: string;
    current_cost: number;
    target_type: TargetType;
    target_value: string | number;
}

// --- Assets ---

export interface RealEstateAsset {
    id?: string;
    person_name?: string;
    name: string;
    present_value: number;
    roi?: number;
    remarks?: string;
}

export interface BankAccount {
    id?: string;
    person_name?: string;
    bank_name: string;
    account_type: AccountType;
    balance: number;
    interest_rate?: number;
    maturity_date?: string;
    remarks?: string;
}

export interface InvestmentAsset {
    id?: string;
    type: InvestmentType;
    invested_amount?: number;
    current_value: number;
    monthly_sip: number;
    start_date?: string;
    end_date?: string;
    remarks?: string;
}

export interface InsurancePolicy {
    id?: string;
    person_name?: string;
    policy_name: string;
    policy_type: PolicyType;
    sum_assured: number;
    premium: number;
    premium_frequency: string;
    ppt?: number;
    start_date?: string;
    end_date?: string;
    maturity_amount?: number;
    remarks?: string;
}

export interface Assets {
    real_estate: RealEstateAsset[];
    bank_accounts: BankAccount[];
    investments: InvestmentAsset[];
    insurance_policies: InsurancePolicy[];
    liquid_cash: number;
}

// --- Liabilities ---

export interface Liability {
    id?: string;
    type: LiabilityType;
    total_loan_amount?: number;
    outstanding: number;
    emi: number;
    interest_rate: number;
    tenure_months: number;
}

// --- Cash Flow (Detailed) ---

export interface EssentialExpenses {
    house_rent: number;
    maintenance: number;
    property_tax: number;
    utilities: number;
    groceries: number;
    transportation: number;
    medical_expenses: number;
    children_school_fees: number;
    insurance_premiums: number;
    other: number;
}

export interface LifestyleExpenses {
    maid_expense: number;
    shopping: number;
    travel: number;
    dining_entertainment: number;
    other: number;
}

export interface InvestmentOutflows {
    mutual_fund_sip: number;
    stock_sip: number;
    recurring_deposit: number;
    chit_fund: number;
    other: number;
}

export interface Inflows {
    primary_income: number;
    spouse_income: number;
    rental_income: number;
    additional_income: number;
    other: number;
}

export interface Outflows {
    essential: number;
    lifestyle: number;
    essential_details?: EssentialExpenses;
    lifestyle_details?: LifestyleExpenses;
    investment_details?: InvestmentOutflows;
    linked_emis: number;
    linked_investments: number;
}

export interface CashFlow {
    inflows: Inflows;
    outflows: Outflows;
}

// --- Assumptions ---

export interface Assumptions {
    inflation: number;
    child_inflation: number;  // Inflation for child goals (10% per Master Spec)
    pre_retire_roi: number;
    post_retire_roi: number;
}

// --- Full State Interface ---

export interface FullState {
    user_profile: UserProfile;
    goals: Goal[];
    assets: Assets;
    liabilities: Liability[];
    cash_flow: CashFlow;
    assumptions: Assumptions;

    // Actions
    setProfile: (profile: UserProfile) => void;
    updatePrimaryUser: (primary: Partial<PrimaryUser>) => void;
    setSpouse: (spouse: Spouse | undefined) => void;
    addFamilyMember: (member: FamilyMember) => void;
    removeFamilyMember: (id: string) => void;

    addGoal: (goal: Goal) => void;
    updateGoal: (id: string, goal: Partial<Goal>) => void;
    removeGoal: (id: string) => void;

    addRealEstate: (asset: RealEstateAsset) => void;
    removeRealEstate: (id: string) => void;
    addBankAccount: (account: BankAccount) => void;
    removeBankAccount: (id: string) => void;
    addInvestment: (investment: InvestmentAsset) => void;
    removeInvestment: (id: string) => void;
    addInsurancePolicy: (policy: InsurancePolicy) => void;
    removeInsurancePolicy: (id: string) => void;
    updateLiquidCash: (amount: number) => void;

    addLiability: (liability: Liability) => void;
    removeLiability: (id: string) => void;

    updateCashFlow: (cashFlow: Partial<CashFlow>) => void;
    updateInflows: (inflows: Partial<Inflows>) => void;
    updateOutflows: (outflows: Partial<Outflows>) => void;
    updateEssentialDetails: (details: Partial<EssentialExpenses>) => void;
    updateLifestyleDetails: (details: Partial<LifestyleExpenses>) => void;

    updateAssumptions: (assumptions: Partial<Assumptions>) => void;

    // Utility actions
    recalculateLinkedValues: () => void;
    getPayload: () => object;
    reset: () => void;

    // Analysis results (shared between Dashboard and Report)
    analysisResults: any | null;
    setAnalysisResults: (results: any) => void;
}

// --- Initial State ---

const generateId = () => Math.random().toString(36).substring(2, 9);

const initialState = {
    user_profile: {
        primary: { name: '', dob: '', retire_age: 60, pension_till_age: 85, life_expectancy: 85 },
        family_members: [],
    },
    goals: [],
    assets: {
        real_estate: [],
        bank_accounts: [],
        investments: [],
        insurance_policies: [],
        liquid_cash: 0
    },
    liabilities: [],
    cash_flow: {
        inflows: {
            primary_income: 0,
            spouse_income: 0,
            rental_income: 0,
            additional_income: 0,
            other: 0
        },
        outflows: {
            essential: 0,
            lifestyle: 0,
            linked_emis: 0,
            linked_investments: 0
        },
    },
    assumptions: { inflation: 0.06, child_inflation: 0.10, pre_retire_roi: 0.12, post_retire_roi: 0.08 },
    analysisResults: null,
};

// --- Store Implementation ---

export const useFinancialStore = create<FullState>((set, get) => ({
    ...initialState,

    // Profile Actions
    setProfile: (profile) => set({ user_profile: profile }),

    updatePrimaryUser: (primary) => set((state) => ({
        user_profile: {
            ...state.user_profile,
            primary: { ...state.user_profile.primary, ...primary }
        }
    })),

    setSpouse: (spouse) => set((state) => ({
        user_profile: { ...state.user_profile, spouse }
    })),

    addFamilyMember: (member) => set((state) => ({
        user_profile: {
            ...state.user_profile,
            family_members: [...state.user_profile.family_members, { ...member, id: member.id || generateId() }]
        }
    })),

    removeFamilyMember: (id) => set((state) => ({
        user_profile: {
            ...state.user_profile,
            family_members: state.user_profile.family_members.filter(m => m.id !== id)
        }
    })),

    // Goal Actions
    addGoal: (goal) => set((state) => ({
        goals: [...state.goals, { ...goal, id: goal.id || generateId() }]
    })),

    updateGoal: (id, updates) => set((state) => ({
        goals: state.goals.map(g => g.id === id ? { ...g, ...updates } : g)
    })),

    removeGoal: (id) => set((state) => ({
        goals: state.goals.filter(g => g.id !== id)
    })),

    // Asset Actions
    addRealEstate: (asset) => set((state) => ({
        assets: {
            ...state.assets,
            real_estate: [...state.assets.real_estate, { ...asset, id: asset.id || generateId() }]
        }
    })),

    removeRealEstate: (id) => set((state) => ({
        assets: {
            ...state.assets,
            real_estate: state.assets.real_estate.filter(a => a.id !== id)
        }
    })),

    addBankAccount: (account) => set((state) => ({
        assets: {
            ...state.assets,
            bank_accounts: [...state.assets.bank_accounts, { ...account, id: account.id || generateId() }]
        }
    })),

    removeBankAccount: (id) => set((state) => ({
        assets: {
            ...state.assets,
            bank_accounts: state.assets.bank_accounts.filter(a => a.id !== id)
        }
    })),

    addInvestment: (investment) => {
        set((state) => ({
            assets: {
                ...state.assets,
                investments: [...state.assets.investments, { ...investment, id: investment.id || generateId() }]
            }
        }));
        // Auto-update linked investments
        get().recalculateLinkedValues();
    },

    removeInvestment: (id) => {
        set((state) => ({
            assets: {
                ...state.assets,
                investments: state.assets.investments.filter(a => a.id !== id)
            }
        }));
        get().recalculateLinkedValues();
    },

    addInsurancePolicy: (policy) => set((state) => ({
        assets: {
            ...state.assets,
            insurance_policies: [...state.assets.insurance_policies, { ...policy, id: policy.id || generateId() }]
        }
    })),

    removeInsurancePolicy: (id) => set((state) => ({
        assets: {
            ...state.assets,
            insurance_policies: state.assets.insurance_policies.filter(p => p.id !== id)
        }
    })),

    updateLiquidCash: (amount) => set((state) => ({
        assets: { ...state.assets, liquid_cash: amount }
    })),

    // Liability Actions
    addLiability: (liability) => {
        set((state) => ({
            liabilities: [...state.liabilities, { ...liability, id: liability.id || generateId() }]
        }));
        // Auto-update linked EMIs
        get().recalculateLinkedValues();
    },

    removeLiability: (id) => {
        set((state) => ({
            liabilities: state.liabilities.filter(l => l.id !== id)
        }));
        get().recalculateLinkedValues();
    },

    // Cash Flow Actions
    updateCashFlow: (newCashFlow) => set((state) => ({
        cash_flow: { ...state.cash_flow, ...newCashFlow }
    })),

    updateInflows: (inflows) => set((state) => ({
        cash_flow: {
            ...state.cash_flow,
            inflows: { ...state.cash_flow.inflows, ...inflows }
        }
    })),

    updateOutflows: (outflows) => set((state) => ({
        cash_flow: {
            ...state.cash_flow,
            outflows: { ...state.cash_flow.outflows, ...outflows }
        }
    })),

    updateEssentialDetails: (details) => set((state) => {
        const currentDetails = state.cash_flow.outflows.essential_details || {
            house_rent: 0, maintenance: 0, property_tax: 0, utilities: 0,
            groceries: 0, transportation: 0, medical_expenses: 0,
            children_school_fees: 0, insurance_premiums: 0, other: 0
        };
        const newDetails = { ...currentDetails, ...details };
        const essential = Object.values(newDetails).reduce((a, b) => a + b, 0);

        return {
            cash_flow: {
                ...state.cash_flow,
                outflows: {
                    ...state.cash_flow.outflows,
                    essential,
                    essential_details: newDetails
                }
            }
        };
    }),

    updateLifestyleDetails: (details) => set((state) => {
        const currentDetails = state.cash_flow.outflows.lifestyle_details || {
            maid_expense: 0, shopping: 0, travel: 0, dining_entertainment: 0, other: 0
        };
        const newDetails = { ...currentDetails, ...details };
        const lifestyle = Object.values(newDetails).reduce((a, b) => a + b, 0);

        return {
            cash_flow: {
                ...state.cash_flow,
                outflows: {
                    ...state.cash_flow.outflows,
                    lifestyle,
                    lifestyle_details: newDetails
                }
            }
        };
    }),

    // Assumptions Actions
    updateAssumptions: (newAssumptions) => set((state) => ({
        assumptions: { ...state.assumptions, ...newAssumptions }
    })),

    // Utility Actions - Interconnection Map
    recalculateLinkedValues: () => set((state) => {
        // Calculate total EMIs from liabilities
        const totalEmi = state.liabilities.reduce((sum, l) => sum + l.emi, 0);

        // Calculate total SIPs from investments
        const totalSip = state.assets.investments.reduce((sum, i) => sum + i.monthly_sip, 0);

        return {
            cash_flow: {
                ...state.cash_flow,
                outflows: {
                    ...state.cash_flow.outflows,
                    linked_emis: totalEmi,
                    linked_investments: totalSip
                }
            }
        };
    }),

    getPayload: () => {
        const state = get();
        return {
            user_profile: state.user_profile,
            goals: state.goals,
            assets: state.assets,
            liabilities: state.liabilities,
            cash_flow: state.cash_flow,
            assumptions: state.assumptions
        };
    },

    reset: () => set(initialState),

    // Analysis Results Actions
    analysisResults: null,
    setAnalysisResults: (results) => set({ analysisResults: results }),
}));
