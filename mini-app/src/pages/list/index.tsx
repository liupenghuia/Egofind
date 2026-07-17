import { View, Text, Button, Switch } from '@tarojs/components';
import { useDidShow } from '@tarojs/taro';
import { useState } from 'react';
import { useUserStore } from '../../stores/user';
import {
  myDriverTrips,
  myMatches,
  myPassengerRequests,
  setVisibility,
} from '../../services/trips';

export default function ListPage() {
  const mode = useUserStore((s) => s.mode);
  const [rows, setRows] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);

  const load = async () => {
    if (mode === 'driver') setRows((await myDriverTrips()) as any[]);
    else setRows((await myPassengerRequests()) as any[]);
    setMatches((await myMatches()) as any[]);
  };

  useDidShow(() => {
    load().catch(() => undefined);
  });

  return (
    <View style={{ padding: 16 }}>
      <Text style={{ fontWeight: 700 }}>我的发布</Text>
      {rows.map((r) => (
        <View
          key={r.id}
          style={{ background: '#fff', marginTop: 12, padding: 16, borderRadius: 8 }}
        >
          <Text>
            {r.originName} → {r.destName}
          </Text>
          <View>状态 {r.status}</View>
          {mode === 'passenger' && (
            <View style={{ display: 'flex', alignItems: 'center', marginTop: 8 }}>
              <Text>公开</Text>
              <Switch
                checked={r.visibility === 'PUBLIC'}
                onChange={async (e) => {
                  await setVisibility(r.id, e.detail.value ? 'PUBLIC' : 'HIDDEN');
                  load();
                }}
              />
            </View>
          )}
        </View>
      ))}
      <Text style={{ fontWeight: 700, marginTop: 24, display: 'block' }}>匹配单</Text>
      {matches.map((m) => (
        <View key={m.id} style={{ background: '#fff', marginTop: 12, padding: 16 }}>
          <Text>#{m.id.slice(0, 8)} · {m.status}</Text>
        </View>
      ))}
      {!rows.length && <Button onClick={load}>刷新</Button>}
    </View>
  );
}
