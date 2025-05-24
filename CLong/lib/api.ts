/**
 * 网络请求函数集中管理
 */

// API基础URL
const API_BASE_URL = 'http://localhost:8000';

// 基础请求函数
async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  try {
    // 添加基础URL前缀
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
    
    // 设置默认选项
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store', // 禁用缓存以确保获取最新数据
      ...options,
    };

    // 发送请求
    const response = await fetch(url, defaultOptions);
    
    // 尝试获取响应文本，无论状态如何
    let responseText = '';
    try {
      responseText = await response.text();
    } catch (e) {
      responseText = '无法读取响应内容';
    }
    
    // 尝试解析JSON
    let data: any;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('响应不是有效的JSON:', responseText.substring(0, 500));
      data = { error: '响应格式不正确', rawResponse: responseText.substring(0, 1000) };
    }

    if (!response.ok) {
      console.error(`API请求失败: 状态码=${response.status}, 内容=${responseText.substring(0, 500)}`);
      return {
        status: 'error',
        error: `API请求失败: ${response.status} ${response.statusText}`,
        data: data
      } as unknown as T;
    }

    return data as T;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('API请求出错:', errorMessage);
    return {
      status: 'error',
      error: errorMessage
    } as unknown as T;
  }
}

// 构建带参数的URL
function buildUrl(endpoint: string, params?: Record<string, string | number | undefined>): string {
  if (!params) return endpoint;

  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      searchParams.append(key, String(value));
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `${endpoint}?${queryString}` : endpoint;
}

// 可转债数据相关API
export async function fetchConvertibleBonds(date?: string) {
  const url = buildUrl('/api/convertible-bonds', { date });
  return fetchApi(url);
}

// 市场概览数据API
export async function fetchMarketOverview(date?: string) {
  const url = buildUrl('/api/market-overview', { date });
  return fetchApi(url);
}

// 分布统计数据API
export async function fetchDistributionData(date?: string) {
  const url = buildUrl('/api/distribution-data', { date });
  return fetchApi(url);
}

// 排行榜数据API
export async function fetchRankingData(date?: string, limit?: number) {
  const url = buildUrl('/api/ranking-data', { date, limit });
  return fetchApi(url);
}

// 交易日期范围API
export async function fetchTradingDates() {
  const url = buildUrl('/api/trading-dates');
  return fetchApi(url);
}

// 回测API
export async function runBacktest(params: any) {
  // 从params中提取strategy_type，其余作为请求体
  const { strategy_type, ...bodyParams } = params;
  // 确保strategy_type是有效的
  const endpoint = strategy_type 
    ? `/api/backtest?strategy_type=${strategy_type}` 
    : '/api/backtest?strategy_type=custom';
  
  try {  
    const result = await fetchApi(endpoint, {
      method: 'POST',
      body: JSON.stringify(bodyParams),
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    return result;
  } catch (error) {
    console.error('回测API请求失败:', error);
    return {
      status: 'error',
      error: error instanceof Error ? error.message : '回测请求失败'
    };
  }
}

// 获取字段信息
export async function fetchFieldInfo() {
  return fetchApi('/api/field-info');
}

// 获取可用因子信息
export async function fetchFactors() {
  return fetchApi('/api/factors');
}

// 导出所有API函数
export const api = {
  fetchConvertibleBonds,
  fetchMarketOverview,
  fetchDistributionData,
  fetchRankingData,
  fetchTradingDates,
  runBacktest,
  fetchFieldInfo,
  fetchFactors
};

export default api; 