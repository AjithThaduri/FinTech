'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
    Calculator,
    ArrowLeft,
    Play,
    RotateCcw,
    FileText,
    Activity,
    ChevronDown,
    ChevronRight,
    Info,
    CheckCircle2,
    Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CalculatorDefinition, CalculatorExecutionResult } from '@/types/calculator';
import { FormattedNumberInput } from '@/components/ui/formatted-input';

export default function CalculatorExecutionPage() {
    const params = useParams();
    const router = useRouter();
    const calculatorId = params.id as string;

    const [definition, setDefinition] = useState<CalculatorDefinition | null>(null);
    const [inputs, setInputs] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState(true);
    const [calculating, setCalculating] = useState(false);
    const [result, setResult] = useState<CalculatorExecutionResult | null>(null);
    const [explanation, setExplanation] = useState<string | null>(null);
    const [showTrace, setShowTrace] = useState(false);

    useEffect(() => {
        const fetchCalculator = async () => {
            try {
                const res = await fetch(`http://localhost:8000/api/calculators/${calculatorId}`);
                if (!res.ok) throw new Error('Failed to fetch');
                const data = await res.json();

                if (data.definition) {
                    const def = JSON.parse(data.definition);
                    setDefinition(def);

                    // Initialize default inputs
                    const defaultInputs: Record<string, any> = {};
                    def.inputs.forEach((inp: any) => {
                        if (inp.default !== undefined && inp.default !== null) {
                            defaultInputs[inp.key] = inp.default;
                        }
                    });
                    setInputs(defaultInputs);
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        if (calculatorId) {
            fetchCalculator();
        }
    }, [calculatorId]);

    const handleCalculate = async () => {
        setCalculating(true);
        setResult(null);
        setExplanation(null);

        try {
            const res = await fetch(`http://localhost:8000/api/calculators/${calculatorId}/execute-with-explanation`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ inputs })
            });

            const data = await res.json();
            if (data.result && data.result.success) {
                setResult(data.result);
                setExplanation(data.explanation);
            } else {
                alert('Calculation failed: ' + (data.error || 'Unknown error'));
            }
        } catch (error) {
            console.error(error);
            alert('Failed to execute calculation');
        } finally {
            setCalculating(false);
        }
    };

    const handleInputChange = (key: string, value: any) => {
        setInputs(prev => ({ ...prev, [key]: value }));
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!definition) {
        return (
            <div className="p-8 text-center">
                <h1 className="text-xl font-bold">Calculator not found</h1>
                <Button onClick={() => router.push('/app/calculators')} className="mt-4">
                    Back to Calculators
                </Button>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-6">
            <Button variant="ghost" onClick={() => router.push('/app/calculators')} className="pl-0 hover:pl-2 transition-all">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Left: Input Form */}
                <Card className="flex-1 h-fit shadow-md border-gray-200">
                    <CardHeader className="bg-gray-50 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg bg-blue-100 text-blue-600`}>
                                <Calculator className="w-5 h-5" />
                            </div>
                            <div>
                                <CardTitle>{definition.name}</CardTitle>
                                <CardDescription>{definition.description}</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                        <div className="grid gap-5">
                            {definition.inputs.map((inp) => (
                                <div key={inp.key} className="space-y-2">
                                    <Label htmlFor={inp.key} className="text-sm font-medium text-gray-700 flex items-center justify-between">
                                        {inp.label}
                                        {inp.help_text && (
                                            <div className="group relative">
                                                <Info size={14} className="text-gray-400 cursor-help" />
                                                <div className="absolute right-0 bottom-6 w-48 p-2 bg-gray-800 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                                    {inp.help_text}
                                                </div>
                                            </div>
                                        )}
                                    </Label>

                                    {inp.type === 'select' && inp.options ? (
                                        <Select
                                            value={inputs[inp.key]?.toString()}
                                            onValueChange={(val) => handleInputChange(inp.key, val)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {inp.options.map(opt => (
                                                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        inp.type === 'number' ? (
                                            <FormattedNumberInput
                                                id={inp.key}
                                                value={inputs[inp.key]}
                                                onChange={(val: any) => handleInputChange(inp.key, val)}
                                                placeholder={`Enter ${inp.label}`}
                                                className="focus:ring-blue-100"
                                            />
                                        ) : (
                                            <Input
                                                id={inp.key}
                                                type="text"
                                                value={inputs[inp.key] || ''}
                                                onChange={(e) => handleInputChange(inp.key, e.target.value)}
                                                placeholder={`Enter ${inp.label}`}
                                                className="focus:ring-blue-100"
                                            />
                                        )
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="pt-4 flex gap-3">
                            <Button
                                onClick={handleCalculate}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 h-11 text-base shadow-lg shadow-blue-200"
                                disabled={calculating}
                            >
                                {calculating ? (
                                    <>Calculating...</>
                                ) : (
                                    <><Play className="w-4 h-4 mr-2 fill-current" /> Calculate</>
                                )}
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => setInputs({})}
                                disabled={calculating}
                            >
                                <RotateCcw className="w-4 h-4" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Right: Results */}
                <div className="flex-1 space-y-6">
                    {/* Main Result Card */}
                    <AnimatePresence mode="wait">
                        {result ? (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="space-y-6"
                            >
                                <Card className="border-blue-100 bg-white shadow-lg overflow-hidden">
                                    <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
                                        <CardTitle className="text-lg font-medium opacity-90">Result</CardTitle>
                                        <div className="mt-2 text-4xl font-bold tracking-tight">
                                            {/* Heuristic: Display the last output or the one containing 'total' or 'result' */}
                                            {(() => {
                                                const keys = Object.keys(result.outputs);
                                                const mainKey = keys.find(k => k.includes('total') || k.includes('result') || k.includes('emi') || k.includes('tax')) || keys[keys.length - 1];
                                                const value = result.outputs[mainKey];
                                                return typeof value === 'number'
                                                    ? `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
                                                    : value;
                                            })()}
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        {/* Detailed Outputs */}
                                        <div className="p-6 grid grid-cols-2 gap-4 bg-blue-50/30">
                                            {Object.entries(result.outputs).map(([key, val]) => (
                                                <div key={key} className="p-3 bg-white rounded-lg border border-blue-50 shadow-sm">
                                                    <div className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">
                                                        {key.replace(/_/g, ' ')}
                                                    </div>
                                                    <div className="text-lg font-semibold text-gray-900">
                                                        {typeof val === 'number' ? val.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : val}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* AI Explanation */}
                                {explanation && (
                                    <Card className="border-purple-100 bg-purple-50/30">
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-purple-900 flex items-center gap-2">
                                                <Sparkles className="w-5 h-5 text-purple-600" />
                                                AI Smart Analysis
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-gray-700 leading-relaxed whitespace-pre-wrap text-sm">
                                                {explanation}
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Calculation Trace */}
                                <div className="border rounded-xl bg-white overflow-hidden">
                                    <button
                                        onClick={() => setShowTrace(!showTrace)}
                                        className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors text-sm font-medium text-gray-600"
                                    >
                                        <span className="flex items-center gap-2">
                                            <Activity size={16} /> View Calculation Details
                                        </span>
                                        {showTrace ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                    </button>

                                    <AnimatePresence>
                                        {showTrace && (
                                            <motion.div
                                                initial={{ height: 0 }}
                                                animate={{ height: 'auto' }}
                                                exit={{ height: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="p-4 space-y-3 bg-slate-50 border-t border-gray-100 text-xs font-mono">
                                                    {result.steps.map((step, idx) => (
                                                        <div key={idx} className="flex gap-4 p-2 hover:bg-white rounded transition-colors">
                                                            <div className="text-gray-400 w-6">{idx + 1}</div>
                                                            <div className="flex-1">
                                                                <div className="font-bold text-gray-700">{step.step_id}</div>
                                                                <div className="text-gray-500 truncate mt-0.5">{step.expression || step.rule_engine || step.description || 'Calculation'}</div>
                                                            </div>
                                                            <div className="text-right font-medium text-blue-600">
                                                                {typeof step.result === 'number' ? step.result.toFixed(2) : step.result}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </motion.div>
                        ) : (
                            <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                                <div className="p-4 bg-white rounded-full shadow-sm mb-4">
                                    <Activity className="w-8 h-8 text-gray-300" />
                                </div>
                                <p className="font-medium">Enter details and calculate to see results</p>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
