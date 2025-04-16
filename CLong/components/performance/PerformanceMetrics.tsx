"use client";

import { Card } from "../ui/card";

interface PerformanceMetricsProps {
  metrics?: {
    total_return?: number;
    annual_return?: number;
    sharpe_ratio?: number;
    max_drawdown?: number;
    win_rate?: number;
    execution_time?: number;
  };
}

export default function PerformanceMetrics({ metrics = {} }: PerformanceMetricsProps) {
  const {
    total_return = 0,
    annual_return = 0,
    sharpe_ratio = 0,
    max_drawdown = 0,
    win_rate = 0,
    execution_time = 0
  } = metrics;
  
  // 辅助函数：安全格式化百分比
  const formatPercent = (value: number) => {
    // API返回的是小数形式（如0.65），需要乘以100转换为百分比显示
    return isNaN(value) ? "0.00%" : `${(value * 100).toFixed(2)}%`;
  };
  
  const formatNumber = (value: number, digits: number = 2) => {
    return isNaN(value) ? "0.00" : value.toFixed(digits);
  };
  
  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold mb-4">策略性能指标</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
        <div className="bg-card border rounded-lg p-4 shadow-sm">
          <p className="text-sm text-muted-foreground mb-1">总收益率</p>
          <p className={`text-2xl font-bold ${total_return >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {formatPercent(total_return)}
          </p>
        </div>
        
        <div className="bg-card border rounded-lg p-4 shadow-sm">
          <p className="text-sm text-muted-foreground mb-1">年化收益率</p>
          <p className={`text-2xl font-bold ${annual_return >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {formatPercent(annual_return)}
          </p>
        </div>
        
        <div className="bg-card border rounded-lg p-4 shadow-sm">
          <p className="text-sm text-muted-foreground mb-1">夏普比率</p>
          <p className={`text-2xl font-bold ${sharpe_ratio >= 1 ? 'text-green-500' : sharpe_ratio >= 0 ? 'text-yellow-500' : 'text-red-500'}`}>
            {formatNumber(sharpe_ratio)}
          </p>
        </div>
        
        <div className="bg-card border rounded-lg p-4 shadow-sm">
          <p className="text-sm text-muted-foreground mb-1">最大回撤</p>
          <p className="text-2xl font-bold text-red-500">
            {formatPercent(max_drawdown)}
          </p>
        </div>
        
        <div className="bg-card border rounded-lg p-4 shadow-sm">
          <p className="text-sm text-muted-foreground mb-1">胜率</p>
          <p className={`text-2xl font-bold ${win_rate >= 0.5 ? 'text-green-500' : 'text-yellow-500'}`}>
            {formatPercent(win_rate)}
          </p>
        </div>
        
        <div className="bg-card border rounded-lg p-4 shadow-sm">
          <p className="text-sm text-muted-foreground mb-1">计算耗时</p>
          <p className="text-2xl font-bold">
            {formatNumber(execution_time, 2)}秒
          </p>
        </div>
      </div>
    </Card>
  );
}