import React, { useState, useContext } from 'react';
import api from '../../api/api';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FiMail, FiLock, FiEye, FiEyeOff, FiLogIn } from 'react-icons/fi';
import './login.css';

const Login = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      login(res.data.user, res.data.token);
      navigate('/');
    } catch (err) {
      alert(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fflogin-wrap">
      <div className="fflogin-bg" />

      <div className="fflogin-card">
        <div className="fflogin-brand">
          <div className="fflogin-logo">FF</div>
          <div className="fflogin-brandtext">
            <h1 className="fflogin-appname">Field Force</h1>
          </div>
        </div>

        <div className="fflogin-head">
          <h2 className="fflogin-title">
            Login
            <span className="fflogin-underline" />
          </h2>
        </div>

        <form className="fflogin-form" onSubmit={handleLogin}>
          <label className="fflogin-label">Email</label>
          <div className="fflogin-inputWrap">
            <span className="fflogin-ico">
              <FiMail />
            </span>
            <input
              className="fflogin-input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <label className="fflogin-label">Password</label>
          <div className="fflogin-inputWrap">
            <span className="fflogin-ico">
              <FiLock />
            </span>
            <input
              className="fflogin-input"
              type={showPass ? 'text' : 'password'}
              placeholder="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />

            <button
              type="button"
              className="fflogin-eyeBtn"
              onClick={() => setShowPass((s) => !s)}
              aria-label={showPass ? 'Hide password' : 'Show password'}
              title={showPass ? 'Hide password' : 'Show password'}
            >
              {showPass ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>

          <button className="fflogin-btn" type="submit" disabled={loading}>
            <span className="fflogin-btnIcon">
              <FiLogIn />
            </span>
            {loading ? 'Logging in...' : 'Login'}
          </button>

          <div className="fflogin-foot">
            <span className="fflogin-footText">
              Role-based dashboard (FIELD / MANAGER / ADMIN)
            </span>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
