"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import StatCard from "@/components/common/StatCard";
import { BacktestResult } from "@/types/app-backtest";
import PerformanceChart from "@/components/charts/PerformanceChart";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface BacktestResultsProps {
  result: BacktestResult | null;
}

export default function BacktestResults({ result }: BacktestResultsProps) {
  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20; // 每页显示20条记录

  if (!result) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="h-[400px] flex items-center justify-center text-muted-foreground">
            暂无回测结果
          </div>
        </CardContent>
      </Card>
    );
  }

  const stats = [
    { label: "年化收益", value: `${result.annualReturn.toFixed(1)}%`, color: result.annualReturn >= 0 ? "text-green-500" : "text-red-500" },
    { label: "最大回撤", value: `${result.maxDrawdown.toFixed(1)}%`, color: "text-red-500" },
    { label: "夏普比率", value: result.sharpeRatio.toFixed(2) },
    { label: "胜率", value: `${result.winRate.toFixed(1)}%` },
  ];

  // 计算分页
  const totalTrades = result.trades?.length || 0;
  const totalPages = Math.ceil(totalTrades / pageSize);
  
  // 获取当前页的交易记录
  const currentTrades = result.trades 
    ? result.trades.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : [];

  // 页码变更处理
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-6">
          <div className="h-[400px] rounded-lg">
            {result.returns && result.dates ? (
              <PerformanceChart 
                returns={result.returns} 
                dates={result.dates} 
              />
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                回测数据不完整，无法显示图表
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-4 gap-4">
            {stats.map((stat, index) => (
              <StatCard key={index} {...stat} />
            ))}
          </div>

          {result.trades && result.trades.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">交易记录</h3>
                <div className="text-sm text-muted-foreground">
                  总共 {totalTrades} 条交易记录
                </div>
              </div>
              
              <div className="border rounded-lg divide-y">
                {currentTrades.map((trade, index) => (
                  <div key={index} className="p-4 flex items-center justify-between">
                    <div>
                      <span className="font-medium">{trade.symbol}</span>
                      <span className="ml-4 text-sm text-muted-foreground">{trade.date}</span>
                    </div>
                    <div>
                      <span className={trade.type === 'buy' ? 'text-green-500' : 'text-red-500'}>
                        {trade.type === 'buy' ? '买入' : '卖出'}
                      </span>
                      <span className="ml-4">{trade.quantity}股</span>
                      <span className="ml-4">¥{trade.price?.toFixed(2) || '-'}</span>
                      {trade.profit !== undefined && (
                        <span className={`ml-4 ${trade.profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {trade.profit >= 0 ? '+' : ''}{trade.profit.toFixed(2)}%
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* 分页控制 */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-2 py-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    上一页
                  </Button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      // 计算显示的页码范围
                      let pageNum: number;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          className="w-8 h-8 p-0"
                          onClick={() => handlePageChange(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                    
                    {totalPages > 5 && currentPage < totalPages - 2 && (
                      <>
                        {currentPage < totalPages - 3 && <span className="mx-1">...</span>}
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-8 h-8 p-0"
                          onClick={() => handlePageChange(totalPages)}
                        >
                          {totalPages}
                        </Button>
                      </>
                    )}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                  >
                    下一页
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 