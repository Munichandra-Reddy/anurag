import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getFromCloudflare, saveToCloudflare } from '../utils/cloudflare';

const Login: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoginView, setIsLoginView] = useState(true);
  const navigate = useNavigate();

  React.useEffect(() => {
    const loggedInEmail = sessionStorage.getItem('loggedInEmail');
    if (loggedInEmail) {
      if (loggedInEmail === 'munidhoni@72') {
        navigate('/faculty-dashboard');
      } else if (
        loggedInEmail === 'maheshk@geonixa.com' || 
        loggedInEmail === 'jithendravarma.l@gmail.com'
      ) {
        navigate('/mentor-dashboard');
      } else {
        navigate('/dashboard');
      }
    }
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();
    
    // Faculty Login Check
    if (cleanEmail === 'munidhoni@72' && cleanPassword === 'Muni@72') {
      sessionStorage.setItem('loggedInEmail', cleanEmail);
      navigate('/faculty-dashboard');
      return;
    }

    // Mentor Login Check
    if (
      (cleanEmail === 'maheshk@geonixa.com' && cleanPassword === 'GEO@9001') ||
      (cleanEmail === 'jithendravarma.l@gmail.com' && cleanPassword === 'Varma@9293')
    ) {
      sessionStorage.setItem('loggedInEmail', cleanEmail);
      navigate('/mentor-dashboard');
      return;
    }

    if (cleanEmail.includes('@anurag')) {
      setIsLoading(true);
      setError('');
      try {
        const cloudStudents = await getFromCloudflare('registeredStudents') || [];
        const localStudents = JSON.parse(localStorage.getItem('registeredStudents') || '[]');
        
        // Merge students based on email to prevent losing old data
        const allStudentsMap = new Map();
        [...localStudents, ...cloudStudents].forEach(s => {
          if (s && s.email) allStudentsMap.set(s.email.toLowerCase(), s);
        });
        const existingStudents = Array.from(allStudentsMap.values());

        const student = existingStudents.find((s: any) => s.email.toLowerCase() === cleanEmail && s.password === cleanPassword);
        
        if (student) {
          sessionStorage.setItem('loggedInEmail', cleanEmail);
          navigate('/dashboard');
        } else {
          setError('Invalid username or password. Please create an account first.');
        }
      } catch (err) {
        setError('Failed to connect to server. Please try again.');
      } finally {
        setIsLoading(false);
      }
    } else {
      setError('Access restricted to @anurag emails, mentors, and faculty.');
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanEmail.includes('@anurag')) {
      setError('Only @anurag domain emails are allowed to register.');
      return;
    }
    if (cleanPassword !== confirmPassword.trim()) {
      setError('Passwords do not match.');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const cloudStudents = await getFromCloudflare('registeredStudents') || [];
      const localStudents = JSON.parse(localStorage.getItem('registeredStudents') || '[]');
      
      // Merge students based on email to prevent losing old data
      const allStudentsMap = new Map();
      [...localStudents, ...cloudStudents].forEach(s => {
        if (s && s.email) allStudentsMap.set(s.email.toLowerCase(), s);
      });
      const existingStudents = Array.from(allStudentsMap.values());

      const studentExists = existingStudents.some((s: any) => s.email.toLowerCase() === cleanEmail);
      
      if (studentExists) {
        setError('An account with this email already exists. Please sign in.');
        setIsLoading(false);
        return;
      }
      
      // Store signed up student
      const newStudent = {
        id: Date.now(),
        name,
        email: cleanEmail,
        password: cleanPassword,
        registeredAt: new Date().toISOString(),
        batch: ''
      };
      
      const updatedStudents = [...existingStudents, newStudent];
      
      // Keep local storage in sync as the primary instant datastore
      localStorage.setItem('registeredStudents', JSON.stringify(updatedStudents));
      
      // Sync to cloud in the background
      await saveToCloudflare('registeredStudents', updatedStudents);

      sessionStorage.setItem('loggedInEmail', cleanEmail);
      navigate('/dashboard');
    } catch (err) {
      setError('Failed to connect to server. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center md:justify-end md:pr-20 lg:pr-40 p-4 relative">
      {/* Background Image */}
      <div className="absolute inset-0 bg-[url('/anurag.avif')] bg-cover bg-center bg-no-repeat z-0"></div>
      
      {/* Top Left Logo */}
      <img src="/logo12.jpg" alt="Institute Logo" className="absolute top-6 left-6 md:top-8 md:left-12 h-24 md:h-32 z-20 object-contain" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-6 relative z-10"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary text-white rounded-2xl mx-auto flex items-center justify-center text-2xl font-bold mb-4">
            AL
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Anurag LMS Portal</h1>
          <p className="text-sm text-gray-500 mt-2">
            {isLoginView ? 'Sign in to your account' : 'Create a new account'}
          </p>
        </div>

        {isLoginView ? (
          <>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@anurag.edu.in"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors disabled:opacity-50"
                  required
                  disabled={isLoading}
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-gray-700">Password</label>
                  <a href="#" onClick={(e) => e.preventDefault()} className="text-sm font-medium text-primary hover:text-orange-600 transition-colors">Forgot Password?</a>
                </div>
                <input 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors disabled:opacity-50"
                  required
                  disabled={isLoading}
                />
              </div>

              {error && <p className="text-red-500 text-sm">{error}</p>}

              <button 
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-primary text-white rounded-xl font-medium hover:bg-orange-600 transition-colors mt-4 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            <p className="mt-8 text-center text-sm text-gray-600">
              Don't have an account? <a href="#" onClick={(e) => { e.preventDefault(); setIsLoginView(false); setError(''); }} className="font-medium text-primary hover:text-orange-600 transition-colors">Create an account</a>
            </p>
          </>
        ) : (
          <>
            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors disabled:opacity-50"
                  required
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@anurag.edu.in"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors disabled:opacity-50"
                  required
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors disabled:opacity-50"
                  required
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                <input 
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors disabled:opacity-50"
                  required
                  disabled={isLoading}
                />
              </div>

              {error && <p className="text-red-500 text-sm">{error}</p>}

              <button 
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-primary text-white rounded-xl font-medium hover:bg-orange-600 transition-colors mt-4 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  'Sign Up'
                )}
              </button>
            </form>

            <p className="mt-8 text-center text-sm text-gray-600">
              Already have an account? <a href="#" onClick={(e) => { e.preventDefault(); setIsLoginView(true); setError(''); }} className="font-medium text-primary hover:text-orange-600 transition-colors">Sign In</a>
            </p>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default Login;
