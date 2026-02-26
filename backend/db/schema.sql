-- PulseHR Database Schema

-- organizations (admin accounts / tenants)
CREATE TABLE IF NOT EXISTS organizations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  industry VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

-- employees (belong to an org, can also log in)
CREATE TABLE IF NOT EXISTS employees (
  id SERIAL PRIMARY KEY,
  org_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255),
  role VARCHAR(100) NOT NULL,
  department VARCHAR(100) NOT NULL,
  skills TEXT[] DEFAULT '{}',
  wallet_address VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE,
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(org_id, email)
);

-- tasks (assigned to employees within an org)
CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  org_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  employee_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  required_skills TEXT[] DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'Assigned' CHECK (status IN ('Assigned', 'In Progress', 'Completed')),
  priority VARCHAR(20) DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High')),
  due_date DATE,
  completed_at TIMESTAMP,
  tx_hash VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_employees_org ON employees(org_id);
CREATE INDEX IF NOT EXISTS idx_tasks_org ON tasks(org_id);
CREATE INDEX IF NOT EXISTS idx_tasks_employee ON tasks(employee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
