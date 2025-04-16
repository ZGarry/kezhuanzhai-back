import React, { useState, useEffect, useCallback } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { ColDef, GridReadyEvent, ColumnApi, GridApi } from 'ag-grid-community';
import { ConvertibleBond } from '@/types/bond';
import { numberRenderer, percentRenderer, coloredNumberRenderer } from '@/components/ui/renderers';

interface ConvertibleBondsGridProps {
  bonds: ConvertibleBond[];
  onBondSelect?: (bond: ConvertibleBond) => void;
  height?: string;
  defaultSortField?: string;
  defaultSortDirection?: 'asc' | 'desc';
  filterModel?: any;
  selectable?: boolean;
}

const ConvertibleBondsGrid: React.FC<ConvertibleBondsGridProps> = ({
  bonds,
  onBondSelect,
  height = '70vh',
  defaultSortField = 'dblow',
  defaultSortDirection = 'asc',
  filterModel,
  selectable = true,
}) => {
  const [gridApi, setGridApi] = useState<GridApi | null>(null);
  const [columnApi, setColumnApi] = useState<ColumnApi | null>(null);
  
  // 列定义
  const columnDefs: ColDef[] = [
    { 
      headerName: '代码', 
      field: 'code', 
      sortable: true, 
      filter: true, 
      width: 100, 
      pinned: 'left',
      checkboxSelection: selectable,
      headerCheckboxSelection: selectable 
    },
    { 
      headerName: '名称', 
      field: 'name', 
      sortable: true, 
      filter: true, 
      width: 120, 
      pinned: 'left' 
    },
    { 
      headerName: '现价', 
      field: 'close', 
      sortable: true, 
      filter: 'agNumberColumnFilter', 
      width: 100,
      cellRenderer: numberRenderer 
    },
    { 
      headerName: '涨跌幅', 
      field: 'pct_chg', 
      sortable: true, 
      filter: 'agNumberColumnFilter', 
      width: 100,
      cellRenderer: coloredNumberRenderer,
      cellRendererParams: { suffix: '%' } 
    },
    { 
      headerName: '双低', 
      field: 'dblow', 
      sortable: true, 
      filter: 'agNumberColumnFilter', 
      width: 100,
      cellRenderer: numberRenderer 
    },
    { 
      headerName: '转股溢价率', 
      field: 'conv_prem', 
      sortable: true, 
      filter: 'agNumberColumnFilter', 
      width: 120,
      cellRenderer: percentRenderer 
    },
    { 
      headerName: '纯债溢价率', 
      field: 'bond_prem', 
      sortable: true, 
      filter: 'agNumberColumnFilter', 
      width: 120,
      cellRenderer: percentRenderer 
    },
    { 
      headerName: '正股名称', 
      field: 'stock_name', 
      sortable: true, 
      filter: true, 
      width: 120 
    },
    { 
      headerName: '正股涨跌幅', 
      field: 'pct_chg_stk', 
      sortable: true, 
      filter: 'agNumberColumnFilter', 
      width: 120,
      cellRenderer: coloredNumberRenderer,
      cellRendererParams: { suffix: '%' } 
    },
    { 
      headerName: '到期收益率', 
      field: 'ytm', 
      sortable: true, 
      filter: 'agNumberColumnFilter', 
      width: 120,
      cellRenderer: percentRenderer 
    },
    { 
      headerName: '剩余年限', 
      field: 'left_years', 
      sortable: true, 
      filter: 'agNumberColumnFilter', 
      width: 110,
      cellRenderer: numberRenderer,
      cellRendererParams: { precision: 1 } 
    },
    { 
      headerName: '评级', 
      field: 'rating', 
      sortable: true, 
      filter: true, 
      width: 90 
    },
    { 
      headerName: '行业', 
      field: 'industry_1', 
      sortable: true, 
      filter: true, 
      width: 120 
    }
  ];

  // 表格默认配置
  const defaultColDef = {
    resizable: true,
  };

  // 表格就绪事件处理
  const onGridReady = (params: GridReadyEvent) => {
    setGridApi(params.api);
    setColumnApi(params.columnApi);
    
    // 设置默认排序
    if (defaultSortField && params.columnApi.getColumn(defaultSortField)) {
      params.columnApi.applyColumnState({
        state: [{ colId: defaultSortField, sort: defaultSortDirection }],
        defaultState: { sort: null },
      });
    }
    
    // 如果有过滤模型，应用它
    if (filterModel && params.api) {
      params.api.setFilterModel(filterModel);
    }
  };

  // 行点击事件处理
  const onRowClicked = (event: any) => {
    if (onBondSelect) {
      onBondSelect(event.data);
    }
  };

  // 更新数据时自动调整列宽
  useEffect(() => {
    if (gridApi) {
      gridApi.sizeColumnsToFit();
    }
  }, [bonds, gridApi]);

  // 响应窗口大小变化
  useEffect(() => {
    const handleResize = () => {
      if (gridApi) {
        setTimeout(() => {
          gridApi.sizeColumnsToFit();
        }, 100);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [gridApi]);

  // 应用过滤器模型的变化
  useEffect(() => {
    if (gridApi && filterModel) {
      gridApi.setFilterModel(filterModel);
    }
  }, [filterModel, gridApi]);

  return (
    <div className="ag-theme-alpine w-full" style={{ height }}>
      <AgGridReact
        rowData={bonds}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        onGridReady={onGridReady}
        onRowClicked={onRowClicked}
        rowSelection="multiple"
        pagination={true}
        paginationPageSize={50}
        suppressCellFocus={true}
        animateRows={true}
        enableCellTextSelection={true}
      />
    </div>
  );
};

export default ConvertibleBondsGrid; 