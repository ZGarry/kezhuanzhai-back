"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import MarketOverview from "./components/MarketOverview";
import DistributionCharts from "./components/DistributionCharts";
import RankingTables from "./components/RankingTables";

// 市场总览数据接口
interface MarketOverviewData {
  total_bonds: number;  // 可转债总数量
  total_market_value: number;  // 可转债总市值(亿元)
  total_trading_amount: number;  // 当日成交总额(亿元)
  avg_premium_rate: number;  // 平均转股溢价率
  avg_bond_premium_rate: number;  // 平均纯债溢价率
  avg_ytm: number;  // 平均收益率
  latest_date: string;  // 数据日期
}

// 分布统计数据接口
interface DistributionData {
  premium_distribution: Record<string, number>;  // 转股溢价率分布
  ytm_distribution: Record<string, number>;  // 收益率分布
  duration_distribution: Record<string, number>;  // 剩余期限分布
  industry_distribution: Record<string, number>;  // 行业分布
}

// 可转债数据接口
interface ConvertibleBond {
  [key: string]: any;  // 允许任意字段，适应后端返回的完整数据结构
  code: string;
  name: string;
  close: number;
  pct_chg: number;
  // 保留必要字段的类型定义，其他字段通过索引访问
  conv_price?: number;
  conv_value?: number;
  conv_prem?: number;
  ytm?: number | null;
  rating?: string | null;
  dblow?: number | null;
  code_stk?: string;       // 修改为与后端一致的字段名
  name_stk?: string | null; // 修改为与后端一致的字段名
  close_stk?: number;      // 修改为与后端一致的字段名
  pct_chg_stk?: number;    // 修改为与后端一致的字段名
  industry_1?: string | null; // 修改为与后端一致的字段名
  area?: string | null;
}

// 排行榜数据接口
interface RankingData {
  double_low_top: ConvertibleBond[];  // 双低指标排行
  high_ytm: ConvertibleBond[];  // 收益率最高的
  low_ytm: ConvertibleBond[];  // 收益率最低的
  high_premium: ConvertibleBond[];  // 转股溢价率最高的
  low_premium: ConvertibleBond[];  // 转股溢价率最低的
  top_gainers: ConvertibleBond[];  // 涨幅最大的
  top_losers: ConvertibleBond[];  // 涨幅最小的
  most_active: ConvertibleBond[];  // 成交额最高的
}

export default function DataCenter() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [overviewData, setOverviewData] = useState<MarketOverviewData | null>(null);
  const [distributionData, setDistributionData] = useState<DistributionData | null>(null);
  const [rankingData, setRankingData] = useState<RankingData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async (date?: string) => {
    setLoading(true);
    setError(null);
    setIsRefreshing(true);
    
    try {
      // 构建查询参数
      const params = new URLSearchParams();
      if (date) {
        params.append('date', date);
      }
      
      // 获取市场总览数据
      const overviewResponse = await fetch(`/api/market-overview?${params.toString()}`);
      if (!overviewResponse.ok) {
        throw new Error(`获取市场总览数据失败: ${overviewResponse.statusText}`);
      }
      const overviewData = await overviewResponse.json();
      setOverviewData(overviewData);
      
      // 获取分布统计数据
      const distributionResponse = await fetch(`/api/distribution-data?${params.toString()}`);
      if (!distributionResponse.ok) {
        throw new Error(`获取分布统计数据失败: ${distributionResponse.statusText}`);
      }
      const distributionData = await distributionResponse.json();
      setDistributionData(distributionData);
      
      // 获取排行榜数据
      const rankingResponse = await fetch(`/api/ranking-data?${params.toString()}`);
      if (!rankingResponse.ok) {
        throw new Error(`获取排行榜数据失败: ${rankingResponse.statusText}`);
      }
      const rankingData = await rankingResponse.json();
      setRankingData(rankingData);
      
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setLoading(false);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = () => {
    const dateStr = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : undefined;
    fetchData(dateStr);
  };

  const handleDateChange = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) {
      fetchData(format(date, 'yyyy-MM-dd'));
    } else {
      fetchData();
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">可转债数据中心</h1>
          <p className="text-muted-foreground">
            可转债市场数据总览及分析
            {overviewData && (
              <span className="ml-2 font-medium">
                {overviewData.latest_date}
              </span>
            )}
          </p>
        </div>
        <div className="flex mt-4 md:mt-0 space-x-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[240px] justify-start">
                {selectedDate ? (
                  format(selectedDate, "yyyy年MM月dd日")
                ) : (
                  "选择日期"
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateChange}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
            刷新
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>错误</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid grid-cols-3 w-full md:w-[400px]">
          <TabsTrigger value="overview">市场总览</TabsTrigger>
          <TabsTrigger value="distribution">分布统计</TabsTrigger>
          <TabsTrigger value="ranking">排行榜</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          <MarketOverview data={overviewData} loading={loading} />
        </TabsContent>
        
        <TabsContent value="distribution" className="space-y-6">
          <DistributionCharts data={distributionData} loading={loading} />
        </TabsContent>
        
        <TabsContent value="ranking" className="space-y-6">
          <RankingTables data={rankingData} loading={loading} />
        </TabsContent>
      </Tabs>
    </div>
  );
} 