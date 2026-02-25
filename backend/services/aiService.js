// productivity scoring + skill gap logic
// all pure js, no external api needed

// how many pts each overdue task costs
const OVERDUE_PENALTY = 5
const MAX_PENALTY = 20

function calculateProductivityScore(employee, tasks) {
    if (!tasks || tasks.length === 0) {
        return {
            score: 0,
            grade: 'N/A',
            insight: 'No tasks assigned yet.',
            breakdown: { base: 0, speedBonus: 0, overduePenalty: 0 },
            stats: { total: 0, completed: 0, overdue: 0, completedOnTime: 0 }
        }
    }

    const total = tasks.length
    const completed = tasks.filter(t => t.status === 'Completed').length
    const now = new Date()

    const overdue = tasks.filter(t =>
        t.due_date && new Date(t.due_date) < now && t.status !== 'Completed'
    ).length

    const completedOnTime = tasks.filter(t =>
        t.status === 'Completed' &&
        t.due_date &&
        t.completed_at &&
        new Date(t.completed_at) <= new Date(t.due_date)
    ).length

    const base = (completed / total) * 100
    const speedBonus = completed > 0 ? (completedOnTime / completed) * 10 : 0
    const overduePenalty = Math.min(overdue * OVERDUE_PENALTY, MAX_PENALTY)

    const score = Math.round(Math.max(0, Math.min(100, base + speedBonus - overduePenalty)))

    // determine grade + a short insight message
    let grade, insight
    if (score >= 85) {
        grade = 'A'
        insight = 'Exceptional performer. Consistently delivers on time.'
    } else if (score >= 70) {
        grade = 'B'
        insight = 'Solid performer, minor room to improve on deadlines.'
    } else if (score >= 50) {
        grade = 'C'
        insight = 'Average. Task completion speed needs work.'
    } else if (score >= 30) {
        grade = 'D'
        insight = 'Below average — consider workload rebalancing.'
    } else {
        grade = 'F'
        insight = 'Critical: very low completion or lots of overdue tasks.'
    }

    return {
        score,
        grade,
        insight,
        breakdown: {
            base: Math.round(base),
            speedBonus: Math.round(speedBonus),
            overduePenalty
        },
        stats: { total, completed, overdue, completedOnTime }
    }
}

// skills expected per role — rough guide, not exhaustive
const ROLE_REQUIRED_SKILLS = {
    'Software Engineer': ['JavaScript', 'Git', 'SQL', 'REST APIs', 'Testing'],
    'Senior Engineer': ['JavaScript', 'Git', 'SQL', 'REST APIs', 'Testing', 'System Design', 'Code Review'],
    'Team Lead': ['JavaScript', 'Git', 'System Design', 'Code Review', 'Project Management', 'Communication'],
    'Manager': ['Project Management', 'Communication', 'Leadership', 'Budgeting', 'Reporting'],
    'Designer': ['Figma', 'UI/UX', 'Prototyping', 'CSS', 'User Research'],
    'Analyst': ['SQL', 'Excel', 'Data Visualization', 'Reporting', 'Python'],
    'HR Manager': ['Recruitment', 'Onboarding', 'Compliance', 'Communication', 'HRIS'],
    'Sales Rep': ['CRM', 'Communication', 'Negotiation', 'Product Knowledge', 'Lead Generation'],
    'DevOps Engineer': ['Docker', 'Kubernetes', 'CI/CD', 'Linux', 'Cloud (AWS/GCP/Azure)', 'Monitoring'],
    'Data Scientist': ['Python', 'Machine Learning', 'SQL', 'Statistics', 'Data Visualization', 'TensorFlow'],
}

function detectSkillGap(employee) {
    const required = ROLE_REQUIRED_SKILLS[employee.role] || []
    if (required.length === 0) {
        return { required: [], missing: [], has: employee.skills || [], coveragePercent: 100 }
    }

    const empSkills = (employee.skills || []).map(s => s.toLowerCase().trim())
    const missing = required.filter(req =>
        !empSkills.some(s => s.includes(req.toLowerCase()) || req.toLowerCase().includes(s))
    )
    const coveragePercent = Math.round(((required.length - missing.length) / required.length) * 100)

    return { required, missing, has: employee.skills || [], coveragePercent }
}

// rank employees for a task by skills + workload + productivity
function recommendEmployee(task, employees, allTasks) {
    if (!employees?.length) return []

    const reqSkills = (task.required_skills || []).map(s => s.toLowerCase())

    return employees
        .filter(e => e.is_active)
        .map(emp => {
            const empTasks = allTasks.filter(t => t.employee_id === emp.id)
            const activeTasks = empTasks.filter(t => t.status !== 'Completed').length

            const empSkills = (emp.skills || []).map(s => s.toLowerCase().trim())
            const matchedSkills = reqSkills.filter(req =>
                empSkills.some(s => s.includes(req) || req.includes(s))
            )

            const skillScore = reqSkills.length > 0
                ? (matchedSkills.length / reqSkills.length) * 50
                : 50

            // fewer active tasks = higher workload score (max 30)
            const workloadScore = Math.max(0, 30 - activeTasks * 6)

            const { score: prodScore } = calculateProductivityScore(emp, empTasks)
            const prodContrib = (prodScore / 100) * 20

            const totalScore = Math.round(skillScore + workloadScore + prodContrib)

            return {
                employee: emp,
                totalScore,
                matchedSkills,
                activeTasks,
                breakdown: {
                    skillScore: Math.round(skillScore),
                    workloadScore: Math.round(workloadScore),
                    prodContrib: Math.round(prodContrib)
                }
            }
        })
        .sort((a, b) => b.totalScore - a.totalScore)
}

module.exports = { calculateProductivityScore, detectSkillGap, recommendEmployee, ROLE_REQUIRED_SKILLS }
