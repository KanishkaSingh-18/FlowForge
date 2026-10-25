import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import axiosInstance from '../api/axiosInstance'
import { useAuth } from '../context/AuthContext'
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

function getMemberUser(member) {
    return member?.user || member
}

function getMemberName(member) {
    const user = getMemberUser(member)
    return user?.name || user?.email || 'Project member'
}

function getMemberEmail(member) {
    const user = getMemberUser(member)
    return user?.email || ''
}

function getMemberRole(member) {
    return member?.role || 'member'
}

function getActivityAction(action) {
    const actions = {
        PROJECT_CREATED: 'created this project',
        PROJECT_UPDATED: 'updated project details',
        MEMBER_ADDED: 'added a project member',
        TASK_CREATED: 'created a task',
        TASK_UPDATED: 'updated a task',
        TASK_COMPLETED: 'completed a task',
        TASK_DELETED: 'deleted a task',
        DEPENDENCY_UPDATED: 'updated task dependencies',
    }

    return actions[action] || 'performed a project activity'
}

function getActivityIcon(action) {
    const icons = {
        PROJECT_CREATED: '✦',
        PROJECT_UPDATED: '✎',
        MEMBER_ADDED: '+',
        TASK_CREATED: '+',
        TASK_UPDATED: '↻',
        TASK_COMPLETED: '✓',
        TASK_DELETED: '×',
        DEPENDENCY_UPDATED: '⇄',
    }

    return icons[action] || '↗'
}

function getId(value) {
    if (!value) return ''

    return typeof value === 'object'
        ? String(value._id || value.id || '')
        : String(value)
}

function getActivityDateKey(date) {
    if (!date) return 'unknown'

    const parsedDate = new Date(date)

    if (Number.isNaN(parsedDate.getTime())) return 'unknown'

    return [
        parsedDate.getFullYear(),
        String(parsedDate.getMonth() + 1).padStart(2, '0'),
        String(parsedDate.getDate()).padStart(2, '0'),
    ].join('-')
}

function formatActivityDate(date) {
    if (!date) return 'Date unavailable'

    const parsedDate = new Date(date)

    if (Number.isNaN(parsedDate.getTime())) {
        return 'Date unavailable'
    }

    const today = new Date()
    const yesterday = new Date()
    yesterday.setDate(today.getDate() - 1)

    if (getActivityDateKey(parsedDate) === getActivityDateKey(today)) {
        return 'Today'
    }

    if (
        getActivityDateKey(parsedDate) ===
        getActivityDateKey(yesterday)
    ) {
        return 'Yesterday'
    }

    return parsedDate.toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    })
}

