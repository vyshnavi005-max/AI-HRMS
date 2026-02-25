import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { LuPlus, LuPencil, LuX, LuCalendar, LuUser } from 'react-icons/lu'

const PRIORITIES = ['Low', 'Medium', 'High']
const STATUSES = ['Assigned', 'In Progress', 'Completed']

const STATUS_STYLES = {
    'Assigned': 'bg-blue-50 text-blue-600 border-blue-100',
    'In Progress': 'bg-amber-50 text-amber-600 border-amber-100',
    'Completed': 'bg-green-50 text-green-600 border-green-100',
};
const PRIORITY_STYLES = {
    'Low': 'bg-stone-100 text-stone-500',
    'Medium': 'bg-amber-50 text-amber-600',
    'High': 'bg-red-50 text-red-500',
};
const PRIORITY_DOT = { Low: 'bg-stone-300', Medium: 'bg-amber-400', High: 'bg-red-400' };

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

    const fieldCls = "w-full bg-stone-50 border border-stone-200 text-stone-900 placeholder-stone-400 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition";
    const selectCls = "w-full bg-stone-50 border border-stone-200 text-stone-900 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition";

    return (
        <>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
                <div>
                    <h1 className="text-xl lg:text-2xl font-bold text-stone-900">Tasks</h1>
                    <p className="text-stone-500 text-sm mt-0.5">{tasks.length} total tasks</p>
                </div>
                <button onClick={openAdd} className="btn-primary self-start sm:self-auto">
                    <LuPlus size={15} /> Assign Task
                </button>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                {[
                    { label: 'Total', value: stats.total, color: 'text-stone-700', bg: 'bg-white border-stone-200' },
                    { label: 'Assigned', value: stats.assigned, color: 'text-blue-700', bg: 'bg-blue-50 border-blue-100' },
                    { label: 'In Progress', value: stats.inProgress, color: 'text-amber-700', bg: 'bg-amber-50 border-amber-100' },
                    { label: 'Completed', value: stats.completed, color: 'text-green-700', bg: 'bg-green-50 border-green-100' },
                ].map(({ label, value, color, bg }) => (
                    <div key={label} className={`rounded-2xl p-4 border ${bg}`}>
                        <p className="text-stone-500 text-xs font-medium uppercase tracking-wider">{label}</p>
                        <p className={`text-2xl sm:text-3xl font-bold mt-1 ${color}`}>{value}</p>
                    </div>
                ))}
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-2 mb-5">
                {['', ...STATUSES].map((s) => (
                    <button key={s || 'all'} onClick={() => setFilterStatus(s)}
                        className={filterStatus === s ? 'btn-primary py-1.5' : 'btn-secondary'}>
                        {s || 'All'}
                    </button>
                ))}
            </div>

            {/* Task Cards */}
            {loading ? (
                <div className="flex flex-col items-center gap-3 py-16">
                    <div className="w-10 h-10 rounded-full border-4 border-orange-100 border-t-orange-600 animate-spin" />
                    <p className="text-stone-400 text-sm">Loading tasks...</p>
                </div>
            ) : filtered.length === 0 ? <div className="text-center text-stone-400 py-16">{filterStatus ? `No ${filterStatus} tasks.` : 'No tasks yet. Assign the first task!'}</div>
                : (
                    <div className="space-y-3">
                        {filtered.map((task) => (
                            <div key={task.id} className="task-card group">
                                <div className="task-card-content">
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${PRIORITY_DOT[task.priority]}`} />
                                        <h3 className="text-stone-900 font-semibold text-sm sm:text-base truncate">{task.title}</h3>
                                    </div>
                                    {task.description && <p className="text-stone-400 text-xs mb-2 line-clamp-1">{task.description}</p>}
                                    <div className="flex items-center flex-wrap gap-3 text-[10px] sm:text-xs text-stone-400">
                                        {task.employee_name ? (
                                            <span className="flex items-center gap-1.5">
                                                <span className="w-4 h-4 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center text-[10px] font-bold shadow-sm">{task.employee_name[0]}</span>
                                                <span className="font-medium text-stone-600">{task.employee_name}</span>
                                            </span>
                                        ) : <span className="text-stone-300 italic">Unassigned</span>}
                                        {task.due_date && (
                                            <span className={new Date(task.due_date) < new Date() && task.status !== 'Completed' ? 'text-red-400 font-medium' : ''}>
                                                Due {new Date(task.due_date).toLocaleDateString()}
                                            </span>
                                        )}
                                    </div>
                                    {task.tx_hash && (
                                        <div className="task-verified-badge">
                                            <span>🔗 Verified on Blockchain</span>
                                            <span className="text-stone-300 font-mono ml-1">{task.tx_hash.slice(0, 10)}...</span>
                                        </div>
                                    )}
                                </div>

                                <div className="task-card-actions">
                                    <div className="task-badge-row">
                                        <span className={`badge ${STATUS_STYLES[task.status]}`}>{task.status}</span>
                                        <span className={`badge-priority hidden sm:inline-block ${PRIORITY_STYLES[task.priority]}`}>{task.priority}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <select value={task.status} disabled={updatingId === task.id} onChange={(e) => handleStatusChange(task.id, e.target.value)}
                                            className="task-select">
                                            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                        <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition">
                                            <button onClick={() => openEdit(task)} className="p-1.5 text-stone-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition"><LuPencil size={12} /></button>
                                            <button onClick={() => handleDelete(task.id)} className="p-1.5 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"><LuX size={12} /></button>
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
                    <div className="bg-white border border-stone-200 rounded-2xl w-full max-w-lg p-6 shadow-2xl shadow-stone-200 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-lg font-semibold text-stone-900">{editTask ? 'Edit Task' : 'Assign New Task'}</h2>
                            <button onClick={() => setShowModal(false)} className="text-stone-400 hover:text-stone-600">✕</button>
                        </div>
                        {error && <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 mb-4 text-sm">{error}</div>}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-stone-600 mb-1.5">Title *</label>
                                <input name="title" value={form.title} onChange={handleChange} required placeholder="Implement user auth module" className={fieldCls} />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-stone-600 mb-1.5">Description</label>
                                <textarea name="description" value={form.description} onChange={handleChange} rows={3} placeholder="Optional details..." className={`${fieldCls} resize-none`} />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-stone-600 mb-1.5">Assign To</label>
                                    <select name="employee_id" value={form.employee_id} onChange={handleChange} className={selectCls}>
                                        <option value="">Unassigned</option>
                                        {employees.filter((e) => e.is_active).map((emp) => <option key={emp.id} value={emp.id}>{emp.name} ({emp.role})</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-stone-600 mb-1.5">Priority</label>
                                    <select name="priority" value={form.priority} onChange={handleChange} className={selectCls}>
                                        {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-stone-600 mb-1.5">Due Date</label>
                                    <input type="date" name="due_date" value={form.due_date} onChange={handleChange} className={selectCls} />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-stone-600 mb-1.5">Required Skills</label>
                                    <input name="required_skills" value={form.required_skills} onChange={handleChange} placeholder="React, Node.js" className={fieldCls} />
                                </div>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium py-2.5 rounded-xl text-sm transition">Cancel</button>
                                <button type="submit" disabled={saving} className="flex-1 bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl text-sm transition">
                                    {saving ? 'Saving...' : editTask ? 'Save Changes' : 'Assign Task'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
