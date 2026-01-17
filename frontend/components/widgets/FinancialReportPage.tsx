'use client';
import { useEffect, useState } from 'react';
import { useFinancialStore } from '../../store/useFinancialStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
    Users, Target, Wallet, TrendingUp, Shield, AlertCircle,
    RefreshCw, Baby, Umbrella, Heart, Calendar,
    DollarSign, PiggyBank, ChevronDown, ChevronUp, PieChart as PieIcon, BarChart3
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Legend, PieChart, Pie, Cell, ComposedChart, Line
} from 'recharts';

// ============================================================================
// TYPES
// ============================================================================

interface RetirementCashflowRow {
    year: number;
    begin_value: number;
    monthly_pension: number;
    pension_paid_yearly: number;
    end_value: number;
}

interface ChildGoalPlanning {
    goal_name: string;
    present_cost: number;
    target_age: number;
    months_left: number;
    inflation: number;
    cost_at_target: number;
    expected_return: number;
    monthly_sip_required: number;
}

interface ChildPlanningResult {
    child_name: string;
    child_current_age: number;
    goals: ChildGoalPlanning[];
    total_monthly_sip: number;
}

interface ContingencyFundResult {
    monthly_expenses: number;
    months_required: number;
    contingency_fund_required: number;
}

interface InsuranceCoverResult {
    member_name: string;
    monthly_income: number;
    current_age: number;
    retirement_age: number;
    expected_growth: number;
    years_left: number;
    insurance_cover_required: number;
}

interface ExtendedResults {
    time_metrics: any;
    retirement: any;
    goals: any[];
    summary: any;
    retirement_cashflow_table?: RetirementCashflowRow[];
    child_planning?: ChildPlanningResult[];
    contingency_fund?: ContingencyFundResult;
    insurance_cover?: InsuranceCoverResult[];
}

