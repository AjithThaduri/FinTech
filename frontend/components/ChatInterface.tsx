'use client';

import { useState, useRef, useEffect } from 'react';
import { useFinancialStore } from '../store/useFinancialStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, User, Bot, Sparkles, CheckCircle, Edit2, ArrowRight } from 'lucide-react';
import clsx from 'clsx';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

// Widgets
import FamilyDetailsForm from './widgets/FamilyDetailsForm';
import CashFlowForm from './widgets/CashFlowForm';
import GoalForm from './widgets/GoalForm';
import AssetsForm from './widgets/AssetsForm';
import LiabilityForm from './widgets/LiabilityForm';
import SummaryDashboard from './widgets/SummaryDashboard';

// Type describing a message
type WidgetType = 'family' | 'cashflow' | 'goals' | 'assets' | 'liabilities' | 'summary';

type Message = {
    id: string;
    sender: 'bot' | 'user';
    text: string;
    widget?: WidgetType;
    // State management for widget workflow
    status?: 'active' | 'review' | 'locked';
    widgetData?: any; // Structured data
    nextStep?: { text: string; widget: WidgetType };
};

export default function ChatInterface() {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            sender: 'bot',
            text: "👋 Welcome to your AI Financial Planner! I'm here to help you build a comprehensive wealth strategy. Let's start with your family profile.",
            widget: 'family',
            status: 'active'
        }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    const handleSend = () => {
        if (!input.trim()) return;

        const newMsg: Message = { id: Date.now().toString(), sender: 'user', text: input };
        setMessages(prev => [...prev, newMsg]);
        setInput('');

        // Simulate bot thinking
        setIsTyping(true);
        // In real app, this would be API call
    };

    const handleWidgetComplete = (nextStep: { text: string; widget: WidgetType }, summary: any) => {
        setMessages(prev => {
            const newMsgs = [...prev];
            const lastMsg = newMsgs[newMsgs.length - 1];
            if (lastMsg && lastMsg.sender === 'bot') {
                lastMsg.status = 'review';
                lastMsg.widgetData = summary;
                lastMsg.nextStep = nextStep;
            }
            return newMsgs;
        });
    };

    const handleEdit = (msgId: string) => {
        setMessages(prev => prev.map(m =>
            m.id === msgId ? { ...m, status: 'active' } : m
        ));
    };

    const handleContinue = (msg: Message) => {
        // 1. Lock the current message
        setMessages(prev => prev.map(m =>
            m.id === msg.id ? { ...m, status: 'locked' } : m
        ));

        // 2. Trigger next step
        setIsTyping(true);
        setTimeout(() => {
            setIsTyping(false);
            if (msg.nextStep) {
                setMessages(prev => [
                    ...prev,
                    {
                        id: Date.now().toString(),
                        sender: 'bot',
                        text: msg.nextStep!.text,
                        widget: msg.nextStep!.widget,
                        status: 'active'
                    }
                ]);
            }
        }, 1200);
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 border border-gray-200 shadow-xl shadow-gray-200/50 rounded-2xl overflow-hidden relative">

            {/* Premium Header */}
            <header className="px-6 py-4 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between shrink-0 sticky top-0 z-20">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                        <Sparkles size={18} />
                    </div>
                    <div>
                        <h1 className="font-bold text-gray-900 text-base">Financial Planner</h1>
                        <div className="flex items-center gap-2">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            <span className="text-xs text-emerald-600 font-semibold tracking-wide uppercase">AI Active</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Chat Area with Mesh Gradient Background */}
            <div className="flex-1 overflow-hidden relative">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50/50 via-white to-slate-50 z-0"></div>

                <ScrollArea className="h-full px-4 md:px-8 py-6 relative z-10">
                    <div className="space-y-8 max-w-4xl mx-auto pb-6">
                        <AnimatePresence mode="popLayout">
                            {messages.map((msg) => (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={clsx("flex gap-4", msg.sender === 'user' ? "flex-row-reverse" : "")}
                                >
                                    {/* Avatar */}
                                    <div className={clsx(
                                        "w-10 h-10 rounded-full flex items-center justify-center shrink-0 mt-1 shadow-sm border",
                                        msg.sender === 'bot'
                                            ? "bg-white border-blue-100 text-blue-600"
                                            : "bg-gray-900 border-gray-800 text-white"
                                    )}>
                                        {msg.sender === 'bot' ? <Bot size={20} /> : <User size={20} />}
                                    </div>

                                    <div className="flex flex-col gap-2 max-w-[90%] lg:max-w-[85%]">
                                        {/* Text Bubble */}
                                        {msg.text && (
                                            <div className={clsx(
                                                "px-6 py-4 text-[15px] leading-relaxed shadow-sm",
                                                msg.sender === 'bot'
                                                    ? "bg-white border border-gray-200 rounded-2xl rounded-tl-none text-gray-700"
                                                    : "bg-blue-600 text-white rounded-2xl rounded-tr-none shadow-blue-500/20"
                                            )}>
                                                {msg.text}
                                            </div>
                                        )}

                                        {/* Widget Rendering Area */}
                                        {msg.sender === 'bot' && msg.widget && (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.98 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: 0.1 }}
                                                className="w-full mt-4"
                                            >
                                                {msg.status === 'active' ? (
                                                    <div className="bg-white rounded-2xl border border-gray-200 shadow-xl shadow-gray-200/50 overflow-hidden ring-1 ring-black/5">
                                                        <div className="h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 opacity-80" />
                                                        <div className="p-6 md:p-8">
                                                            <WidgetDispatcher
                                                                widget={msg.widget}
                                                                onComplete={handleWidgetComplete}
                                                            />
                                                        </div>
                                                    </div>
                                                ) : msg.status === 'review' ? (
                                                    <Card className="border-blue-200 bg-blue-50/50 overflow-hidden shadow-lg animate-in zoom-in-95 duration-300">
                                                        <CardContent className="p-6">
                                                            <div className="flex items-center gap-3 mb-4">
                                                                <div className="bg-green-100 text-green-700 p-2 rounded-full">
                                                                    <CheckCircle size={20} />
                                                                </div>
                                                                <h3 className="font-semibold text-gray-900">Information Captured!</h3>
                                                            </div>
                                                            <div className="bg-white p-4 rounded-xl border border-blue-100 text-sm text-gray-700 mb-6 shadow-sm overflow-hidden">
                                                                <SummaryViewer widget={msg.widget!} data={msg.widgetData} />
                                                            </div>
                                                            <div className="flex gap-3">
                                                                <Button
                                                                    variant="outline"
                                                                    onClick={() => handleEdit(msg.id)}
                                                                    className="flex-1 border-blue-200 hover:bg-blue-50 text-blue-700"
                                                                >
                                                                    <Edit2 size={16} className="mr-2" />
                                                                    Edit Details
                                                                </Button>
                                                                <Button
                                                                    onClick={() => handleContinue(msg)}
                                                                    className="flex-1 bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20"
                                                                >
                                                                    Continue <ArrowRight size={16} className="ml-2" />
                                                                </Button>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                ) : (
                                                    // Locked / Completed View
                                                    <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 flex items-start gap-3 opacity-80 hover:opacity-100 transition-opacity">
                                                        <div className="bg-gray-200 text-gray-500 p-1.5 rounded-full mt-0.5">
                                                            <CheckCircle size={14} />
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Completed</p>
                                                            <div className="text-sm text-gray-700 w-full overflow-hidden">
                                                                <SummaryViewer widget={msg.widget!} data={msg.widgetData} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </motion.div>
                                        )}
                                    </div>
                                </motion.div>
                            ))}

                            {/* Typing Indicator */}
                            {isTyping && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex gap-4"
                                >
                                    <div className="w-10 h-10 rounded-full bg-white text-blue-600 border border-blue-100 flex items-center justify-center shadow-sm">
                                        <Bot size={20} />
                                    </div>
                                    <div className="bg-white border border-gray-200 px-5 py-3 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-1.5">
                                        <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                        <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                        <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                        <div ref={messagesEndRef} className="h-6" />
                    </div>
                </ScrollArea>
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-gray-100 shrink-0 z-20">
                <div className="max-w-4xl mx-auto relative flex items-center">
                    <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Type your response..."
                        className="w-full pl-6 pr-14 py-4 rounded-full border border-gray-200 bg-gray-50 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all text-base placeholder:text-gray-400 shadow-inner"
                    />
                    <div className="absolute right-2 top-2 bottom-2">
                        <Button
                            onClick={handleSend}
                            size="icon"
                            className="h-full w-11 rounded-full bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all scale-95 hover:scale-100"
                            disabled={!input.trim()}
                        >
                            <Send size={18} className="translate-x-0.5" />
                        </Button>
                    </div>
                </div>
                <div className="flex justify-center mt-3 gap-4">
                    <p className="text-[10px] text-gray-400 font-medium tracking-wide uppercase">
                        Secure • Private • AI-Powered
                    </p>
                </div>
            </div>
        </div>
    );
}

