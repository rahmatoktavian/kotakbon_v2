import React, { useEffect, useState } from 'react';
import { Space, DatePicker, Typography, Divider, Table, Modal, Form, Button, Input, InputNumber, Select, Popconfirm, message } from 'antd';
import { EditOutlined, PlusOutlined, CheckOutlined, DeleteOutlined } from '@ant-design/icons';

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
  const [dataRange, setDataRange] = useState({ start:0, end:9 });
  const [dataTotal, setDataTotal] = useState(0);

  const [dataList, setDataList] = useState([]);
  const [dataProduk, setDataProduk] = useState([]);

  const [id, setID] = useState(0);
  const [modalShow, setModalShow] = useState(false);
  
  const { Title } = Typography;
  const { Search } = Input;

  useEffect(() => {
    getDataList()
  }, [dateFilter, searchFilter, dataRange.start]);

  async function getDataList() {
    setIsLoading(true)
    const { data, count } = await supabase.from("produk_stok")
                      .select('id,tanggal,qty,produk(nama,harga)')
                      .eq('tanggal', dateFilter)
                      .ilike('produk.nama', '%'+searchFilter+'%')
                      .order('id', { ascending:false })
                      // .range(dataRange.start, dataRange.end)
    
    setDataList(data)
    setDataTotal(count);
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

  async function showDetail(id) {
    setIsLoading(true)
    setModalShow(true)

    form.resetFields()
    setID(id)

    //produk
    const { data:produk } = await supabase.from("produk")
                      .select('id,nama,harga')
                      .order('nama', { ascending:true })

    const listProduk = []
    produk.map((val) => (
      listProduk.push({ value:val.id, label:val.nama+' [Rp '+val.harga.toLocaleString()+']'})
    ))
    setDataProduk(listProduk)
    
    if(id != 0) {
      const { data } = await supabase.from("produk_stok")
                        .select('id,produk_id,qty')
                        .eq('id',id)
                        .single()
                        
      form.setFieldsValue({
        produk:data.produk_id,
        qty:data.qty,
      });
    }

    setIsLoading(false)
  }

  async function onFinish(values) {
    setIsLoading(true)
    if(id != 0) {
      const { error } = await supabase
      .from('produk_stok')
      .update({ 
        qty:values.qty,
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
      const { data:check_stok } = await supabase
                                  .from('produk_stok')
                                  .select('id')
                                  .eq('tanggal', dateFilter)
                                  .eq('produk_id', values.produk)
                                  .single()
      if(check_stok) {
        messageApi.open({
          type: 'error',
          content: 'Stok produk sudah ada di tanggal sama',
        });

      } else {
        const { error } = await supabase
        .from('produk_stok')
        .insert({ 
          tanggal:dateFilter,
          produk_id:values.produk,
          qty:values.qty,
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
              .from('produk_stok')
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
      title: 'Produk',
      dataIndex: 'produk',
      render: (_, record) => (
        <>{record.produk ? record.produk.nama : ''}</>
      ),
      
    },
    {
      title: 'Jumlah',
      key: 'qty',
      dataIndex: 'qty',
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
      <Title level={4} style={{marginTop:10, marginBottom:-10}}>Stok Produk</Title>
      <Divider />
    
      <Space>
        <Button onClick={() => showDetail(0)} icon={<PlusOutlined />} type="primary">Tambah</Button>
        <DatePicker 
          defaultValue={dayjs(dateFilter, dateFormat)} 
          format={dateFormat}  
          onChange={(date, dateString) => setDateFilter(dateString)} 
          allowClear={false}
        />
        {/* <Search placeholder="Cari produk" allowClear onChange={(e) => setSearchFilter(e.target.value)} /> */}
      </Space>
      
      <Table 
        columns={columns} 
        dataSource={dataList} 
        rowKey="id" 
        style={{marginTop:10}} 
        loading={isLoading}
        onChange={onTableChange}
        pagination={{
          pageSize:100
        }}
        scroll={{ x: 500 }}
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
            <Select
              showSearch
              optionFilterProp="label"
              placeholder="Pilih"
              onChange={(value) => form.setFieldsValue({ produk:value })}
              options={dataProduk} 
              disabled={id != 0 ? true : false}
            />
          </Form.Item>
          <Form.Item
            label="Jumlah"
            name="qty"
            rules={[{ required: true }]}
          >
            <InputNumber min={1} />
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
export default SetStokProduk;