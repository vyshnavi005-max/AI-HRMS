const express = require('express')
const router = express.Router()
const db = require('../db')
const { authMiddleware, adminOnly } = require('../middleware/auth')
const { calculateProductivityScore, detectSkillGap, recommendEmployee } = require('../services/aiService')

router.use(authMiddleware)
router.use(adminOnly)

// GET /api/ai/productivity — productivity score for all employees
router.get('/productivity', async (req, res) => {
    try {
        const [empsResult, tasksResult] = await Promise.all([
            db.query('SELECT * FROM employees WHERE org_id = $1 ORDER BY name', [req.org.id]),
            db.query('SELECT * FROM tasks WHERE org_id = $1', [req.org.id]),
        ]);

        const employees = empsResult.rows;
        const allTasks = tasksResult.rows;

        const results = employees.map((emp) => {
            const empTasks = allTasks.filter((t) => t.employee_id === emp.id);
            const aiResult = calculateProductivityScore(emp, empTasks);
            return {
                id: emp.id,
                name: emp.name,
                role: emp.role,
                department: emp.department,
                is_active: emp.is_active,
                skills: emp.skills,
                ...aiResult,
            };
        }).sort((a, b) => b.score - a.score);

        res.json(results);
    } catch (err) {
        console.error('AI productivity error:', err);
        res.status(500).json({ error: 'Server error computing productivity scores.' });
    }
});

// GET /api/ai/skill-gap — skill gap for all employees
router.get('/skill-gap', async (req, res) => {
    try {
        const result = await db.query(
            'SELECT id, name, role, department, skills FROM employees WHERE org_id = $1 ORDER BY name',
            [req.org.id]
        );
        const results = result.rows.map((emp) => ({
            id: emp.id,
            name: emp.name,
            role: emp.role,
            department: emp.department,
            skills: emp.skills,
            gap: detectSkillGap(emp),
        }));
        res.json(results);
    } catch (err) {
        console.error('AI skill-gap error:', err);
        res.status(500).json({ error: 'Server error computing skill gaps.' });
    }
});

// POST /api/ai/assign — recommend best employee for a task
router.post('/assign', async (req, res) => {
    const { title, required_skills } = req.body;
    if (!title) return res.status(400).json({ error: 'Task title is required.' });

    try {
        const [empsResult, tasksResult] = await Promise.all([
            db.query('SELECT * FROM employees WHERE org_id = $1 AND is_active = TRUE', [req.org.id]),
            db.query('SELECT * FROM tasks WHERE org_id = $1', [req.org.id]),
        ]);

        const recommendations = recommendEmployee(
            { title, required_skills: required_skills || [] },
            empsResult.rows,
            tasksResult.rows
        );

        res.json(recommendations);
    } catch (err) {
        console.error('AI assign error:', err);
        res.status(500).json({ error: 'Server error computing assignment recommendations.' });
    }
});

module.exports = router;
