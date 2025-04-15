import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import bcrypt from 'bcryptjs';
import '../styles/FirstResponderLogin.css';

const FirstResponderLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    console.log('Login attempt for username:', username);

    try {
      // First, get the stored password hash for the username
      const { data: credentials, error: fetchError } = await supabase
        .from('firstresponder_credentials')
        .select('password_hash')
        .eq('username', username)
        .single();

      console.log('Database response:', credentials, fetchError);

      if (fetchError) {
        console.error('Database fetch error:', fetchError);
        throw new Error('Invalid username or password');
      }

      console.log('Retrieved hash:', credentials.password_hash);
      
      // Use bcrypt to compare the entered password with the stored hash
      const passwordMatch = await bcrypt.compare(password, credentials.password_hash);
      console.log('Password match result:', passwordMatch);
      
      if (passwordMatch) {
        // Store the authentication state
        localStorage.setItem('firstResponderAuthenticated', 'true');
        localStorage.setItem('firstResponderUsername', username);
        
        // Update last login timestamp
        await supabase
          .from('firstresponder_credentials')
          .update({ last_login: new Date().toISOString() })
          .eq('username', username);
          
        navigate('/first-responder');
      } else {
        throw new Error('Invalid username or password');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>First Responder Login</h1>
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <div className="error-message">{error}</div>}
          <button type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default FirstResponderLogin; 