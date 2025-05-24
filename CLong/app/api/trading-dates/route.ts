import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('开始请求交易日期数据');
    
    // 构建请求URL
    const url = 'http://localhost:8000/api/trading-dates';
    
    // 调用后端API
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store', // 禁用缓存以确保获取最新数据
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '无法获取错误详情');
      console.error(`后端API请求失败: 状态码=${response.status}, 内容=${errorText}`);
      throw new Error(`后端API请求失败: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`成功获取交易日期数据: ${data.data?.total_days || 0} 天`);
    
    // 返回数据
    return NextResponse.json(data);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('获取交易日期数据出错:', errorMessage);
    
    return NextResponse.json(
      { 
        status: 'error', 
        message: '获取交易日期数据失败',
        details: errorMessage 
      },
      { status: 500 }
    );
  }
} 