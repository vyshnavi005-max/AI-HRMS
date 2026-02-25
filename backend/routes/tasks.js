const express = require('express')
const router = express.Router()
const db = require('../db/db')
const { authMiddleware, adminOnly } = require('../middleware/auth')

router.use(authMiddleware)

// GET /api/tasks — admin gets all org tasks, employee gets only theirs
router.get('/', async (req, res) => {
    try {
        const { status, employee_id } = req.query
        const isEmployee = req.user.role === 'employee'

        let query = `
      SELECT t.*, e.name AS employee_name, e.role AS employee_role
      FROM tasks t
      LEFT JOIN employees e ON t.employee_id = e.id
      WHERE t.org_id = $1
    `
        const params = [req.org.id]

        // employees can only see their own tasks
        if (isEmployee) {
            params.push(req.user.id)
            query += ` AND t.employee_id = $${params.length}`
        }

        if (status) {
            params.push(status)
            query += ` AND t.status = $${params.length}`
        }
        if (employee_id && !isEmployee) {
            params.push(employee_id)
            query += ` AND t.employee_id = $${params.length}`
        }
        query += ' ORDER BY t.created_at DESC'

        const result = await db.query(query, params)
        res.json(result.rows)
    } catch (err) {
        console.error('get tasks:', err.message)
        res.status(500).json({ error: 'Failed to fetch tasks' })
    }
})

// GET /api/tasks/:id
router.get('/:id', async (req, res) => {
    try {
        const isEmployee = req.user.role === 'employee'
        let query = `
      SELECT t.*, e.name AS employee_name, e.role AS employee_role, e.department AS employee_department
      FROM tasks t
      LEFT JOIN employees e ON t.employee_id = e.id
      WHERE t.id = $1 AND t.org_id = $2
    `
        const params = [req.params.id, req.org.id]

        if (isEmployee) {
            params.push(req.user.id)
            query += ` AND t.employee_id = $${params.length}`
        }

        const result = await db.query(query, params)
        if (result.rows.length === 0) return res.status(404).json({ error: 'Task not found' })
        res.json(result.rows[0])
    } catch (err) {
        res.status(500).json({ error: 'Server error' })
    }
})

// POST /api/tasks — admin only
router.post('/', adminOnly, async (req, res) => {
    const { employee_id, title, description, required_skills, priority, due_date } = req.body

    if (!title) return res.status(400).json({ error: 'Task title is required' })

    if (employee_id) {
        const emp = await db.query('SELECT id FROM employees WHERE id = $1 AND org_id = $2', [employee_id, req.org.id])
        if (emp.rows.length === 0) return res.status(400).json({ error: 'Employee not found in your org' })
    }

    try {
        const result = await db.query(
            `INSERT INTO tasks (org_id, employee_id, title, description, required_skills, priority, due_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
            [req.org.id, employee_id || null, title, description || null, required_skills || [], priority || 'Medium', due_date || null]
        )
        res.status(201).json(result.rows[0])
    } catch (err) {
        console.error('create task:', err.message)
        res.status(500).json({ error: 'Failed to create task' })
    }
})

// PUT /api/tasks/:id — admin only (edit task details)
router.put('/:id', adminOnly, async (req, res) => {
    const { employee_id, title, description, required_skills, priority, due_date } = req.body

    try {
        const check = await db.query('SELECT id FROM tasks WHERE id = $1 AND org_id = $2', [req.params.id, req.org.id])
        if (check.rows.length === 0) return res.status(404).json({ error: 'Task not found' })

        const result = await db.query(
            `UPDATE tasks SET
        employee_id = COALESCE($1, employee_id),
        title = COALESCE($2, title),
        description = COALESCE($3, description),
        required_skills = COALESCE($4, required_skills),
        priority = COALESCE($5, priority),
        due_date = COALESCE($6, due_date)
       WHERE id = $7 AND org_id = $8
       RETURNING *`,
            [employee_id, title, description, required_skills, priority, due_date, req.params.id, req.org.id]
        )
        res.json(result.rows[0])
    } catch (err) {
        console.error('update task:', err.message)
        res.status(500).json({ error: 'Failed to update task' })
    }
})

// PATCH /api/tasks/:id/status — both admin AND employee can update status
router.patch('/:id/status', async (req, res) => {
    const { status, tx_hash } = req.body
    const validStatuses = ['Assigned', 'In Progress', 'Completed']

    if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: `Status must be: ${validStatuses.join(', ')}` })
    }

    try {
        const isEmployee = req.user.role === 'employee'

        // employees can only update their own tasks
        let query = 'SELECT id FROM tasks WHERE id = $1 AND org_id = $2'
        const checkParams = [req.params.id, req.org.id]
        if (isEmployee) {
            checkParams.push(req.user.id)
            query += ' AND employee_id = $3'
        }

        const check = await db.query(query, checkParams)
        if (check.rows.length === 0) return res.status(404).json({ error: 'Task not found' })

        const completedAt = status === 'Completed' ? new Date() : null
        const result = await db.query(
            'UPDATE tasks SET status = $1, completed_at = $2, tx_hash = $3 WHERE id = $4 RETURNING *',
            [status, completedAt, tx_hash || null, req.params.id]
        )
        res.json(result.rows[0])
    } catch (err) {
        console.error('update status:', err.message)
        res.status(500).json({ error: 'Failed to update status' })
    }
})

// DELETE /api/tasks/:id — admin only
router.delete('/:id', adminOnly, async (req, res) => {
    try {
        const result = await db.query(
            'DELETE FROM tasks WHERE id = $1 AND org_id = $2 RETURNING id',
            [req.params.id, req.org.id]
        )
        if (result.rows.length === 0) return res.status(404).json({ error: 'Task not found' })
        res.json({ ok: true })
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete task' })
    }
})

module.exports = router
