import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import { LuBrain, LuChevronDown, LuChevronUp } from 'react-icons/lu';

const gradeColor = { A: 'text-green-600', B: 'text-blue-600', C: 'text-amber-600', D: 'text-orange-500', F: 'text-red-500', 'N/A': 'text-slate-400' };
const gradeRing = { A: '#22c55e', B: '#6366f1', C: '#f59e0b', D: '#f97316', F: '#ef4444', 'N/A': '#cbd5e1' };
const gradeBg = { A: 'bg-green-50 text-green-700 border-green-100', B: 'bg-indigo-50 text-indigo-700 border-indigo-100', C: 'bg-amber-50 text-amber-700 border-amber-100', D: 'bg-orange-50 text-orange-600 border-orange-100', F: 'bg-red-50 text-red-600 border-red-100', 'N/A': 'bg-slate-100 text-slate-500 border-slate-200' };

function ScoreRing({ score, grade, size = 56 }) {
    const r = (size / 2) - 6;
    const circ = 2 * Math.PI * r;
    const dash = ((score || 0) / 100) * circ;
    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f1f5f9" strokeWidth="6" />
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={gradeRing[grade] || '#cbd5e1'} strokeWidth="6"
                strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
                style={{ transition: 'stroke-dasharray 0.8s ease' }} />
        </svg>
    );
}

