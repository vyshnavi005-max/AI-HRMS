const jwt = require('jsonwebtoken')

const SECRET = process.env.JWT_SECRET || 'dev_secret_change_this'

// main auth middleware — works for both admin and employee tokens
function authMiddleware(req, res, next) {
    const token = req.cookies?.token
    if (!token) return res.status(401).json({ error: 'Please log in' })

    try {
        const decoded = jwt.verify(token, SECRET)
        // token has { id, role: 'admin'|'employee', orgId, ... }
        req.user = decoded
        // keep backwards compat — old code uses req.org.id
        req.org = { id: decoded.orgId || decoded.id }
        next()
    } catch {
        res.clearCookie('token', { httpOnly: true, sameSite: 'lax' })
        res.status(401).json({ error: 'Session expired, please log in again' })
    }
}

// restrict route to admin only
function adminOnly(req, res, next) {
    if (req.user?.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' })
    }
    next()
}

// restrict route to employee only
function employeeOnly(req, res, next) {
    if (req.user?.role !== 'employee') {
        return res.status(403).json({ error: 'Employee access required' })
    }
    next()
}

module.exports = { authMiddleware, adminOnly, employeeOnly }
