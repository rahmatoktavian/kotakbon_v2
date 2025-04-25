import React, { useEffect, useState } from 'react';
import { Space, DatePicker, Typography, Divider, Table, Modal, Form, Button, Input, InputNumber, Select, message } from 'antd';
import { EditOutlined, CheckOutlined } from '@ant-design/icons';

import { supabase } from '../../config/supabase';
import dayjs from 'dayjs';

const LapStokHarian = () => {
  const currDate = new Date().toISOString().slice(0, 10);
  const dateFormat = 'YYYY-MM-DD';

  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [isLoading, setIsLoading] = useState(false);

  const [searchFilter, setSearchFilter] = useState('');
  const [dateFilter, setDateFilter] = useState(dayjs().format(dateFormat));
  const [supplierFilter, setSupplierFilter] = useState('');
  const [dataRange, setDataRange] = useState({ start:0, end:9 });
  const [dataTotal, setDataTotal] = useState(0);
  const [dataList, setDataList] = useState([]);
  const [dataSupplier, setDataSupplier] = useState([]);

  const [produkID, setProdukID] = useState(0);
  const [modalShow, setModalShow] = useState(false);
  
  const { Title, Text } = Typography;
  const { Search } = Input;

  useEffect(() => {
    getDataList()
    getSupplierList()
  }, [dateFilter, searchFilter, supplierFilter, dataRange.start]);

  async function getDataList() {
    setIsLoading(true)

    let supplierFilters = supplierFilter != '' ? supplierFilter : null;
    const { data } = await supabase.rpc("lap_stok_harian", { date_filter:dateFilter, supplier_filter:supplierFilters })
    
    const dataListResult = []
    data.map((val) => {
      if(val.produk_stok_qty > 0) {
        dataListResult.push(val)
      }
    })

    setDataList(dataListResult)
    setIsLoading(false)
  }

  async function getSupplierList() {
    setIsLoading(true)
    const { data } = await supabase.from("supplier")
                      .select('id,nama')
                      .order('nama', { ascending:true })
    
    const listSupplier = []
    listSupplier.push({ value:'', label:'Semua Supplier'})
    data.map((val) => (
      listSupplier.push({ value:val.id, label:val.nama})
    ))
    setDataSupplier(listSupplier)
    setIsLoading(false)
  }

  const onTableChange = (newPagination) => {
    let startRange = (newPagination.current - 1) * newPagination.pageSize;
    let endRange = newPagination.current * newPagination.pageSize - 1;
    setDataRange({
      start: startRange,
      end: endRange,
    });
  };

  async function showDetail(produk) {
    setIsLoading(true)
    setModalShow(true)

    form.resetFields()
    setProdukID(produk.id)
    
    const { data } = await supabase.from("produk_stok")
                      .select('qty')
                      .eq('tanggal', dateFilter)
                      .eq('produk_id', produk.id)
                      .single()

    form.setFieldsValue({
      produk: produk.nama,
      qty:data ? data.qty : 0,
    });

    setIsLoading(false)
  }

  async function onFinish(values) {
    setIsLoading(true)
    
    const { data:check_stok } = await supabase
                                .from('produk_stok')
                                .select('id')
                                .eq('tanggal', dateFilter)
                                .eq('produk_id', produkID)
                                .single()
    if(check_stok) {
      await supabase
      .from('produk_stok')
      .update({
        qty:values.qty,
      })
      .eq('id', check_stok.id)

    } else {
      await supabase
      .from('produk_stok')
      .insert({ 
        tanggal:dateFilter,
        produk_id:produkID,
        qty:values.qty,
      })
    }

    messageApi.open({
      type: 'success',
      content: 'Berhasil simpan data',
    });

    getDataList()
    setModalShow(false)
    setIsLoading(false)
  }

  const columns = [
    {
      title: 'Produk',
      dataIndex: 'produk_nama',
      key: 'produk_nama',
    },
    {
      title: 'Supplier',
      dataIndex: 'supplier_nama',
      key: 'supplier_nama',
    },
    {
      title: 'Stok Awal',
      dataIndex: 'produk_stok_qty',
      key: 'produk_stok_qty',
      align: 'right',
    },
    {
      title: 'Total Penjualan',
      key: 'total_penjualan',
      align: 'right',
      render: (_, record) => (
        <>{record.produk_penjualan_qty ? record.produk_penjualan_qty : 0}</>
      ),
    },
    {
      title: 'Stok Akhir',
      key: 'stok_awal',
      align: 'right',
      render: (_, record) => (
        <>{record.produk_penjualan_qty ? (record.produk_stok_qty - record.produk_penjualan_qty) : record.produk_stok_qty}</>
      ),
    },
    {
      title: 'Harga Modal',
      key: 'hpp',
      align: 'right',
      render: (_, record) => (
        <>{record.hpp.toLocaleString()}</>
      ),
    },
    {
      title: 'Biaya Modal',
      key: 'total_biaya_modal',
      align: 'right',
      render: (_, record) => (
        <>{record.produk_penjualan_hpp ? record.produk_penjualan_hpp.toLocaleString() : 0}</>
      ),
    },
  ];

  return (
    <>
      {contextHolder}
      <Title level={4} style={{marginTop:10, marginBottom:-10}}>Stok Produk</Title>
      <Divider />
    
      <Space>
        <DatePicker 
          defaultValue={dayjs(dateFilter, dateFormat)} 
          format={dateFormat}  
          onChange={(date, dateString) => setDateFilter(dateString)} 
          allowClear={false}
        />
        <Search placeholder="Cari produk" allowClear onChange={(e) => setSearchFilter(e.target.value)} />
        <Select
                  showSearch
                  optionFilterProp="label"
                  value={supplierFilter}
                  onChange={(value) => setSupplierFilter(value)}
                  options={dataSupplier} 
                  style={{ width:200 }}
                />
      </Space>
      
      <Title level={5} style={{ fontSize:11 }} align="right">Biaya Modal: Harga Modal x Total Penjualan</Title>
      <Table 
        columns={columns} 
        dataSource={dataList} 
        rowKey="id" 
        style={{marginTop:10}} 
        loading={isLoading}
        onChange={onTableChange}
        pagination={{
          total: dataTotal,
          hideOnSinglePage: true,
        }}
        summary={dataList => {
          let totalStokAwal = 0;
          let totalPenjualan = 0;
          let totalStokAkhir = 0;
          let totalModal = 0;
          dataList.forEach(({ produk_stok_qty, produk_penjualan_qty, produk_penjualan_hpp }) => {
            totalStokAwal += produk_stok_qty;
            totalPenjualan += produk_penjualan_qty;
            totalStokAkhir += (produk_stok_qty-produk_penjualan_qty);
            totalModal += produk_penjualan_hpp;
          });
          return (
            <>
              <Table.Summary.Row>
                <Table.Summary.Cell index={0}></Table.Summary.Cell>
                <Table.Summary.Cell index={1}>
                  <span style={{fontWeight:'bold'}}>Total</span>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={2} align="right">
                  <span style={{fontWeight:'bold'}}>{totalStokAwal.toLocaleString()}</span>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={3} align="right">
                  <span style={{fontWeight:'bold'}}>{totalPenjualan.toLocaleString()}</span>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={4} align="right">
                  <span style={{fontWeight:'bold'}}>{totalStokAkhir.toLocaleString()}</span>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={4}></Table.Summary.Cell>
                <Table.Summary.Cell index={5} align="right">
                  <span style={{fontWeight:'bold'}}>{totalModal.toLocaleString()}</span>
                </Table.Summary.Cell>
              </Table.Summary.Row>
            </>
          );
        }}
      />

      <Modal 
        title="Data" 
        open={modalShow}
        onCancel={() => setModalShow(false)}
        footer={[]}
      >
        <Form
          name="basic"
          autoComplete="off"
          layout="vertical"
          form={form}
          onFinish={onFinish}
        >
          <Form.Item
            label="Produk"
            name="produk"
            rules={[{ required: true }]}
          >
            <Input disabled={true} />
          </Form.Item>
          <Form.Item
            label="Jumlah"
            name="qty"
            rules={[{ required: true, type: 'number', min:0 }]}
          >
            <InputNumber />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button key="save" type="primary" htmlType="submit" icon={<CheckOutlined />} loading={isLoading}>
                Simpan
              </Button>
              <Button key="back" onClick={() => setModalShow(false)}>
                Batal
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
};
export default LapStokHarian;