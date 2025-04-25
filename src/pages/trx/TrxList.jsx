import React, { useEffect, useState } from 'react';
import { Space, Typography, Divider, Table, DatePicker, Input, Select, Button, Modal } from 'antd';
import { PrinterOutlined } from '@ant-design/icons';
import { PDFViewer, Text, View, Page, Document, StyleSheet } from '@react-pdf/renderer';

import { supabase } from '../../config/supabase';
import dayjs from 'dayjs';

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

const TrxList = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [modalShow, setModalShow] = useState(false);
  const [dataList, setDataList] = useState([]);

  const [dataPenjualanKode, setDataPenjualanKode] = useState('');
  const [dataPenjualanTanggal, setDataPenjualanTanggal] = useState('');
  const [dataPenjualanTotalHarga, setDataPenjualanTotalHarga] = useState(0);
  const [dataPenjualanTotalBayar, setDataPenjualanTotalBayar] = useState(0);
  const [dataPenjualanNote, setDataPenjualanNote] = useState('');
  const [dataPenjualanMetodeBayar, setDataPenjualanMetodeBayar] = useState('');
  const [dataProdukPenjualan, setDataProdukPenjualan] = useState([]);
  
  const [searchFilter, setSearchFilter] = useState('');
  const dateFormat = 'YYYY-MM-DD';
  const [dateFilter, setDateFilter] = useState(dayjs().format(dateFormat));
  const [metodeBayarFilter, setMetodeBayarFilter] = useState('');
  
  const dataMetodeBayar = [
    { key:0, label: 'Semua Metode Bayar', value: '' },
    { key:1, label: 'CASH', value: 'CASH' },
    { key:2, label: 'QRIS', value: 'QRIS' },
    { key:3, label: 'TRANSFER', value: 'TRANSFER' },
  ];
  
  const { Title } = Typography;
  const { Search } = Input;

  useEffect(() => {
    getDataList();
  }, [searchFilter, dateFilter, metodeBayarFilter]);

  async function getDataList() {
    console.log(metodeBayarFilter)
    setIsLoading(true)
    let query = supabase.from("penjualan")
                      .select('id,kode,tanggal,total_harga,list_produk,nominal_bayar,metode_bayar,keterangan')
                      .ilike('list_produk', '%'+searchFilter+'%')
                      .eq('tanggal', dateFilter)
                      .order('id', { ascending:false })
    
    if (metodeBayarFilter != '')
      query = query.eq('metode_bayar', metodeBayarFilter)

    const { data } = await query;
    setDataList(data)
    setIsLoading(false)
  }

  async function onShowInvoice(penjualan) {
    setDataPenjualanKode(penjualan.kode)
    setDataPenjualanTanggal(penjualan.tanggal)
    setDataPenjualanTotalHarga(penjualan.total_harga)
    setDataPenjualanTotalBayar(penjualan.nominal_bayar)
    setDataPenjualanNote(penjualan.keterangan)
    setDataPenjualanMetodeBayar(penjualan.metode_bayar)

    const { data:produk_penjualan } = await supabase.from("produk_penjualan")
                                      .select('harga,qty,produk(nama)')
                                      .eq('penjualan_id', penjualan.id)

    setDataProdukPenjualan(produk_penjualan)

    setModalShow(true)
  }

  const columns = [
    {
      title: 'Produk',
      dataIndex: 'list_produk',
      key: 'list_produk',
    },
    {
      title: 'Total Pesanan',
      dataIndex: 'total_harga',
      render: (_, record) => (
        <>{record.total_harga.toLocaleString()}</>
      ),
    },
    {
      title: 'Pembayaran',
      key: 'nominal_bayar',
      render: (_, record) => (
        <>{record.nominal_bayar.toLocaleString()}</>
      ),
    },
    {
      title: 'Kembalian',
      key: 'kembalian',
      render: (_, record) => (
        <>{(record.nominal_bayar - record.total_harga).toLocaleString()}</>
      ),
    },
    {
      title: 'Metode Bayar',
      key: 'metode_bayar',
      dataIndex: 'metode_bayar',
    },
    {
      title: 'Keterangan',
      dataIndex: 'keterangan',
      key: 'keterangan',
    },
    {
      title: 'Struk',
      key: 'struk',
      render: (_, record) => (
        <Button onClick={() => onShowInvoice(record)} icon={<PrinterOutlined />} color="primary" variant="outlined" />
      ),
    },
  ];

  return (
    <>
      <Title level={4} style={{marginTop:10, marginBottom:-10}}>Riwayat Transaksi</Title>
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
          value={metodeBayarFilter}
          onChange={(value) => setMetodeBayarFilter(value)}
          options={dataMetodeBayar} 
          style={{ width:200 }}
        />
      </Space>
      
      <Table 
        columns={columns} 
        dataSource={dataList} 
        rowKey="id" 
        style={{marginTop:10}} 
        loading={isLoading}
        pagination={false} 
        // scroll={{ y: 200 }}
        summary={dataList => {
          let totalHarga = 0;
          let totalBayar = 0;
          let totalKembalian = 0;
          dataList.forEach(({ total_harga, nominal_bayar }) => {
            totalHarga += total_harga;
            totalBayar += nominal_bayar;
            totalKembalian += (nominal_bayar-total_harga);
          });
          return (
            <>
              <Table.Summary.Row>
                <Table.Summary.Cell index={0}></Table.Summary.Cell>
                <Table.Summary.Cell index={1}>
                  <span style={{fontWeight:'bold'}}>Total</span>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={2}>
                  <span style={{fontWeight:'bold'}}>{totalHarga.toLocaleString()}</span>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={3}>
                  <span style={{fontWeight:'bold'}}>{totalBayar.toLocaleString()}</span>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={4}>
                  <span style={{fontWeight:'bold'}}>{totalKembalian.toLocaleString()}</span>
                </Table.Summary.Cell>
              </Table.Summary.Row>
            </>
          );
        }}
      />

      <Modal 
        title="Struk" 
        open={modalShow} 
        onCancel={() => setModalShow(false)}
        centered
        width={450}
        footer={[
          <Button type="primary" key="back" onClick={() => setModalShow(false)}>
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
                <Text>#{dataPenjualanKode}</Text>
              </View>
              <View style={styles.row}>
                <Text>Tanggal</Text>
                <Text>{dataPenjualanTanggal}</Text>
              </View>

              <View style={styles.divider} />

              {dataProdukPenjualan.length > 0 && dataProdukPenjualan.map((item, index) => (
              <View>
                <View style={styles.row}>
                  <Text>{item.produk.nama}</Text>
                  <Text>Rp {(item.qty * item.harga).toLocaleString()}</Text>
                </View>
                <Text style={styles.subItem}>{item.qty} x Rp {item.harga.toLocaleString()}</Text>
              </View>
              ))}
             
              <View style={styles.totalRow}>
                <View style={styles.row}>
                  <Text>Total Pesanan</Text>
                  <Text>Rp {dataPenjualanTotalHarga.toLocaleString()}</Text>
                </View>
              </View>
              

              {dataPenjualanMetodeBayar == 'CASH' &&
              <View>
                <View style={styles.row}>
                  <Text>Nominal Bayar</Text>
                  <Text>Rp {dataPenjualanTotalBayar.toLocaleString()}</Text>
                </View>
                <View style={styles.row}>
                  <Text>Kembalian</Text>
                  <Text>Rp {(dataPenjualanTotalBayar - dataPenjualanTotalHarga).toLocaleString()}</Text>
                </View>
              </View>
              }

              {dataPenjualanNote != '' &&
              <View>
                <View style={styles.row}>
                  <Text>Note</Text>
                  <Text>{dataPenjualanNote}</Text>
                </View>
              </View>
              }

            </Page>
          </Document>
        </PDFViewer>
      </Modal>
    </>
  )
};
export default TrxList;