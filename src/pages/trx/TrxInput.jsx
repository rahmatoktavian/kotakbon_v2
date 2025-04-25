import React, { useEffect, useState } from 'react';
import { Col, Row, Spin, Modal, List, Typography, Divider, Form, Button, Input, Select, Tabs, message, InputNumber, Card } from 'antd';
import { PlusOutlined, MinusOutlined, CheckOutlined, } from '@ant-design/icons';
import { PDFViewer, Text, View, Page, Document, StyleSheet } from '@react-pdf/renderer';

import { supabase } from '../../config/supabase'

const styles = StyleSheet.create({
  container: {
    padding: 20,
    fontSize: 12,
    borderRadius: 6,
    maxWidth: 400,
    margin: 'auto',
  },
  title: {
    textAlign: 'center',
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  address: {
    textAlign: 'center',
    color: '#555',
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  subItem: {
    fontSize: 10,
    color: '#666',
    marginBottom: 10,
  },
  divider: {
    borderBottom: '1 dotted #aaa',
    marginVertical: 5,
  },
  totalRow: {
    borderTop: '1 solid #ccc',
    paddingTop: 5,
    fontWeight: 'bold',
  },
});

const TrxInput = () => {
  const currDate = new Date().toISOString().slice(0, 10);
  const dataPesananKode = Math.floor(Math.random() * 999999);

  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [isLoading, setIsLoading] = useState(false);
  const [modalShow, setModalShow] = useState(false);

  const [searchFilter, setSearchFilter] = useState('');
  const [kategoriFilter, setKategoriFilter] = useState('');
  const pageSize = 5;
  const [dataRange, setDataRange] = useState({ start:0, end:(pageSize-1) });
  const [dataTotal, setDataTotal] = useState(0);

  const [dataProduk, setDataProduk] = useState([]);
  const [dataKategori, setDataKategori] = useState([]);

  const [dataPesanan, setDataPesanan] = useState([]);
  const [dataPesananTotal, setDataPesananTotal] = useState(0);
  const [dataPesananPaymentMethod, setDataPesananPaymentMethod] = useState('CASH');
  const [dataPesananPayment, setDataPesananPayment] = useState('');
  const [dataPesananPaymentExchange, setDataPesananPaymentExchange] = useState('');
  const [dataPesananNote, setDataPesananNote] = useState('');
  const [dataPesananFinish, setDataPesananFinish] = useState(false);

  const metodePembayaran = [
    { key:0, label: 'CASH', value: 'CASH' },
    { key:1, label: 'QRIS', value: 'QRIS' },
    { key:2, label: 'TRANSFER', value: 'TRANSFER' },
  ];

  const { Title } = Typography;
  const { Search } = Input;

  useEffect(() => {
    getKategoriList();
    getProdukList();
  }, [searchFilter, kategoriFilter, dataRange.start, dataPesananFinish]);

  async function getKategoriList() {
    const { data } = await supabase.from("kategori")
                      .select('id,nama')
                      .order('nama', { ascending:true })
    
    const listKategori = []
    listKategori.push({ key:'', label:'Semua'})
    data.map((val) => (
      listKategori.push({ key:val.id, label:val.nama})
    ))

    setDataKategori(listKategori)
  }

  async function getProdukList() {
    setIsLoading(true)

    let query = supabase.from("produk")
                    .select('id,kategori_id,nama,harga,hpp,stok', { count:'exact' })
                    .ilike('nama', '%'+searchFilter+'%')
                    .order('nama', { ascending:true })
                    .range(dataRange.start, dataRange.end)

    if (kategoriFilter != '')
      query = query.eq('kategori_id', kategoriFilter)

    const { data, count } = await query;

    const newData = []
    data && data.map((val) => {
      let disabledProduk = false
      dataPesanan.length > 0 && dataPesanan.map((pesanan) => {
        if(pesanan.id == val.id)
          disabledProduk = true
      })

      newData.push({ 
        id:val.id, 
        kategori_id:val.kategori_id,
        nama:val.nama,
        harga:val.harga,
        hpp:val.hpp,
        stok:val.stok,
        disabled:disabledProduk
      })
    })

    setDataProduk(newData)
    setDataTotal(count)
    setIsLoading(false)
  }

  const onListChange = (newPagination) => {
    let startRange = (newPagination - 1) * pageSize;
    let endRange = newPagination * pageSize - 1;
    setDataRange({
      start: startRange,
      end: endRange,
    });
  };

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
      produk.disabled = true
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
        if(tipe == 'minus' && val.qty == 1) {
          doDelete = true
          newDataPesanan[idx].disabled = false
        }

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
    setDataPesananFinish(false)
    setIsLoading(true)

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
    const insert_penjualan = [{ 
      tanggal: currDate,
      kode: dataPesananKode,
      total_produk: total_produk,
      list_produk: list_produk_label,
      total_harga: dataPesananTotal,
      total_hpp: total_hpp,
      keterangan: dataPesananNote,
      metode_bayar: dataPesananPaymentMethod,
      nominal_bayar: dataPesananPaymentMethod == 'CASH' ? dataPesananPayment : dataPesananTotal,
      nominal_kembalian: dataPesananPaymentMethod == 'CASH' ? dataPesananPaymentExchange : 0,
     }]

    const { data:data_penjualan, error:error_penjualan } = await supabase
      .from('penjualan')
      .insert(insert_penjualan)
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

    setIsLoading(false)
    setModalShow(true)
  }

  function onCloseInvoice() {
    //remove data
    setDataPesanan([])
    setDataPesananTotal(0)
    setDataPesananPayment(0)
    setDataPesananNote('')

    //close modal
    setModalShow(false)

    //reload data produk
    setDataPesananFinish(true)

    messageApi.open({
      type: 'success',
      content: 'Berhasil simpan data',
    });
  }

  function onChangeNominalBayar(nominal_bayar) {
    setDataPesananPayment(nominal_bayar)
    let nominal_kembalian = nominal_bayar - dataPesananTotal
    setDataPesananPaymentExchange(nominal_kembalian)
  }

  return (
    <Spin spinning={isLoading}>
      {contextHolder}

      <Row>
        <Col span={14}>
            <Title level={4} style={{marginTop:10, marginBottom:-10}}>Input Transaksi</Title>
            <Divider />

            <Tabs defaultActiveKey="1" items={dataKategori} onChange={(value) => setKategoriFilter(value)} style={{ marginLeft:10, marginTop:-20 }} />

            <Search placeholder="Cari produk" allowClear onChange={(e) => setSearchFilter(e.target.value)} style={{ marginBottom:20 }} />
            
            {/* <Row gutter={14}>
              {dataProduk && dataProduk.map((produk, index) => (
              <Col span={6} style={{marginBottom:20}} key={index}>
                <Card title={produk.nama} variant="borderless" type="inner">
                  Rp. {produk.harga.toLocaleString()}
                  <Button block size="small" type="primary" style={{marginTop:10}} onClick={() => onPesanInsert(produk)} disabled={produk.disabled}>
                  Pilih
                  </Button>
                </Card>
              </Col>
              ))}
            </Row> */}

            <List
              itemLayout="horizontal"
              dataSource={dataProduk}
              pagination={{
                total: dataTotal,
                pageSize: pageSize,
                hideOnSinglePage: true,
                onChange: (page) => onListChange(page)
              }}
              renderItem={(item, index) => (
                <List.Item
                  key={index}
                  onClick={() => onPesanInsert(item)}
                  actions={[
                    <Button type="primary" icon={item.disabled ? <CheckOutlined /> : <PlusOutlined />} onClick={() => onPesanInsert(item)} style={{marginTop:10}} disabled={item.disabled}>
                      {item.disabled ? 'Terpilih' : 'Pilih'}
                    </Button>
                  ]}
                >
                  <List.Item.Meta
                    title={item.nama}
                    description={'Rp '+item.harga.toLocaleString()}
                  />
                </List.Item>
              )}
            />
        </Col>

        <Col span={1}></Col>
        {dataPesanan.length > 0 &&
        <Col span={9}>
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

          <Divider />
          <List itemLayout="horizontal">
            <List.Item>
              <List.Item.Meta title='Metode Bayar' />
              <Select
                  placeholder="Pilih"
                  value={dataPesananPaymentMethod}
                  onChange={(value) => setDataPesananPaymentMethod(value)}
                  options={metodePembayaran}
                  style={{ width:150 }}
                />
            </List.Item>
            <List.Item>
              <List.Item.Meta title='Total Pesanan' />
              <Title level={5}>{'Rp '+dataPesananTotal.toLocaleString()}</Title>
            </List.Item>
            {dataPesananPaymentMethod == 'CASH' &&
              <>
                <List.Item>
                  <List.Item.Meta title='Nominal Bayar' />
                  <InputNumber
                    value={dataPesananPayment}
                    onChange={(value) => onChangeNominalBayar(value)}
                    style={{ width:150 }}
                    autoFocus
                  />
                </List.Item>
                <List.Item>
                  <List.Item.Meta title='Kembalian' />
                  <span>{dataPesananPayment < dataPesananTotal ? 0 : 'Rp '+dataPesananPaymentExchange.toLocaleString()}</span>
                </List.Item>
              </>
            }
            <List.Item>
              <List.Item.Meta title='Note' />
              <Input
                value={dataPesananNote}
                onChange={(e) => setDataPesananNote(e.target.value)}
                placeholder="Tidak wajib diisi"
                style={{ width:150 }} 
              />
            </List.Item>
          </List>
          
          <Button block key="save" type="primary" icon={<CheckOutlined />} loading={isLoading} style={{marginBottom:10}} size="large" onClick={() => onBayar()} disabled={dataPesananPaymentMethod == 'CASH' && dataPesananPayment < dataPesananTotal ? true : false}>
            Bayar
          </Button>

          <Modal 
            title="Struk" 
            open={modalShow} 
            onCancel={() => onCloseInvoice()}
            centered
            width={450}
            footer={[
              <Button type="primary" key="back" onClick={() => onCloseInvoice()}>
                OK
              </Button>
            ]}
          >
            <PDFViewer width="400" height="500" className="app" >
              <Document>
                <Page size="A5" style={styles.container}>
                  <Text style={styles.title}>FRUK SABIN</Text>
                  <Text style={styles.address}>Angkatan 2024/2025</Text>

                  <View style={styles.row}>
                    <Text>Transaksi</Text>
                    <Text>#{dataPesananKode}</Text>
                  </View>
                  <View style={styles.row}>
                    <Text>Tanggal</Text>
                    <Text>{currDate}</Text>
                  </View>

                  <View style={styles.divider} />

                  {dataPesanan.length > 0 && dataPesanan.map((produk, index) => (
                  <View>
                    <View style={styles.row}>
                      <Text>{produk.nama}</Text>
                      <Text>Rp {(produk.qty * produk.harga).toLocaleString()}</Text>
                    </View>
                    <Text style={styles.subItem}>{produk.qty} x Rp {produk.harga.toLocaleString()}</Text>
                  </View>
                  ))}

                  <View style={styles.totalRow}>
                    <View style={styles.row}>
                      <Text>Total Pesanan</Text>
                      <Text>Rp {dataPesananTotal.toLocaleString()}</Text>
                    </View>
                  </View>

                  {dataPesananPaymentMethod == 'CASH' &&
                  <View>
                    <View style={styles.row}>
                      <Text>Nominal Bayar</Text>
                      <Text>Rp {dataPesananPayment ? dataPesananPayment.toLocaleString() : ''}</Text>
                    </View>
                    <View style={styles.row}>
                      <Text>Kembalian</Text>
                      <Text>Rp {dataPesananPayment ? (dataPesananPayment - dataPesananTotal).toLocaleString() : ''}</Text>
                    </View>
                  </View>
                  }

                  {dataPesananNote != '' &&
                  <View>
                    <View style={styles.row}>
                      <Text>Note</Text>
                      <Text>{dataPesananNote}</Text>
                    </View>
                  </View>
                  }

                </Page>
              </Document>
            </PDFViewer>
          </Modal>
        </Col>
        }

      </Row>
      
    </Spin>
  )
};
export default TrxInput;