'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function BacktestPage() {
  const router = useRouter();
  
  useEffect(() => {
    // 重定向到主页
    router.push('/?tab=ui-backtest');
  }, [router]);
  
  return (
    <div className="container mx-auto p-4 flex items-center justify-center min-h-[300px]">
      <p>正在重定向到主页回测功能...</p>
    </div>
  );
} 