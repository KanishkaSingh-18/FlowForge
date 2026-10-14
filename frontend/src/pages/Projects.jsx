import { useEffect, useState } from 'react'
import axiosInstance from '../api/axiosInstance'
import './Projects.css'

function Projects() {
    const [projects, setProjects] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [showForm, setShowForm] = useState(false)
    const [saving, setSaving] = useState(false)
    const [editingId, setEditingId] = useState(null)
    const [selectedProject, setSelectedProject] = useState(null)
    const [form, setForm] = useState({ name: '', description: '' })
    const [actionError, setActionError] = useState('')
    const [confirmDelete, setConfirmDelete] = useState(null)

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
        setForm({ name: '', description: '' })
        setEditingId(null)
        setActionError('')
        setShowForm(true)
    }

    const openEditForm = (project) => {
        setForm({
            name: project.name || '',
            description: project.description || '',
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

        setSaving(true)

        try {
            if (editingId) {
                const response = await axiosInstance.patch(
                    `/projects/${editingId}`,
                    { name, description },
                )

                setProjects((current) =>
                    current.map((project) =>
                        project._id === editingId
                            ? { ...project, ...response.data.project }
                            : project,
                    ),
                )

                setSelectedProject((current) =>
                    current?._id === editingId
                        ? { ...current, ...response.data.project }
                        : current,
                )
            } else {
                const response = await axiosInstance.post('/projects', {
                    name,
                    description,
                })

                setProjects((current) => [
                    response.data.project,
                    ...current,
                ])
            }

            setShowForm(false)
            setEditingId(null)
            setForm({ name: '', description: '' })
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
        setSelectedProject(project)
        setActionError('')

        try {
            const response = await axiosInstance.get(`/projects/${project._id}`)
            setSelectedProject(response.data.project)
        } catch (err) {
            setActionError(
                err.response?.data?.message ||
                'Unable to load project details.',
            )
        }
    }

    const handleDelete = async (projectId) => {
        setActionError('')

        try {
            await axiosInstance.delete(`/projects/${projectId}`)

            setProjects((current) =>
                current.filter((project) => project._id !== projectId),
            )

            if (selectedProject?._id === projectId) {
                setSelectedProject(null)
            }

            setConfirmDelete(null)
        } catch (err) {
            setActionError(
                err.response?.data?.message ||
                'Unable to delete this project.',
            )
            setConfirmDelete(null)
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

    const getMemberName = (member) => {
        const person = member.user
        return typeof person === 'object'
            ? person?.name || person?.email || 'Member'
            : 'Member'
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
                        const isOwner = Boolean(
                            project.owner &&
                            getOwnerId(project) &&
                            String(getOwnerId(project)) ===
                            String(
                                typeof project.owner === 'object'
                                    ? project.owner._id
                                    : project.owner,
                            ),
                        )

                        return (
                            <article className="project-card" key={project._id}>
                                <div className="project-card-top">
                                    <div className="project-card-icon">◫</div>
                                    <span className="project-role">
                                        {isOwner ? 'Project' : 'Shared'}
                                    </span>
                                </div>

                                <h3>{project.name}</h3>
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
                                        View details <span aria-hidden="true">→</span>
                                    </button>

                                    <button
                                        type="button"
                                        className="project-icon-button"
                                        onClick={() => openEditForm(project)}
                                        title="Edit project"
                                        aria-label={`Edit ${project.name}`}
                                    >
                                        ✎
                                    </button>

                                    <button
                                        type="button"
                                        className="project-icon-button project-delete-button"
                                        onClick={() => setConfirmDelete(project)}
                                        title="Delete project"
                                        aria-label={`Delete ${project.name}`}
                                    >
                                        ×
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

                            <label htmlFor="project-description">
                                Description
                            </label>
                            <textarea
                                id="project-description"
                                placeholder="What are you building or trying to achieve?"
                                value={form.description}
                                onChange={(event) =>
                                    setForm({ ...form, description: event.target.value })
                                }
                                maxLength={1000}
                                rows={4}
                            />

                            <div className="projects-field-meta">
                                <span>Optional, but useful for your team.</span>
                                <span>{form.description.length}/1000</span>
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

            {selectedProject && (
                <div
                    className="projects-modal-backdrop"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) {
                            setSelectedProject(null)
                            setActionError('')
                        }
                    }}
                >
                    <section
                        className="projects-modal project-details-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="project-details-title"
                    >
                        <div className="projects-modal-heading">
                            <div>
                                <span className="projects-eyebrow">PROJECT DETAILS</span>
                                <h2 id="project-details-title">
                                    {selectedProject.name}
                                </h2>
                                <p>
                                    {selectedProject.description ||
                                        'No description has been added yet.'}
                                </p>
                            </div>

                            <button
                                type="button"
                                className="projects-modal-close"
                                onClick={() => {
                                    setSelectedProject(null)
                                    setActionError('')
                                }}
                                aria-label="Close details"
                            >
                                ×
                            </button>
                        </div>

                        <div className="project-detail-info">
                            <div>
                                <span>Created</span>
                                <strong>{formatDate(selectedProject.createdAt)}</strong>
                            </div>
                            <div>
                                <span>Last updated</span>
                                <strong>{formatDate(selectedProject.updatedAt)}</strong>
                            </div>
                            <div>
                                <span>Team members</span>
                                <strong>
                                    {selectedProject.members?.length || 0}
                                </strong>
                            </div>
                        </div>

                        <div className="project-members">
                            <h3>People in this project</h3>
                            {selectedProject.members?.length ? (
                                selectedProject.members.map((member, index) => (
                                    <div
                                        className="project-member-row"
                                        key={member.user?._id || index}
                                    >
                                        <span className="project-member-avatar">
                                            {getMemberName(member).charAt(0).toUpperCase()}
                                        </span>
                                        <span>{getMemberName(member)}</span>
                                        <span className="project-member-role">
                                            {member.role || 'member'}
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <p>No member information available.</p>
                            )}
                        </div>

                        <div className="projects-form-actions">
                            <button
                                type="button"
                                className="projects-secondary-button"
                                onClick={() => setSelectedProject(null)}
                            >
                                Close
                            </button>
                            <button
                                type="button"
                                className="projects-create-button"
                                onClick={() => openEditForm(selectedProject)}
                            >
                                Edit project
                            </button>
                        </div>
                    </section>
                </div>
            )}

            {confirmDelete && (
                <div className="projects-modal-backdrop">
                    <section
                        className="projects-modal projects-confirm-modal"
                        role="alertdialog"
                        aria-modal="true"
                        aria-labelledby="delete-project-title"
                    >
                        <div className="projects-delete-symbol">!</div>
                        <h2 id="delete-project-title">Delete this project?</h2>
                        <p>
                            You're about to delete <strong>{confirmDelete.name}</strong>.
                            This action cannot be undone.
                        </p>
                        <div className="projects-form-actions">
                            <button
                                type="button"
                                className="projects-secondary-button"
                                onClick={() => setConfirmDelete(null)}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="projects-danger-button"
                                onClick={() => handleDelete(confirmDelete._id)}
                            >
                                Delete project
                            </button>
                        </div>
                    </section>
                </div>
            )}
        </section>
    )
}

export default Projects
