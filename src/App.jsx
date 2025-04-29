import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from "react-router";
import { Row, Col, Form, Button, Input, Typography, Divider, message } from 'antd';
import { LoginOutlined } from '@ant-design/icons';

import { supabase } from './config/supabase'
import AppLayout from "./AppLayout";

import TrxInput from "./pages/trx/TrxInput";
import TrxList from "./pages/trx/TrxList";

import LapPenjualanHarian from "./pages/lap/LapPenjualanHarian";
import LapStokHarian from "./pages/lap/LapStokHarian";

import SetStokAwal from "./pages/set/SetStokAwal";
import SetProduk from "./pages/set/SetProduk";
import SetSupplier from "./pages/set/SetSupplier";
import SetKategori from "./pages/set/SetKategori";

const { Title } = Typography;

const App = () => {
  const [form] = Form.useForm()
  const [messageApi, contextHolder] = message.useMessage()
  const [session, setSession] = useState(null)
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function onLogin(values) {
    setIsLoading(true)

    const { data, error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    })

    if(error) {
        messageApi.open({
          type: 'error',
          content: error.message,
        });
    } else {
        setSession(data.session)
        messageApi.open({
          type: 'success',
          content: 'Berhasil login',
        });
    }

    setIsLoading(false)
  }

  // not login
  if (!session) {
    return (
      <Row>
        {contextHolder}
        <Col span={8}></Col>
        <Col span={8}>
          <Title level={2} style={{display:'flex', justifyContent:'center', alignItems:'center'}}>kotakbon</Title>
          <Divider />
          <Form
            name="basic"
            autoComplete="off"
            layout="vertical"
            form={form}
            onFinish={onLogin}
          >
            <Form.Item
              label="Email"
              name="email"
              rules={[{ required:true }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              label="Password"
              name="password"

              rules={[{ required:true }]}
            >
              <Input.Password />
            </Form.Item>
            <Form.Item>
              <Button block size="large" key="save" type="primary" htmlType="submit" icon={<LoginOutlined />} loading={isLoading}>
                Login
              </Button>
            </Form.Item>
          </Form>
        </Col>
        <Col span={8}></Col>
      </Row>
    )

  // logged
  } else {
    return (
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<AppLayout />}>
              <Route index element={<TrxInput />} />
              <Route path="/trxlist" element={<TrxList />} />

              <Route path="/lappenjualanharian" element={<LapPenjualanHarian />} />
              <Route path="/lapstokharian" element={<LapStokHarian />} />

              <Route path="/setstokawal" element={<SetStokAwal />} />
              <Route path="/setproduk" element={<SetProduk />} />
              <Route index path="/setsupplier" element={<SetSupplier />} />
              <Route path="/setkategori" element={<SetKategori />} />
            </Route>
          </Routes>
        </BrowserRouter>
      )
    }
    //end logged
};
export default App;