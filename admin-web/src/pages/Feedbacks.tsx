import { useEffect, useState } from 'react';
import { Table, Tag, Typography } from 'antd';
import { request } from '../api/request';

export default function Feedbacks() {
  const [data, setData] = useState<{
    yearMonth: string;
    limit: number;
    items: any[];
    driverReasonAgg: any[];
  } | null>(null);

  useEffect(() => {
    request
      .get('/admin/trip-feedbacks')
      .then((r) => setData(r.data))
      .catch(() => setData(null));
  }, []);

  return (
    <>
      <Typography.Title level={5}>
        无法同行反馈 · {data?.yearMonth || '-'}（司机原因上限 {data?.limit ?? 10}）
      </Typography.Title>
      <Typography.Paragraph type="secondary">本月司机原因聚合</Typography.Paragraph>
      <Table
        size="small"
        rowKey="driverId"
        dataSource={data?.driverReasonAgg || []}
        pagination={false}
        style={{ marginBottom: 24 }}
        columns={[
          { title: '司机 ID', dataIndex: 'driverId', ellipsis: true },
          { title: '司机原因次数', dataIndex: 'driverReasonCount' },
          {
            title: '受限',
            dataIndex: 'restricted',
            render: (v: boolean) =>
              v ? <Tag color="red">是</Tag> : <Tag color="green">否</Tag>,
          },
        ]}
      />
      <Table
        rowKey="id"
        dataSource={data?.items || []}
        columns={[
          { title: '原因', dataIndex: 'reason' },
          { title: '司机', dataIndex: ['driver', 'nickname'] },
          { title: '乘客', dataIndex: ['passenger', 'nickname'] },
          {
            title: '行程',
            render: (_, r) =>
              r.driverTrip
                ? `${r.driverTrip.originName} → ${r.driverTrip.destName}`
                : '-',
          },
          { title: '备注', dataIndex: 'remark', ellipsis: true },
          { title: '时间', dataIndex: 'createdAt' },
        ]}
      />
    </>
  );
}
