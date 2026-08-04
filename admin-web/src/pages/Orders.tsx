import { useEffect, useState } from 'react';
import { Tabs, Table, Input, Space, Tag } from 'antd';
import {
  listDriverTrips,
  listPassengerRequests,
  listMatches,
} from '../api/admin';
import {
  TRIP_STATUS_ZH,
  VISIBILITY_ZH,
  statusTagColor,
  zhLabel,
} from '../utils/labels';

function StatusTag({ status }: { status?: string }) {
  return (
    <Tag color={statusTagColor(status)}>{zhLabel(TRIP_STATUS_ZH, status)}</Tag>
  );
}

export default function Orders() {
  const [adcode, setAdcode] = useState('');
  const [trips, setTrips] = useState<any[]>([]);
  const [reqs, setReqs] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);

  const load = async () => {
    const [t, r, m] = await Promise.all([
      listDriverTrips(adcode || undefined),
      listPassengerRequests(adcode || undefined),
      listMatches(),
    ]);
    setTrips(t);
    setReqs(r);
    setMatches(m);
  };

  useEffect(() => {
    load().catch(() => undefined);
  }, []);

  return (
    <>
      <Space style={{ marginBottom: 16 }}>
        <Input
          placeholder="按 adcode 筛选"
          value={adcode}
          onChange={(e) => setAdcode(e.target.value)}
          style={{ width: 200 }}
        />
        <a onClick={() => load()}>查询</a>
      </Space>
      <Tabs
        items={[
          {
            key: 'trips',
            label: '车找人',
            children: (
              <Table
                rowKey="id"
                dataSource={trips}
                columns={[
                  { title: '出发', dataIndex: 'originName' },
                  { title: '到达', dataIndex: 'destName' },
                  { title: 'adcode', dataIndex: 'originAdcode' },
                  { title: '座位', dataIndex: 'seatsLeft' },
                  {
                    title: '状态',
                    dataIndex: 'status',
                    render: (s: string) => <StatusTag status={s} />,
                  },
                ]}
              />
            ),
          },
          {
            key: 'reqs',
            label: '人找车',
            children: (
              <Table
                rowKey="id"
                dataSource={reqs}
                columns={[
                  { title: '出发', dataIndex: 'originName' },
                  { title: '到达', dataIndex: 'destName' },
                  {
                    title: '可见性',
                    dataIndex: 'visibility',
                    render: (v: string) => zhLabel(VISIBILITY_ZH, v),
                  },
                  {
                    title: '状态',
                    dataIndex: 'status',
                    render: (s: string) => <StatusTag status={s} />,
                  },
                ]}
              />
            ),
          },
          {
            key: 'matches',
            label: '匹配单',
            children: (
              <Table
                rowKey="id"
                dataSource={matches}
                columns={[
                  { title: 'ID', dataIndex: 'id', ellipsis: true },
                  { title: '座位', dataIndex: 'seats' },
                  {
                    title: '状态',
                    dataIndex: 'status',
                    render: (s: string) => <StatusTag status={s} />,
                  },
                  {
                    title: '确认时间',
                    dataIndex: 'confirmedAt',
                    render: (v: string) =>
                      v ? new Date(v).toLocaleString() : '-',
                  },
                ]}
              />
            ),
          },
        ]}
      />
    </>
  );
}
