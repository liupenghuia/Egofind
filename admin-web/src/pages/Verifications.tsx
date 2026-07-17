import { useEffect, useState } from 'react';
import { Button, Space, Table, message } from 'antd';
import { listVerifications, reviewVerification } from '../api/admin';

export default function Verifications() {
  const [rows, setRows] = useState<any[]>([]);
  const load = () => listVerifications().then(setRows).catch(() => setRows([]));
  useEffect(() => {
    load();
  }, []);

  return (
    <Table
      rowKey="id"
      dataSource={rows}
      columns={[
        { title: '用户', dataIndex: ['user', 'nickname'] },
        { title: '车牌', dataIndex: 'plateNo' },
        { title: '车型', dataIndex: 'carModel' },
        { title: '状态', dataIndex: 'status' },
        {
          title: '操作',
          render: (_, row) => (
            <Space>
              <Button
                type="primary"
                size="small"
                onClick={async () => {
                  await reviewVerification(row.id, true);
                  message.success('已通过');
                  load();
                }}
              >
                通过
              </Button>
              <Button
                danger
                size="small"
                onClick={async () => {
                  await reviewVerification(row.id, false, '资料不全');
                  message.success('已驳回');
                  load();
                }}
              >
                驳回
              </Button>
            </Space>
          ),
        },
      ]}
    />
  );
}
