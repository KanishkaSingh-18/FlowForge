import { useEffect, useState } from 'react'
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import axiosInstance from './api/axiosInstance'
import Login from './pages/Login'
import Signup from './pages/Signup'
import ProtectedRoute from './components/ProtectedRoute'
import './App.css'

const navigation = [
  { label: 'Dashboard', icon: '▦' },
  { label: 'Projects', icon: '◫' },
  { label: 'My Tasks', icon: '☑' },
  { label: 'Activity', icon: '↗' },
]

function Dashboard() {
  const [activePage, setActivePage] = useState('Dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [projects, setProjects] = useState([])
  const [projectsLoading, setProjectsLoading] = useState(false)
  const [projectError, setProjectError] = useState('')
  const [showProjectForm, setShowProjectForm] = useState(false)
  const [projectName, setProjectName] = useState('')
  const [projectDescription, setProjectDescription] = useState('')
  const [projectSaving, setProjectSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [notice, setNotice] = useState('')
  const [deletingProjectId, setDeletingProjectId] = useState(null)

  const { user, logout } = useAuth()
  const navigate = useNavigate()

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

  const handleLogout = async () => {
    try {
      await logout()
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

  const handleDeleteProject = async (project) => {
    const confirmed = window.confirm(
      `Delete "${project.name}"? This action cannot be undone.`,
    )

    if (!confirmed) return

    setDeletingProjectId(project._id)
    setNotice('')
    setProjectError('')

    try {
      await axiosInstance.delete(`/projects/${project._id}`)
      setProjects((current) =>
        current.filter((item) => item._id !== project._id),
      )
      setNotice(`"${project.name}" was deleted.`)
    } catch (error) {
      setProjectError(
        error.response?.data?.message ||
        'Unable to delete this project.',
      )
    } finally {
      setDeletingProjectId(null)
    }
  }

  const openProjects = () => {
    setActivePage('Projects')
    setSidebarOpen(false)
  }

  const isProjectOwner = (project) => {
    const ownerId =
      typeof project.owner === 'object'
        ? project.owner?._id
        : project.owner

    return ownerId === user?._id
  }

  const initials = (user?.name || 'FF')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

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
          onClick={() => setActivePage('Dashboard')}
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
                setActivePage(item.label)
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

              <section className="metrics-grid">
                {[
                  {
                    label: 'Your projects',
                    value: projects.length,
                    icon: '◫',
                    tone: 'blue',
                  },
                  {
                    label: 'Total tasks',
                    value: '—',
                    icon: '▤',
                    tone: 'purple',
                  },
                  {
                    label: 'Ready to start',
                    value: '—',
                    icon: '↗',
                    tone: 'green',
                  },
                  {
                    label: 'Blocked tasks',
                    value: '—',
                    icon: '⊘',
                    tone: 'orange',
                  },
                ].map((metric) => (
                  <article className="metric-card" key={metric.label}>
                    <div className={`metric-icon ${metric.tone}`}>
                      {metric.icon}
                    </div>
                    <span className="metric-label">{metric.label}</span>
                    <div className="metric-value">
                      {projectsLoading && metric.label === 'Your projects'
                        ? '…'
                        : metric.value}
                    </div>
                    <span className="metric-note">
                      {metric.label === 'Your projects'
                        ? 'Across your workspace'
                        : 'Select a project to view metrics'}
                    </span>
                  </article>
                ))}
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
                    <div className="project-message">Loading projects…</div>
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
                          setActivePage('Projects')
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
                          onClick={() => openProjects()}
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
                      Task dependency status will appear when you open a project.
                    </p>
                  </div>
                </article>
              </section>

              <footer className="page-footer">
                <span>FlowForge</span>
                <span>Build with clarity. Move with purpose.</span>
              </footer>
            </>
          ) : activePage === 'Projects' ? (
            <section className="panel projects-page-panel">
              <div className="panel-heading projects-page-heading">
                <div>
                  <h2>Projects</h2>
                  <p>Create and manage your personal or team projects.</p>
                </div>
                <button
                  className="primary-button"
                  type="button"
                  onClick={() => {
                    setShowProjectForm((current) => !current)
                    setFormError('')
                  }}
                >
                  {showProjectForm ? 'Cancel' : '+ New project'}
                </button>
              </div>

              {showProjectForm && (
                <form className="project-form" onSubmit={handleCreateProject}>
                  <h3>Create a new project</h3>
                  <label htmlFor="project-name">Project name</label>
                  <input
                    id="project-name"
                    type="text"
                    maxLength={100}
                    value={projectName}
                    onChange={(event) => setProjectName(event.target.value)}
                    placeholder="e.g. Semester project"
                    required
                  />

                  <label htmlFor="project-description">Description (optional)</label>
                  <textarea
                    id="project-description"
                    maxLength={1000}
                    rows={3}
                    value={projectDescription}
                    onChange={(event) =>
                      setProjectDescription(event.target.value)
                    }
                    placeholder="What do you want to accomplish?"
                  />

                  {formError && (
                    <p className="form-error" role="alert">{formError}</p>
                  )}

                  <button
                    className="primary-button"
                    type="submit"
                    disabled={projectSaving}
                  >
                    {projectSaving ? 'Creating…' : 'Create project'}
                  </button>
                </form>
              )}

              {projectError && (
                <div className="project-message error-message" role="alert">
                  {projectError}
                  <button
                    className="secondary-button"
                    type="button"
                    onClick={fetchProjects}
                  >
                    Retry
                  </button>
                </div>
              )}

              {projectsLoading ? (
                <div className="project-message">Loading your projects…</div>
              ) : projects.length === 0 ? (
                <div className="empty-state projects-empty-state">
                  <div className="empty-illustration">
                    <div className="empty-sheet sheet-back" />
                    <div className="empty-sheet sheet-front">
                      <span />
                      <span />
                      <span />
                    </div>
                    <div className="empty-plus">+</div>
                  </div>
                  <h3>No projects yet</h3>
                  <p>
                    Create your first project to start organizing tasks,
                    deadlines, and dependencies.
                  </p>
                  {!showProjectForm && (
                    <button
                      className="primary-button"
                      type="button"
                      onClick={() => setShowProjectForm(true)}
                    >
                      + Create project
                    </button>
                  )}
                </div>
              ) : (
                <div className="projects-list">
                  {projects.map((project) => (
                    <article className="project-card" key={project._id}>
                      <div className="project-card-top">
                        <div className="project-card-icon">◫</div>
                        <span className="project-member-count">
                          {(project.members || []).length}{' '}
                          {(project.members || []).length === 1
                            ? 'member'
                            : 'members'}
                        </span>
                      </div>

                      <h3>{project.name}</h3>
                      <p className="project-description">
                        {project.description || 'No description provided yet.'}
                      </p>

                      <div className="project-card-meta">
                        <span>
                          Owner:{' '}
                          {typeof project.owner === 'object'
                            ? project.owner?.name || 'Unknown'
                            : isProjectOwner(project)
                              ? user?.name || 'You'
                              : 'Project owner'}
                        </span>
                        <span>
                          Updated{' '}
                          {project.updatedAt
                            ? new Date(project.updatedAt).toLocaleDateString()
                            : 'recently'}
                        </span>
                      </div>

                      <div className="project-card-actions">
                        <button
                          className="secondary-button"
                          type="button"
                          onClick={() => {
                            setNotice(
                              'Project tasks and dependency views are the next integration step.',
                            )
                          }}
                        >
                          Open project <span>→</span>
                        </button>

                        {isProjectOwner(project) && (
                          <button
                            className="delete-project-button"
                            type="button"
                            disabled={deletingProjectId === project._id}
                            onClick={() => handleDeleteProject(project)}
                          >
                            {deletingProjectId === project._id
                              ? 'Deleting…'
                              : 'Delete'}
                          </button>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
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
                onClick={() => setActivePage('Dashboard')}
              >
                Back to dashboard
              </button>
            </section>
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
