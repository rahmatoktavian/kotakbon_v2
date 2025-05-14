import React, { useEffect, useState } from 'react';
import { Row, Col, Form, Button, Input, Typography, Divider, message } from 'antd';
import { LoginOutlined } from '@ant-design/icons';
import { supabase } from '../../config/supabase'

const { Title } = Typography;

const AuthLogin = () => {
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [isLoading, setIsLoading] = useState(false);

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
    }

    setIsLoading(false)
  }

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
              rules={[{ required:true, type: 'email' }]}
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
};
export default AuthLogin;