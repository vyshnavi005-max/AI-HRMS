import React, { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import Sidebar from '../components/Sidebar'
import { LuUserPlus, LuPencil, LuTrash2, LuSearch, LuCircleCheck, LuCircleMinus } from 'react-icons/lu'

const DEPARTMENTS = ['Engineering', 'Marketing', 'Sales', 'HR', 'Finance', 'Operations', 'Design', 'Product'];
const ROLES = ['Software Engineer', 'Senior Engineer', 'Team Lead', 'Manager', 'Designer', 'Analyst', 'HR Manager', 'Sales Rep', 'DevOps Engineer', 'Data Scientist'];
const emptyForm = { name: '', email: '', role: '', department: '', skills: '', wallet_address: '', is_active: true, password: '' };

export default function Employees() {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editEmployee, setEditEmployee] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');

    const fetchEmployees = useCallback(async () => {
        setLoading(true);
        try { const res = await axios.get('/api/employees'); setEmployees(res.data); }
        catch (err) { console.error(err); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchEmployees(); }, [fetchEmployees]);

    const openAdd = () => { setEditEmployee(null); setForm(emptyForm); setError(''); setShowModal(true); };
    const openEdit = (emp) => {
        setEditEmployee(emp);
        setForm({ name: emp.name, email: emp.email, role: emp.role, department: emp.department, skills: Array.isArray(emp.skills) ? emp.skills.join(', ') : '', wallet_address: emp.wallet_address || '', is_active: emp.is_active });
        setError(''); setShowModal(true);
    };
    const handleChange = (e) => { const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value; setForm({ ...form, [e.target.name]: val }); };

    const handleSubmit = async (e) => {
        e.preventDefault(); setError(''); setSaving(true);
        const payload = { ...form, skills: form.skills ? form.skills.split(',').map((s) => s.trim()).filter(Boolean) : [] };
        try {
            if (editEmployee) await axios.put(`/api/employees/${editEmployee.id}`, payload);
            else await axios.post('/api/employees', payload);
            setShowModal(false); fetchEmployees();
        } catch (err) { setError(err.response?.data?.error || 'Failed to save employee.'); }
        finally { setSaving(false); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this employee?')) return;
        try { await axios.delete(`/api/employees/${id}`); fetchEmployees(); }
        catch { alert('Failed to delete employee.'); }
    };

    const filtered = employees.filter((e) =>
        `${e.name} ${e.email} ${e.role} ${e.department}`.toLowerCase().includes(search.toLowerCase())
    );

    const fieldCls = "w-full bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition";
    const selectCls = "w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition";

    return (
        <div className="flex min-h-screen bg-slate-50">
            <Sidebar />
            <main className="flex-1 p-4 pt-20 lg:p-8 lg:pt-8 overflow-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
                    <div>
                        <h1 className="text-xl lg:text-2xl font-bold text-slate-900">Employees</h1>
                        <p className="text-slate-500 text-sm mt-0.5">{employees.length} total members</p>
                    </div>
                    <button onClick={openAdd} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition shadow-sm flex items-center gap-2 self-start sm:self-auto">
                        <LuUserPlus size={15} /> Add Employee
                    </button>
                </div>

                {/* Search */}
                <div className="mb-5">
                    <div className="relative">
                        <LuSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input type="text" placeholder="Search employees..." value={search} onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-white border border-slate-200 text-slate-900 placeholder-slate-400 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition shadow-sm" />
                    </div>
                </div>

                {/* Mobile cards */}
                <div className="lg:hidden space-y-3">
                    {loading ? (
                        <div className="flex flex-col items-center gap-3 py-16">
                            <div className="w-10 h-10 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin" />
                            <p className="text-slate-400 text-sm">Loading employees...</p>
                        </div>
                    ) : filtered.length === 0 ? <div className="text-center text-slate-400 py-16">{search ? 'No results.' : 'No employees yet.'}</div>
                        : filtered.map((emp) => (
                            <div key={emp.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm shrink-0">
                                        {emp.name[0].toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="text-slate-900 font-medium text-sm truncate">{emp.name}</p>
                                            <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${emp.is_active ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                                                {emp.is_active ? <LuCircleCheck size={10} /> : <LuCircleMinus size={10} />}
                                                {emp.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                        <p className="text-slate-400 text-xs truncate">{emp.email}</p>
                                        <p className="text-slate-500 text-xs mt-1">{emp.role} · {emp.department}</p>
                                        {(emp.skills || []).length > 0 && (
                                            <div className="flex flex-wrap gap-1 mt-2">
                                                {emp.skills.slice(0, 3).map((s) => (
                                                    <span key={s} className="bg-indigo-50 text-indigo-600 text-[10px] px-1.5 py-0.5 rounded border border-indigo-100">{s}</span>
                                                ))}
                                                {emp.skills.length > 3 && <span className="text-slate-400 text-[10px]">+{emp.skills.length - 3}</span>}
                                            </div>
                                        )}
                                        <div className="flex gap-2 mt-3">
                                            <button onClick={() => openEdit(emp)} className="flex items-center gap-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg transition"><LuPencil size={11} /> Edit</button>
                                            <button onClick={() => handleDelete(emp.id)} className="flex items-center gap-1 text-xs bg-red-50 hover:bg-red-100 text-red-500 px-3 py-1.5 rounded-lg transition"><LuTrash2 size={11} /> Delete</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                </div>

                {/* Desktop table */}
                <div className="hidden lg:block bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                    {loading ? (
                        <div className="flex flex-col items-center gap-3 py-16">
                            <div className="w-10 h-10 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin" />
                            <p className="text-slate-400 text-sm">Loading employees...</p>
                        </div>
                    ) : filtered.length === 0 ? <div className="text-center text-slate-400 py-16">{search ? 'No employees match your search.' : 'No employees yet. Add your first employee!'}</div>
                        : (
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-100 bg-slate-50">
                                        {['Employee', 'Role', 'Department', 'Skills', 'Status', 'Tasks', ''].map((h) => (
                                            <th key={h} className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-6 py-4">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filtered.map((emp) => (
                                        <tr key={emp.id} className="hover:bg-slate-50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm">{emp.name[0].toUpperCase()}</div>
                                                    <div>
                                                        <p className="text-slate-900 font-medium text-sm">{emp.name}</p>
                                                        <p className="text-slate-400 text-xs">{emp.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-700 text-sm">{emp.role}</td>
                                            <td className="px-6 py-4 text-slate-700 text-sm">{emp.department}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-wrap gap-1">
                                                    {(emp.skills || []).slice(0, 3).map((skill) => (
                                                        <span key={skill} className="bg-indigo-50 text-indigo-600 text-xs px-2 py-0.5 rounded-md border border-indigo-100">{skill}</span>
                                                    ))}
                                                    {(emp.skills || []).length > 3 && <span className="text-slate-400 text-xs">+{emp.skills.length - 3}</span>}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${emp.is_active ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                                                    {emp.is_active ? <LuCircleCheck size={12} /> : <LuCircleMinus size={12} />}
                                                    {emp.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-xs text-slate-500">
                                                <span className="text-emerald-600 font-medium">{emp.completed_tasks}</span> done / <span className="text-amber-500 font-medium">{emp.active_tasks}</span> active
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                                                    <button onClick={() => openEdit(emp)} className="flex items-center gap-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1.5 rounded-lg transition"><LuPencil size={12} /> Edit</button>
                                                    <button onClick={() => handleDelete(emp.id)} className="flex items-center gap-1 text-xs bg-red-50 hover:bg-red-100 text-red-500 px-2.5 py-1.5 rounded-lg transition"><LuTrash2 size={12} /> Delete</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                </div>

                {/* Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 shadow-2xl shadow-slate-200 max-h-[90vh] overflow-y-auto">
                            <div className="flex items-center justify-between mb-5">
                                <h2 className="text-lg font-semibold text-slate-900">{editEmployee ? 'Edit Employee' : 'Add New Employee'}</h2>
                                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
                            </div>
                            {error && <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 mb-4 text-sm">{error}</div>}
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-600 mb-1.5">Full Name *</label>
                                        <input name="name" value={form.name} onChange={handleChange} required placeholder="John Doe" className={fieldCls} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-600 mb-1.5">Email *</label>
                                        <input name="email" type="email" value={form.email} onChange={handleChange} required placeholder="john@company.com" className={fieldCls} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-600 mb-1.5">Role *</label>
                                        <select name="role" value={form.role} onChange={handleChange} required className={selectCls}>
                                            <option value="">Select role...</option>
                                            {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-600 mb-1.5">Department *</label>
                                        <select name="department" value={form.department} onChange={handleChange} required className={selectCls}>
                                            <option value="">Select department...</option>
                                            {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Skills <span className="text-slate-400">(comma-separated)</span></label>
                                    <input name="skills" value={form.skills} onChange={handleChange} placeholder="React, Node.js, PostgreSQL" className={fieldCls} />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Login Password <span className="text-slate-400">{editEmployee ? '(leave blank to keep current)' : '(for employee portal access)'}</span></label>
                                    <input name="password" type="password" value={form.password} onChange={handleChange} placeholder={editEmployee ? '••••••••' : 'Min 6 characters'} minLength={form.password ? 6 : undefined} className={fieldCls} />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Wallet Address <span className="text-slate-400">(optional)</span></label>
                                    <input name="wallet_address" value={form.wallet_address} onChange={handleChange} placeholder="0x..." className={fieldCls} />
                                </div>
                                {editEmployee && (
                                    <div className="flex items-center gap-2">
                                        <input type="checkbox" name="is_active" id="is_active" checked={form.is_active} onChange={handleChange} className="w-4 h-4 accent-indigo-600" />
                                        <label htmlFor="is_active" className="text-sm text-slate-700">Active employee</label>
                                    </div>
                                )}
                                <div className="flex gap-3 pt-2">
                                    <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-2.5 rounded-xl text-sm transition">Cancel</button>
                                    <button type="submit" disabled={saving} className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl text-sm transition">
                                        {saving ? 'Saving...' : editEmployee ? 'Save Changes' : 'Add Employee'}
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
