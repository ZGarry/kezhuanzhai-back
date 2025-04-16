import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
  vol?: number;            // 原volume字段
  amount?: number;         // 成交额
}

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

interface RankingTablesProps {
  data: RankingData | null;
  loading: boolean;
}

export default function RankingTables({ data, loading }: RankingTablesProps) {
  // 渲染带有百分比的数据单元格
  const renderPercentCell = (value: number | null) => {
    if (value === null) return '-';
    
    const colorClass = value >= 0 ? 'text-green-600' : 'text-red-600';
    return (
      <span className={colorClass}>
        {value.toFixed(2)}%
      </span>
    );
  };
  
  // 渲染排行表格
  const renderRankingTable = (
    title: string, 
    bonds: ConvertibleBond[] | undefined, 
    keyField: keyof ConvertibleBond,
    formatValue?: (value: any) => string
  ) => {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-[400px] w-full" />
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[20%]">代码</TableHead>
                    <TableHead className="w-[30%]">名称</TableHead>
                    <TableHead className="w-[15%]">价格</TableHead>
                    <TableHead className="w-[15%]">涨跌幅</TableHead>
                    <TableHead className="w-[20%]">{title.replace(/.*的|最.*/, '')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bonds && bonds.length > 0 ? (
                    bonds.map(bond => (
                      <TableRow key={bond.code}>
                        <TableCell className="font-medium">{bond.code}</TableCell>
                        <TableCell>{bond.name}</TableCell>
                        <TableCell>{bond.close.toFixed(2)}</TableCell>
                        <TableCell>{renderPercentCell(bond.pct_chg)}</TableCell>
                        <TableCell>
                          {formatValue ? formatValue(bond[keyField]) : 
                            bond[keyField] !== null ? 
                              (typeof bond[keyField] === 'number' ? 
                                (bond[keyField] as number).toFixed(2) : 
                                String(bond[keyField])
                              ) : 
                              '-'
                          }
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        暂无数据
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <Tabs defaultValue="double_low" className="space-y-6">
      <TabsList className="grid grid-cols-4 w-full md:w-[600px]">
        <TabsTrigger value="double_low">双低排行</TabsTrigger>
        <TabsTrigger value="ytm">收益率</TabsTrigger>
        <TabsTrigger value="premium">溢价率</TabsTrigger>
        <TabsTrigger value="other">其他排行</TabsTrigger>
      </TabsList>
      
      <TabsContent value="double_low" className="space-y-6">
        {renderRankingTable('双低指标排行', data?.double_low_top, 'dblow')}
      </TabsContent>
      
      <TabsContent value="ytm" className="space-y-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        {renderRankingTable('收益率最高的可转债', data?.high_ytm, 'ytm', value => `${value ? value.toFixed(2) : '-'}%`)}
        {renderRankingTable('收益率最低的可转债', data?.low_ytm, 'ytm', value => `${value ? value.toFixed(2) : '-'}%`)}
      </TabsContent>
      
      <TabsContent value="premium" className="space-y-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        {renderRankingTable('溢价率最高的可转债', data?.high_premium, 'conv_prem', value => `${value.toFixed(2)}%`)}
        {renderRankingTable('溢价率最低的可转债', data?.low_premium, 'conv_prem', value => `${value.toFixed(2)}%`)}
      </TabsContent>
      
      <TabsContent value="other" className="space-y-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        {renderRankingTable('涨幅最大的可转债', data?.top_gainers, 'pct_chg', value => `${value.toFixed(2)}%`)}
        {renderRankingTable('涨幅最小的可转债', data?.top_losers, 'pct_chg', value => `${value.toFixed(2)}%`)}
        {renderRankingTable('成交额最高的可转债', data?.most_active, 'amount', value => `${(value / 10000).toFixed(2)}万`)}
      </TabsContent>
    </Tabs>
  );
} 