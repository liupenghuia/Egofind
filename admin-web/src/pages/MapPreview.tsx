import { useEffect, useState } from 'react';
import { Input, List, Space, Tag, Typography } from 'antd';
import { mapPreview } from '../api/admin';

export default function MapPreview() {
  const [adcode, setAdcode] = useState('');
  const [data, setData] = useState<{ drivers: any[]; passengers: any[] }>({
    drivers: [],
    passengers: [],
  });

  const load = () =>
    mapPreview(adcode || undefined)
      .then(setData)
      .catch(() => setData({ drivers: [], passengers: [] }));

  useEffect(() => {
    load();
  }, []);

  return (
    <>
      <Typography.Paragraph type="secondary">
        MVP：以列表预览供需点位；接入腾讯地图 JS SDK 后可替换为真实地图。
      </Typography.Paragraph>
      <Space style={{ marginBottom: 16 }}>
        <Input
          placeholder="adcode"
          value={adcode}
          onChange={(e) => setAdcode(e.target.value)}
          style={{ width: 160 }}
        />
        <a onClick={() => load()}>刷新</a>
      </Space>
      <List
        header={<Tag color="blue">车找人 {data.drivers.length}</Tag>}
        dataSource={data.drivers}
        renderItem={(item) => (
          <List.Item>
            {item.title} ({item.lat}, {item.lng})
          </List.Item>
        )}
      />
      <List
        header={<Tag color="green">人找车 {data.passengers.length}</Tag>}
        dataSource={data.passengers}
        renderItem={(item) => (
          <List.Item>
            {item.title} ({item.lat}, {item.lng})
          </List.Item>
        )}
      />
    </>
  );
}
