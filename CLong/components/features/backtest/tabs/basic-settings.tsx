"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectGroup, 
  SelectItem, 
  SelectLabel, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/datepicker";
import { BacktestSettings } from "@/types/app-backtest";
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
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>开始日期</Label>
              <DatePicker
                selected={settings.startDate}
                onChange={(date) => updateSettings('startDate', date)}
                placeholder="选择开始日期"
                className="w-full"
                enableTradingDatesOnly={true}
                autoSetFirstValidDate={true}
              />
            </div>
            
            <div className="space-y-2">
              <Label>结束日期</Label>
              <DatePicker
                selected={settings.endDate}
                onChange={(date) => updateSettings('endDate', date)}
                placeholder="选择结束日期"
                className="w-full"
                enableTradingDatesOnly={true}
                autoSetLastValidDate={true}
              />
            </div>
            
            <div className="space-y-2">
              <Label>交易时点</Label>
              <Select
                value={settings.tradingTime}
                onValueChange={(value) => updateSettings('tradingTime', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择交易时点" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">开盘</SelectItem>
                  <SelectItem value="close">收盘</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>持有期限(天)</Label>
              <Input
                type="number"
                value={settings.holdingPeriod}
                onChange={(e) => updateSettings('holdingPeriod', parseInt(e.target.value))}
              />
            </div>
            
            <div className="space-y-2">
              <Label>持有数量</Label>
              <Input
                type="number"
                value={settings.holdingQuantity}
                onChange={(e) => updateSettings('holdingQuantity', parseInt(e.target.value))}
              />
            </div>
            
            <div className="space-y-2">
              <Label>对比基准</Label>
              <Select
                value={settings.benchmark}
                onValueChange={(value) => updateSettings('benchmark', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择对比基准" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sh000001">上证指数</SelectItem>
                  <SelectItem value="sh000300">沪深300</SelectItem>
                  <SelectItem value="sh000905">中证500</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        <div className="mt-6 flex justify-end">
          <Button onClick={onRunBacktest} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                运行中...
              </>
            ) : (
              '运行回测'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 