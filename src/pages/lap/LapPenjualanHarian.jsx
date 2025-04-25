import React, { useEffect, useState } from 'react';
import { Space, Typography, Divider, Table, DatePicker, Select } from 'antd';

import { supabase } from '../../config/supabase';
import dayjs from 'dayjs';

const LapPenjualanHarian = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [dataList, setDataList] = useState([]);
  
  const dateFormat = 'YYYY-MM-DD';
  const [startDateFilter, setStartDateFilter] = useState(dayjs().format(dateFormat));
  const [endDateFilter, setEndDateFilter] = useState(dayjs().format(dateFormat));
  const [metodeBayarFilter, setMetodeBayarFilter] = useState('');
  
  const dataMetodeBayar = [
    { key:0, label: 'Semua Metode Bayar', value: '' },
    { key:1, label: 'CASH', value: 'CASH' },
    { key:2, label: 'QRIS', value: 'QRIS' },
    { key:3, label: 'TRANSFER', value: 'TRANSFER' },
  ];
  
  const { Title } = Typography;

  useEffect(() => {
    getDataList();
  }, [startDateFilter, endDateFilter]);

  async function getDataList() {
    setIsLoading(true)
    const { data } = await supabase.rpc("lap_penjualan_harian", { start_date_filter:startDateFilter, end_date_filter:endDateFilter })
    setDataList(data)
    setIsLoading(false)
  }

  const columns = [
    {
      title: 'Tanggal',
      dataIndex: 'tanggal',
      key: 'tanggal',
    },
    {
      title: 'Total Penjualan',
      dataIndex: 'total_harga_harian',
      align: 'right',
      render: (_, record) => (
        <>{record.total_harga_harian.toLocaleString()}</>
      ),
    },
    {
      title: 'Total Modal',
      key: 'total_hpp_harian',
      align: 'right',
      render: (_, record) => (
        <>{record.total_hpp_harian.toLocaleString()}</>
      ),
    },
    {
      title: 'Total Laba',
      key: 'total_laba_harian',
      align: 'right',
      render: (_, record) => (
        <>{(record.total_harga_harian - record.total_hpp_harian).toLocaleString()}</>
      ),
    },
  ];

  return (
    <>
      <Title level={4} style={{marginTop:10, marginBottom:-10}}>Rekap Penjualan Harian</Title>
      <Divider />

      <Space>
        <DatePicker 
          defaultValue={dayjs(startDateFilter, dateFormat)} 
          format={dateFormat}  
          onChange={(date, dateString) => setStartDateFilter(dateString)} 
          allowClear={false}
        />
        <DatePicker 
          defaultValue={dayjs(endDateFilter, dateFormat)} 
          format={dateFormat}  
          onChange={(date, dateString) => setEndDateFilter(dateString)} 
          allowClear={false}
        />
        {/* <Select
          showSearch
          optionFilterProp="label"
          value={metodeBayarFilter}
          onChange={(value) => setMetodeBayarFilter(value)}
          options={dataMetodeBayar} 
          style={{ width:200 }}
        /> */}
      </Space>
      
      <Table 
        columns={columns} 
        dataSource={dataList} 
        rowKey="id" 
        style={{marginTop:10}} 
        loading={isLoading}
        pagination={false} 
        summary={dataList => {
          let totalPenjualan = 0;
          let totalModal = 0;
          let totalLaba = 0;
          dataList.forEach(({ total_harga_harian, total_hpp_harian }) => {
            totalPenjualan += total_harga_harian;
            totalModal += total_hpp_harian;
            totalLaba += (total_harga_harian-total_hpp_harian);
          });
          return (
            <>
              <Table.Summary.Row>
                <Table.Summary.Cell index={0}>
                  <span style={{fontWeight:'bold'}}>Total</span>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={1} align="right">
                  <span style={{fontWeight:'bold'}}>{totalPenjualan.toLocaleString()}</span>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={2} align="right">
                  <span style={{fontWeight:'bold'}}>{totalModal.toLocaleString()}</span>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={3} align="right">
                  <span style={{fontWeight:'bold'}}>{totalLaba.toLocaleString()}</span>
                </Table.Summary.Cell>
              </Table.Summary.Row>
            </>
          );
        }}
      />

    </>
  )
};
export default LapPenjualanHarian;