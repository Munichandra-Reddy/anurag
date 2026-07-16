import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, KeyRound, Mail, ArrowRight, ArrowLeft } from 'lucide-react';
import { getFromCloudflare, saveToCloudflare } from '../utils/cloudflare';
import { AUTHORIZED_STUDENTS } from '../data/students';

type AuthState = 'LOGIN' | 'FORGOT_EMAIL' | 'FORGOT_OTP' | 'FORGOT_NEW_PWD';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [authState, setAuthState] = useState<AuthState>('LOGIN');
  
  // Forgot Password State
  const [resetEmail, setResetEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  const navigate = useNavigate();

  React.useEffect(() => {
    const loggedInEmail = sessionStorage.getItem('loggedInEmail');
    if (loggedInEmail) {
      const facultyEmails = ['munidhoni@72', 'naveence@anurag.edu.in', 'shekarreddyce@anurag.edu.in', 'hodce@anurag.edu.in'];
      if (facultyEmails.includes(loggedInEmail)) {
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

  const fetchDatabaseStudents = async () => {
    const cloudStudents = await getFromCloudflare('registeredStudents') || [];
    const localStudents = JSON.parse(localStorage.getItem('registeredStudents') || '[]');
    
    const allStudentsMap = new Map();
    [...localStudents, ...(cloudStudents as any[])].forEach(s => {
      if (s && s.email) allStudentsMap.set(s.email.toLowerCase(), s);
    });
    
    return Array.from(allStudentsMap.values());
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();
    
    const facultyAccounts = [
      { email: 'munidhoni@72', pass: 'Muni@72' },
      { email: 'naveence@anurag.edu.in', pass: 'naveen' },
      { email: 'shekarreddyce@anurag.edu.in', pass: 'shekarreddy' },
      { email: 'hodce@anurag.edu.in', pass: 'hod' }
    ];

    const matchedFaculty = facultyAccounts.find(f => f.email === cleanEmail && f.pass === cleanPassword);
    if (matchedFaculty) {
      sessionStorage.setItem('loggedInEmail', cleanEmail);
      navigate('/faculty-dashboard');
      return;
    }

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
        let validDatabaseStudents = await fetchDatabaseStudents();
        const studentInDb = validDatabaseStudents.find((s: any) => s.email.toLowerCase() === cleanEmail);
        const authorizedStudent = AUTHORIZED_STUDENTS.find(s => s.email === cleanEmail);
        
        if (!studentInDb && !authorizedStudent) {
          setError('Access Denied: Your email is not authorized for this portal.');
          setIsLoading(false);
          return;
        }
        
        // Use password from DB if it exists (meaning they changed it or were manually added), otherwise use Roll Number
        const expectedPassword = studentInDb ? studentInDb.password : authorizedStudent?.roll;

        if (cleanPassword !== expectedPassword && cleanPassword.toLowerCase() !== expectedPassword?.toLowerCase()) {
          setError('Invalid password. If you haven\'t changed it, it is your Roll Number.');
          setIsLoading(false);
          return;
        }

        // Register if first time (only if they aren't in DB yet)
        if (!studentInDb && authorizedStudent) {
          const newStudent = {
            id: Date.now(),
            name: authorizedStudent.name,
            email: authorizedStudent.email,
            password: authorizedStudent.roll,
            registeredAt: new Date().toISOString(),
            batch: ''
          };
          validDatabaseStudents.push(newStudent);
          localStorage.setItem('registeredStudents', JSON.stringify(validDatabaseStudents));
          await saveToCloudflare('registeredStudents', validDatabaseStudents);
        }

        sessionStorage.setItem('loggedInEmail', cleanEmail);
        navigate('/dashboard');
      } catch (err) {
        setError('Failed to connect to server. Please try again.');
      } finally {
        setIsLoading(false);
      }
    } else {
      setError('Access restricted to @anurag emails, mentors, and faculty.');
    }
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = resetEmail.trim().toLowerCase();
    
    if (!cleanEmail.includes('@anurag')) {
      setError('Only @anurag.edu.in emails can reset passwords here.');
      return;
    }

    let validDatabaseStudents = await fetchDatabaseStudents();
    const studentInDb = validDatabaseStudents.find((s: any) => s.email.toLowerCase() === cleanEmail);
    const authorizedStudent = AUTHORIZED_STUDENTS.find(s => s.email === cleanEmail);
    
    if (!studentInDb && !authorizedStudent) {
      setError('Email not found in authorized students list or database.');
      return;
    }

    setIsLoading(true);
    setError('');
    
    // Generate 6 digit OTP
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(newOtp);

    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: cleanEmail,
          subject: 'Anurag LMS - Password Reset OTP',
          text: `Hello ${studentInDb?.name || authorizedStudent?.name},\n\nYour One-Time Password (OTP) for resetting your Anurag LMS password is: ${newOtp}\n\nIf you did not request this, please ignore this email.\n\nThanks,\nAnurag University Admin`
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        setAuthState('FORGOT_OTP');
        setSuccessMsg(`OTP sent to ${cleanEmail}`);
      } else {
        throw new Error(data.error || 'Failed to send email');
      }
    } catch (err: any) {
      console.error(err);
      setError('Error sending email. Please check your connection or try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp === generatedOtp) {
      setAuthState('FORGOT_NEW_PWD');
      setError('');
      setSuccessMsg('');
    } else {
      setError('Invalid OTP. Please try again.');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      const cleanEmail = resetEmail.trim().toLowerCase();
      let validDatabaseStudents = await fetchDatabaseStudents();
      const studentIndex = validDatabaseStudents.findIndex((s: any) => s.email.toLowerCase() === cleanEmail);
      
      if (studentIndex >= 0) {
        // Update existing
        validDatabaseStudents[studentIndex].password = newPassword;
      } else {
        // Register them now with the new password if they haven't logged in before
        const authorizedStudent = AUTHORIZED_STUDENTS.find(s => s.email === cleanEmail);
        if (authorizedStudent) {
          validDatabaseStudents.push({
            id: Date.now(),
            name: authorizedStudent.name,
            email: authorizedStudent.email,
            password: newPassword,
            registeredAt: new Date().toISOString(),
            batch: ''
          });
        }
      }

      localStorage.setItem('registeredStudents', JSON.stringify(validDatabaseStudents));
      await saveToCloudflare('registeredStudents', validDatabaseStudents);

      setSuccessMsg('Password updated successfully! You can now log in.');
      setAuthState('LOGIN');
      setEmail(resetEmail);
      setPassword('');
      setResetEmail('');
      setOtp('');
      setNewPassword('');
    } catch (err) {
      setError('Failed to update password in database.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetFlow = () => {
    setAuthState('LOGIN');
    setError('');
    setSuccessMsg('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center md:justify-end md:pr-20 lg:pr-40 p-4 relative">
      {/* Background Image */}
      <div className="absolute inset-0 bg-[url('/anurag.avif')] bg-cover bg-center bg-no-repeat z-0"></div>
      
      {/* Top Left Logo */}
      <img src="/logo12.jpg" alt="Institute Logo" className="absolute top-6 left-6 md:top-8 md:left-12 h-24 md:h-32 z-20 object-contain" />

      {/* Top Right Navigation */}
      {!showForm && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-8 right-6 md:top-12 md:right-16 z-20 flex space-x-3 md:space-x-4"
        >
          <button 
            onClick={() => setShowForm(true)}
            className="px-5 py-2 md:px-8 md:py-3 bg-[#f97316] hover:bg-[#ea580c] text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all"
          >
            Login
          </button>
        </motion.div>
      )}

      {/* Hero Text */}
      {!showForm && (
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="absolute inset-0 flex flex-col items-center justify-center text-center text-white px-4 z-10 pointer-events-none"
        >
          <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold mb-6 max-w-5xl leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
            Changing the world takes more than grades...
          </h1>
          <p className="text-xl md:text-2xl lg:text-3xl font-medium max-w-3xl opacity-90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
            And, we create the space for whatever it takes
          </p>
        </motion.div>
      )}

      <AnimatePresence>
        {showForm && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-sm bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-6 relative z-10 overflow-hidden"
          >
            <button 
              onClick={() => { setShowForm(false); resetFlow(); }}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors z-20"
              aria-label="Close form"
            >
              <X size={20} />
            </button>
            
            <div className="text-center mb-6 pt-2">
              <div className="w-16 h-16 bg-primary text-white rounded-2xl mx-auto flex items-center justify-center text-2xl font-bold mb-4">
                AL
              </div>
              <h1 className="text-2xl font-bold text-gray-900">
                {authState === 'LOGIN' ? 'Anurag LMS Portal' : 'Reset Password'}
              </h1>
              <p className="text-sm text-gray-500 mt-2">
                {authState === 'LOGIN' && 'Sign in to your account'}
                {authState === 'FORGOT_EMAIL' && 'Enter your email to receive an OTP'}
                {authState === 'FORGOT_OTP' && 'Enter the OTP sent to your email'}
                {authState === 'FORGOT_NEW_PWD' && 'Create your new password'}
              </p>
            </div>

            {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">{error}</div>}
            {successMsg && <div className="mb-4 p-3 bg-green-50 text-green-700 text-sm rounded-lg border border-green-100">{successMsg}</div>}

            {/* --- LOGIN FORM --- */}
            {authState === 'LOGIN' && (
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
                    <button 
                      type="button" 
                      onClick={() => setAuthState('FORGOT_EMAIL')}
                      className="text-xs text-primary hover:text-orange-700 font-medium"
                    >
                      Forgot?
                    </button>
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
            )}

            {/* --- FORGOT PASSWORD: ENTER EMAIL --- */}
            {authState === 'FORGOT_EMAIL' && (
              <form onSubmit={handleSendOTP} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Registered Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      type="email" 
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="student@anurag.edu.in"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="flex flex-col space-y-2 mt-4">
                  <button 
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 bg-primary text-white rounded-xl font-medium hover:bg-orange-600 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                  >
                    {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><span>Send OTP</span> <ArrowRight size={18}/></>}
                  </button>
                  <button 
                    type="button"
                    onClick={resetFlow}
                    className="w-full py-3 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors flex items-center justify-center space-x-2"
                  >
                    <ArrowLeft size={18} /> <span>Back to Login</span>
                  </button>
                </div>
              </form>
            )}

            {/* --- FORGOT PASSWORD: ENTER OTP --- */}
            {authState === 'FORGOT_OTP' && (
              <form onSubmit={handleVerifyOTP} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Enter 6-digit OTP</label>
                  <input 
                    type="text" 
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="123456"
                    className="w-full px-4 py-3 text-center tracking-widest text-lg rounded-xl border border-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                    required
                  />
                </div>

                <div className="flex flex-col space-y-2 mt-4">
                  <button 
                    type="submit"
                    className="w-full py-3 bg-primary text-white rounded-xl font-medium hover:bg-orange-600 transition-colors flex items-center justify-center space-x-2"
                  >
                    <span>Verify OTP</span> <ArrowRight size={18}/>
                  </button>
                  <button 
                    type="button"
                    onClick={() => setAuthState('FORGOT_EMAIL')}
                    className="w-full py-3 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors flex items-center justify-center space-x-2"
                  >
                    <ArrowLeft size={18} /> <span>Change Email</span>
                  </button>
                </div>
              </form>
            )}

            {/* --- FORGOT PASSWORD: NEW PASSWORD --- */}
            {authState === 'FORGOT_NEW_PWD' && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      type="password" 
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                      required
                      minLength={6}
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="flex flex-col space-y-2 mt-4">
                  <button 
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                  >
                    {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Update Password'}
                  </button>
                </div>
              </form>
            )}

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Login;
