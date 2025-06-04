'use client';

import React, { useEffect, useState, useRef } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { ColDef } from 'ag-grid-community';
import { 
    PriceChangeRenderer, 
    RatingRenderer, 
    NumberRenderer, 
    PercentRenderer, 
    DblowRenderer, 
    PremiumRenderer 
} from './CustomCellRenderers';

const ConvertibleBondsGrid = () => {
    const [rowData, setRowData] = useState<any[]>([]);
    const gridRef = useRef<AgGridReact>(null);

    const [columnDefs] = useState<ColDef[]>([
        { 
            field: 'code', 
            headerName: '转债代码', 
            sortable: true, 
            filter: true,
            cellStyle: { fontWeight: 500 }
        },
        { 
            field: 'name', 
            headerName: '转债名称', 
            sortable: true, 
            filter: true,
            cellStyle: { fontWeight: 500 }
        },
        { 
            field: 'close', 
            headerName: '收盘价', 
            sortable: true, 
            filter: true,
            cellRenderer: NumberRenderer
        },
        { 
            field: 'pct_chg', 
            headerName: '涨跌幅', 
            sortable: true, 
            filter: true,
            cellRenderer: PriceChangeRenderer
        },
        { 
            field: 'volume', 
            headerName: '成交量', 
            sortable: true, 
            filter: true,
            valueFormatter: (params: any) => params.value ? params.value.toLocaleString() : '-',
            cellClass: 'ag-cell-number'
        },
        { 
            field: 'amount', 
            headerName: '成交额', 
            sortable: true, 
            filter: true,
            valueFormatter: (params: any) => params.value ? params.value.toLocaleString() : '-',
            cellClass: 'ag-cell-number'
        },
        { 
            field: 'conv_price', 
            headerName: '转股价', 
            sortable: true, 
            filter: true,
            cellRenderer: NumberRenderer
        },
        { 
            field: 'conv_value', 
            headerName: '转股价值', 
            sortable: true, 
            filter: true,
            cellRenderer: NumberRenderer
        },
        { 
            field: 'conv_prem', 
            headerName: '转股溢价率', 
            sortable: true, 
            filter: true,
            cellRenderer: PremiumRenderer
        },
        { 
            field: 'ytm', 
            headerName: '到期收益率', 
            sortable: true, 
            filter: true,
            cellRenderer: PercentRenderer
        },
        { 
            field: 'rating', 
            headerName: '评级', 
            sortable: true, 
            filter: true,
            cellRenderer: RatingRenderer
        },
        { 
            field: 'remain_size', 
            headerName: '剩余规模', 
            sortable: true, 
            filter: true,
            cellRenderer: (params: any) => {
                if (params.value === null || params.value === undefined) return <span className="text-right">-</span>;
                return <div className="text-right">{(params.value / 100000000).toFixed(2)}</div>;
            }
        },
        { 
            field: 'turnover', 
            headerName: '换手率', 
            sortable: true, 
            filter: true,
            cellRenderer: PercentRenderer
        },
        { 
            field: 'dblow', 
            headerName: '双低因子', 
            sortable: true, 
            filter: true,
            cellRenderer: DblowRenderer
        },
        { field: 'stock_code', headerName: '正股代码', sortable: true, filter: true },
        { field: 'stock_name', headerName: '正股名称', sortable: true, filter: true },
        { 
            field: 'stock_price', 
            headerName: '正股价格', 
            sortable: true, 
            filter: true,
            cellRenderer: NumberRenderer
        },
        { 
            field: 'stock_pct_chg', 
            headerName: '正股涨跌幅', 
            sortable: true, 
            filter: true,
            cellRenderer: PriceChangeRenderer
        },
        { field: 'industry', headerName: '行业', sortable: true, filter: true },
        { field: 'area', headerName: '地区', sortable: true, filter: true },
    ]);

    const defaultColDef = {
        flex: 1,
        minWidth: 100,
        resizable: true,
        floatingFilter: true,
    };

    useEffect(() => {
        fetch('http://localhost:8000/api/convertible-bonds')
            .then(response => response.json())
            .then(result => {
                if (result.status === 'success') {
                    setRowData(result.data);
                }
            })
            .catch(error => console.error('Error fetching data:', error));
    }, []);

    return (
        <div className="w-full h-[800px] ag-theme-custom rounded-md shadow-sm">
            <AgGridReact
                ref={gridRef}
                rowData={rowData}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                pagination={true}
                paginationPageSize={15}
                rowHeight={38}
                headerHeight={44}
                animateRows={true}
                enableCellTextSelection={true}
                suppressRowClickSelection={true}
                suppressContextMenu={false}
            />
        </div>
    );
};

export default ConvertibleBondsGrid; 