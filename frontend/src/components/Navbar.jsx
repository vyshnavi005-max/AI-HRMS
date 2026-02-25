import React, { useState, useEffect } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
    LuLayoutDashboard, LuUsers, LuClipboardList,
    LuLogOut, LuMenu, LuX
} from 'react-icons/lu'

const links = [
    { to: '/dashboard', label: 'Dashboard', Icon: LuLayoutDashboard },
    { to: '/employees', label: 'Employees', Icon: LuUsers },
    { to: '/tasks', label: 'Tasks', Icon: LuClipboardList },
]

export default function Navbar() {
    const [mobileOpen, setMobileOpen] = useState(false)
    const { org, logout } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()

    useEffect(() => { setMobileOpen(false) }, [location.pathname])

    useEffect(() => {
        document.body.style.overflow = mobileOpen ? 'hidden' : ''
        return () => { document.body.style.overflow = '' }
    }, [mobileOpen])

    const handleLogout = async () => {
        await logout()
        navigate('/login')
    }

    const linkClass = ({ isActive }) =>
        `flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-150 ${isActive
            ? 'bg-orange-600 text-white shadow-sm shadow-orange-200'
            : 'text-stone-500 hover:text-stone-900 hover:bg-stone-100'
        }`

    const mobileLinkClass = ({ isActive }) =>
        `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${isActive
            ? 'bg-orange-600 text-white shadow-sm'
            : 'text-stone-600 hover:bg-stone-100'
        }`

    return (
        <>
            <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-stone-200/60">
                <div className="mx-auto px-4 sm:px-8 lg:px-16 xl:px-24">
                    <div className="flex items-center justify-between h-16">
                        {/* Left — Logo */}
                        <div className="flex items-center gap-1">
                            <p className="text-stone-900 font-bold text-base leading-tight">PulseHR</p>
                            <p className="text-stone-400 text-xs truncate max-w-[140px] hidden sm:block">· {org?.name}</p>
                        </div>

                        {/* Right — Nav Links + Logout */}
                        <div className="hidden md:flex items-center gap-1">
                            {links.map(({ to, label, Icon }) => (
                                <NavLink key={to} to={to} className={linkClass}>
                                    {({ isActive }) => (
                                        <>
                                            <Icon size={15} className={isActive ? 'text-white' : 'text-stone-400'} />
                                            {label}
                                        </>
                                    )}
                                </NavLink>
                            ))}
                            <div className="w-px h-6 bg-stone-200 mx-2" />
                            <button
                                onClick={handleLogout}
                                className="text-stone-400 hover:text-red-500 p-2 rounded-xl hover:bg-red-50 transition"
                                title="Sign out"
                            >
                                <LuLogOut size={16} />
                            </button>
                        </div>

                        {/* Mobile hamburger */}
                        <button
                            onClick={() => setMobileOpen(!mobileOpen)}
                            className="md:hidden text-stone-600 p-2 rounded-xl hover:bg-stone-100 transition"
                            aria-label="Toggle menu"
                        >
                            {mobileOpen ? <LuX size={20} /> : <LuMenu size={20} />}
                        </button>
                    </div>
                </div>
            </nav>

            {/* Mobile overlay */}
            {mobileOpen && (
                <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm md:hidden" onClick={() => setMobileOpen(false)} />
            )}

            {/* Mobile dropdown menu */}
            <div className={`
                fixed top-16 left-0 right-0 z-50 md:hidden
                bg-white border-b border-stone-200 shadow-xl
                transform transition-all duration-300 ease-in-out origin-top
                ${mobileOpen ? 'scale-y-100 opacity-100' : 'scale-y-0 opacity-0 pointer-events-none'}
            `}>
                <div className="p-3 space-y-1">
                    {links.map(({ to, label, Icon }) => (
                        <NavLink key={to} to={to} className={mobileLinkClass} onClick={() => setMobileOpen(false)}>
                            {({ isActive }) => (
                                <>
                                    <Icon size={16} className={isActive ? 'text-white' : 'text-stone-400'} />
                                    {label}
                                </>
                            )}
                        </NavLink>
                    ))}
                </div>
                <div className="border-t border-stone-100 p-3">
                    <div className="bg-stone-50 rounded-xl px-3 py-2.5 mb-2">
                        <p className="text-stone-800 text-xs font-semibold truncate">{org?.name}</p>
                        <p className="text-stone-400 text-xs truncate">{org?.email}</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-stone-500 hover:text-red-500 hover:bg-red-50 text-sm font-medium transition"
                    >
                        <LuLogOut size={15} />
                        Sign out
                    </button>
                </div>
            </div>
        </>
    )
}
