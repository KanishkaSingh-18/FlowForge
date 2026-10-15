import { useEffect, useState } from 'react'
import axiosInstance from '../api/axiosInstance'
import ProjectWorkspace from './ProjectWorkspace'
import './Projects.css'

function Projects() {
    const [projects, setProjects] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [showForm, setShowForm] = useState(false)
    const [saving, setSaving] = useState(false)
    const [editingId, setEditingId] = useState(null)
    const [selectedProject, setSelectedProject] = useState(null)
    const [form, setForm] = useState({
        name: '',
        description: '',
        type: 'solo',
    })
    const [actionError, setActionError] = useState('')
    const [confirmDelete, setConfirmDelete] = useState(null)
    const [deleting, setDeleting] = useState(false)

    const loadProjects = async () => {
        setLoading(true)
        setError('')

        try {
            const response = await axiosInstance.get('/projects')
            setProjects(response.data.projects || [])
        } catch (err) {
            setError(
                err.response?.data?.message ||
                'Unable to load projects. Please try again.',
            )
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadProjects()
    }, [])

    const openCreateForm = () => {
        setForm({ name: '', description: '', type: 'solo' })
        setEditingId(null)
        setActionError('')
        setShowForm(true)
    }

    const openEditForm = (project) => {
        setForm({
            name: project.name || '',
            description: project.description || '',
            type: project.type || 'solo',
        })
        setEditingId(project._id)
        setActionError('')
        setShowForm(true)
    }

    const closeForm = () => {
        if (saving) return
        setShowForm(false)
        setEditingId(null)
        setActionError('')
    }

    const handleSubmit = async (event) => {
        event.preventDefault()
        setActionError('')

        const name = form.name.trim()
        const description = form.description.trim()

        if (!name) {
            setActionError('Please enter a project name.')
            return
        }

        if (name.length > 100) {
            setActionError('Project name must be 100 characters or fewer.')
            return
        }

        if (description.length > 1000) {
            setActionError('Description must be 1000 characters or fewer.')
            return
        }

        if (!['solo', 'team'].includes(form.type)) {
            setActionError('Please select a valid project type.')
            return
        }

        setSaving(true)

        try {
            if (editingId) {
                const response = await axiosInstance.patch(
                    `/projects/${editingId}`,
                    {
                        name,
                        description,
                        type: form.type,
                    },
                )

                const updatedProject = response.data.project

                setProjects((current) =>
                    current.map((project) =>
                        project._id === editingId
                            ? { ...project, ...updatedProject }
                            : project,
                    ),
                )

                setSelectedProject((current) =>
                    current?._id === editingId
                        ? { ...current, ...updatedProject }
                        : current,
                )
            } else {
                const response = await axiosInstance.post('/projects', {
                    name,
                    description,
                    type: form.type,
                })

                setProjects((current) => [
                    response.data.project,
                    ...current,
                ])
            }

            setShowForm(false)
            setEditingId(null)
            setForm({ name: '', description: '', type: 'solo' })
        } catch (err) {
            setActionError(
                err.response?.data?.message ||
                `Unable to ${editingId ? 'update' : 'create'} the project.`,
            )
        } finally {
            setSaving(false)
        }
    }

    const openDetails = async (project) => {
        setActionError('')
        setSelectedProject(project)

        try {
            const response = await axiosInstance.get(
                `/projects/${project._id}`,
            )

            if (response.data.project) {
                setSelectedProject(response.data.project)
            }
        } catch (err) {
            setActionError(
                err.response?.data?.message ||
                'Unable to refresh project details.',
            )
        }
    }

    const handleDelete = async (projectId) => {
        if (deleting) return

        setDeleting(true)
        setActionError('')

        try {
            await axiosInstance.delete(`/projects/${projectId}`)

            setProjects((current) =>
                current.filter((project) => project._id !== projectId),
            )

            setConfirmDelete(null)
        } catch (err) {
            setActionError(
                err.response?.data?.message ||
                'Unable to delete this project.',
            )
        } finally {
            setDeleting(false)
        }
    }

    const formatDate = (date) => {
        if (!date) return 'Recently created'

        return new Date(date).toLocaleDateString(undefined, {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        })
    }

    const getOwnerId = (project) =>
        typeof project.owner === 'object'
            ? project.owner?._id
            : project.owner

    if (selectedProject) {
        return (
            <ProjectWorkspace
                project={selectedProject}
                onBack={() => {
                    setSelectedProject(null)
                    setActionError('')
                }}
            />
        )
    }

    return (
        <section className="projects-page">
            <div className="projects-heading">
                <div>
                    <span className="projects-eyebrow">YOUR WORKSPACE</span>
                    <h2>All projects</h2>
                    <p>
                        Organize your work, bring your team together, and keep
                        every project moving forward.
                    </p>
                </div>

                <button
                    className="projects-create-button"
                    type="button"
                    onClick={openCreateForm}
                >
                    <span aria-hidden="true">+</span> New project
                </button>
            </div>

            <div className="projects-summary">
                <div className="projects-summary-icon">◫</div>
                <div>
                    <span>Total projects</span>
                    <strong>{loading ? '—' : projects.length}</strong>
                </div>
            </div>

            {actionError && !showForm && (
                <div className="projects-error" role="alert">
                    {actionError}
                    <button
                        type="button"
                        onClick={() => setActionError('')}
                        aria-label="Dismiss error"
                    >
                        ×
                    </button>
                </div>
            )}

            {loading ? (
                <div className="projects-state">
                    <div className="projects-spinner" />
                    <p>Loading your projects...</p>
                </div>
            ) : error ? (
                <div className="projects-state projects-state-error">
                    <div className="projects-state-icon">!</div>
                    <h3>Couldn't load projects</h3>
                    <p>{error}</p>
                    <button
                        className="projects-secondary-button"
                        type="button"
                        onClick={loadProjects}
                    >
                        Try again
                    </button>
                </div>
            ) : projects.length === 0 ? (
                <div className="projects-empty">
                    <div className="projects-empty-art">
                        <span>◫</span>
                        <i>+</i>
                    </div>
                    <h3>Your first project starts here</h3>
                    <p>
                        Create a project for a personal goal, a college assignment,
                        or a team collaboration. You can organize its tasks next.
                    </p>
                    <button
                        className="projects-create-button"
                        type="button"
                        onClick={openCreateForm}
                    >
                        <span aria-hidden="true">+</span> Create your first project
                    </button>
                </div>
            ) : (
                <div className="projects-grid">
                    {projects.map((project) => {
                        const isOwner =
                            getOwnerId(project) ===
                            (project.owner?._id || project.owner)

                        return (
                            <article className="project-card" key={project._id}>
                                <div className="project-card-top">
                                    <div className="project-card-icon">◫</div>

                                    <div className="project-card-top-actions">
                                        <span
                                            className={`project-type-badge ${project.type === 'team'
                                                    ? 'project-type-team'
                                                    : 'project-type-solo'
                                                }`}
                                        >
                                            {project.type === 'team'
                                                ? 'Team Project'
                                                : 'Solo Project'}
                                        </span>

                                        {isOwner && (
                                            <>
                                                <button
                                                    type="button"
                                                    className="project-icon-button project-edit-button"
                                                    onClick={() => openEditForm(project)}
                                                    title="Edit project"
                                                    aria-label={`Edit ${project.name}`}
                                                >
                                                    <svg
                                                        width="18"
                                                        height="18"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth="1.8"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        aria-hidden="true"
                                                    >
                                                        <path d="m15 5 4 4" />
                                                        <path d="M4 20l4.5-1 10.8-10.8a2.1 2.1 0 0 0-3-3L5.5 15.9 4 20Z" />
                                                    </svg>
                                                </button>

                                                <button
                                                    type="button"
                                                    className="project-icon-button project-delete-button"
                                                    onClick={() => setConfirmDelete(project)}
                                                    title="Delete project"
                                                    aria-label={`Delete ${project.name}`}
                                                >
                                                    <svg
                                                        width="18"
                                                        height="18"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth="1.8"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        aria-hidden="true"
                                                    >
                                                        <path d="M3 6h18" />
                                                        <path d="M8 6V4h8v2" />
                                                        <path d="m19 6-1 14H6L5 6" />
                                                        <path d="M10 11v5M14 11v5" />
                                                    </svg>
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div className="project-card-title-row">
                                    <h3>{project.name}</h3>
                                </div>

                                <p className="project-card-description">
                                    {project.description ||
                                        'No description yet. Add one to explain what this project is about.'}
                                </p>

                                <div className="project-card-meta">
                                    <span>
                                        <span aria-hidden="true">♙</span>{' '}
                                        {project.members?.length || 0}{' '}
                                        {(project.members?.length || 0) === 1
                                            ? 'member'
                                            : 'members'}
                                    </span>
                                    <span>
                                        Updated {formatDate(project.updatedAt)}
                                    </span>
                                </div>

                                <div className="project-card-actions">
                                    <button
                                        type="button"
                                        className="project-open-button"
                                        onClick={() => openDetails(project)}
                                    >
                                        Open project
                                        <span aria-hidden="true">→</span>
                                    </button>
                                </div>
                            </article>
                        )
                    })}
                </div>
            )}

            {showForm && (
                <div
                    className="projects-modal-backdrop"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) closeForm()
                    }}
                >
                    <section
                        className="projects-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="project-form-title"
                    >
                        <div className="projects-modal-heading">
                            <div>
                                <span className="projects-eyebrow">
                                    PROJECT WORKSPACE
                                </span>
                                <h2 id="project-form-title">
                                    {editingId ? 'Edit project' : 'Create a project'}
                                </h2>
                                <p>
                                    {editingId
                                        ? 'Update your project details.'
                                        : 'Give your project a name and a clear purpose.'}
                                </p>
                            </div>

                            <button
                                type="button"
                                className="projects-modal-close"
                                onClick={closeForm}
                                aria-label="Close form"
                            >
                                ×
                            </button>
                        </div>

                        <form className="projects-form" onSubmit={handleSubmit}>
                            <label htmlFor="project-name">Project name *</label>
                            <input
                                id="project-name"
                                type="text"
                                placeholder="e.g. Final year project"
                                value={form.name}
                                onChange={(event) =>
                                    setForm({ ...form, name: event.target.value })
                                }
                                maxLength={100}
                                required
                                autoFocus
                            />

                            <div className="projects-field-meta">
                                <span>Choose a name that's easy to recognize.</span>
                                <span>{form.name.length}/100</span>
                            </div>

                            <label htmlFor="project-description">Description</label>
                            <textarea
                                id="project-description"
                                placeholder="What are you building or trying to achieve?"
                                value={form.description}
                                onChange={(event) =>
                                    setForm({
                                        ...form,
                                        description: event.target.value,
                                    })
                                }
                                maxLength={1000}
                                rows={4}
                            />

                            <div className="projects-field-meta">
                                <span>Optional, but useful for your team.</span>
                                <span>{form.description.length}/1000</span>
                            </div>

                            <label htmlFor="project-type">Project type *</label>
                            <select
                                id="project-type"
                                className="projects-form-select"
                                value={form.type}
                                onChange={(event) =>
                                    setForm({
                                        ...form,
                                        type: event.target.value,
                                    })
                                }
                                required
                            >
                                <option value="solo">Solo project — just me</option>
                                <option value="team">
                                    Team project — collaborate with others
                                </option>
                            </select>

                            <div className="projects-field-meta">
                                <span>
                                    {form.type === 'solo'
                                        ? 'Manage your personal work and dependencies.'
                                        : 'Create a shared project and add registered members.'}
                                </span>
                            </div>

                            {actionError && (
                                <div className="projects-error" role="alert">
                                    {actionError}
                                </div>
                            )}

                            <div className="projects-form-actions">
                                <button
                                    type="button"
                                    className="projects-secondary-button"
                                    onClick={closeForm}
                                    disabled={saving}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="projects-create-button"
                                    disabled={saving}
                                >
                                    {saving
                                        ? 'Saving...'
                                        : editingId
                                            ? 'Save changes'
                                            : 'Create project'}
                                </button>
                            </div>
                        </form>
                    </section>
                </div>
            )}

            {confirmDelete && (
                <div
                    className="projects-modal-backdrop"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget && !deleting) {
                            setConfirmDelete(null)
                        }
                    }}
                >
                    <section
                        className="projects-modal projects-confirm-modal"
                        role="alertdialog"
                        aria-modal="true"
                        aria-labelledby="delete-project-title"
                    >
                        <div className="projects-delete-symbol">!</div>
                        <h2 id="delete-project-title">Delete this project?</h2>
                        <p>
                            You're about to delete{' '}
                            <strong>{confirmDelete.name}</strong>. This action
                            cannot be undone.
                        </p>
                        <div className="projects-form-actions">
                            <button
                                type="button"
                                className="projects-secondary-button"
                                onClick={() => setConfirmDelete(null)}
                                disabled={deleting}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="projects-danger-button"
                                onClick={() => handleDelete(confirmDelete._id)}
                                disabled={deleting}
                            >
                                {deleting ? 'Deleting...' : 'Delete project'}
                            </button>
                        </div>
                    </section>
                </div>
            )}
        </section>
    )
}

export default Projects
