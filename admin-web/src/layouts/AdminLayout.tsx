import { Layout, Menu, Typography, Button, Space } from 'antd';
import {
  UserOutlined,
  CarOutlined,
  AuditOutlined,
  DashboardOutlined,
  EnvironmentOutlined,
  LogoutOutlined,
  AlertOutlined,
} from '@ant-design/icons';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';

const { Header, Sider, Content } = Layout;

const items = [
  { key: '/', icon: <DashboardOutlined />, label: <Link to="/">数据概览</Link> },
  { key: '/users', icon: <UserOutlined />, label: <Link to="/users">用户管理</Link> },
  { key: '/orders', icon: <CarOutlined />, label: <Link to="/orders">订单管理</Link> },
  { key: '/verifications', icon: <AuditOutlined />, label: <Link to="/verifications">司机认证</Link> },
  { key: '/reports', icon: <AlertOutlined />, label: <Link to="/reports">举报管理</Link> },
  { key: '/map', icon: <EnvironmentOutlined />, label: <Link to="/map">地图预览</Link> },
  { key: '/feedbacks', icon: <AuditOutlined />, label: <Link to="/feedbacks">无法同行反馈</Link> },
];

export default function AdminLayout() {
  const loc = useLocation();
  const nav = useNavigate();
  const selected = items.find((i) => i.key !== '/' && loc.pathname.startsWith(i.key))?.key || '/';

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider breakpoint="lg" collapsedWidth={64}>
        <div style={{ color: '#fff', padding: 16, fontWeight: 700 }}>egofind Admin</div>
        <Menu theme="dark" mode="inline" selectedKeys={[selected]} items={items} />
      </Sider>
      <Layout>
        <Header
          style={{
            background: '#fff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingInline: 24,
          }}
        >
          <Typography.Title level={4} style={{ margin: 0 }}>
            同城顺风车管理后台
          </Typography.Title>
          <Space>
            <Button
              icon={<LogoutOutlined />}
              onClick={() => {
                localStorage.removeItem('egofind_admin_token');
                nav('/login');
              }}
            >
              退出
            </Button>
          </Space>
        </Header>
        <Content style={{ margin: 24 }}>
          <div style={{ background: '#fff', padding: 24, minHeight: 360, borderRadius: 8 }}>
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}
