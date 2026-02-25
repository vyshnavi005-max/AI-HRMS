const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')
require('dotenv').config()

const app = express()

// routes
const authRoutes = require('./routes/auth')
const employeeRoutes = require('./routes/employees')
const taskRoutes = require('./routes/tasks')
const dashboardRoutes = require('./routes/dashboard')
const aiRoutes = require('./routes/ai')

app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

app.use('/api/auth', authRoutes)
app.use('/api/employees', employeeRoutes)
app.use('/api/tasks', taskRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/ai', aiRoutes)

// quick health check
app.get('/api/health', (req, res) => {
    res.json({ ok: true })
})

// catch-all error handler
app.use((err, req, res, next) => {
    console.error(err)
    res.status(500).json({ error: 'Something broke on our end' })
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
    console.log(`server running on port ${PORT}`)
})
