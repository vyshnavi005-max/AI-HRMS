import { useState, useEffect } from 'react'
import axios from 'axios'
import { LuStar, LuZap } from 'react-icons/lu'

const TABS = [
    { key: 'productivity', label: 'Productivity', icon: LuStar },
    { key: 'skillgap', label: 'Skill Gap', icon: LuZap },
]

function GradeColor(grade) {
    if (grade === 'A') return 'text-green-600 bg-green-50 border-green-100'
    if (grade === 'B') return 'text-blue-600 bg-blue-50 border-blue-100'
    if (grade === 'C') return 'text-amber-600 bg-amber-50 border-amber-100'
    if (grade === 'D') return 'text-orange-600 bg-orange-50 border-orange-100'
    return 'text-red-600 bg-red-50 border-red-100'
}

export default function AIInsights() {
    const [tab, setTab] = useState('productivity')
    const [loading, setLoading] = useState(false)

    // productivity state
    const [prodData, setProdData] = useState(null)
    // skill gap state
    const [gapData, setGapData] = useState(null)

    useEffect(() => {
        if (tab === 'productivity' && !prodData) fetchProductivity()
        if (tab === 'skillgap' && !gapData) fetchSkillGap()
    }, [tab])

    const fetchProductivity = async () => {
        setLoading(true)
        try {
            const res = await axios.get('/api/ai/productivity')
            setProdData(res.data)
        } catch (err) { console.error(err) }
        finally { setLoading(false) }
    }

    const fetchSkillGap = async () => {
        setLoading(true)
        try {
            const res = await axios.get('/api/ai/skill-gap')
            setGapData(res.data)
        } catch (err) { console.error(err) }
        finally { setLoading(false) }
    }

    return (
        <div>
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                    <LuZap size={20} className="text-orange-600" />
                </div>
                <div>
                    <h2 className="text-lg lg:text-xl font-bold text-stone-900">AI Insights</h2>
                    <p className="text-stone-500 text-sm">Powered by Gemini AI + rule-based scoring</p>
                </div>
            </div>

            {/* tabs */}
            <div className="flex gap-1 bg-stone-100 p-1 rounded-xl mb-6 w-fit">
                {TABS.map(t => (
                    <button key={t.key} onClick={() => setTab(t.key)}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition ${tab === t.key ? 'bg-white text-orange-600 shadow-sm' : 'text-stone-500 hover:text-stone-700'
                            }`}>
                        <t.icon size={15} /> {t.label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex flex-col items-center gap-3 py-20">
                    <div className="w-10 h-10 rounded-full border-4 border-orange-100 border-t-orange-600 animate-spin" />
                    <p className="text-stone-400 text-sm">Analyzing...</p>
                </div>
            ) : (
                <>
                    {/* ── PRODUCTIVITY TAB ── */}
                    {tab === 'productivity' && prodData && (
                        <div className="space-y-4">
                            {prodData.aiSummary && (
                                <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 flex gap-3">
                                    <LuStar size={18} className="text-orange-500 mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-xs font-semibold text-orange-600 mb-1">AI Summary</p>
                                        <p className="text-sm text-stone-700 leading-relaxed">{prodData.aiSummary}</p>
                                    </div>
                                </div>
                            )}
                            <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm">
                                <table className="w-full text-sm">
                                    <thead className="bg-stone-50 border-b border-stone-200">
                                        <tr>
                                            <th className="text-left px-5 py-3 text-xs font-semibold text-stone-500 uppercase">Employee</th>
                                            <th className="text-left px-5 py-3 text-xs font-semibold text-stone-500 uppercase">Score</th>
                                            <th className="text-left px-5 py-3 text-xs font-semibold text-stone-500 uppercase">Grade</th>
                                            <th className="text-left px-5 py-3 text-xs font-semibold text-stone-500 uppercase hidden sm:table-cell">Tasks</th>
                                            <th className="text-left px-5 py-3 text-xs font-semibold text-stone-500 uppercase hidden md:table-cell">Insight</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-stone-100">
                                        {prodData.employees.map(emp => (
                                            <tr key={emp.id} className="hover:bg-stone-50 transition">
                                                <td className="px-5 py-3">
                                                    <p className="font-medium text-stone-900">{emp.name}</p>
                                                    <p className="text-xs text-stone-400">{emp.role}</p>
                                                </td>
                                                <td className="px-5 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-16 h-2 bg-stone-100 rounded-full overflow-hidden">
                                                            <div className="h-full bg-orange-500 rounded-full transition-all" style={{ width: `${emp.score}%` }} />
                                                        </div>
                                                        <span className="text-stone-700 font-medium">{emp.score}</span>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3">
                                                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold border ${GradeColor(emp.grade)}`}>{emp.grade}</span>
                                                </td>
                                                <td className="px-5 py-3 text-xs text-stone-500 hidden sm:table-cell">
                                                    {emp.stats.completed}/{emp.stats.total} done
                                                    {emp.stats.overdue > 0 && <span className="text-red-500 ml-1">({emp.stats.overdue} overdue)</span>}
                                                </td>
                                                <td className="px-5 py-3 text-xs text-stone-500 hidden md:table-cell max-w-xs truncate">{emp.insight}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {prodData.employees.length === 0 && (
                                    <p className="text-center text-stone-400 py-10 text-sm">No employees found. Add some first.</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ── SKILL GAP TAB ── */}
                    {tab === 'skillgap' && gapData && (
                        <div className="space-y-4">
                            {gapData.aiSummary && (
                                <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 flex gap-3">
                                    <LuStar size={18} className="text-orange-500 mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-xs font-semibold text-orange-600 mb-1">AI Summary</p>
                                        <p className="text-sm text-stone-700 leading-relaxed">{gapData.aiSummary}</p>
                                    </div>
                                </div>
                            )}
                            <div className="grid gap-3 md:grid-cols-2">
                                {gapData.employees.map(emp => {
                                    const g = emp.gap
                                    const barColor = g.coveragePercent >= 80 ? 'bg-green-500' :
                                        g.coveragePercent >= 50 ? 'bg-amber-500' : 'bg-red-500'
                                    return (
                                        <div key={emp.id} className="bg-white border border-stone-200 rounded-2xl p-4 shadow-sm">
                                            <div className="flex items-center justify-between mb-2">
                                                <div>
                                                    <p className="font-semibold text-stone-900 text-sm">{emp.name}</p>
                                                    <p className="text-xs text-stone-400">{emp.role} · {emp.department}</p>
                                                </div>
                                                <span className="text-lg font-bold text-stone-700">{g.coveragePercent}%</span>
                                            </div>
                                            <div className="w-full h-2 bg-stone-100 rounded-full mb-3">
                                                <div className={`h-full ${barColor} rounded-full transition-all`} style={{ width: `${g.coveragePercent}%` }} />
                                            </div>
                                            {g.missing.length > 0 && (
                                                <div>
                                                    <p className="text-xs text-stone-500 mb-1">Missing skills:</p>
                                                    <div className="flex flex-wrap gap-1">
                                                        {g.missing.map(s => (
                                                            <span key={s} className="bg-red-50 text-red-600 text-xs px-2 py-0.5 rounded-md border border-red-100">{s}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            {g.has.length > 0 && (
                                                <div className="mt-2">
                                                    <p className="text-xs text-stone-500 mb-1">Current skills:</p>
                                                    <div className="flex flex-wrap gap-1">
                                                        {g.has.map(s => (
                                                            <span key={s} className="bg-green-50 text-green-600 text-xs px-2 py-0.5 rounded-md border border-green-100">{s}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                            {gapData.employees.length === 0 && (
                                <p className="text-center text-stone-400 py-10 text-sm">No employees found.</p>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
