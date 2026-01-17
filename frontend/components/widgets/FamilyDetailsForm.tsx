'use client';
import { useState } from 'react';
import { useFinancialStore, FamilyMember, RelationshipType } from '../../store/useFinancialStore';
import { Plus, Trash2, User, Users, Heart, Briefcase, Phone, MapPin, Baby } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { FormattedNumberInput } from '@/components/ui/formatted-input';

interface Props {
    onComplete: (next: any, summary: any) => void;
}

export default function FamilyDetailsForm({ onComplete }: Props) {
    const { user_profile, setProfile } = useFinancialStore();

    const [primary, setPrimary] = useState({
        name: user_profile.primary.name || '',
        dob: user_profile.primary.dob || '',
        retire_age: user_profile.primary.retire_age || 60,
        life_expectancy: user_profile.primary.life_expectancy || 85
    });

    const [spouse, setSpouse] = useState({
        name: '',
        dob: '',
        working_status: false,
        enabled: false
    });

    const [children, setChildren] = useState<Array<{ id: string; name: string; age: string }>>([]);
    const [parents, setParents] = useState<{ father: { enabled: boolean; name: string; age: string }; mother: { enabled: boolean; name: string; age: string } }>({
        father: { enabled: false, name: '', age: '' },
        mother: { enabled: false, name: '', age: '' }
    });
    const [contactDetails, setContactDetails] = useState({ mobile: '', email: '', designation: '', organisation: '' });
    const [address, setAddress] = useState('');

    const [newChild, setNewChild] = useState({ name: '', age: '' });

    const addChild = () => {
        if (newChild.name && newChild.age) {
            setChildren([...children, { id: Date.now().toString(), ...newChild }]);
            setNewChild({ name: '', age: '' });
        }
    };

    const removeChild = (id: string) => {
        setChildren(children.filter(c => c.id !== id));
    };

    const calculateAge = (dob: string): number | null => {
        if (!dob) return null;
        const birthDate = new Date(dob);
        const today = new Date();
        const age = Math.floor((today.getTime() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
        return age;
    };

    // Helper to convert Age back to approximate DOB
    const convertAgeToDob = (age: number): string => {
        const today = new Date();
        const year = today.getFullYear() - age;
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const handleSubmit = () => {
        // Build family members array
        const familyMembers: FamilyMember[] = children.map(c => ({
            id: c.id,
            name: c.name,
            dob: convertAgeToDob(parseInt(c.age) || 0),
            relation_type: 'CHILD' as RelationshipType
        }));

        // Add parents if enabled
        if (parents.father.enabled && parents.father.name) {
            familyMembers.push({
                id: 'father-' + Date.now(),
                name: parents.father.name,
                dob: convertAgeToDob(parseInt(parents.father.age) || 0),
                relation_type: 'FATHER' as RelationshipType
            });
        }
        if (parents.mother.enabled && parents.mother.name) {
            familyMembers.push({
                id: 'mother-' + Date.now(),
                name: parents.mother.name,
                dob: convertAgeToDob(parseInt(parents.mother.age) || 0),
                relation_type: 'MOTHER' as RelationshipType
            });
        }

        // Set profile
        // Set profile
        setProfile({
            primary: {
                name: primary.name,
                dob: primary.dob,
                retire_age: Number(primary.retire_age),
                pension_till_age: user_profile.primary.pension_till_age || 85, // Preserve default
                life_expectancy: Number(primary.life_expectancy)
            },
            spouse: spouse.enabled ? {
                name: spouse.name,
                dob: spouse.dob,
                working_status: spouse.working_status,
                retirement_age: user_profile.spouse?.retirement_age, // Preserve
                pension_till_age: user_profile.spouse?.pension_till_age // Preserve
            } : undefined,
            family_members: familyMembers
        });

        const rawData = {
            primary: { ...primary, age: calculateAge(primary.dob) },
            spouse: spouse.enabled ? { ...spouse, age: calculateAge(spouse.dob) } : null,
            children: children,
            parents: parents
        };

        onComplete(
            { text: "Thanks! Now let's capture your income sources and monthly expenses.", widget: 'cashflow' },
            rawData
        );
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                    <Users size={24} />
                </div>
                <div>
                    <h3 className="font-bold text-gray-800 text-xl">Family Profile</h3>
                    <p className="text-gray-500 text-sm">Tell us about you and your family</p>
                </div>
            </div>

            {/* Primary User */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <User size={18} className="text-blue-500" />
                        Primary Member
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Full Name</Label>
                        <Input
                            placeholder="John Doe"
                            value={primary.name}
                            onChange={e => setPrimary({ ...primary, name: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Date of Birth</Label>
                        <Input
                            type="date"
                            value={primary.dob}
                            onChange={e => setPrimary({ ...primary, dob: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4 col-span-1 md:col-span-2">
                        <div className="space-y-2">
                            <Label>Retirement Age</Label>
                            <FormattedNumberInput
                                value={primary.retire_age}
                                onChange={val => setPrimary({ ...primary, retire_age: Number(val) })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Life Expectancy</Label>
                            <FormattedNumberInput
                                value={primary.life_expectancy}
                                onChange={val => setPrimary({ ...primary, life_expectancy: Number(val) })}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Spouse Section */}
            <Card>
                <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Heart size={18} className="text-red-500" />
                        Spouse Details
                    </CardTitle>
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="spouse-enable"
                            checked={spouse.enabled}
                            onCheckedChange={(checked) => setSpouse({ ...spouse, enabled: checked as boolean })}
                        />
                        <Label htmlFor="spouse-enable" className="font-normal text-gray-500 cursor-pointer">Add Spouse</Label>
                    </div>
                </CardHeader>
                {spouse.enabled && (
                    <CardContent className="animate-in slide-in-from-top-2 duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Spouse Name</Label>
                                <Input
                                    placeholder="Jane Doe"
                                    value={spouse.name}
                                    onChange={e => setSpouse({ ...spouse, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Date of Birth</Label>
                                <Input
                                    type="date"
                                    value={spouse.dob}
                                    onChange={e => setSpouse({ ...spouse, dob: e.target.value })}
                                />
                            </div>
                            <div className="flex items-center space-x-2 pt-4 md:col-span-2">
                                <Checkbox
                                    id="spouse-working"
                                    checked={spouse.working_status}
                                    onCheckedChange={(checked) => setSpouse({ ...spouse, working_status: checked as boolean })}
                                />
                                <Label htmlFor="spouse-working">Currently Working</Label>
                            </div>
                        </div>
                    </CardContent>
                )}
            </Card>

            {/* Parents Section */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Users size={18} className="text-purple-500" />
                        Parents
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Father */}
                    <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="father-enable"
                                checked={parents.father.enabled}
                                onCheckedChange={(checked) => setParents({ ...parents, father: { ...parents.father, enabled: checked as boolean } })}
                            />
                            <Label htmlFor="father-enable">Include Father</Label>
                        </div>
                        {parents.father.enabled && (
                            <div className="grid grid-cols-2 gap-4 pl-6 animate-in fade-in">
                                <Input
                                    placeholder="Father's Name"
                                    value={parents.father.name}
                                    onChange={e => setParents({ ...parents, father: { ...parents.father, name: e.target.value } })}
                                />
                                <div className="space-y-0.5">
                                    <Input
                                        type="number"
                                        placeholder="Age"
                                        value={parents.father.age}
                                        onChange={e => setParents({ ...parents, father: { ...parents.father, age: e.target.value } })}
                                    />
                                    <p className="text-[10px] text-gray-400">Current Age (Years)</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Mother */}
                    <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="mother-enable"
                                checked={parents.mother.enabled}
                                onCheckedChange={(checked) => setParents({ ...parents, mother: { ...parents.mother, enabled: checked as boolean } })}
                            />
                            <Label htmlFor="mother-enable">Include Mother</Label>
                        </div>
                        {parents.mother.enabled && (
                            <div className="grid grid-cols-2 gap-4 pl-6 animate-in fade-in">
                                <Input
                                    placeholder="Mother's Name"
                                    value={parents.mother.name}
                                    onChange={e => setParents({ ...parents, mother: { ...parents.mother, name: e.target.value } })}
                                />
                                <div className="space-y-0.5">
                                    <Input
                                        type="number"
                                        placeholder="Age"
                                        value={parents.mother.age}
                                        onChange={e => setParents({ ...parents, mother: { ...parents.mother, age: e.target.value } })}
                                    />
                                    <p className="text-[10px] text-gray-400">Current Age (Years)</p>
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Children Section */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Baby size={18} className="text-pink-500" />
                        Children
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {children.length > 0 && (
                        <div className="space-y-2">
                            {children.map((child, idx) => (
                                <div key={child.id} className="flex items-center gap-3 bg-secondary/50 p-2 rounded-lg">
                                    <span className="text-sm font-medium text-gray-700 w-20">Child {idx + 1}</span>
                                    <span className="text-sm text-gray-600 flex-1">{child.name}</span>
                                    <span className="text-sm text-gray-500">Age: {child.age}</span>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeChild(child.id)}
                                        className="h-8 w-8 text-destructive hover:text-destructive/90"
                                    >
                                        <Trash2 size={16} />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex items-end gap-3">
                        <div className="flex-1 space-y-1">
                            <Label className="text-xs">Child Name</Label>
                            <Input
                                placeholder="Name"
                                value={newChild.name}
                                onChange={e => setNewChild({ ...newChild, name: e.target.value })}
                            />
                        </div>
                        <div className="flex-1 space-y-1">
                            <Label className="text-xs">Current Age</Label>
                            <Input
                                type="number"
                                placeholder="Age"
                                value={newChild.age}
                                onChange={e => setNewChild({ ...newChild, age: e.target.value })}
                            />
                        </div>
                        <Button
                            onClick={addChild}
                            size="icon"
                            className="bg-blue-100 text-blue-600 hover:bg-blue-200 shadow-none border border-blue-200"
                        >
                            <Plus size={20} />
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Contact & Address */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Briefcase size={18} className="text-orange-500" />
                        Professional & Contact
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Mobile Number</Label>
                            <Input
                                placeholder="+91 98765 43210"
                                value={contactDetails.mobile}
                                onChange={e => setContactDetails({ ...contactDetails, mobile: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input
                                type="email"
                                placeholder="you@example.com"
                                value={contactDetails.email}
                                onChange={e => setContactDetails({ ...contactDetails, email: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Designation</Label>
                            <Input
                                placeholder="Software Engineer"
                                value={contactDetails.designation}
                                onChange={e => setContactDetails({ ...contactDetails, designation: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Organisation</Label>
                            <Input
                                placeholder="Acme Corp"
                                value={contactDetails.organisation}
                                onChange={e => setContactDetails({ ...contactDetails, organisation: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Address</Label>
                        <Textarea
                            placeholder="Full residential address..."
                            value={address}
                            onChange={e => setAddress(e.target.value)}
                            className="min-h-[80px]"
                        />
                    </div>
                </CardContent>
            </Card>

            <Button
                onClick={handleSubmit}
                disabled={!primary.name || !primary.dob}
                className="w-full h-12 text-base shadow-lg shadow-blue-500/20"
                variant="default"
            >
                Save & Continue →
            </Button>
        </div>
    );
}
