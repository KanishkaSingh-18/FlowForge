import { useState } from 'react'
import './App.css'

const navigation = [
  { label: 'Dashboard', icon: '▦' },
  { label: 'Projects', icon: '◫' },
  { label: 'My Tasks', icon: '☑' },
  { label: 'Activity', icon: '↗' },
]

function App() {
  const [activePage, setActivePage] = useState('Dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)

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
        <a className="brand" href="#" onClick={() => setActivePage('Dashboard')}>
          <span className="brand-mark">F</span>
          <span>flowforge</span>
        </a>

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
              className={`nav-item ${activePage === item.label ? 'nav-item-active' : ''
                }`}
              onClick={() => {
                setActivePage(item.label)
                setSidebarOpen(false)
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
            <p>Understand dependencies and know what to work on next.</p>
          </div>

          <div className="sidebar-footer">
            <span className="avatar avatar-purple">FF</span>
            <div className="profile-copy">
              <strong>Your account</strong>
              <span>Workspace member</span>
            </div>
            <span className="footer-menu">···</span>
          </div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="menu-toggle"
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
            <span className="avatar avatar-purple">FF</span>
          </div>
        </header>

        <div className="page-content">
          <div className="welcome-row">
            <div>
              <div className="eyebrow">YOUR WORKSPACE</div>
              <h1>{activePage}</h1>
              <p className="page-subtitle">
                {activePage === 'Dashboard'
                  ? 'A clearer view of your work, priorities, and progress.'
                  : `Keep your ${activePage.toLowerCase()} organized in one place.`}
              </p>
            </div>

            <div className="date-chip">
              <span>◷</span> Project workspace
            </div>
          </div>

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
                  <p>Your project metrics will appear here.</p>
                </div>
                <span className="live-label">
                  <span /> Live workspace data
                </span>
              </section>

              <section className="metrics-grid">
                {[
                  { label: 'Total tasks', icon: '▤', tone: 'blue' },
                  { label: 'In progress', icon: '◷', tone: 'purple' },
                  { label: 'Ready to start', icon: '↗', tone: 'green' },
                  { label: 'Blocked tasks', icon: '⊘', tone: 'orange' },
                ].map((metric) => (
                  <article className="metric-card" key={metric.label}>
                    <div className={`metric-icon ${metric.tone}`}>
                      {metric.icon}
                    </div>
                    <span className="metric-label">{metric.label}</span>
                    <div className="metric-value">—</div>
                    <span className="metric-note">Awaiting project data</span>
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
                      onClick={() => setActivePage('Projects')}
                    >
                      View projects <span>→</span>
                    </button>
                  </div>

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
                      onClick={() => setActivePage('Projects')}
                    >
                      Explore projects <span>→</span>
                    </button>
                  </div>
                </article>

                <article className="panel intelligence-panel">
                  <div className="panel-heading">
                    <div>
                      <div className="feature-overline">FLOWFORGE FEATURE</div>
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
                      Dependency status will be calculated by your backend.
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
                The application shell is ready. We'll connect this section
                to your existing backend APIs in the next milestones.
              </p>
              <button
                className="secondary-button"
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

export default App
