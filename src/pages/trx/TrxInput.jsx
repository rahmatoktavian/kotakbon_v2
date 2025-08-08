import React, { useEffect, useState } from 'react';
import { Col, Row, Table, Spin, Modal, List, Typography, Divider, Form, Button, Input, Select, message, InputNumber, Radio } from 'antd';
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
  const currDate = new Date().toLocaleString("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).slice(0, 10);
  
  const dataPesananKode = Math.floor(Math.random() * 999999);

  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [isLoading, setIsLoading] = useState(false);
  const [modalShow, setModalShow] = useState(false);

  const [searchFilter, setSearchFilter] = useState('');
  const [kategoriFilter, setKategoriFilter] = useState('');
  const pageSize = 10;
  const [dataRange, setDataRange] = useState({ start:0, end:(pageSize-1) });
  const [dataTotal, setDataTotal] = useState(0);

  const [dataProduk, setDataProduk] = useState([]);
  const [dataKategori, setDataKategori] = useState([]);

  const [dataPesanan, setDataPesanan] = useState([]);
  const [dataPesananTotal, setDataPesananTotal] = useState(0);
  const [dataPesananPaymentStatus, setDataPesananPaymentStatus] = useState(1);
  const [dataPesananPaymentMethod, setDataPesananPaymentMethod] = useState('CASH');
  const [dataPesananPayment, setDataPesananPayment] = useState('');
  const [dataPesananPaymentExchange, setDataPesananPaymentExchange] = useState('');
  const [dataPesananNote, setDataPesananNote] = useState('');
  const [dataPesananFinish, setDataPesananFinish] = useState(false);

  const statusLunas = [
    { key:1, label: 'LUNAS', value: 1 },
    { key:0, label: 'OPEN BILL', value: 0 },
  ];

  const metodePembayaran = [
    { key:0, label: 'CASH', value: 'CASH' },
    { key:1, label: 'QRIS', value: 'QRIS' },
    { key:2, label: 'TRANSFER', value: 'TRANSFER' },
  ];

  const { Title } = Typography;
  const { Search } = Input;

  useEffect(() => {
    getProdukList();
    // getKategoriList();
  }, [searchFilter, kategoriFilter, dataPesananFinish, dataRange.start]);

  async function getProdukList() {
    setIsLoading(true)
    if(searchFilter != '') {
      setDataRange({
        start:0,
        end:25,
      });
    }
    
    let searchFilters = searchFilter != '' ? searchFilter : null;
    let kategoriFilters = kategoriFilter != '' ? kategoriFilter : null;
    const { data } = await supabase.rpc("produk_stok_harian_v2", { 
            date_filter:currDate,
            nama_filter:searchFilters, 
            kategori_filter:kategoriFilters, 
            supplier_filter:null,
            limit_filter: (dataRange.end - dataRange.start + 1),
            offset_filter: dataRange.start
        })

    const newData = []
    data && data.map((val) => {
      let produkStokQty = val.produk_stok_qty ? val.produk_stok_qty : 0;
      let produkPenjualanQty = val.produk_penjualan_qty ? val.produk_penjualan_qty : 0;
      let produkStok = produkStokQty - produkPenjualanQty
      
      // if(produkStok > 0) {
        let disabledProduk = false
        let disabledLabel = 'Pilih'
        if(produkStok > 0) {

          dataPesanan.length > 0 && dataPesanan.map((pesanan) => {
            if(pesanan.id == val.id) {
              disabledProduk = true
              disabledLabel = 'Terpilih'
            }
          })
          
        } else {
          disabledProduk = true
          disabledLabel = 'Stok Kosong'
        }

        newData.push({ 
          id:val.id, 
          supplier_nama: val.supplier_nama,
          kategori_id:val.kategori_id,
          nama:val.nama,
          harga:val.harga,
          hpp:val.hpp,
          stok: produkStok,
          disabled:disabledProduk,
          disabledLabel: disabledLabel,
        })
      // }
    })
    
    setDataProduk(newData)

    let rowTotal = data.length > 0 ? data[0].full_count : 0;
    setDataTotal(rowTotal)
    
    setIsLoading(false)
  }

  // const onTableChange = (newPagination) => {
  //   let startRange = (newPagination - 1) * pageSize;
  //   let endRange = newPagination * pageSize - 1;
  //   setDataRange({
  //     start: startRange,
  //     end: endRange,
  //   });
  // };

  const onTableChange = (newPagination) => {
    let startRange = (newPagination.current - 1) * newPagination.pageSize;
    let endRange = newPagination.current * newPagination.pageSize - 1;
    setDataRange({
      start: startRange,
      end: endRange,
    });
  };

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
      produk.disabledLabel = 'Terpilih'
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
          newDataPesanan[idx].disabledLabel = 'Pilih'
        }

        let newQty = tipe == 'plus' ? val.qty+1  : val.qty-1;
        newDataPesanan[idx].qty = newQty > item.stok ? val.qty : newQty;
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

  async function onFinish() {
    setDataPesananFinish(false)
    setIsLoading(true)

    const { data:{user} } = await supabase.auth.getUser()
    const currTime = new Date()

    let total_produk = 0;
    let total_hpp = 0;
    let list_produk_label = '';
    dataPesanan.map((val, idx) => {
      total_produk = total_produk + val.qty
      total_hpp = total_hpp + (val.qty * val.hpp)
      list_produk_label = idx > 0 ? list_produk_label + ','+val.nama : list_produk_label + val.nama
    })
    list_produk_label = list_produk_label.substring(0, 50)

    //insert pesanan
    let nominal_bayar_val = 0
    let nominal_kembalian_val = 0
    if(dataPesananPaymentStatus == 1 && dataPesananPaymentMethod == 'CASH') {
      nominal_bayar_val = dataPesananTotal
      nominal_kembalian_val = dataPesananPaymentExchange
    } else if(dataPesananPaymentStatus == 1 && dataPesananPaymentMethod != 'CASH') {
      nominal_bayar_val = dataPesananTotal
    }
    
    const insert_penjualan = [{ 
      tanggal: currDate,
      kode: dataPesananKode,
      total_produk: total_produk,
      list_produk: list_produk_label,
      total_harga: dataPesananTotal,
      total_hpp: total_hpp,
      keterangan: dataPesananNote,
      metode_bayar: dataPesananPaymentMethod,
      nominal_bayar:  nominal_bayar_val,
      nominal_kembalian: nominal_kembalian_val,
      lunas: dataPesananPaymentStatus,
      created_by: user.email,
      created_at: currTime,
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

    setIsLoading(false)
    setModalShow(true)
  }

  function onCloseInvoice() {
    //remove data
    setDataPesanan([])
    setDataPesananTotal(0)
    setDataPesananPaymentStatus(1)
    setDataPesananPaymentMethod('CASH')
    setDataPesananPayment('')
    setDataPesananPaymentExchange('')
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

  const columns = [
    {
      title: 'Produk',
      key: 'nama',
      render: (_, record) => (
        <>
          <span>{record.nama}</span><br />
          <span style={{color:'gray',fontSize:13}}>{record.harga.toLocaleString()}</span>
        </>
      )
    },
    {
      title: 'Supplier',
      dataIndex: 'supplier_nama',
      key: 'supplier_nama',
    },
    {
      title: 'Action',
      key: 'action',
      align: 'right',
      render: (_, record) => (
        <Button type="primary" onClick={record.disabled ? undefined : () => onPesanInsert(record)} disabled={record.disabled}>
          {record.disabledLabel}
        </Button>
      ),
    },
  ];

  return (
    <Spin spinning={isLoading}>
      {contextHolder}

      <Row>
        <Col span={14}>
            <Title level={4} style={{marginTop:10, marginBottom:-10}}>Input Transaksi</Title>
            <Divider />

            {/* <Tabs 
              defaultActiveKey="1" 
              items={dataKategori} 
              onChange={(value) => setKategoriFilter(value)} 
              tabPosition='top'
              style={{ marginLeft:10, marginTop:-20 }} /> */}

            <Search placeholder="Cari produk" allowClear onChange={(e) => setSearchFilter(e.target.value)} />

            <Table 
              columns={columns} 
              dataSource={dataProduk} 
              rowKey="id" 
              style={{marginTop:10}} 
              loading={isLoading}
              onChange={onTableChange}
              pagination={false}
              // pagination={{
              //   total: dataTotal,
              //   hideOnSinglePage: true,
              //   showSizeChanger: false,
              // }}
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
                  description={'Rp '+item.harga.toLocaleString()+' (Stok: '+item.stok+')'}
                />
                <Input
                  addonBefore={<Button icon={<MinusOutlined />} size="small" type="primary" onClick={() => onPesanUpdate('minus', item, index)} />}
                  addonAfter={<Button icon={<PlusOutlined />} size="small" type="primary" onClick={() => onPesanUpdate('plus', item, index)} disabled={item.qty >= item.stok ? true : false} />}
                  value={item.qty}
                  style={{ width:130, textAlign:'center' }}
                  variant="borderless"
                />
              </List.Item>
            )}
          />

          <Divider />
          <List itemLayout="horizontal">
            <List.Item>
              <List.Item.Meta title='Status' />
                <Radio.Group
                  block
                  options={statusLunas}
                  value={dataPesananPaymentStatus}
                  onChange={(event) => setDataPesananPaymentStatus(event.target.value)}
                  optionType="button"
                  buttonStyle="solid"
                  style={{ width:250 }}
                />
            </List.Item>

            {dataPesananPaymentStatus == 1 &&
            <List.Item>
              <List.Item.Meta title='Metode' />
              <Select
                placeholder="Pilih"
                value={dataPesananPaymentMethod}
                onChange={(value) => setDataPesananPaymentMethod(value)}
                options={metodePembayaran}
                style={{ width:250 }}
              />
            </List.Item>
            }

            <List.Item>
              <List.Item.Meta title='Total Pesanan' />
              <Title level={5}>{'Rp '+dataPesananTotal.toLocaleString()}</Title>
            </List.Item>

            {(dataPesananPaymentStatus == 1 && dataPesananPaymentMethod == 'CASH') &&
            <>
              <List.Item>
                <List.Item.Meta title='Pembayaran' />
                <InputNumber
                  value={dataPesananPayment}
                  onChange={(value) => onChangeNominalBayar(value)}
                  formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  style={{ width:250 }}
                />
              </List.Item>
              <List.Item>
                <List.Item.Meta title='Kembalian' />
                <InputNumber
                  value={dataPesananPayment < dataPesananTotal ? 0 : dataPesananPaymentExchange.toLocaleString()}
                  disabled={true}
                  style={{ width:250 }}
                  align='right'
                />
              </List.Item>
            </>
            }
            <List.Item>
              <List.Item.Meta title='Catatan' />
              <Input
                value={dataPesananNote}
                onChange={(e) => setDataPesananNote(e.target.value)}
                style={{ width:250 }} 
              />
            </List.Item>
          </List>
          
          <Button block key="save" type="primary" icon={<CheckOutlined />} loading={isLoading} style={{marginBottom:10}} size="large" onClick={() => onFinish()} disabled={dataPesananPaymentStatus == 1 && dataPesananPaymentMethod == 'CASH' && dataPesananPayment < dataPesananTotal ? true : false}>
            {dataPesananPaymentStatus == 0 ? 'Simpan' : 'Bayar'}
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