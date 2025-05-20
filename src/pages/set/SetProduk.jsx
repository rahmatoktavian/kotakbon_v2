import React, { useEffect, useState } from 'react';
import { Space, Typography, Divider, Table, Modal, Form, Button, Input, InputNumber, Select, Popconfirm, message } from 'antd';
import { EditOutlined, PlusOutlined, CheckOutlined, DeleteOutlined } from '@ant-design/icons';
import { supabase } from '../../config/supabase'

const SetProduk = () => {
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [isLoading, setIsLoading] = useState(false);

  const [searchFilter, setSearchFilter] = useState('');
  const [kategoriFilter, setKategoriFilter] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('');
  const [dataRange, setDataRange] = useState({ start:0, end:9 });
  const [dataTotal, setDataTotal] = useState(0);

  const [dataList, setDataList] = useState([]);
  const [dataKategori, setDataKategori] = useState([]);
  const [dataSupplier, setDataSupplier] = useState([]);
  const [id, setID] = useState(0);
  const [modalShow, setModalShow] = useState(false);
  
  const { Title } = Typography;
  const { Search } = Input;

  useEffect(() => {
    getKategoriList();
    getSupplierList();
    getDataList();
  }, [searchFilter, kategoriFilter, supplierFilter, dataRange.start]);

  async function getDataList() {
    setIsLoading(true)
    if(searchFilter != '') {
      setDataRange({
        start:0,
        end:9,
      });
    }
    
    let query = supabase.from("produk")
                      .select('id,nama,harga,hpp,kategori(nama),supplier(nama)', { count:'exact' })
                      .ilike('nama', '%'+searchFilter+'%')
                      .order('nama', { ascending:true })
                      .range(dataRange.start, dataRange.end)
    
    if (kategoriFilter != '')
      query = query.eq('kategori_id', kategoriFilter)
    
    if (supplierFilter != '')
      query = query.eq('supplier_id', supplierFilter)

    const { data, count } = await query;
    
    setDataList(data)
    setDataTotal(count)
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

  async function getKategoriList() {
      setIsLoading(true)
      const { data } = await supabase.from("kategori")
                        .select('id,nama')
                        .order('nama', { ascending:true })
      
      const listKategori = []
      listKategori.push({ value:'', label:'Semua Kategori'})
      data.map((val) => (
        listKategori.push({ value:val.id, label:val.nama})
      ))
      setDataKategori(listKategori)
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

  async function showDetail(id) {
    setIsLoading(true)
    setModalShow(true)

    form.resetFields()
    setID(id)

    //supplier
    const { data:supplier } = await supabase.from("supplier")
                      .select('id,nama')
                      .order('nama', { ascending:true })

    const listSupplier = []
    listSupplier.push({ value:'', label:'Tanpa Supplier'})
    supplier.map((val) => (
      listSupplier.push({ value:val.id, label:val.nama})
    ))
    setDataSupplier(listSupplier)
    
    if(id != 0) {
      const { data } = await supabase.from("produk")
                        .select('id,kategori_id,supplier_id,nama,harga,hpp')
                        .eq('id',id)
                        .single()
                        
      form.setFieldsValue({ 
        kategori:data.kategori_id,
        supplier:data.supplier_id,
        nama:data.nama,
        harga:data.harga,
        hpp:data.hpp,
      });
    }

    setIsLoading(false)
  }

  async function onFinish(values) {
    setIsLoading(true)
    
    const { data:{user} } = await supabase.auth.getUser()
    const currTime = new Date()
    
    if(id != 0) {
      const { error } = await supabase
      .from('produk')
      .update({ 
        kategori_id:values.kategori,
        supplier_id:values.supplier,
        nama:values.nama,
        harga:values.harga,
        hpp:values.hpp,
        updated_by: user.email,
        updated_at: currTime,
       })
      .eq('id',id)

      if(error) {
          messageApi.open({
            type: 'error',
            content: error.message,
          });
      } else {
          messageApi.open({
            type: 'success',
            content: 'Berhasil simpan data',
          });
      }

    } else {
      //check name is exist
      const { data:exist } = await supabase
        .from('produk')
        .select('id')
        .ilike('nama', '%'+values.nama+'%')
        .single()

      if(exist) {
          messageApi.open({
            type: 'error',
            content: 'Nama sudah digunakan',
          })

      } else {
        const { error } = await supabase
        .from('produk')
        .insert({ 
          kategori_id:values.kategori,
          supplier_id:values.supplier,
          nama:values.nama,
          harga:values.harga,
          hpp:values.hpp,
          created_by: user.email,
          created_at: currTime,
        })

        if(error) {
            messageApi.open({
              type: 'error',
              content: error.message,
            });
        } else {
            messageApi.open({
              type: 'success',
              content: 'Berhasil simpan data',
            });
        }
      }
    }

    getDataList()
    setModalShow(false)
    setIsLoading(false)
  }

  async function onDelete() {
    setIsLoading(true)
    const { error } = await supabase
              .from('produk')
              .delete()
              .eq('id',id)
        
    if(error) {
        messageApi.open({
          type: 'error',
          content: error.message,
        });
    } else {
        messageApi.open({
          type: 'success',
          content: 'Berhasil hapus data',
        });
    }

    getDataList()
    setModalShow(false)
    setIsLoading(false)
  }

  const columns = [
    {
      title: 'Nama',
      dataIndex: 'nama',
      key: 'nama',
    },
    {
      title: 'Kategori',
      key: 'kategori_nama',
      render: (_, record) => (
        <>{record.kategori.nama}</>
      ),
    },
    {
      title: 'Supplier',
      key: 'supplier_nama',
      render: (_, record) => (
        <>{record.supplier.nama}</>
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
      title: 'Harga Jual',
      key: 'harga',
      align: 'right',
      render: (_, record) => (
        <>{record.harga.toLocaleString()}</>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Button onClick={() => showDetail(record.id)} icon={<EditOutlined />} type="primary">Ubah</Button>
      ),
    },
  ];

  return (
    <>
      {contextHolder}
      <Title level={4} style={{marginTop:10, marginBottom:-10}}>Produk</Title>
      <Divider />
    
      <Space>
        <Button onClick={() => showDetail(0)} icon={<PlusOutlined />} type="primary">Tambah</Button>
        <Search placeholder="Cari nama" allowClear onChange={(e) => setSearchFilter(e.target.value)} />
        <Select
          showSearch
          optionFilterProp="label"
          value={kategoriFilter}
          onChange={(value) => setKategoriFilter(value)}
          options={dataKategori} 
          style={{ width:200 }}
        />
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
          showSizeChanger: false,
        }}
        // scroll={{ x: 500 }}
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
            label="Nama"
            name="nama"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Kategori"
            name="kategori"
            rules={[{ required: true }]}
          >
            <Select
              showSearch
              optionFilterProp="label"
              placeholder="Pilih"
              onChange={(value) => form.setFieldsValue({ kategori:value })}
              options={dataKategori} 
            />
          </Form.Item>
          <Form.Item
            label="Supplier"
            name="supplier"
            rules={[{ required: true }]}
          >
            <Select
              showSearch
              optionFilterProp="label"
              placeholder="Tanpa Supplier"
              onChange={(value) => form.setFieldsValue({ supplier:value })}
              options={dataSupplier} 
            />
          </Form.Item>
          <Form.Item
            label="Harga Modal"
            name="hpp"
            rules={[{ required: true }]}
          >
            <InputNumber formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
          </Form.Item>
          <Form.Item
            label="Harga Jual"
            name="harga"
            rules={[{ required: true }]}
          >
            <InputNumber formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button key="save" type="primary" htmlType="submit" icon={<CheckOutlined />} loading={isLoading}>
                Simpan
              </Button>
              <Button key="back" onClick={() => setModalShow(false)}>
                Batal
              </Button>
              <Popconfirm
                title="Peringatan"
                description="Yakin menghapus data?"
                onConfirm={() => onDelete()}
                okText="Ya"
                cancelText="Batal"
              >
                {id != 0 &&
                <Button key="delete" color="danger" variant='outlined' icon={<DeleteOutlined />}>
                  Hapus
                </Button>
                }
              </Popconfirm>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
};
export default SetProduk;