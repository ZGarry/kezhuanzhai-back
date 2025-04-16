"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BasicSettings from "@/components/tabs/BasicSettings";
import FactorSettings from "@/components/tabs/FactorSettings";
import BacktestResults from "@/components/tabs/BacktestResults";
import AnalysisReport from "@/components/tabs/AnalysisReport";
import { useBacktest } from "@/hooks/useBacktest";

export default function BacktestTabs() {
  const {
    backtestSettings,
    setBacktestSettings,
    factorSettings,
    setFactorSettings,
    isLoading,
    result,
    runBacktest
  } = useBacktest();

  return (
    <Tabs defaultValue="basic" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="basic">基础设置</TabsTrigger>
        <TabsTrigger value="factors">因子设置</TabsTrigger>
        <TabsTrigger value="results">回测结果</TabsTrigger>
        <TabsTrigger value="analysis">分析报告</TabsTrigger>
      </TabsList>

      <TabsContent value="basic">
        <BasicSettings 
          settings={backtestSettings}
          setSettings={setBacktestSettings}
          onRunBacktest={runBacktest}
          isLoading={isLoading}
        />
      </TabsContent>

      <TabsContent value="factors">
        <FactorSettings 
          settings={factorSettings}
          setSettings={setFactorSettings}
        />
      </TabsContent>

      <TabsContent value="results">
        <BacktestResults result={result} />
      </TabsContent>

      <TabsContent value="analysis">
        <AnalysisReport result={result} />
      </TabsContent>
    </Tabs>
  );
} 