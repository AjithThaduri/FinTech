'use client';
import { useState } from 'react';
import { useFinancialStore, TargetType } from '../../store/useFinancialStore';
import { Plus, Trash2, Target, Trophy, Clock, Calendar } from 'lucide-react';
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

// Common goals templates
const GOAL_TEMPLATES = [
    { name: 'Graduation', defaultCost: 1000000, targetAge: 18, icon: '🎓' },
    { name: 'Post Graduation', defaultCost: 1500000, targetAge: 22, icon: '📜' },
    { name: 'Marriage', defaultCost: 2500000, targetAge: 25, icon: '💍' },
    { name: 'Car', defaultCost: 1200000, targetAge: 0, icon: '🚗' },
    { name: 'House', defaultCost: 8000000, targetAge: 0, icon: '🏠' },
];

// Helper: Format to Indian Currency
const formatToIndianCurrency = (num: number) => {
    if (typeof num !== 'number' || isNaN(num)) return '';
    return num.toLocaleString('en-IN');
};

// Helper: Parse string to number
const parseFromCurrency = (str: string) => {
    return Number(str.replace(/,/g, '').replace(/[^\d.]/g, ''));
};



export default function GoalForm({ onComplete }: Props) {
    const { goals, addGoal, removeGoal, user_profile } = useFinancialStore();

    const [newGoal, setNewGoal] = useState({
        person_name: '',
        name: '',
        current_cost: 0,
        target_type: 'AGE' as TargetType,
        target_value: ''
    });

    // Get all family members for the dropdown
    const familyMembers = [
        { name: user_profile.primary.name || 'Self', type: 'self' },
        ...(user_profile.spouse ? [{ name: user_profile.spouse.name, type: 'spouse' }] : []),
        ...user_profile.family_members.map(m => ({ name: m.name, type: m.relation_type }))
    ].filter(m => m.name);

    const handleAddGoal = () => {
        if (newGoal.name && newGoal.current_cost > 0 && newGoal.target_value) {
            addGoal({
                id: Date.now().toString(),
                person_name: newGoal.person_name || undefined,
                name: newGoal.person_name ? `${newGoal.person_name} ${newGoal.name}` : newGoal.name,
                current_cost: newGoal.current_cost,
                target_type: newGoal.target_type,
                target_value: newGoal.target_value
            });

            setNewGoal({
                person_name: '',
                name: '',
                current_cost: 0,
                target_type: 'AGE',
                target_value: ''
            });
        }
    };

    const applyTemplate = (template: typeof GOAL_TEMPLATES[0]) => {
        setNewGoal({
            ...newGoal,
            name: template.name,
            current_cost: template.defaultCost,
            target_type: template.targetAge > 0 ? 'AGE' : 'DATE',
            target_value: template.targetAge > 0 ? template.targetAge.toString() : ''
        });
    };

    const handleSubmit = () => {
        onComplete(
            { text: "Now let's look at your assets - real estate, investments, and bank accounts.", widget: 'assets' },
            goals
        );
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                    <Trophy size={24} />
                </div>
                <div>
                    <h3 className="font-bold text-gray-800 text-xl">Financial Goals</h3>
                    <p className="text-gray-500 text-sm">What are you saving for?</p>
                </div>
            </div>

            {/* Quick Templates */}
            <div className="flex flex-wrap gap-2">
                {GOAL_TEMPLATES.map(t => (
                    <Button
                        key={t.name}
                        variant="outline"
                        size="sm"
                        onClick={() => applyTemplate(t)}
                        className="rounded-full bg-white hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all text-xs h-8"
                    >
                        <span className="mr-1">{t.icon}</span> {t.name}
                    </Button>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Add New Goal Form */}
                <Card className="h-fit">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Target size={18} className="text-blue-500" />
                            Add New Goal
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>For Person (Optional)</Label>
                            <Select
                                value={newGoal.person_name}
                                onValueChange={(value) => setNewGoal({ ...newGoal, person_name: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="General Goal" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="general">General Goal</SelectItem>
                                    {familyMembers.map((m, i) => (
                                        <SelectItem key={i} value={m.name}>{m.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Goal Name</Label>
                            <Input
                                placeholder="e.g., Graduation, House, Car"
                                value={newGoal.name}
                                onChange={e => setNewGoal({ ...newGoal, name: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Current Cost (₹)</Label>
                            <MoneyInput
                                placeholder="10,00,000"
                                value={newGoal.current_cost}
                                onChange={val => setNewGoal({ ...newGoal, current_cost: val })}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Target Type</Label>
                                <Select
                                    value={newGoal.target_type}
                                    onValueChange={(value) => setNewGoal({ ...newGoal, target_type: value as TargetType })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="AGE">By Age</SelectItem>
                                        <SelectItem value="DATE">By Date</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>
                                    {newGoal.target_type === 'AGE' ? 'Target Age' : 'Target Date'}
                                </Label>
                                {newGoal.target_type === 'AGE' ? (
                                    <FormattedNumberInput
                                        placeholder="18"
                                        value={Number(newGoal.target_value)}
                                        onChange={val => setNewGoal({ ...newGoal, target_value: String(val || '') })}
                                    />
                                ) : (
                                    <Input
                                        type="date"
                                        value={newGoal.target_value}
                                        onChange={e => setNewGoal({ ...newGoal, target_value: e.target.value })}
                                    />
                                )}
                            </div>
                        </div>

                        <Button
                            onClick={handleAddGoal}
                            disabled={!newGoal.name || !newGoal.current_cost || !newGoal.target_value}
                            className="w-full"
                        >
                            <Plus size={16} className="mr-2" /> Add Goal
                        </Button>
                    </CardContent>
                </Card>

                {/* Existing Goals List */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-gray-700">Planned Goals ({goals.length})</h4>
                    </div>

                    {goals.length === 0 ? (
                        <div className="text-center p-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                            <Target className="mx-auto h-10 w-10 text-gray-300 mb-2" />
                            <p className="text-sm text-gray-500">No goals added yet.<br />Start by selecting a template or adding one manually.</p>
                        </div>
                    ) : (
                        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                            {goals.map((goal) => (
                                <Card key={goal.id} className="group relative overflow-hidden transition-all hover:shadow-md border-l-4 border-l-blue-500">
                                    <CardContent className="p-4 flex items-center justify-between">
                                        <div>
                                            <div className="font-semibold text-gray-800">{goal.name}</div>
                                            <div className="text-sm text-gray-500 mt-1 flex items-center gap-3">
                                                <span className="font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded text-xs">
                                                    ₹{formatToIndianCurrency(goal.current_cost)}
                                                </span>
                                                <span className="flex items-center gap-1 text-xs">
                                                    {goal.target_type === 'AGE' ? <Calendar size={12} /> : <Clock size={12} />}
                                                    {goal.target_type === 'AGE' ? `Age ${goal.target_value}` : `Date: ${goal.target_value}`}
                                                </span>
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeGoal(goal.id)}
                                            className="text-gray-400 hover:text-red-500 hover:bg-red-50"
                                        >
                                            <Trash2 size={16} />
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <Button
                onClick={handleSubmit}
                className="w-full h-12 text-base shadow-lg shadow-blue-500/20 mt-4"
                variant={goals.length > 0 ? "default" : "secondary"}
            >
                {goals.length > 0 ? 'Continue with Goals →' : 'Skip Goals for Now →'}
            </Button>
        </div>
    );
}
