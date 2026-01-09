import { useNavigate } from "react-router-dom";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-main p-4">
      <div className="text-center animate-fade-in-scale">
        <div className="text-9xl font-bold text-primary mb-4 animate-bounce">404</div>
        <h1 className="text-4xl font-bold mb-4">Page Not Found</h1>
        <p className="text-lg text-secondary mb-8">
          Oops! The page you're looking for doesn't exist.
        </p>
        <div className="flex gap-4 justify-center">
          <button onClick={() => navigate(-1)} className="btn btn-outline">
            <ArrowLeft className="h-5 w-5 mr-2" />
            Go Back
          </button>
          <button onClick={() => navigate('/dashboard')} className="btn btn-primary">
            <Home className="h-5 w-5 mr-2" />
            Go Home
          </button>
        </div>
      </div>
    </div>
  );
}
