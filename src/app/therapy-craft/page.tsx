'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
    Brain, User, FileText, Activity, Save, Send, Loader2, Sparkles,
    Stethoscope, Users, Copy, Check
} from 'lucide-react';
import {
    AGE_GROUPS, GENDERS, ETHNICITIES, OCCUPATIONS, EDUCATION_LEVELS
} from '@/definitions/demographics';
import {
    CONDITIONS, COMORBIDITIES, FAMILY_HISTORY,
    TRIGGERS, EMOTIONAL_STATES, PREDOMINANT_THOUGHTS
} from '@/definitions/clinical';
import { PERSONAS } from '@/definitions/personas';

interface Source {
    content: string;
    metadata?: Record<string, unknown>;
}

export default function TherapyCraftPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [generatedProtocol, setGeneratedProtocol] = useState('');
    const [sources, setSources] = useState<Source[]>([]);
    const [copied, setCopied] = useState(false);

    // State for form inputs
    const [demographics, setDemographics] = useState({
        ageGroup: '',
        gender: '',
        ethnicity: '',
        occupation: '',
        education: ''
    });

    const [clinical, setClinical] = useState({
        diagnosis: [] as string[],
        comorbidities: [] as string[],
        familyHistory: [] as string[],
        triggers: [] as string[],
        emotionalState: '',
        predominantThoughts: ''
    });

    const [personaId, setPersonaId] = useState(PERSONAS[0].id);
    const [topic, setTopic] = useState('');
    const [notes, setNotes] = useState('');
    const [useRag, setUseRag] = useState(true);
    const [manualContext, setManualContext] = useState('');

    // New controls
    const [sessionNumber, setSessionNumber] = useState('1');
    const [depth, setDepth] = useState(3);

    // Helper for multi-select toggle
    const toggleSelection = (
        currentList: string[],
        item: string,
        setter: (list: string[]) => void
    ) => {
        if (currentList.includes(item)) {
            setter(currentList.filter(i => i !== item));
        } else {
            setter([...currentList, item]);
        }
    };

    // Clean markdown artifacts while preserving structure
    const cleanProtocol = (text: string): string => {
        const cleaned = text
            // Remove #### and ### and ## and # for headers (convert to HTML)
            .replace(/^#### (.*?)$/gm, '<h4 class="text-lg font-semibold mt-4 mb-2">$1</h4>')
            .replace(/^### (.*?)$/gm, '<h3 class="text-xl font-semibold mt-5 mb-3">$1</h3>')
            .replace(/^## (.*?)$/gm, '<h2 class="text-2xl font-bold mt-6 mb-3">$1</h2>')
            .replace(/^# (.*?)$/gm, '<h1 class="text-3xl font-bold mt-6 mb-4">$1</h1>')
            // Remove ** for bold
            .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
            // Remove single * for italic
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            // Convert bullet points to styled divs
            .replace(/^- (.*?)$/gm, '<div class="ml-6 mb-2">• $1</div>')
            // Convert numbered lists
            .replace(/^(\d+)\. (.*?)$/gm, '<div class="ml-6 mb-2">$1. $2</div>')
            // Remove backticks
            .replace(/`([^`]+)`/g, '$1')
            // Convert line breaks to proper spacing
            .replace(/\n\n/g, '<br/><br/>');

        return cleaned;
    };

    const handleCopy = async () => {
        if (generatedProtocol) {
            // Copy plain text version (remove HTML tags)
            const plainText = generatedProtocol
                .replace(/\*\*/g, '')
                .replace(/^#{1,3} /gm, '')
                .replace(/\*/g, '');

            await navigator.clipboard.writeText(plainText);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleGenerate = async () => {
        if (!topic) {
            alert('Please enter a Therapy Goal/Topic');
            return;
        }

        setIsLoading(true);
        setGeneratedProtocol('');
        setSources([]);

        try {
            const response = await fetch('/api/therapy-craft', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    demographics,
                    clinical,
                    personaId,
                    topic,
                    notes,
                    useRag,
                    manualContext,
                    sessionNumber,
                    depth,
                })
            });

            const data = await response.json();

            if (data.success) {
                setGeneratedProtocol(data.protocol);
                setSources(data.sources || []);
            } else {
                alert('Error generating protocol: ' + data.error);
            }
        } catch (error) {
            console.error('Generation error:', error);
            alert('Failed to generate protocol');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-slate-900 dark:via-purple-950 dark:to-slate-900 p-4 md:p-8">

            <header className="max-w-7xl mx-auto mb-8 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-2 rounded-xl text-white shadow-lg">
                        <Brain className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
                            Therapy Craft <span className="text-purple-600 dark:text-purple-400">Studio</span>
                        </h1>
                        <p className="text-slate-600 dark:text-slate-400">Design custom therapeutic protocols with AI precision</p>
                    </div>
                </div>
                <Link
                    href="/"
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-colors flex items-center gap-2 font-medium"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back to Chat
                </Link>
            </header>

            <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* LEFT COLUMN: Inputs */}
                <div className="lg:col-span-5 space-y-6">

                    {/* Persona Selection */}
                    <section className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/20 dark:border-slate-700 p-6 rounded-2xl shadow-sm">
                        <h2 className="flex items-center gap-2 text-xl font-semibold mb-4 text-slate-800 dark:text-slate-100">
                            <User className="w-5 h-5 text-purple-600" /> Therapist Persona
                        </h2>
                        <select
                            value={personaId}
                            onChange={(e) => setPersonaId(e.target.value)}
                            className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                        >
                            {PERSONAS.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 italic">
                            {PERSONAS.find(p => p.id === personaId)?.description}
                        </p>
                    </section>

                    {/* Demographics */}
                    <section className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/20 dark:border-slate-700 p-6 rounded-2xl shadow-sm">
                        <h2 className="flex items-center gap-2 text-xl font-semibold mb-4 text-slate-800 dark:text-slate-100">
                            <Users className="w-5 h-5 text-blue-600" /> Patient Demographics
                        </h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-semibold uppercase text-slate-500 mb-1 block">Age Group</label>
                                <select
                                    className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm"
                                    value={demographics.ageGroup}
                                    onChange={e => setDemographics({ ...demographics, ageGroup: e.target.value })}
                                >
                                    <option value="">Select...</option>
                                    {AGE_GROUPS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-semibold uppercase text-slate-500 mb-1 block">Gender</label>
                                <select
                                    className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm"
                                    value={demographics.gender}
                                    onChange={e => setDemographics({ ...demographics, gender: e.target.value })}
                                >
                                    <option value="">Select...</option>
                                    {GENDERS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-semibold uppercase text-slate-500 mb-1 block">Ethnicity</label>
                                <select
                                    className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm"
                                    value={demographics.ethnicity}
                                    onChange={e => setDemographics({ ...demographics, ethnicity: e.target.value })}
                                >
                                    <option value="">Select...</option>
                                    {ETHNICITIES.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-semibold uppercase text-slate-500 mb-1 block">Education</label>
                                <select
                                    className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm"
                                    value={demographics.education}
                                    onChange={e => setDemographics({ ...demographics, education: e.target.value })}
                                >
                                    <option value="">Select...</option>
                                    {EDUCATION_LEVELS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                            </div>
                            <div className="col-span-2">
                                <label className="text-xs font-semibold uppercase text-slate-500 mb-1 block">Occupation</label>
                                <select
                                    className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm"
                                    value={demographics.occupation}
                                    onChange={e => setDemographics({ ...demographics, occupation: e.target.value })}
                                >
                                    <option value="">Select...</option>
                                    {OCCUPATIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                            </div>
                        </div>
                    </section>

                    {/* Clinical Profile */}
                    <section className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/20 dark:border-slate-700 p-6 rounded-2xl shadow-sm space-y-4">
                        <h2 className="flex items-center gap-2 text-xl font-semibold text-slate-800 dark:text-slate-100">
                            <Activity className="w-5 h-5 text-red-500" /> Clinical Profile
                        </h2>

                        {/* Primary Diagnosis - Multi Select */}
                        <div>
                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 block">Primary Condition(s)</label>
                            <div className="flex flex-wrap gap-2">
                                {CONDITIONS.map(c => (
                                    <button
                                        key={c}
                                        onClick={() => toggleSelection(clinical.diagnosis, c, (list) => setClinical({ ...clinical, diagnosis: list }))}
                                        className={`px-3 py-1 text-xs rounded-full border transition-all ${clinical.diagnosis.includes(c)
                                            ? 'bg-red-100 dark:bg-red-900/30 border-red-500 text-red-700 dark:text-red-300'
                                            : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-red-300'
                                            }`}
                                    >
                                        {c}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Comorbidities & Family History - Dropdowns/Multi Select simplified for space */}
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs font-semibold uppercase text-slate-500 mb-1 block">Comorbidities</label>
                                <div className="flex flex-wrap gap-2">
                                    {COMORBIDITIES.map(c => (
                                        <button
                                            key={c}
                                            onClick={() => toggleSelection(clinical.comorbidities, c, (list) => setClinical({ ...clinical, comorbidities: list }))}
                                            className={`px-2 py-1 text-xs rounded border transition-all ${clinical.comorbidities.includes(c) ? 'bg-indigo-100 dark:bg-indigo-900/30 border-indigo-500 text-indigo-700' : 'bg-slate-50 border-slate-200 text-slate-600'
                                                }`}
                                        >
                                            {c}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-semibold uppercase text-slate-500 mb-1 block">Family History</label>
                                <div className="flex flex-wrap gap-2">
                                    {FAMILY_HISTORY.map(h => (
                                        <button
                                            key={h}
                                            onClick={() => toggleSelection(clinical.familyHistory, h, (list) => setClinical({ ...clinical, familyHistory: list }))}
                                            className={`px-2 py-1 text-xs rounded border transition-all ${clinical.familyHistory.includes(h) ? 'bg-orange-100 dark:bg-orange-900/30 border-orange-500 text-orange-700' : 'bg-slate-50 border-slate-200 text-slate-600'
                                                }`}
                                        >
                                            {h}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1 block">Emotional State</label>
                                <select
                                    className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm"
                                    value={clinical.emotionalState}
                                    onChange={e => setClinical({ ...clinical, emotionalState: e.target.value })}
                                >
                                    <option value="">Select...</option>
                                    {EMOTIONAL_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1 block">Predominant Thought</label>
                                <select
                                    className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm"
                                    value={clinical.predominantThoughts}
                                    onChange={e => setClinical({ ...clinical, predominantThoughts: e.target.value })}
                                >
                                    <option value="">Select...</option>
                                    {PREDOMINANT_THOUGHTS.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-semibold uppercase text-slate-500 mb-1 block">Triggers</label>
                            <div className="flex flex-wrap gap-2">
                                {TRIGGERS.map(t => (
                                    <button
                                        key={t}
                                        onClick={() => toggleSelection(clinical.triggers, t, (list) => setClinical({ ...clinical, triggers: list }))}
                                        className={`px-2 py-1 text-xs rounded border transition-all ${clinical.triggers.includes(t) ? 'bg-rose-100 dark:bg-rose-900/30 border-rose-500 text-rose-700' : 'bg-slate-50 border-slate-200 text-slate-600'
                                            }`}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>

                    </section>

                    {/* Goal & Context */}
                    <section className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/20 dark:border-slate-700 p-6 rounded-2xl shadow-sm space-y-4">
                        <div>
                            <label className="flex items-center gap-2 text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2">
                                <FileText className="w-5 h-5 text-emerald-600" /> Therapy Goal / Topic
                            </label>
                            <textarea
                                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 min-h-[80px] focus:ring-2 focus:ring-emerald-500 outline-none"
                                placeholder="E.g., Dealing with a recent breakup and resulting social anxiety..."
                                value={topic}
                                onChange={e => setTopic(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 block">Additional Notes</label>
                            <textarea
                                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 min-h-[60px] text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                                placeholder="Any specific details not covered above..."
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                            />
                        </div>

                        <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                            <div className="flex items-center justify-between mb-4">
                                <label className="font-semibold text-slate-700 dark:text-slate-300">Context Source</label>
                                <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-lg">
                                    <button
                                        onClick={() => setUseRag(true)}
                                        className={`px-4 py-1.5 text-sm rounded-md transition-all ${useRag ? 'bg-white dark:bg-slate-700 shadow-sm font-medium text-purple-600' : 'text-slate-500'}`}
                                    >
                                        RAG (Auto)
                                    </button>
                                    <button
                                        onClick={() => setUseRag(false)}
                                        className={`px-4 py-1.5 text-sm rounded-md transition-all ${!useRag ? 'bg-white dark:bg-slate-700 shadow-sm font-medium text-purple-600' : 'text-slate-500'}`}
                                    >
                                        Manual
                                    </button>
                                </div>
                            </div>

                            {!useRag && (
                                <textarea
                                    className="w-full p-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 min-h-[100px] text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                                    placeholder="Paste relevant medical guidelines, study results, or verified facts here..."
                                    value={manualContext}
                                    onChange={e => setManualContext(e.target.value)}
                                />
                            )}
                            {useRag && (
                                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl border border-blue-100 dark:border-blue-800/30 text-xs text-blue-700 dark:text-blue-300 flex items-start gap-2">
                                    <Sparkles className="w-4 h-4 mt-0.5" />
                                    <p>System will automatically retrieve relevant clinical guidelines and protocols based on the patient&apos;s conditions and demographics.</p>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Refinement Controls */}
                    <section className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/20 dark:border-slate-700 p-6 rounded-2xl shadow-sm space-y-4">
                        <div className="flex items-center gap-2 text-xl font-semibold text-slate-800 dark:text-slate-100">
                            <Activity className="w-5 h-5 text-indigo-600" /> Session Details
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1 block">Session Number</label>
                                <input
                                    type="text"
                                    value={sessionNumber}
                                    onChange={(e) => setSessionNumber(e.target.value)}
                                    placeholder="e.g. 1"
                                    className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1 block">Detail Depth ({depth}/5)</label>
                                <input
                                    type="range"
                                    min="1"
                                    max="5"
                                    value={depth}
                                    onChange={(e) => setDepth(parseInt(e.target.value))}
                                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700"
                                />
                                <div className="flex justify-between text-xs text-slate-500 px-1 mt-1">
                                    <span>Brief</span>
                                    <span>Detailed</span>
                                </div>
                            </div>
                        </div>
                    </section>

                    <button
                        onClick={handleGenerate}
                        disabled={isLoading}
                        className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
                        {isLoading ? 'Crafting Protocol...' : 'Generate Therapy Protocol'}
                    </button>

                </div>

                {/* RIGHT COLUMN: Output */}
                <div className="lg:col-span-7 h-full">
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl shadow-2xl h-full min-h-[800px] flex flex-col overflow-hidden">

                        {/* Header */}
                        <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-purple-500" /> Generated Protocol
                            </h2>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleCopy}
                                    disabled={!generatedProtocol}
                                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
                                    title="Copy to clipboard"
                                >
                                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                    {copied ? 'Copied!' : 'Copy Text'}
                                </button>
                            </div>
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 overflow-y-auto p-8 relative">
                            {!generatedProtocol && !isLoading && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 opacity-50">
                                    <Brain className="w-24 h-24 mb-4" />
                                    <p className="text-lg">Ready to craft. Configure profile and generate.</p>
                                </div>
                            )}

                            {isLoading && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm z-10">
                                    <div className="relative">
                                        <div className="w-20 h-20 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <Brain className="w-8 h-8 text-purple-600 animate-pulse" />
                                        </div>
                                    </div>
                                    <p className="mt-6 text-lg font-medium text-slate-600 dark:text-slate-300 animate-pulse">
                                        Synthesizing Clinical Data...
                                    </p>
                                </div>
                            )}

                            {generatedProtocol && (
                                <div className="prose dark:prose-invert max-w-none">
                                    <div
                                        className="font-sans text-slate-800 dark:text-slate-200 leading-relaxed"
                                        style={{
                                            lineHeight: '1.8',
                                        }}
                                        dangerouslySetInnerHTML={{ __html: cleanProtocol(generatedProtocol) }}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Sources Footer */}
                        {sources.length > 0 && (
                            <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 text-sm">
                                <p className="font-semibold text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-2">
                                    <Stethoscope className="w-4 h-4" /> Referenced Clinical Guidelines ({sources.length})
                                </p>
                                <div className="flex gap-2 overflow-x-auto pb-2">
                                    {sources.map((source, i) => (
                                        <div key={i} className="flex-shrink-0 w-64 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm text-xs">
                                            <p className="line-clamp-2 text-slate-600 dark:text-slate-300 italic">
                                                &quot;{source.content?.substring(0, 100)}...&quot;
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </main>
        </div>
    );
}
