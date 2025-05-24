"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";

interface DatePickerProps {
  label: string;
  date?: Date;
  setDate: (date?: Date) => void;
  enableTradingDatesOnly?: boolean;
  autoSetLastValidDate?: boolean;
  autoSetFirstValidDate?: boolean;
  defaultValue?: string;
}

export default function DatePicker({ 
  label, 
  date, 
  setDate,
  enableTradingDatesOnly = true,
  autoSetLastValidDate = false,
  autoSetFirstValidDate = false,
  defaultValue
}: DatePickerProps) {
  const [validDates, setValidDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // 获取有效的交易日期
  useEffect(() => {
    if (enableTradingDatesOnly || autoSetLastValidDate || autoSetFirstValidDate) {
      setLoading(true);
      api.fetchTradingDates()
        .then(response => {
          if (response.status === 'success') {
            const dates = response.data.all_dates;
            setValidDates(dates);
            
            // 如果当前没有选中日期，根据设置自动选择日期
            if (!date) {
              if (autoSetLastValidDate && response.data.end_date) {
                const lastDate = new Date(response.data.end_date);
                setDate(lastDate);
              } else if (autoSetFirstValidDate && response.data.start_date) {
                const firstDate = new Date(response.data.start_date);
                setDate(firstDate);
              } else if (defaultValue) {
                // 使用默认值
                const defaultDate = new Date(defaultValue);
                setDate(defaultDate);
              }
            }
          }
        })
        .catch(error => {
          console.error('获取交易日期失败:', error);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [enableTradingDatesOnly, autoSetLastValidDate, autoSetFirstValidDate, date, setDate, defaultValue]);

  // 检查日期是否应该被禁用
  const isDateDisabled = (date: Date): boolean => {
    if (!enableTradingDatesOnly) return false;
    const dateStr = format(date, 'yyyy-MM-dd');
    return !validDates.includes(dateStr);
  };

  // 找到最近的有效交易日期
  const findNearestValidDate = (targetDate: Date): Date | null => {
    if (validDates.length === 0) return null;
    
    let closestDate = null;
    let minDiff = Infinity;
    
    for (const dateStr of validDates) {
      const validDate = new Date(dateStr);
      // 只考虑早于或等于目标日期的日期
      if (validDate <= targetDate) {
        const diff = Math.abs(targetDate.getTime() - validDate.getTime());
        if (diff < minDiff) {
          minDiff = diff;
          closestDate = validDate;
        }
      }
    }
    
    // 如果没有找到早于目标日期的有效日期，返回最早的有效日期
    return closestDate || (validDates.length > 0 ? new Date(validDates[0]) : null);
  };

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (!selectedDate) {
      setDate(undefined);
      return;
    }

    if (enableTradingDatesOnly) {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      if (validDates.includes(dateStr)) {
        setDate(selectedDate);
      } else {
        // 找到最近的有效日期
        const nearestDate = findNearestValidDate(selectedDate);
        if (nearestDate) {
          setDate(nearestDate);
        }
      }
    } else {
      setDate(selectedDate);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
            disabled={loading}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, "yyyy-MM-dd") : "选择日期"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleDateSelect}
            disabled={enableTradingDatesOnly ? isDateDisabled : undefined}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
} 