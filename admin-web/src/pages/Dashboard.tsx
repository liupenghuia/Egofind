import { useEffect, useState } from 'react';
import { Card, Col, Row, Statistic, Table } from 'antd';
import { statsByAdcode } from '../api/admin';

export default function Dashboard() {
  const [data, setData] = useState<{
    driverTrips: { originAdcode: string; _count: { id: number } }[];
    passengerRequests: { originAdcode: string; _count: { id: number } }[];
    matchOrders: number;
  } | null>(null);

  useEffect(() => {
    statsByAdcode().then(setData).catch(() => setData(null));
  }, []);

  const tripTotal = data?.driverTrips.reduce((s, r) => s + r._count.id, 0) ?? 0;
  const reqTotal = data?.passengerRequests.reduce((s, r) => s + r._count.id, 0) ?? 0;

  return (
    <>
      <Row gutter={16}>
        <Col span={8}>
          <Card>
            <Statistic title="车找人" value={tripTotal} />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic title="人找车" value={reqTotal} />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic title="匹配单" value={data?.matchOrders ?? 0} />
          </Card>
        </Col>
      </Row>
      <Card title="按区县 · 车找人" style={{ marginTop: 16 }}>
        <Table
          rowKey="originAdcode"
          dataSource={data?.driverTrips || []}
          columns={[
            { title: 'adcode', dataIndex: 'originAdcode' },
            { title: '数量', dataIndex: ['_count', 'id'] },
          ]}
          pagination={false}
          size="small"
        />
      </Card>
    </>
  );
}
