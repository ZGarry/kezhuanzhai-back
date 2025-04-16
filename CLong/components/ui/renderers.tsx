import React from 'react';

interface NumberRendererProps {
  value: number;
  precision?: number;
  suffix?: string;
  prefix?: string;
}

interface ColoredNumberRendererProps extends NumberRendererProps {
  threshold?: number;
  positiveClass?: string;
  negativeClass?: string;
  neutralClass?: string;
}

/**
 * 数字渲染器 - 格式化数字显示
 */
export const numberRenderer = (props: any) => {
  const { value } = props;
  const params = props.colDef?.cellRendererParams || {};
  const { precision = 2, suffix = '', prefix = '' } = params as NumberRendererProps;

  if (value === undefined || value === null || isNaN(value)) {
    return <span>-</span>;
  }

  const formattedValue = Number(value).toFixed(precision);
  return <span>{prefix}{formattedValue}{suffix}</span>;
};

/**
 * 百分比渲染器 - 将小数格式化为百分比
 */
export const percentRenderer = (props: any) => {
  const { value } = props;
  const params = props.colDef?.cellRendererParams || {};
  const { precision = 2 } = params as NumberRendererProps;

  if (value === undefined || value === null || isNaN(value)) {
    return <span>-</span>;
  }

  const percentValue = (value * 100).toFixed(precision);
  return <span>{percentValue}%</span>;
};

/**
 * 带颜色的数字渲染器 - 根据数值大小显示不同颜色
 */
export const coloredNumberRenderer = (props: any) => {
  const { value } = props;
  const params = props.colDef?.cellRendererParams || {};
  const { 
    precision = 2, 
    suffix = '', 
    prefix = '',
    threshold = 0,
    positiveClass = 'text-green-500',
    negativeClass = 'text-red-500',
    neutralClass = 'text-gray-500'
  } = params as ColoredNumberRendererProps;

  if (value === undefined || value === null || isNaN(value)) {
    return <span className={neutralClass}>-</span>;
  }

  const formattedValue = Number(value).toFixed(precision);
  let className = neutralClass;

  if (value > threshold) {
    className = positiveClass;
  } else if (value < threshold) {
    className = negativeClass;
  }

  return <span className={className}>{prefix}{formattedValue}{suffix}</span>;
};

/**
 * 日期渲染器 - 格式化日期显示
 */
export const dateRenderer = (props: any) => {
  const { value } = props;
  if (!value) return <span>-</span>;

  try {
    const date = new Date(value);
    const formattedDate = date.toLocaleDateString('zh-CN');
    return <span>{formattedDate}</span>;
  } catch (error) {
    return <span>{value}</span>;
  }
};

/**
 * 链接渲染器 - 将值渲染为可点击链接
 */
export const linkRenderer = (props: any) => {
  const { value } = props;
  const params = props.colDef?.cellRendererParams || {};
  const { href, target = '_blank', className = 'text-blue-500 hover:underline' } = params;

  if (!value) return <span>-</span>;

  const url = typeof href === 'function' ? href(props) : `${href}${value}`;
  
  return (
    <a href={url} target={target} className={className}>
      {value}
    </a>
  );
}; 