import React, { useEffect } from 'react';
import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router';
import { Layout, Menu, Typography } from 'antd';
import { FormOutlined, FileDoneOutlined,SettingOutlined } from '@ant-design/icons';

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
        key: 'trxinput',
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
        key: 'lap_penjualan',
        label: 'Penjualan & Laba',
      },
      {
        key: 'lap_stok',
        label: 'Stok Produk',
      },
    ],
  },
  {
    label: 'Setting',
    key: 'setting',
    icon: <SettingOutlined />,
    children: [
      {
        key: 'setstok',
        label: 'Stok',
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
  
  return (
    <Layout style={layoutStyle}>
      <Header style={{backgroundColor:'#fff',marginBottom:5,height:50 }}>
        <Title level={3} style={{marginTop:5, marginLeft:-20}}>KotakBon</Title>
      </Header>
      <Layout>
        <Sider theme="light" collapsible>
          <Menu mode="inline" items={menuItems} onClick={onClick} selectedKeys={[current]} />
        </Sider>
        <Content style={{backgroundColor:'#fff',marginLeft:3, padding:10 }}><Outlet /></Content>
      </Layout>
    </Layout>
  )
};
export default AppLayout;