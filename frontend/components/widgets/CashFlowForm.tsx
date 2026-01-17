'use client';
import { useState, useEffect } from 'react';
import { useFinancialStore, EssentialExpenses, LifestyleExpenses } from '../../store/useFinancialStore';
import { DollarSign, Wallet, ShoppingBag, TrendingUp, Percent, IndianRupee } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { MoneyInput } from '@/components/ui/money-input';

interface Props {
    onComplete: (next: any, summary: any) => void;
}

// Helper: Format to Indian Currency
const formatToIndianCurrency = (num: number) => {
    if (isNaN(num)) return '';
    return num.toLocaleString('en-IN');
};

// Helper: Parse string to number
const parseFromCurrency = (str: string) => {
    return Number(str.replace(/,/g, '').replace(/[^\d.]/g, ''));
};

// --- Percentage Input Component ---
const PercentInput = ({
    value,
    onChange
}: {
    value: number;
    onChange: (val: number) => void;
}) => {
    return (
        <div className="relative">
            <Input
                type="number"
                value={value ? (value * 100).toString() : ''}
                onChange={(e) => onChange(Number(e.target.value) / 100)}
                className="pr-8"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
        </div>
    );
};

const InputField = ({ label, value, onChange, className }: { label: string, value: number, onChange: (v: number) => void, className?: string }) => (
    <div className="space-y-1">
        <Label className="text-xs text-gray-500">{label}</Label>
        <MoneyInput value={value} onChange={onChange} className={`h-9 ${className}`} />
    </div>
);

