'use client';
import { useState } from 'react';
import { useFinancialStore, RealEstateAsset, BankAccount, InvestmentAsset, InsurancePolicy, InvestmentType, AccountType, PolicyType } from '../../store/useFinancialStore';
import { Plus, Trash2, Building, Landmark, TrendingUp, Shield, Wallet } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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



export default function AssetsForm({ onComplete }: Props) {
    const {
        assets,
        user_profile,
        addRealEstate, removeRealEstate,
        addBankAccount, removeBankAccount,
        addInvestment, removeInvestment,
        addInsurancePolicy, removeInsurancePolicy,
        updateLiquidCash
    } = useFinancialStore();

    // Get all family members for the dropdown
    const familyMembers = [
        { name: user_profile.primary.name || 'Self', type: 'self' },
        ...(user_profile.spouse ? [{ name: user_profile.spouse.name, type: 'spouse' }] : []),
        ...user_profile.family_members.map(m => ({ name: m.name, type: m.relation_type }))
    ].filter(m => m.name);

    // Form states
    const [realEstate, setRealEstate] = useState<Partial<RealEstateAsset>>({});
    const [bankAccount, setBankAccount] = useState<Partial<BankAccount>>({ account_type: 'Savings' });
    const [investment, setInvestment] = useState<Partial<InvestmentAsset>>({ type: 'MF', monthly_sip: 0, current_value: 0 });
    const [insurance, setInsurance] = useState<Partial<InsurancePolicy>>({ policy_type: 'Term', premium_frequency: 'Annual' });

    const handleAddRealEstate = () => {
        if (realEstate.name && realEstate.present_value) {
            addRealEstate({
                person_name: realEstate.person_name,
                name: realEstate.name,
                present_value: realEstate.present_value,
                roi: realEstate.roi,
                remarks: realEstate.remarks
            });
            setRealEstate({});
        }
    };

    const handleAddBankAccount = () => {
        if (bankAccount.bank_name && bankAccount.balance !== undefined) {
            addBankAccount({
                person_name: bankAccount.person_name,
                bank_name: bankAccount.bank_name,
                account_type: bankAccount.account_type as AccountType,
                balance: bankAccount.balance,
                interest_rate: bankAccount.interest_rate,
                maturity_date: bankAccount.maturity_date,
                remarks: bankAccount.remarks
            });
            setBankAccount({ account_type: 'Savings' });
        }
    };

    const handleAddInvestment = () => {
        if (investment.type && investment.current_value !== undefined) {
            addInvestment({
                type: investment.type as InvestmentType,
                invested_amount: investment.invested_amount,
                current_value: investment.current_value,
                monthly_sip: investment.monthly_sip || 0,
                start_date: investment.start_date,
                end_date: investment.end_date,
                remarks: investment.remarks
            });
            setInvestment({ type: 'MF', monthly_sip: 0, current_value: 0 });
        }
    };

    const handleAddInsurance = () => {
        if (insurance.policy_name && insurance.sum_assured && insurance.premium) {
            addInsurancePolicy({
                person_name: insurance.person_name,
                policy_name: insurance.policy_name,
                policy_type: insurance.policy_type as PolicyType,
                sum_assured: insurance.sum_assured,
                premium: insurance.premium,
                premium_frequency: insurance.premium_frequency || 'Annual',
                ppt: insurance.ppt,
                start_date: insurance.start_date,
                end_date: insurance.end_date,
                maturity_amount: insurance.maturity_amount,
                remarks: insurance.remarks
            });
            setInsurance({ policy_type: 'Term', premium_frequency: 'Annual' });
        }
    };

    const handleSubmit = () => {
        onComplete(
            { text: "Now let's check your liabilities - any loans or debts?", widget: 'liabilities' },
            assets
        );
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                    <Wallet size={24} />
                </div>
                <div>
                    <h3 className="font-bold text-gray-800 text-xl">Assets & Wealth</h3>
                    <p className="text-gray-500 text-sm">Track your properties, investments, and insurance.</p>
                </div>
            </div>

            <Tabs defaultValue="real_estate" className="w-full">
                <TabsList className="grid w-full grid-cols-4 mb-8">
                    <TabsTrigger value="real_estate" className="flex items-center gap-2">
                        <Building size={16} /> <span className="hidden sm:inline">Property</span>
                    </TabsTrigger>
                    <TabsTrigger value="bank" className="flex items-center gap-2">
                        <Landmark size={16} /> <span className="hidden sm:inline">Bank</span>
                    </TabsTrigger>
                    <TabsTrigger value="investments" className="flex items-center gap-2">
                        <TrendingUp size={16} /> <span className="hidden sm:inline">Investments</span>
                    </TabsTrigger>
                    <TabsTrigger value="insurance" className="flex items-center gap-2">
                        <Shield size={16} /> <span className="hidden sm:inline">Insurance</span>
                    </TabsTrigger>
                </TabsList>

                {/* Real Estate Tab */}
                <TabsContent value="real_estate" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Real Estate Properties</CardTitle>
                            <CardDescription>Add plots, flats, or commercial properties you own.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label>Owned By</Label>
                                    <Select value={realEstate.person_name || ''} onValueChange={(v) => setRealEstate({ ...realEstate, person_name: v })}>
                                        <SelectTrigger><SelectValue placeholder="Select Owner" /></SelectTrigger>
                                        <SelectContent>
                                            {familyMembers.map((m, i) => (
                                                <SelectItem key={i} value={m.name}>{m.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Property Name</Label>
                                    <Input placeholder="e.g. 3BHK Apartment" value={realEstate.name || ''} onChange={e => setRealEstate({ ...realEstate, name: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Current Value</Label>
                                    <MoneyInput placeholder="50,00,000" value={realEstate.present_value} onChange={val => setRealEstate({ ...realEstate, present_value: val })} />
                                </div>
                            </div>
                            <Button onClick={handleAddRealEstate} className="w-full">
                                <Plus size={16} className="mr-2" /> Add Property
                            </Button>
                        </CardContent>
                    </Card>

                    {assets.real_estate.map(a => (
                        <Card key={a.id} className="bg-muted/50">
                            <CardContent className="p-4 flex justify-between items-center">
                                <div>
                                    <div className="font-medium text-sm">{a.name}</div>
                                    <div className="text-xs text-gray-500">
                                        {formatCurrency(a.present_value)}
                                        {a.person_name && <span className="ml-2 text-blue-600">({a.person_name})</span>}
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => removeRealEstate(a.id!)} className="text-destructive"><Trash2 size={16} /></Button>
                            </CardContent>
                        </Card>
                    ))}
                </TabsContent>

                {/* Bank Accounts Tab */}
                <TabsContent value="bank" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Bank Accounts & FDs</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label>Account Holder</Label>
                                    <Select value={bankAccount.person_name || ''} onValueChange={(v) => setBankAccount({ ...bankAccount, person_name: v })}>
                                        <SelectTrigger><SelectValue placeholder="Select Holder" /></SelectTrigger>
                                        <SelectContent>
                                            {familyMembers.map((m, i) => (
                                                <SelectItem key={i} value={m.name}>{m.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Bank Name</Label>
                                    <Input placeholder="e.g. HDFC Bank" value={bankAccount.bank_name || ''} onChange={e => setBankAccount({ ...bankAccount, bank_name: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Account Type</Label>
                                    <Select value={bankAccount.account_type} onValueChange={(v) => setBankAccount({ ...bankAccount, account_type: v as AccountType })}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Savings">Savings</SelectItem>
                                            <SelectItem value="Current">Current</SelectItem>
                                            <SelectItem value="FD">Fixed Deposit (FD)</SelectItem>
                                            <SelectItem value="RD">Recurring Deposit (RD)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Current Balance / Value</Label>
                                    <MoneyInput placeholder="50,000" value={bankAccount.balance} onChange={val => setBankAccount({ ...bankAccount, balance: val })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Interest Rate (%)</Label>
                                    <FormattedNumberInput placeholder="3.5" value={bankAccount.interest_rate} onChange={val => setBankAccount({ ...bankAccount, interest_rate: val })} />
                                </div>
                            </div>
                            <Button onClick={handleAddBankAccount} className="w-full">
                                <Plus size={16} className="mr-2" /> Add Account
                            </Button>
                        </CardContent>
                    </Card>

                    {assets.bank_accounts.map(a => (
                        <Card key={a.id} className="bg-muted/50">
                            <CardContent className="p-4 flex justify-between items-center">
                                <div>
                                    <div className="font-medium text-sm">{a.bank_name} ({a.account_type})</div>
                                    <div className="text-xs text-gray-500">
                                        {formatCurrency(a.balance)}
                                        {a.person_name && <span className="ml-2 text-blue-600">({a.person_name})</span>}
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => removeBankAccount(a.id!)} className="text-destructive"><Trash2 size={16} /></Button>
                            </CardContent>
                        </Card>
                    ))}
                </TabsContent>

                {/* Investments Tab */}
                <TabsContent value="investments" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Investments</CardTitle>
                            <CardDescription>Stocks, Mutual Funds, and more</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Investment Type</Label>
                                    <Select value={investment.type} onValueChange={(v) => setInvestment({ ...investment, type: v as InvestmentType })}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="MF">Mutual Funds</SelectItem>
                                            <SelectItem value="Stock">Stocks</SelectItem>
                                            <SelectItem value="Chit">Chit Fund</SelectItem>
                                            <SelectItem value="Other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Current Value</Label>
                                    <MoneyInput value={investment.current_value} onChange={val => setInvestment({ ...investment, current_value: val })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Monthly SIP Amount</Label>
                                    <MoneyInput value={investment.monthly_sip} onChange={val => setInvestment({ ...investment, monthly_sip: val })} />
                                </div>
                            </div>
                            <Button onClick={handleAddInvestment} className="w-full">
                                <Plus size={16} className="mr-2" /> Add Investment
                            </Button>
                        </CardContent>
                    </Card>

                    {assets.investments.map(a => (
                        <Card key={a.id} className="bg-muted/50">
                            <CardContent className="p-4 flex justify-between items-center">
                                <div>
                                    <div className="font-medium text-sm">{a.type}</div>
                                    <div className="text-xs text-gray-500">{formatCurrency(a.current_value)} (SIP: {formatCurrency(a.monthly_sip)})</div>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => removeInvestment(a.id!)} className="text-destructive"><Trash2 size={16} /></Button>
                            </CardContent>
                        </Card>
                    ))}
                </TabsContent>

                {/* Insurance Tab */}
                <TabsContent value="insurance" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Insurance Policies</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label>Policyholder</Label>
                                    <Select value={insurance.person_name || ''} onValueChange={(v) => setInsurance({ ...insurance, person_name: v })}>
                                        <SelectTrigger><SelectValue placeholder="Select Holder" /></SelectTrigger>
                                        <SelectContent>
                                            {familyMembers.map((m, i) => (
                                                <SelectItem key={i} value={m.name}>{m.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Policy Name</Label>
                                    <Input placeholder="e.g. LIC Jeevan Anand" value={insurance.policy_name || ''} onChange={e => setInsurance({ ...insurance, policy_name: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Policy Type</Label>
                                    <Select value={insurance.policy_type} onValueChange={(v) => setInsurance({ ...insurance, policy_type: v as PolicyType })}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Term">Term Life</SelectItem>
                                            <SelectItem value="Health">Health</SelectItem>
                                            <SelectItem value="Endowment">Endowment</SelectItem>
                                            <SelectItem value="ULIP">ULIP</SelectItem>
                                            <SelectItem value="Whole Life">Whole Life</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Sum Assured</Label>
                                    <MoneyInput value={insurance.sum_assured} onChange={val => setInsurance({ ...insurance, sum_assured: val })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Premium Amount</Label>
                                    <MoneyInput value={insurance.premium} onChange={val => setInsurance({ ...insurance, premium: val })} />
                                </div>
                            </div>
                            <Button onClick={handleAddInsurance} className="w-full">
                                <Plus size={16} className="mr-2" /> Add Policy
                            </Button>
                        </CardContent>
                    </Card>

                    {assets.insurance_policies.map(p => (
                        <Card key={p.id} className="bg-muted/50">
                            <CardContent className="p-4 flex justify-between items-center">
                                <div>
                                    <div className="font-medium text-sm">{p.policy_name} ({p.policy_type})</div>
                                    <div className="text-xs text-gray-500">
                                        Cover: {formatCurrency(p.sum_assured)} | Premium: {formatCurrency(p.premium)}
                                        {p.person_name && <span className="ml-2 text-blue-600">({p.person_name})</span>}
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => removeInsurancePolicy(p.id!)} className="text-destructive"><Trash2 size={16} /></Button>
                            </CardContent>
                        </Card>
                    ))}
                </TabsContent>
            </Tabs>

            {/* Liquid Cash */}
            <Card className="bg-blue-50/50 border-blue-100">
                <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Wallet className="text-blue-600" />
                        <div>
                            <p className="font-medium text-blue-900">Other Liquid Cash</p>
                            <p className="text-xs text-blue-700">Cash in hand or unbanked savings</p>
                        </div>
                    </div>
                    <div className="w-40">
                        <MoneyInput
                            placeholder="0"
                            className="bg-white"
                            value={assets.liquid_cash}
                            onChange={val => updateLiquidCash(val)}
                        />
                    </div>
                </CardContent>
            </Card>

            <Button
                onClick={handleSubmit}
                className="w-full h-12 text-base shadow-lg shadow-blue-500/20"
                variant="default"
            >
                Continue to Liabilities →
            </Button>
        </div>
    );
}