// --- Widget Dispatcher ---

function WidgetDispatcher({ widget, onComplete }: { widget: WidgetType, onComplete: (next: any, summary: any) => void }) {
    switch (widget) {
        case 'family':
            return <FamilyDetailsForm onComplete={onComplete} />;
        case 'cashflow':
            return <CashFlowForm onComplete={onComplete} />;
        case 'goals':
            return <GoalForm onComplete={onComplete} />;
        case 'assets':
            return <AssetsForm onComplete={onComplete} />;
        case 'liabilities':
            return <LiabilityForm onComplete={onComplete} />;
        case 'summary':
            return (
                <div className="-m-6 md:-m-8">
                    <SummaryDashboard />
                </div>
            );
        default:
            return <div className="p-4 text-red-500">Widget {widget} not implemented</div>;
    }
}

function SummaryViewer({ widget, data }: { widget: WidgetType, data: any }) {
    if (!data) return null;

    const formatINR = (val: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(val);
    };

    // Handle legacy string data (prevents crash on old messages)
    if (typeof data === 'string') {
        return <p className="text-gray-700 whitespace-pre-wrap">{data}</p>;
    }

    if (widget === 'family' && data.primary) {
        const { primary, spouse, children, parents } = data;
        return (
            <div className="flex flex-col gap-4">
                <div className="overflow-hidden rounded-lg border border-gray-200">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-200">
                            <tr>
                                <th className="px-3 py-2">Role</th>
                                <th className="px-3 py-2">Name</th>
                                <th className="px-3 py-2">Age</th>
                                <th className="px-3 py-2">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            <tr className="bg-white hover:bg-gray-50/50">
                                <td className="px-3 py-2 font-medium text-gray-900">Primary</td>
                                <td className="px-3 py-2 text-gray-600">{primary.name}</td>
                                <td className="px-3 py-2 text-gray-600">{primary.age}</td>
                                <td className="px-3 py-2 text-gray-500">Retires @ {primary.retire_age}</td>
                            </tr>
                            {spouse && (
                                <tr className="bg-white hover:bg-gray-50/50">
                                    <td className="px-3 py-2 font-medium text-gray-900">Spouse</td>
                                    <td className="px-3 py-2 text-gray-600">{spouse.name}</td>
                                    <td className="px-3 py-2 text-gray-600">{spouse.age}</td>
                                    <td className="px-3 py-2 text-gray-500">{spouse.working_status ? 'Working' : 'Not Working'}</td>
                                </tr>
                            )}
                            {children?.map((child: any, i: number) => (
                                <tr key={i} className="bg-white hover:bg-gray-50/50">
                                    <td className="px-3 py-2 font-medium text-gray-900">Child {i + 1}</td>
                                    <td className="px-3 py-2 text-gray-600">{child.name}</td>
                                    <td className="px-3 py-2 text-gray-600">{child.age}</td>
                                    <td className="px-3 py-2 text-gray-500">-</td>
                                </tr>
                            ))}
                            {parents?.father?.enabled && (
                                <tr className="bg-white hover:bg-gray-50/50">
                                    <td className="px-3 py-2 font-medium text-gray-900">Father</td>
                                    <td className="px-3 py-2 text-gray-600">{parents.father.name}</td>
                                    <td className="px-3 py-2 text-gray-600">{parents.father.age}</td>
                                    <td className="px-3 py-2 text-gray-500">-</td>
                                </tr>
                            )}
                            {parents?.mother?.enabled && (
                                <tr className="bg-white hover:bg-gray-50/50">
                                    <td className="px-3 py-2 font-medium text-gray-900">Mother</td>
                                    <td className="px-3 py-2 text-gray-600">{parents.mother.name}</td>
                                    <td className="px-3 py-2 text-gray-600">{parents.mother.age}</td>
                                    <td className="px-3 py-2 text-gray-500">-</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    if (widget === 'cashflow' && data.totals) {
        return (
            <div className="flex flex-col gap-3">
                <div className="overflow-hidden rounded-lg border border-gray-200">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-green-50 text-green-800 font-semibold border-b border-gray-200">
                            <tr>
                                <th className="px-3 py-2 w-1/2">Monthly Inflows</th>
                                <th className="px-3 py-2 text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 uppercase text-[10px] tracking-wider">
                            {Object.entries(data.inflows).map(([key, val]: [string, any]) => val > 0 && (
                                <tr key={key} className="hover:bg-gray-50/50">
                                    <td className="px-3 py-1.5 text-gray-600">{key.replace('_', ' ')}</td>
                                    <td className="px-3 py-1.5 text-right font-medium text-gray-900">{formatINR(val)}</td>
                                </tr>
                            ))}
                            <tr className="bg-green-50/20 font-bold border-t border-green-100">
                                <td className="px-3 py-2 text-green-900 text-xs">Total Inflow</td>
                                <td className="px-3 py-2 text-right text-green-900 text-xs">{formatINR(data.totals.inflow)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div className="overflow-hidden rounded-lg border border-gray-200">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-red-50 text-red-800 font-semibold border-b border-gray-200">
                            <tr>
                                <th className="px-3 py-2 w-1/2">Monthly Outflows</th>
                                <th className="px-3 py-2 text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 uppercase text-[10px] tracking-wider">
                            <tr className="hover:bg-gray-50/50">
                                <td className="px-3 py-1.5 text-gray-600">Essential Expenses</td>
                                <td className="px-3 py-1.5 text-right font-medium text-gray-900">
                                    {formatINR(typeof data.expenses.essential.total === 'number' ? data.expenses.essential.total : Object.values(data.expenses.essential).reduce((a: any, b: any) => a + b, 0))}
                                </td>
                            </tr>
                            <tr className="hover:bg-gray-50/50">
                                <td className="px-3 py-1.5 text-gray-600">Lifestyle Expenses</td>
                                <td className="px-3 py-1.5 text-right font-medium text-gray-900">
                                    {formatINR(typeof data.expenses.lifestyle.total === 'number' ? data.expenses.lifestyle.total : Object.values(data.expenses.lifestyle).reduce((a: any, b: any) => a + b, 0))}
                                </td>
                            </tr>
                            <tr className="bg-red-50/20 font-bold border-t border-red-100">
                                <td className="px-3 py-2 text-red-900 text-xs">Total Outflow</td>
                                <td className="px-3 py-2 text-right text-red-900 text-xs">{formatINR(data.totals.expenses)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg flex justify-between items-center">
                    <span className="text-sm font-bold text-blue-900 uppercase tracking-tight">Monthly Surplus</span>
                    <span className="text-lg font-black text-blue-600">{formatINR(data.totals.surplus)}</span>
                </div>

                <div className="text-[10px] text-gray-400 px-1 italic">
                    Assumptions: Inflation {(data.assumptions.inflation * 100).toFixed(0)}%, Pre-Retire ROI {(data.assumptions.pre_retire_roi * 100).toFixed(0)}%, Post-Retire ROI {(data.assumptions.post_retire_roi * 100).toFixed(0)}%
                </div>
            </div>
        );
    }

    if (widget === 'goals' && Array.isArray(data)) {
        return (
            <div className="overflow-hidden rounded-lg border border-gray-200">
                <table className="w-full text-sm text-left">
                    <thead className="bg-blue-50 text-blue-800 font-semibold border-b border-gray-200">
                        <tr>
                            <th className="px-3 py-2">Goal</th>
                            <th className="px-3 py-2 text-right">Cost (Today)</th>
                            <th className="px-3 py-2 text-right">Target</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {data.map((goal: any, i: number) => (
                            <tr key={i} className="hover:bg-gray-50/50">
                                <td className="px-3 py-2">
                                    <div className="font-medium text-gray-900">{goal.name}</div>
                                    {goal.person_name && goal.person_name !== 'general' && (
                                        <div className="text-[10px] text-gray-500">For {goal.person_name}</div>
                                    )}
                                </td>
                                <td className="px-3 py-2 text-right text-gray-600">{formatINR(goal.current_cost)}</td>
                                <td className="px-3 py-2 text-right text-gray-500 whitespace-nowrap">
                                    {goal.target_type === 'AGE' ? `Age ${goal.target_value}` : goal.target_value}
                                </td>
                            </tr>
                        ))}
                        {data.length === 0 && (
                            <tr><td colSpan={3} className="px-3 py-4 text-center text-gray-400 italic">No goals added</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        );
    }

    if (widget === 'assets' && data.real_estate) {
        const reTotal = data.real_estate.reduce((s: number, a: any) => s + a.present_value, 0);
        const bankTotal = data.bank_accounts.reduce((s: number, a: any) => s + a.balance, 0);
        const invTotal = data.investments.reduce((s: number, a: any) => s + a.current_value, 0);
        const insTotal = data.insurance_policies.reduce((s: number, p: any) => s + p.premium, 0);
        const total = reTotal + bankTotal + invTotal + data.liquid_cash;

        return (
            <div className="overflow-hidden rounded-lg border border-gray-200">
                <table className="w-full text-sm text-left">
                    <thead className="bg-indigo-50 text-indigo-800 font-semibold border-b border-gray-200">
                        <tr>
                            <th className="px-3 py-2">Asset Class</th>
                            <th className="px-3 py-2 text-right">Total Value</th>
                            <th className="px-3 py-2 text-right">Count</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 uppercase text-[10px] tracking-wider font-semibold">
                        <tr className="hover:bg-gray-50/50">
                            <td className="px-3 py-2 text-gray-700">Real Estate</td>
                            <td className="px-3 py-2 text-right text-gray-900">{formatINR(reTotal)}</td>
                            <td className="px-3 py-2 text-right text-gray-500">{data.real_estate.length}</td>
                        </tr>
                        <tr className="hover:bg-gray-50/50">
                            <td className="px-3 py-2 text-gray-700">Bank & Cash</td>
                            <td className="px-3 py-2 text-right text-gray-900">{formatINR(bankTotal + data.liquid_cash)}</td>
                            <td className="px-3 py-2 text-right text-gray-500">{data.bank_accounts.length}</td>
                        </tr>
                        <tr className="hover:bg-gray-50/50">
                            <td className="px-3 py-2 text-gray-700">Investments</td>
                            <td className="px-3 py-2 text-right text-gray-900">{formatINR(invTotal)}</td>
                            <td className="px-3 py-2 text-right text-gray-500">{data.investments.length}</td>
                        </tr>
                        <tr className="bg-gray-50 font-bold border-t border-gray-200 text-sm">
                            <td className="px-3 py-2 text-indigo-900">Total Net Assets</td>
                            <td className="px-3 py-2 text-right text-indigo-900" colSpan={2}>{formatINR(total)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        );
    }

    if (widget === 'liabilities' && Array.isArray(data)) {
        const totalOutstanding = data.reduce((s: number, l: any) => s + l.outstanding, 0);
        const totalEMI = data.reduce((s: number, l: any) => s + l.emi, 0);

        return (
            <div className="overflow-hidden rounded-lg border border-gray-200">
                <table className="w-full text-sm text-left">
                    <thead className="bg-red-50 text-red-800 font-semibold border-b border-gray-200">
                        <tr>
                            <th className="px-3 py-2">Loan Type</th>
                            <th className="px-3 py-2 text-right">Outstanding</th>
                            <th className="px-3 py-2 text-right">Monthly EMI</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {data.map((loan: any, i: number) => (
                            <tr key={i} className="hover:bg-gray-50/50">
                                <td className="px-3 py-2">
                                    <div className="font-medium text-gray-900">{loan.type}</div>
                                    <div className="text-[10px] text-gray-500">{loan.interest_rate}% Interest</div>
                                </td>
                                <td className="px-3 py-2 text-right text-gray-600">{formatINR(loan.outstanding)}</td>
                                <td className="px-3 py-2 text-right text-gray-600">{formatINR(loan.emi)}</td>
                            </tr>
                        ))}
                        {data.length === 0 && (
                            <tr><td colSpan={3} className="px-3 py-4 text-center text-gray-400 italic">No active loans</td></tr>
                        )}
                        {data.length > 0 && (
                            <tr className="bg-red-50/30 font-bold border-t border-gray-200">
                                <td className="px-3 py-2 text-red-900">Total</td>
                                <td className="px-3 py-2 text-right text-red-900">{formatINR(totalOutstanding)}</td>
                                <td className="px-3 py-2 text-right text-red-900">{formatINR(totalEMI)}</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        );
    }

    // Generic fallback for plain objects or unhandled widgets
    if (typeof data === 'object') {
        return (
            <div className="overflow-hidden rounded-lg border border-gray-200">
                <table className="w-full text-sm text-left">
                    <tbody className="divide-y divide-gray-100">
                        {Object.entries(data).map(([key, val]) => (
                            <tr key={key}>
                                <td className="px-3 py-2 font-medium bg-gray-50 text-gray-700">{key}</td>
                                <td className="px-3 py-2 text-gray-600">{typeof val === 'object' ? '...' : String(val)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    }

    return <span>{String(data)}</span>;
}
