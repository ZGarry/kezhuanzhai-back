import React, { useState } from 'react';
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

interface DatePickerProps {
  selected: Date | undefined;
  onChange: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
  defaultValue?: string; // 默认日期值 YYYY-MM-DD
}

export function DatePicker({
  selected,
  onChange,
  placeholder = '选择日期',
  className,
  defaultValue,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(
    selected ? format(selected, 'yyyy-MM-dd') : defaultValue || ''
  );

  // 处理手动输入
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    
    // 尝试解析日期，使用标准格式 YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      try {
        const parsedDate = parse(value, 'yyyy-MM-dd', new Date());
        if (!isNaN(parsedDate.getTime())) {
          onChange(parsedDate);
        }
      } catch (e) {
        // 解析失败，不更新日期
      }
    }
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
        />
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            className="absolute right-0 top-0 h-full w-10 p-0"
            type="button"
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
            onChange(date);
            if (date) {
              setInputValue(format(date, 'yyyy-MM-dd'));
            }
            setOpen(false);
          }}
          initialFocus
          locale={zhCN}
          // 月份名称本地化
          formatters={{
            formatCaption: (date, options) => 
              format(date, 'yyyy年 MM月', { locale: zhCN }),
            formatWeekday: (date) => 
              format(date, 'EEE', { locale: zhCN }).charAt(0),
          }}
        />
      </PopoverContent>
    </Popover>
  );
} 