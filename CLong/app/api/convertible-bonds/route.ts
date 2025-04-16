import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // 获取查询参数
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get('date');
    
    // 添加日志记录
    console.log(`开始请求可转债数据，日期参数: ${date || '未指定（使用最新）'}`);
    
    // 构建请求URL
    let url = 'http://localhost:8000/api/convertible-bonds';
    if (date) {
      url += `?date=${date}`;
    }
    
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
    console.log(`成功获取可转债数据，记录数: ${data.data?.length || 0}`);
    
    // 保留API原始数据，并将其直接返回（后端API可能已经包含currentDate）
    return NextResponse.json(data);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('获取可转债数据出错:', errorMessage);
    
    return NextResponse.json(
      { 
        status: 'error', 
        message: '获取可转债数据失败',
        details: errorMessage 
      },
      { status: 500 }
    );
  }
} 