import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { Settings, User, Bell, Shield, Moon } from "lucide-react";

export default function SettingsPage() {
  const { profile } = useAuth();

  return (
    <DashboardLayout userRole="student" userName={profile?.name || 'Student'}>
      <div className="page-header animate-fade-in">
        <h1 className="page-title flex items-center gap-3">
          <Settings className="h-10 w-10 text-primary" />
          Settings
        </h1>
        <p className="page-description">Manage your account and preferences</p>
      </div>

      <div className="max-w-3xl">
        <div className="card animate-fade-in" style={{ animationDelay: '100ms' }}>
          <div className="card-header">
            <h3 className="card-title flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile
            </h3>
          </div>
          <div className="card-content">
            <div className="grid gap-4">
              <div className="form-group">
                <label className="label">Full Name</label>
                <input className="input" defaultValue={profile?.name} />
              </div>
              <div className="form-group">
                <label className="label">Email</label>
                <input className="input" type="email" defaultValue={profile?.email} />
              </div>
              <button className="btn btn-primary">Save Changes</button>
            </div>
          </div>
        </div>

        <div className="card mt-6 animate-fade-in" style={{ animationDelay: '200ms' }}>
          <div className="card-header">
            <h3 className="card-title flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </h3>
          </div>
          <div className="card-content">
            {[
              { label: 'Study reminders', desc: 'Get notified about upcoming sessions' },
              { label: 'Achievement alerts', desc: 'Celebrate your milestones' },
              { label: 'Weekly reports', desc: 'Receive weekly progress summaries' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b border-light last:border-0">
                <div>
                  <div className="font-medium">{item.label}</div>
                  <div className="text-sm text-secondary">{item.desc}</div>
                </div>
                <div className="switch">
                  <input type="checkbox" defaultChecked={i !== 2} />
                  <span className="switch-slider"></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
