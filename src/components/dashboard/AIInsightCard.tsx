import { AIInsight } from "@/types";
import { Card } from "@/components/ui/card";
import { Lightbulb, Trophy, AlertTriangle, BookOpen } from "lucide-react";

interface AIInsightCardProps {
  insight: AIInsight;
  index?: number;
}

const iconMap = {
  tip: Lightbulb,
  achievement: Trophy,
  warning: AlertTriangle,
  recommendation: BookOpen,
};

export function AIInsightCard({ insight }: AIInsightCardProps) {
  const Icon = iconMap[insight.type];

  return (
    <Card className={`ai-insight-card insight-${insight.color}`}>
      <div className="flex gap-4">
        <div className={`insight-icon p-2 rounded-lg text-${insight.color}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="insight-content flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{insight.icon}</span>
            <h4 className="font-semibold text-sm">{insight.title}</h4>
          </div>
          <p className="text-sm text-muted leading-relaxed">
            {insight.description}
          </p>
        </div>
      </div>
    </Card>
  );
}
