import React, { useEffect, useState } from 'react';
import { Space, Typography, Divider, Table, Modal, Form, Button, Input, Popconfirm, message } from 'antd';
import { EditOutlined, PlusOutlined, CheckOutlined, DeleteOutlined } from '@ant-design/icons';
import { supabase } from '../../config/supabase'

const SetSupplier = () => {
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [isLoading, setIsLoading] = useState(false);

  const [dataList, setDataList] = useState([]);
  const [id, setID] = useState(0);
  const [modalShow, setModalShow] = useState(false);
  
  const { Title } = Typography;
  const { Search } = Input;

  useEffect(() => {
    getDataList();
  }, []);

  async function getDataList(search='') {
    setIsLoading(true)
    const { data } = await supabase.from("supplier")
                      .select('id,nama')
                      .ilike('nama', '%'+search+'%')
                      .order('nama', { ascending:true })
   
    setDataList(data)
    setIsLoading(false)
  }

  async function showDetail(id) {
    setIsLoading(true)
    setModalShow(true)

    form.resetFields()
    setID(id)

    if(id != 0) {
      const { data } = await supabase.from("supplier")
                        .select('id,nama')
                        .eq('id',id)
                        .single()
                        
      form.setFieldsValue({ nama:data.nama });
    }

    setIsLoading(false)
  }

  async function onFinish(values) {
    setIsLoading(true)
    if(id != 0) {
      const { error } = await supabase
      .from('supplier')
      .update({ nama:values.nama })
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
      const { error } = await supabase
      .from('supplier')
      .insert({ nama:values.nama })

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

    messageApi.open({
      type: 'success',
      content: 'Berhasil simpan data',
    });

    getDataList()
    setModalShow(false)
    setIsLoading(false)
  }

  async function onDelete() {
    setIsLoading(true)
    const { error } = await supabase
          .from('supplier')
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
      <Title level={4} style={{marginTop:10, marginBottom:-10}}>Supplier</Title>
      <Divider />

      <Space>
        <Button onClick={() => showDetail(0)} icon={<PlusOutlined />} type="primary">Tambah</Button>
        <Search placeholder="Cari nama" allowClear onSearch={(text) => getDataList(text)} />  
      </Space>
      
      <Table 
        columns={columns} 
        dataSource={dataList} 
        rowKey="id" 
        style={{marginTop:10}} 
        loading={isLoading}
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
export default SetSupplier;