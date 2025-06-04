"use client";

import { Card, CardContent } from "@/components/ui/card";
import { BacktestResult } from "@/types/app-backtest";
import PerformanceChart from "@/components/charts/PerformanceChart";
import PerformanceMetrics from "@/components/performance/PerformanceMetrics";
import TradeHistory from "@/components/trades/TradeHistory";
import HoldingsList from "@/components/holdings/HoldingsList";

interface BacktestResultsProps {
  result: BacktestResult | null;
}

export default function BacktestResults({ result }: BacktestResultsProps) {
  if (!result) {
    return (
      <Card>
        <CardContent className="pt-6 flex items-center justify-center min-h-[300px]">
          <p className="text-muted-foreground">尚未运行回测，请完成设置并运行回测查看结果</p>
        </CardContent>
      </Card>
    );
  }
  
  console.log("回测结果:", result);
  
  // 检查交易记录结构
  if (result.trades && result.trades.length > 0) {
    console.log(`交易记录总数: ${result.trades.length}`);
    console.log("第一条交易记录示例:", result.trades[0]);
    if (result.trades.length > 1) {
      console.log("第二条交易记录示例:", result.trades[1]); 
    }
  }
  
  // 获取原始响应数据（如果存在）
  const originalResponse = (result as any).originalResponse || {};
  
  // 执行时间
  const executionTime = originalResponse.execution_time;
  
  // 处理性能指标
  const metrics = {
    total_return: originalResponse.总收益率 || 0,  // 移除对result.totalReturn的引用
    annual_return: originalResponse.年化收益率 || result.annualReturn,
    sharpe_ratio: originalResponse.夏普比率 || result.sharpeRatio,
    max_drawdown: originalResponse.最大回撤 || result.maxDrawdown,
    win_rate: originalResponse.胜率 || result.winRate,
    execution_time: typeof executionTime === 'number' ? executionTime : 0
  };
  
  // 持仓数据处理
  const holdings = [];
  if (originalResponse.portfolio_state?.positions) {
    const positions = originalResponse.portfolio_state.positions;
    for (const code in positions) {
      const position = positions[code];
      holdings.push({
        symbol: code,
        name: position.name || code,
        quantity: position.quantity || 0,
        cost_basis: position.cost_basis || 0,
        market_value: position.market_value || 0,
        profit_loss: (position.market_value || 0) - (position.cost_basis || 0),
        profit_loss_percent: position.cost_basis ? ((position.market_value || 0) / position.cost_basis - 1) * 100 : 0
      });
    }
  }
  
  // 持仓日期
  const holdingsDate = originalResponse.portfolio_state?.timestamp 
    ? new Date(originalResponse.portfolio_state.timestamp).toLocaleDateString('zh-CN')
    : '';
  
  // 准备图表数据
  const chartData = {
    returns: result.returns || [],
    dates: result.dates || []
  };
  
  // 检查是否有足够的数据显示
  const hasChartData = chartData.returns.length > 0 && chartData.dates.length > 0;
  let hasTradeData = result.trades && result.trades.length > 0;

  // 处理交易记录，确保字段正确
  const processedTrades = result.trades ? result.trades.map(trade => {
    // 确保所有关键字段都有值
    return {
      // 源自英文字段名
      symbol: trade.symbol || trade.code || trade.转债代码 || "-",
      date: trade.date || trade.日期 || "-",
      type: trade.type || (trade.操作?.includes('买') ? 'buy' : 'sell'),
      price: Number(trade.price || trade.价格 || 0),
      quantity: Number(trade.quantity || trade.数量 || 0),
      profit: Number(trade.profit || trade.收益率 || 0),
      
      // 源自中文字段名
      转债代码: trade.转债代码 || trade.symbol || trade.code || "-",
      日期: trade.日期 || trade.date || "-",
      操作: trade.操作 || (trade.type === 'buy' ? '买入' : '卖出'),
      价格: Number(trade.价格 || trade.price || 0),
      数量: Number(trade.数量 || trade.quantity || 0),
      收益率: Number(trade.收益率 || trade.profit || 0),
      
      // 保留其他原始数据
      ...trade
    };
  }) : [];

  // 检查处理后的交易数据
  if (processedTrades.length > 0) {
    console.log("处理后第一条交易记录:", processedTrades[0]);
    hasTradeData = processedTrades.length > 0;
  }

  return (
    <div className="space-y-4">
      {/* 执行时间 */}
      {executionTime && (
        <div className="text-sm text-muted-foreground mb-2">
          执行耗时: {typeof executionTime === 'number' ? `${executionTime.toFixed(2)}秒` : "计算中"}
        </div>
      )}
      
      {/* 图表 */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-medium mb-4">收益走势</h3>
          <div className="h-[300px]">
            {hasChartData ? (
              <PerformanceChart 
                returns={chartData.returns}
                dates={chartData.dates}
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center">
                <p className="text-muted-foreground">暂无收益走势数据</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* 性能指标 */}
      <PerformanceMetrics metrics={metrics} />
      
      {/* 交易记录 */}
      {hasTradeData ? (
        <TradeHistory trades={processedTrades} />
      ) : (
        <Card className="p-4">
          <div className="text-center py-4 text-muted-foreground">
            无交易记录
          </div>
        </Card>
      )}
      
      {/* 持仓情况 */}
      {holdings.length > 0 && (
        <HoldingsList 
          holdings={holdings} 
          title="最终持仓" 
          date={holdingsDate}
        />
      )}
    </div>
  );
} 