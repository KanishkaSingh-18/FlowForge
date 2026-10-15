import { useCallback, useEffect, useMemo, useState } from 'react'
import axiosInstance from '../api/axiosInstance'
import './ProjectWorkspace.css'

const STATUSES = ['Todo', 'In Progress', 'Done']
const PRIORITIES = ['Low', 'Medium', 'High']

function formatDate(date) {
    if (!date) return 'No due date'

    return new Date(date).toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    })
}

function ProjectWorkspace({ project, onBack }) {
    const [tasks, setTasks] = useState([])
    const [summary, setSummary] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [showForm, setShowForm] = useState(false)
    const [saving, setSaving] = useState(false)
    const [formError, setFormError] = useState('')
    const [updatingTaskId, setUpdatingTaskId] = useState(null)
    const [deletingTaskId, setDeletingTaskId] = useState(null)
    const [filter, setFilter] = useState('All')
    const [dependencyTask, setDependencyTask] = useState(null)
    const [selectedDependencies, setSelectedDependencies] = useState([])
    const [savingDependencies, setSavingDependencies] = useState(false)
    const [dependencyError, setDependencyError] = useState('')

    const [form, setForm] = useState({
        title: '',
        description: '',
        priority: 'Medium',
        dueDate: '',
    })

    const loadWorkspace = useCallback(async () => {
        setLoading(true)
        setError('')

        try {
            const [taskResponse, dashboardResponse] = await Promise.all([
                axiosInstance.get(`/projects/${project._id}/tasks`),
                axiosInstance.get(`/projects/${project._id}/dashboard`),
            ])

            setTasks(taskResponse.data.tasks || [])
            setSummary(dashboardResponse.data.summary || null)
        } catch (err) {
            setError(
                err.response?.data?.message ||
                'Unable to load project tasks. Please try again.',
            )
        } finally {
            setLoading(false)
        }
    }, [project._id])

    useEffect(() => {
        loadWorkspace()
    }, [loadWorkspace])

    const filteredTasks = useMemo(() => {
        switch (filter) {
            case 'Todo':
                return tasks.filter((task) => task.status === 'Todo')
            case 'In Progress':
                return tasks.filter((task) => task.status === 'In Progress')
            case 'Done':
                return tasks.filter((task) => task.status === 'Done')
            case 'Blocked':
                return tasks.filter((task) => task.isBlocked)
            case 'Overdue':
                return tasks.filter((task) => task.isOverdue)
            default:
                return tasks
        }
    }, [tasks, filter])

    const handleCreateTask = async (event) => {
        event.preventDefault()
        setFormError('')

        if (!form.title.trim()) {
            setFormError('Please enter a task title.')
            return
        }

        setSaving(true)

        try {
            await axiosInstance.post(`/projects/${project._id}/tasks`, {
                title: form.title.trim(),
                description: form.description.trim(),
                priority: form.priority,
                dueDate: form.dueDate || null,
            })

            setForm({
                title: '',
                description: '',
                priority: 'Medium',
                dueDate: '',
            })
            setShowForm(false)
            await loadWorkspace()
        } catch (err) {
            setFormError(
                err.response?.data?.message || 'Unable to create task.',
            )
        } finally {
            setSaving(false)
        }
    }

    const updateTask = async (task, updates) => {
        setError('')
        setUpdatingTaskId(task._id)

        try {
            await axiosInstance.patch(
                `/projects/${project._id}/tasks/${task._id}`,
                updates,
            )
            await loadWorkspace()
        } catch (err) {
            setError(err.response?.data?.message || 'Unable to update task.')
        } finally {
            setUpdatingTaskId(null)
        }
    }

    const deleteTask = async (task) => {
        if (!window.confirm(`Delete "${task.title}"?`)) return

        setError('')
        setDeletingTaskId(task._id)

        try {
            await axiosInstance.delete(
                `/projects/${project._id}/tasks/${task._id}`,
            )
            await loadWorkspace()
        } catch (err) {
            setError(err.response?.data?.message || 'Unable to delete task.')
        } finally {
            setDeletingTaskId(null)
        }
    }

    const openDependencyEditor = (task) => {
        setDependencyTask(task)
        setDependencyError('')

        setSelectedDependencies(
            (task.dependencies || []).map((dependency) =>
                typeof dependency === 'object'
                    ? dependency._id
                    : dependency,
            ),
        )
    }

    const toggleDependency = (dependencyId) => {
        setSelectedDependencies((current) =>
            current.includes(dependencyId)
                ? current.filter((id) => id !== dependencyId)
                : [...current, dependencyId],
        )
    }

    const saveDependencies = async () => {
        if (!dependencyTask) return

        setSavingDependencies(true)
        setDependencyError('')

        try {
            await axiosInstance.patch(
                `/projects/${project._id}/tasks/${dependencyTask._id}`,
                { dependencies: selectedDependencies },
            )

            setDependencyTask(null)
            await loadWorkspace()
        } catch (err) {
            setDependencyError(
                err.response?.data?.message ||
                'Unable to update task dependencies.',
            )
        } finally {
            setSavingDependencies(false)
        }
    }

    return (
        <section className="workspace-page">
            <button
                className="workspace-back-button"
                onClick={onBack}
                type="button"
            >
                ← Back to projects
            </button>

            <div className="workspace-heading">
                <div>
                    <span className="projects-eyebrow">PROJECT WORKSPACE</span>
                    <h2>{project.name}</h2>
                    <p>
                        {project.description ||
                            'Manage tasks, dependencies, and project progress.'}
                    </p>
                </div>

                <button
                    className="projects-create-button"
                    type="button"
                    onClick={() => {
                        setFormError('')
                        setShowForm((current) => !current)
                    }}
                >
                    {showForm ? 'Cancel' : '+ New task'}
                </button>
            </div>

            <div className="workspace-stats">
                <div>
                    <span>Total tasks</span>
                    <strong>{summary?.totalTasks ?? '—'}</strong>
                </div>
                <div>
                    <span>To do</span>
                    <strong>{summary?.todo ?? '—'}</strong>
                </div>
                <div>
                    <span>In progress</span>
                    <strong>{summary?.inProgress ?? '—'}</strong>
                </div>
                <div>
                    <span>Completed</span>
                    <strong>{summary?.completed ?? '—'}</strong>
                </div>
                <div>
                    <span>Blocked</span>
                    <strong>{summary?.blocked ?? '—'}</strong>
                </div>
                <div>
                    <span>Overdue</span>
                    <strong>{summary?.overdue ?? '—'}</strong>
                </div>
            </div>

            {summary && (
                <div className="workspace-progress">
                    <div className="workspace-progress-heading">
                        <span>Overall completion</span>
                        <strong>{summary.completionRate ?? 0}%</strong>
                    </div>
                    <div
                        className="workspace-progress-track"
                        role="progressbar"
                        aria-label="Project completion"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={summary.completionRate ?? 0}
                    >
                        <div
                            className="workspace-progress-fill"
                            style={{
                                width: `${Math.min(
                                    100,
                                    Math.max(0, summary.completionRate ?? 0),
                                )}%`,
                            }}
                        />
                    </div>
                </div>
            )}

            {showForm && (
                <form className="workspace-form" onSubmit={handleCreateTask}>
                    <h3>Create a task</h3>

                    <label htmlFor="task-title">Task title *</label>
                    <input
                        id="task-title"
                        value={form.title}
                        onChange={(event) =>
                            setForm({ ...form, title: event.target.value })
                        }
                        maxLength={150}
                        placeholder="e.g. Design the landing page"
                        required
                    />

                    <label htmlFor="task-description">Description</label>
                    <textarea
                        id="task-description"
                        value={form.description}
                        onChange={(event) =>
                            setForm({
                                ...form,
                                description: event.target.value,
                            })
                        }
                        maxLength={2000}
                        rows={3}
                        placeholder="What needs to be done?"
                    />

                    <div className="workspace-form-row">
                        <div>
                            <label htmlFor="task-priority">Priority</label>
                            <select
                                id="task-priority"
                                value={form.priority}
                                onChange={(event) =>
                                    setForm({
                                        ...form,
                                        priority: event.target.value,
                                    })
                                }
                            >
                                {PRIORITIES.map((priority) => (
                                    <option key={priority} value={priority}>
                                        {priority}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label htmlFor="task-due-date">Due date</label>
                            <input
                                id="task-due-date"
                                type="date"
                                value={form.dueDate}
                                onChange={(event) =>
                                    setForm({
                                        ...form,
                                        dueDate: event.target.value,
                                    })
                                }
                            />
                        </div>
                    </div>

                    {formError && (
                        <p className="workspace-error" role="alert">
                            {formError}
                        </p>
                    )}

                    <button
                        className="projects-create-button"
                        type="submit"
                        disabled={saving}
                    >
                        {saving ? 'Creating...' : 'Create task'}
                    </button>
                </form>
            )}

            {error && (
                <div className="projects-error" role="alert">
                    {error}
                    <button
                        type="button"
                        onClick={() => setError('')}
                        aria-label="Dismiss error"
                    >
                        ×
                    </button>
                </div>
            )}

            <div className="workspace-task-toolbar">
                <div>
                    <h3>Project tasks</h3>
                    <p>
                        Track progress and manage dependencies between tasks.
                    </p>
                </div>

                <label className="workspace-filter">
                    <span>Filter</span>
                    <select
                        value={filter}
                        onChange={(event) => setFilter(event.target.value)}
                    >
                        {[
                            'All',
                            'Todo',
                            'In Progress',
                            'Done',
                            'Blocked',
                            'Overdue',
                        ].map((option) => (
                            <option key={option} value={option}>
                                {option}
                            </option>
                        ))}
                    </select>
                </label>
            </div>

            {loading ? (
                <div className="projects-state">
                    <div className="projects-spinner" />
                    <p>Loading tasks...</p>
                </div>
            ) : tasks.length === 0 ? (
                <div className="projects-empty workspace-empty">
                    <div className="projects-empty-art">
                        <span>✓</span>
                    </div>
                    <h3>No tasks yet</h3>
                    <p>
                        Create your first task to start tracking work in this
                        project.
                    </p>
                    <button
                        type="button"
                        className="projects-create-button"
                        onClick={() => setShowForm(true)}
                    >
                        + Create your first task
                    </button>
                </div>
            ) : filteredTasks.length === 0 ? (
                <div className="projects-state">
                    <h3>No matching tasks</h3>
                    <p>Try choosing a different filter.</p>
                    <button
                        type="button"
                        className="projects-secondary-button"
                        onClick={() => setFilter('All')}
                    >
                        Show all tasks
                    </button>
                </div>
            ) : (
                <div className="workspace-task-list">
                    {filteredTasks.map((task) => (
                        <article
                            className="workspace-task-card"
                            key={task._id}
                        >
                            <div className="workspace-task-main">
                                <div className="workspace-task-title-row">
                                    <h3>{task.title}</h3>

                                    {task.isBlocked && (
                                        <span className="workspace-badge blocked">
                                            Blocked
                                        </span>
                                    )}

                                    {task.isReadyToStart && (
                                        <span className="workspace-badge ready">
                                            Ready to start
                                        </span>
                                    )}

                                    {task.isOverdue && (
                                        <span className="workspace-badge overdue">
                                            Overdue
                                        </span>
                                    )}
                                </div>

                                {task.description && (
                                    <p className="workspace-task-description">
                                        {task.description}
                                    </p>
                                )}

                                {task.isBlocked &&
                                    task.blockedBy?.length > 0 && (
                                        <div className="workspace-blocked-detail">
                                            <strong>Waiting for:</strong>
                                            <ul>
                                                {task.blockedBy.map((item) => (
                                                    <li key={item._id}>
                                                        {item.title} ({item.status})
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                <div className="workspace-task-meta">
                                    <span
                                        className={`workspace-priority priority-${task.priority?.toLowerCase()}`}
                                    >
                                        {task.priority} priority
                                    </span>
                                    <span>Due: {formatDate(task.dueDate)}</span>
                                    <span>
                                        Assigned to:{' '}
                                        {task.assignedTo?.name ||
                                            task.assignedTo?.email ||
                                            'Unassigned'}
                                    </span>
                                </div>

                                <div className="workspace-dependency-summary">
                                    <strong>Depends on:</strong>{' '}
                                    {task.dependencies?.length
                                        ? task.dependencies
                                            .map((dependency) =>
                                                typeof dependency === 'object'
                                                    ? dependency.title
                                                    : 'Linked task',
                                            )
                                            .join(', ')
                                        : 'No dependencies'}
                                </div>

                                <button
                                    type="button"
                                    className="workspace-dependency-button"
                                    onClick={() => openDependencyEditor(task)}
                                >
                                    Manage dependencies
                                </button>
                            </div>

                            <div className="workspace-task-actions">
                                <label>
                                    <span>Status</span>
                                    <select
                                        value={task.status}
                                        disabled={
                                            updatingTaskId === task._id ||
                                            deletingTaskId === task._id
                                        }
                                        onChange={(event) =>
                                            updateTask(task, {
                                                status: event.target.value,
                                            })
                                        }
                                        aria-label={`Status for ${task.title}`}
                                    >
                                        {STATUSES.map((status) => (
                                            <option key={status} value={status}>
                                                {status}
                                            </option>
                                        ))}
                                    </select>
                                </label>

                                <label>
                                    <span>Priority</span>
                                    <select
                                        value={task.priority}
                                        disabled={
                                            updatingTaskId === task._id ||
                                            deletingTaskId === task._id
                                        }
                                        onChange={(event) =>
                                            updateTask(task, {
                                                priority: event.target.value,
                                            })
                                        }
                                        aria-label={`Priority for ${task.title}`}
                                    >
                                        {PRIORITIES.map((priority) => (
                                            <option
                                                key={priority}
                                                value={priority}
                                            >
                                                {priority}
                                            </option>
                                        ))}
                                    </select>
                                </label>

                                <button
                                    className="workspace-delete-button"
                                    type="button"
                                    disabled={
                                        deletingTaskId === task._id ||
                                        updatingTaskId === task._id
                                    }
                                    onClick={() => deleteTask(task)}
                                >
                                    {deletingTaskId === task._id
                                        ? 'Deleting...'
                                        : 'Delete'}
                                </button>
                            </div>
                        </article>
                    ))}
                </div>
            )}

            {dependencyTask && (
                <div
                    className="projects-modal-backdrop"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) {
                            setDependencyTask(null)
                            setDependencyError('')
                        }
                    }}
                >
                    <section
                        className="projects-modal workspace-dependency-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="dependency-modal-title"
                    >
                        <div className="projects-modal-heading">
                            <div>
                                <span className="projects-eyebrow">
                                    TASK PLANNING
                                </span>
                                <h2 id="dependency-modal-title">
                                    Task dependencies
                                </h2>
                                <p>
                                    Select the tasks that must be completed
                                    before <strong>{dependencyTask.title}</strong>{' '}
                                    can proceed.
                                </p>
                            </div>

                            <button
                                type="button"
                                className="projects-modal-close"
                                onClick={() => setDependencyTask(null)}
                                aria-label="Close dependency editor"
                            >
                                ×
                            </button>
                        </div>

                        <div className="workspace-dependency-options">
                            {tasks.filter(
                                (task) => task._id !== dependencyTask._id,
                            ).length === 0 ? (
                                <p>
                                    Create another task before adding a
                                    dependency.
                                </p>
                            ) : (
                                tasks
                                    .filter(
                                        (task) =>
                                            task._id !== dependencyTask._id,
                                    )
                                    .map((task) => (
                                        <label
                                            className="workspace-dependency-option"
                                            key={task._id}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedDependencies.includes(
                                                    task._id,
                                                )}
                                                onChange={() =>
                                                    toggleDependency(task._id)
                                                }
                                            />
                                            <span>
                                                <strong>{task.title}</strong>
                                                <small>
                                                    {task.status} · {task.priority}{' '}
                                                    priority
                                                </small>
                                            </span>
                                        </label>
                                    ))
                            )}
                        </div>

                        <p className="workspace-dependency-help">
                            Avoid circular dependencies. A task cannot depend
                            on itself, and linked tasks may block progress until
                            they are completed.
                        </p>

                        {dependencyError && (
                            <p className="workspace-error" role="alert">
                                {dependencyError}
                            </p>
                        )}

                        <div className="projects-form-actions">
                            <button
                                type="button"
                                className="projects-secondary-button"
                                onClick={() => setDependencyTask(null)}
                                disabled={savingDependencies}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="projects-create-button"
                                onClick={saveDependencies}
                                disabled={savingDependencies}
                            >
                                {savingDependencies
                                    ? 'Saving...'
                                    : 'Save dependencies'}
                            </button>
                        </div>
                    </section>
                </div>
            )}
        </section>
    )
}

export default ProjectWorkspace