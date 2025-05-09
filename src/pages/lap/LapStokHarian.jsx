import React, { useEffect, useState } from 'react';
import { Space, DatePicker, Typography, Divider, Table, Modal, Form, Button, Input, InputNumber, Select, message } from 'antd';
import { EditOutlined, CheckOutlined } from '@ant-design/icons';

import { supabase } from '../../config/supabase';
import dayjs from 'dayjs';

const LapStokHarian = () => {
  const currDate = new Date().toLocaleString("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).slice(0, 10);
  const dateFormat = 'YYYY-MM-DD';

  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [isLoading, setIsLoading] = useState(false);

  const [searchFilter, setSearchFilter] = useState('');
  const [dateFilter, setDateFilter] = useState(dayjs().format(dateFormat));
  const [supplierFilter, setSupplierFilter] = useState('');
  
  const [dataList, setDataList] = useState([]);
  const [dataSupplier, setDataSupplier] = useState([]);
  const pageSize = 10
  const [dataRange, setDataRange] = useState({ start:0, end:(pageSize-1) });
  const [dataTotal, setDataTotal] = useState(0);
  
  const [produkID, setProdukID] = useState(0);
  const [modalShow, setModalShow] = useState(false);
  
  const { Title, Text } = Typography;
  const { Search } = Input;

  const [dataTotalStokAwal, setDataTotalStokAwal] = useState(0);
  const [dataTotalPenjualan, setDataTotalPenjualan] = useState(0);
  const [dataTotalStokAkhir, setDataTotalStokAkhir] = useState(0);
  const [dataTotalModal, setDataTotalModal] = useState(0);

  useEffect(() => {
    getDataList()
    getSupplierList()
  }, [dateFilter, searchFilter, supplierFilter, dataRange.start]);

  async function getDataList() {
    setIsLoading(true)
    let searchFilters = searchFilter != '' ? searchFilter : null;
    let supplierFilters = supplierFilter != '' ? supplierFilter : null;
    const { data } = await supabase.rpc("produk_stok_harian_v2", { 
        date_filter:dateFilter,
        nama_filter:searchFilters, 
        kategori_filter:null, 
        supplier_filter:supplierFilters,
        limit_filter: (dataRange.end - dataRange.start + 1),
        offset_filter: dataRange.start
    })

    // const dataListResult = []
    // data.map((val) => {
    //   if(val.produk_stok_qty > 0) {
    //     dataListResult.push(val)
    //   }
    // })

    setDataList(data)

    let rowTotal = data ? data[0].full_count : 0;
    setDataTotal(rowTotal)

    let totalStokAwal = data ? data[0].total_produk_stok_qty : 0;
    let totalPenjualan = data ? data[0].total_produk_penjualan_qty : 0;
    let totalStokAkhir = data ? (data[0].total_produk_stok_qty - data[0].total_produk_penjualan_qty) : 0;
    let totalModal = data ? data[0].total_produk_penjualan_hpp : 0;

    setDataTotalStokAwal(totalStokAwal)
    setDataTotalPenjualan(totalPenjualan)
    setDataTotalStokAkhir(totalStokAkhir)
    setDataTotalModal(totalModal)

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
      dataIndex: 'nama',
      key: 'nama',
    },
    {
      title: 'Supplier',
      dataIndex: 'supplier_nama',
      key: 'supplier_nama',
    },
    {
      title: 'Stok Awal',
      // dataIndex: 'produk_stok_qty',
      key: 'produk_stok_qty',
      align: 'right',
      render: (_, record) => (
        <>{record.produk_stok_qty ? record.produk_stok_qty : '-'}</>
      ),
    },
    {
      title: 'Total Penjualan',
      key: 'total_penjualan',
      align: 'right',
      render: (_, record) => (
        <>{record.produk_penjualan_qty ? record.produk_penjualan_qty : '-'}</>
      ),
    },
    {
      title: 'Stok Akhir',
      key: 'stok_awal',
      align: 'right',
      render: (_, record) => (
        <>{record.produk_stok_qty ? (record.produk_stok_qty - record.produk_penjualan_qty) : '-'}</>
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
      <Title level={4} style={{marginTop:10, marginBottom:-10}}>Rekap Stok Harian</Title>
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
      
      <Title level={5} style={{ fontSize:11 }} align="right">Biaya Modal: Total Penjualan x Harga Modal</Title>
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
          showSizeChanger: false,
        }}
        summary={() => {
          // dataList.forEach(({ total_produk_stok_qty, total_produk_penjualan_qty, total_produk_penjualan_hpp }) => {
          //   totalStokAwal += total_produk_stok_qty;
          //   totalPenjualan += total_produk_penjualan_qty;
          //   totalStokAkhir += (total_produk_stok_qty - total_produk_penjualan_qty);
          //   totalModal += total_produk_penjualan_hpp;
          // });
          return (
            <>
              <Table.Summary.Row>
                <Table.Summary.Cell index={0}></Table.Summary.Cell>
                <Table.Summary.Cell index={1}>
                  <span style={{fontWeight:'bold'}}>Total</span>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={2} align="right">
                  <span style={{fontWeight:'bold'}}>{dataTotalStokAwal ? dataTotalStokAwal.toLocaleString() : 0}</span>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={3} align="right">
                  <span style={{fontWeight:'bold'}}>{dataTotalPenjualan ? dataTotalPenjualan.toLocaleString() : 0}</span>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={4} align="right">
                  <span style={{fontWeight:'bold'}}>{dataTotalStokAkhir ? dataTotalStokAkhir.toLocaleString() : 0}</span>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={4}></Table.Summary.Cell>
                <Table.Summary.Cell index={5} align="right">
                  <span style={{fontWeight:'bold'}}>{dataTotalModal ? dataTotalModal.toLocaleString() : 0}</span>
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