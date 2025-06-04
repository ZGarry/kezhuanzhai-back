"use client";

import { Card, CardContent } from "@/components/ui/card";
import { BacktestResult } from "@/types/app-backtest";
import TradeHistory from "@/components/trades/TradeHistory";

interface AnalysisReportProps {
  result: BacktestResult | null;
}

export default function AnalysisReport({ result }: AnalysisReportProps) {
  if (!result) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="h-[400px] flex items-center justify-center text-muted-foreground">
            暂无分析报告
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-medium">持仓分析</h3>
              <div className="h-[300px] bg-muted rounded-lg flex items-center justify-center text-muted-foreground">
                持仓分析图表
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="font-medium">行业分布</h3>
              <div className="h-[300px] bg-muted rounded-lg flex items-center justify-center text-muted-foreground">
                行业分布图表
              </div>
            </div>
          </div>
          
          {/* 使用TradeHistory组件显示交易记录 */}
          {result.trades && result.trades.length > 0 && (
            <TradeHistory trades={result.trades} />
          )}
        </div>
      </CardContent>
    </Card>
  );
} 