"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Holding {
  代码: string;
  名称?: string;
  持仓量: number;
  持仓成本: number;
  市值: number;
  盈亏: number;
  盈亏率: number;
  [key: string]: any; // 允许其他字段
}

interface HoldingsListProps {
  holdings: Holding[];
}

export function HoldingsList({ holdings }: HoldingsListProps) {
  if (!holdings || holdings.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        暂无持仓数据
      </div>
    );
  }

  return (
    <div className="w-full overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>代码</TableHead>
            <TableHead>名称</TableHead>
            <TableHead className="text-right">持仓量</TableHead>
            <TableHead className="text-right">持仓成本</TableHead>
            <TableHead className="text-right">市值</TableHead>
            <TableHead className="text-right">盈亏</TableHead>
            <TableHead className="text-right">盈亏率</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {holdings.map((holding, index) => (
            <TableRow key={index}>
              <TableCell className="font-mono">{holding.代码}</TableCell>
              <TableCell>{holding.名称 || '-'}</TableCell>
              <TableCell className="text-right">{holding.持仓量.toLocaleString()}</TableCell>
              <TableCell className="text-right">{holding.持仓成本.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
              <TableCell className="text-right">{holding.市值.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
              <TableCell className={`text-right ${holding.盈亏 >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {holding.盈亏.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </TableCell>
              <TableCell className={`text-right ${holding.盈亏率 >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {holding.盈亏率.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
} 