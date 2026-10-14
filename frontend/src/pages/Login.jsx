import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Auth.css'

function Login() {
    const { login } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [submitting, setSubmitting] = useState(false)

    const handleSubmit = async (event) => {
        event.preventDefault()
        setError('')
        setSubmitting(true)

        try {
            await login(email, password)
            navigate(location.state?.from?.pathname || '/', { replace: true })
        } catch (err) {
            setError(err.response?.data?.message || 'Unable to log in. Please try again.')
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
                    <span className="auth-eyebrow">WELCOME BACK</span>
                    <h1>Sign in to FlowForge</h1>
                    <p>Pick up where you left off and keep your projects moving.</p>
                </div>

                <form className="auth-form" onSubmit={handleSubmit}>
                    <label htmlFor="login-email">Email address</label>
                    <input
                        id="login-email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        autoComplete="email"
                        required
                    />

                    <label htmlFor="login-password">Password</label>
                    <input
                        id="login-password"
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        autoComplete="current-password"
                        required
                    />

                    {error && <p className="auth-error" role="alert">{error}</p>}

                    <button className="auth-submit" type="submit" disabled={submitting}>
                        {submitting ? 'Signing in...' : 'Sign in'}
                        {!submitting && <span>→</span>}
                    </button>
                </form>

                <p className="auth-switch">
                    Don’t have an account? <Link to="/signup">Create one</Link>
                </p>

                <p className="auth-footnote">
                    Organize your work. Understand your blockers. Move forward.
                </p>
            </section>
        </main>
    )
}

export default Login
