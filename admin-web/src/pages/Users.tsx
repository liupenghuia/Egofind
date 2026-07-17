import { useEffect, useState } from 'react';
import { Button, Space, Table, Tag, message } from 'antd';
import { listUsers, setUserStatus } from '../api/admin';

export default function Users() {
  const [data, setData] = useState<{ items: any[]; total: number }>({ items: [], total: 0 });
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await listUsers();
      setData(res);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <Table
      rowKey="id"
      loading={loading}
      dataSource={data.items}
      columns={[
        { title: '昵称', dataIndex: 'nickname' },
        { title: '用户名', dataIndex: 'username' },
        { title: '手机掩码', dataIndex: 'phoneMask' },
        {
          title: '角色',
          dataIndex: 'roles',
          render: (roles: { code: string }[]) =>
            roles?.map((r) => <Tag key={r.code}>{r.code}</Tag>),
        },
        {
          title: '状态',
          dataIndex: 'status',
          render: (s: number) => (s === 1 ? <Tag color="green">正常</Tag> : <Tag color="red">禁用</Tag>),
        },
        {
          title: '操作',
          render: (_, row) => (
            <Space>
              <Button
                size="small"
                danger={row.status === 1}
                onClick={async () => {
                  await setUserStatus(row.id, row.status === 1 ? 0 : 1);
                  message.success('已更新');
                  load();
                }}
              >
                {row.status === 1 ? '禁用' : '启用'}
              </Button>
            </Space>
          ),
        },
      ]}
    />
  );
}
