import { forwardRef } from "react";
import { AlertTriangle, CheckCircle, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";

interface BurnoutIndicatorProps {
  level: 'low' | 'medium' | 'high';
  factors?: string[];
  className?: string;
}

const levelConfig = {
  low: {
    label: 'Low Risk',
    icon: CheckCircle,
    color: 'text-success',
    bgColor: 'bg-success/10',
    barColor: 'bg-success',
    percentage: 25,
    message: "You're doing great! Keep maintaining healthy study habits.",
  },
  medium: {
    label: 'Medium Risk',
    icon: AlertCircle,
    color: 'text-warning',
    bgColor: 'bg-warning/10',
    barColor: 'bg-warning',
    percentage: 60,
    message: "Consider taking more breaks and monitoring your stress levels.",
  },
  high: {
    label: 'High Risk',
    icon: AlertTriangle,
    color: 'text-danger',
    bgColor: 'bg-danger/10',
    barColor: 'bg-danger',
    percentage: 85,
    message: "Please take a break! Your study patterns indicate potential burnout.",
  },
};

export const BurnoutIndicator = forwardRef<HTMLDivElement, BurnoutIndicatorProps>(
  ({ level, factors = [], className = "" }, ref) => {
    const config = levelConfig[level];
    const Icon = config.icon;

    return (
      <Card ref={ref} className={`burnout-indicator ${className}`}>
        <div className="flex items-center gap-4 mb-4">
          <div className={`p-3 rounded-xl ${config.bgColor}`}>
            <Icon className={`h-6 w-6 ${config.color}`} />
          </div>
          <div>
            <h3 className="font-semibold flex items-center gap-2">
              Burnout Risk Assessment
              <span className="badge-ml">ML</span>
            </h3>
            <p className={`text-sm font-medium ${config.color}`}>{config.label}</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-4">
          <div className="h-3 bg-secondary rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${config.barColor}`}
              style={{ width: `${config.percentage}%`, transition: 'width 1s ease-out' }}
            />
          </div>
        </div>

        <p className="text-sm text-muted mb-4">{config.message}</p>

        {factors.length > 0 && (
          <div className="pt-4 border-t border-border">
            <h4 className="text-sm font-medium mb-2">Contributing Factors:</h4>
            <ul className="space-y-1">
              {factors.map((factor, idx) => (
                <li key={idx} className="text-xs text-muted flex items-center gap-2">
                  <span className={config.color}>•</span>
                  {factor}
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>
    );
  }
);

BurnoutIndicator.displayName = "BurnoutIndicator";
