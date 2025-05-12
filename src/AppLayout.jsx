import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router';
import { Layout, Row, Col, Menu, Typography, Button, Dropdown, Space } from 'antd';
import { FormOutlined, FileDoneOutlined, SettingOutlined, PoweroffOutlined, EditOutlined, UserOutlined, DownOutlined } from '@ant-design/icons';
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
  const [dataUser, setDataUser] = useState('');

  const onClick = (e) => {
    setCurrent(e.key)
    navigate(e.key);
  };

  const location = useLocation();
  useEffect(() => {
    getUser()

    const currentRoute = location.pathname.replace('/', '')
    setCurrent(currentRoute)
  }, []);

  async function getUser() {
    const { data: { user } } = await supabase.auth.getUser()
    if(user)
      setDataUser(user.email)
  }

  async function onLogout() {
    const { error } = await supabase.auth.signOut()
  }

  const items = [
    {
      key: '1',
      icon: <EditOutlined />,
      label: (
        <a onClick={() => navigate('authresetpass')}>
          Reset Password
        </a>
      ),
    },
    {
      key: '2',
      icon: <PoweroffOutlined />,
      label: (
        <a onClick={() => onLogout()}>
          Logout
        </a>
      )
    },
  ];

  return (
    <Layout style={layoutStyle}>
      <Header style={{backgroundColor:'#fff',marginBottom:5,height:50 }}>
        <Row>
          <Col span={20}>
            <Title level={3} style={{marginTop:5, marginLeft:-20}}>kotakbon</Title>
          </Col>
          <Col span={4}>
            <Dropdown menu={{ items }} style={{marginBottom:20}}>
              <a onClick={e => e.preventDefault()}>
                <Space>
                  {dataUser}
                  <DownOutlined />
                </Space>
              </a>
            </Dropdown>
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