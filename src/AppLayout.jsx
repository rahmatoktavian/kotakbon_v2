import React, { useEffect } from 'react';
import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router';
import { Layout, Row, Col, Menu, Typography, Button } from 'antd';
import { FormOutlined, FileDoneOutlined, SettingOutlined, PoweroffOutlined } from '@ant-design/icons';
import { supabase } from './config/supabase'

const layoutStyle = {
  borderRadius: 8,
  overflow: 'hidden',
  width: 'calc(100% - 10px)',
  maxWidth: 'calc(100% - 10px)',
};

const menuItems = [
  {
    label: 'Transaksi',
    key: 'transaksi',
    icon: <FormOutlined />,
    children: [
      {
        key: '/',
        label: 'Input',
      },
      {
        key: 'trxlist',
        label: 'Riwayat',
      },
    ]
  },
  {
    label: 'Laporan',
    key: 'laporan',
    icon: <FileDoneOutlined />,
    children: [
      {
        key: 'lapsupplierharian',
        label: 'Rekap Supplier Harian',
      },
      {
        key: 'lapstokharian',
        label: 'Rekap Stok Harian',
      },
      {
        key: 'lappenjualanharian',
        label: 'Rekap Penjualan Harian',
      },
    ],
  },
  {
    label: 'Setting',
    key: 'setting',
    icon: <SettingOutlined />,
    children: [
      {
        key: 'setstokawal',
        label: 'Stok Awal',
      },
      {
        key: 'setproduk',
        label: 'Produk',
      },
      {
        key: 'setkategori',
        label: 'Kategori',
      },
      
      {
        key: 'setsupplier',
        label: 'Supplier',
      },
    ],
  },
];

const AppLayout = () => {
  const { Header, Footer, Sider, Content } = Layout;
  const { Title } = Typography;

  const navigate = useNavigate();
  const [current, setCurrent] = useState('penjualan');

  const onClick = (e) => {
    setCurrent(e.key)
    navigate(e.key);
  };

  const location = useLocation();
  useEffect(() => {
    const currentRoute = location.pathname.replace('/', '')
    setCurrent(currentRoute)
  }, []);

  async function signOut() {
    const { error } = await supabase.auth.signOut()
  }
  
  return (
    <Layout style={layoutStyle}>
      <Header style={{backgroundColor:'#fff',marginBottom:5,height:50 }}>
        <Row>
          <Col span={22}>
            <Title level={3} style={{marginTop:5, marginLeft:-20}}>kotakbon</Title>
          </Col>
          <Col span={2}>
            <Button 
              onClick={() => signOut()} 
              icon={<PoweroffOutlined />} 
              variant="outlined" 
              color="primary" 
              style={{ display:"flex", marginTop:5 }}>
                Logout
              </Button>
          </Col>
        </Row>
      </Header>
      <Layout>
        <Sider theme="light" collapsible={true} defaultCollapsed={true}>
          <Menu mode="inline" items={menuItems} onClick={onClick} selectedKeys={[current]} />
        </Sider>
        <Content style={{backgroundColor:'#fff',marginLeft:3, padding:10 }}><Outlet /></Content>
      </Layout>
    </Layout>
  )
};
export default AppLayout;