"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/datepicker';
import { Input } from '@/components/ui/input';
import { Loader2, RefreshCw, Filter, Search } from 'lucide-react';
import { ConvertibleBond } from '@/types/bond';
import BondsGrid from '@/components/features/bonds/bonds-grid';
import { useBonds } from '@/hooks/use-bonds';

export default function ConvertibleBondsPage() {
  // 使用自定义钩子获取可转债数据
  const {
    bonds,
    filteredBonds,
    loading,
    error,
    currentDataDate,
    selectedDate,
    isRefreshing,
    setFilteredBonds,
    handleRefresh,
    handleDateChange
  } = useBonds();

  // 搜索和筛选状态
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showFilter, setShowFilter] = useState<boolean>(false);
  const [selectedBond, setSelectedBond] = useState<ConvertibleBond | null>(null);

  // 处理搜索输入变化
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    
    if (!term) {
      setFilteredBonds(bonds);
      return;
    }
    
    // 筛选匹配的债券
    const filtered = bonds.filter(bond => 
      bond.code.toLowerCase().includes(term) || 
      bond.name.toLowerCase().includes(term)
    );
    
    setFilteredBonds(filtered);
  };

  // 切换筛选面板显示
  const toggleFilter = () => {
    setShowFilter(!showFilter);
  };

  // 选择债券处理
  const handleBondSelect = (bond: ConvertibleBond) => {
    setSelectedBond(bond);
  };

  return (
    <div className="container mx-auto p-4 space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xl">可转债数据中心</CardTitle>
          <div className="flex items-center space-x-2">
            {currentDataDate && (
              <span className="text-sm text-muted-foreground">
                数据日期: {currentDataDate}
              </span>
            )}
            <DatePicker
              selected={selectedDate}
              onChange={handleDateChange}
              placeholder="选择日期"
              className="w-40"
              enableTradingDatesOnly={true}
              autoSetLastValidDate={true}
            />
            <Button
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              disabled={loading || isRefreshing}
            >
              {isRefreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索代码或名称..."
                className="pl-8"
                value={searchTerm}
                onChange={handleSearchChange}
              />
            </div>
            <Button variant="outline" size="icon" onClick={toggleFilter}>
              <Filter className="h-4 w-4" />
            </Button>
          </div>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 mb-4 rounded">
              {error}
            </div>
          )}
          
          {loading ? (
            <div className="flex items-center justify-center h-60">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">加载中...</span>
            </div>
          ) : (
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="all">全部</TabsTrigger>
                <TabsTrigger value="lowPrice">低价</TabsTrigger>
                <TabsTrigger value="doubleLow">双低</TabsTrigger>
                <TabsTrigger value="premium">溢价率</TabsTrigger>
                <TabsTrigger value="ytm">到期收益</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all" className="w-full">
                <BondsGrid
                  bonds={filteredBonds}
                  onBondSelect={handleBondSelect}
                  height="70vh"
                />
              </TabsContent>
              
              <TabsContent value="lowPrice">
                <BondsGrid
                  bonds={filteredBonds}
                  onBondSelect={handleBondSelect}
                  defaultSortField="close"
                  defaultSortDirection="asc"
                  height="70vh"
                />
              </TabsContent>
              
              <TabsContent value="doubleLow">
                <BondsGrid
                  bonds={filteredBonds}
                  onBondSelect={handleBondSelect}
                  defaultSortField="dblow"
                  defaultSortDirection="asc"
                  height="70vh"
                />
              </TabsContent>
              
              <TabsContent value="premium">
                <BondsGrid
                  bonds={filteredBonds}
                  onBondSelect={handleBondSelect}
                  defaultSortField="conv_prem"
                  defaultSortDirection="asc"
                  height="70vh"
                />
              </TabsContent>
              
              <TabsContent value="ytm">
                <BondsGrid
                  bonds={filteredBonds}
                  onBondSelect={handleBondSelect}
                  defaultSortField="ytm"
                  defaultSortDirection="desc"
                  height="70vh"
                />
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
      
      {selectedBond && (
        <Card>
          <CardHeader>
            <CardTitle>{selectedBond.name} ({selectedBond.code})</CardTitle>
          </CardHeader>
          <CardContent>
            {/* 这里可以添加债券详情组件 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-sm">
                <p className="mb-1"><span className="font-medium">转股价格:</span> {selectedBond.conv_price}</p>
                <p className="mb-1"><span className="font-medium">转股价值:</span> {selectedBond.conv_value}</p>
                <p className="mb-1"><span className="font-medium">转股溢价率:</span> {selectedBond.conv_prem}%</p>
              </div>
              <div className="text-sm">
                <p className="mb-1"><span className="font-medium">双低值:</span> {selectedBond.dblow}</p>
                <p className="mb-1"><span className="font-medium">到期收益率:</span> {selectedBond.ytm}%</p>
                <p className="mb-1"><span className="font-medium">剩余规模:</span> {selectedBond.remain_size}</p>
              </div>
              <div className="text-sm">
                <p className="mb-1"><span className="font-medium">评级:</span> {selectedBond.rating}</p>
                <p className="mb-1"><span className="font-medium">行业:</span> {selectedBond.industry_1} - {selectedBond.industry_2}</p>
                <p className="mb-1"><span className="font-medium">剩余期限:</span> {selectedBond.left_years}年</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 