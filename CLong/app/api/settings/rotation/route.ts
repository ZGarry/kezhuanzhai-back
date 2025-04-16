import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const CONFIG_PATH = path.join(process.cwd(), 'config');
const ROTATION_CONFIG_PATH = path.join(CONFIG_PATH, 'rotation.json');

// 确保配置目录存在
async function ensureConfigDir() {
  try {
    await fs.access(CONFIG_PATH);
  } catch {
    await fs.mkdir(CONFIG_PATH, { recursive: true });
  }
}

export async function GET() {
  try {
    await ensureConfigDir();
    
    try {
      const config = await fs.readFile(ROTATION_CONFIG_PATH, 'utf-8');
      return NextResponse.json(JSON.parse(config));
    } catch {
      // 如果配置文件不存在，返回默认值
      return NextResponse.json({
        enabled: false,
        time: "09:30"
      });
    }
  } catch (error) {
    console.error('Error reading rotation config:', error);
    return NextResponse.json(
      { error: '读取配置失败' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    await ensureConfigDir();
    
    // 验证输入
    if (typeof body.enabled !== 'boolean' || typeof body.time !== 'string') {
      return NextResponse.json(
        { error: '无效的输入参数' },
        { status: 400 }
      );
    }

    // 验证时间格式
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(body.time)) {
      return NextResponse.json(
        { error: '无效的时间格式' },
        { status: 400 }
      );
    }

    // 保存配置
    await fs.writeFile(
      ROTATION_CONFIG_PATH,
      JSON.stringify(body, null, 2),
      'utf-8'
    );

    // 如果启用了轮动，创建或更新 cron 任务
    if (body.enabled) {
      // 这里可以添加创建系统定时任务的代码
      // 例如使用 node-cron 或系统的 crontab
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving rotation config:', error);
    return NextResponse.json(
      { error: '保存配置失败' },
      { status: 500 }
    );
  }
} 