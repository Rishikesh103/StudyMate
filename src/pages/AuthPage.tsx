import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { GraduationCap, User, Eye, EyeOff, Loader2, Mail, Lock, UserCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth, UserRole } from "../hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

type AuthMode = 'login' | 'signup';

export default function AuthPage() {
  const navigate = useNavigate();
  const { user, role, signIn, signUp, loading: authLoading } = useAuth();
  const [mode, setMode] = useState<AuthMode>('login');
  const [selectedRole, setSelectedRole] = useState<UserRole>('student');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });

  useEffect(() => {
    if (user && role) {
      if (role === 'student') navigate('/dashboard');
      else if (role === 'parent') navigate('/parent/dashboard');
      else if (role === 'teacher') navigate('/teacher/dashboard');
      else if (role === 'admin') navigate('/admin/dashboard');
    }
  }, [user, role, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'signup') {
        const { error } = await signUp(formData.email, formData.password, formData.name, selectedRole);
        if (error) {
          toast({ title: "Sign Up Failed", description: error.message, variant: "destructive" });
        } else {
          toast({ title: "✨ Account Created!", description: "Welcome to StudyMate. You can now sign in." });
          setMode('login');
        }
      } else {
        const { error } = await signIn(formData.email, formData.password);
        if (error) {
          toast({
            title: "Sign In Failed",
            description: error.message || "Invalid credentials",
            variant: "destructive"
          });
        }
      }
    } catch (err) {
      toast({ title: "Error", description: "An unexpected error occurred.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-main">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-brand mx-auto mb-4" />
          <p className="text-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        {/* Header */}
        <div className="auth-header">
          <div className="auth-logo">
            <GraduationCap className="h-10 w-10" />
          </div>
          <h1 className="auth-title animate-fade-in">StudyMate</h1>
          <p className="auth-subtitle animate-fade-in" style={{ animationDelay: '100ms' }}>
            {mode === 'login' ? '👋 Welcome back, scholar!' : '✨ Begin your learning journey'}
          </p>
        </div>

        {/* Main Card */}
        <div className="auth-card animate-fade-in-scale" style={{ animationDelay: '200ms' }}>
          {/* Role Selection (Signup Only) */}
          {mode === 'signup' && (
            <div className="grid grid-cols-2 gap-3 mb-8">
              <button
                type="button"
                className={`btn transition-all ${selectedRole === 'student' ? 'btn-primary' : 'btn-outline'
                  }`}
                onClick={() => setSelectedRole('student')}
              >
                <GraduationCap className="h-4 w-4 mr-2" />
                Student
              </button>
              <button
                type="button"
                className={`btn transition-all ${selectedRole === 'parent' ? 'btn-primary' : 'btn-outline'
                  }`}
                onClick={() => setSelectedRole('parent')}
              >
                <User className="h-4 w-4 mr-2" />
                Parent
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Name Field (Signup Only) */}
            {mode === 'signup' && (
              <div className="form-group">
                <label className="label">
                  <UserCircle className="h-4 w-4 inline mr-2" />
                  Full Name
                </label>
                <div className="input-group">
                  <input
                    type="text"
                    className="input"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required={mode === 'signup'}
                  />
                </div>
              </div>
            )}

            {/* Email Field */}
            <div className="form-group">
              <label className="label">
                <Mail className="h-4 w-4 inline mr-2" />
                Email Address
              </label>
              <div className="input-group">
                <input
                  type="email"
                  className="input"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="form-group">
              <label className="label">
                <Lock className="h-4 w-4 inline mr-2" />
                Password
              </label>
              <div className="input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  style={{ paddingRight: '3rem' }}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="form-actions">
              <button
                type="submit"
                className={`btn btn-primary w-full ${loading ? 'btn-loading' : ''}`}
                disabled={loading}
              >
                {!loading && (
                  <>
                    {mode === 'login' ? (
                      <>
                        <Sparkles className="h-5 w-5 mr-2" />
                        Sign In
                      </>
                    ) : (
                      <>
                        <GraduationCap className="h-5 w-5 mr-2" />
                        Create Account
                      </>
                    )}
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Footer */}
          <div className="auth-footer">
            <span className="text-secondary">
              {mode === 'login' ? "Don't have an account?" : "Already have an account?"}
            </span>
            <button
              type="button"
              className="auth-link"
              onClick={() => {
                setMode(mode === 'login' ? 'signup' : 'login');
                setFormData({ name: '', email: '', password: '' });
              }}
            >
              {mode === 'login' ? 'Sign Up' : 'Sign In'}
            </button>
          </div>

          {/* Divider */}
          {mode === 'login' && (
            <>
              <div className="divider-text mt-6">
                <span className="px-3 text-tertiary text-sm">Or continue with</span>
              </div>

              {/* Social Auth */}
              <div className="auth-social">
                <button type="button" className="btn-social" onClick={() => toast({ title: "Coming Soon", description: "Google sign-in will be available soon!" })}>
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Google
                </button>
                <button type="button" className="btn-social" onClick={() => toast({ title: "Coming Soon", description: "Microsoft sign-in will be available soon!" })}>
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zm12.6 0H12.6V0H24v11.4z" />
                  </svg>
                  Microsoft
                </button>
              </div>
            </>
          )}
        </div>

        {/* Admin Link */}
        <div className="text-center animate-fade-in" style={{ animationDelay: '400ms' }}>
          <a href="/admin" className="text-sm text-tertiary hover:text-primary transition-colors">
            Admin Portal →
          </a>
        </div>
      </div>
    </div>
  );
}
