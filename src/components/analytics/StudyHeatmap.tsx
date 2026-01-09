import { useState, useEffect } from 'react';

interface HeatmapDay {
    date: string;
    minutes: number;
    level: 0 | 1 | 2 | 3 | 4;
}

interface Props {
    data: HeatmapDay[];
}

const LEVEL_COLORS = {
    0: '#161b22',
    1: '#0e4429',
    2: '#006d32',
    3: '#26a641',
    4: '#39d353'
} as const;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function StudyHeatmap({ data }: Props) {
    const [hoveredDay, setHoveredDay] = useState<HeatmapDay | null>(null);
    const [hoveredPosition, setHoveredPosition] = useState<{ x: number; y: number } | null>(null);

    // Organize data into weeks for GitHub-style display
    const weeks: (HeatmapDay | null)[][] = [];

    if (data.length === 365) {
        // Get the first day's date
        const firstDate = new Date(data[0].date);
        const firstDayOfWeek = firstDate.getDay(); // 0 = Sunday, 6 = Saturday

        let currentWeek: (HeatmapDay | null)[] = [];

        // Fill empty days at the start of the first week
        for (let i = 0; i < firstDayOfWeek; i++) {
            currentWeek.push(null);
        }

        // Add all 365 days
        data.forEach((day, index) => {
            currentWeek.push(day);

            // If we've reached Saturday (7 days) or it's the last day
            if (currentWeek.length === 7) {
                weeks.push([...currentWeek]);
                currentWeek = [];
            }
        });

        // Fill remaining days in the last week
        if (currentWeek.length > 0) {
            while (currentWeek.length < 7) {
                currentWeek.push(null);
            }
            weeks.push(currentWeek);
        }
    }

    const formatTooltip = (day: HeatmapDay) => {
        const date = new Date(day.date);
        const dayName = DAYS[date.getDay()];
        const monthName = MONTHS[date.getMonth()];
        const dayNum = date.getDate();
        const year = date.getFullYear();

        return {
            date: `${dayName}, ${monthName} ${dayNum}, ${year}`,
            activity: day.minutes === 0
                ? 'No study time'
                : `${day.minutes} minute${day.minutes === 1 ? '' : 's'} studied`
        };
    };

    const handleMouseEnter = (day: HeatmapDay | null, event: React.MouseEvent) => {
        if (day) {
            setHoveredDay(day);
            const rect = event.currentTarget.getBoundingClientRect();
            setHoveredPosition({ x: rect.left + rect.width / 2, y: rect.top });
        }
    };

    const handleMouseLeave = () => {
        setHoveredDay(null);
        setHoveredPosition(null);
    };

    if (data.length !== 365) {
        console.log('[Heatmap] Data length:', data.length, 'Expected: 365');
        console.log('[Heatmap] Data sample:', data.slice(0, 3));
        return (
            <div className="text-center py-8 text-muted-foreground">
                <p>Loading activity data... ({data.length}/365 days)</p>
            </div>
        );
    }

    console.log('[Heatmap] Rendering with', weeks.length, 'weeks');
    console.log('[Heatmap] First week:', weeks[0]);
    console.log('[Heatmap] Active days:', data.filter(d => d.level > 0).length);

    return (
        <div className="relative">
            {/* Tooltip */}
            {hoveredDay && hoveredPosition && (
                <div
                    className="fixed bg-gray-900 text-white text-xs px-3 py-2 rounded-md shadow-lg z-50 pointer-events-none"
                    style={{
                        left: `${hoveredPosition.x}px`,
                        top: `${hoveredPosition.y - 60}px`,
                        transform: 'translateX(-50%)'
                    }}
                >
                    <div className="font-semibold">{formatTooltip(hoveredDay).activity}</div>
                    <div className="text-gray-300 mt-0.5">{formatTooltip(hoveredDay).date}</div>
                </div>
            )}

            {/* Month labels */}
            <div className="flex mb-2" style={{ paddingLeft: '32px' }}>
                {weeks.map((week, weekIndex) => {
                    const firstDay = week.find(d => d !== null);
                    if (firstDay && weekIndex % 4 === 0) {
                        const date = new Date(firstDay.date);
                        return (
                            <div
                                key={weekIndex}
                                className="text-xs text-muted-foreground font-medium"
                                style={{ width: '14px', marginRight: '3px' }}
                            >
                                {MONTHS[date.getMonth()]}
                            </div>
                        );
                    }
                    return <div key={weekIndex} style={{ width: '14px', marginRight: '3px' }} />;
                })}
            </div>

            <div className="flex gap-1">
                {/* Day labels */}
                <div className="flex flex-col gap-1 mr-2">
                    <div className="h-[11px]" /> {/* Offset for alignment */}
                    <div className="h-[11px] text-[10px] text-muted-foreground flex items-center">Mon</div>
                    <div className="h-[11px]" />
                    <div className="h-[11px] text-[10px] text-muted-foreground flex items-center">Wed</div>
                    <div className="h-[11px]" />
                    <div className="h-[11px] text-[10px] text-muted-foreground flex items-center">Fri</div>
                    <div className="h-[11px]" />
                </div>

                {/* Heatmap grid */}
                <div className="flex gap-[3px] overflow-x-auto pb-2">
                    {weeks.map((week, weekIndex) => (
                        <div key={weekIndex} className="flex flex-col gap-[3px]">
                            {week.map((day, dayIndex) => (
                                <div
                                    key={`${weekIndex}-${dayIndex}`}
                                    className={`rounded-sm transition-all ${day ? 'cursor-pointer hover:ring-2 hover:ring-white/40' : ''
                                        }`}
                                    style={{
                                        width: '11px',
                                        height: '11px',
                                        backgroundColor: day ? LEVEL_COLORS[day.level] : 'transparent'
                                    }}
                                    onMouseEnter={(e) => handleMouseEnter(day, e)}
                                    onMouseLeave={handleMouseLeave}
                                    title={day ? formatTooltip(day).activity : ''}
                                />
                            ))}
                        </div>
                    ))}
                </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
                <span>Less</span>
                {[0, 1, 2, 3, 4].map(level => (
                    <div
                        key={level}
                        className="rounded-sm"
                        style={{
                            width: '11px',
                            height: '11px',
                            backgroundColor: LEVEL_COLORS[level as keyof typeof LEVEL_COLORS]
                        }}
                    />
                ))}
                <span>More</span>
            </div>
        </div>
    );
}
