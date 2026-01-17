'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFinancialStore } from '../../store/useFinancialStore';
import {
    TrendingUp, TrendingDown, Target, DollarSign, PiggyBank,
    AlertTriangle, Zap, Award, ArrowRight, FileText
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

export default function SummaryDashboard() {
    const router = useRouter();
    const state = useFinancialStore(state => state);
    const setAnalysisResults = useFinancialStore(state => state.setAnalysisResults);
    const [results, setResults] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchData() {
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
                // Store in Zustand for Report page
                if (setAnalysisResults) {
                    setAnalysisResults(data);
                }
            } catch (err: any) {
                setError(err.message || 'Analysis failed. Is the backend running?');
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

    const getHealthColor = (score: number) => {
        if (score >= 80) return 'text-emerald-500';
        if (score >= 60) return 'text-blue-500';
        if (score >= 40) return 'text-amber-500';
        return 'text-red-500';
    };

    if (loading) {
        return (
            <div className="min-h-[500px] flex flex-col items-center justify-center gap-6 animate-in fade-in p-8">
                <div className="relative">
                    <div className="w-20 h-20 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin" />
                    <Zap className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-600" size={28} />
                </div>
                <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-800 mb-1">Analyzing Your Finances</h3>
                    <p className="text-gray-500 text-sm">Calculating corpus, projections & insights...</p>
                </div>
                <div className="flex gap-2">
                    {['Calculating', 'Projecting', 'Optimizing'].map((text, i) => (
                        <motion.span
                            key={text}
                            initial={{ opacity: 0.3 }}
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.5 }}
                            className="text-xs text-blue-600 bg-blue-50 px-3 py-1 rounded-full"
                        >
                            {text}
                        </motion.span>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <Card className="border-red-200 bg-red-50 m-4">
                <CardContent className="p-8 flex flex-col items-center text-center gap-4">
                    <AlertTriangle className="text-red-500" size={48} />
                    <h3 className="font-bold text-red-700 text-xl">Analysis Error</h3>
                    <p className="text-red-600">{error}</p>
                    <Button variant="outline" onClick={() => window.location.reload()} className="border-red-200 text-red-700 hover:bg-red-100">
                        Try Again
                    </Button>
                </CardContent>
            </Card>
        );
    }

    if (!results) return null;

    const { summary, ai_analysis, retirement, time_metrics } = results;
    const healthScore = ai_analysis?.health_score || 65;

    // Retirement projection data
    const retirementProjection = [
        { year: 'Today', corpus: summary.total_assets - summary.total_liabilities },
        { year: `+5y`, corpus: (summary.total_assets - summary.total_liabilities) * 1.5 },
        { year: `+10y`, corpus: (summary.total_assets - summary.total_liabilities) * 2.2 },
        { year: 'Retire', corpus: summary.projected_corpus },
        { year: 'Target', corpus: retirement.corpus_required },
    ];

    return (
        <div className="space-y-6 pb-8 animate-in slide-in-from-bottom-4 duration-500">

            {/* ========== HERO: Health Score & Key Metrics ========== */}
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6 rounded-2xl shadow-xl">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 left-0 w-64 h-64 bg-blue-500 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
                    <div className="absolute bottom-0 right-0 w-48 h-48 bg-purple-500 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
                </div>

                <div className="relative z-10 grid md:grid-cols-2 gap-6 items-center">
                    {/* Left: Health Score */}
                    <div className="flex items-center gap-6">
                        <div className="relative w-28 h-28">
                            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="10" />
                                <circle
                                    cx="50" cy="50" r="42" fill="none"
                                    stroke={healthScore >= 70 ? '#10B981' : healthScore >= 50 ? '#F59E0B' : '#EF4444'}
                                    strokeWidth="10"
                                    strokeLinecap="round"
                                    strokeDasharray={`${healthScore * 2.64} 264`}
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-3xl font-black">{healthScore}</span>
                                <span className="text-[10px] text-gray-400 uppercase tracking-wider">Score</span>
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <Award className={getHealthColor(healthScore)} size={20} />
                                <span className={`text-lg font-bold ${getHealthColor(healthScore)}`}>
                                    {ai_analysis?.health_status || 'Good'}
                                </span>
                            </div>
                            <h2 className="text-2xl font-bold">Financial Health</h2>
                            <p className="text-gray-400 text-xs mt-1">Based on your complete profile</p>
                        </div>
                    </div>

                    {/* Right: Key Metrics */}
                    <div className="grid grid-cols-2 gap-3">
                        <MetricCard icon={<DollarSign size={18} />} label="Net Worth" value={formatCurrency(summary.net_worth)} positive={summary.net_worth >= 0} />
                        <MetricCard icon={<PiggyBank size={18} />} label="Savings Rate" value={`${summary.savings_rate.toFixed(1)}%`} positive={summary.savings_rate >= 20} />
                        <MetricCard icon={<Target size={18} />} label="Corpus Required" value={formatCurrency(retirement.corpus_required)} highlight />
                        <MetricCard icon={<TrendingUp size={18} />} label="Projected" value={formatCurrency(summary.projected_corpus)} positive={summary.retirement_gap <= 0} />
                    </div>
                </div>
            </div>

            {/* ========== RETIREMENT JOURNEY CHART ========== */}
            <Card className="border-0 shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-4 text-white">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                        🎯 Retirement Journey
                    </h3>
                    <p className="text-amber-100 text-sm">
                        {time_metrics.years_to_retire.toFixed(0)} years to retirement at age {time_metrics.retirement_age}
                    </p>
                </div>
                <CardContent className="p-4">
                    <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={retirementProjection}>
                                <defs>
                                    <linearGradient id="colorCorpus" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="year" fontSize={11} tickLine={false} axisLine={false} />
                                <YAxis tickFormatter={(v) => formatCurrency(v)} fontSize={10} tickLine={false} axisLine={false} width={60} />
                                <Tooltip formatter={(value: any) => formatCurrency(Number(value))} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                <Area type="monotone" dataKey="corpus" stroke="#3B82F6" fill="url(#colorCorpus)" strokeWidth={2} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Gap Summary */}
                    <div className="mt-4 grid grid-cols-3 gap-3">
                        <div className="p-3 rounded-lg bg-blue-50 border border-blue-100 text-center">
                            <p className="text-[10px] text-blue-600 font-medium uppercase">Corpus Needed</p>
                            <p className="text-lg font-bold text-blue-900">{formatCurrency(retirement.corpus_required)}</p>
                        </div>
                        <div className={`p-3 rounded-lg text-center ${summary.retirement_gap > 0 ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'} border`}>
                            <p className={`text-[10px] font-medium uppercase ${summary.retirement_gap > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                {summary.retirement_gap > 0 ? 'Shortfall' : 'Surplus'}
                            </p>
                            <p className={`text-lg font-bold ${summary.retirement_gap > 0 ? 'text-red-900' : 'text-green-900'}`}>
                                {formatCurrency(Math.abs(summary.retirement_gap))}
                            </p>
                        </div>
                        <div className="p-3 rounded-lg bg-purple-50 border border-purple-100 text-center">
                            <p className="text-[10px] text-purple-600 font-medium uppercase">Extra SIP Req.</p>
                            <p className="text-lg font-bold text-purple-900">{formatCurrency(summary.extra_sip_required)}/mo</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* ========== VIEW AI REPORT CTA ========== */}
            <Card className="border-0 shadow-xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white overflow-hidden">
                <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/20 rounded-xl">
                            <FileText size={28} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold">AI-Powered Insights Ready</h3>
                            <p className="text-white/80 text-sm">View detailed recommendations, what-if scenarios & actionable advice</p>
                        </div>
                    </div>
                    <Button
                        onClick={() => router.push('/app/report')}
                        className="bg-white text-indigo-700 hover:bg-gray-100 font-semibold px-6 py-3 h-auto shadow-lg"
                    >
                        View AI Report <ArrowRight className="ml-2" size={18} />
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}

// --- Helper Component ---
function MetricCard({ icon, label, value, positive = true, highlight = false }: {
    icon: React.ReactNode;
    label: string;
    value: string;
    positive?: boolean;
    highlight?: boolean;
}) {
    return (
        <div className={`p-3 rounded-lg border ${highlight ? 'bg-gradient-to-br from-amber-500/20 to-orange-500/20 border-amber-500/30' : 'bg-white/5 border-white/10'}`}>
            <div className="flex items-center justify-between mb-1">
                <span className="text-gray-400">{icon}</span>
                {!highlight && (
                    <span className={`text-xs px-1.5 py-0.5 rounded ${positive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                        {positive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    </span>
                )}
            </div>
            <p className="text-[10px] text-gray-400 uppercase">{label}</p>
            <p className={`text-base font-bold ${highlight ? 'text-amber-300' : 'text-white'}`}>{value}</p>
        </div>
    );
}