export default function CashFlowForm({ onComplete }: Props) {
    const {
        cash_flow,
        assumptions,
        updateInflows,
        updateEssentialDetails,
        updateLifestyleDetails,
        updateOutflows,
        updateAssumptions,
        user_profile
    } = useFinancialStore();

    const [showEssentialDetails, setShowEssentialDetails] = useState(false);
    const [showLifestyleDetails, setShowLifestyleDetails] = useState(false);

    // Inflow state
    const [inflows, setInflows] = useState({
        primary_income: cash_flow.inflows.primary_income || 0,
        spouse_income: cash_flow.inflows.spouse_income || 0,
        rental_income: cash_flow.inflows.rental_income || 0,
        additional_income: cash_flow.inflows.additional_income || 0,
    });

    // Essential expenses state
    const [essential, setEssential] = useState<EssentialExpenses>({
        house_rent: 0, maintenance: 0, property_tax: 0, utilities: 0,
        groceries: 0, transportation: 0, medical_expenses: 0,
        children_school_fees: 0, insurance_premiums: 0, other: 0
    });

    // Lifestyle expenses state
    const [lifestyle, setLifestyle] = useState<LifestyleExpenses>({
        maid_expense: 0, shopping: 0, travel: 0, dining_entertainment: 0, other: 0
    });

    // Simple mode totals
    const [simpleTotals, setSimpleTotals] = useState({
        essential: cash_flow.outflows.essential || 0,
        lifestyle: cash_flow.outflows.lifestyle || 0
    });

    // Assumptions Local State
    const [localAssumptions, setLocalAssumptions] = useState({
        inflation: assumptions.inflation || 0.12,
        pre_retire_roi: assumptions.pre_retire_roi || 0.12,
        post_retire_roi: assumptions.post_retire_roi || 0.08
    });

    // Initialize details in local state if they exist in store
    useEffect(() => {
        if (cash_flow.outflows.essential_details) {
            setEssential(cash_flow.outflows.essential_details);
            setShowEssentialDetails(true);
        }
        if (cash_flow.outflows.lifestyle_details) {
            setLifestyle(cash_flow.outflows.lifestyle_details);
            setShowLifestyleDetails(true);
        }
    }, []); // Run once on mount

    const totalInflow = inflows.primary_income + inflows.spouse_income + inflows.rental_income + inflows.additional_income;
    const totalEssential = showEssentialDetails ? Object.values(essential).reduce((a, b) => a + b, 0) : simpleTotals.essential;
    const totalLifestyle = showLifestyleDetails ? Object.values(lifestyle).reduce((a, b) => a + b, 0) : simpleTotals.lifestyle;
    const totalExpenses = totalEssential + totalLifestyle;
    const leftover = totalInflow - totalExpenses;

    const handleSubmit = () => {
        // Update store - Inflows
        updateInflows(inflows);

        // Update Store - Expenses
        if (showEssentialDetails) {
            updateEssentialDetails(essential);
        } else {
            updateOutflows({ essential: simpleTotals.essential });
        }

        if (showLifestyleDetails) {
            updateLifestyleDetails(lifestyle);
        } else {
            updateOutflows({ lifestyle: simpleTotals.lifestyle });
        }

        // Update Store - Assumptions
        updateAssumptions(localAssumptions);

        const rawData = {
            inflows: inflows,
            expenses: {
                essential: showEssentialDetails ? essential : { total: simpleTotals.essential },
                lifestyle: showLifestyleDetails ? lifestyle : { total: simpleTotals.lifestyle }
            },
            assumptions: localAssumptions,
            totals: {
                inflow: totalInflow,
                expenses: totalExpenses,
                surplus: leftover
            }
        };

        onComplete(
            { text: "Great! Now let's set your financial goals.", widget: 'goals' },
            rawData
        );
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-green-100 text-green-600 rounded-xl">
                    <DollarSign size={24} />
                </div>
                <div>
                    <h3 className="font-bold text-gray-800 text-xl">Cash Flow & Assumptions</h3>
                    <p className="text-gray-500 text-sm">Track income, expenses, and economic factors.</p>
                </div>
            </div>

            {/* INFLOWS */}
            <Card className="border-l-4 border-l-green-500">
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex justify-between items-center text-green-700">
                        <span>Monthly Inflows</span>
                        <span className="text-sm font-bold bg-green-100 px-2 py-1 rounded">₹{formatToIndianCurrency(totalInflow)}</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <Label>Primary Salary</Label>
                        <MoneyInput value={inflows.primary_income} onChange={v => setInflows({ ...inflows, primary_income: v })} />
                    </div>
                    {user_profile.spouse && (
                        <div className="space-y-1">
                            <Label>Spouse Salary</Label>
                            <MoneyInput value={inflows.spouse_income} onChange={v => setInflows({ ...inflows, spouse_income: v })} />
                        </div>
                    )}
                    <div className="space-y-1">
                        <Label>Rental Income</Label>
                        <MoneyInput value={inflows.rental_income} onChange={v => setInflows({ ...inflows, rental_income: v })} />
                    </div>
                    <div className="space-y-1">
                        <Label>Other Income</Label>
                        <MoneyInput value={inflows.additional_income} onChange={v => setInflows({ ...inflows, additional_income: v })} />
                    </div>
                </CardContent>
            </Card>

            {/* ESSENTIAL EXPENSES */}
            <Card className="border-l-4 border-l-red-500">
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                    <CardTitle className="text-lg text-red-700 flex items-center gap-2">
                        <Wallet size={18} /> Essential Expenses
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-bold bg-red-100 text-red-700 px-2 py-1 rounded">₹{formatToIndianCurrency(totalEssential)}</span>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowEssentialDetails(!showEssentialDetails)}
                            className="h-8 text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
                        >
                            {showEssentialDetails ? 'Simple Mode' : 'Detail Mode'}
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {showEssentialDetails ? (
                        <div className="grid grid-cols-2 gap-3 animate-in slide-in-from-top-2">
                            <InputField label="House Rent" value={essential.house_rent} onChange={v => setEssential({ ...essential, house_rent: v })} />
                            <InputField label="Maintenance" value={essential.maintenance} onChange={v => setEssential({ ...essential, maintenance: v })} />
                            <InputField label="Property Tax" value={essential.property_tax} onChange={v => setEssential({ ...essential, property_tax: v })} />
                            <InputField label="Utilities" value={essential.utilities} onChange={v => setEssential({ ...essential, utilities: v })} />
                            <InputField label="Groceries" value={essential.groceries} onChange={v => setEssential({ ...essential, groceries: v })} />
                            <InputField label="Transportation" value={essential.transportation} onChange={v => setEssential({ ...essential, transportation: v })} />
                            <InputField label="Medical" value={essential.medical_expenses} onChange={v => setEssential({ ...essential, medical_expenses: v })} />
                            <InputField label="School Fees" value={essential.children_school_fees} onChange={v => setEssential({ ...essential, children_school_fees: v })} />
                            <InputField label="Insurance" value={essential.insurance_premiums} onChange={v => setEssential({ ...essential, insurance_premiums: v })} />
                            <InputField label="Other" value={essential.other} onChange={v => setEssential({ ...essential, other: v })} />
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <Label>Total Essential Expenses (Rent, Food, Utilities, etc.)</Label>
                            <MoneyInput
                                value={simpleTotals.essential}
                                onChange={v => setSimpleTotals({ ...simpleTotals, essential: v })}
                                className="bg-red-50/30"
                            />
                            <p className="text-xs text-gray-400">Enter approximate total if you don't want to itemize.</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* LIFESTYLE EXPENSES */}
            <Card className="border-l-4 border-l-orange-500">
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                    <CardTitle className="text-lg text-orange-700 flex items-center gap-2">
                        <ShoppingBag size={18} /> Lifestyle Expenses
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-bold bg-orange-100 text-orange-700 px-2 py-1 rounded">₹{formatToIndianCurrency(totalLifestyle)}</span>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowLifestyleDetails(!showLifestyleDetails)}
                            className="h-8 text-xs text-orange-600 hover:bg-orange-50 hover:text-orange-700"
                        >
                            {showLifestyleDetails ? 'Simple Mode' : 'Detail Mode'}
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {showLifestyleDetails ? (
                        <div className="grid grid-cols-2 gap-3 animate-in slide-in-from-top-2">
                            <InputField label="Maid/Help" value={lifestyle.maid_expense} onChange={v => setLifestyle({ ...lifestyle, maid_expense: v })} />
                            <InputField label="Shopping" value={lifestyle.shopping} onChange={v => setLifestyle({ ...lifestyle, shopping: v })} />
                            <InputField label="Travel" value={lifestyle.travel} onChange={v => setLifestyle({ ...lifestyle, travel: v })} />
                            <InputField label="Dining & Fun" value={lifestyle.dining_entertainment} onChange={v => setLifestyle({ ...lifestyle, dining_entertainment: v })} />
                            <InputField label="Other" value={lifestyle.other} onChange={v => setLifestyle({ ...lifestyle, other: v })} />
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <Label>Total Lifestyle Expenses (Fun, Travel, Dining, etc.)</Label>
                            <MoneyInput
                                value={simpleTotals.lifestyle}
                                onChange={v => setSimpleTotals({ ...simpleTotals, lifestyle: v })}
                                className="bg-orange-50/30"
                            />
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* ECONOMIC ASSUMPTIONS - Requested by User */}
            <Card className="border-l-4 border-l-indigo-500 bg-indigo-50/20">
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2 text-indigo-700">
                        <TrendingUp size={18} /> Economic Assumptions
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label>Inflation Rate</Label>
                        <PercentInput
                            value={localAssumptions.inflation}
                            onChange={v => setLocalAssumptions({ ...localAssumptions, inflation: v })}
                        />
                        <p className="text-[10px] text-gray-400">Default 12%</p>
                    </div>
                    <div className="space-y-2">
                        <Label>Pre-Retire ROI</Label>
                        <PercentInput
                            value={localAssumptions.pre_retire_roi}
                            onChange={v => setLocalAssumptions({ ...localAssumptions, pre_retire_roi: v })}
                        />
                        <p className="text-[10px] text-gray-400">Inv. Growth Rate</p>
                    </div>
                    <div className="space-y-2">
                        <Label>Post-Retire ROI</Label>
                        <PercentInput
                            value={localAssumptions.post_retire_roi}
                            onChange={v => setLocalAssumptions({ ...localAssumptions, post_retire_roi: v })}
                        />
                        <p className="text-[10px] text-gray-400">Safe Withdrawal ROI</p>
                    </div>
                </CardContent>
            </Card>

            {/* Summary Box */}
            <Card className={`${leftover >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <CardContent className="p-4 flex justify-between items-center">
                    <div>
                        <div className="font-medium text-gray-700">Monthly Surplus</div>
                        <div className="text-xs text-gray-500">Income - Expenses</div>
                    </div>
                    <div className={`text-2xl font-bold ${leftover >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                        ₹{formatToIndianCurrency(leftover)}
                    </div>
                </CardContent>
            </Card>

            <Button
                onClick={handleSubmit}
                className="w-full h-12 text-base shadow-lg shadow-blue-500/20"
                variant="default"
            >
                Save & Continue →
            </Button>
        </div>
    );
}
