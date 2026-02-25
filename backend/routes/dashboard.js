const express = require('express')
const router = express.Router()
const db = require('../db')
const { authMiddleware, adminOnly } = require('../middleware/auth')

router.use(authMiddleware)
router.use(adminOnly)

// GET /api/dashboard — aggregate workforce stats for this org
router.get('/', async (req, res) => {
    try {
        const orgId = req.org.id;

        const [
            empStats,
            taskStats,
            topEmployees,
            recentTasks,
            deptBreakdown,
        ] = await Promise.all([
            // Employee counts
            db.query(
                `SELECT
          COUNT(*) AS total,
          COUNT(*) FILTER (WHERE is_active = TRUE) AS active,
          COUNT(*) FILTER (WHERE is_active = FALSE) AS inactive
         FROM employees WHERE org_id = $1`,
                [orgId]
            ),
            // Task counts
            db.query(
                `SELECT
          COUNT(*) AS total,
          COUNT(*) FILTER (WHERE status = 'Assigned') AS assigned,
          COUNT(*) FILTER (WHERE status = 'In Progress') AS in_progress,
          COUNT(*) FILTER (WHERE status = 'Completed') AS completed,
          COUNT(*) FILTER (WHERE due_date < NOW() AND status != 'Completed') AS overdue
         FROM tasks WHERE org_id = $1`,
                [orgId]
            ),
            // Top 5 productive employees (by completion rate)
            db.query(
                `SELECT
          e.id,
          e.name,
          e.role,
          e.department,
          COUNT(t.id) AS total_tasks,
          COUNT(t.id) FILTER (WHERE t.status = 'Completed') AS completed_tasks,
          CASE WHEN COUNT(t.id) = 0 THEN 0
               ELSE ROUND((COUNT(t.id) FILTER (WHERE t.status = 'Completed')::DECIMAL / COUNT(t.id)) * 100)
          END AS productivity_score
         FROM employees e
         LEFT JOIN tasks t ON t.employee_id = e.id AND t.org_id = $1
         WHERE e.org_id = $1 AND e.is_active = TRUE
         GROUP BY e.id, e.name, e.role, e.department
         ORDER BY productivity_score DESC, completed_tasks DESC
         LIMIT 5`,
                [orgId]
            ),
            // 5 most recent tasks
            db.query(
                `SELECT t.id, t.title, t.status, t.priority, t.created_at, e.name AS employee_name
         FROM tasks t
         LEFT JOIN employees e ON t.employee_id = e.id
         WHERE t.org_id = $1
         ORDER BY t.created_at DESC LIMIT 5`,
                [orgId]
            ),
            // Employees by department
            db.query(
                `SELECT department, COUNT(*) AS count
         FROM employees WHERE org_id = $1 AND is_active = TRUE
         GROUP BY department ORDER BY count DESC`,
                [orgId]
            ),
        ]);

        res.json({
            employees: empStats.rows[0],
            tasks: taskStats.rows[0],
            topEmployees: topEmployees.rows,
            recentTasks: recentTasks.rows,
            deptBreakdown: deptBreakdown.rows,
        });
    } catch (err) {
        console.error('Dashboard error:', err);
        res.status(500).json({ error: 'Server error fetching dashboard data.' });
    }
});

module.exports = router;
