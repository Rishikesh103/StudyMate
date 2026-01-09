import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  LayoutDashboard, BookOpen, Target, PieChart, Settings,
  LogOut, GraduationCap, Map, Brain, Calendar
} from "lucide-react";

interface SidebarProps {
  userRole: "student" | "teacher" | "parent";
}

export function Sidebar({ userRole }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();

  const studentLinks = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
    { icon: BookOpen, label: "Study Log", path: "/study-log" },
    { icon: Map, label: "Syllabus Map", path: "/syllabus" },
    { icon: Target, label: "Quiz Mode", path: "/quiz" },
    { icon: Brain, label: "Revision Planner", path: "/revision" },
    { icon: PieChart, label: "Analytics", path: "/analytics" },
    { icon: Calendar, label: "Roadmap", path: "/roadmap" },
  ];

  const teacherLinks = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/teacher/dashboard" },
    { icon: Settings, label: "Settings", path: "/settings" },
  ];

  const parentLinks = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/parent/dashboard" },
    { icon: Settings, label: "Settings", path: "/settings" },
  ];

  const links = userRole === "student" ? studentLinks :
    userRole === "teacher" ? teacherLinks : parentLinks;

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <div className="sidebar">
      {/* Header */}
      <div className="sidebar-header">
        <div className="sidebar-logo animate-float">
          <GraduationCap />
        </div>
        <h2 className="sidebar-title">StudyMate</h2>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav" aria-label="Main navigation">
        {links.map((link, index) => {
          const isActive = location.pathname === link.path;
          const Icon = link.icon;

          return (
            <a
              key={link.path}
              href={link.path}
              onClick={(e) => {
                e.preventDefault();
                navigate(link.path);
              }}
              className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
              style={{ animationDelay: `${index * 30}ms` }}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="sidebar-nav-icon" aria-hidden="true" />
              <span>{link.label}</span>
            </a>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <button
          onClick={handleLogout}
          className="sidebar-nav-item w-full text-danger hover:bg-danger/10"
        >
          <LogOut className="sidebar-nav-icon" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
