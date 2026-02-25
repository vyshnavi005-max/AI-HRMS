import React, { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import Sidebar from '../components/Sidebar'
import { LuPlus, LuPencil, LuX, LuCalendar, LuUser } from 'react-icons/lu'

const PRIORITIES = ['Low', 'Medium', 'High']
const STATUSES = ['Assigned', 'In Progress', 'Completed']

const STATUS_STYLES = {
    'Assigned': 'bg-blue-50 text-blue-600 border-blue-100',
    'In Progress': 'bg-amber-50 text-amber-600 border-amber-100',
    'Completed': 'bg-green-50 text-green-600 border-green-100',
};
const PRIORITY_STYLES = {
    'Low': 'bg-slate-100 text-slate-500',
    'Medium': 'bg-amber-50 text-amber-600',
    'High': 'bg-red-50 text-red-500',
};
const PRIORITY_DOT = { Low: 'bg-slate-300', Medium: 'bg-amber-400', High: 'bg-red-400' };

const emptyForm = { title: '', description: '', employee_id: '', required_skills: '', priority: 'Medium', due_date: '' };

export default function Tasks() {
    const [tasks, setTasks] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editTask, setEditTask] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [updatingId, setUpdatingId] = useState(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [tasksRes, empsRes] = await Promise.all([axios.get('/api/tasks'), axios.get('/api/employees')]);
            setTasks(tasksRes.data); setEmployees(empsRes.data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const openAdd = () => { setEditTask(null); setForm(emptyForm); setError(''); setShowModal(true); };
    const openEdit = (task) => {
        setEditTask(task);
        setForm({ title: task.title, description: task.description || '', employee_id: task.employee_id || '', required_skills: Array.isArray(task.required_skills) ? task.required_skills.join(', ') : '', priority: task.priority, due_date: task.due_date ? task.due_date.split('T')[0] : '' });
        setError(''); setShowModal(true);
    };
    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault(); setError(''); setSaving(true);
        const payload = { ...form, employee_id: form.employee_id || null, required_skills: form.required_skills ? form.required_skills.split(',').map((s) => s.trim()).filter(Boolean) : [] };
        try {
            if (editTask) await axios.put(`/api/tasks/${editTask.id}`, payload);
            else await axios.post('/api/tasks', payload);
            setShowModal(false); fetchData();
        } catch (err) { setError(err.response?.data?.error || 'Failed to save task.'); }
        finally { setSaving(false); }
    };

    const handleStatusChange = async (taskId, newStatus) => {
        setUpdatingId(taskId);
        try { const res = await axios.patch(`/api/tasks/${taskId}/status`, { status: newStatus }); setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, ...res.data } : t))); }
        catch { alert('Failed to update status.'); }
        finally { setUpdatingId(null); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this task?')) return;
        try { await axios.delete(`/api/tasks/${id}`); fetchData(); }
        catch { alert('Failed to delete task.'); }
    };

    const filtered = filterStatus ? tasks.filter((t) => t.status === filterStatus) : tasks;
    const stats = {
        total: tasks.length,
        assigned: tasks.filter((t) => t.status === 'Assigned').length,
        inProgress: tasks.filter((t) => t.status === 'In Progress').length,
        completed: tasks.filter((t) => t.status === 'Completed').length,
    };

    const fieldCls = "w-full bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition";
    const selectCls = "w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition";

    return (
        <div className="flex min-h-screen bg-slate-50">
            <Sidebar />
            <main className="flex-1 p-4 pt-20 lg:p-8 lg:pt-8 overflow-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
                    <div>
                        <h1 className="text-xl lg:text-2xl font-bold text-slate-900">Tasks</h1>
                        <p className="text-slate-500 text-sm mt-0.5">{tasks.length} total tasks</p>
                    </div>
                    <button onClick={openAdd} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition shadow-sm flex items-center gap-2 self-start sm:self-auto">
                        <LuPlus size={15} /> Assign Task
                    </button>
                </div>

                {/* Stat Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                    {[
                        { label: 'Total', value: stats.total, bg: 'bg-slate-100', border: 'border-slate-200', val: 'text-slate-700' },
                        { label: 'Assigned', value: stats.assigned, bg: 'bg-blue-50', border: 'border-blue-100', val: 'text-blue-700' },
                        { label: 'In Progress', value: stats.inProgress, bg: 'bg-amber-50', border: 'border-amber-100', val: 'text-amber-700' },
                        { label: 'Completed', value: stats.completed, bg: 'bg-green-50', border: 'border-green-100', val: 'text-green-700' },
                    ].map(({ label, value, bg, border, val }) => (
                        <div key={label} className={`${bg} border ${border} rounded-2xl p-4`}>
                            <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">{label}</p>
                            <p className={`text-3xl font-bold mt-1 ${val}`}>{value}</p>
                        </div>
                    ))}
                </div>

                {/* Filter Tabs */}
                <div className="flex flex-wrap gap-2 mb-5">
                    {['', ...STATUSES].map((s) => (
                        <button key={s || 'all'} onClick={() => setFilterStatus(s)}
                            className={`px-4 py-1.5 rounded-xl text-sm font-medium transition ${filterStatus === s ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-slate-500 border border-slate-200 hover:border-indigo-300 hover:text-indigo-600'}`}>
                            {s || 'All'}
                        </button>
                    ))}
                </div>

                {/* Task Cards */}
                {loading ? (
                    <div className="flex flex-col items-center gap-3 py-16">
                        <div className="w-10 h-10 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin" />
                        <p className="text-slate-400 text-sm">Loading tasks...</p>
                    </div>
                ) : filtered.length === 0 ? <div className="text-center text-slate-400 py-16">{filterStatus ? `No ${filterStatus} tasks.` : 'No tasks yet. Assign the first task!'}</div>
                    : (
                        <div className="space-y-3">
                            {filtered.map((task) => (
                                <div key={task.id} className="bg-white border border-slate-200 rounded-2xl px-5 py-4 hover:border-indigo-200 hover:shadow-sm transition group shadow-sm">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex gap-3 flex-1 min-w-0">
                                            <span className={`mt-2 w-1.5 h-1.5 rounded-full shrink-0 ${PRIORITY_DOT[task.priority]}`} />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                                    <h3 className="text-slate-900 font-semibold text-sm">{task.title}</h3>
                                                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_STYLES[task.status]}`}>{task.status}</span>
                                                    <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${PRIORITY_STYLES[task.priority]}`}>{task.priority}</span>
                                                </div>
                                                {task.description && <p className="text-slate-400 text-xs mb-2 line-clamp-1">{task.description}</p>}
                                                <div className="flex items-center flex-wrap gap-3 text-xs text-slate-400">
                                                    {task.employee_name ? (
                                                        <span className="flex items-center gap-1">
                                                            <span className="w-4 h-4 rounded bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-bold">{task.employee_name[0]}</span>
                                                            {task.employee_name} · {task.employee_role}
                                                        </span>
                                                    ) : <span className="text-slate-300 italic">Unassigned</span>}
                                                    {task.due_date && (
                                                        <span className={new Date(task.due_date) < new Date() && task.status !== 'Completed' ? 'text-red-400 font-medium' : ''}>
                                                            Due {new Date(task.due_date).toLocaleDateString()}
                                                        </span>
                                                    )}
                                                    {task.required_skills?.length > 0 && (
                                                        <div className="flex gap-1">
                                                            {task.required_skills.slice(0, 3).map((s) => (
                                                                <span key={s} className="bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded text-[10px] border border-indigo-100">{s}</span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0">
                                            <select value={task.status} disabled={updatingId === task.id} onChange={(e) => handleStatusChange(task.id, e.target.value)}
                                                className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-indigo-400 transition disabled:opacity-50">
                                                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                                                <button onClick={() => openEdit(task)} className="flex items-center gap-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1.5 rounded-lg transition"><LuPencil size={12} /> Edit</button>
                                                <button onClick={() => handleDelete(task.id)} className="flex items-center gap-1 text-xs bg-red-50 hover:bg-red-100 text-red-500 px-2.5 py-1.5 rounded-lg transition"><LuX size={12} /></button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                {/* Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 shadow-2xl shadow-slate-200 max-h-[90vh] overflow-y-auto">
                            <div className="flex items-center justify-between mb-5">
                                <h2 className="text-lg font-semibold text-slate-900">{editTask ? 'Edit Task' : 'Assign New Task'}</h2>
                                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                            </div>
                            {error && <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 mb-4 text-sm">{error}</div>}
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Title *</label>
                                    <input name="title" value={form.title} onChange={handleChange} required placeholder="Implement user auth module" className={fieldCls} />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Description</label>
                                    <textarea name="description" value={form.description} onChange={handleChange} rows={3} placeholder="Optional details..." className={`${fieldCls} resize-none`} />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-600 mb-1.5">Assign To</label>
                                        <select name="employee_id" value={form.employee_id} onChange={handleChange} className={selectCls}>
                                            <option value="">Unassigned</option>
                                            {employees.filter((e) => e.is_active).map((emp) => <option key={emp.id} value={emp.id}>{emp.name} ({emp.role})</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-600 mb-1.5">Priority</label>
                                        <select name="priority" value={form.priority} onChange={handleChange} className={selectCls}>
                                            {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-600 mb-1.5">Due Date</label>
                                        <input type="date" name="due_date" value={form.due_date} onChange={handleChange} className={selectCls} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-600 mb-1.5">Required Skills</label>
                                        <input name="required_skills" value={form.required_skills} onChange={handleChange} placeholder="React, Node.js" className={fieldCls} />
                                    </div>
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-2.5 rounded-xl text-sm transition">Cancel</button>
                                    <button type="submit" disabled={saving} className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl text-sm transition">
                                        {saving ? 'Saving...' : editTask ? 'Save Changes' : 'Assign Task'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
