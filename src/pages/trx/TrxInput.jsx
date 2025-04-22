import React, { useEffect, useState } from 'react';
import { Col, Row, Spin, Card, List, Typography, Divider, Form, Button, Input, Descriptions, Select, Tabs, message } from 'antd';
import { EditOutlined, PlusOutlined, MinusOutlined, CheckOutlined, } from '@ant-design/icons';
import { supabase } from '../../config/supabase'

const TrxInput = () => {
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [isLoading, setIsLoading] = useState(false);

  const [dataProduk, setDataProduk] = useState([]);
  const [dataKategori, setDataKategori] = useState([]);
  
  const { Title } = Typography;
  const { Search } = Input;

  useEffect(() => {
    getKategoriList();
    getProdukList();
  }, []);

  async function getKategoriList() {
    setIsLoading(true)
    const { data } = await supabase.from("kategori")
                      .select('id,nama')
                      .order('nama', { ascending:true })
    
    const listKategori = []
    listKategori.push({ key:'', label:'Semua'})
    data.map((val) => (
      listKategori.push({ key:val.id, label:val.nama})
    ))

    setDataKategori(listKategori)
    setIsLoading(false)
  }

  async function getProdukList(kategori='', search='') {
    setIsLoading(true)
    let query = supabase.from("produk")
                    .select('id,nama,harga')
                    .ilike('nama', '%'+search+'%')
                    // .order('nama', { ascending:true })

    if (kategori != '')
      query = query.eq('kategori_id', kategori)

    const { data } = await query;
    setDataProduk(data)
    setIsLoading(false)
  }

  const dataPembayaran = [
    { label: 'Cash', value: '10.000' },
    { label: 'QRIS', value: '10.000' },
    { label: 'Transfer', value: '10.000' },
  ];

  const dataPesanan = [
    { nama: 'Nama Produk', harga: '10.000' },
    { nama: 'Nama Produk', harga: '10.000' },
    { nama: 'Nama Produk', harga: '10.000' },
  ];

  const summaryItems = [
    {
      key: '1',
      span: 'filled',
      label: 'Total',
      children: 'Rp 50.000',
    },
    {
      key: '2',
      span: 'filled',
      label: 'Pembayaran',
      children: <Select
                    placeholder="Pilih"
                    onChange={(value) => console.log('')}
                    options={dataPembayaran}
                    style={{ width:100 }} 
                  />,
    },
  ]

  return (
    <>
      {contextHolder}

      <Row>
        <Col span={16}>
          <Spin spinning={isLoading}>
          <Title level={4} style={{marginTop:10, marginBottom:-10}}>Pilih Produk</Title>
          <Divider />

          <Tabs defaultActiveKey="1" items={dataKategori} onChange={(value) => getProdukList(value, '')} style={{ marginLeft:10, marginTop:-20 }} />

          <Search placeholder="Cari produk" allowClear onSearch={(value) => getProdukList('', value)} style={{ marginBottom:20 }} />  

          <Row gutter={16}>
            {dataProduk && dataProduk.map((produk) => (
            <Col span={8} style={{marginBottom:20}}>
              <Card title={produk.nama} variant="borderless" type="inner">
                Rp. {produk.harga.toLocaleString()}
                <Button block size="small" type="primary" style={{marginTop:10}}>
                Pilih
                </Button>
              </Card>
            </Col>
            ))}
          </Row>
          </Spin>
        </Col>

        <Col span={1}></Col>
        <Col span={7}>
          <Title level={4} style={{marginTop:10, marginBottom:-10}}>Pesanan</Title>
          <Divider />

          <List
            itemLayout="horizontal"
            dataSource={dataPesanan}
            renderItem={(item, index) => (
              <List.Item>
                <List.Item.Meta
                  title={item.nama}
                  description={'Rp '+item.harga}
                />
                <Input
                  addonBefore={<Button icon={<MinusOutlined />} size="small" />}
                  addonAfter={<Button icon={<PlusOutlined />} size="small" />}
                  defaultValue={1}
                  style={{ width:150, textAlign:'center' }}
                />
              </List.Item>
            )}
          />
          
          <Descriptions bordered items={summaryItems} style={{ marginBottom:20 }} />

          <Button block key="save" type="primary" icon={<CheckOutlined />} loading={isLoading}style={{marginBottom:10}} size="large">
            Bayar
          </Button>
          <Button block key="draft" variant="outlined" color="primary" icon={<EditOutlined />} loading={isLoading} size="large">
            Pesan
          </Button>
        </Col>
      </Row>
      
    </>
  )
};
export default TrxInput;