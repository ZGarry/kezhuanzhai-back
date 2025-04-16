import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface DistributionData {
  premium_distribution: Record<string, number>;  // 转股溢价率分布
  ytm_distribution: Record<string, number>;  // 收益率分布
  duration_distribution: Record<string, number>;  // 剩余期限分布
  industry_distribution: Record<string, number>;  // 行业分布
}

interface DistributionChartsProps {
  data: DistributionData | null;
  loading: boolean;
}

// 随机生成颜色函数
const generateColors = (count: number) => {
  const colors = [];
  const hoverColors = [];
  
  for (let i = 0; i < count; i++) {
    const r = Math.floor(Math.random() * 200);
    const g = Math.floor(Math.random() * 200);
    const b = Math.floor(Math.random() * 200);
    
    colors.push(`rgba(${r}, ${g}, ${b}, 0.6)`);
    hoverColors.push(`rgba(${r}, ${g}, ${b}, 0.9)`);
  }
  
  return { colors, hoverColors };
};

export default function DistributionCharts({ data, loading }: DistributionChartsProps) {
  // 转股溢价率分布图数据
  const premiumData = {
    labels: data ? Object.keys(data.premium_distribution) : [],
    datasets: [
      {
        label: '转债数量',
        data: data ? Object.values(data.premium_distribution) : [],
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  };

  // 收益率分布图数据
  const ytmData = {
    labels: data ? Object.keys(data.ytm_distribution) : [],
    datasets: [
      {
        label: '转债数量',
        data: data ? Object.values(data.ytm_distribution) : [],
        backgroundColor: 'rgba(153, 102, 255, 0.6)',
        borderColor: 'rgba(153, 102, 255, 1)',
        borderWidth: 1,
      },
    ],
  };

  // 剩余期限分布图数据
  const durationData = {
    labels: data ? Object.keys(data.duration_distribution) : [],
    datasets: [
      {
        label: '转债数量',
        data: data ? Object.values(data.duration_distribution) : [],
        backgroundColor: 'rgba(255, 159, 64, 0.6)',
        borderColor: 'rgba(255, 159, 64, 1)',
        borderWidth: 1,
      },
    ],
  };

  // 行业分布饼图数据
  const industryLabels = data ? Object.keys(data.industry_distribution) : [];
  const industryValues = data ? Object.values(data.industry_distribution) : [];
  const { colors, hoverColors } = generateColors(industryLabels.length);
  
  const industryData = {
    labels: industryLabels,
    datasets: [
      {
        label: '转债数量',
        data: industryValues,
        backgroundColor: colors,
        hoverBackgroundColor: hoverColors,
        borderWidth: 1,
      },
    ],
  };

  // 图表通用配置
  const barOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const pieOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right' as const,
      },
    },
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* 转股溢价率分布图 */}
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle>转股溢价率分布</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] w-full">
          {loading ? (
            <Skeleton className="h-full w-full" />
          ) : (
            <Bar 
              data={premiumData} 
              options={barOptions} 
            />
          )}
        </CardContent>
      </Card>

      {/* 收益率分布图 */}
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle>收益率分布</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] w-full">
          {loading ? (
            <Skeleton className="h-full w-full" />
          ) : (
            <Bar 
              data={ytmData} 
              options={barOptions} 
            />
          )}
        </CardContent>
      </Card>

      {/* 剩余期限分布图 */}
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle>剩余期限分布</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] w-full">
          {loading ? (
            <Skeleton className="h-full w-full" />
          ) : (
            <Bar 
              data={durationData} 
              options={barOptions} 
            />
          )}
        </CardContent>
      </Card>

      {/* 行业分布饼图 */}
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle>行业分布</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] w-full">
          {loading ? (
            <Skeleton className="h-full w-full" />
          ) : (
            <Pie 
              data={industryData} 
              options={pieOptions} 
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
} 