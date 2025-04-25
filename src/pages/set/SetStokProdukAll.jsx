import React, { useEffect, useState } from 'react';
import { Space, DatePicker, Typography, Divider, Table, Modal, Form, Button, Input, InputNumber, Select, message } from 'antd';
import { EditOutlined, CheckOutlined } from '@ant-design/icons';

import { supabase } from '../../config/supabase';
import dayjs from 'dayjs';

const SetStokProduk = () => {
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
    let query = supabase.from("produk")
                    .select('id,nama,harga,supplier(nama),produk_stok(qty)', { count:'exact' })
                    .eq('produk_stok.tanggal', dateFilter)
                    .ilike('nama', '%'+searchFilter+'%')
                    .order('nama', { ascending:true })
                    .range(dataRange.start, dataRange.end)

    if (supplierFilter != '')
      query = query.eq('supplier_id', supplierFilter)

    const { data, count } = await query;
    
    setDataList(data)
    setDataTotal(count);
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
      key: 'supplier',
      render: (_, record) => (
        <>{record.supplier.nama}</>
      ),
    },
    {
      title: 'Harga',
      key: 'harga',
      align: 'right',
      render: (_, record) => (
        <>{record.harga.toLocaleString()}</>
      ),
    },
    {
      title: 'Stok',
      key: 'stok',
      align: 'right',
      render: (_, record) => (
        <>{record.produk_stok[0] ? record.produk_stok[0].qty : 0}</>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Button onClick={() => showDetail(record)} icon={<EditOutlined />} type="primary">Ubah</Button>
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
export default SetStokProduk;