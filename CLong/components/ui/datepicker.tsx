import React, { useState, useEffect } from 'react';
import { format, parse } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { api } from '@/lib/api';

interface DatePickerProps {
  selected: Date | undefined;
  onChange: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
  defaultValue?: string; // 默认日期值 YYYY-MM-DD
  enableTradingDatesOnly?: boolean; // 是否只允许选择交易日
  autoSetLastValidDate?: boolean; // 是否自动设置最后有效日期
  autoSetFirstValidDate?: boolean; // 是否自动设置第一个有效日期
}

export function DatePicker({
  selected,
  onChange,
  placeholder = '选择日期',
  className,
  defaultValue,
  enableTradingDatesOnly = false,
  autoSetLastValidDate = false,
  autoSetFirstValidDate = false,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(
    selected ? format(selected, 'yyyy-MM-dd') : defaultValue || ''
  );
  const [validDates, setValidDates] = useState<string[]>([]);
  const [lastValidDate, setLastValidDate] = useState<string | null>(null);
  const [firstValidDate, setFirstValidDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // 获取有效的交易日期
  useEffect(() => {
    if (enableTradingDatesOnly || autoSetLastValidDate || autoSetFirstValidDate) {
      setLoading(true);
      api.fetchTradingDates()
        .then((response: any) => {
          if (response.status === 'success') {
            const dates = response.data.all_dates;
            setValidDates(dates);
            
            if (response.data.start_date) {
              setFirstValidDate(response.data.start_date);
            }
            
            if (response.data.end_date) {
              setLastValidDate(response.data.end_date);
            }
            
            // 如果当前没有选中日期，根据设置自动选择日期
            if (!selected) {
              if (autoSetLastValidDate && response.data.end_date) {
                const lastDate = new Date(response.data.end_date);
                onChange(lastDate);
                setInputValue(response.data.end_date);
              } else if (autoSetFirstValidDate && response.data.start_date) {
                const firstDate = new Date(response.data.start_date);
                onChange(firstDate);
                setInputValue(response.data.start_date);
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
  }, [enableTradingDatesOnly, autoSetLastValidDate, autoSetFirstValidDate, selected, onChange]);

  // 检查日期是否为有效交易日
  const isValidTradingDate = (dateStr: string): boolean => {
    if (!enableTradingDatesOnly) return true;
    return validDates.includes(dateStr);
  };

  // 检查日期是否应该被禁用
  const isDateDisabled = (date: Date): boolean => {
    if (!enableTradingDatesOnly) return false;
    const dateStr = format(date, 'yyyy-MM-dd');
    return !validDates.includes(dateStr);
  };

  // 处理手动输入
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    
    // 尝试解析日期，使用标准格式 YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      try {
        const parsedDate = parse(value, 'yyyy-MM-dd', new Date());
        if (!isNaN(parsedDate.getTime())) {
          // 检查是否为有效交易日
          if (isValidTradingDate(value)) {
            onChange(parsedDate);
          } else if (enableTradingDatesOnly) {
            // 如果不是有效交易日，找到最近的有效日期
            const nearestValidDate = findNearestValidDate(value);
            if (nearestValidDate) {
              const nearestDate = new Date(nearestValidDate);
              onChange(nearestDate);
              setInputValue(nearestValidDate);
            }
          } else {
            onChange(parsedDate);
          }
        }
      } catch (e) {
        // 解析失败，不更新日期
      }
    }
  };

  // 找到最近的有效交易日期
  const findNearestValidDate = (targetDate: string): string | null => {
    if (validDates.length === 0) return null;
    
    const target = new Date(targetDate);
    let closestDate = null;
    let minDiff = Infinity;
    
    for (const dateStr of validDates) {
      const date = new Date(dateStr);
      // 只考虑早于或等于目标日期的日期
      if (date <= target) {
        const diff = Math.abs(target.getTime() - date.getTime());
        if (diff < minDiff) {
          minDiff = diff;
          closestDate = dateStr;
        }
      }
    }
    
    // 如果没有找到早于目标日期的有效日期，返回最早的有效日期
    return closestDate || validDates[0] || null;
  };

  // 当日期选择器关闭时，如果输入值无效，恢复为选定的日期
  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen && selected) {
      setInputValue(format(selected, 'yyyy-MM-dd'));
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <div className="relative w-full">
        <Input
          value={inputValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          className={cn("pr-10", className)}
          disabled={loading}
        />
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            className="absolute right-0 top-0 h-full w-10 p-0"
            type="button"
            disabled={loading}
          >
            <CalendarIcon className="h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
      </div>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(date) => {
            if (date) {
              const dateStr = format(date, 'yyyy-MM-dd');
              // 检查是否为有效交易日
              if (isValidTradingDate(dateStr)) {
                onChange(date);
                setInputValue(dateStr);
                setOpen(false);
              } else if (enableTradingDatesOnly) {
                // 如果不是有效交易日，找到最近的有效日期
                const nearestValidDate = findNearestValidDate(dateStr);
                if (nearestValidDate) {
                  const nearestDate = new Date(nearestValidDate);
                  onChange(nearestDate);
                  setInputValue(nearestValidDate);
                  setOpen(false);
                }
              } else {
                onChange(date);
                setInputValue(dateStr);
                setOpen(false);
              }
            }
          }}
          disabled={enableTradingDatesOnly ? isDateDisabled : undefined}
          initialFocus
          locale={zhCN}
          // 月份名称本地化
          formatters={{
            formatCaption: (date: Date, options: any) =>
              format(date, 'yyyy年 MM月', { locale: zhCN }),
            formatDay: (date: any) =>
              format(date, 'EEE', { locale: zhCN }).charAt(0),
          }}
        />
      </PopoverContent>
    </Popover>
  );
} 