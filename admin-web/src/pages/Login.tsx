import { Button, Card, Form, Input, Typography, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { adminLogin } from '../api/auth';

export default function Login() {
  const nav = useNavigate();

  const onFinish = async (v: { username: string; password: string }) => {
    try {
      const data = await adminLogin(v.username, v.password);
      localStorage.setItem('egofind_admin_token', data.accessToken);
      message.success('登录成功');
      nav('/');
    } catch {
      /* handled */
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        background: 'linear-gradient(135deg,#1677ff22,#0000)',
      }}
    >
      <Card style={{ width: 380 }}>
        <Typography.Title level={3}>egofind 管理登录</Typography.Title>
        <Typography.Paragraph type="secondary">默认 admin / Admin123!</Typography.Paragraph>
        <Form layout="vertical" onFinish={onFinish} initialValues={{ username: 'admin' }}>
          <Form.Item name="username" label="账号" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="password" label="密码" rules={[{ required: true }]}>
            <Input.Password />
          </Form.Item>
          <Button type="primary" htmlType="submit" block>
            登录
          </Button>
        </Form>
      </Card>
    </div>
  );
}
