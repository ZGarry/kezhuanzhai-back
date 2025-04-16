"use client";

import { Dispatch, SetStateAction } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface FactorSettings {
  excludeMode: 'all' | 'any';
  excludeNewDays: number;
  excludeMarket: 'sh' | 'sz' | null;
  customFactors: string[];
}

interface FactorSettingsProps {
  settings: FactorSettings;
  setSettings: Dispatch<SetStateAction<FactorSettings>>;
}

export default function FactorSettings({ settings, setSettings }: FactorSettingsProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">排除模式</label>
              <Select value={settings.excludeMode} onValueChange={(value: 'all' | 'any') => setSettings(prev => ({ ...prev, excludeMode: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="选择排除模式" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部排除</SelectItem>
                  <SelectItem value="any">任一排除</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">排除新债</label>
              <Input 
                type="number" 
                placeholder="输入天数" 
                value={settings.excludeNewDays}
                onChange={(e) => setSettings(prev => ({ ...prev, excludeNewDays: parseInt(e.target.value) || 0 }))}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">排除市场</label>
              <Select 
                value={settings.excludeMarket || ''} 
                onValueChange={(value: 'sh' | 'sz') => setSettings(prev => ({ ...prev, excludeMarket: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="选择市场" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sh">上海</SelectItem>
                  <SelectItem value="sz">深圳</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">自定义因子</label>
            <div className="flex gap-4">
              <Input placeholder="输入因子表达式" className="flex-1" />
              <Button onClick={() => setSettings(prev => ({ ...prev, customFactors: [...prev.customFactors] }))}>
                添加因子
              </Button>
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <h3 className="font-medium mb-4">已添加因子</h3>
            <div className="space-y-2">
              {settings.customFactors.map((factor, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span>{factor}</span>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => setSettings(prev => ({
                      ...prev,
                      customFactors: prev.customFactors.filter((_, i) => i !== index)
                    }))}
                  >
                    删除
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 