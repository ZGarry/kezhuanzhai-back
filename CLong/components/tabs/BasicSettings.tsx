"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DatePicker from "@/components/common/DatePicker";
import { BacktestSettings } from "@/app/types/backtest";
import { Loader2 } from "lucide-react";

interface BasicSettingsProps {
  settings: BacktestSettings;
  setSettings: (settings: BacktestSettings) => void;
  onRunBacktest: () => void;
  isLoading: boolean;
}

export default function BasicSettings({ 
  settings, 
  setSettings,
  onRunBacktest,
  isLoading
}: BasicSettingsProps) {
  const updateSettings = (key: keyof BacktestSettings, value: any) => {
    setSettings({ ...settings, [key]: value });
  };

  return (
    <Card>
      <CardContent className="space-y-6 pt-6">
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">持有周期</label>
            <Select
              value={settings.holdingPeriod.toString()}
              onValueChange={(value) => updateSettings('holdingPeriod', parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="选择持有周期" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1天</SelectItem>
                <SelectItem value="3">3天</SelectItem>
                <SelectItem value="5">5天</SelectItem>
                <SelectItem value="10">10天</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">持有数量</label>
            <Input 
              type="number"
              value={settings.holdingQuantity}
              onChange={(e) => updateSettings('holdingQuantity', parseInt(e.target.value))}
              min={1}
              max={100}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <DatePicker
            label="回测开始日期"
            date={settings.startDate}
            setDate={(date) => updateSettings('startDate', date)}
          />
          <DatePicker
            label="回测结束日期"
            date={settings.endDate}
            setDate={(date) => updateSettings('endDate', date)}
          />
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">换仓时间</label>
            <Select
              value={settings.tradingTime}
              onValueChange={(value: 'open' | 'close') => updateSettings('tradingTime', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="选择换仓时间" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">开盘换仓</SelectItem>
                <SelectItem value="close">收盘换仓</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">基准指标</label>
            <Select
              value={settings.benchmark}
              onValueChange={(value) => updateSettings('benchmark', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="选择基准指标" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sh000001">上证指数</SelectItem>
                <SelectItem value="sz399001">深证成指</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button 
          className="w-full" 
          onClick={onRunBacktest}
          disabled={isLoading}
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isLoading ? '回测执行中...' : '开始回测'}
        </Button>
      </CardContent>
    </Card>
  );
} 