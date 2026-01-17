'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger as TabsTriggerBase, TabsContent } from '@/components/ui/tabs';
// Note: TabsTrigger export might differ, trying standard usage or workaround if needed. 
// Standard shadcn TabsTrigger is usually exported.
import { TabsTrigger } from '@/components/ui/tabs';

import {
    Search,
    Plus,
    Calculator,
    ArrowRight,
    Activity,
    History,
    Sparkles
} from 'lucide-react';
import { Calculator as CalculatorType } from '@/types/calculator';

export default function CalculatorsPage() {
    const router = useRouter();
    const [calculators, setCalculators] = useState<CalculatorType[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCalculators();
    }, []);

    const fetchCalculators = async () => {
        try {
            const res = await fetch('http://localhost:8000/api/calculators');
            const data = await res.json();
            setCalculators(data.calculators);
        } catch (error) {
            console.error('Failed to fetch calculators:', error);
        } finally {
            setLoading(false);
        }
    };

    const categories = ['All', 'Tax', 'Investment', 'Loans', 'Retirement', 'Insurance'];

    const filteredCalculators = calculators.filter(calc => {
        const matchesSearch = calc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            calc.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'All' || calc.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Financial Calculators</h1>
                    <p className="text-gray-500 mt-1">Access powerful tools or generate new ones with AI.</p>
                </div>
                <Button
                    onClick={() => router.push('/app/calculators/generate')}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg"
                >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate New Calculator
                </Button>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                        placeholder="Search calculators..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                    />
                </div>
                <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${selectedCategory === cat
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Calculator Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-48 bg-gray-100 animate-pulse rounded-xl" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCalculators.map(calc => (
                        <Card
                            key={calc.id}
                            className="group hover:shadow-xl transition-all duration-300 border-gray-200 hover:border-blue-200 cursor-pointer overflow-hidden"
                            onClick={() => router.push(`/app/calculators/${calc.id}`)}
                        >
                            <CardHeader className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`p-3 rounded-lg ${calc.category === 'Tax' ? 'bg-red-100 text-red-600' :
                                            calc.category === 'Investment' ? 'bg-green-100 text-green-600' :
                                                calc.category === 'Loans' ? 'bg-yellow-100 text-yellow-600' :
                                                    'bg-blue-100 text-blue-600'
                                        }`}>
                                        <Calculator className="w-6 h-6" />
                                    </div>
                                    {calc.is_active && (
                                        <span className="bg-green-100 text-green-700 text-xs font-medium px-2.5 py-1 rounded-full border border-green-200">
                                            v{calc.version || '1.0'}
                                        </span>
                                    )}
                                </div>
                                <CardTitle className="text-xl mb-2 group-hover:text-blue-600 transition-colors">
                                    {calc.name}
                                </CardTitle>
                                <CardDescription className="line-clamp-2 text-gray-500">
                                    {calc.description}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-6 pt-0">
                                <div className="flex items-center text-sm text-blue-600 font-medium opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                                    Open Calculator <ArrowRight className="w-4 h-4 ml-1" />
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    {/* Create New Card (Empty State) */}
                    <div
                        onClick={() => router.push('/app/calculators/generate')}
                        className="border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-all group"
                    >
                        <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform mb-4">
                            <Plus className="w-6 h-6" />
                        </div>
                        <h3 className="font-semibold text-gray-900">Create Custom Calculator</h3>
                        <p className="text-sm text-gray-500 mt-2 max-w-xs">
                            Describe what you need, and our AI will build it for you in seconds.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
