"use client";

import { useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';

// 动态导入Plotly组件，禁用SSR
const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

interface PerformanceChartProps {
  returns: number[];
  dates: string[];
}

export default function PerformanceChart({ returns, dates }: PerformanceChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // 确保数据有效
  const validReturns = Array.isArray(returns) ? returns.filter(r => !isNaN(Number(r))) : [];
  const validDates = Array.isArray(dates) ? dates.slice(0, validReturns.length) : [];

  // 如果数据不匹配，生成序列号作为日期
  const chartDates = validDates.length === validReturns.length 
    ? validDates 
    : Array.from({ length: validReturns.length }, (_, i) => `${i + 1}`);

  // 格式化收益率为百分比显示
  const formattedReturns = validReturns.map(value => Number(value) * 100);

  // 计算最大和最小值，用于添加辅助线
  const maxReturn = formattedReturns.length > 0 
    ? Math.max(...formattedReturns, 0) 
    : 0;
  const minReturn = formattedReturns.length > 0 
    ? Math.min(...formattedReturns, 0) 
    : 0;

  // 如果没有有效数据，显示空图表
  if (formattedReturns.length === 0) {
    return (
      <div ref={containerRef} className="w-full h-[400px] rounded-lg overflow-hidden border border-border flex items-center justify-center text-muted-foreground">
        无有效图表数据
      </div>
    );
  }

  // 创建基准线（0%收益率）
  const zeroLine = {
    x: [chartDates[0], chartDates[chartDates.length - 1]],
    y: [0, 0],
    type: 'scatter',
    mode: 'lines',
    name: '基准线',
    line: {
      color: 'rgba(200, 200, 200, 0.5)',
      width: 1,
      dash: 'dash',
    },
    showlegend: false,
  };

  // 创建绘图数据
  const plotData = [
    {
      x: chartDates,
      y: formattedReturns,
      type: 'scatter',
      mode: 'lines',
      name: '累计收益率',
      line: {
        color: formattedReturns[formattedReturns.length - 1] >= 0 ? 'rgb(52, 168, 83)' : 'rgb(234, 67, 53)',
        width: 2,
      },
      fill: 'tozeroy',
      fillcolor: formattedReturns[formattedReturns.length - 1] >= 0 ? 'rgba(52, 168, 83, 0.1)' : 'rgba(234, 67, 53, 0.1)',
    },
    zeroLine
  ];

  // 图表布局配置
  const layout = {
    title: '策略回测累计收益率',
    autosize: true,
    margin: { l: 50, r: 20, t: 40, b: 40 },
    xaxis: {
      title: '日期',
      showgrid: true,
      gridcolor: 'rgba(200, 200, 200, 0.2)',
      zeroline: false,
    },
    yaxis: {
      title: '收益率(%)',
      showgrid: true,
      gridcolor: 'rgba(200, 200, 200, 0.2)',
      zeroline: false,
      tickformat: '.2f',
      hoverformat: '.2f%',
      ticksuffix: '%',
      range: [minReturn * 1.1, maxReturn * 1.1], // 自动调整Y轴范围，留出10%的空间
    },
    showlegend: true,
    legend: {
      x: 0,
      y: 1,
    },
    hovermode: 'closest',
    plot_bgcolor: 'rgba(0,0,0,0)',
    paper_bgcolor: 'rgba(0,0,0,0)',
    font: {
      family: 'Arial, sans-serif',
    },
    shapes: [
      // 标记0线
      {
        type: 'line',
        x0: chartDates[0],
        y0: 0,
        x1: chartDates[chartDates.length - 1],
        y1: 0,
        line: {
          color: 'rgba(200, 200, 200, 0.5)',
          width: 1,
          dash: 'dash',
        }
      }
    ],
    annotations: formattedReturns.length > 0 ? [
      // 添加最终收益率标注
      {
        x: chartDates[chartDates.length - 1],
        y: formattedReturns[formattedReturns.length - 1],
        xref: 'x',
        yref: 'y',
        text: `${formattedReturns[formattedReturns.length - 1].toFixed(2)}%`,
        showarrow: true,
        arrowhead: 0,
        ax: 40,
        ay: 0,
        font: {
          color: formattedReturns[formattedReturns.length - 1] >= 0 ? 'rgb(52, 168, 83)' : 'rgb(234, 67, 53)',
          size: 12,
        },
      }
    ] : [],
  };

  // 图表配置
  const config = {
    responsive: true,
    displayModeBar: true,
    modeBarButtonsToRemove: ['lasso2d', 'select2d'],
    displaylogo: false,
  };

  // 响应容器大小变化
  useEffect(() => {
    const handleResize = () => {
      if (window.Plotly && containerRef.current) {
        window.Plotly.Plots.resize(containerRef.current);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  console.log("Chart data:", { dates: chartDates, returns: formattedReturns });

  return (
    <div ref={containerRef} className="w-full h-[400px] rounded-lg overflow-hidden border border-border">
      <Plot
        data={plotData}
        layout={layout}
        config={config}
        useResizeHandler={true}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}