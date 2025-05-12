import React, { useState } from 'react';
import { Space, Typography, Divider, Form, Button, Input, message } from 'antd';
import { CheckOutlined } from '@ant-design/icons';
import { supabase } from '../../config/supabase'

const AuthResetPass = () => {
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [isLoading, setIsLoading] = useState(false);
  
  const { Title } = Typography;

  async function onFinish(values) {
    setIsLoading(true)
    const { data, error } = await supabase.auth.updateUser({
      password: values.new_password
    })

    if(error) {
        messageApi.open({
          type: 'error',
          content: error.message,
        });
    } else {
        messageApi.open({
          type: 'success',
          content: 'Berhasil ubah password',
        });
    }
    
    setIsLoading(false)
  }

  return (
    <>
      {contextHolder}
      <Title level={4} style={{marginTop:10, marginBottom:-10}}>Reset Password</Title>
      <Divider />

      <Form
        name="basic"
        autoComplete="off"
        layout="vertical"
        form={form}
        onFinish={onFinish}
      >
        <Form.Item
          label="New Password"
          name="new_password"
          rules={[{ required: true, min:6 }]}
        >
          <Input.Password />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button key="save" type="primary" htmlType="submit" icon={<CheckOutlined />} loading={isLoading}>
              Simpan
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </>
  )
};
export default AuthResetPass;