// ai service — rule-based scoring + gemini for natural language insights
const { GoogleGenerativeAI } = require('@google/generative-ai')

const OVERDUE_PENALTY = 5
const MAX_PENALTY = 20

// init gemini (uses key from env)
let gemini = null
if (process.env.GEMINI_API_KEY) {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    gemini = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
}

// ── productivity scoring ──

function calculateProductivityScore(employee, tasks) {
    if (!tasks || tasks.length === 0) {
        return {
            score: 0, grade: 'N/A',
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
        t.status === 'Completed' && t.due_date && t.completed_at &&
        new Date(t.completed_at) <= new Date(t.due_date)
    ).length

    const base = (completed / total) * 100
    const speedBonus = completed > 0 ? (completedOnTime / completed) * 10 : 0
    const overduePenalty = Math.min(overdue * OVERDUE_PENALTY, MAX_PENALTY)
    const score = Math.round(Math.max(0, Math.min(100, base + speedBonus - overduePenalty)))

    let grade, insight
    if (score >= 85) { grade = 'A'; insight = 'Exceptional performer. Consistently delivers on time.' }
    else if (score >= 70) { grade = 'B'; insight = 'Solid performer with minor room for improvement.' }
    else if (score >= 50) { grade = 'C'; insight = 'Average — task completion speed needs work.' }
    else if (score >= 30) { grade = 'D'; insight = 'Below average, consider workload rebalancing.' }
    else { grade = 'F'; insight = 'Critical: very low completion or lots of overdue tasks.' }

    return {
        score, grade, insight,
        breakdown: { base: Math.round(base), speedBonus: Math.round(speedBonus), overduePenalty },
        stats: { total, completed, overdue, completedOnTime }
    }
}

// ── skill gap detection ──

const ROLE_SKILLS = {
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
    const required = ROLE_SKILLS[employee.role] || []
    if (!required.length) {
        return { required: [], missing: [], has: employee.skills || [], coveragePercent: 100 }
    }
    const empSkills = (employee.skills || []).map(s => s.toLowerCase().trim())
    const missing = required.filter(req =>
        !empSkills.some(s => s.includes(req.toLowerCase()) || req.toLowerCase().includes(s))
    )
    const coveragePercent = Math.round(((required.length - missing.length) / required.length) * 100)
    return { required, missing, has: employee.skills || [], coveragePercent }
}

// ── smart task recommendation ──

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
            const skillScore = reqSkills.length > 0 ? (matchedSkills.length / reqSkills.length) * 50 : 50
            const workloadScore = Math.max(0, 30 - activeTasks * 6)
            const { score: prodScore } = calculateProductivityScore(emp, empTasks)
            const prodContrib = (prodScore / 100) * 20
            const totalScore = Math.round(skillScore + workloadScore + prodContrib)

            return {
                employee: emp,
                totalScore, matchedSkills, activeTasks,
                breakdown: {
                    skillScore: Math.round(skillScore),
                    workloadScore: Math.round(workloadScore),
                    prodContrib: Math.round(prodContrib)
                }
            }
        })
        .sort((a, b) => b.totalScore - a.totalScore)
}

// ── gemini-powered insights ──

async function getGeminiInsight(promptText) {
    if (!gemini) return null
    try {
        const result = await gemini.generateContent(promptText)
        return result.response.text()
    } catch (err) {
        console.error('gemini error:', err.message)
        return null
    }
}

async function getProductivityInsight(employees) {
    const summary = employees.slice(0, 10).map(e =>
        `${e.name} (${e.role}): score=${e.score}, grade=${e.grade}, completed=${e.stats.completed}/${e.stats.total}, overdue=${e.stats.overdue}`
    ).join('\n')

    const prompt = `You are an HR analytics AI assistant. Based on these employee productivity scores, write a brief team performance summary (3-4 sentences). Be specific, mention names, and give one actionable recommendation.

Employee Data:
${summary}

Keep it professional but conversational. No markdown formatting, just plain text.`

    return getGeminiInsight(prompt)
}

async function getSkillGapInsight(employees) {
    const summary = employees.slice(0, 10).map(e =>
        `${e.name} (${e.role}): has=[${e.skills?.join(', ')}], missing=[${e.gap?.missing?.join(', ')}], coverage=${e.gap?.coveragePercent}%`
    ).join('\n')

    const prompt = `You are an HR analytics AI assistant. Based on these skill gap results, write a brief summary (3-4 sentences). Highlight the biggest gaps, suggest training priorities, and mention which employees need the most attention.

Skill Data:
${summary}

Keep it professional but conversational. No markdown formatting, just plain text.`

    return getGeminiInsight(prompt)
}

async function getAssignmentInsight(task, recommendations) {
    const top3 = recommendations.slice(0, 3).map(r =>
        `${r.employee.name} (${r.employee.role}): score=${r.totalScore}, skills matched=${r.matchedSkills.join(', ') || 'none'}, active tasks=${r.activeTasks}`
    ).join('\n')

    const prompt = `You are an HR analytics AI assistant. A new task "${task.title}" needs to be assigned. Based on the ranking below, explain in 2-3 sentences why the top candidate is the best fit and any concerns about the others.

Top Candidates:
${top3}

Keep it professional but conversational. No markdown formatting, just plain text.`

    return getGeminiInsight(prompt)
}

module.exports = {
    calculateProductivityScore,
    detectSkillGap,
    recommendEmployee,
    getProductivityInsight,
    getSkillGapInsight,
    getAssignmentInsight,
    ROLE_SKILLS
}
