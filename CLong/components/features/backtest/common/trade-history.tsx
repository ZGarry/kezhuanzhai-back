import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trade } from "@/types/app-backtest";

interface TradeHistoryProps {
  trades: Trade[];
}

export default function TradeHistory({ trades }: TradeHistoryProps) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>日期</TableHead>
            <TableHead>代码</TableHead>
            <TableHead>交易类型</TableHead>
            <TableHead>数量</TableHead>
            <TableHead>价格</TableHead>
            <TableHead>盈亏</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {trades.length > 0 ? trades.map((trade, index) => (
            <TableRow key={index}>
              <TableCell>{trade.date}</TableCell>
              <TableCell>{trade.symbol}</TableCell>
              <TableCell>{trade.type === 'buy' ? '买入' : '卖出'}</TableCell>
              <TableCell>{trade.quantity}</TableCell>
              <TableCell>{trade.price?.toFixed(2) || '-'}</TableCell>
              <TableCell>{trade.profit ? `${trade.profit > 0 ? '+' : ''}${trade.profit.toFixed(2)}` : '-'}</TableCell>
            </TableRow>
          )) : (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-4">暂无交易记录</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
} 