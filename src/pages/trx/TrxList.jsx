import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Space, Typography, Divider, Table, DatePicker, Input, Select, Button, Modal, Popconfirm, message, Tabs } from 'antd';
import { EditOutlined, PrinterOutlined } from '@ant-design/icons';
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
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const [modalShow, setModalShow] = useState(false);
  const [dataList, setDataList] = useState([]);
  const [dataRange, setDataRange] = useState({ start:0, end:9 });
  const [dataTotal, setDataTotal] = useState(0);

  const [dataPenjualanID, setDataPenjualanID] = useState(0);
  const [dataPenjualanKode, setDataPenjualanKode] = useState('');
  const [dataPenjualanTanggal, setDataPenjualanTanggal] = useState('');
  const [dataPenjualanTotalHarga, setDataPenjualanTotalHarga] = useState(0);
  const [dataPenjualanTotalBayar, setDataPenjualanTotalBayar] = useState(0);
  const [dataPenjualanNote, setDataPenjualanNote] = useState('');
  const [dataPenjualanMetodeBayar, setDataPenjualanMetodeBayar] = useState('');
  const [dataProdukPenjualan, setDataProdukPenjualan] = useState([]);
  
  const [statusFilter, setStatusFilter] = useState(1);
  const [searchFilter, setSearchFilter] = useState('');
  const dateFormat = 'YYYY-MM-DD';
  const [dateFilter, setDateFilter] = useState(dayjs().format(dateFormat));
  const [metodeBayarFilter, setMetodeBayarFilter] = useState('');
  
  const dataStatusFilter = [
    { key:1, label: 'LUNAS', value: 1 },
    { key:0, label: 'OPEN BILL', value: 0 },
  ];

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
  }, [searchFilter, dateFilter, metodeBayarFilter, statusFilter, dataRange.start]);

  async function getDataList() {
    setIsLoading(true)
    if(searchFilter != '') {
      setDataRange({
        start:0,
        end:9,
      });
    }
    
    let query = supabase.from("penjualan")
                      .select('id,kode,tanggal,total_harga,list_produk,nominal_bayar,metode_bayar,keterangan,lunas,created_at', { count:'exact' })
                      .eq('tanggal', dateFilter)
                      .eq('lunas', statusFilter)
                      .ilike('keterangan', '%'+searchFilter+'%')
                      .order('id', { ascending:false })
                      .range(dataRange.start, dataRange.end)
    
    if (metodeBayarFilter != '')
      query = query.eq('metode_bayar', metodeBayarFilter)

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

  async function onShowInvoice(penjualan) {
    setDataPenjualanID(penjualan.id)
    setDataPenjualanKode(penjualan.kode)
    setDataPenjualanTanggal(dayjs(penjualan.created_at).format('YYYY-MM-DD HH:mm'))
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

  async function onDelete() {
    setIsLoading(true)
    
    // delete penjualan produk
    const {error} = await supabase
          .from('produk_penjualan')
          .delete()
          .eq('penjualan_id',dataPenjualanID)
    
    // delete penjualan
    await supabase
            .from('penjualan')
            .delete()
            .eq('id',dataPenjualanID)
        
    messageApi.open({
      type: 'success',
      content: 'Berhasil hapus data',
    });

    getDataList()
    setModalShow(false)
    setIsLoading(false)
  }

  const columns = [
    {
      title: 'Kode',
      key: 'kode',
      render: (_, record) => (
        <>{'#'+record.kode}</>
      ),
    },
    {
      title: 'Status',
      key: 'lunas',
      render: (_, record) => (
        <>{record.lunas == 1 ? 'LUNAS' : 'OPEN BILL'}</>
      ),
    },
    {
      title: 'Note/Pemesan',
      key: 'keterangan',
      render: (_, record) => (
        <>{record.keterangan ? record.keterangan : '-'}</>
      ),
    },
    {
      title: 'List Produk',
      dataIndex: 'list_produk',
      key: 'list_produk',
    },
    {
      title: 'Metode',
      key: 'metode_bayar',
      render: (_, record) => (
        <>{record.lunas == 1 ? record.metode_bayar : '-'}</>
      ),
    },
    {
      title: 'Total Pesanan',
      dataIndex: 'total_harga',
      align: 'right',
      render: (_, record) => (
        <>{record.total_harga.toLocaleString()}</>
      ),
    },
    // {
    //   title: 'Pembayaran',
    //   key: 'nominal_bayar',
    //   align: 'right',
    //   render: (_, record) => (
    //     <>{record.lunas == 1 ? record.nominal_bayar.toLocaleString() : '-'}</>
    //   ),
    // },
    // {
    //   title: 'Kembalian',
    //   key: 'kembalian',
    //   align: 'right',
    //   render: (_, record) => (
    //     <>{record.lunas == 1 ? (record.nominal_bayar - record.total_harga).toLocaleString() : '-'}</>
    //   ),
    // },
    {
      title: 'Waktu',
      key: 'created_at',
      render: (_, record) => (
        <>{dayjs(record.created_at).format('HH:mm')}</>
      ),
    },
    {
      title: 'Struk',
      key: 'struk',
      render: (_, record) => (
        <Space>
          <Button onClick={() => navigate('/trxdetail/'+record.id)} icon={<EditOutlined />} type="primary">Detail</Button>
          <Button onClick={() => onShowInvoice(record)} icon={<PrinterOutlined />} variant="outlined" color="primary" />
        </Space>
        
      ),
    },
  ];

  return (
    <>
      {contextHolder}
      <Title level={4} style={{marginTop:10, marginBottom:-10}}>Riwayat Transaksi</Title>
      <Divider />

      <Tabs 
        defaultActiveKey="1" 
        items={dataStatusFilter} 
        onChange={(value) => setStatusFilter(value)} 
        tabPosition='top'
        style={{ marginLeft:10, marginTop:-20 }} />
        
      <Space>
        <DatePicker 
          defaultValue={dayjs(dateFilter, dateFormat)} 
          format={dateFormat}  
          onChange={(date, dateString) => setDateFilter(dateString)} 
          allowClear={false}
        />
        <Search placeholder="Cari note" allowClear onChange={(e) => setSearchFilter(e.target.value)} />
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
        onChange={onTableChange}
        pagination={{
          total: dataTotal,
          hideOnSinglePage: true,
          showSizeChanger: false,
        }}
      />

      <Modal 
        title="Struk" 
        open={modalShow} 
        onCancel={() => setModalShow(false)}
        centered
        width={450}
        footer={[
          <>
            <Button type="primary" key="back" onClick={() => setModalShow(false)}>
              Tutup
            </Button>
            <Popconfirm
              title="Peringatan"
              description="Yakin menghapus data?"
              onConfirm={() => onDelete()}
              okText="Ya"
              cancelText="Batal"
            >
              <Button color="danger" variant="outlined" key="cancel">
                Hapus
              </Button>
            </Popconfirm>
          </>
        ]}
      >
        <PDFViewer width="400" height="500" className="app" >
          <Document>
            <Page size="A5" style={styles.container}>
              <Text style={styles.title}>FRUK SABIN</Text>
              <Text style={styles.address}>Angkatan 2024/2025</Text>

              <View style={styles.row}>
                <Text>Kode Transaksi</Text>
                <Text>#{dataPenjualanKode}</Text>
              </View>
              <View style={styles.row}>
                <Text>Waktu Transaksi</Text>
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
                  <Text>Pembayaran</Text>
                  <Text>Rp {dataPenjualanTotalBayar.toLocaleString()}</Text>
                </View>
                <View style={styles.row}>
                  <Text>Kembalian</Text>
                  <Text>Rp {(dataPenjualanTotalBayar - dataPenjualanTotalHarga).toLocaleString()}</Text>
                </View>
              </View>
              }

              <View>
                <View style={styles.row}>
                  <Text>Metode</Text>
                  <Text>{dataPenjualanMetodeBayar}</Text>
                </View>
              </View>
              <View>
                <View style={styles.row}>
                  <Text>Note</Text>
                  <Text>{dataPenjualanNote ? dataPenjualanNote : '-'}</Text>
                </View>
              </View>
              

            </Page>
          </Document>
        </PDFViewer>
      </Modal>
    </>
  )
};
export default TrxList;