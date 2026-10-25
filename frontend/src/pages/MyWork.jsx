
import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import axiosInstance from '../api/axiosInstance'
import { useAuth } from '../context/AuthContext'
import './MyWork.css'

function getId(value) {
    if (!value) return ''

    return typeof value === 'object'
        ? String(value._id || value.id || '')
        : String(value)
}

function formatDate(date) {
    if (!date) return 'No due date'

    return new Date(date).toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    })
}

function MyWork({ onOpenProject }) {
    const { user } = useAuth()
    const location = useLocation()
    const currentUserId = getId(user?._id || user?.id)

    const [tasks, setTasks] = useState([])
    const [filter, setFilter] = useState('All')
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [reloadKey, setReloadKey] = useState(0)

    useEffect(() => {
        let cancelled = false

        async function loadMyWork() {
            setLoading(true)
            setError('')

            try {
                const projectResponse = await axiosInstance.get('/projects')
                const projects = projectResponse.data.projects || []

                const responses = await Promise.all(
                    projects.map(async (project) => {
                        const response = await axiosInstance.get(
                            `/projects/${project._id}/tasks`,
                        )

                        return (response.data.tasks || [])
                            .filter(
                                (task) =>
                                    getId(task.assignedTo) === currentUserId,
                            )
                            .map((task) => ({
                                ...task,
                                projectId: project._id,
                                projectName: project.name,
                            }))
                    }),
                )

                if (!cancelled) {
                    setTasks(responses.flat())
                }
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err.response?.data?.message ||
                        'Unable to load your tasks. Please try again.',
                    )
                }
            } finally {
                if (!cancelled) {
                    setLoading(false)
                }
            }
        }

        if (currentUserId) {
            loadMyWork()
        } else {
            setTasks([])
            setLoading(false)
        }

        return () => {
            cancelled = true
        }
    }, [currentUserId, reloadKey, location.key])

    const filteredTasks = useMemo(() => {
        switch (filter) {
            case 'Todo':
                return tasks.filter((task) => task.status === 'Todo')

            case 'In Progress':
                return tasks.filter(
                    (task) => task.status === 'In Progress',
                )

            case 'Completed':
                return tasks.filter((task) => task.status === 'Done')

            case 'Blocked':
                return tasks.filter((task) => task.isBlocked)

            case 'Overdue':
                return tasks.filter(
                    (task) => task.isOverdue && task.status !== 'Done',
                )

            default:
                return tasks
        }
    }, [tasks, filter])

    const counts = {
        total: tasks.length,
        inProgress: tasks.filter(
            (task) => task.status === 'In Progress',
        ).length,
        blocked: tasks.filter((task) => task.isBlocked).length,
        overdue: tasks.filter(
            (task) => task.isOverdue && task.status !== 'Done',
        ).length,
    }

    return (
        <section className="my-work-page">
            <div className="my-work-heading">
                <div>
                    <span className="projects-eyebrow">
                        PERSONAL WORKSPACE
                    </span>
                    <h2>My Work</h2>
                    <p>
                        All your assigned tasks, across every project, in one
                        place.
                    </p>
                </div>
            </div>

            <div className="my-work-stats">
                <article>
                    <span>Assigned tasks</span>
                    <strong>{loading ? '—' : counts.total}</strong>
                </article>

                <article>
                    <span>In progress</span>
                    <strong>{loading ? '—' : counts.inProgress}</strong>
                </article>

                <article>
                    <span>Blocked</span>
                    <strong>{loading ? '—' : counts.blocked}</strong>
                </article>

                <article>
                    <span>Overdue</span>
                    <strong>{loading ? '—' : counts.overdue}</strong>
                </article>
            </div>

            <div className="my-work-toolbar">
                <div>
                    <h3>Your tasks</h3>
                    <p>Prioritize your work and keep projects moving.</p>
                </div>

                <label>
                    <span>Filter tasks</span>

                    <select
                        value={filter}
                        onChange={(event) => setFilter(event.target.value)}
                    >
                        {[
                            'All',
                            'Todo',
                            'In Progress',
                            'Completed',
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

            {error && (
                <div className="my-work-error" role="alert">
                    <span>{error}</span>

                    <button
                        type="button"
                        onClick={() =>
                            setReloadKey((current) => current + 1)
                        }
                        disabled={loading}
                    >
                        Try again
                    </button>
                </div>
            )}

            {loading ? (
                <div className="my-work-empty">
                    Loading your tasks...
                </div>
            ) : filteredTasks.length === 0 ? (
                <div className="my-work-empty">
                    <div className="my-work-empty-icon">✓</div>

                    <h3>
                        {tasks.length === 0
                            ? 'No tasks assigned yet'
                            : 'No tasks match this filter'}
                    </h3>

                    <p>
                        {tasks.length === 0
                            ? 'When a project owner assigns a task to you, it will appear here.'
                            : 'Choose another filter to see your tasks.'}
                    </p>

                    {filter !== 'All' && (
                        <button
                            type="button"
                            onClick={() => setFilter('All')}
                        >
                            Show all tasks
                        </button>
                    )}
                </div>
            ) : (
                <div className="my-work-list">
                    {filteredTasks.map((task) => (
                        <article
                            className="my-work-card"
                            key={task._id}
                        >
                            <div className="my-work-card-main">
                                <div className="my-work-project">
                                    <span>◫</span>
                                    {task.projectName}
                                </div>

                                <h3>{task.title}</h3>

                                {task.description && (
                                    <p className="my-work-description">
                                        {task.description}
                                    </p>
                                )}

                                <div className="my-work-meta">
                                    <span
                                        className={`workspace-priority priority-${task.priority?.toLowerCase()}`}
                                    >
                                        {task.priority} priority
                                    </span>

                                    <span>
                                        Due: {formatDate(task.dueDate)}
                                    </span>
                                </div>

                                <div className="my-work-badges">
                                    <span className="my-work-status">
                                        {task.status}
                                    </span>

                                    {task.isBlocked && (
                                        <span className="my-work-badge blocked">
                                            Blocked by dependency
                                        </span>
                                    )}

                                    {task.isOverdue &&
                                        task.status !== 'Done' && (
                                            <span className="my-work-badge overdue">
                                                Overdue
                                            </span>
                                        )}

                                    {task.isReadyToStart && (
                                        <span className="my-work-badge ready">
                                            Ready to start
                                        </span>
                                    )}
                                </div>
                            </div>

                            <button
                                type="button"
                                className="my-work-open-button"
                                onClick={() =>
                                    onOpenProject?.(task.projectId)
                                }
                            >
                                Open project →
                            </button>
                        </article>
                    ))}
                </div>
            )}
        </section>
    )
}

export default MyWork
