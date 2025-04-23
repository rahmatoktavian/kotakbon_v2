import React, { useEffect, useState } from 'react';
import { Space, Typography, Divider, Table, DatePicker, Input, message } from 'antd';
import { supabase } from '../../config/supabase'
import dayjs from 'dayjs';

const TrxList = () => {
  const [messageApi, contextHolder] = message.useMessage();
  const [isLoading, setIsLoading] = useState(false);
  const [dataList, setDataList] = useState([]);

  const [searchFilter, setSearchFilter] = useState('');
  const dateFormat = 'YYYY-MM-DD';
  const [dateFilter, setDateFilter] = useState(dayjs().format(dateFormat));
  
  
  const { Title } = Typography;
  const { Search } = Input;

  useEffect(() => {
    getDataList();
  }, [searchFilter, dateFilter]);

  async function getDataList() {
    setIsLoading(true)
    const { data } = await supabase.from("penjualan")
                      .select('id,tanggal,total_harga,list_produk,pembayaran,keterangan')
                      .ilike('list_produk', '%'+searchFilter+'%')
                      .eq('tanggal', dateFilter)
                      .order('list_produk', { ascending:true })
   
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
      title: 'Total Harga',
      dataIndex: 'total_harga',
      render: (_, record) => (
        <>{record.total_harga.toLocaleString()}</>
      ),
    },
    {
      title: 'Produk',
      dataIndex: 'list_produk',
      key: 'list_produk',
    },
    {
      title: 'Pembayaran',
      dataIndex: 'pembayaran',
      key: 'pembayaran',
    },
    {
      title: 'Keterangan',
      dataIndex: 'keterangan',
      key: 'keterangan',
    },
  ];

  return (
    <>
      {contextHolder}
      <Title level={4} style={{marginTop:10, marginBottom:-10}}>Supplier</Title>
      <Divider />

      <Space>
        <DatePicker 
          defaultValue={dayjs(dateFilter, dateFormat)} 
          format={dateFormat}  
          onChange={(date, dateString) => setDateFilter(dateString)} 
          allowClear={false}
        />
        <Search placeholder="Cari produk" allowClear onChange={(e) => setSearchFilter(e.target.value)} />  
      </Space>
      
      <Table 
        columns={columns} 
        dataSource={dataList} 
        rowKey="id" 
        style={{marginTop:10}} 
        loading={isLoading}
      />
    </>
  )
};
export default TrxList;