const express = require('express')
const router = express.Router()
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const db = require('../db')

const SECRET = process.env.JWT_SECRET || 'dev_secret_change_this'

const cookieOpts = {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000
}

// ─── admin (org) register ───
router.post('/register', async (req, res) => {
    const { name, email, password, industry } = req.body
    if (!name || !email || !password) {
        return res.status(400).json({ error: 'Please fill in all required fields' })
    }
    try {
        const check = await db.query('SELECT id FROM organizations WHERE email = $1', [email])
        if (check.rows.length > 0) {
            return res.status(409).json({ error: 'That email is already registered' })
        }
        const hash = await bcrypt.hash(password, 10)
        const { rows } = await db.query(
            `INSERT INTO organizations (name, email, password_hash, industry)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, industry, created_at`,
            [name, email, hash, industry || null]
        )
        const org = rows[0]
        const token = jwt.sign(
            { id: org.id, orgId: org.id, name: org.name, email: org.email, role: 'admin' },
            SECRET, { expiresIn: '7d' }
        )
        res.cookie('token', token, cookieOpts)
        res.status(201).json({ role: 'admin', org })
    } catch (err) {
        console.error('register failed:', err.message)
        res.status(500).json({ error: 'Registration failed' })
    }
})

// ─── admin login ───
router.post('/login', async (req, res) => {
    const { email, password } = req.body
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' })

    try {
        const { rows } = await db.query('SELECT * FROM organizations WHERE email = $1', [email])
        const org = rows[0]
        if (!org) return res.status(401).json({ error: 'Invalid email or password' })

        const ok = await bcrypt.compare(password, org.password_hash)
        if (!ok) return res.status(401).json({ error: 'Invalid email or password' })

        const token = jwt.sign(
            { id: org.id, orgId: org.id, name: org.name, email: org.email, role: 'admin' },
            SECRET, { expiresIn: '7d' }
        )
        res.cookie('token', token, cookieOpts)
        res.json({
            role: 'admin',
            org: { id: org.id, name: org.name, email: org.email, industry: org.industry }
        })
    } catch (err) {
        console.error('login error:', err.message)
        res.status(500).json({ error: 'Login failed' })
    }
})

// ─── employee login ───
router.post('/employee-login', async (req, res) => {
    const { email, password } = req.body
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' })

    try {
        const { rows } = await db.query(
            `SELECT e.*, o.name AS org_name
       FROM employees e
       JOIN organizations o ON o.id = e.org_id
       WHERE e.email = $1 AND e.is_active = true`,
            [email]
        )
        const emp = rows[0]
        if (!emp || !emp.password_hash) {
            return res.status(401).json({ error: 'Invalid email or password' })
        }

        const ok = await bcrypt.compare(password, emp.password_hash)
        if (!ok) return res.status(401).json({ error: 'Invalid email or password' })

        const token = jwt.sign(
            { id: emp.id, orgId: emp.org_id, name: emp.name, email: emp.email, role: 'employee', department: emp.department },
            SECRET, { expiresIn: '7d' }
        )
        res.cookie('token', token, cookieOpts)
        res.json({
            role: 'employee',
            employee: {
                id: emp.id, name: emp.name, email: emp.email,
                role: emp.role, department: emp.department, org_name: emp.org_name
            }
        })
    } catch (err) {
        console.error('employee login error:', err.message)
        res.status(500).json({ error: 'Login failed' })
    }
})

// ─── logout (works for both) ───
router.post('/logout', (req, res) => {
    res.clearCookie('token', { httpOnly: true, sameSite: 'lax' })
    res.json({ ok: true })
})

// ─── check session ───
router.get('/me', async (req, res) => {
    const token = req.cookies?.token
    if (!token) return res.status(401).json({ error: 'Not logged in' })

    try {
        const payload = jwt.verify(token, SECRET)

        if (payload.role === 'employee') {
            const { rows } = await db.query(
                `SELECT e.id, e.name, e.email, e.role, e.department, o.name AS org_name
         FROM employees e JOIN organizations o ON o.id = e.org_id
         WHERE e.id = $1 AND e.is_active = true`,
                [payload.id]
            )
            if (!rows[0]) return res.status(401).json({ error: 'Account not found' })
            return res.json({ ...rows[0], userRole: 'employee' })
        }

        // admin
        const { rows } = await db.query(
            'SELECT id, name, email, industry FROM organizations WHERE id = $1',
            [payload.id]
        )
        if (!rows[0]) return res.status(401).json({ error: 'Account not found' })
        res.json({ ...rows[0], userRole: 'admin' })
    } catch {
        res.status(401).json({ error: 'Session expired' })
    }
})

module.exports = router
