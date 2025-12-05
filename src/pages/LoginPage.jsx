import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import SuccessDialog from '../components/SuccessDialog';

const LoginPage = () => {
  const navigate = useNavigate();
  
  // State to toggle between Login and Register views
  const [isLogin, setIsLogin] = useState(true);
  
  // Form States
  const [name, setName] = useState('');
  const [email, setEmail] = useState('jane@positivus.com');
  const [password, setPassword] = useState('password123');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Success Dialog State
  const [showSuccess, setShowSuccess] = useState(false);

  // Toggle function
  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
  };
  
  // Handle closing the success dialog
  const handleSuccessClose = () => {
    setShowSuccess(false);
    setIsLogin(true); // Switch to login view smoothly
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    const payload = isLogin ? { email, password } : { name, email, password };

    try {
      const res = await axios.post(`${process.env.REACT_APP_API_URL}${endpoint}`, payload);

      if (isLogin) {
        // Handle Login Success
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        navigate('/dashboard');
      } else {
        // Handle Register Success
        setShowSuccess(true);
      }
    } catch (err) {
      setError(err.response?.data?.msg || (isLogin ? 'Login failed' : 'Registration failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-screen bg-[#F3F3F3] flex items-center justify-center p-4">
      
      {/* Success Dialog Component */}
      <SuccessDialog 
        isOpen={showSuccess} 
        onClose={handleSuccessClose}
        title="Welcome Aboard!"
        message="Your account has been successfully created. You can now log in to access your files."
      />

      {/* Container Animation:
        - layout: Handles smooth resizing (height/width)
        - overflow-hidden: Essential for the corner bubbles to clip correctly
      */}
      <motion.div 
        layout
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="w-full max-w-md bg-white border-2 border-[#191A23] rounded-2xl shadow-[4px_4px_0_#191A23] p-6 sm:p-8 relative overflow-hidden"
      >
        
        {/* Top-Right Decorative corner (Always present) */}
        <div className="absolute -top-10 -right-10 w-20 h-20 bg-[#B9FF66] rounded-full border-2 border-[#191A23] z-0"></div>
        
        {/* Bottom-Left Decorative corner (Animate Presence for smooth enter/exit) */}
        <AnimatePresence>
          {!isLogin && (
             <motion.div 
               initial={{ scale: 0 }} 
               animate={{ scale: 1 }} 
               exit={{ scale: 0 }}
               transition={{ duration: 0.4, type: "spring" }}
               className="absolute -bottom-10 -left-10 w-24 h-24 bg-[#191A23] rounded-full border-2 border-[#B9FF66] z-0"
             />
          )}
        </AnimatePresence>

        <motion.div layout className="mb-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 mb-4">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <path d="M12 21.4L17.4 16H18C20.2 16 22 14.2 22 12C22 9.8 20.2 8 18 8H12V21.4Z" fill="#191A23"/>
              <path d="M12 2.6L6.6 8H6C3.8 8 2 9.8 2 12C2 14.2 3.8 16 6 16H12V2.6Z" fill="#B9FF66"/>
            </svg>
          </div>
          
          {/* Animated Text Switching */}
          <div className="relative">
            <AnimatePresence mode='wait'>
                <motion.h2 
                    key={isLogin ? 'title-login' : 'title-register'}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="text-3xl font-bold"
                >
                    {isLogin ? 'Welcome Back' : 'Join Positivus'}
                </motion.h2>
            </AnimatePresence>

            <AnimatePresence mode='wait'>
                <motion.p 
                    key={isLogin ? 'desc-login' : 'desc-register'}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.2 }}
                    className="text-gray-500 mt-2"
                >
                    {isLogin ? 'Enter your credentials to access your drive.' : 'Create your account to start storing files.'}
                </motion.p>
            </AnimatePresence>
          </div>
        </motion.div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-100 text-red-700 p-3 rounded-lg mb-4 text-sm font-bold border border-red-200"
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
          {/* Name Field - Expands/Collapses smoothly */}
          <AnimatePresence>
            {!isLogin && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="space-y-2 pb-2">
                  <label className="font-bold text-sm">Full Name</label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border-2 border-[#191A23] focus:outline-none focus:shadow-[2px_2px_0_#191A23] transition-shadow bg-[#F3F3F3] focus:bg-white" 
                    placeholder="John Doe"
                    required={!isLogin} 
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div layout className="space-y-2">
            <label className="font-bold text-sm">Email Address</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-[#191A23] focus:outline-none focus:shadow-[2px_2px_0_#191A23] transition-shadow bg-[#F3F3F3] focus:bg-white" 
              required 
            />
          </motion.div>
          
          <motion.div layout className="space-y-2">
            <label className="font-bold text-sm">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-[#191A23] focus:outline-none focus:shadow-[2px_2px_0_#191A23] transition-shadow bg-[#F3F3F3] focus:bg-white" 
              required 
            />
            {isLogin && (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                className="text-right"
              >
                <a href="#" className="text-xs text-gray-500 hover:text-[#191A23] underline">Forgot?</a>
              </motion.div>
            )}
          </motion.div>

          <motion.button 
            layout
            type="submit" 
            disabled={loading}
            className={`w-full font-bold py-4 rounded-xl border-2 border-[#191A23] shadow-[4px_4px_0_#191A23] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_#191A23] transition-all disabled:opacity-50 ${isLogin ? 'bg-[#191A23] text-white' : 'bg-[#B9FF66] text-[#191A23]'}`}
          >
            {loading ? (isLogin ? 'Signing In...' : 'Creating Account...') : (isLogin ? 'Sign In' : 'Create Account')}
          </motion.button>
        </form>

        <motion.div layout className="mt-8 text-center text-sm relative z-10">
          <p className="text-gray-500">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button 
              onClick={toggleMode} 
              className="font-bold text-[#191A23] hover:underline"
            >
              {isLogin ? 'Create one' : 'Log in'}
            </button>
          </p>
          <button onClick={() => navigate('/')} className="mt-4 text-xs text-gray-400 hover:text-gray-600">← Back to Home</button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default LoginPage;