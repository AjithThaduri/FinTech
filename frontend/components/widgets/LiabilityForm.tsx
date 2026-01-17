'use client';
import { useState } from 'react';
import { useFinancialStore, Liability, LiabilityType } from '../../store/useFinancialStore';
import { Plus, Trash2, CreditCard, AlertCircle, Percent, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormattedNumberInput } from '@/components/ui/formatted-input';
import { MoneyInput } from '@/components/ui/money-input';

interface Props {
    onComplete: (next: any, summary: any) => void;
}

// Helper: Format to Indian Currency
const formatToIndianCurrency = (num: number) => {
    if (typeof num !== 'number' || isNaN(num)) return '';
    return num.toLocaleString('en-IN');
};

// Helper: Parse string to number
const parseFromCurrency = (str: string) => {
    return Number(str.replace(/,/g, '').replace(/[^\d.]/g, ''));
};

const formatCurrency = (value: number) => {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)} Cr`;
    if (value >= 100000) return `₹${(value / 100000).toFixed(2)} L`;
    return `₹${value.toLocaleString('en-IN')}`;
};

// --- Money Input Component ---


export default function LiabilityForm({ onComplete }: Props) {
    const { liabilities, addLiability, removeLiability } = useFinancialStore();
    const [hasLiability, setHasLiability] = useState<boolean | null>(null);

    const [data, setData] = useState<Partial<Liability>>({
        type: 'Home',
        total_loan_amount: 0,
        outstanding: 0,
        emi: 0,
        interest_rate: 8.5,
        tenure_months: 120
    });

    const handleNone = () => {
        onComplete(
            { text: "Understood. Let me analyze your complete financial profile...", widget: 'summary' },
            []
        );
    };

    const handleAddLoan = () => {
        if (data.outstanding && data.emi) {
            addLiability({
                type: data.type as LiabilityType,
                total_loan_amount: data.total_loan_amount || data.outstanding,
                outstanding: data.outstanding,
                emi: data.emi,
                interest_rate: data.interest_rate || 8.5,
                tenure_months: data.tenure_months || 120
            });

            setData({
                type: 'Home',
                total_loan_amount: 0,
                outstanding: 0,
                emi: 0,
                interest_rate: 8.5,
                tenure_months: 120
            });
        }
    };

    const handleSubmit = () => {
        onComplete(
            { text: "Perfect! Generating your comprehensive financial analysis...", widget: 'summary' },
            liabilities
        );
    };

    if (hasLiability === null) {
        return (
            <div className="space-y-6 animate-in fade-in duration-500">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-red-100 text-red-600 rounded-xl">
                        <AlertCircle size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-800 text-xl">Liabilities & Loans</h3>
                        <p className="text-gray-500 text-sm">Do you have any active loans (Home, Car, Personal)?</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <Button
                        onClick={() => setHasLiability(true)}
                        className="h-16 text-lg bg-red-50 text-red-600 hover:bg-red-100 border-red-200 border shadow-sm"
                        variant="outline"
                    >
                        Yes, I have loans
                    </Button>
                    <Button
                        onClick={handleNone}
                        className="h-16 text-lg bg-green-50 text-green-600 hover:bg-green-100 border-green-200 border shadow-sm"
                        variant="outline"
                    >
                        No loans
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-red-100 text-red-600 rounded-xl">
                    <AlertCircle size={24} />
                </div>
                <div>
                    <h3 className="font-bold text-gray-800 text-xl">Liabilities & Loans</h3>
                    <p className="text-gray-500 text-sm">Detail your outstanding debts.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <CreditCard size={18} className="text-red-500" />
                            Add New Loan
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Loan Type</Label>
                                <Select
                                    value={data.type}
                                    onValueChange={(v) => setData({ ...data, type: v as LiabilityType })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Home">Home Loan</SelectItem>
                                        <SelectItem value="Car">Car Loan</SelectItem>
                                        <SelectItem value="Personal">Personal Loan</SelectItem>
                                        <SelectItem value="Education">Education Loan</SelectItem>
                                        <SelectItem value="Other">Other Loan</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Total Loan Amount</Label>
                                <MoneyInput
                                    placeholder="50,00,000"
                                    value={data.total_loan_amount || 0}
                                    onChange={val => setData({ ...data, total_loan_amount: val })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Outstanding Amount</Label>
                                <MoneyInput
                                    placeholder="30,00,000"
                                    value={data.outstanding || 0}
                                    onChange={val => setData({ ...data, outstanding: val })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Monthly EMI</Label>
                                <MoneyInput
                                    placeholder="35,000"
                                    value={data.emi || 0}
                                    onChange={val => setData({ ...data, emi: val })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="flex items-center gap-1"><Percent size={14} /> Interest Rate (%)</Label>
                                <FormattedNumberInput
                                    placeholder="8.5"
                                    value={data.interest_rate}
                                    onChange={val => setData({ ...data, interest_rate: val })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="flex items-center gap-1"><Calendar size={14} /> Tenure (Months)</Label>
                                <FormattedNumberInput
                                    placeholder="180"
                                    value={data.tenure_months}
                                    onChange={val => setData({ ...data, tenure_months: val })}
                                />
                            </div>
                        </div>
                        <Button
                            onClick={handleAddLoan}
                            disabled={!data.outstanding || !data.emi}
                            className="w-full bg-red-50 text-red-600 hover:bg-red-100 border-red-200 border shadow-none"
                            variant="outline"
                        >
                            <Plus size={16} className="mr-2" /> Add Loan
                        </Button>
                    </CardContent>
                </Card>

                {/* Existing Loans List */}
                {liabilities.length > 0 && (
                    <div className="space-y-3">
                        <h4 className="font-semibold text-gray-700">Active Loans ({liabilities.length})</h4>
                        {liabilities.map((loan) => (
                            <Card key={loan.id} className="bg-red-50/50 border-red-100">
                                <CardContent className="p-4 flex items-center justify-between">
                                    <div>
                                        <div className="font-semibold text-gray-900">{loan.type} Loan</div>
                                        <div className="text-sm text-gray-600 mt-1">
                                            Outstanding: {formatCurrency(loan.outstanding)} • EMI: {formatCurrency(loan.emi)}/mo • Rate: {loan.interest_rate}%
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeLiability(loan.id!)}
                                        className="text-red-500 hover:text-red-700 hover:bg-red-100"
                                    >
                                        <Trash2 size={16} />
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}

                        <Card className="bg-red-100 border-none">
                            <CardContent className="p-4 flex justify-between items-center text-red-900">
                                <span className="font-medium">Total Monthly EMI Burden</span>
                                <span className="font-bold text-lg">
                                    {formatCurrency(liabilities.reduce((s, l) => s + l.emi, 0))}/mo
                                </span>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>

            <Button
                onClick={handleSubmit}
                className="w-full h-12 text-base shadow-lg shadow-blue-500/20"
                variant="default"
            >
                {liabilities.length > 0 ? 'Analyze My Finances →' : 'Continue Without Loans →'}
            </Button>
        </div>
    );
}
