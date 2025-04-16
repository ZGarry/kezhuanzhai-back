"use client";

import { Card, CardContent } from "@/components/ui/card";
import { BacktestResult } from "@/types/app-backtest";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';

interface AnalysisReportProps {
  result: BacktestResult | null;
}

export default function AnalysisReport({ result }: AnalysisReportProps) {
  if (!result) {
    return (
      <Card>
        <CardContent className="pt-6 flex items-center justify-center min-h-[300px]">
          <p className="text-muted-foreground">尚未运行回测，请完成设置并运行回测查看结果</p>
        </CardContent>
      </Card>
    );
  }

  // 模拟月度收益数据
  const monthlyReturns = [
    { month: '1月', return: 2.5 },
    { month: '2月', return: -1.2 },
    { month: '3月', return: 3.8 },
    { month: '4月', return: 1.5 },
    { month: '5月', return: -0.8 },
    { month: '6月', return: 2.3 },
    { month: '7月', return: 4.1 },
    { month: '8月', return: -1.5 },
    { month: '9月', return: 0.5 },
    { month: '10月', return: 3.2 },
    { month: '11月', return: 1.9 },
    { month: '12月', return: 2.8 },
  ];

  // 模拟持仓分布数据
  const holdingDistribution = [
    { name: '低价债', value: 35 },
    { name: '平价债', value: 40 },
    { name: '高价债', value: 25 },
  ];

  // 饼图颜色
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-medium mb-4">月度收益分析</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={monthlyReturns}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `${value}%`} />
                <Tooltip formatter={(value: number) => [`${value}%`, '收益率']} />
                <Legend />
                <Bar 
                  dataKey="return" 
                  name="月度收益率" 
                  fill="#8884d8" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-medium mb-4">持仓分布</h3>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={holdingDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {holdingDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [`${value}%`, '占比']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-medium mb-4">风险分析</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium">波动率</p>
                <p className="text-2xl">{result.volatility || 8.76}%</p>
              </div>
              <div>
                <p className="text-sm font-medium">β系数</p>
                <p className="text-2xl">{result.beta || 0.78}</p>
              </div>
              <div>
                <p className="text-sm font-medium">α系数</p>
                <p className="text-2xl">{result.alpha || 3.24}%</p>
              </div>
              <div>
                <p className="text-sm font-medium">情景压力测试</p>
                <p className="text-sm text-muted-foreground">熊市环境: -5.2%</p>
                <p className="text-sm text-muted-foreground">震荡市环境: +2.8%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 