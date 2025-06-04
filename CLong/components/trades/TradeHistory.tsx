"use client";

import { useState } from "react";
import { Card } from "../ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Button } from "../ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

// 更新接口以匹配后端返回的数据结构
interface Trade {
  // 英文字段（前端期望）
  date?: string;
  symbol?: string;
  type?: 'buy' | 'sell';
  price?: number;
  quantity?: number;
  profit?: number;
  
  // 中文字段（后端返回）
  日期?: string;
  转债代码?: string;
  转债名称?: string;
  操作?: string;
  价格?: number;
  数量?: number;
  收益率?: number;
  收益?: number;
  金额?: number;
}

interface TradeHistoryProps {
  trades?: Trade[];
}

export default function TradeHistory({ trades = [] }: TradeHistoryProps) {
  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20; // 每页显示20条记录

  // 计算分页
  const totalTrades = trades.length;
  const totalPages = Math.ceil(totalTrades / pageSize);
  
  // 获取当前页的交易记录
  const currentTrades = trades.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // 页码变更处理
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // 辅助函数：安全获取值
  const safeToFixed = (value: any, digits: number = 2) => {
    if (value === undefined || value === null) return '-';
    const num = Number(value);
    return !isNaN(num) ? num.toFixed(digits) : '-';
  };

  // 辅助函数：获取交易类型
  const getTradeType = (trade: Trade) => {
    // 尝试获取交易类型，优先使用英文字段，然后检查中文字段
    if (trade.type) return trade.type;
    if (trade.操作 === '买入') return 'buy';
    if (trade.操作 === '卖出') return 'sell';
    return 'unknown';
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">交易记录</h2>
        {totalTrades > 0 && (
          <div className="text-sm text-muted-foreground">
            总共 {totalTrades} 条交易记录
          </div>
        )}
      </div>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>日期</TableHead>
              <TableHead>代码</TableHead>
              <TableHead>类型</TableHead>
              <TableHead className="text-right">价格</TableHead>
              <TableHead className="text-right">数量</TableHead>
              <TableHead className="text-right">收益</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentTrades.length > 0 ? (
              currentTrades.map((trade, index) => {
                const tradeType = getTradeType(trade);
                const profit = trade.profit !== undefined ? trade.profit : (trade.收益率 !== undefined ? trade.收益率 : undefined);
                
                return (
                  <TableRow key={index}>
                    <TableCell>{trade.date || trade.日期 || '-'}</TableCell>
                    <TableCell>{trade.symbol || trade.转债代码 || '-'}</TableCell>
                    <TableCell>
                      <span className={tradeType === 'buy' ? 'text-red-500' : 'text-green-500'}>
                        {tradeType === 'buy' ? '买入' : 
                         tradeType === 'sell' ? '卖出' : 
                         trade.操作 || '-'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">{safeToFixed(trade.price || trade.价格)}</TableCell>
                    <TableCell className="text-right">{trade.quantity || trade.数量 || '-'}</TableCell>
                    <TableCell className="text-right">
                      {profit !== undefined ? (
                        <span className={profit >= 0 ? 'text-green-500' : 'text-red-500'}>
                          {profit >= 0 ? '+' : ''}{safeToFixed(profit)}%
                        </span>
                      ) : '-'}
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                  暂无交易记录
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* 分页控制 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 px-2 py-2">
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
    </Card>
  );
}