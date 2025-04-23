import React, { useEffect, useState } from 'react';
import { Col, Row, Spin, Card, List, Typography, Divider, Form, Button, Input, Descriptions, Select, Tabs, message } from 'antd';
import { EditOutlined, PlusOutlined, MinusOutlined, CheckOutlined, } from '@ant-design/icons';
import { supabase } from '../../config/supabase'

const TrxInput = () => {
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [isLoading, setIsLoading] = useState(false);

  const [searchFilter, setSearchFilter] = useState('');
  const [kategoriFilter, setKategoriFilter] = useState('');
  const [dataProduk, setDataProduk] = useState([]);
  const [dataKategori, setDataKategori] = useState([]);

  const [dataPesanan, setDataPesanan] = useState([]);
  const [dataPesananTotal, setDataPesananTotal] = useState(0);
  const [dataPesananPayment, setDataPesananPayment] = useState('cash');
  const [dataPesananNote, setDataPesananNote] = useState('');
  
  const { Title } = Typography;
  const { Search } = Input;

  useEffect(() => {
    getKategoriList();
    getProdukList();
  }, [searchFilter,kategoriFilter]);

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

  async function getProdukList() {
    setIsLoading(true)
    let query = supabase.from("produk")
                    .select('id,kategori_id,nama,harga,hpp,stok')
                    .ilike('nama', '%'+searchFilter+'%')
                    .order('nama', { ascending:true })

    if (kategoriFilter != '')
      query = query.eq('kategori_id', kategoriFilter)

    const { data } = await query;
    setDataProduk(data)
    setIsLoading(false)
  }

  function onPesanInsert(produk) {
    //check already exist
    let isExist = false
    dataPesanan.map((val) => {
      if(val.id == produk.id)
        isExist = true    
    })

    if(!isExist) {
      //insert new
      produk.qty = 1
      let newDataPesanan = [...dataPesanan, produk];
      setDataPesanan(dataPesanan => newDataPesanan );

      //update total
      let pesananTotal = 0
      newDataPesanan.forEach(function(val, idx){
        pesananTotal += val.qty * val.harga
      })
      setDataPesananTotal(pesananTotal)
    }
  }

  function onPesanUpdate(tipe, item, index) {    
    const newDataPesanan = [...dataPesanan];

    let doDelete = false
    newDataPesanan.forEach(function(val, idx){
      if(idx == index) {
        if(tipe == 'minus' && val.qty == 1)
          doDelete = true

        newDataPesanan[idx].qty = tipe == 'plus' ? val.qty+1  : val.qty-1;
      }
    })
    setDataPesanan(newDataPesanan);
      
    if(doDelete) {
      setDataPesanan([
        ...dataPesanan.slice(0, index),
        ...dataPesanan.slice(index + 1)
      ]);
    }

    let pesananTotal = 0
    newDataPesanan.forEach(function(val, idx){
      pesananTotal += val.qty * val.harga
    })
    setDataPesananTotal(pesananTotal)
  }

  async function onBayar() {
    setIsLoading(true)
    let currDate = new Date().toISOString().slice(0, 10);

    let total_produk = 0;
    let total_hpp = 0;
    let list_produk_label = '';
    let list_produk_newstok = []
    dataPesanan.map((val, idx) => {
      total_produk = total_produk + val.qty
      total_hpp = total_hpp + (val.qty * val.hpp)
      list_produk_label = idx > 0 ? list_produk_label + ','+val.nama : list_produk_label + val.nama

      list_produk_newstok.push({ 
        id:val.id, 
        nama:val.nama,
        kategori_id:val.kategori_id,
        harga:val.harga,
        hpp:val.hpp,
        stok:(val.stok-val.qty) })
    })
    list_produk_label = list_produk_label.substring(0, 50)

    //insert pesanan
    const { data:data_penjualan, error:error_penjualan } = await supabase
      .from('penjualan')
      .insert({ 
        tanggal: currDate,
        total_produk: total_produk,
        list_produk: list_produk_label,
        total_harga: dataPesananTotal,
        total_hpp: total_hpp,
        keterangan: dataPesananNote,
        pembayaran: dataPesananPayment,
       })
       .select()

    let penjualan_id = data_penjualan[0].id

    //list produk_penjualan
    let list_produk = [];
    dataPesanan.map((val) => {
      list_produk.push({ 
        produk_id: val.id,
        penjualan_id: penjualan_id,
        harga: val.harga,
        hpp: val.hpp,
        qty: val.qty,
      })
    })

    //insert produk_penjualan
    const { error:error_produk_penjualan } = await supabase
      .from('produk_penjualan')
      .insert(list_produk)

    //update produk stok
    const { error:error_produk } =  await supabase
      .from('produk')
      .upsert(list_produk_newstok)

    //remove data
    setDataPesanan([])
    setDataPesananTotal([])
    setDataPesananPayment([])
    setDataPesananNote([])

    messageApi.open({
      type: 'success',
      content: 'Berhasil simpan data',
    });
    setIsLoading(false)
  }

  const dataPembayaran = [
    { key:0, label: 'CASH', value: 'CASH' },
    { key:1, label: 'QRIS', value: 'QRIS' },
    { key:2, label: 'TRANSFER', value: 'TRANSFER' },
  ];

  const summaryItems = [
    {
      key: '1',
      span: 'filled',
      label: 'Total',
      children: 'Rp '+dataPesananTotal.toLocaleString(),
    },
    {
      key: '2',
      span: 'filled',
      label: 'Pembayaran',
      children: <Select
                    placeholder="Pilih"
                    value={dataPesananPayment}
                    onChange={(value) => setDataPesananPayment(value)}
                    options={dataPembayaran}
                    // style={{ width:150 }} 
                  />,
    },
    {
      key: '3',
      span: 'filled',
      label: 'Keterangan',
      children: <Input
                    value={dataPesananNote}
                    onChange={(e) => setDataPesananNote(e.target.value)}
                    // style={{ width:150 }} 
                  />,
    },
  ]

  return (
    <Spin spinning={isLoading}>
      {contextHolder}

      <Row>
        <Col span={16}>
            <Title level={4} style={{marginTop:10, marginBottom:-10}}>Pilih Produk</Title>
            <Divider />

            <Tabs defaultActiveKey="1" items={dataKategori} onChange={(value) => setKategoriFilter(value)} style={{ marginLeft:10, marginTop:-20 }} />

            <Search placeholder="Cari produk" allowClear onChange={(e) => setSearchFilter(e.target.value)} style={{ marginBottom:20 }} />
            
            <Row gutter={16}>
              {dataProduk && dataProduk.map((produk, index) => (
              <Col span={8} style={{marginBottom:20}} key={index}>
                <Card title={produk.nama} variant="borderless" type="inner">
                  Rp. {produk.harga.toLocaleString()}
                  <Button block size="small" type="primary" style={{marginTop:10}} onClick={() => onPesanInsert(produk)}>
                  Pilih
                  </Button>
                </Card>
              </Col>
              ))}
            </Row>
        </Col>

        <Col span={1}></Col>
        {dataPesanan.length > 0 &&
        <Col span={7}>
          <Title level={4} style={{marginTop:10, marginBottom:-10}}>Pesanan</Title>
          <Divider />

          <List
            itemLayout="horizontal"
            dataSource={dataPesanan}
            renderItem={(item, index) => (
              <List.Item key={index}>
                <List.Item.Meta
                  title={item.nama}
                  description={'Rp '+item.harga.toLocaleString()}
                />
                <Input
                  addonBefore={<Button icon={<MinusOutlined />} size="small" color="primary" variant="outlined" onClick={() => onPesanUpdate('minus', item, index)} />}
                  addonAfter={<Button icon={<PlusOutlined />} size="small" color="primary" variant="outlined" onClick={() => onPesanUpdate('plus', item, index)} />}
                  value={item.qty}
                  style={{ width:135, textAlign:'center' }}
                />
              </List.Item>
            )}
          />
          
          <Descriptions bordered items={summaryItems} style={{ marginBottom:20 }} />

          <Button block key="save" type="primary" icon={<CheckOutlined />} loading={isLoading}style={{marginBottom:10}} size="large" onClick={() => onBayar()}>
            Bayar
          </Button>
          {/* <Button block key="draft" variant="outlined" color="primary" icon={<EditOutlined />} loading={isLoading} size="large">
            Pesan
          </Button> */}
        </Col>
        }

      </Row>
      
    </Spin>
  )
};
export default TrxInput;