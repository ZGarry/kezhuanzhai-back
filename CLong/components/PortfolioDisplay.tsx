'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';

interface Position {
    symbol: string;
    quantity: number;
    cost_basis: number;
    market_value: number;
    last_update: string;
}

interface PortfolioState {
    total_assets: number;
    cash: number;
    positions: { [key: string]: Position };
    timestamp: string;
}

export function PortfolioDisplay() {
    const [portfolioState, setPortfolioState] = useState<PortfolioState | null>(null);
    const [wsConnected, setWsConnected] = useState(false);

    useEffect(() => {
        // 初始化WebSocket连接
        const ws = new WebSocket('ws://localhost:8000/ws/1');
        
        ws.onopen = () => {
            console.log('WebSocket连接已建立');
            setWsConnected(true);
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log('收到WebSocket消息:', data);
            // 处理实时更新
            fetchPortfolioState();
        };

        ws.onclose = () => {
            console.log('WebSocket连接已关闭');
            setWsConnected(false);
        };

        // 获取初始数据
        fetchPortfolioState();

        return () => {
            ws.close();
        };
    }, []);

    const fetchPortfolioState = async () => {
        try {
            const response = await fetch('http://localhost:8000/portfolio_state');
            const data = await response.json();
            setPortfolioState(data);
        } catch (error) {
            console.error('获取投资组合状态失败:', error);
        }
    };

    if (!portfolioState) {
        return <div>加载中...</div>;
    }

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>投资组合概览</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm font-medium">总资产</p>
                            <p className="text-2xl font-bold">
                                ¥{portfolioState.total_assets.toLocaleString()}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm font-medium">现金</p>
                            <p className="text-2xl font-bold">
                                ¥{portfolioState.cash.toLocaleString()}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>持仓明细</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>股票代码</TableHead>
                                <TableHead>持仓数量</TableHead>
                                <TableHead>持仓成本</TableHead>
                                <TableHead>市场价值</TableHead>
                                <TableHead>最后更新时间</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {Object.entries(portfolioState.positions).map(([symbol, position]) => (
                                <TableRow key={symbol}>
                                    <TableCell>{position.symbol}</TableCell>
                                    <TableCell>{position.quantity}</TableCell>
                                    <TableCell>¥{position.cost_basis.toLocaleString()}</TableCell>
                                    <TableCell>¥{position.market_value.toLocaleString()}</TableCell>
                                    <TableCell>{new Date(position.last_update).toLocaleString()}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <div className="text-sm text-gray-500">
                最后更新时间: {new Date(portfolioState.timestamp).toLocaleString()}
            </div>
            <div className="text-sm text-gray-500">
                WebSocket状态: {wsConnected ? '已连接' : '未连接'}
            </div>
        </div>
    );
} 