const COLORS = {
    primary: '#3B82F6',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    purple: '#8B5CF6',
    pink: '#EC4899',
    indigo: '#6366F1',
    teal: '#14B8A6',
    slate: '#64748B',
    orange: '#F97316'
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function FinancialReportPage() {
    const state = useFinancialStore();
    const [results, setResults] = useState<ExtendedResults | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [recalculating, setRecalculating] = useState(false);

    // Editable parameters
    const [editableParams, setEditableParams] = useState({
        inflation: 6,
        preRetireRoi: 12,
        postRetireRoi: 8,
        contingencyMonths: 6,
        insuranceGrowth: 5,
    });

    // Collapsible sections
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        cashflow: true,
        retirement: true,
        retirementTable: true,
        children: true,
        contingency: true,
        insurance: true,
    });

    const toggleSection = (key: string) => {
        setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const fetchAnalysis = async () => {
        setRecalculating(true);
        try {
            state.recalculateLinkedValues();

            // Update assumptions with editable values
            const payload = {
                ...state.getPayload(),
                assumptions: {
                    inflation: editableParams.inflation / 100,
                    pre_retire_roi: editableParams.preRetireRoi / 100,
                    post_retire_roi: editableParams.postRetireRoi / 100,
                }
            };

            const res = await fetch('http://localhost:8000/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.detail || 'Failed to fetch analysis');
            }

            const data = await res.json();
            setResults(data);

            setError(null);
        } catch (err: any) {
            setError(err.message || 'Analysis failed');
        } finally {
            setLoading(false);
            setRecalculating(false);
        }
    };

    useEffect(() => {
        // Initial fetch with default or stored values
        const currentAssumptions = state.assumptions;
        setEditableParams({
            inflation: currentAssumptions.inflation * 100,
            preRetireRoi: currentAssumptions.pre_retire_roi * 100,
            postRetireRoi: currentAssumptions.post_retire_roi * 100,
            contingencyMonths: 6,
            insuranceGrowth: 5,
        });

        // Small delay to ensure state is ready
        setTimeout(fetchAnalysis, 100);
    }, []);

    const handleRecalculate = () => {
        fetchAnalysis();
    };

    const formatCurrency = (value: number) => {
        if (Math.abs(value) >= 10000000) return `₹${(value / 10000000).toFixed(2)} Cr`;
        if (Math.abs(value) >= 100000) return `₹${(value / 100000).toFixed(2)} L`;
        return `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
    };

    if (loading) {
        return (
            <div className="min-h-[500px] flex flex-col items-center justify-center gap-4">
                <div className="w-16 h-16 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin" />
                <p className="text-gray-600 font-medium">Generating financial insights...</p>
            </div>
        );
    }

    if (error) {
        return (
            <Card className="border-red-200 bg-red-50 m-4">
                <CardContent className="p-8 flex flex-col items-center text-center gap-4">
                    <AlertCircle className="text-red-500" size={48} />
                    <h3 className="font-bold text-red-700 text-xl">Report Error</h3>
                    <p className="text-red-600">{error}</p>
                    <Button variant="outline" onClick={() => window.location.reload()}>
                        Try Again
                    </Button>
                </CardContent>
            </Card>
        );
    }

    if (!results) return null;

    const { summary, retirement, time_metrics, goals, retirement_cashflow_table, child_planning, contingency_fund, insurance_cover } = results;

    // --- Chart Data Preparation ---

    const cashflowPieData = [
        { name: 'Essential', value: summary.essential_expense_percent, color: COLORS.orange },
        { name: 'Lifestyle', value: summary.lifestyle_expense_percent, color: COLORS.purple },
        { name: 'EMI', value: summary.emi_burden, color: COLORS.danger },
        { name: 'Investments', value: summary.investment_rate, color: COLORS.success },
        { name: 'Savings', value: summary.savings_rate, color: COLORS.primary },
    ].filter(d => d.value > 0);

    return (
        <div className="space-y-8 pb-12 max-w-7xl mx-auto">
            {/* Header */}
            <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full mix-blend-overlay filter blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500 rounded-full mix-blend-overlay filter blur-3xl opacity-20 translate-y-1/2 -translate-x-1/2"></div>

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">Financial Planning Report</h1>
                        <p className="text-slate-300">
                            Interactive dashboard with real-time recalculations based on your assumptions.
                        </p>
                    </div>
                </div>
            </div>

            {/* Editable Assumptions Bar */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm sticky top-5 z-30">
                <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
                        <div className="flex items-center gap-2 text-blue-700 font-semibold whitespace-nowrap">
                            <RefreshCw size={18} /> Assumptions
                        </div>
                        <div className="flex-1 w-full grid grid-cols-2 md:grid-cols-5 gap-4">
                            <InputGroup label="Inflation %" value={editableParams.inflation} onChange={v => setEditableParams(p => ({ ...p, inflation: v }))} suffix="%" />
                            <InputGroup label="Pre-Retire ROI" value={editableParams.preRetireRoi} onChange={v => setEditableParams(p => ({ ...p, preRetireRoi: v }))} suffix="%" />
                            <InputGroup label="Post-Retire ROI" value={editableParams.postRetireRoi} onChange={v => setEditableParams(p => ({ ...p, postRetireRoi: v }))} suffix="%" />
                            <InputGroup label="Emergency Mos" value={editableParams.contingencyMonths} onChange={v => setEditableParams(p => ({ ...p, contingencyMonths: v }))} suffix="m" />
                            <InputGroup label="Inc. Growth" value={editableParams.insuranceGrowth} onChange={v => setEditableParams(p => ({ ...p, insuranceGrowth: v }))} suffix="%" />
                        </div>
                        <Button
                            onClick={handleRecalculate}
                            disabled={recalculating}
                            className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 shadow-md transition-all hover:scale-105"
                        >
                            {recalculating ? <RefreshCw size={16} className="animate-spin mr-2" /> : <RefreshCw size={16} className="mr-2" />}
                            Recalculate
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Section 1: Monthly Cashflow & Health */}
            <div className="grid md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                    <SectionCard
                        title="Monthly Cashflow Analysis"
                        icon={<Wallet size={20} />}
                        isExpanded={expandedSections.cashflow}
                        onToggle={() => toggleSection('cashflow')}
                        color="indigo"
                    >
                        <div className="grid md:grid-cols-2 gap-8 items-center">
                            {/* Stats */}
                            <div className="grid grid-cols-2 gap-4">
                                <MetricBox label="Total Inflow" value={formatCurrency(summary.total_monthly_inflow)} color="green" />
                                <MetricBox label="Total Outflow" value={formatCurrency(summary.total_monthly_outflow)} unit={`(${((summary.total_monthly_outflow / summary.total_monthly_inflow) * 100).toFixed(1)}%)`} color="red" />
                                <MetricBox label="Net Worth" value={formatCurrency(summary.net_worth)} color="blue" fullWidth />
                                <Separator className="col-span-2 my-2" />
                                <MetricBox label="Savings Rate" value={`${summary.savings_rate?.toFixed(1) || 0}%`} color="primary" />
                                <MetricBox label="EMI Burden" value={`${summary.emi_burden?.toFixed(1) || 0}%`} color="orange" />
                            </div>

                            {/* Chart */}
                            <div className="h-[220px] w-full">
                                <h4 className="text-xs font-semibold text-center text-gray-500 mb-2 uppercase tracking-wider">Outflow Breakdown</h4>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={cashflowPieData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {cashflowPieData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            formatter={(value: any) => `${value.toFixed(1)}%`}
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                        />
                                        <Legend
                                            verticalAlign="bottom"
                                            height={36}
                                            iconType="circle"
                                            formatter={(value) => <span className="text-xs text-gray-600 ml-1">{value}</span>}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <Separator className="my-6" />

                        {/* Outflow % Split Table (Spec Section 5.3) */}
                        <div className="mt-4">
                            <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                                <PieIcon size={16} className="text-indigo-500" />
                                Outflow % Split Analysis
                            </h4>
                            <div className="overflow-hidden rounded-xl border border-slate-200">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50 border-b border-slate-200">
                                        <tr>
                                            <th className="px-4 py-3 text-left font-semibold text-slate-700">Parameter</th>
                                            <th className="px-4 py-3 text-right font-semibold text-slate-700">Expense Amount</th>
                                            <th className="px-4 py-3 text-right font-semibold text-slate-700">% of Inflow</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        <tr>
                                            <td className="px-4 py-3 text-slate-600 font-medium whitespace-nowrap">Total Essential Expenses</td>
                                            <td className="px-4 py-3 text-right text-slate-900">{formatCurrency(summary.total_monthly_outflow * (summary.essential_expense_percent / 100) / (summary.total_monthly_outflow / summary.total_monthly_inflow ? summary.total_monthly_outflow / summary.total_monthly_inflow : 1))}</td>
                                            {/* Note: I'll use the pre-calculated percentages from the summary */}
                                            <td className="px-4 py-3 text-right">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-700">
                                                    {summary.essential_expense_percent.toFixed(1)}%
                                                </span>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="px-4 py-3 text-slate-600 font-medium whitespace-nowrap">Total Lifestyle Expenses</td>
                                            <td className="px-4 py-3 text-right text-slate-900">{formatCurrency(summary.total_monthly_inflow * (summary.lifestyle_expense_percent / 100))}</td>
                                            <td className="px-4 py-3 text-right">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-700">
                                                    {summary.lifestyle_expense_percent.toFixed(1)}%
                                                </span>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="px-4 py-3 text-slate-600 font-medium whitespace-nowrap">Total EMIs</td>
                                            <td className="px-4 py-3 text-right text-slate-900">{formatCurrency(summary.total_monthly_inflow * (summary.emi_burden / 100))}</td>
                                            <td className="px-4 py-3 text-right">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">
                                                    {summary.emi_burden.toFixed(1)}%
                                                </span>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="px-4 py-3 text-slate-600 font-medium whitespace-nowrap">Total Investments</td>
                                            <td className="px-4 py-3 text-right text-slate-900">{formatCurrency(summary.total_monthly_inflow * (summary.investment_rate / 100))}</td>
                                            <td className="px-4 py-3 text-right">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700">
                                                    {summary.investment_rate.toFixed(1)}%
                                                </span>
                                            </td>
                                        </tr>
                                        <tr className="bg-indigo-50/30">
                                            <td className="px-4 py-3 text-indigo-700 font-bold whitespace-nowrap">Leftout For the Month (Savings)</td>
                                            <td className="px-4 py-3 text-right text-indigo-900 font-bold">{formatCurrency(summary.total_monthly_inflow * (summary.savings_rate / 100))}</td>
                                            <td className="px-4 py-3 text-right">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700">
                                                    {summary.savings_rate.toFixed(1)}%
                                                </span>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8 mt-6">
                            {/* Inflow Breakdown Table */}
                            <div>
                                <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                                    <TrendingUp size={16} className="text-green-500" />
                                    Inflow Breakdown
                                </h4>
                                <div className="overflow-hidden rounded-xl border border-slate-200">
                                    <table className="w-full text-sm">
                                        <thead className="bg-slate-50 border-b border-slate-200">
                                            <tr>
                                                <th className="px-4 py-3 text-left font-semibold text-slate-700">Source</th>
                                                <th className="px-4 py-3 text-right font-semibold text-slate-700">Amount</th>
                                                <th className="px-4 py-3 text-right font-semibold text-slate-700">%</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {[
                                                { label: 'Primary Income', value: state.cash_flow.inflows.primary_income },
                                                { label: 'Spouse Income', value: state.cash_flow.inflows.spouse_income },
                                                { label: 'Rental Income', value: state.cash_flow.inflows.rental_income },
                                                { label: 'Additional Income', value: state.cash_flow.inflows.additional_income },
                                                { label: 'Other Inflows', value: state.cash_flow.inflows.other }
                                            ].filter(i => i.value > 0).map((item, idx) => (
                                                <tr key={idx}>
                                                    <td className="px-4 py-3 text-slate-600 font-medium">{item.label}</td>
                                                    <td className="px-4 py-3 text-right text-slate-900">{formatCurrency(item.value)}</td>
                                                    <td className="px-4 py-3 text-right">
                                                        <span className="text-xs font-bold text-slate-500">
                                                            {((item.value / summary.total_monthly_inflow) * 100).toFixed(1)}%
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                            <tr className="bg-green-50/30">
                                                <td className="px-4 py-3 text-green-700 font-bold text-base">Total Inflow</td>
                                                <td className="px-4 py-3 text-right text-green-900 font-bold text-base">{formatCurrency(summary.total_monthly_inflow)}</td>
                                                <td className="px-4 py-3 text-right text-green-700 font-bold">100%</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Outflow % Split Table */}
                            <div>
                                <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                                    <PieIcon size={16} className="text-indigo-500" />
                                    Outflow % of Inflow
                                </h4>
                                <div className="overflow-hidden rounded-xl border border-slate-200">
                                    <table className="w-full text-sm">
                                        <thead className="bg-slate-50 border-b border-slate-200">
                                            <tr>
                                                <th className="px-4 py-3 text-left font-semibold text-slate-700">Category</th>
                                                <th className="px-4 py-3 text-right font-semibold text-slate-700">Amount</th>
                                                <th className="px-4 py-3 text-right font-semibold text-slate-700">% Inflow</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            <tr>
                                                <td className="px-4 py-3 text-slate-600 font-medium whitespace-nowrap">Essential Expenses</td>
                                                <td className="px-4 py-3 text-right text-slate-900">{formatCurrency(summary.total_monthly_inflow * (summary.essential_expense_percent / 100))}</td>
                                                <td className="px-4 py-3 text-right">
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-700 w-14 justify-center">
                                                        {summary.essential_expense_percent.toFixed(1)}%
                                                    </span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="px-4 py-3 text-slate-600 font-medium whitespace-nowrap">Lifestyle Expenses</td>
                                                <td className="px-4 py-3 text-right text-slate-900">{formatCurrency(summary.total_monthly_inflow * (summary.lifestyle_expense_percent / 100))}</td>
                                                <td className="px-4 py-3 text-right">
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-700 w-14 justify-center">
                                                        {summary.lifestyle_expense_percent.toFixed(1)}%
                                                    </span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="px-4 py-3 text-slate-600 font-medium whitespace-nowrap">Debt Obligations (EMI)</td>
                                                <td className="px-4 py-3 text-right text-slate-900">{formatCurrency(summary.total_monthly_inflow * (summary.emi_burden / 100))}</td>
                                                <td className="px-4 py-3 text-right">
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 w-14 justify-center">
                                                        {summary.emi_burden.toFixed(1)}%
                                                    </span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="px-4 py-3 text-slate-600 font-medium whitespace-nowrap">Planned Investments</td>
                                                <td className="px-4 py-3 text-right text-slate-900">{formatCurrency(summary.total_monthly_inflow * (summary.investment_rate / 100))}</td>
                                                <td className="px-4 py-3 text-right">
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700 w-14 justify-center">
                                                        {summary.investment_rate.toFixed(1)}%
                                                    </span>
                                                </td>
                                            </tr>
                                            <tr className="bg-indigo-50/30">
                                                <td className="px-4 py-3 text-indigo-700 font-bold whitespace-nowrap">Monthly Savings Capacity</td>
                                                <td className="px-4 py-3 text-right text-indigo-900 font-bold">{formatCurrency(summary.total_monthly_inflow * (summary.savings_rate / 100))}</td>
                                                <td className="px-4 py-3 text-right">
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700 w-14 justify-center">
                                                        {summary.savings_rate.toFixed(1)}%
                                                    </span>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </SectionCard>
                </div>

                {/* Contingency Fund Card (Moved here for layout balance) */}
                {contingency_fund && (
                    <Card className="border-0 shadow-md h-full bg-gradient-to-br from-teal-50 to-white border-t-4 border-teal-500">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-teal-800 text-lg">
                                <Umbrella size={20} /> Emergency Fund
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="text-center py-4">
                                <p className="text-sm text-gray-500 mb-1">Required Corpus</p>
                                <p className="text-3xl font-bold text-teal-700 tracking-tight">
                                    {formatCurrency(contingency_fund.contingency_fund_required)}
                                </p>
                                <p className="text-xs text-teal-600 mt-2 bg-teal-100 py-1 px-3 rounded-full inline-block">
                                    {contingency_fund.months_required} Months of Expenses
                                </p>
                            </div>
                            <div className="bg-white p-4 rounded-xl border border-teal-100">
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-gray-600">Monthly Burn</span>
                                    <span className="font-semibold">{formatCurrency(contingency_fund.monthly_expenses)}</span>
                                </div>
                                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                    <div className="bg-teal-500 h-full w-[30%] animate-pulse"></div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Section 2: Retirement Planning */}
            <div className="grid md:grid-cols-1 gap-6">
                <SectionCard
                    title="Retirement Corpus Projection"
                    icon={<Calendar size={20} />}
                    isExpanded={expandedSections.retirement}
                    onToggle={() => toggleSection('retirement')}
                    color="amber"
                >
                    <div className="grid md:grid-cols-4 gap-6 mb-8">
                        <MetricBox label="Current Age" value={`${time_metrics.current_age?.toFixed(1) || 0}`} unit="yrs" color="gray" />
                        <MetricBox label="Retirement Age" value={`${time_metrics.retirement_age || 60}`} unit="yrs" color="gray" />
                        <MetricBox label="Corpus Required" value={formatCurrency(retirement.corpus_required)} color="amber" highlight />
                        <MetricBox label="Monthly Pension" value={formatCurrency(retirement.expense_at_retirement_monthly)} color="blue" />
                    </div>

                    {/* Retirement Journey Area Chart */}
                    {retirement_cashflow_table && retirement_cashflow_table.length > 0 && (
                        <div className="mt-8">
                            <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                                <TrendingUp size={16} /> Corpus Depletion Journey (Age {time_metrics.retirement_age} to {time_metrics.life_expectancy || 85})
                            </h4>
                            <div className="h-[350px] w-full bg-slate-50 rounded-xl p-4 border border-slate-100">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={retirement_cashflow_table} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={COLORS.warning} stopOpacity={0.8} />
                                                <stop offset="95%" stopColor={COLORS.warning} stopOpacity={0.1} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                        <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fill: '#64748B' }} />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#64748B' }}
                                            tickFormatter={(value) => `₹${(value / 10000000).toFixed(1)} Cr`}
                                        />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}
                                            formatter={(value: any) => [`₹${(value / 10000000).toFixed(2)} Cr`, "Corpus Balance"]}
                                            labelFormatter={(label) => `Age ${label}`}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="begin_value"
                                            stroke={COLORS.warning}
                                            fillOpacity={1}
                                            fill="url(#colorValue)"
                                            strokeWidth={3}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Retirement Cashflow Table */}
                            <div className="mt-8">
                                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                    <Calendar size={16} className="text-orange-500" />
                                    Year-by-Year Cashflow Table
                                </h4>
                                <div className="overflow-x-auto max-h-[400px] overflow-y-auto rounded-lg border border-gray-200">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gradient-to-r from-orange-50 to-amber-50 sticky top-0">
                                            <tr>
                                                <th className="px-4 py-3 text-left font-semibold text-gray-700">Age (Year)</th>
                                                <th className="px-4 py-3 text-right font-semibold text-gray-700">Begin Value</th>
                                                <th className="px-4 py-3 text-right font-semibold text-gray-700">Monthly Pension</th>
                                                <th className="px-4 py-3 text-right font-semibold text-gray-700">Pension Paid (Year)</th>
                                                <th className="px-4 py-3 text-right font-semibold text-gray-700">End Value</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {retirement_cashflow_table.map((row, idx) => (
                                                <tr
                                                    key={row.year}
                                                    className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-orange-50 transition-colors`}
                                                >
                                                    <td className="px-4 py-2.5 font-medium text-gray-900">{row.year}</td>
                                                    <td className="px-4 py-2.5 text-right text-gray-700">
                                                        {formatCurrency(row.begin_value)}
                                                    </td>
                                                    <td className="px-4 py-2.5 text-right text-blue-600 font-medium">
                                                        {formatCurrency(row.monthly_pension)}
                                                    </td>
                                                    <td className="px-4 py-2.5 text-right text-orange-600 font-medium">
                                                        {formatCurrency(row.pension_paid_yearly)}
                                                    </td>
                                                    <td className={`px-4 py-2.5 text-right font-semibold ${row.end_value > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                        {formatCurrency(row.end_value)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </SectionCard>
            </div>

            {/* Section 2.5: Goal Achievability Analysis */}
            {goals && goals.length > 0 && (
                <div className="grid md:grid-cols-1 gap-6">
                    <SectionCard
                        title="Goal Achievability Analysis"
                        icon={<Target size={20} />}
                        isExpanded={true}
                        onToggle={() => { }}
                        color="blue"
                    >
                        {/* Goal Summary */}
                        {goals[0]?._summary && (
                            <div className="grid md:grid-cols-4 gap-4 mb-6">
                                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-center">
                                    <p className="text-xs text-blue-600 uppercase font-semibold tracking-wider mb-1">Monthly Surplus</p>
                                    <p className="text-xl font-bold text-blue-800">{formatCurrency(goals[0]._summary.monthly_surplus_available)}</p>
                                </div>
                                <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 text-center">
                                    <p className="text-xs text-indigo-600 uppercase font-semibold tracking-wider mb-1">SIP for All Goals</p>
                                    <p className="text-xl font-bold text-indigo-800">{formatCurrency(goals[0]._summary.total_monthly_sip_for_all_goals)}</p>
                                </div>
                                <div className={`p-4 rounded-xl border text-center ${goals[0]._summary.all_goals_feasible
                                        ? 'bg-green-50 border-green-100'
                                        : 'bg-red-50 border-red-100'
                                    }`}>
                                    <p className={`text-xs uppercase font-semibold tracking-wider mb-1 ${goals[0]._summary.all_goals_feasible ? 'text-green-600' : 'text-red-600'
                                        }`}>After All Goals</p>
                                    <p className={`text-xl font-bold ${goals[0]._summary.all_goals_feasible ? 'text-green-800' : 'text-red-800'
                                        }`}>{formatCurrency(goals[0]._summary.surplus_after_all_goals)}</p>
                                </div>
                                <div className={`p-4 rounded-xl border text-center ${goals[0]._summary.all_goals_feasible
                                        ? 'bg-emerald-50 border-emerald-200'
                                        : 'bg-amber-50 border-amber-200'
                                    }`}>
                                    <p className={`text-xs uppercase font-semibold tracking-wider mb-1 ${goals[0]._summary.all_goals_feasible ? 'text-emerald-600' : 'text-amber-600'
                                        }`}>Feasibility</p>
                                    <p className={`text-lg font-bold ${goals[0]._summary.all_goals_feasible ? 'text-emerald-700' : 'text-amber-700'
                                        }`}>{goals[0]._summary.all_goals_feasible ? '✅ All Achievable' : '⚠️ Needs Review'}</p>
                                </div>
                            </div>
                        )}

                        {/* Goals Table */}
                        <div className="overflow-x-auto rounded-xl border border-gray-200">
                            <table className="w-full text-sm">
                                <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-semibold text-slate-700">Goal</th>
                                        <th className="px-4 py-3 text-left font-semibold text-slate-700">For</th>
                                        <th className="px-4 py-3 text-right font-semibold text-slate-700">Current Cost</th>
                                        <th className="px-4 py-3 text-right font-semibold text-slate-700">Future Cost</th>
                                        <th className="px-4 py-3 text-center font-semibold text-slate-700">Timeline</th>
                                        <th className="px-4 py-3 text-right font-semibold text-slate-700">Monthly SIP</th>
                                        <th className="px-4 py-3 text-center font-semibold text-slate-700">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {goals.map((goal: any, idx: number) => {
                                        const statusColors: Record<string, string> = {
                                            'ON_TRACK': 'bg-green-100 text-green-800',
                                            'NEEDS_ATTENTION': 'bg-yellow-100 text-yellow-800',
                                            'AT_RISK': 'bg-orange-100 text-orange-800',
                                            'CRITICAL': 'bg-red-100 text-red-800',
                                            'PAST_DUE': 'bg-gray-100 text-gray-800',
                                            'ACHIEVED': 'bg-emerald-100 text-emerald-800',
                                        };
                                        const statusIcons: Record<string, string> = {
                                            'ON_TRACK': '✅',
                                            'NEEDS_ATTENTION': '⚠️',
                                            'AT_RISK': '🔶',
                                            'CRITICAL': '🔴',
                                            'PAST_DUE': '❌',
                                            'ACHIEVED': '✓',
                                        };
                                        return (
                                            <tr key={idx} className="hover:bg-slate-50/50">
                                                <td className="px-4 py-3 font-medium text-slate-900">{goal.name}</td>
                                                <td className="px-4 py-3 text-slate-600">{goal.person_name || 'Self'}</td>
                                                <td className="px-4 py-3 text-right text-slate-600">{formatCurrency(goal.current_cost)}</td>
                                                <td className="px-4 py-3 text-right font-semibold text-blue-700">{formatCurrency(goal.future_cost)}</td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded-full text-xs font-medium">
                                                        {goal.years_to_goal?.toFixed(1)} yrs ({goal.months_to_goal} mo)
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <span className="font-bold text-indigo-700">{formatCurrency(goal.monthly_sip_required)}</span>
                                                    <span className="text-xs text-slate-500 block">{goal.surplus_allocation_percent?.toFixed(0)}% of surplus</span>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${statusColors[goal.status] || 'bg-gray-100'}`}>
                                                        {statusIcons[goal.status]} {goal.feasibility}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Alert if goals exceed surplus */}
                        {goals[0]?._summary && !goals[0]._summary.all_goals_feasible && (
                            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                                <AlertCircle className="text-amber-600 mt-0.5" size={20} />
                                <div>
                                    <p className="font-semibold text-amber-800">Action Required</p>
                                    <p className="text-sm text-amber-700 mt-1">
                                        Your combined goal SIP of <strong>{formatCurrency(goals[0]._summary.total_monthly_sip_for_all_goals)}/month</strong> exceeds
                                        your available surplus of <strong>{formatCurrency(goals[0]._summary.monthly_surplus_available)}/month</strong>.
                                        Consider prioritizing critical goals, extending timelines, or increasing income.
                                    </p>
                                </div>
                            </div>
                        )}
                    </SectionCard>
                </div>
            )}

            {/* Section 3: Child Planning & Insurance */}
            <div className="grid md:grid-cols-2 gap-6">
                {/* Child Planning */}
                {child_planning && child_planning.length > 0 && (
                    <SectionCard
                        title="Child Future Goals"
                        icon={<Baby size={20} />}
                        isExpanded={expandedSections.children}
                        onToggle={() => toggleSection('children')}
                        color="pink"
                    >
                        {child_planning.map((child, idx) => (
                            <div key={idx} className="mb-8 last:mb-0">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 font-bold">
                                            {child.child_name.charAt(0)}
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-gray-900">{child.child_name}</h4>
                                            <p className="text-xs text-gray-500">Age: {child.child_current_age} | SIP Needed: <span className="font-bold text-pink-600">{formatCurrency(child.total_monthly_sip)}/mo</span></p>
                                        </div>
                                    </div>
                                </div>

                                {/* Bar Chart for Goals */}
                                <div className="h-[200px] w-full mt-2">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart
                                            data={child.goals}
                                            layout="vertical"
                                            margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                                            <XAxis type="number" hide />
                                            <YAxis
                                                dataKey="goal_name"
                                                type="category"
                                                width={100}
                                                tick={{ fontSize: 12 }}
                                                tickFormatter={(val) => val.length > 12 ? val.substring(0, 10) + '...' : val}
                                            />
                                            <Tooltip
                                                cursor={{ fill: 'transparent' }}
                                                content={({ active, payload }) => {
                                                    if (active && payload && payload.length) {
                                                        const data = payload[0].payload;
                                                        return (
                                                            <div className="bg-white p-3 rounded-lg shadow-xl border border-pink-100 text-sm">
                                                                <p className="font-bold mb-1">{data.goal_name}</p>
                                                                <p className="text-gray-500">Present Cost: {formatCurrency(data.present_cost)}</p>
                                                                <p className="text-pink-600 font-semibold">Future Cost: {formatCurrency(data.cost_at_target)}</p>
                                                                <p className="text-xs text-gray-400 mt-1">Due in {data.months_left} months</p>
                                                            </div>
                                                        );
                                                    }
                                                    return null;
                                                }}
                                            />
                                            <Bar dataKey="cost_at_target" fill={COLORS.pink} radius={[0, 4, 4, 0]} barSize={20} background={{ fill: '#fce7f3' }} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        ))}
                    </SectionCard>
                )}

                {/* Insurance Cover */}
                {insurance_cover && insurance_cover.length > 0 && (
                    <SectionCard
                        title="Insurance Protection"
                        icon={<Shield size={20} />}
                        isExpanded={expandedSections.insurance}
                        onToggle={() => toggleSection('insurance')}
                        color="blue"
                    >
                        <div className="space-y-4">
                            {insurance_cover.map((member, i) => (
                                <div key={i} className="bg-white rounded-xl border border-blue-100 overflow-hidden hover:shadow-md transition-shadow">
                                    <div className="p-4 bg-gradient-to-r from-blue-50 to-white flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                                                <Users size={18} />
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-gray-900">{member.member_name}</h4>
                                                <p className="text-xs text-gray-500">Retires in {member.years_left} years</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-blue-500 font-medium uppercase tracking-wider">Cover Needed</p>
                                            <p className="text-xl font-bold text-slate-800">{formatCurrency(member.insurance_cover_required)}</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-px bg-blue-100">
                                        <div className="bg-white p-3 text-center">
                                            <p className="text-[10px] uppercase text-gray-400 font-medium">Monthly Income</p>
                                            <p className="font-semibold text-gray-700">{formatCurrency(member.monthly_income)}</p>
                                        </div>
                                        <div className="bg-white p-3 text-center">
                                            <p className="text-[10px] uppercase text-gray-400 font-medium">Growth Rate</p>
                                            <p className="font-semibold text-green-600">+{member.expected_growth}%</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </SectionCard>
                )}
            </div>
        </div>
    );
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function InputGroup({ label, value, onChange, suffix }: { label: string, value: number, onChange: (v: number) => void, suffix: string }) {
    return (
        <div className="relative">
            <Label className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1 block">{label}</Label>
            <div className="relative">
                <Input
                    type="number"
                    value={value}
                    onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
                    className="pr-6 h-9 text-sm font-medium border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">{suffix}</span>
            </div>
        </div>
    );
}

function SectionCard({
    title,
    icon,
    children,
    isExpanded,
    onToggle,
    color = 'indigo'
}: {
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
    isExpanded: boolean;
    onToggle: () => void;
    color?: string;
}) {
    const colorVariants: Record<string, string> = {
        indigo: 'border-t-indigo-500',
        amber: 'border-t-amber-500',
        pink: 'border-t-pink-500',
        blue: 'border-t-blue-500',
    };

    return (
        <Card className={`border-0 shadow-lg overflow-hidden transition-all duration-300 border-t-4 ${colorVariants[color] || 'border-t-gray-500'}`}>
            <div
                className="p-5 cursor-pointer bg-white flex items-center justify-between group hover:bg-slate-50 transition-colors"
                onClick={onToggle}
            >
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-${color}-50 text-${color}-600`}>
                        {icon}
                    </div>
                    <h3 className="font-bold text-slate-800 text-lg">{title}</h3>
                </div>
                <div className="text-gray-400 group-hover:text-gray-600 transition-colors">
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
            </div>
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                    >
                        <CardContent className="p-6 pt-2 bg-white">
                            {children}
                        </CardContent>
                    </motion.div>
                )}
            </AnimatePresence>
        </Card>
    );
}

function MetricBox({ label, value, unit, color = 'gray', highlight = false, fullWidth = false }: { label: string; value: string; unit?: string; color?: string; highlight?: boolean; fullWidth?: boolean }) {
    const colorClasses: Record<string, string> = {
        green: 'bg-emerald-50 text-emerald-700',
        red: 'bg-red-50 text-red-700',
        blue: 'bg-blue-50 text-blue-700',
        orange: 'bg-orange-50 text-orange-700',
        amber: 'bg-amber-50 text-amber-700',
        gray: 'bg-slate-50 text-slate-700',
        primary: 'bg-indigo-50 text-indigo-700'
    };

    return (
        <div className={`p-3 rounded-xl ${colorClasses[color]} ${highlight ? 'ring-2 ring-offset-1 ring-amber-400' : ''} ${fullWidth ? 'col-span-2' : ''}`}>
            <p className="text-[10px] font-bold uppercase opacity-60 tracking-wider mb-1">{label}</p>
            <p className="text-xl font-bold tracking-tight">
                {value} <span className="text-xs font-medium opacity-70">{unit}</span>
            </p>
        </div>
    );
}
