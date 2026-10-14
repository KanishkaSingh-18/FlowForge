import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Auth.css'

function Signup() {
    const { signup } = useAuth()
    const navigate = useNavigate()

    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [submitting, setSubmitting] = useState(false)

    const handleSubmit = async (event) => {
        event.preventDefault()
        setError('')

        if (password.length < 8) {
            setError('Password must contain at least 8 characters.')
            return
        }

        setSubmitting(true)

        try {
            await signup(name, email, password)
            navigate('/', { replace: true })
        } catch (err) {
            setError(err.response?.data?.message || 'Unable to create account. Please try again.')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <main className="auth-page">
            <section className="auth-card">
                <Link to="/" className="auth-brand">
                    <span className="auth-brand-mark">F</span>
                    <span>flowforge</span>
                </Link>

                <div className="auth-heading">
                    <span className="auth-eyebrow">GET STARTED</span>
                    <h1>Create your account</h1>
                    <p>Bring your projects, tasks, and dependencies together.</p>
                </div>

                <form className="auth-form" onSubmit={handleSubmit}>
                    <label htmlFor="signup-name">Full name</label>
                    <input
                        id="signup-name"
                        type="text"
                        placeholder="Your name"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        autoComplete="name"
                        required
                    />

                    <label htmlFor="signup-email">Email address</label>
                    <input
                        id="signup-email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        autoComplete="email"
                        required
                    />

                    <label htmlFor="signup-password">Password</label>
                    <input
                        id="signup-password"
                        type="password"
                        placeholder="At least 8 characters"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        autoComplete="new-password"
                        minLength={8}
                        required
                    />

                    {error && <p className="auth-error" role="alert">{error}</p>}

                    <button className="auth-submit" type="submit" disabled={submitting}>
                        {submitting ? 'Creating account...' : 'Create account'}
                        {!submitting && <span>→</span>}
                    </button>
                </form>

                <p className="auth-switch">
                    Already have an account? <Link to="/login">Sign in</Link>
                </p>

                <p className="auth-footnote">
                    Start building momentum, one task at a time.
                </p>
            </section>
        </main>
    )
}

export default Signup
