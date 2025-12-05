import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await axios.post('http://localhost:5000/api/auth/register', {
        name,
        email,
        password
      });
      // On success, redirect to login
      alert('Registration successful! Please login.');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.msg || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-screen bg-[#F3F3F3] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border-2 border-[#191A23] rounded-2xl shadow-[4px_4px_0_#191A23] p-8 relative overflow-hidden">
        
        {/* Decorative corner */}
        <div className="absolute -top-10 -left-10 w-24 h-24 bg-[#191A23] rounded-full border-2 border-[#B9FF66]"></div>

        <div className="mb-8 text-center relative z-10">
           <div className="inline-flex items-center gap-2 mb-4">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <path d="M12 21.4L17.4 16H18C20.2 16 22 14.2 22 12C22 9.8 20.2 8 18 8H12V21.4Z" fill="#191A23"/>
              <path d="M12 2.6L6.6 8H6C3.8 8 2 9.8 2 12C2 14.2 3.8 16 6 16H12V2.6Z" fill="#B9FF66"/>
            </svg>
          </div>
          <h2 className="text-3xl font-bold">Join Positivus</h2>
          <p className="text-gray-500 mt-2">Create your account to start storing files.</p>
        </div>

        {error && <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4 text-sm font-bold border border-red-200">{error}</div>}

        <form onSubmit={handleRegister} className="space-y-4 relative z-10">
           <div className="space-y-2">
            <label className="font-bold text-sm">Full Name</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-[#191A23] focus:outline-none focus:shadow-[2px_2px_0_#191A23] transition-shadow bg-[#F3F3F3] focus:bg-white" 
              placeholder="John Doe"
              required 
            />
          </div>

          <div className="space-y-2">
            <label className="font-bold text-sm">Email Address</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-[#191A23] focus:outline-none focus:shadow-[2px_2px_0_#191A23] transition-shadow bg-[#F3F3F3] focus:bg-white" 
              placeholder="john@example.com"
              required 
            />
          </div>
          
          <div className="space-y-2">
            <label className="font-bold text-sm">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-[#191A23] focus:outline-none focus:shadow-[2px_2px_0_#191A23] transition-shadow bg-[#F3F3F3] focus:bg-white" 
              placeholder="••••••••"
              required 
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-[#B9FF66] text-[#191A23] font-bold py-4 rounded-xl border-2 border-[#191A23] shadow-[4px_4px_0_#191A23] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_#191A23] transition-all disabled:opacity-50 mt-2"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="mt-8 text-center text-sm relative z-10">
          <p className="text-gray-500">
            Already have an account?{' '}
            <button onClick={() => navigate('/login')} className="font-bold text-[#191A23] hover:underline">
              Log in
            </button>
          </p>
          <button onClick={() => navigate('/')} className="mt-4 text-xs text-gray-400 hover:text-gray-600">← Back to Home</button>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;