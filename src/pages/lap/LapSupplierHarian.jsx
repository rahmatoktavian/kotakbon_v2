import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Space, Typography, Divider, Table, DatePicker, Input, Button } from 'antd';
import { UnorderedListOutlined } from '@ant-design/icons';

import { supabase } from '../../config/supabase';
import dayjs from 'dayjs';

const LapSupplierHarian = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [dataList, setDataList] = useState([]);
  
  const dateFormat = 'YYYY-MM-DD';
  const [dateFilter, setDateFilter] = useState(dayjs().format(dateFormat));
  const [namaFilter, setNamaFilter] = useState('');

  const [dataTotalPenjualan, setDataTotalPenjualan] = useState(0);
  const [dataTotalModal, setDataTotalModal] = useState(0);
  const [dataTotalLaba, setDataTotalLaba] = useState(0);

  const { Title } = Typography;
  const { Search } = Input;

  useEffect(() => {
    getDataList();
  }, [dateFilter, namaFilter]);

  async function getDataList() {
    setIsLoading(true)

    let namaFilters = namaFilter != '' ? namaFilter : null;
    const { data } = await supabase.rpc("supplier_harian", { date_filter:dateFilter, nama_filter:namaFilters })
    const dataSorted = [...data].sort((a, b) => b.harga_harian - a.harga_harian);
    setDataList(dataSorted)

    let totalPenjualan = data[0] ? data[0].total_harga_harian : 0;
    let totalModal = data[0] ? data[0].total_hpp_harian : 0;
    let totalLaba = data[0] ? (data[0].total_harga_harian - data[0].total_hpp_harian) : 0;

    setDataTotalPenjualan(totalPenjualan)
    setDataTotalModal(totalModal)
    setDataTotalLaba(totalLaba)

    setIsLoading(false)
  }

  const columns = [
    {
      title: 'Supplier',
      dataIndex: 'supplier_nama',
      key: 'supplier_nama',
    },
    {
      title: 'Rekening',
      key: 'rekening',
      render: (_, record) => (
        <span>{record.rek_bank+' '+record.rek_nomor}</span>
      ),
    },
    {
      title: 'Total Penjualan',
      dataIndex: 'harga_harian',
      align: 'right',
      render: (_, record) => (
        <>{record.harga_harian.toLocaleString()}</>
      ),
    },
    {
      title: 'Total Modal',
      key: 'total_hpp_harian',
      align: 'right',
      render: (_, record) => (
        <>{record.hpp_harian.toLocaleString()}</>
      ),
    },
    {
      title: 'Total Laba',
      key: 'total_laba_harian',
      align: 'right',
      render: (_, record) => (
        <>{(record.harga_harian - record.hpp_harian).toLocaleString()}</>
      ),
    },
    {
      title: 'Produk',
      key: 'action',
      render: (_, record) => (
        <Button onClick={() => navigate('/lapstokharian/', { state: {supplier_param:record.supplier_id, date_param:dateFilter}} )} icon={<UnorderedListOutlined />} type="primary">Produk</Button>
      ),
    },
  ];

  return (
    <>
      <Title level={4} style={{marginTop:10, marginBottom:-10}}>Rekap Penjualan Harian</Title>
      <Divider />

      <Space>
        <DatePicker 
          defaultValue={dayjs(dateFilter, dateFormat)} 
          format={dateFormat}  
          onChange={(date, dateString) => setDateFilter(dateString)} 
          allowClear={false}
        />

        <Search placeholder="Cari supplier" allowClear onChange={(e) => setNamaFilter(e.target.value)} />
            
      </Space>
      
      <Table 
        columns={columns} 
        dataSource={dataList} 
        rowKey="id" 
        style={{marginTop:10}} 
        loading={isLoading}
        pagination={false} 
        summary={() => {
          return (
            <>
              <Table.Summary.Row>
                <Table.Summary.Cell index={0}>
                  <span style={{fontWeight:'bold'}}>Total</span>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={1}></Table.Summary.Cell>
                <Table.Summary.Cell index={2} align="right">
                  <span style={{fontWeight:'bold'}}>{dataTotalPenjualan.toLocaleString()}</span>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={3} align="right">
                  <span style={{fontWeight:'bold'}}>{dataTotalModal.toLocaleString()}</span>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={4} align="right">
                  <span style={{fontWeight:'bold'}}>{dataTotalLaba.toLocaleString()}</span>
                </Table.Summary.Cell>
              </Table.Summary.Row>
            </>
          );
        }}
      />

    </>
  )
};
export default LapSupplierHarian;