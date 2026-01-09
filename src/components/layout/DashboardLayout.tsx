import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";

interface DashboardLayoutProps {
  children: ReactNode;
  userRole: "student" | "teacher" | "parent";
  userName?: string;
  userAvatar?: string;
}

export function DashboardLayout({ children, userRole }: DashboardLayoutProps) {
  return (
    <div className="dashboard-layout">
      <Sidebar userRole={userRole} />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