export default function AIInsights() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState(null);

    const fetchData = useCallback(() => {
        setLoading(true);
        axios.get('/api/ai/productivity')
            .then((r) => setData(r.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const avg = data.length > 0 ? Math.round(data.reduce((s, e) => s + e.score, 0) / data.length) : 0;

    return (
        <div className="flex min-h-screen bg-slate-50">
            <Sidebar />
            <main className="flex-1 p-4 pt-20 lg:p-8 lg:pt-8 overflow-auto">

                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2.5 bg-indigo-100 rounded-xl border border-indigo-200">
                        <LuBrain size={20} className="text-indigo-600" />
                    </div>
                    <div>
                        <h1 className="text-xl lg:text-2xl font-bold text-slate-900">AI Productivity Scores</h1>
                        <p className="text-slate-500 text-sm mt-0.5">Computed from task performance — no external API</p>
                    </div>
                </div>

                {/* Loading */}
                {loading ? (
                    <div className="flex flex-col items-center gap-3 py-24">
                        <div className="w-12 h-12 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin" />
                        <p className="text-slate-400 text-sm">Computing scores...</p>
                    </div>
                ) : data.length === 0 ? (
                    <div className="text-center text-slate-400 py-24">No employees found. Add employees and assign tasks first.</div>
                ) : (
                    <>
                        {/* Summary Cards */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                            {[
                                { label: 'Team Average', value: `${avg}%`, color: avg >= 70 ? 'text-green-600' : avg >= 40 ? 'text-amber-600' : 'text-red-500', bg: 'bg-green-50 border-green-100' },
                                { label: 'Top Performer', value: data[0]?.name || '—', color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-100' },
                                { label: 'A-Grade', value: data.filter(e => e.grade === 'A').length, color: 'text-green-600', bg: 'bg-green-50 border-green-100' },
                                { label: 'Needs Attention', value: data.filter(e => ['D', 'F'].includes(e.grade)).length, color: 'text-red-500', bg: 'bg-red-50 border-red-100' },
                            ].map(({ label, value, color, bg }) => (
                                <div key={label} className={`border rounded-2xl p-4 ${bg}`}>
                                    <p className="text-slate-500 text-xs mb-1">{label}</p>
                                    <p className={`text-xl font-bold truncate ${color}`}>{value}</p>
                                </div>
                            ))}
                        </div>

                        {/* Employee Score Cards */}
                        <div className="space-y-2">
                            {data.map((emp, i) => (
                                <div key={emp.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:border-indigo-200 transition">
                                    {/* Row */}
                                    <div className="flex items-center gap-4 px-4 py-3 cursor-pointer" onClick={() => setExpanded(expanded === emp.id ? null : emp.id)}>
                                        <span className="text-slate-400 font-bold w-5 text-right text-sm shrink-0">{i + 1}</span>

                                        <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
                                            <ScoreRing score={emp.score} grade={emp.grade} size={56} />
                                            <span className={`absolute text-xs font-bold ${gradeColor[emp.grade]}`}>{emp.grade}</span>
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="text-slate-900 font-semibold text-sm">{emp.name}</p>
                                                {!emp.is_active && <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">Inactive</span>}
                                            </div>
                                            <p className="text-slate-400 text-xs">{emp.role} · {emp.department}</p>
                                        </div>

                                        {/* Score bar — hidden on small screens */}
                                        <div className="w-36 hidden md:block shrink-0">
                                            <div className="flex justify-between text-xs mb-1">
                                                <span className="text-slate-400">Score</span>
                                                <span className={`font-semibold ${gradeColor[emp.grade]}`}>{emp.score}%</span>
                                            </div>
                                            <div className="bg-slate-100 rounded-full h-2 overflow-hidden">
                                                <div className="h-full rounded-full transition-all duration-700"
                                                    style={{ width: `${emp.score}%`, backgroundColor: gradeRing[emp.grade] }} />
                                            </div>
                                        </div>

                                        <div className="text-right shrink-0 hidden lg:block">
                                            <p className="text-slate-700 text-sm font-medium">{emp.stats?.completed ?? 0}/{emp.stats?.total ?? 0}</p>
                                            <p className="text-slate-400 text-xs">tasks done</p>
                                        </div>

                                        <div className="text-slate-400 shrink-0">
                                            {expanded === emp.id ? <LuChevronUp size={16} /> : <LuChevronDown size={16} />}
                                        </div>
                                    </div>

                                    {/* Expanded breakdown */}
                                    {expanded === emp.id && (
                                        <div className="border-t border-slate-100 px-4 py-4 grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50">
                                            {/* Score breakdown */}
                                            <div>
                                                <p className="text-slate-600 text-xs font-semibold mb-3 uppercase tracking-wider">Score Breakdown</p>
                                                <div className="space-y-2">
                                                    {[
                                                        { label: 'Base completion rate', value: emp.breakdown?.base ?? 0, color: 'bg-blue-500', neg: false },
                                                        { label: 'On-time speed bonus', value: emp.breakdown?.speedBonus ?? 0, color: 'bg-green-500', neg: false },
                                                        { label: 'Overdue penalty', value: -(emp.breakdown?.overduePenalty ?? 0), color: 'bg-red-400', neg: true },
                                                    ].map(({ label, value, color, neg }) => (
                                                        <div key={label}>
                                                            <div className="flex justify-between text-xs mb-1">
                                                                <span className="text-slate-500">{label}</span>
                                                                <span className={neg && value < 0 ? 'text-red-500' : 'text-slate-700'}>{neg && value < 0 ? '' : '+'}{value}</span>
                                                            </div>
                                                            <div className="bg-slate-200 rounded-full h-1">
                                                                <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.abs(value)}%` }} />
                                                            </div>
                                                        </div>
                                                    ))}
                                                    <div className="border-t border-slate-200 pt-2 flex justify-between text-sm">
                                                        <span className="text-slate-600 font-medium">Final Score</span>
                                                        <span className={`font-bold ${gradeColor[emp.grade]}`}>{emp.score}%</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* AI Insight + stats */}
                                            <div>
                                                <p className="text-slate-600 text-xs font-semibold mb-3 uppercase tracking-wider">AI Insight</p>
                                                <div className="bg-white border border-slate-200 rounded-xl p-3 mb-3">
                                                    <div className="flex gap-2">
                                                        <LuBrain size={14} className="text-indigo-500 shrink-0 mt-0.5" />
                                                        <p className="text-slate-600 text-xs leading-relaxed">{emp.insight}</p>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2 text-xs">
                                                    {[
                                                        { label: 'Total tasks', value: emp.stats?.total ?? 0 },
                                                        { label: 'Completed', value: emp.stats?.completed ?? 0 },
                                                        { label: 'On-time', value: emp.stats?.completedOnTime ?? 0 },
                                                        { label: 'Overdue', value: emp.stats?.overdue ?? 0 },
                                                    ].map(({ label, value }) => (
                                                        <div key={label} className="bg-white border border-slate-200 rounded-lg px-3 py-2">
                                                            <p className="text-slate-400">{label}</p>
                                                            <p className="text-slate-800 font-semibold">{value}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}
