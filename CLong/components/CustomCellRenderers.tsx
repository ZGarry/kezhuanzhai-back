import React from 'react';

// 价格类型单元格渲染器（显示带颜色的涨跌幅）
export const PriceChangeRenderer = (props: any) => {
  const value = props.value;
  if (value === null || value === undefined) return <span>-</span>;
  
  const formattedValue = (value * 100).toFixed(2) + '%';
  let className = '';
  
  if (value > 0) {
    className = 'text-[#f5222d] font-medium';
  } else if (value < 0) {
    className = 'text-[#52c41a] font-medium';
  }
  
  return (
    <div className={`text-right ${className}`}>
      {formattedValue}
    </div>
  );
};

// 评级单元格渲染器（根据评级显示不同颜色和样式）
export const RatingRenderer = (props: any) => {
  const value = props.value;
  if (!value) return <span>-</span>;
  
  let bgColor = 'bg-gray-100';
  let textColor = 'text-gray-600';
  
  if (value.includes('AAA')) {
    bgColor = 'bg-blue-100';
    textColor = 'text-blue-800';
  } else if (value.includes('AA')) {
    bgColor = 'bg-indigo-100';
    textColor = 'text-indigo-800';
  } else if (value.includes('A')) {
    bgColor = 'bg-cyan-100';
    textColor = 'text-cyan-800';
  } else if (value.includes('BBB')) {
    bgColor = 'bg-green-100';
    textColor = 'text-green-800';
  } else if (value.includes('BB')) {
    bgColor = 'bg-yellow-100';
    textColor = 'text-yellow-800';
  } else if (value.includes('B')) {
    bgColor = 'bg-orange-100';
    textColor = 'text-orange-800';
  } else if (value.includes('C')) {
    bgColor = 'bg-red-100';
    textColor = 'text-red-800';
  }
  
  return (
    <div className="flex justify-center">
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${bgColor} ${textColor}`}>
        {value}
      </span>
    </div>
  );
};

// 数值单元格渲染器（右对齐且格式化）
export const NumberRenderer = (props: any) => {
  const value = props.value;
  if (value === null || value === undefined) return <span className="text-right">-</span>;
  
  const formattedValue = value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  
  return (
    <div className="text-right">
      {formattedValue}
    </div>
  );
};

// 百分比单元格渲染器
export const PercentRenderer = (props: any) => {
  const value = props.value;
  if (value === null || value === undefined) return <span className="text-right">-</span>;
  
  const formattedValue = (value * 100).toFixed(2) + '%';
  
  return (
    <div className="text-right">
      {formattedValue}
    </div>
  );
};

// 双低因子单元格渲染器（根据值显示不同颜色）
export const DblowRenderer = (props: any) => {
  const value = props.value;
  if (value === null || value === undefined) return <span className="text-right">-</span>;
  
  const formattedValue = value.toFixed(2);
  let color = 'text-gray-800';
  
  // 双低因子越低越好
  if (value < 120) {
    color = 'text-green-600 font-medium';
  } else if (value < 130) {
    color = 'text-blue-600 font-medium';
  } else if (value < 140) {
    color = 'text-violet-600';
  } else if (value < 150) {
    color = 'text-yellow-600';
  } else if (value < 160) {
    color = 'text-orange-600';
  } else {
    color = 'text-gray-600';
  }
  
  return (
    <div className={`text-right ${color}`}>
      {formattedValue}
    </div>
  );
};

// 溢价率单元格渲染器
export const PremiumRenderer = (props: any) => {
  const value = props.value;
  if (value === null || value === undefined) return <span className="text-right">-</span>;
  
  const formattedValue = (value * 100).toFixed(2) + '%';
  let color = 'text-gray-800';
  
  // 溢价率越低越好
  if (value < 0) {
    color = 'text-red-600 font-medium';
  } else if (value < 0.05) {
    color = 'text-green-600 font-medium';
  } else if (value < 0.1) {
    color = 'text-blue-600';
  } else if (value < 0.2) {
    color = 'text-violet-600';
  } else if (value < 0.3) {
    color = 'text-yellow-600';
  } else {
    color = 'text-gray-600';
  }
  
  return (
    <div className={`text-right ${color}`}>
      {formattedValue}
    </div>
  );
}; 