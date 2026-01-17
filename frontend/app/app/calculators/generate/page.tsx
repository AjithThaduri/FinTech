'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Send,
    Sparkles,
    Bot,
    User,
    AlertTriangle,
    CheckCircle,
    Loader2,
    ArrowLeft,
    Calculator as CalculatorIcon,
    Save,
    Play
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CalculatorDefinition } from '@/types/calculator';

interface Message {
    role: 'assistant' | 'user';
    content: string;
    timestamp?: string;
}

export default function CalculatorGeneratorPage() {
    const router = useRouter();
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [draftCalculator, setDraftCalculator] = useState<CalculatorDefinition | null>(null);
    const [validationErrors, setValidationErrors] = useState<string[]>([]);
    const [currentState, setCurrentState] = useState<string>('INIT');
    const scrollRef = useRef<HTMLDivElement>(null);

    // Initial greeting
    useEffect(() => {
        if (messages.length === 0) {
            setMessages([{
                role: 'assistant',
                content: "Hi! I'm your AI Calculator Architect. Tell me what kind of financial calculator you want to build. \n\nFor example: 'I want a Home Loan Affordability calculator based on Indian tax rules' or 'Build a Crypto SIP calculator'."
            }]);
        }
    }, []);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, loading]);

    const handleSendMessage = async () => {
        if (!inputValue.trim()) return;

        const userMsg = inputValue;
        setInputValue('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setLoading(true);

        try {
            let data;
            if (!conversationId) {
                // Start new conversation
                const res = await fetch('http://localhost:8000/api/calculators/generate/start', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ description: userMsg, jurisdiction: "India" })
                });
                data = await res.json();
                setConversationId(data.conversation_id);
            } else {
                // Continue conversation
                const res = await fetch('http://localhost:8000/api/calculators/generate/continue', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        conversation_id: conversationId,
                        user_message: userMsg
                    })
                });
                data = await res.json();
            }

            // Update state from response
            if (data.messages && data.messages.length > 0) {
                const newMsgs = data.messages.filter((m: any) =>
                    // Filter out old messages to avoid duplicates if we were appending manually
                    // Actually, the API returns full history or latest?
                    // Based on my implementation it returns ALL messages.
                    // Let's just use the returned messages fully to be safe/sync.
                    true
                ).map((m: any) => ({
                    role: m.role,
                    content: m.content
                }));
                // We'll trust the backend history
                setMessages(newMsgs);
            }

            if (data.draft_calculator) {
                setDraftCalculator(data.draft_calculator);
            }

            if (data.validation_errors) {
                setValidationErrors(data.validation_errors);
            } else {
                setValidationErrors([]);
            }

            setCurrentState(data.state);

            // Handle success/completion
            if (data.is_complete) {
                // Maybe auto-redirect or show a "Done" button
            }

        } catch (error) {
            console.error('Error:', error);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: "I'm sorry, I encountered an error communicating with the server. Please try again."
            }]);
        } finally {
            setLoading(false);
        }
    };

    const handleApproveAndSave = async () => {
        if (!conversationId) return;
        setLoading(true);
        try {
            const res = await fetch(`http://localhost:8000/api/calculators/${conversationId}/save`, {
                method: 'POST'
            });
            if (res.ok) {
                router.push('/app/calculators');
            } else {
                alert('Failed to save calculator');
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex h-[calc(100vh-6rem)] gap-6 p-6 max-w-7xl mx-auto">

            {/* Left Panel: Chat Interface */}
            <div className={`flex flex-col bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-500 ${draftCalculator ? 'w-1/2' : 'w-full max-w-3xl mx-auto'}`}>
                {/* Header */}
                <div className="p-4 border-b border-gray-50 bg-gray-50 flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft size={18} />
                    </Button>
                    <div>
                        <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                            <Sparkles size={16} className="text-blue-600" />
                            AI Calculator Builder
                        </h2>
                        <p className="text-xs text-gray-500">Powered by Multi-Agent System</p>
                    </div>
                </div>

                {/* Messages Area */}
                <ScrollArea className="flex-1 p-4">
                    <div className="space-y-6">
                        {messages.map((msg, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                            >
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'assistant' ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-600'
                                    }`}>
                                    {msg.role === 'assistant' ? <Bot size={16} /> : <User size={16} />}
                                </div>
                                <div className={`max-w-[80%] rounded-2xl p-4 text-sm whitespace-pre-wrap ${msg.role === 'user'
                                    ? 'bg-blue-600 text-white rounded-tr-none'
                                    : 'bg-gray-50 text-gray-800 border border-gray-100 rounded-tl-none'
                                    }`}>
                                    {msg.content}
                                </div>
                            </motion.div>
                        ))}
                        {loading && (
                            <div className="flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                                    <Bot size={16} />
                                </div>
                                <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 rounded-tl-none flex items-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                                    <span className="text-sm text-gray-500">Thinking...</span>
                                </div>
                            </div>
                        )}
                        <div ref={scrollRef} />
                    </div>
                </ScrollArea>

                {/* Input Area */}
                <div className="p-4 border-t border-gray-50 bg-white">
                    <form
                        onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
                        className="flex gap-2 relative"
                    >
                        <Input
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="Type your requirements..."
                            className="pr-12 py-6 rounded-xl border-gray-200 focus:border-blue-300 focus:ring-blue-100"
                            disabled={loading || currentState === 'COMPLETED'}
                        />
                        <Button
                            type="submit"
                            size="icon"
                            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg bg-blue-600 hover:bg-blue-700"
                            disabled={!inputValue.trim() || loading || currentState === 'COMPLETED'}
                        >
                            <Send size={14} />
                        </Button>
                    </form>
                </div>
            </div>

            {/* Right Panel: Live Preview */}
            <AnimatePresence>
                {draftCalculator && (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="w-1/2 flex flex-col gap-4"
                    >
                        <Card className="flex-1 overflow-hidden flex flex-col border-blue-100 shadow-md">
                            <CardHeader className="bg-blue-50/50 border-b border-blue-100 pb-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 uppercase tracking-wide">
                                                Live Preview
                                            </span>
                                            {validationErrors.length > 0 ? (
                                                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 flex items-center gap-1">
                                                    <AlertTriangle size={10} /> Issues Found
                                                </span>
                                            ) : (
                                                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700 flex items-center gap-1">
                                                    <CheckCircle size={10} /> Valid
                                                </span>
                                            )}
                                        </div>
                                        <CardTitle className="text-xl">{draftCalculator.name}</CardTitle>
                                        <CardDescription>{draftCalculator.description}</CardDescription>
                                    </div>
                                    <div className="p-2 bg-white rounded-lg shadow-sm">
                                        <CalculatorIcon className="text-blue-600" />
                                    </div>
                                </div>
                            </CardHeader>

                            <ScrollArea className="flex-1">
                                <CardContent className="p-6 space-y-6">
                                    {/* Inputs Section */}
                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wider">Inputs</h3>
                                        <div className="grid grid-cols-1 gap-4">
                                            {draftCalculator.inputs.map((inp) => (
                                                <div key={inp.key} className="space-y-1.5">
                                                    <label className="text-sm font-medium text-gray-700">
                                                        {inp.label} {inp.required && <span className="text-red-500">*</span>}
                                                    </label>
                                                    <Input disabled placeholder={`Enter ${inp.label}...`} className="bg-gray-50" />
                                                    {inp.help_text && <p className="text-xs text-gray-500">{inp.help_text}</p>}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Logic Visualizer */}
                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wider">Logic Flow</h3>
                                        <div className="space-y-2">
                                            {draftCalculator.steps.map((step, i) => (
                                                <div key={step.id} className="flex gap-3 text-sm p-3 bg-gray-50 rounded-lg border border-gray-100">
                                                    <div className="text-gray-400 font-mono w-6">{i + 1}</div>
                                                    <div className="flex-1">
                                                        <div className="font-medium text-gray-900">{step.id}</div>
                                                        <div className="text-gray-500 font-mono text-xs mt-1">
                                                            {step.expression || (step.rule_engine ? `Rule: ${step.rule_engine}` : '')}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </CardContent>
                            </ScrollArea>

                            {/* Actions */}
                            {currentState === 'AWAITING_APPROVAL' && validationErrors.length === 0 && (
                                <div className="p-4 border-t border-gray-100 bg-gray-50">
                                    <Button
                                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                                        onClick={handleApproveAndSave}
                                        disabled={loading}
                                    >
                                        <Save className="w-4 h-4 mr-2" />
                                        Approve & Save Calculator
                                    </Button>
                                    <p className="text-xs text-center text-gray-500 mt-2">
                                        Or simply reply "Approve" in the chat.
                                    </p>
                                </div>
                            )}
                        </Card>

                        {/* Test Run Feature */}
                        <Card className="border-blue-100 shadow-sm">
                            <CardHeader className="py-3 px-4 bg-gray-50 border-b border-gray-100 cursor-pointer" onClick={() => {
                                // Simple toggle logic could go here, or use Tabs
                            }}>
                                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                    <Play size={14} className="text-blue-600" /> Test Run
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4">
                                <TestRunPanel definition={draftCalculator} />
                            </CardContent>
                        </Card>

                        {/* Validation Errors Box */}
                        {validationErrors.length > 0 && (
                            <Card className="border-red-100 bg-red-50">
                                <CardContent className="p-4">
                                    <h4 className="flex items-center gap-2 text-sm font-semibold text-red-800 mb-2">
                                        <AlertTriangle size={14} />
                                        Auto-Healing in Progress...
                                    </h4>
                                    <ul className="space-y-1">
                                        {validationErrors.map((err, i) => (
                                            <li key={i} className="text-xs text-red-600 flex gap-2">
                                                <span>•</span> {err}
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

import { FormattedNumberInput } from '@/components/ui/formatted-input';

function TestRunPanel({ definition }: { definition: CalculatorDefinition }) {
    const [inputs, setInputs] = useState<Record<string, any>>({});
    const [result, setResult] = useState<any>(null);
    const [running, setRunning] = useState(false);

    const handleRun = async () => {
        setRunning(true);
        try {
            const res = await fetch('http://localhost:8000/api/calculators/preview-execute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    definition: definition,
                    inputs: inputs
                })
            });
            const data = await res.json();
            if (data.success) {
                setResult(data);
            } else {
                alert(`Execution failed: ${data.error || 'Unknown error'}`);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setRunning(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
                {definition.inputs.map(inp => (
                    <div key={inp.key}>
                        <label className="text-xs font-medium text-gray-500 mb-1 block">{inp.label}</label>
                        {inp.type === 'number' ? (
                            <FormattedNumberInput
                                value={inputs[inp.key]}
                                onChange={(val) => setInputs(prev => ({ ...prev, [inp.key]: val }))}
                                placeholder={String(inp.default || '')}
                                className="h-8 text-sm"
                            />
                        ) : (
                            <Input
                                type="text"
                                className="h-8 text-sm"
                                placeholder={String(inp.default || '')}
                                value={inputs[inp.key] || ''}
                                onChange={(e) => setInputs(prev => ({ ...prev, [inp.key]: e.target.value }))}
                            />
                        )}
                    </div>
                ))}
            </div>
            <Button size="sm" onClick={handleRun} disabled={running} className="w-full">
                {running ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <Play className="w-3 h-3 mr-2" />}
                Run Test
            </Button>

            {result && (
                <div className="bg-slate-900 text-slate-50 p-3 rounded-lg text-xs font-mono mt-2 overflow-x-auto">
                    <div className="font-bold text-green-400 mb-1">Result:</div>
                    <pre>{JSON.stringify(result.outputs, null, 2)}</pre>
                </div>
            )}
        </div>
    );
}
