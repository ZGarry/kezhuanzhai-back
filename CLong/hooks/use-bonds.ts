import { useState, useCallback, useEffect } from 'react';
import { ConvertibleBond, ApiResponse } from '@/types/bond';
import { api } from '@/lib/api';

interface UseBondsOptions {
  initialDate?: Date;
  autoFetch?: boolean;
}

interface UseBondsResult {
  bonds: ConvertibleBond[];
  filteredBonds: ConvertibleBond[];
  loading: boolean;
  error: string | null;
  currentDataDate: string | null;
  selectedDate: Date | undefined;
  isRefreshing: boolean;
  fetchBonds: (date?: Date) => Promise<void>;
  setFilteredBonds: (bonds: ConvertibleBond[]) => void;
  handleRefresh: () => void;
  handleDateChange: (date: Date | undefined) => void;
}

/**
 * 自定义钩子，用于获取和管理可转债数据
 */
export function useBonds({ 
  initialDate, 
  autoFetch = true 
}: UseBondsOptions = {}): UseBondsResult {
  const [bonds, setBonds] = useState<ConvertibleBond[]>([]);
  const [filteredBonds, setFilteredBonds] = useState<ConvertibleBond[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentDataDate, setCurrentDataDate] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(initialDate);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // 格式化日期为YYYY-MM-DD
  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  // 获取可转债数据
  const fetchBonds = useCallback(async (date?: Date) => {
    try {
      setLoading(true);
      setError(null);
      
      // 如果有选择日期，添加日期参数
      const dateParam = date ? formatDate(date) : undefined;
      
      console.log(`开始获取可转债数据，日期: ${dateParam || '最新'}`);
      
      const response = await api.fetchConvertibleBonds(dateParam);
      
      if (response.status === 'success') {
        // 设置数据
        setBonds(response.data);
        setFilteredBonds(response.data);
        
        // 设置当前数据日期
        if (response.currentDate) {
          setCurrentDataDate(response.currentDate);
        }
      } else {
        console.error('API返回错误状态:', response);
        setError('获取数据失败');
      }
    } catch (error) {
      console.error('获取数据错误:', error);
      setError('获取数据出错，请稍后再试');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // 刷新数据
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchBonds(selectedDate);
  }, [fetchBonds, selectedDate]);

  // 处理日期变更
  const handleDateChange = useCallback((date: Date | undefined) => {
    setSelectedDate(date);
    setIsRefreshing(true);
    fetchBonds(date);
  }, [fetchBonds]);

  // 初始加载数据
  useEffect(() => {
    if (autoFetch) {
      fetchBonds(initialDate);
    }
  }, [autoFetch, fetchBonds, initialDate]);

  return {
    bonds,
    filteredBonds,
    loading,
    error,
    currentDataDate,
    selectedDate,
    isRefreshing,
    fetchBonds,
    setFilteredBonds,
    handleRefresh,
    handleDateChange
  };
} 