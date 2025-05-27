"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import BacktestResults from "@/components/features/backtest/tabs/backtest-results";
import AnalysisReport from "@/components/features/backtest/tabs/analysis-report";
import CombinedSettings from "@/components/features/backtest/tabs/combined-settings";
import { useBacktest } from "@/hooks/use-backtest-legacy";
import { toast } from "@/components/ui/use-toast";

export default function BacktestTabs() {
  const {
    backtestSettings,
    setBacktestSettings,
    factorSettings,
    setFactorSettings,
    isLoading,
    result,
    error,
    runBacktest,
    runCustomStrategyBacktest
  } = useBacktest();
  
  const [activeTab, setActiveTab] = useState("settings");
  
  // 从自定义策略配置中提取JSON并执行回测
  const handleRunCustomBacktest = async () => {
    try {
      // 检查是否选择了因子
      if (!factorSettings.selectedFactors || factorSettings.selectedFactors.length === 0) {
        toast.create({
          title: "策略设置错误",
          description: "请至少选择一个因子",
          variant: "error",
          duration: 3000,
        });
        return;
      }
      
      // 检查日期范围
      const today = new Date();
      const defaultStartDate = new Date('2018-01-02');
      
      // 设置开始和结束日期 - 确保在合理范围内
      let startDate = backtestSettings.startDate
        ? backtestSettings.startDate instanceof Date
          ? backtestSettings.startDate
          : new Date(backtestSettings.startDate)
        : defaultStartDate;
        
      let endDate = backtestSettings.endDate
        ? backtestSettings.endDate instanceof Date
          ? backtestSettings.endDate
          : new Date(backtestSettings.endDate)
        : today; // 如果没有设置结束日期，使用今天作为fallback
      
      // 验证日期
      if (endDate > today) {
        toast.create({
          title: "日期范围警告",
          description: "结束日期不能是未来日期，已自动调整为今天",
          variant: "warning",
          duration: 5000,
        });
        endDate = today;
      }
      
      if (startDate > endDate) {
        toast.create({
          title: "日期范围错误",
          description: "开始日期不能晚于结束日期",
          variant: "error",
          duration: 3000,
        });
        return;
      }
      
      // 格式化日期为字符串
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];
      
      // 提取指标和权重
      const indicators = factorSettings.selectedFactors.map(factor => factor.id);
      const weights = factorSettings.selectedFactors.map(factor => factor.weight);
      
      // 构建过滤条件 - 按照后端要求的格式
      const filtersObj: Record<string, [string, number]> = {};
      (factorSettings.filters || []).forEach(filter => {
        filtersObj[filter.field] = [filter.operator, parseFloat(filter.value.toString())];
      });
      
      // 构建完整的策略配置 - 严格按照后端要求的格式
      const strategyConfig = {
        strategy_type: "custom", // 作为查询参数使用
        data_path: "data/cb_data.pq",
        start_date: startDateStr,
        end_date: endDateStr,
        initial_capital: 1000000.0,
        top_n: backtestSettings.holdingQuantity || 10,
        name: "自定义策略",
        output_dir: "results/custom",
        strategy_params: {
          indicators: indicators,
          weights: weights,
          filters: Object.keys(filtersObj).length > 0 ? filtersObj : undefined
        }
      };
      
      // 打印请求参数以便调试
      console.log('发送的策略配置:', JSON.stringify(strategyConfig, null, 2));
      
      // 执行回测
      await runCustomStrategyBacktest(strategyConfig);
      
      // 切换到结果标签页
      setActiveTab("results");
      
      toast.create({
        title: "回测完成",
        description: "策略回测已成功完成",
        variant: "success",
        duration: 3000,
      });
    } catch (err) {
      toast.create({
        title: "回测失败",
        description: error || "执行回测时发生错误",
        variant: "error",
        duration: 3000,
      });
    }
  };

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="settings">策略设置</TabsTrigger>
          <TabsTrigger value="results">回测结果</TabsTrigger>
          <TabsTrigger value="analysis">分析报告</TabsTrigger>
        </TabsList>

        <TabsContent value="settings">
          <CombinedSettings
            backtestSettings={backtestSettings}
            setBacktestSettings={setBacktestSettings}
            factorSettings={factorSettings}
            setFactorSettings={setFactorSettings}
            onRunBacktest={handleRunCustomBacktest}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="results">
          <BacktestResults result={result} />
        </TabsContent>

        <TabsContent value="analysis">
          <AnalysisReport result={result} />
        </TabsContent>
      </Tabs>
      
      {error && (
        <div className="p-4 border border-red-300 bg-red-50 rounded-md">
          <p className="text-red-700">{error}</p>
        </div>
      )}
    </div>
  );
} 