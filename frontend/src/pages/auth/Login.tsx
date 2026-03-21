import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import logo from '../../assets/logo_pmd_white.png';
import './Login.css';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');

    const validateEmail = (value: string): string => {
        if (!value.trim()) return 'Email wajib diisi.';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) return 'Format email tidak valid.';
        return '';
    };

    const validatePassword = (value: string): string => {
        if (!value) return 'Password wajib diisi.';
        if (value.length < 12) return `Password minimal 12 karakter (saat ini ${value.length}).`;
        return '';
    };

    const isFormValid = (): boolean => {
        const eErr = validateEmail(email);
        const pErr = validatePassword(password);
        return !eErr && !pErr;
    };
    const { login } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const eErr = validateEmail(email);
        const pErr = validatePassword(password);
        setEmailError(eErr);
        setPasswordError(pErr);

        if (eErr || pErr) return;

        setError('');
        setLoading(true);

        try {
            await login(email, password);
            navigate('/');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Login gagal. Periksa email dan password Anda.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-split-layout">
            {/* Left Panel - Video Background & Branding */}
            <div className="login-left">
                {/* Background Video Layer */}
                <div className="video-background-container">
                    <iframe
                        src="https://www.youtube.com/embed/IgYQAwB6uMs?autoplay=1&mute=1&loop=1&playlist=IgYQAwB6uMs&controls=0&showinfo=0&autohide=1&modestbranding=1&start=78&rel=0"
                        title="Company Profile"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    ></iframe>
                </div>

                <div className="login-left-overlay">
                    <div className="login-brand-top">
                        <div className="brand-logo-container">
                            <img src={logo} alt="PMD Logo" className="brand-logo-img" />
                        </div>
                        <span className="brand-name">Pangan Masa Depan</span>
                    </div>

                    <div className="login-brand-bottom">
                        <h1 className="brand-headline">
                            Mengelola hasil panen dari padi hingga produksi.
                        </h1>
                        <p className="brand-subtext">
                            Optimalkan operasi penggilingan Anda, lacak inventaris secara real-time, dan tingkatkan efisiensi lantai produksi dengan solusi MES terintegrasi.
                        </p>

                        <div className="author-credit" style={{ marginTop: 40, padding: '12px 20px', background: 'rgba(255,255,255,0.1)', borderRadius: '8px', backdropFilter: 'blur(4px)', width: 'fit-content', border: '1px solid rgba(255,255,255,0.1)' }}>
                            <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>MES ini dibuat oleh Yayang SN - LOGIA</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Panel - Login Form */}
            <div className="login-right">
                {/* Theme Toggle (Absolute) */}
                <button
                    onClick={toggleTheme}
                    className="theme-toggle-btn"
                    title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                >
                    <span className="material-symbols-outlined">
                        {theme === 'dark' ? 'light_mode' : 'dark_mode'}
                    </span>
                </button>

                <div className="login-form-wrapper">
                    <div className="form-header">
                        <h2>Selamat Datang Kembali</h2>
                        <p>Masukkan kredensial Anda untuk mengakses dashboard.</p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        {error && (
                            <div className="alert alert-error" style={{ marginBottom: 24 }}>
                                <span className="material-symbols-outlined alert-icon">error</span>
                                <span>{error}</span>
                            </div>
                        )}

                        <div className="form-group">
                            <label className="form-label">Email atau Username</label>
                            <div className="input-with-icon">
                                <span className="material-symbols-outlined input-icon">person</span>
                                <input
                                    type="email"
                                    className={`form-input${emailError ? ' input-error' : ''}`}
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        if (emailError) setEmailError(validateEmail(e.target.value));
                                    }}
                                    onBlur={() => setEmailError(validateEmail(email))}
                                    placeholder="admin@panganmasadepan.com"
                                    required
                                />
                            </div>
                            {emailError && <span className="field-error">{emailError}</span>}
                        </div>

                        <div className="form-group">
                            <label className="form-label">Password</label>
                            <div className="input-with-icon">
                                <span className="material-symbols-outlined input-icon">lock</span>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    className={`form-input${passwordError ? ' input-error' : ''}`}
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        if (passwordError) setPasswordError(validatePassword(e.target.value));
                                    }}
                                    onBlur={() => setPasswordError(validatePassword(password))}
                                    placeholder="••••••••"
                                    required
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    <span className="material-symbols-outlined icon-sm">
                                        {showPassword ? 'visibility_off' : 'visibility'}
                                    </span>
                                </button>
                            </div>
                            {passwordError && <span className="field-error">{passwordError}</span>}
                        </div>

                        <div className="form-options">
                            <label className="checkbox-label">
                                <input type="checkbox" />
                                <span>Ingat saya</span>
                            </label>
                            <a href="#" className="forgot-password">Lupa password?</a>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary btn-lg btn-block"
                            disabled={loading || !isFormValid()}
                        >
                            {loading ? 'Memproses...' : (
                                <>
                                    Masuk
                                    <span className="material-symbols-outlined">arrow_forward</span>
                                </>
                            )}
                        </button>
                    </form>

                    <div className="system-status">
                        <div className="status-indicator">
                            <span className="status-dot"></span>
                            <span>Semua sistem berjalan normal</span>
                        </div>
                        <div className="app-version">
                            © {new Date().getFullYear()} MES Pangan Masa Depan v{import.meta.env.VITE_APP_VERSION}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
