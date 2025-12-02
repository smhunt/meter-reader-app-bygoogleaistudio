import React, { useState } from 'react';
import { Droplets, Mail, Lock, LogIn, UserPlus, Loader2, Key } from 'lucide-react';
import { signIn, signUp, sendPasswordReset } from '../services/auth';

interface LoginProps {
  onSuccess: () => void;
}

export const Login: React.FC<LoginProps> = ({ onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Please enter your email address to reset your password.');
      return;
    }
    setError(null);
    setLoading(true);
    setMessage(null);
    try {
      await sendPasswordReset(email);
      setMessage('Password reset email sent. Check your inbox.');
      setIsForgotPassword(false);
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        setError('No account found with this email address.');
      } else {
        setError('Failed to send password reset email. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (isForgotPassword) {
      await handleForgotPassword();
      return;
    }

    try {
      if (isSignUp) {
        await signUp(email, password);
      } else {
        await signIn(email, password);
      }
      onSuccess();
    } catch (err: any) {
      const code = err.code || '';
      if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setError('Invalid email or password');
      } else if (code === 'auth/email-already-in-use') {
        setError('Email already registered. Try signing in.');
      } else if (code === 'auth/weak-password') {
        setError('Password must be at least 6 characters');
      } else if (code === 'auth/invalid-email') {
        setError('Invalid email address');
      } else {
        setError(err.message || 'Authentication failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleView = (view: 'signIn' | 'signUp' | 'forgotPassword') => {
    setError(null);
    setMessage(null);
    if (view === 'signUp') {
      setIsSignUp(true);
      setIsForgotPassword(false);
    } else if (view === 'forgotPassword') {
      setIsSignUp(false);
      setIsForgotPassword(true);
    } else {
      setIsSignUp(false);
      setIsForgotPassword(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      {/* Logo */}
      <div className="flex items-center space-x-3 mb-8">
        <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
          <Droplets className="w-7 h-7 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">FlowCheck</h1>
          <p className="text-xs text-slate-400">Meter Reading System</p>
        </div>
      </div>

      {/* Form Card */}
      <div className="w-full max-w-sm bg-surface border border-slate-700 rounded-2xl p-6">
        <h2 className="text-xl font-bold text-white text-center mb-6">
          {isForgotPassword ? 'Reset Password' : isSignUp ? 'Create Account' : 'Sign In'}
        </h2>

        {message && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 text-green-400 text-sm mb-4">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Email</label>
            <div className="relative">
              <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                className="w-full bg-slate-800 border border-slate-600 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {!isForgotPassword && (
            <div>
              <label className="block text-sm text-slate-400 mb-1">Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                  minLength={6}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-primary"
                />
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white py-3 rounded-lg font-medium flex items-center justify-center space-x-2 hover:bg-primaryDark disabled:opacity-50 transition-colors"
          >
            {loading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : isForgotPassword ? (
              <>
                <Key size={20} />
                <span>Send Reset Link</span>
              </>
            ) : isSignUp ? (
              <>
                <UserPlus size={20} />
                <span>Create Account</span>
              </>
            ) : (
              <>
                <LogIn size={20} />
                <span>Sign In</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center space-y-2">
          <button
            onClick={() => toggleView(isSignUp ? 'signIn' : 'signUp')}
            className="text-sm text-slate-400 hover:text-white"
          >
            {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </button>
          {!isSignUp && (
             <button
                onClick={() => toggleView(isForgotPassword ? 'signIn' : 'forgotPassword')}
                className="text-sm text-slate-400 hover:text-white block w-full text-center"
              >
                {isForgotPassword ? 'Back to Sign In' : 'Forgot Password?'}
              </button>
          )}
        </div>
      </div>
    </div>
  );
};