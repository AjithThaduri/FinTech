'use client';
import { useEffect, useState, useRef } from 'react';
import { useFinancialStore } from '../../../store/useFinancialStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
    Download, Share2, FileText, TrendingUp, TrendingDown, AlertTriangle,
    CheckCircle, Lightbulb, Target, DollarSign, PiggyBank, Shield,
    ArrowRight, Sparkles, Calculator, Zap
} from 'lucide-react';
import {
    PieChart, Pie, Cell, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    AreaChart, Area
} from 'recharts';
import { motion } from 'framer-motion';
import jsPDF from 'jspdf';

// Use inline hex colors to avoid html2canvas "lab" color parsing issue
const COLORS = {
    primary: '#3B82F6',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    purple: '#8B5CF6',
    pink: '#EC4899',
    indigo: '#6366F1',
    teal: '#14B8A6',
    slate900: '#0f172a',
    slate800: '#1e293b',
    amber500: '#f59e0b',
    orange500: '#f97316'
};

const PIE_COLORS = ['#EF4444', '#F97316', '#8B5CF6', '#3B82F6', '#10B981'];

export default function ReportPage() {
    const reportRef = useRef<HTMLDivElement>(null);
    const state = useFinancialStore(state => state);
    const cachedResults = useFinancialStore(state => state.analysisResults);
    const setAnalysisResults = useFinancialStore(state => state.setAnalysisResults);

    const [results, setResults] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [downloading, setDownloading] = useState(false);

    useEffect(() => {
        async function fetchData() {
            if (cachedResults) {
                setResults(cachedResults);
                setLoading(false);
                return;
            }

            try {
                state.recalculateLinkedValues();
                const payload = state.getPayload();

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
                setAnalysisResults(data);
            } catch (err: any) {
                setError(err.message || 'Failed to generate report');
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    const formatCurrency = (value: number) => {
        if (Math.abs(value) >= 10000000) return `₹${(value / 10000000).toFixed(2)} Cr`;
        if (Math.abs(value) >= 100000) return `₹${(value / 100000).toFixed(2)} L`;
        return `₹${value.toLocaleString('en-IN')}`;
    };

    const handleDownloadPDF = async () => {
        if (!results) return;

        setDownloading(true);
        try {
            // Extract data from results
            const { summary, ai_analysis, retirement, goals, time_metrics } = results;
            const healthScore = ai_analysis?.health_score || 65;
            const yearsToRetire = time_metrics?.years_to_retire || 25;
            const extraSipMonthly = summary.extra_sip_required || 0;

            const pdf = new jsPDF('p', 'mm', 'a4');
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const margin = 15;
            let y = margin;

            // Helper functions
            const addText = (text: string, x: number, yPos: number, size: number, style: 'normal' | 'bold' = 'normal', color: string = '#000000') => {
                pdf.setFontSize(size);
                pdf.setFont('helvetica', style);
                const rgb = hexToRgb(color);
                pdf.setTextColor(rgb.r, rgb.g, rgb.b);
                pdf.text(text, x, yPos);
            };

            const hexToRgb = (hex: string) => {
                const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
                return result ? {
                    r: parseInt(result[1], 16),
                    g: parseInt(result[2], 16),
                    b: parseInt(result[3], 16)
                } : { r: 0, g: 0, b: 0 };
            };

            const addLine = () => {
                pdf.setDrawColor(200, 200, 200);
                pdf.line(margin, y, pageWidth - margin, y);
                y += 5;
            };

            const checkNewPage = (neededSpace: number) => {
                if (y + neededSpace > pageHeight - margin) {
                    pdf.addPage();
                    y = margin;
                    return true;
                }
                return false;
            };

            // ===== HEADER =====
            pdf.setFillColor(15, 23, 42); // slate-900
            pdf.rect(0, 0, pageWidth, 45, 'F');

            addText('Financial Health Report', margin, 20, 22, 'bold', '#ffffff');
            addText(`Generated by FinPlan AI • ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`, margin, 30, 10, 'normal', '#94a3b8');

            // Health Score Circle
            const scoreX = pageWidth - 35;
            pdf.setFillColor(healthScore >= 70 ? 16 : healthScore >= 50 ? 245 : 239, healthScore >= 70 ? 185 : healthScore >= 50 ? 158 : 68, healthScore >= 70 ? 129 : healthScore >= 50 ? 11 : 68);
            pdf.circle(scoreX, 22, 12, 'F');
            addText(healthScore.toString(), scoreX - 5, 25, 14, 'bold', '#ffffff');
            addText('/100', scoreX - 3, 32, 8, 'normal', '#ffffff');

            y = 55;

            // ===== KEY METRICS =====
            addText('Key Financial Metrics', margin, y, 14, 'bold', '#1e293b');
            y += 10;

            const metrics = [
                { label: 'Net Worth', value: formatCurrency(summary.net_worth) },
                { label: 'Savings Rate', value: `${(summary.savings_rate || 0).toFixed(1)}%` },
                { label: 'EMI Burden', value: `${(summary.emi_burden || 0).toFixed(1)}%` },
                { label: 'Years to Retire', value: `${(yearsToRetire || 0).toFixed(0)} years` },
            ];

            const colWidth = (pageWidth - 2 * margin) / 4;
            metrics.forEach((m, i) => {
                const x = margin + i * colWidth;
                pdf.setFillColor(248, 250, 252);
                pdf.roundedRect(x, y, colWidth - 5, 20, 2, 2, 'F');
                addText(m.label, x + 3, y + 7, 8, 'normal', '#64748b');
                addText(m.value, x + 3, y + 15, 11, 'bold', '#0f172a');
            });
            y += 30;

            addLine();

            // ===== EXECUTIVE SUMMARY =====
            addText('Executive Summary', margin, y, 14, 'bold', '#1e293b');
            y += 8;

            const summaryText = ai_analysis?.executive_summary || ai_analysis?.summary ||
                `Based on your financial data, you have a net worth of ${formatCurrency(summary.net_worth)} with a savings rate of ${(summary.savings_rate || 0).toFixed(1)}%. Your retirement corpus requirement is ${formatCurrency(retirement.corpus_required)}.`;

            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(71, 85, 105);
            const splitSummary = pdf.splitTextToSize(summaryText, pageWidth - 2 * margin);
            pdf.text(splitSummary, margin, y);
            y += splitSummary.length * 5 + 10;

            addLine();

            // ===== RETIREMENT ANALYSIS =====
            checkNewPage(60);
            addText('Retirement Analysis', margin, y, 14, 'bold', '#1e293b');
            y += 10;

            const retirementData = [
                { label: 'Corpus Required', value: formatCurrency(retirement.corpus_required), color: '#f59e0b' },
                { label: 'Projected Corpus', value: formatCurrency(summary.projected_corpus), color: '#3b82f6' },
                { label: summary.retirement_gap > 0 ? 'Shortfall' : 'Surplus', value: formatCurrency(Math.abs(summary.retirement_gap)), color: summary.retirement_gap > 0 ? '#ef4444' : '#10b981' },
                { label: 'Extra SIP Required', value: `${formatCurrency(extraSipMonthly)}/mo`, color: '#8b5cf6' },
            ];

            const retColWidth = (pageWidth - 2 * margin) / 4;
            retirementData.forEach((item, i) => {
                const x = margin + i * retColWidth;
                const rgb = hexToRgb(item.color);
                pdf.setFillColor(rgb.r, rgb.g, rgb.b);
                pdf.roundedRect(x, y, retColWidth - 5, 25, 2, 2, 'F');
                addText(item.label, x + 3, y + 8, 8, 'normal', '#ffffff');
                addText(item.value, x + 3, y + 18, 10, 'bold', '#ffffff');
            });
            y += 35;

            addLine();

            // ===== GOALS =====
            if (goals && goals.length > 0) {
                checkNewPage(50);
                addText('Financial Goals', margin, y, 14, 'bold', '#1e293b');
                y += 10;

                goals.slice(0, 5).forEach((goal: any, i: number) => {
                    checkNewPage(15);
                    pdf.setFillColor(248, 250, 252);
                    pdf.roundedRect(margin, y, pageWidth - 2 * margin, 12, 2, 2, 'F');
                    addText(`${i + 1}. ${goal.name}`, margin + 3, y + 8, 10, 'bold', '#1e293b');
                    addText(`Current: ${formatCurrency(goal.current_cost)}`, pageWidth / 2, y + 8, 9, 'normal', '#3b82f6');
                    addText(`Future: ${formatCurrency(goal.future_cost)}`, pageWidth - 60, y + 8, 9, 'normal', '#ec4899');
                    y += 15;
                });
                y += 5;
                addLine();
            }

            // ===== AI RECOMMENDATIONS =====
            checkNewPage(70);
            pdf.setFillColor(15, 23, 42);
            pdf.roundedRect(margin, y, pageWidth - 2 * margin, 8, 2, 2, 'F');
            addText('AI-Powered Recommendations', margin + 5, y + 6, 12, 'bold', '#ffffff');
            y += 15;

            const recommendations = [
                { title: 'Increase SIP by ₹5,000/month', impact: `Reach retirement corpus ${Math.round(extraSipMonthly > 5000 ? 3 : 5)} years earlier` },
                { title: 'Reduce lifestyle expenses by 10%', impact: 'Add more to investments monthly' },
                { title: 'Prepay ₹1 Lakh on home loan annually', impact: 'Save ₹8-12 Lakhs in interest' },
            ];

            recommendations.forEach((rec, i) => {
                checkNewPage(20);
                const colors = ['#3b82f6', '#f59e0b', '#10b981'];
                const rgb = hexToRgb(colors[i]);
                pdf.setFillColor(rgb.r, rgb.g, rgb.b);
                pdf.circle(margin + 5, y + 3, 3, 'F');
                addText((i + 1).toString(), margin + 4, y + 5, 8, 'bold', '#ffffff');
                addText(rec.title, margin + 12, y + 5, 10, 'bold', '#1e293b');
                addText(rec.impact, margin + 12, y + 12, 9, 'normal', '#64748b');
                y += 18;
            });

            // ===== FOOTER =====
            y = pageHeight - 15;
            pdf.setDrawColor(200, 200, 200);
            pdf.line(margin, y - 5, pageWidth - margin, y - 5);
            addText('This report is AI-generated and for informational purposes only. Consult a financial advisor for professional advice.', margin, y, 7, 'normal', '#94a3b8');

            // Save PDF
            pdf.save(`FinPlan_Report_${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (err) {
            console.error('PDF generation failed:', err);
            alert('Failed to generate PDF. Please try again.');
        } finally {
            setDownloading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-[600px] flex flex-col items-center justify-center gap-6 p-8">
                <div className="relative">
                    <div className="w-20 h-20 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin" />
                    <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-600" size={28} />
                </div>
                <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-800">Generating AI Report</h3>
                    <p className="text-gray-500 text-sm">Analyzing your financial data...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <Card className="border-red-200 bg-red-50 m-8">
                <CardContent className="p-8 flex flex-col items-center text-center gap-4">
                    <AlertTriangle className="text-red-500" size={48} />
                    <h3 className="font-bold text-red-700 text-xl">Report Generation Failed</h3>
                    <p className="text-red-600">{error}</p>
                    <Button variant="outline" onClick={() => window.location.reload()} className="border-red-200 text-red-700 hover:bg-red-100">
                        Try Again
                    </Button>
                </CardContent>
            </Card>
        );
    }

    if (!results) return null;

    const { summary, ai_analysis, retirement, goals, time_metrics } = results;
    const healthScore = ai_analysis?.health_score || 65;

    // Chart data preparation
    const expenseData = [
        { name: 'Essential', value: summary.essential_expense_percent || 40, fill: COLORS.danger },
        { name: 'Lifestyle', value: summary.lifestyle_expense_percent || 20, fill: COLORS.warning },
        { name: 'EMI', value: summary.emi_burden || 15, fill: COLORS.purple },
        { name: 'Invest', value: summary.investment_rate || 15, fill: COLORS.primary },
        { name: 'Savings', value: summary.savings_rate || 10, fill: COLORS.success },
    ].filter(d => d.value > 0);

    const retirementProjection = [
        { year: 'Now', corpus: summary.net_worth || 0 },
        { year: '+5y', corpus: (summary.net_worth || 0) * 1.6 },
        { year: '+10y', corpus: (summary.net_worth || 0) * 2.5 },
        { year: '+15y', corpus: summary.projected_corpus * 0.7 },
        { year: 'Retire', corpus: summary.projected_corpus },
        { year: 'Target', corpus: retirement.corpus_required },
    ];

    const goalData = goals?.map((g: any) => ({
        name: g.name.length > 15 ? g.name.substring(0, 15) + '...' : g.name,
        current: g.current_cost,
        future: g.future_cost,
    })) || [];

    const assetLiabilityData = [
        { name: 'Assets', value: summary.total_assets, fill: COLORS.success },
        { name: 'Liabilities', value: summary.total_liabilities, fill: COLORS.danger },
    ];

    const extraSipMonthly = summary.extra_sip_required || 0;
    const yearsToRetire = time_metrics?.years_to_retire || 25;

    return (
        <div className="space-y-8 pb-12">
            {/* Header with Actions */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Financial Health Report</h1>
                    <p className="text-gray-500 mt-1">Generated by FinPlan AI • {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline"><Share2 className="mr-2 w-4 h-4" /> Share</Button>
                    <Button onClick={handleDownloadPDF} disabled={downloading}>
                        {downloading ? (
                            <><span className="animate-spin mr-2">⏳</span> Generating...</>
                        ) : (
                            <><Download className="mr-2 w-4 h-4" /> Download PDF</>
                        )}
                    </Button>
                </div>
            </div>

            {/* Report Content - For PDF Export - Using inline styles to avoid lab() color issue */}
            <div ref={reportRef} className="space-y-8 bg-white p-6 rounded-xl" style={{ backgroundColor: '#ffffff' }}>

                {/* Health Score Hero - Using inline gradient */}
                <div
                    className="text-white p-8 rounded-2xl"
                    style={{ background: `linear-gradient(135deg, ${COLORS.slate900} 0%, ${COLORS.slate800} 50%, ${COLORS.slate900} 100%)` }}
                >
                    <div className="grid md:grid-cols-2 gap-8 items-center">
                        <div className="flex items-center gap-6">
                            <div className="relative w-32 h-32">
                                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                                    <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="10" />
                                    <circle
                                        cx="50" cy="50" r="42" fill="none"
                                        stroke={healthScore >= 70 ? COLORS.success : healthScore >= 50 ? COLORS.warning : COLORS.danger}
                                        strokeWidth="10"
                                        strokeLinecap="round"
                                        strokeDasharray={`${healthScore * 2.64} 264`}
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-4xl font-black">{healthScore}</span>
                                    <span className="text-xs text-gray-400">out of 100</span>
                                </div>
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold">Financial Health Score</h2>
                                <p style={{ color: healthScore >= 70 ? COLORS.success : healthScore >= 50 ? COLORS.warning : COLORS.danger }} className="text-lg font-semibold">
                                    {ai_analysis?.health_status || 'Good'}
                                </p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <MetricCard label="Net Worth" value={formatCurrency(summary.net_worth)} icon={<DollarSign size={18} />} />
                            <MetricCard label="Savings Rate" value={`${summary.savings_rate?.toFixed(1) || 0}%`} icon={<PiggyBank size={18} />} />
                            <MetricCard label="EMI Burden" value={`${summary.emi_burden?.toFixed(1) || 0}%`} icon={<Calculator size={18} />} />
                            <MetricCard label="Years to Retire" value={`${yearsToRetire.toFixed(0)} yrs`} icon={<Target size={18} />} />
                        </div>
                    </div>
                </div>

                {/* Executive Summary */}
                <div className="p-6 rounded-xl border" style={{ backgroundColor: '#eef2ff', borderColor: '#c7d2fe' }}>
                    <h3 className="flex items-center gap-2 text-lg font-bold mb-4" style={{ color: '#312e81' }}>
                        <FileText className="w-5 h-5" /> Executive Summary
                    </h3>
                    <p className="text-gray-700 leading-relaxed">
                        {ai_analysis?.executive_summary || ai_analysis?.summary || `Based on your financial data, you have a net worth of ${formatCurrency(summary.net_worth)} with a savings rate of ${summary.savings_rate?.toFixed(1)}%. Your retirement corpus requirement is ${formatCurrency(retirement.corpus_required)}.`}
                    </p>
                </div>

                {/* Charts Grid */}
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Expense Distribution */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Income Distribution</CardTitle>
                            <CardDescription>How your monthly income is allocated</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[280px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={expenseData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={80}
                                        paddingAngle={3}
                                        dataKey="value"
                                    >
                                        {expenseData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value: any) => `${Number(value).toFixed(1)}%`} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Assets vs Liabilities */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Assets vs Liabilities</CardTitle>
                            <CardDescription>Your financial position snapshot</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[280px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={assetLiabilityData} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                    <XAxis type="number" tickFormatter={(v) => formatCurrency(v)} fontSize={11} />
                                    <YAxis type="category" dataKey="name" width={80} fontSize={12} />
                                    <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
                                    <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                                        {assetLiabilityData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>

                {/* Retirement Roadmap */}
                <Card>
                    <div className="p-4 text-white rounded-t-lg" style={{ background: `linear-gradient(90deg, ${COLORS.amber500} 0%, ${COLORS.orange500} 100%)` }}>
                        <h3 className="text-xl font-bold">🎯 Retirement Roadmap</h3>
                        <p style={{ color: 'rgba(255,255,255,0.8)' }} className="text-sm">
                            Corpus Required: {formatCurrency(retirement.corpus_required)} by age {time_metrics?.retirement_age || 60}
                        </p>
                    </div>
                    <CardContent className="pt-6">
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={retirementProjection}>
                                    <defs>
                                        <linearGradient id="colorCorpus2" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.4} />
                                            <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="year" fontSize={12} />
                                    <YAxis tickFormatter={(v) => formatCurrency(v)} fontSize={11} width={70} />
                                    <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
                                    <Area type="monotone" dataKey="corpus" stroke={COLORS.primary} fill="url(#colorCorpus2)" strokeWidth={3} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Gap Analysis */}
                        <div className="mt-6 grid md:grid-cols-3 gap-4">
                            <div className="p-4 rounded-xl text-center" style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe' }}>
                                <p className="text-xs font-medium uppercase" style={{ color: COLORS.primary }}>Projected Corpus</p>
                                <p className="text-2xl font-bold mt-1" style={{ color: '#1e3a8a' }}>{formatCurrency(summary.projected_corpus)}</p>
                            </div>
                            <div className="p-4 rounded-xl text-center" style={{
                                backgroundColor: summary.retirement_gap > 0 ? '#fef2f2' : '#f0fdf4',
                                border: `1px solid ${summary.retirement_gap > 0 ? '#fecaca' : '#bbf7d0'}`
                            }}>
                                <p className="text-xs font-medium uppercase" style={{ color: summary.retirement_gap > 0 ? COLORS.danger : COLORS.success }}>
                                    {summary.retirement_gap > 0 ? 'Shortfall' : 'Surplus'}
                                </p>
                                <p className="text-2xl font-bold mt-1" style={{ color: summary.retirement_gap > 0 ? '#7f1d1d' : '#14532d' }}>
                                    {formatCurrency(Math.abs(summary.retirement_gap))}
                                </p>
                            </div>
                            <div className="p-4 rounded-xl text-center" style={{ backgroundColor: '#faf5ff', border: '1px solid #e9d5ff' }}>
                                <p className="text-xs font-medium uppercase" style={{ color: COLORS.purple }}>Extra SIP Needed</p>
                                <p className="text-2xl font-bold mt-1" style={{ color: '#581c87' }}>{formatCurrency(extraSipMonthly)}/mo</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Goals Progress */}
                {goalData.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Target size={20} /> Goal Analysis</CardTitle>
                            <CardDescription>Current cost vs Inflation-adjusted future cost</CardDescription>
                        </CardHeader>
                        <CardContent className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={goalData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" fontSize={11} />
                                    <YAxis tickFormatter={(v) => formatCurrency(v)} fontSize={11} width={70} />
                                    <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
                                    <Legend />
                                    <Bar dataKey="current" name="Current Cost" fill={COLORS.primary} radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="future" name="Future Cost" fill={COLORS.pink} radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                )}

                {/* AI Recommendations */}
                <div
                    className="text-white overflow-hidden rounded-xl"
                    style={{ background: `linear-gradient(135deg, ${COLORS.slate900} 0%, ${COLORS.slate800} 50%, ${COLORS.slate900} 100%)` }}
                >
                    <div className="p-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                        <h3 className="flex items-center gap-3 text-xl font-bold">
                            <div className="p-2 rounded-lg" style={{ background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.indigo} 100%)` }}>
                                <Zap size={20} />
                            </div>
                            <span>AI-Powered Recommendations</span>
                            <span className="text-xs px-2 py-1 rounded-full ml-auto" style={{ backgroundColor: 'rgba(59,130,246,0.2)', color: '#93c5fd' }}>GPT-4</span>
                        </h3>
                    </div>
                    <div className="p-6 space-y-6">
                        {/* What-If Scenarios */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-semibold flex items-center gap-2" style={{ color: '#c4b5fd' }}>
                                <Lightbulb size={16} /> What-If Scenarios
                            </h4>

                            <InsightCard
                                type="opportunity"
                                title="If you increase SIP by ₹5,000/month"
                                impact={`You could reach your retirement corpus ${Math.round(extraSipMonthly > 5000 ? 3 : 5)} years earlier and have an additional ${formatCurrency(5000 * 12 * yearsToRetire * 1.12)} at retirement.`}
                            />

                            <InsightCard
                                type="warning"
                                title="If you reduce lifestyle expenses by 10%"
                                impact={`You could add ${formatCurrency((summary.total_inflow || 100000) * 0.1 * 0.1)} more to investments monthly, closing the retirement gap faster.`}
                            />

                            <InsightCard
                                type="success"
                                title="If you prepay ₹1 Lakh on home loan annually"
                                impact="You could save approximately ₹8-12 Lakhs in interest and become debt-free 4 years earlier."
                            />
                        </div>

                        {/* Action Items */}
                        {ai_analysis?.recommendations && (
                            <div className="space-y-4">
                                <h4 className="text-sm font-semibold flex items-center gap-2" style={{ color: '#93c5fd' }}>
                                    <CheckCircle size={16} /> Priority Action Items
                                </h4>
                                <div className="space-y-3">
                                    {ai_analysis.recommendations.slice(0, 4).map((rec: any, i: number) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.1 }}
                                            className="flex items-start gap-4 p-4 rounded-lg"
                                            style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                                        >
                                            <div
                                                className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                                                style={{ backgroundColor: i === 0 ? COLORS.danger : i === 1 ? COLORS.warning : COLORS.primary }}
                                            >
                                                {i + 1}
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-white font-medium text-sm">{rec.action || rec}</p>
                                                {rec.impact && <p className="text-gray-400 text-xs mt-1">{rec.impact}</p>}
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Long Term Strategy */}
                        {ai_analysis?.long_term_strategy && (
                            <div className="rounded-xl p-5" style={{ background: 'linear-gradient(90deg, rgba(59,130,246,0.1) 0%, rgba(139,92,246,0.1) 100%)', border: '1px solid rgba(59,130,246,0.2)' }}>
                                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: '#93c5fd' }}>
                                    <TrendingUp size={16} /> Long-Term Strategy
                                </h4>
                                <p className="text-gray-300 text-sm leading-relaxed">{ai_analysis.long_term_strategy}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Disclaimer */}
                <div className="text-center p-4 rounded-lg" style={{ backgroundColor: '#f9fafb' }}>
                    <p className="text-xs text-gray-500 max-w-2xl mx-auto">
                        <Shield size={12} className="inline mr-1" />
                        This report is generated by AI based on the data provided. It is for informational purposes only
                        and should not be considered as professional financial advice. Please consult a certified financial
                        advisor before making any investment decisions.
                    </p>
                </div>
            </div>
        </div>
    );
}

// --- Helper Components ---
function MetricCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
    return (
        <div className="rounded-lg p-3" style={{ backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="flex items-center gap-2 text-gray-400 mb-1">{icon}<span className="text-xs">{label}</span></div>
            <p className="text-lg font-bold text-white">{value}</p>
        </div>
    );
}

function InsightCard({ type, title, impact }: { type: 'opportunity' | 'warning' | 'success'; title: string; impact: string }) {
    const styles = {
        opportunity: { bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.2)', icon: <Lightbulb style={{ color: '#60a5fa' }} size={18} />, titleColor: '#93c5fd' },
        warning: { bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)', icon: <AlertTriangle style={{ color: '#fbbf24' }} size={18} />, titleColor: '#fcd34d' },
        success: { bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.2)', icon: <CheckCircle style={{ color: '#34d399' }} size={18} />, titleColor: '#6ee7b7' },
    };
    const s = styles[type];

    return (
        <div className="rounded-lg p-4" style={{ backgroundColor: s.bg, border: `1px solid ${s.border}` }}>
            <div className="flex items-start gap-3">
                {s.icon}
                <div>
                    <h5 className="font-medium text-sm" style={{ color: s.titleColor }}>{title}</h5>
                    <p className="text-gray-400 text-xs mt-1">{impact}</p>
                </div>
            </div>
        </div>
    );
}
