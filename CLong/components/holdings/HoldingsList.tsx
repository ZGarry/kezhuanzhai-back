'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

// 持仓数据接口，支持中英文字段名
interface Holding {
  symbol?: string;
  code?: string;
  name?: string;
  quantity?: number;
  shares?: number;
  cost_basis?: number;
  cost?: number;
  market_value?: number;
  value?: number;
  profit_loss?: number;
  profit?: number;
  profit_loss_percent?: number;
  profit_pct?: number;
  weight?: number;
}

interface HoldingsListProps {
  holdings: Holding[];
  title?: string;
  date?: string;
}

// 安全格式化函数
const safeFormat = (value: any, formatter: (val: number) => string, defaultValue: string = '-') => {
  if (value === undefined || value === null || isNaN(Number(value))) {
    return defaultValue;
  }
  return formatter(Number(value));
};

// 安全获取值函数
const safeGet = (obj: any, keys: string[], defaultValue: any = undefined) => {
  for (const key of keys) {
    if (obj[key] !== undefined && obj[key] !== null) {
      return obj[key];
    }
  }
  return defaultValue;
};

export default function HoldingsList({ holdings = [], title = '投资组合持仓', date }: HoldingsListProps) {
  if (!holdings || holdings.length === 0) {
    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {date && <p className="text-sm text-muted-foreground">日期: {date}</p>}
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            无持仓数据
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {date && <p className="text-sm text-muted-foreground">日期: {date}</p>}
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>代码</TableHead>
              <TableHead>名称</TableHead>
              <TableHead className="text-right">持仓数量</TableHead>
              <TableHead className="text-right">持仓成本</TableHead>
              <TableHead className="text-right">市场价值</TableHead>
              <TableHead className="text-right">盈亏</TableHead>
              <TableHead className="text-right">盈亏(%)</TableHead>
              <TableHead className="text-right">权重</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {holdings.map((holding, index) => {
              const symbol = safeGet(holding, ['symbol', 'code'], '-');
              const name = safeGet(holding, ['name'], symbol);
              const quantity = safeGet(holding, ['quantity', 'shares'], 0);
              const costBasis = safeGet(holding, ['cost_basis', 'cost'], 0);
              const marketValue = safeGet(holding, ['market_value', 'value'], 0);
              const profitLoss = safeGet(holding, ['profit_loss', 'profit'], marketValue - costBasis);
              const profitLossPct = safeGet(holding, ['profit_loss_percent', 'profit_pct'], (profitLoss / costBasis) * 100);
              const weight = safeGet(holding, ['weight'], 0) * 100;
              
              // 颜色类
              const profitColor = profitLoss >= 0 ? 'text-green-600' : 'text-red-600';

              return (
                <TableRow key={index}>
                  <TableCell className="font-mono">{symbol}</TableCell>
                  <TableCell>{name}</TableCell>
                  <TableCell className="text-right">{safeFormat(quantity, val => val.toLocaleString(), '0')}</TableCell>
                  <TableCell className="text-right">{safeFormat(costBasis, val => val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }))}</TableCell>
                  <TableCell className="text-right">{safeFormat(marketValue, val => val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }))}</TableCell>
                  <TableCell className={`text-right ${profitColor}`}>
                    {safeFormat(profitLoss, val => val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }))}
                  </TableCell>
                  <TableCell className={`text-right ${profitColor}`}>
                    {safeFormat(profitLossPct, val => val.toFixed(2) + '%')}
                  </TableCell>
                  <TableCell className="text-right">
                    {safeFormat(weight, val => val.toFixed(2) + '%')}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
} 