function ProjectWorkspace({ project, onBack }) {
    const { user } = useAuth()
    const taskFormRef = useRef(null)
    const currentUserId = getId(user?._id || user?.id)
    const projectOwnerId = getId(project.owner)
    const isOwner =
        Boolean(currentUserId) &&
        currentUserId === projectOwnerId

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

    const [activeTab, setActiveTab] = useState('Tasks')
    const [activities, setActivities] = useState([])
    const [activityLoading, setActivityLoading] = useState(false)
    const [activityError, setActivityError] = useState('')
    const [activityRetry, setActivityRetry] = useState(0)

    const [dependencyTask, setDependencyTask] = useState(null)
    const [selectedDependencies, setSelectedDependencies] = useState([])
    const [savingDependencies, setSavingDependencies] = useState(false)
    const [dependencyError, setDependencyError] = useState('')

    const [members, setMembers] = useState(project.members || [])
    const [memberEmail, setMemberEmail] = useState('')
    const [addingMember, setAddingMember] = useState(false)
    const [memberError, setMemberError] = useState('')
    const [memberSuccess, setMemberSuccess] = useState('')

    const isTeamProject = project.type === 'team'

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

    useEffect(() => {
        if (activeTab !== 'Activity') return

        let cancelled = false

        const loadActivities = async () => {
            setActivityLoading(true)
            setActivityError('')

            try {
                const response = await axiosInstance.get(
                    `/projects/${project._id}/activities`,
                )

                if (!cancelled) {
                    setActivities(response.data.activities || [])
                }
            } catch (err) {
                if (!cancelled) {
                    setActivityError(
                        err.response?.data?.message ||
                        'Unable to load project activity. Please try again.',
                    )
                }
            } finally {
                if (!cancelled) {
                    setActivityLoading(false)
                }
            }
        }

        loadActivities()

        return () => {
            cancelled = true
        }
    }, [activeTab, project._id, activityRetry])

    useEffect(() => {
        setMembers(project.members || [])
    }, [project.members, project._id])

    useEffect(() => {
        if (showForm && activeTab === 'Tasks') {
            taskFormRef.current?.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
            })
        }
    }, [showForm, activeTab])

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

    // Group activities by calendar date while preserving their existing order.
    const groupedActivities = useMemo(() => {
        const groups = []

        activities.forEach((activity) => {
            const dateKey = getActivityDateKey(activity.createdAt)
            const lastGroup = groups[groups.length - 1]

            if (!lastGroup || lastGroup.dateKey !== dateKey) {
                groups.push({
                    dateKey,
                    label: formatActivityDate(activity.createdAt),
                    items: [activity],
                })
            } else {
                lastGroup.items.push(activity)
            }
        })

        return groups
    }, [activities])

    const handleAddMember = async (event) => {
        event.preventDefault()
        setMemberError('')
        setMemberSuccess('')

        const email = memberEmail.trim().toLowerCase()

        if (!email) {
            setMemberError('Please enter the member’s email address.')
            return
        }

        setAddingMember(true)

        try {
            const response = await axiosInstance.post(
                `/projects/${project._id}/members`,
                { email },
            )

            const returnedMembers =
                response.data.members || response.data.project?.members

            if (returnedMembers) {
                setMembers(returnedMembers)
            } else {
                const projectResponse = await axiosInstance.get(
                    `/projects/${project._id}`,
                )

                const updatedProject =
                    projectResponse.data.project || projectResponse.data

                setMembers(updatedProject.members || [])
            }

            setMemberEmail('')
            setMemberSuccess(
                response.data.message || 'Member added successfully.',
            )
        } catch (err) {
            setMemberError(
                err.response?.data?.message ||
                'Unable to add this member. Please try again.',
            )
        } finally {
            setAddingMember(false)
        }
    }

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
                    <span
                        className={`project-type-badge ${isTeamProject
                            ? 'project-type-team'
                            : 'project-type-solo'
                            }`}
                    >
                        {isTeamProject ? 'Team project' : 'Solo project'}
                    </span>
                </div>

                {isOwner && (
                    <button
                        className="projects-create-button"
                        type="button"
                        onClick={() => {
                            setFormError('')
                            setShowForm((current) => {
                                const shouldOpen = !current

                                if (shouldOpen) {
                                    setActiveTab('Tasks')
                                }

                                return shouldOpen
                            })
                        }}
                    >
                        {showForm ? 'Cancel' : '+ New task'}
                    </button>
                )}
            </div>

            {isTeamProject && (
                <section className="workspace-members">
                    <div className="workspace-members-heading">
                        <div>
                            <span className="projects-eyebrow">
                                TEAM COLLABORATION
                            </span>
                            <h3>Project members</h3>
                            <p>
                                Manage the people collaborating on this project.
                            </p>
                        </div>
                        <span className="workspace-members-count">
                            {members.length}{' '}
                            {members.length === 1 ? 'member' : 'members'}
                        </span>
                    </div>

                    <div className="workspace-members-list">
                        {members.length === 0 ? (
                            <p className="workspace-members-empty">
                                No members found for this project.
                            </p>
                        ) : (
                            members.map((member, index) => (
                                <div
                                    className="workspace-member"
                                    key={
                                        getMemberUser(member)?._id ||
                                        getMemberEmail(member) ||
                                        index
                                    }
                                >
                                    <div className="workspace-member-avatar">
                                        {getMemberName(member)
                                            .charAt(0)
                                            .toUpperCase()}
                                    </div>
                                    <div className="workspace-member-info">
                                        <strong>{getMemberName(member)}</strong>
                                        {getMemberEmail(member) && (
                                            <span>{getMemberEmail(member)}</span>
                                        )}
                                    </div>
                                    <span
                                        className={`workspace-member-role ${getMemberRole(member) === 'owner'
                                            ? 'owner'
                                            : ''
                                            }`}
                                    >
                                        {getMemberRole(member) === 'owner'
                                            ? 'Owner'
                                            : 'Member'}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>

                    {isOwner && (
                        <form
                            className="workspace-add-member-form"
                            onSubmit={handleAddMember}
                        >
                            <label htmlFor="member-email">
                                Add a registered user
                            </label>
                            <div className="workspace-add-member-row">
                                <input
                                    id="member-email"
                                    type="email"
                                    value={memberEmail}
                                    onChange={(event) => {
                                        setMemberEmail(event.target.value)
                                        setMemberError('')
                                        setMemberSuccess('')
                                    }}
                                    placeholder="Enter their account email"
                                    required
                                />
                                <button
                                    className="projects-create-button"
                                    type="submit"
                                    disabled={addingMember}
                                >
                                    {addingMember ? 'Adding...' : '+ Add member'}
                                </button>
                            </div>

                            <p className="workspace-members-help">
                                The person must already have a FlowForge account.
                                Only the project owner can add members.
                            </p>

                            {memberError && (
                                <p className="workspace-error" role="alert">
                                    {memberError}
                                </p>
                            )}

                            {memberSuccess && (
                                <p
                                    className="workspace-member-success"
                                    role="status"
                                >
                                    {memberSuccess}
                                </p>
                            )}
                        </form>
                    )}
                </section>
            )}

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

            <div
                className="workspace-tabs"
                role="tablist"
                aria-label="Project workspace"
            >
                <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === 'Tasks'}
                    className={`workspace-tab ${activeTab === 'Tasks' ? 'active' : ''
                        }`}
                    onClick={() => setActiveTab('Tasks')}
                >
                    Tasks
                </button>

                <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === 'Activity'}
                    className={`workspace-tab ${activeTab === 'Activity' ? 'active' : ''
                        }`}
                    onClick={() => setActiveTab('Activity')}
                >
                    Activity
                </button>
            </div>

            {activeTab === 'Tasks' ? (
                <>
                    {isOwner && showForm && (
                        <form
                            ref={taskFormRef}
                            className="workspace-form"
                            onSubmit={handleCreateTask}
                        >
                            <h3>Create a task</h3>

                            <label htmlFor="task-title">Task title *</label>
                            <input
                                id="task-title"
                                value={form.title}
                                onChange={(event) =>
                                    setForm({
                                        ...form,
                                        title: event.target.value,
                                    })
                                }
                                maxLength={150}
                                placeholder="e.g. Design the landing page"
                                required
                            />

                            <label htmlFor="task-description">
                                Description
                            </label>
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
                                    <label htmlFor="task-priority">
                                        Priority
                                    </label>
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
                                            <option
                                                key={priority}
                                                value={priority}
                                            >
                                                {priority}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label htmlFor="task-due-date">
                                        Due date
                                    </label>
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
                            {isOwner && (
                                <button
                                    type="button"
                                    className="projects-create-button"
                                    onClick={() => setShowForm(true)}
                                >
                                    + Create your first task
                                </button>
                            )}
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
                            {filteredTasks.map((task) => {
                                const assignedUserId = getId(task.assignedTo)

                                const isAssignedToCurrentUser =
                                    Boolean(currentUserId) &&
                                    assignedUserId === currentUserId

                                const canChangeStatus =
                                    isOwner || isAssignedToCurrentUser

                                return (
                                    <article
                                        className="workspace-task-card"
                                        key={task._id}
                                    >
                                        <div className="workspace-task-main">
                                            <div className="workspace-task-title-row">
                                                <h3>{task.title}</h3>

                                                {task.status === 'Done' &&
                                                    task.isBlocked &&
                                                    task.blockedBy?.length > 0 ? (
                                                    <span
                                                        className="workspace-badge needs-review"
                                                        title="A prerequisite is unfinished"
                                                    >
                                                        ⚠ Needs review
                                                    </span>
                                                ) : task.isBlocked ? (
                                                    <span className="workspace-badge blocked">
                                                        Blocked
                                                    </span>
                                                ) : null}

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

                                            {task.isBlocked && task.blockedBy?.length > 0 && (
                                                <div className="workspace-blocked-detail">
                                                    <strong>
                                                        {task.status === 'Done'
                                                            ? 'Prerequisites needing review:'
                                                            : 'Waiting for:'}
                                                    </strong>
                                                    <ul>
                                                        {task.blockedBy.map((item) => (
                                                            <li key={item._id}>
                                                                {item.title} ({item.status})
                                                            </li>
                                                        ))}
                                                    </ul>
                                                    {task.status === 'Done' && (
                                                        <p>
                                                            This task remains completed. Review it because one
                                                            or more prerequisites are unfinished.
                                                        </p>
                                                    )}
                                                </div>
                                            )}

                                            <div className="workspace-task-meta">
                                                <span
                                                    className={`workspace-priority priority-${task.priority?.toLowerCase()}`}
                                                >
                                                    {task.priority} priority
                                                </span>
                                                <span>
                                                    Due: {formatDate(task.dueDate)}
                                                </span>
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

                                            {isOwner && (
                                                <button
                                                    type="button"
                                                    className="workspace-dependency-button"
                                                    onClick={() =>
                                                        openDependencyEditor(task)
                                                    }
                                                >
                                                    Manage dependencies
                                                </button>
                                            )}
                                        </div>

                                        <div className="workspace-task-actions">
                                            {isOwner && (
                                                <label>
                                                    <span>Assign to</span>
                                                    <select
                                                        value={getId(task.assignedTo)}
                                                        disabled={
                                                            updatingTaskId === task._id ||
                                                            deletingTaskId === task._id
                                                        }
                                                        onChange={(event) =>
                                                            updateTask(task, {
                                                                assignedTo:
                                                                    event.target.value || null,
                                                            })
                                                        }
                                                    >
                                                        <option value="">Unassigned</option>
                                                        {members.map((member) => {
                                                            const memberUser =
                                                                getMemberUser(member)
                                                            const memberId =
                                                                getId(memberUser)

                                                            if (!memberId) return null

                                                            return (
                                                                <option
                                                                    key={memberId}
                                                                    value={memberId}
                                                                >
                                                                    {getMemberName(member)}
                                                                </option>
                                                            )
                                                        })}
                                                    </select>
                                                </label>
                                            )}

                                            <label>
                                                <span>Status</span>
                                                <select
                                                    value={task.status}
                                                    disabled={
                                                        !canChangeStatus ||
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

                                            {isOwner && (
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
                                            )}

                                            {isOwner && (
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
                                            )}
                                        </div>
                                    </article>
                                )
                            })}
                        </div>
                    )}
                </>
            ) : (
                <section className="workspace-activity">
                    <div className="workspace-activity-heading">
                        <div>
                            <span className="projects-eyebrow">
                                PROJECT HISTORY
                            </span>
                            <h3>Recent activity</h3>
                            <p>
                                See the latest changes made in this project.
                            </p>
                        </div>

                        <button
                            type="button"
                            className="projects-secondary-button"
                            onClick={() =>
                                setActivityRetry((current) => current + 1)
                            }
                            disabled={activityLoading}
                        >
                            {activityLoading ? (
                                <>
                                    <span className="workspace-refresh-spinner" />
                                    Refreshing...
                                </>
                            ) : (
                                <>
                                    <span aria-hidden="true">↻</span>
                                    Refresh
                                </>
                            )}
                        </button>
                    </div>

                    {activityLoading ? (
                        <div className="projects-state">
                            <div className="projects-spinner" />
                            <p>Loading activity...</p>
                        </div>
                    ) : activityError ? (
                        <div className="projects-error" role="alert">
                            <p>{activityError}</p>
                            <button
                                type="button"
                                className="projects-secondary-button"
                                onClick={() =>
                                    setActivityRetry((current) => current + 1)
                                }
                            >
                                Try again
                            </button>
                        </div>
                    ) : activities.length === 0 ? (
                        <div className="projects-empty workspace-empty">
                            <div className="projects-empty-art">
                                <span>↗</span>
                            </div>
                            <h3>No activity yet</h3>
                            <p>
                                Project changes will appear here as work progresses.
                            </p>
                        </div>
                    ) : (
                        <div className="workspace-activity-list">
                            {groupedActivities.map((group) => (
                                <section
                                    className="workspace-activity-day"
                                    key={group.dateKey}
                                >
                                    <div className="workspace-activity-date">
                                        <span>{group.label}</span>
                                    </div>

                                    <div className="workspace-activity-timeline">
                                        {group.items.map((activity) => (
                                            <article
                                                className="workspace-activity-item"
                                                key={activity._id}
                                            >
                                                <div
                                                    className={`workspace-activity-marker activity-${(
                                                        activity.action || 'default'
                                                    ).toLowerCase()}`}
                                                    aria-hidden="true"
                                                >
                                                    {getActivityIcon(activity.action)}
                                                </div>

                                                <div className="workspace-activity-card">
                                                    <div className="workspace-activity-card-heading">
                                                        <p>
                                                            <strong>
                                                                {activity.actor?.name ||
                                                                    activity.actor?.email ||
                                                                    'A project member'}
                                                            </strong>{' '}
                                                            {getActivityAction(
                                                                activity.action,
                                                            )}
                                                            {activity.task?.title && (
                                                                <>
                                                                    {' '}
                                                                    <strong className="workspace-activity-task-title">
                                                                        “{activity.task.title}”
                                                                    </strong>
                                                                </>
                                                            )}
                                                        </p>

                                                        <time dateTime={activity.createdAt}>
                                                            {activity.createdAt
                                                                ? new Date(
                                                                    activity.createdAt,
                                                                ).toLocaleTimeString(
                                                                    undefined,
                                                                    {
                                                                        hour: 'numeric',
                                                                        minute: '2-digit',
                                                                    },
                                                                )
                                                                : 'Time unavailable'}
                                                        </time>
                                                    </div>

                                                    {activity.details && (
                                                        <p className="workspace-activity-details">
                                                            {activity.details}
                                                        </p>
                                                    )}
                                                </div>
                                            </article>
                                        ))}
                                    </div>
                                </section>
                            ))}
                        </div>
                    )}
                </section>
            )}

            {isOwner && dependencyTask && (
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
