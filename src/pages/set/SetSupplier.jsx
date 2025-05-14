import React, { useEffect, useState } from 'react';
import { Space, Typography, Divider, Table, Modal, Form, Button, Input, Popconfirm, message } from 'antd';
import { EditOutlined, PlusOutlined, CheckOutlined, DeleteOutlined } from '@ant-design/icons';
import { supabase } from '../../config/supabase'

const SetSupplier = () => {
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [isLoading, setIsLoading] = useState(false);

  const [searchFilter, setSearchFilter] = useState('');
  const [dataList, setDataList] = useState([]);
  const [dataRange, setDataRange] = useState({ start:0, end:9 });
  const [dataTotal, setDataTotal] = useState(0);
  
  const [id, setID] = useState(0);
  const [modalShow, setModalShow] = useState(false);
  
  const { Title } = Typography;
  const { Search } = Input;

  useEffect(() => {
    getDataList();
  }, [searchFilter, dataRange.start]);

  async function getDataList() {
    setIsLoading(true)
    const { data,count } = await supabase.from("supplier")
                      .select('id,nama', { count:'exact' })
                      .ilike('nama', '%'+searchFilter+'%')
                      .order('nama', { ascending:true })
                      .range(dataRange.start, dataRange.end)
   
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

    const { data:{user} } = await supabase.auth.getUser()
    const currTime = new Date()
    
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
      //check name is exist
      const { data:exist } = await supabase
        .from('supplier')
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
        .from('supplier')
        .insert({ 
          nama:values.nama,
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
        <Search placeholder="Cari nama" allowClear onChange={(e) => setSearchFilter(e.target.value)} />
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