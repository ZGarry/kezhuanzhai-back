import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  TrendingUp, 
  TrendingDown, 
  Percent, 
  PieChart, 
  BarChart3,
  Activity
} from "lucide-react";

interface MarketOverviewData {
  total_bonds: number;  // 可转债总数量
  total_market_value: number;  // 可转债总市值(亿元)
  total_trading_amount: number;  // 当日成交总额(亿元)
  avg_premium_rate: number;  // 平均转股溢价率
  avg_bond_premium_rate: number;  // 平均纯债溢价率
  avg_ytm: number;  // 平均收益率
  latest_date: string;  // 数据日期
}

interface MarketOverviewProps {
  data: MarketOverviewData | null;
  loading: boolean;
}

export default function MarketOverview({ data, loading }: MarketOverviewProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* 可转债总数量 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">可转债总数量</CardTitle>
          <PieChart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-10 w-[100px]" />
          ) : (
            <div className="text-2xl font-bold">{data?.total_bonds || 0} 只</div>
          )}
        </CardContent>
      </Card>

      {/* 可转债总市值 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">可转债总市值</CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-10 w-[100px]" />
          ) : (
            <div className="text-2xl font-bold">{data?.total_market_value.toFixed(2) || 0} 亿元</div>
          )}
        </CardContent>
      </Card>

      {/* 当日成交总额 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">当日成交总额</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-10 w-[100px]" />
          ) : (
            <div className="text-2xl font-bold">{data?.total_trading_amount.toFixed(2) || 0} 亿元</div>
          )}
        </CardContent>
      </Card>

      {/* 平均转股溢价率 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">平均转股溢价率</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-10 w-[100px]" />
          ) : (
            <div className="text-2xl font-bold">
              {data?.avg_premium_rate.toFixed(2) || 0}%
            </div>
          )}
        </CardContent>
      </Card>

      {/* 平均纯债溢价率 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">平均纯债溢价率</CardTitle>
          <TrendingDown className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-10 w-[100px]" />
          ) : (
            <div className="text-2xl font-bold">
              {data?.avg_bond_premium_rate.toFixed(2) || 0}%
            </div>
          )}
        </CardContent>
      </Card>

      {/* 平均收益率 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">平均收益率</CardTitle>
          <Percent className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-10 w-[100px]" />
          ) : (
            <div className="text-2xl font-bold">
              {data?.avg_ytm.toFixed(2) || 0}%
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 