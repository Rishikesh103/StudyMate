import { useMemo } from "react";
import { HeatmapData } from "@/types";

interface HeatmapCalendarProps {
  data: HeatmapData[];
  className?: string;
  months?: number; // Number of months to show (default 3)
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function getColorIntensityClass(value: number): string {
  if (value === 0) return 'heatmap-level-0';
  if (value <= 1) return 'heatmap-level-1';
  if (value <= 2) return 'heatmap-level-2';
  if (value <= 3) return 'heatmap-level-3';
  if (value <= 4) return 'heatmap-level-4';
  return 'heatmap-level-5';
}

export function HeatmapCalendar({ data, className = "", months = 3 }: HeatmapCalendarProps) {
  // Filter data to only show last N months
  const filteredData = useMemo(() => {
    const today = new Date();
    const cutoffDate = new Date(today);
    cutoffDate.setMonth(cutoffDate.getMonth() - months);

    return data.filter(d => {
      if (!d.date) return false;
      const date = new Date(d.date);
      return date >= cutoffDate;
    });
  }, [data, months]);

  const weeks = useMemo(() => {
    if (filteredData.length === 0) return [];

    const result: HeatmapData[][] = [];
    let currentWeek: HeatmapData[] = [];

    // Pad the start to align with the correct day of week
    const firstDate = new Date(filteredData[0]?.date);
    const startPadding = firstDate.getDay();

    for (let i = 0; i < startPadding; i++) {
      currentWeek.push({ date: '', value: -1 });
    }

    filteredData.forEach((day) => {
      if (currentWeek.length === 7) {
        result.push(currentWeek);
        currentWeek = [];
      }
      currentWeek.push(day);
    });

    if (currentWeek.length > 0) {
      result.push(currentWeek);
    }

    return result;
  }, [filteredData]);

  const monthLabels = useMemo(() => {
    const labels: { label: string; position: number }[] = [];
    let currentMonth = -1;

    weeks.forEach((week, weekIndex) => {
      const validDay = week.find(d => d.date);
      if (validDay) {
        const month = new Date(validDay.date).getMonth();
        if (month !== currentMonth) {
          currentMonth = month;
          labels.push({ label: MONTHS[month], position: weekIndex });
        }
      }
    });

    return labels;
  }, [weeks]);

  if (filteredData.length === 0) {
    return (
      <div className={`heatmap-empty ${className}`}>
        <p className="text-muted">No study data available for the last {months} months</p>
      </div>
    );
  }

  return (
    <div className={`heatmap-calendar ${className}`}>
      {/* Month labels */}
      <div className="heatmap-months">
        {monthLabels.map((month, idx) => (
          <div
            key={idx}
            className="heatmap-month-label"
            style={{
              left: idx === 0 ? month.position * 16 : undefined, // Simplification, ideally use exact CSS grid or flex alignment
              marginLeft: idx > 0 ? (month.position - monthLabels[idx - 1].position) * 14 : month.position * 14
            }}
          >
            {month.label}
          </div>
        ))}
      </div>

      <div className="heatmap-grid-container">
        {/* Day labels */}
        <div className="heatmap-days">
          {DAYS.map((day, idx) => (
            <div key={day} className="heatmap-day-label" style={{ opacity: idx % 2 === 1 ? 1 : 0 }}>
              {day}
            </div>
          ))}
        </div>

        {/* Heatmap grid */}
        <div className="heatmap-weeks">
          {weeks.map((week, weekIdx) => (
            <div key={weekIdx} className="heatmap-week">
              {week.map((day, dayIdx) => (
                <div
                  key={`${weekIdx}-${dayIdx}`}
                  title={day.date ? `${day.date}: ${day.value} hours` : ''}
                  className={`heatmap-cell ${day.value >= 0 ? getColorIntensityClass(day.value) : 'heatmap-invisible'}`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="heatmap-legend">
        <span className="text-xs text-muted">Less</span>
        <div className="heatmap-legend-colors">
          {[0, 1, 2, 3, 4, 5].map((level) => (
            <div
              key={level}
              className={`heatmap-cell ${getColorIntensityClass(level)}`}
            />
          ))}
        </div>
        <span className="text-xs text-muted">More</span>
      </div>
    </div>
  );
}
