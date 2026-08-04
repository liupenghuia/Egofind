import { useEffect, useState } from 'react';
import { Card, Col, Row, Statistic, Table, Typography } from 'antd';
import {
  listReports,
  listVerifications,
  statsByAdcode,
} from '../api/admin';

export default function Dashboard() {
  const [data, setData] = useState<{
    driverTrips: { originAdcode: string; _count: { id: number } }[];
    passengerRequests: { originAdcode: string; _count: { id: number } }[];
    matchOrders: number;
  } | null>(null);
  const [pendingVerify, setPendingVerify] = useState<number | null>(null);
  const [pendingReports, setPendingReports] = useState<number | null>(null);

  useEffect(() => {
    statsByAdcode().then(setData).catch(() => setData(null));
    listVerifications()
      .then((rows) => setPendingVerify(Array.isArray(rows) ? rows.length : 0))
      .catch(() => setPendingVerify(0));
    listReports()
      .then((rows) => setPendingReports(Array.isArray(rows) ? rows.length : 0))
      .catch(() => setPendingReports(0));
  }, []);

  const tripTotal = data?.driverTrips.reduce((s, r) => s + r._count.id, 0) ?? 0;
  const reqTotal =
    data?.passengerRequests.reduce((s, r) => s + r._count.id, 0) ?? 0;

  return (
    <>
      <Typography.Title level={5} style={{ marginTop: 0 }}>
        运营概览
      </Typography.Title>
      <Typography.Paragraph type="secondary">
        待办取自现有列表接口（待审认证、OPEN/REVIEWING 举报）；下方为区县体量统计。
      </Typography.Paragraph>
      <Row gutter={16}>
        <Col span={8}>
          <Card>
            <Statistic
              title="待审认证"
              value={pendingVerify ?? '—'}
              valueStyle={{
                color:
                  pendingVerify && pendingVerify > 0 ? '#d46b08' : undefined,
              }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="待处理举报"
              value={pendingReports ?? '—'}
              valueStyle={{
                color:
                  pendingReports && pendingReports > 0 ? '#cf1322' : undefined,
              }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic title="匹配单" value={data?.matchOrders ?? 0} />
          </Card>
        </Col>
      </Row>
      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={12}>
          <Card>
            <Statistic title="车找人（累计）" value={tripTotal} />
          </Card>
        </Col>
        <Col span={12}>
          <Card>
            <Statistic title="人找车（累计）" value={reqTotal} />
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
