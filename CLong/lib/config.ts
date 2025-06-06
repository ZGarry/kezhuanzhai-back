/**
 * 环境配置管理
 */

// 判断当前运行环境
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

// API地址配置
const API_CONFIG = {
  // 本地开发环境
  development: {
    apiBaseUrl: 'http://localhost:8000',
    wsBaseUrl: 'ws://localhost:8000'
  },
  // 生产环境（Vercel部署）
  production: {
    apiBaseUrl: 'http://101.35.147.254:8000',
    wsBaseUrl: 'ws://101.35.147.254:8000'
  }
};

// 获取当前环境的API基础URL
export function getApiBaseUrl(): string {
  // 优先使用环境变量
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL;
  }
  
  // 根据环境自动判断
  if (isDevelopment) {
    return API_CONFIG.development.apiBaseUrl;
  }
  
  // 生产环境默认使用云服务器地址
  return API_CONFIG.production.apiBaseUrl;
}

// 获取WebSocket基础URL
export function getWsBaseUrl(): string {
  // 优先使用环境变量
  if (process.env.NEXT_PUBLIC_WS_BASE_URL) {
    return process.env.NEXT_PUBLIC_WS_BASE_URL;
  }
  
  // 根据环境自动判断
  if (isDevelopment) {
    return API_CONFIG.development.wsBaseUrl;
  }
  
  return API_CONFIG.production.wsBaseUrl;
}

// 获取当前环境信息
export function getEnvironmentInfo() {
  return {
    isDevelopment,
    isProduction,
    nodeEnv: process.env.NODE_ENV,
    apiBaseUrl: getApiBaseUrl(),
    wsBaseUrl: getWsBaseUrl()
  };
}

// 导出配置
export const config = {
  api: {
    baseUrl: getApiBaseUrl(),
    wsBaseUrl: getWsBaseUrl()
  },
  environment: {
    isDevelopment,
    isProduction,
    nodeEnv: process.env.NODE_ENV
  }
};

export default config; 