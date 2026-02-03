import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfDay, startOfWeek, startOfMonth, endOfDay, endOfWeek, endOfMonth, addDays, addWeeks, addMonths, subDays, subWeeks, subMonths } from 'date-fns';
import { sv } from 'date-fns/locale';

export type TimeRange = 'day' | 'week' | 'month';

interface TimeRangeSelectorProps {
  range: TimeRange;
  date: Date;
  onRangeChange: (range: TimeRange) => void;
  onDateChange: (date: Date) => void;
}

export function getDateRange(range: TimeRange, date: Date): { start: Date; end: Date } {
  switch (range) {
    case 'day':
      return { start: startOfDay(date), end: endOfDay(date) };
    case 'week':
      return { start: startOfWeek(date, { locale: sv }), end: endOfWeek(date, { locale: sv }) };
    case 'month':
      return { start: startOfMonth(date), end: endOfMonth(date) };
  }
}

export default function TimeRangeSelector({ range, date, onRangeChange, onDateChange }: TimeRangeSelectorProps) {
  const handlePrevious = () => {
    switch (range) {
      case 'day':
        onDateChange(subDays(date, 1));
        break;
      case 'week':
        onDateChange(subWeeks(date, 1));
        break;
      case 'month':
        onDateChange(subMonths(date, 1));
        break;
    }
  };

  const handleNext = () => {
    const now = new Date();
    let nextDate: Date;
    
    switch (range) {
      case 'day':
        nextDate = addDays(date, 1);
        break;
      case 'week':
        nextDate = addWeeks(date, 1);
        break;
      case 'month':
        nextDate = addMonths(date, 1);
        break;
    }
    
    // Don't allow navigating into the future
    if (nextDate <= now) {
      onDateChange(nextDate);
    }
  };

  const handleToday = () => {
    onDateChange(new Date());
  };

  const formatDateRange = () => {
    const { start, end } = getDateRange(range, date);
    
    switch (range) {
      case 'day':
        return format(date, 'd MMMM yyyy', { locale: sv });
      case 'week':
        return `${format(start, 'd MMM', { locale: sv })} - ${format(end, 'd MMM yyyy', { locale: sv })}`;
      case 'month':
        return format(date, 'MMMM yyyy', { locale: sv });
    }
  };

  const isToday = () => {
    const now = new Date();
    const { start, end } = getDateRange(range, date);
    return now >= start && now <= end;
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
      {/* Range selector */}
      <div className="flex rounded-lg border border-border overflow-hidden">
        {(['day', 'week', 'month'] as TimeRange[]).map((r) => (
          <Button
            key={r}
            variant={range === r ? 'default' : 'ghost'}
            size="sm"
            className="rounded-none h-8 px-3"
            onClick={() => onRangeChange(r)}
          >
            {r === 'day' ? 'Dag' : r === 'week' ? 'Vecka' : 'Månad'}
          </Button>
        ))}
      </div>

      {/* Date navigation */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={handlePrevious}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <span className="text-sm font-medium min-w-[160px] text-center capitalize">
          {formatDateRange()}
        </span>
        
        <Button 
          variant="outline" 
          size="icon" 
          className="h-8 w-8" 
          onClick={handleNext}
          disabled={isToday()}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        {!isToday() && (
          <Button variant="outline" size="sm" className="h-8" onClick={handleToday}>
            Idag
          </Button>
        )}
      </div>
    </div>
  );
}
