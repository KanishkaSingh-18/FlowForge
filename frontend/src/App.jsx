import { useEffect, useState } from 'react'
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import axiosInstance from './api/axiosInstance'
import Login from './pages/Login'
import Signup from './pages/Signup'
import ProtectedRoute from './components/ProtectedRoute'
import Projects from './pages/Projects'
import MyWork from './pages/MyWork'
import './App.css'

const navigation = [
  { label: 'Dashboard', icon: '▦' },
  { label: 'Projects', icon: '◫' },
  { label: 'My Work', icon: '☑' },
]

const EMPTY_METRICS = {
  totalTasks: 0,
  readyToStart: 0,
  blocked: 0,
}

function Dashboard() {
  const [activePage, setActivePage] = useState(() => {
    const savedPage = sessionStorage.getItem('flowforge_active_page')

    return navigation.some((item) => item.label === savedPage)
      ? savedPage
      : 'Dashboard'
  })
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [projects, setProjects] = useState([])
  const [projectsLoading, setProjectsLoading] = useState(false)
  const [projectError, setProjectError] = useState('')
  const [taskMetrics, setTaskMetrics] = useState(EMPTY_METRICS)
  const [metricsLoading, setMetricsLoading] = useState(true)
  const [metricsError, setMetricsError] = useState('')
  const [showProjectForm, setShowProjectForm] = useState(false)
  const [projectName, setProjectName] = useState('')
  const [projectDescription, setProjectDescription] = useState('')
  const [projectSaving, setProjectSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [notice, setNotice] = useState('')

  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const changeActivePage = (page) => {
    sessionStorage.setItem('flowforge_active_page', page)
    setActivePage(page)
  }

  useEffect(() => {
    sessionStorage.setItem('flowforge_active_page', activePage)
  }, [activePage])

  const fetchProjects = async () => {
    setProjectsLoading(true)
    setProjectError('')

    try {
      const response = await axiosInstance.get('/projects')
      setProjects(response.data.projects || [])
    } catch (error) {
      setProjectError(
        error.response?.data?.message ||
        'Unable to load projects. Please try again.',
      )
    } finally {
      setProjectsLoading(false)
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [])

  useEffect(() => {
    let cancelled = false

    const fetchTaskMetrics = async () => {
      setMetricsLoading(true)
      setMetricsError('')

      try {
        if (projects.length === 0) {
          if (!cancelled) {
            setTaskMetrics(EMPTY_METRICS)
          }
          return
        }

        const responses = await Promise.all(
          projects.map((project) =>
            axiosInstance.get(`/projects/${project._id}/dashboard`),
          ),
        )

        const metrics = responses.reduce(
          (total, response) => {
            const summary = response.data.summary || {}

            total.totalTasks += Number(summary.totalTasks) || 0
            total.readyToStart += Number(summary.readyToStart) || 0
            total.blocked += Number(summary.blocked) || 0

            return total
          },
          { ...EMPTY_METRICS },
        )

        if (!cancelled) {
          setTaskMetrics(metrics)
        }
      } catch (error) {
        if (!cancelled) {
          setMetricsError(
            error.response?.data?.message ||
            'Unable to load task metrics.',
          )
        }
      } finally {
        if (!cancelled) {
          setMetricsLoading(false)
        }
      }
    }

    fetchTaskMetrics()

    return () => {
      cancelled = true
    }
  }, [projects])

  const handleLogout = async () => {
    try {
      await logout()
      sessionStorage.removeItem('flowforge_active_page')
      navigate('/login', { replace: true })
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const handleCreateProject = async (event) => {
    event.preventDefault()
    setFormError('')
    setNotice('')

    if (!projectName.trim()) {
      setFormError('Please enter a project name.')
      return
    }

    if (projectName.trim().length > 100) {
      setFormError('Project name must be 100 characters or fewer.')
      return
    }

    if (projectDescription.trim().length > 1000) {
      setFormError('Description must be 1000 characters or fewer.')
      return
    }

    setProjectSaving(true)

    try {
      const response = await axiosInstance.post('/projects', {
        name: projectName.trim(),
        description: projectDescription.trim(),
      })

      const newProject = response.data.project

      setProjects((current) => [
        newProject,
        ...current.filter((project) => project._id !== newProject._id),
      ])

      setProjectName('')
      setProjectDescription('')
      setShowProjectForm(false)
      setNotice('Project created successfully.')
    } catch (error) {
      setFormError(
        error.response?.data?.message ||
        'Unable to create project. Please try again.',
      )
    } finally {
      setProjectSaving(false)
    }
  }

  const openProjects = () => {
    changeActivePage('Projects')
    setSidebarOpen(false)
    setNotice('')
    setProjectError('')
  }

  const openProjectFromMyWork = (projectId) => {
    changeActivePage('Projects')
    setSidebarOpen(false)
    setNotice('')
    setProjectError('')
    navigate(`/`, { state: { openProjectId: projectId } })
  }

  const initials = (user?.name || 'FF')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const metrics = [
    {
      label: 'Your projects',
      value: projects.length,
      icon: '◫',
      tone: 'blue',
    },
    {
      label: 'Total tasks',
      value: taskMetrics.totalTasks,
      icon: '▤',
      tone: 'purple',
    },
    {
      label: 'Ready to start',
      value: taskMetrics.readyToStart,
      icon: '↗',
      tone: 'green',
    },
    {
      label: 'Blocked tasks',
      value: taskMetrics.blocked,
      icon: '⊘',
      tone: 'orange',
    },
  ]

  return (
    <div className="app-shell">
      {sidebarOpen && (
        <button
          className="sidebar-overlay"
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <button
          className="brand"
          type="button"
          onClick={() => {
            changeActivePage('Dashboard')
            setSidebarOpen(false)
          }}
        >
          <span className="brand-mark">F</span>
          <span>flowforge</span>
        </button>

        <div className="workspace-label">WORKSPACE</div>

        <div className="workspace-switcher">
          <div className="workspace-avatar">W</div>
          <div className="workspace-info">
            <strong>My workspace</strong>
            <span>Personal space</span>
          </div>
          <span className="switcher-arrow">⌄</span>
        </div>

        <div className="nav-label">MENU</div>

        <nav className="sidebar-nav" aria-label="Main navigation">
          {navigation.map((item) => (
            <button
              key={item.label}
              type="button"
              className={`nav-item ${activePage === item.label ? 'nav-item-active' : ''
                }`}
              onClick={() => {
                changeActivePage(item.label)
                setSidebarOpen(false)
                setNotice('')
                setProjectError('')

                if (item.label === 'Projects') fetchProjects()
              }}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
              {item.label === 'Projects' && (
                <span className="nav-arrow">›</span>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="dependency-card">
            <div className="dependency-icon">↗</div>
            <strong>Work without blockers</strong>
            <p>
              Understand dependencies and know what to work on next.
            </p>
          </div>

          <div className="sidebar-footer">
            <span className="avatar avatar-purple">{initials}</span>
            <div className="profile-copy">
              <strong>{user?.name || 'Your account'}</strong>
              <span>{user?.email || 'Workspace member'}</span>
            </div>
          </div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="menu-toggle"
              type="button"
              aria-label="Toggle navigation"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              ☰
            </button>

            <span className="breadcrumb-muted">Workspace</span>
            <span className="breadcrumb-divider">/</span>
            <span className="breadcrumb-current">{activePage}</span>
          </div>

          <div className="topbar-right">
            <span className="status-dot" />
            <span className="connection-label">Workspace overview</span>
            <span className="avatar avatar-purple">{initials}</span>

            <button
              className="navbar-logout"
              type="button"
              onClick={handleLogout}
              title="Log out of FlowForge"
              aria-label="Log out of FlowForge"
            >
              <span aria-hidden="true">⇥</span>
              <span>Log out</span>
            </button>
          </div>
        </header>

        <div className="page-content">
          {activePage === 'Projects' ? (
            <Projects />
          ) : activePage === 'My Work' ? (
            <MyWork onOpenProject={openProjectFromMyWork} />
          ) : (
            <>
              <div className="welcome-row">
                <div>
                  <div className="eyebrow">YOUR WORKSPACE</div>
                  <h1>{activePage}</h1>
                  <p className="page-subtitle">
                    {activePage === 'Dashboard'
                      ? `Welcome back, ${user?.name?.split(' ')[0] || 'there'
                      }! Here's a clearer view of your work, priorities, and progress.`
                      : `Keep your ${activePage.toLowerCase()} organized in one place.`}
                  </p>
                </div>

                <div className="date-chip">
                  <span>◷</span> Project workspace
                </div>
              </div>

              {notice && (
                <div className="app-notice" role="status">
                  <span>✓</span> {notice}
                  <button
                    type="button"
                    aria-label="Dismiss notification"
                    onClick={() => setNotice('')}
                  >
                    ×
                  </button>
                </div>
              )}

              {activePage === 'Dashboard' ? (
                <>
                  <section className="intro-banner">
                    <div className="intro-copy">
                      <span className="banner-kicker">
                        <span className="banner-kicker-dot" />
                        PLAN WITH CLARITY
                      </span>
                      <h2>Make progress, not just plans.</h2>
                      <p>
                        Bring projects, tasks, and dependencies together.
                        Know what is blocked, what is ready, and what comes next.
                      </p>
                    </div>

                    <div className="banner-art" aria-hidden="true">
                      <div className="art-orbit orbit-one" />
                      <div className="art-orbit orbit-two" />
                      <div className="art-center">F</div>
                      <div className="art-node node-one">✓</div>
                      <div className="art-node node-two">↗</div>
                      <div className="art-node node-three">◎</div>
                    </div>
                  </section>

                  <section className="section-heading">
                    <div>
                      <h2>Overview</h2>
                      <p>
                        {projects.length
                          ? 'Your workspace project overview.'
                          : 'Create a project to start tracking your work.'}
                      </p>
                    </div>
                    <span className="live-label">
                      <span /> Live workspace data
                    </span>
                  </section>

                  {metricsError && (
                    <div className="projects-error" role="alert">
                      {metricsError}
                      <button
                        type="button"
                        onClick={() => setMetricsError('')}
                        aria-label="Dismiss metrics error"
                      >
                        ×
                      </button>
                    </div>
                  )}

                  <section className="metrics-grid">
                    {metrics.map((metric) => {
                      const isLoading =
                        metric.label === 'Your projects'
                          ? projectsLoading
                          : metricsLoading

                      return (
                        <article className="metric-card" key={metric.label}>
                          <div className={`metric-icon ${metric.tone}`}>
                            {metric.icon}
                          </div>
                          <span className="metric-label">{metric.label}</span>
                          <div className="metric-value">
                            {isLoading ? '…' : metric.value}
                          </div>
                          <span className="metric-note">
                            {metric.label === 'Your projects'
                              ? 'Across your workspace'
                              : 'Across all your projects'}
                          </span>
                        </article>
                      )
                    })}
                  </section>

                  <section className="content-grid">
                    <article className="panel projects-panel">
                      <div className="panel-heading">
                        <div>
                          <h2>Your projects</h2>
                          <p>Keep every milestone moving forward.</p>
                        </div>
                        <button
                          className="text-action"
                          type="button"
                          onClick={openProjects}
                        >
                          View projects <span>→</span>
                        </button>
                      </div>

                      {projectsLoading ? (
                        <div className="project-message">
                          Loading projects…
                        </div>
                      ) : projectError ? (
                        <div className="project-message error-message">
                          {projectError}
                          <button
                            type="button"
                            className="secondary-button"
                            onClick={fetchProjects}
                          >
                            Try again
                          </button>
                        </div>
                      ) : projects.length === 0 ? (
                        <div className="empty-state">
                          <div className="empty-illustration">
                            <div className="empty-sheet sheet-back" />
                            <div className="empty-sheet sheet-front">
                              <span />
                              <span />
                              <span />
                            </div>
                            <div className="empty-plus">+</div>
                          </div>
                          <h3>Your next project starts here</h3>
                          <p>
                            Create a project to organize tasks, set deadlines,
                            and map out what needs to happen first.
                          </p>
                          <button
                            className="primary-button"
                            type="button"
                            onClick={() => {
                              changeActivePage('Projects')
                              setShowProjectForm(true)
                            }}
                          >
                            Create your first project <span>→</span>
                          </button>
                        </div>
                      ) : (
                        <div className="dashboard-project-list">
                          {projects.slice(0, 3).map((project) => (
                            <button
                              type="button"
                              className="dashboard-project-item"
                              key={project._id}
                              onClick={() => {
                                changeActivePage('Projects')
                                setSidebarOpen(false)
                                navigate('/', {
                                  state: { openProjectId: project._id },
                                })
                              }}
                            >
                              <span className="project-mini-icon">◫</span>
                              <span className="dashboard-project-copy">
                                <strong>{project.name}</strong>
                                <span>
                                  {project.description || 'No description added'}
                                </span>
                              </span>
                              <span className="project-item-arrow">→</span>
                            </button>
                          ))}
                          <button
                            className="primary-button"
                            type="button"
                            onClick={openProjects}
                          >
                            Manage projects <span>→</span>
                          </button>
                        </div>
                      )}
                    </article>

                    <article className="panel intelligence-panel">
                      <div className="panel-heading">
                        <div>
                          <div className="feature-overline">
                            FLOWFORGE FEATURE
                          </div>
                          <h2>Dependency intelligence</h2>
                        </div>
                        <div className="feature-icon">⌘</div>
                      </div>

                      <p className="feature-description">
                        Understand how tasks connect, identify blockers,
                        and find the next task you can actually start.
                      </p>

                      <div className="dependency-example">
                        <div className="dependency-step">
                          <span className="step-marker completed">✓</span>
                          <div>
                            <strong>Prerequisite task</strong>
                            <span>Complete the required work</span>
                          </div>
                          <span className="step-status">Done</span>
                        </div>
                        <div className="dependency-connector" />
                        <div className="dependency-step">
                          <span className="step-marker ready">↗</span>
                          <div>
                            <strong>Dependent task</strong>
                            <span>Ready when prerequisites are done</span>
                          </div>
                          <span className="step-status ready-text">Ready</span>
                        </div>
                      </div>

                      <div className="feature-footnote">
                        <span>✳</span>
                        <p>
                          Task dependency status appears inside each project.
                        </p>
                      </div>
                    </article>
                  </section>

                  <footer className="page-footer">
                    <span>FlowForge</span>
                    <span>Build with clarity. Move with purpose.</span>
                  </footer>
                </>
              ) : (
                <section className="panel placeholder-panel">
                  <div className="placeholder-icon">✳</div>
                  <h2>{activePage} is next</h2>
                  <p>
                    This section is ready for integration with your existing
                    backend. We will connect task management and activity next.
                  </p>
                  <button
                    className="secondary-button"
                    type="button"
                    onClick={() => changeActivePage('Dashboard')}
                  >
                    Back to dashboard
                  </button>
                </section>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Dashboard />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
