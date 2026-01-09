import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Shield, Mail, Lock, Loader2, AlertTriangle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function AdminLogin() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const { signIn } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const { error } = await signIn(email, password);

            if (error) throw error;

            toast({
                title: "🛡️ Access Granted",
                description: "Welcome back, Administrator.",
            });

            navigate("/admin/dashboard");
        } catch (error) {
            const err = error as Error;
            toast({
                variant: "destructive",
                title: "Access Denied",
                description: err.message || "Invalid administrator credentials",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-page" style={{
            background: 'radial-gradient(circle at 20% 10%, rgba(239, 68, 68, 0.08) 0%, transparent 25%), radial-gradient(circle at 80% 90%, rgba(220, 38, 38, 0.08) 0%, transparent 25%), var(--bg-main)'
        }}>
            <div className="auth-container" style={{ maxWidth: '420px' }}>
                {/* Header */}
                <div className="auth-header">
                    <div className="auth-logo animate-pulse" style={{
                        background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                        boxShadow: '0 0 20px rgba(239, 68, 68, 0.4)'
                    }}>
                        <Shield className="h-10 w-10" />
                    </div>
                    <h1 className="text-4xl font-extrabold mb-2 animate-fade-in">
                        <span style={{
                            background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text'
                        }}>
                            Admin Portal
                        </span>
                    </h1>
                    <p className="auth-subtitle flex items-center justify-center gap-2 animate-fade-in" style={{ animationDelay: '100ms' }}>
                        <AlertTriangle className="h-4 w-4 text-danger" />
                        Restricted Access Only
                    </p>
                </div>

                {/* Card */}
                <div className="auth-card animate-fade-in-scale" style={{
                    animationDelay: '200ms',
                    borderTop: '3px solid var(--danger)'
                }}>
                    <form onSubmit={handleLogin}>
                        {/* Email */}
                        <div className="form-group">
                            <Label className="label">
                                <Mail className="h-4 w-4 inline mr-2" />
                                Administrator Email
                            </Label>
                            <Input
                                type="email"
                                placeholder="admin@studymate.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="input"
                            />
                        </div>

                        {/* Password */}
                        <div className="form-group">
                            <Label className="label">
                                <Lock className="h-4 w-4 inline mr-2" />
                                Password
                            </Label>
                            <Input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="input"
                                placeholder="••••••••"
                            />
                        </div>

                        {/* Submit */}
                        <div className="form-actions">
                            <button
                                type="submit"
                                className={`btn btn-destructive w-full ${isLoading ? 'btn-loading' : ''}`}
                                disabled={isLoading}
                            >
                                {!isLoading && (
                                    <>
                                        <Shield className="h-5 w-5 mr-2" />
                                        {isLoading ? "Authenticating..." : "Access Dashboard"}
                                    </>
                                )}
                            </button>
                        </div>
                    </form>

                    {/* Footer */}
                    <div className="auth-footer">
                        <Link to="/auth" className="auth-link text-secondary hover:text-primary">
                            ← Back to Student Login
                        </Link>
                    </div>
                </div>

                {/* Warning Notice */}
                <div className="alert alert-danger animate-fade-in" style={{ animationDelay: '400ms' }}>
                    <AlertTriangle className="h-5 w-5 alert-icon" />
                    <div className="alert-content">
                        <p className="alert-description">
                            This area is for authorized administrators only. All access attempts are logged and monitored.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
