const express = require('express')
const router = express.Router()
const db = require('../db/db')
const { authMiddleware, adminOnly } = require('../middleware/auth')
const {
    calculateProductivityScore, detectSkillGap,
    getProductivityInsight, getSkillGapInsight
} = require('../services/aiService')

router.use(authMiddleware)
router.use(adminOnly)

// GET /api/ai/productivity — scores + gemini summary
router.get('/productivity', async (req, res) => {
    try {
        const [empsResult, tasksResult] = await Promise.all([
            db.query('SELECT * FROM employees WHERE org_id = $1 ORDER BY name', [req.org.id]),
            db.query('SELECT * FROM tasks WHERE org_id = $1', [req.org.id]),
        ])

        const employees = empsResult.rows
        const allTasks = tasksResult.rows

        const results = employees.map(emp => {
            const empTasks = allTasks.filter(t => t.employee_id === emp.id)
            return {
                id: emp.id, name: emp.name, role: emp.role,
                department: emp.department, is_active: emp.is_active,
                skills: emp.skills,
                ...calculateProductivityScore(emp, empTasks)
            }
        }).sort((a, b) => b.score - a.score)

        // get gemini summary (don't block if it fails)
        let aiSummary = null
        try { aiSummary = await getProductivityInsight(results) } catch { }

        res.json({ employees: results, aiSummary })
    } catch (err) {
        console.error('productivity error:', err.message)
        res.status(500).json({ error: 'Failed to compute productivity scores' })
    }
})

// GET /api/ai/skill-gap — gaps + gemini summary
router.get('/skill-gap', async (req, res) => {
    try {
        const result = await db.query(
            'SELECT id, name, role, department, skills FROM employees WHERE org_id = $1 ORDER BY name',
            [req.org.id]
        )
        const results = result.rows.map(emp => ({
            id: emp.id, name: emp.name, role: emp.role,
            department: emp.department, skills: emp.skills,
            gap: detectSkillGap(emp)
        }))

        let aiSummary = null
        try { aiSummary = await getSkillGapInsight(results) } catch { }

        res.json({ employees: results, aiSummary })
    } catch (err) {
        console.error('skill-gap error:', err.message)
        res.status(500).json({ error: 'Failed to compute skill gaps' })
    }
})

module.exports = router
