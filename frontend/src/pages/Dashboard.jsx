import React, { useState, useEffect } from 'react'
import axios from 'axios'
import Sidebar from '../components/Sidebar'
import { LuUsers, LuUserCheck, LuClipboardList, LuTrophy, LuBrain, LuClock } from 'react-icons/lu'

const STATUS_CHIP = {
    'Assigned': 'bg-blue-50 text-blue-600 border border-blue-100',
    'In Progress': 'bg-amber-50 text-amber-600 border border-amber-100',
    'Completed': 'bg-green-50 text-green-600 border border-green-100',
}
const PRIORITY_DOT = { Low: 'bg-slate-300', Medium: 'bg-amber-400', High: 'bg-red-400' }

function ProductivityBar({ score }) {
    const pct = Number(score) || 0;
    const color = pct >= 75 ? 'bg-green-500' : pct >= 40 ? 'bg-amber-400' : 'bg-red-400';
    const textColor = pct >= 75 ? 'text-green-600' : pct >= 40 ? 'text-amber-600' : 'text-red-600';
    return (
        <div className="flex items-center gap-2">
            <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${pct}%` }} />
            </div>
            <span className={`text-xs font-semibold w-8 text-right ${textColor}`}>{pct}%</span>
        </div>
    );
}

function DonutRing({ value, total, color, label }) {
    const pct = total > 0 ? (value / total) * 100 : 0;
    const r = 28;
    const circ = 2 * Math.PI * r;
    const dash = (pct / 100) * circ;
    return (
        <div className="flex flex-col items-center gap-1">
            <svg width="72" height="72" viewBox="0 0 72 72" className="-rotate-90">
                <circle cx="36" cy="36" r={r} fill="none" stroke="#f1f5f9" strokeWidth="6" />
                <circle cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="6"
                    strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
                    style={{ transition: 'stroke-dasharray 0.8s ease' }} />
            </svg>
            <span className="text-slate-900 font-bold text-lg -mt-1">{value}</span>
            <span className="text-slate-500 text-xs">{label}</span>
        </div>
    );
}

export default function Dashboard() {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        axios.get('/api/dashboard')
            .then(res => setData(res.data))
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [])

    if (loading) return (
        <div className="flex min-h-screen bg-slate-50">
            <Sidebar />
            <main className="flex-1 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin" />
                    <p className="text-slate-400 text-sm font-medium">Loading dashboard...</p>
                </div>
            </main>
        </div>
    );

    const emp = data?.employees || {};
    const tasks = data?.tasks || {};
    const top = data?.topEmployees || [];
    const recent = data?.recentTasks || [];
    const depts = data?.deptBreakdown || [];

    const completionRate = tasks.total > 0 ? Math.round((tasks.completed / tasks.total) * 100) : 0;

    return (
        <div className="flex min-h-screen bg-slate-50">
            <Sidebar />
            <main className="flex-1 p-4 pt-20 lg:p-8 lg:pt-8 overflow-auto">

                <div className="mb-6">
                    <h1 className="text-xl lg:text-2xl font-bold text-slate-900">Workforce Dashboard</h1>
                    <p className="text-slate-500 text-sm mt-0.5">Real-time overview of your organization</p>
                </div>

                {/* Stat Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                    {[
                        { label: 'Total Employees', value: emp.total || 0, sub: `${emp.inactive || 0} inactive`, Icon: LuUsers, bg: 'bg-indigo-50', border: 'border-indigo-100', val: 'text-indigo-700', icon: 'text-indigo-400' },
                        { label: 'Active Employees', value: emp.active || 0, sub: `of ${emp.total || 0} total`, Icon: LuUserCheck, bg: 'bg-green-50', border: 'border-green-100', val: 'text-green-700', icon: 'text-green-400' },
                        { label: 'Assigned Tasks', value: tasks.assigned || 0, sub: `${tasks.in_progress || 0} in progress`, Icon: LuClipboardList, bg: 'bg-blue-50', border: 'border-blue-100', val: 'text-blue-700', icon: 'text-blue-400' },
                        { label: 'Completed Tasks', value: tasks.completed || 0, sub: `${completionRate}% rate`, Icon: LuTrophy, bg: 'bg-amber-50', border: 'border-amber-100', val: 'text-amber-700', icon: 'text-amber-400' },
                    ].map(({ label, value, sub, Icon, bg, border, val, icon }) => (
                        <div key={label} className={`${bg} border ${border} rounded-2xl p-4`}>
                            <div className="flex items-start justify-between mb-3">
                                <div className={`p-1.5 bg-white rounded-lg shadow-sm`}>
                                    <Icon size={16} className={icon} />
                                </div>
                                <span className={`text-2xl font-bold ${val}`}>{value}</span>
                            </div>
                            <p className="text-slate-700 text-xs font-semibold">{label}</p>
                            <p className="text-slate-400 text-[10px] mt-0.5">{sub}</p>
                        </div>
                    ))}
                </div>

                {/* Middle row */}
                <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 mb-6">
                    <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                        <h2 className="text-slate-900 font-semibold text-sm mb-4">Task Status Overview</h2>
                        <div className="flex items-center justify-around">
                            <DonutRing value={Number(tasks.assigned) || 0} total={Number(tasks.total) || 1} color="#6366f1" label="Assigned" />
                            <DonutRing value={Number(tasks.in_progress) || 0} total={Number(tasks.total) || 1} color="#f59e0b" label="In Progress" />
                            <DonutRing value={Number(tasks.completed) || 0} total={Number(tasks.total) || 1} color="#22c55e" label="Completed" />
                            <DonutRing value={Number(tasks.overdue) || 0} total={Number(tasks.total) || 1} color="#ef4444" label="Overdue" />
                        </div>
                        <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between text-xs text-slate-400">
                            <span>Total: <span className="text-slate-700 font-semibold">{tasks.total || 0}</span></span>
                            <span>Completion: <span className={`font-semibold ${completionRate >= 70 ? 'text-green-600' : completionRate >= 40 ? 'text-amber-600' : 'text-red-500'}`}>{completionRate}%</span></span>
                        </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                        <h2 className="text-slate-900 font-semibold text-sm mb-4">Employees by Dept</h2>
                        {depts.length === 0 ? (
                            <p className="text-slate-400 text-xs">No department data yet.</p>
                        ) : (
                            <div className="space-y-3">
                                {depts.map((d) => {
                                    const pct = Math.round((d.count / (emp.active || 1)) * 100);
                                    return (
                                        <div key={d.department}>
                                            <div className="flex justify-between text-xs mb-1">
                                                <span className="text-slate-600 truncate">{d.department}</span>
                                                <span className="text-slate-400 ml-2 shrink-0">{d.count}</span>
                                            </div>
                                            <div className="bg-slate-100 rounded-full h-1.5">
                                                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Bottom row */}
                <div className="flex flex-col lg:grid lg:grid-cols-2 gap-4">
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <LuBrain size={15} className="text-indigo-500" />
                                <h2 className="text-slate-900 font-semibold text-sm">AI Productivity Scores</h2>
                            </div>
                            <span className="text-xs text-slate-400">completion rate</span>
                        </div>
                        {top.length === 0 ? (
                            <p className="text-slate-400 text-sm">No data yet.</p>
                        ) : (
                            <div className="space-y-4">
                                {top.map((e, i) => (
                                    <div key={e.id}>
                                        <div className="flex items-center gap-3 mb-1.5">
                                            <span className="text-xs text-slate-400 w-3">{i + 1}</span>
                                            <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs shrink-0">
                                                {e.name[0]}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-slate-800 text-xs font-medium truncate">{e.name}</p>
                                                <p className="text-slate-400 text-[10px]">{e.role} · {e.completed_tasks}/{e.total_tasks} tasks</p>
                                            </div>
                                        </div>
                                        <div className="ml-10">
                                            <ProductivityBar score={e.productivity_score} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                            <LuClock size={15} className="text-slate-400" />
                            <h2 className="text-slate-900 font-semibold text-sm">Recent Tasks</h2>
                        </div>
                        {recent.length === 0 ? (
                            <p className="text-slate-400 text-sm">No tasks yet.</p>
                        ) : (
                            <div className="space-y-3">
                                {recent.map((task) => (
                                    <div key={task.id} className="flex items-start gap-3">
                                        <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${PRIORITY_DOT[task.priority] || 'bg-slate-300'}`} />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-slate-800 text-xs font-medium truncate">{task.title}</p>
                                            <p className="text-slate-400 text-[10px] mt-0.5">
                                                {task.employee_name || 'Unassigned'} · {new Date(task.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 font-medium ${STATUS_CHIP[task.status]}`}>
                                            {task.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

