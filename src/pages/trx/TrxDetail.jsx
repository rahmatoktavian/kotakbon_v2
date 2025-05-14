import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from "react-router";
import { Space, Typography, Divider, Table, Modal, Form, Button, Select, Popconfirm, message, Input, InputNumber } from 'antd';
import { ArrowLeftOutlined, PlusOutlined, CheckOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { supabase } from '../../config/supabase'

const TrxDetail = () => {
  let { id } = useParams();
  const navigate = useNavigate();

  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [isLoading, setIsLoading] = useState(false);

  const [dataPenjualan, setDataPenjualan] = useState([]);
  const [dataProdukPenjualan, setDataProdukPenjualan] = useState([]);
  const [dataProdukPenjualanID, setDataProdukPenjualanID] = useState([]);
  const [dataProduk, setDataProduk] = useState([]);
  const [dataSelectProduk, setDataSelectProduk] = useState(0);

  const [dataPenjualanMetode, setDataPenjualanMetode] = useState('CASH');
  const [dataPenjualanTotal, setDataPenjualanTotal] = useState(0);
  const [dataPenjualanPembayaran, setDataPenjualanPembayaran] = useState('');
  const [dataPenjualanKembalian, setDataPenjualanKembalian] = useState('');
  const [dataPenjualanNote, setDataPenjualanNote] = useState('');

  const [dataPenjualanUpdatedBy, setDataPenjualanUpdatedBy] = useState('');
  const [dataPenjualanUpdatedAt, setDataPenjualanUpdatedAt] = useState('');
  

  const [modalShow, setModalShow] = useState(false);
  
  const { Title } = Typography;

  const metodePembayaran = [
    { key:0, label: 'CASH', value: 'CASH' },
    { key:1, label: 'QRIS', value: 'QRIS' },
    { key:2, label: 'TRANSFER', value: 'TRANSFER' },
  ];

  useEffect(() => {
    getDataPenjualan();
    getDataProdukPenjualan(0);
  }, []);

  async function getDataPenjualan() {
    setIsLoading(true)
    const { data:penjualan } = await supabase.from("penjualan")
                                      .select('id,kode,tanggal,total_harga,list_produk,nominal_bayar,metode_bayar,keterangan,lunas,created_at,created_by,updated_at,updated_by')
                                      .eq('id', id)
                                      .single()
    setDataPenjualan(penjualan)
    setDataPenjualanTotal(penjualan.total_harga)
    setDataPenjualanPembayaran(penjualan.nominal_bayar)
    setDataPenjualanKembalian(penjualan.nominal_bayar - penjualan.total_harga)
    setDataPenjualanMetode(penjualan.metode_bayar)
    setDataPenjualanNote(penjualan.keterangan)
    setDataPenjualanUpdatedBy(penjualan.updated_by)
    setDataPenjualanUpdatedAt(penjualan.updated_at)

    const { data:produk, error } = await supabase.rpc("produk_stok_harian_v2", { 
                            date_filter:penjualan.tanggal,
                            nama_filter:null, 
                            kategori_filter:null, 
                            supplier_filter:null,
                            limit_filter: 1000,
                            offset_filter: 0
                        })
                        
    const produkList = []
    produk && produk.map((val) => {
      if(val.produk_stok_qty > 0) {
        produkList.push({ 
                          value:val.id, 
                          label:val.nama+' - Rp '+val.harga.toLocaleString()+' (Stok: '+val.produk_stok_qty+')',
                          stok:val.produk_stok_qty, 
                          harga:val.harga, 
                          hpp:val.hpp, 
                        })
      }
    })

    setDataProduk(produkList)
    setIsLoading(false)
  }

  async function getDataProdukPenjualan(is_update) {
    setIsLoading(true)
    const { data } = await supabase.from("produk_penjualan")
                                      .select('id,harga,hpp,qty,produk_id,produk(nama)')
                                      .eq('penjualan_id', id)
                                      .order('id', { ascending:false })
    setDataProdukPenjualan(data)

    let total_produk = 0;
    let total_harga = 0;
    let total_hpp = 0;
    let list_produk_label = '';
    let list_produk_penjualan = []
    data.map((val, idx) => {
      total_produk = total_produk + val.qty
      total_harga = total_harga + (val.qty * val.harga)
      total_hpp = total_hpp + (val.qty * val.hpp)
      list_produk_label = idx > 0 ? list_produk_label + ','+val.produk.nama : list_produk_label + val.produk.nama
      list_produk_penjualan.push(val.produk_id)
    })
    list_produk_label = list_produk_label.substring(0, 50)
    setDataProdukPenjualanID(list_produk_penjualan)
    setDataPenjualanTotal(total_harga)

    if(is_update == 1) {
      await supabase
        .from('penjualan')
        .update({
          total_produk: total_produk,
          total_harga: total_harga,
          total_hpp: total_hpp,
          list_produk: list_produk_label,
        })
        .eq('id', id)
    }
    
    setIsLoading(false)
  }

  async function onFinishProduk(values) {
    if (dataProdukPenjualanID.includes(values.produk)) {
      messageApi.open({
        type: 'error',
        content: 'Produk sudah ada',
      });

    } else if(values.jumlah > dataSelectProduk.stok) {
      messageApi.open({
        type: 'error',
        content: 'Jumlah melebihi stok ('+dataSelectProduk.stok+')',
      });

    } else {
      setIsLoading(true)

      const { data:{user} } = await supabase.auth.getUser()
      const currTime = new Date()

      await supabase
          .from('penjualan')
          .update({
            updated_by: user.email,
            updated_at: currTime,
          })
          .eq('id',id)
      setDataPenjualanUpdatedBy(user.email)
      setDataPenjualanUpdatedAt(currTime)

      const { error } = await supabase
      .from('produk_penjualan')
      .insert({ 
        penjualan_id: dataPenjualan.id,
        harga: dataSelectProduk.harga,
        hpp: dataSelectProduk.hpp,
        produk_id: values.produk,
        qty: values.jumlah,
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

      getDataProdukPenjualan(1)
      form.setFieldsValue({
        produk: null,
        jumlah: null
      })
      setModalShow(false)
      setIsLoading(false)
    }
  }

  function onSelectProduk(value) {
    form.setFieldsValue({ produk:value })
    
    let selectProduk = []
    dataProduk.map((val) => {
      if(val.value == value) {
        selectProduk.push({
          stok: val.stok,
          harga: val.harga,
          hpp: val.hpp,
        })
      }
    })

    setDataSelectProduk(selectProduk[0])
  }

  async function onDeleteProduk(id) {
    setIsLoading(true)

    const { data:{user} } = await supabase.auth.getUser()
    const currTime = new Date()

    await supabase
          .from('penjualan')
          .update({
            updated_by: user.email,
            updated_at: currTime,
          })
          .eq('id',id)
    setDataPenjualanUpdatedBy(user.email)
    setDataPenjualanUpdatedAt(currTime)

    const { error } = await supabase
          .from('produk_penjualan')
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

    getDataProdukPenjualan(1)
    setModalShow(false)
    setIsLoading(false)
  }

  async function onFinishPenjualan() {
    setIsLoading(true)

    const { data:{user} } = await supabase.auth.getUser()
    const currTime = new Date()

    const { error } = await supabase
          .from('penjualan')
          .update({
            nominal_bayar: dataPenjualanPembayaran,
            nominal_kembalian: dataPenjualanKembalian,
            metode_bayar: dataPenjualanMetode,
            keterangan: dataPenjualanNote,
            lunas: 1,
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

    setIsLoading(false)
    navigate('/trxlist')
  }

  async function onDeletePenjualan() {
    setIsLoading(true)

    await supabase
        .from('produk_penjualan')
        .delete()
        .eq('penjualan_id',id)

    const { error } = await supabase
          .from('penjualan')
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

    setIsLoading(false)
    navigate('/trxlist')
  }

  const columns = [
    {
      title: 'Produk',
      key: 'nama',
      render: (_, record) => (
        <>{record.produk.nama}</>
      )
    },
    {
      title: 'Harga',
      key: 'harga',
      align: 'right',
      render: (_, record) => (
        <>{record.harga.toLocaleString()}</>
      )
    },
    {
      title: 'Jumlah',
      key: 'qty',
      align: 'right',
      render: (_, record) => (
       <>{record.qty+' Pcs'}</>
      )
    },
    {
      title: 'Subtotal',
      key: 'subtotal',
      align: 'right',
      render: (_, record) => (
        <>{(record.harga*record.qty).toLocaleString()}</>
      )
    },
    {
      title: 'Action',
      key: 'action',
      align: 'right',
      render: (_, record) => (
        <Popconfirm
          title="Peringatan"
          description="Yakin menghapus data?"
          onConfirm={() => onDeleteProduk(record.id)}
          okText="Ya"
          cancelText="Batal"
        >
          <Button key="delete" color="danger" variant='outlined' icon={<DeleteOutlined />} disabled={dataPenjualan.lunas == 0 ? false : true}>
            Hapus
          </Button>
        </Popconfirm>
      ),
    },
  ];

  function onChangeNominalBayar(nominal_bayar) {
    setDataPenjualanPembayaran(nominal_bayar)
    let nominal_kembalian = nominal_bayar - dataPenjualanTotal
    setDataPenjualanKembalian(nominal_kembalian)
  }

  return (
    <>
      {contextHolder}
      <Title level={4} style={{marginTop:10, marginBottom:-10}}>Detail Transaksi</Title>
      <Divider />

      <Space>
        <Button onClick={() => navigate('/trxlist')} icon={<ArrowLeftOutlined />} variant="outlined" color="primary">Kembali</Button>
        {dataPenjualan.lunas == 0 && <Button onClick={() => setModalShow(true)} icon={<PlusOutlined />} type="primary">Tambah</Button>}
      </Space>
      
      <Table 
        columns={columns} 
        dataSource={dataProdukPenjualan} 
        rowKey="id" 
        style={{marginTop:10}} 
        loading={isLoading}
        pagination={false}
        summary={() => {
          return (
            <>
              <Table.Summary.Row>
                <Table.Summary.Cell index={0}>
                  <span style={{fontSize:11, color:'grey'}}>Dibuat</span>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={1}>
                  <span style={{fontSize:11, color:'grey'}}>
                  {dataPenjualan.created_by}
                  <br />
                  {dayjs(dataPenjualan.created_at).format('YYYY-MM-DD HH:mm')}
                  </span>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={2} align="right">
                  <span style={{fontWeight:'bold'}}>METODE BAYAR</span>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={3} align="right">
                  <Select
                    placeholder="Pilih"
                    value={dataPenjualanMetode}
                    onChange={(value) => setDataPenjualanMetode(value)}
                    disabled={dataPenjualan.lunas == 0 ? false : true}
                    options={metodePembayaran}
                    style={{ width:250 }}
                  />
                </Table.Summary.Cell>
              </Table.Summary.Row>
              <Table.Summary.Row>
                <Table.Summary.Cell index={0}>
                  <span style={{fontSize:11, color:'grey'}}>{dataPenjualanUpdatedBy ? 'Diubah' : ''}</span>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={1}>
                  {dataPenjualanUpdatedBy &&
                    <span style={{fontSize:11, color:'grey'}}>
                    {dataPenjualanUpdatedBy}
                    <br />
                    {dayjs(dataPenjualanUpdatedAt).format('YYYY-MM-DD HH:mm')}
                    </span>
                  }
                </Table.Summary.Cell>
                <Table.Summary.Cell index={2} align="right">
                  <span style={{fontWeight:'bold'}}>TOTAL PESANAN</span>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={3} align="right">
                  <span style={{fontWeight:'bold'}}>{dataPenjualanTotal.toLocaleString()}</span>
                </Table.Summary.Cell>
              </Table.Summary.Row>
              
              {dataPenjualanMetode == 'CASH' &&
              <>
              <Table.Summary.Row>
                <Table.Summary.Cell index={0}></Table.Summary.Cell>
                <Table.Summary.Cell index={1}></Table.Summary.Cell>
                <Table.Summary.Cell index={2} align="right">
                  <span style={{fontWeight:'bold'}}>NOMINAL BAYAR</span>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={3} align="right">
                  <InputNumber
                    value={dataPenjualanPembayaran}
                    onChange={(value) => onChangeNominalBayar(value)}
                    disabled={dataPenjualan.lunas == 0 ? false : true}
                    formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    style={{ width:250 }}
                  />
                </Table.Summary.Cell>
              </Table.Summary.Row>
              <Table.Summary.Row>
                <Table.Summary.Cell index={0}></Table.Summary.Cell>
                <Table.Summary.Cell index={1}></Table.Summary.Cell>
                <Table.Summary.Cell index={2} align="right">
                  <span style={{fontWeight:'bold'}}>KEMBALIAN</span>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={3} align="right">
                  <InputNumber
                    value={dataPenjualanPembayaran < dataPenjualanTotal ? 0 : dataPenjualanKembalian.toLocaleString()}
                    disabled={true}
                    align='right'
                    style={{ width:250 }}
                  />
                </Table.Summary.Cell>
              </Table.Summary.Row>
              </>
              }
              <Table.Summary.Row>
                <Table.Summary.Cell index={0}></Table.Summary.Cell>
                <Table.Summary.Cell index={1}></Table.Summary.Cell>
                <Table.Summary.Cell index={2} align="right">
                  <span style={{fontWeight:'bold'}}>NOTE / PEMESAN</span>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={3} align="right">
                  <Input
                    value={dataPenjualanNote}
                    onChange={(e) => setDataPenjualanNote(e.target.value)}
                    disabled={dataPenjualan.lunas == 0 ? false : true}
                    style={{ width:250 }} 
                  />
                </Table.Summary.Cell>
              </Table.Summary.Row>
              <Table.Summary.Row>
                <Table.Summary.Cell index={0}></Table.Summary.Cell>
                <Table.Summary.Cell index={1}></Table.Summary.Cell>
                <Table.Summary.Cell index={2}></Table.Summary.Cell>
                <Table.Summary.Cell index={3} align="right">
                  <Space>
                    <Button key="save" type="primary" icon={<CheckOutlined />} loading={isLoading} size="large" onClick={() => onFinishPenjualan()} disabled={(dataPenjualan.lunas == 0 && dataPenjualanPembayaran >= dataPenjualanTotal) ? false : true} style={{ width:200 }}>
                      Lunas
                    </Button>
                    <Popconfirm
                      title="Peringatan"
                      description="Yakin menghapus data?"
                      onConfirm={() => onDeletePenjualan()}
                      okText="Ya"
                      cancelText="Batal"
                    >
                      <Button key="delete" color="danger" variant='outlined' icon={<DeleteOutlined />} loading={isLoading} size="large" disabled={dataPenjualan.lunas == 0 ? false : true} style={{ width:50 }} />
                    </Popconfirm>
                  </Space>
                </Table.Summary.Cell>
              </Table.Summary.Row>
            </>
          );
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
          onFinish={onFinishProduk}
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
              onChange={(value) => onSelectProduk(value)}
              options={dataProduk}
            />
          </Form.Item>
          <Form.Item
            label="Jumlah"
            name="jumlah"
            rules={[{ required: true }]}
          >
            <InputNumber />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button key="save" type="primary" htmlType="submit" icon={<CheckOutlined />} loading={isLoading}>
                Simpan
              </Button>
              <Button key="back" onClick={() => setModalShow(false)}>
                Batal
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
};
export default TrxDetail;