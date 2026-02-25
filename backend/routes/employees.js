const express = require('express')
const router = express.Router()
const bcrypt = require('bcrypt')
const db = require('../db/db')
const { authMiddleware, adminOnly } = require('../middleware/auth')

// all employee routes need auth + admin access
router.use(authMiddleware)
router.use(adminOnly)

// GET /api/employees
router.get('/', async (req, res) => {
    try {
        const result = await db.query(
            `SELECT e.id, e.name, e.email, e.role, e.department, e.skills, e.wallet_address,
              e.is_active, e.joined_at,
              (SELECT COUNT(*) FROM tasks t WHERE t.employee_id = e.id AND t.status != 'Completed') AS active_tasks,
              (SELECT COUNT(*) FROM tasks t WHERE t.employee_id = e.id AND t.status = 'Completed') AS completed_tasks
       FROM employees e WHERE e.org_id = $1 ORDER BY e.joined_at DESC`,
            [req.org.id]
        )
        res.json(result.rows)
    } catch (err) {
        console.error('get employees:', err.message)
        res.status(500).json({ error: 'Failed to fetch employees' })
    }
})

// GET /api/employees/:id
router.get('/:id', async (req, res) => {
    try {
        const result = await db.query(
            `SELECT e.id, e.name, e.email, e.role, e.department, e.skills, e.wallet_address,
              e.is_active, e.joined_at,
              (SELECT COUNT(*) FROM tasks t WHERE t.employee_id = e.id AND t.status != 'Completed') AS active_tasks,
              (SELECT COUNT(*) FROM tasks t WHERE t.employee_id = e.id AND t.status = 'Completed') AS completed_tasks,
              (SELECT COUNT(*) FROM tasks t WHERE t.employee_id = e.id) AS total_tasks
       FROM employees e WHERE e.id = $1 AND e.org_id = $2`,
            [req.params.id, req.org.id]
        )
        if (result.rows.length === 0) return res.status(404).json({ error: 'Employee not found' })
        res.json(result.rows[0])
    } catch (err) {
        res.status(500).json({ error: 'Server error' })
    }
})

// POST /api/employees — add new employee (with optional password for employee login)
router.post('/', async (req, res) => {
    const { name, email, role, department, skills, wallet_address, password } = req.body

    if (!name || !email || !role || !department) {
        return res.status(400).json({ error: 'Name, email, role, and department are required' })
    }

    try {
        // hash password if provided so employee can log in
        let passwordHash = null
        if (password && password.length >= 6) {
            passwordHash = await bcrypt.hash(password, 10)
        }

        const result = await db.query(
            `INSERT INTO employees (org_id, name, email, password_hash, role, department, skills, wallet_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, name, email, role, department, skills, wallet_address, is_active, joined_at`,
            [req.org.id, name, email, passwordHash, role, department, skills || [], wallet_address || null]
        )
        res.status(201).json(result.rows[0])
    } catch (err) {
        if (err.code === '23505') {
            return res.status(409).json({ error: 'An employee with this email already exists' })
        }
        console.error('add employee:', err.message)
        res.status(500).json({ error: 'Failed to add employee' })
    }
})

// PUT /api/employees/:id
router.put('/:id', async (req, res) => {
    const { name, email, role, department, skills, wallet_address, is_active, password } = req.body

    try {
        const check = await db.query('SELECT id FROM employees WHERE id = $1 AND org_id = $2', [req.params.id, req.org.id])
        if (check.rows.length === 0) return res.status(404).json({ error: 'Employee not found' })

        // update password if provided
        let passwordUpdate = ''
        const params = [name, email, role, department, skills, wallet_address, is_active]
        if (password && password.length >= 6) {
            const hash = await bcrypt.hash(password, 10)
            params.push(hash)
            passwordUpdate = `, password_hash = $${params.length}`
        }

        params.push(req.params.id, req.org.id)

        const result = await db.query(
            `UPDATE employees SET
        name = COALESCE($1, name),
        email = COALESCE($2, email),
        role = COALESCE($3, role),
        department = COALESCE($4, department),
        skills = COALESCE($5, skills),
        wallet_address = COALESCE($6, wallet_address),
        is_active = COALESCE($7, is_active)
        ${passwordUpdate}
       WHERE id = $${params.length - 1} AND org_id = $${params.length}
       RETURNING id, name, email, role, department, skills, wallet_address, is_active, joined_at`,
            params
        )
        res.json(result.rows[0])
    } catch (err) {
        console.error('update employee:', err.message)
        res.status(500).json({ error: 'Failed to update employee' })
    }
})

// DELETE /api/employees/:id
router.delete('/:id', async (req, res) => {
    try {
        const result = await db.query(
            'DELETE FROM employees WHERE id = $1 AND org_id = $2 RETURNING id',
            [req.params.id, req.org.id]
        )
        if (result.rows.length === 0) return res.status(404).json({ error: 'Employee not found' })
        res.json({ ok: true })
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete employee' })
    }
})

module.exports = router
