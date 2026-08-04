import { useEffect, useState } from 'react';
import { Button, Input, Space, Table, Tag, Typography, message } from 'antd';
import { listReports, resolveReport, setUserStatus } from '../api/admin';
import {
  REPORT_STATUS_ZH,
  TARGET_TYPE_ZH,
  statusTagColor,
  zhLabel,
} from '../utils/labels';

const REASON_ZH: Record<string, string> = {
  harassment: '骚扰',
  fraud: '欺诈虚假',
  safety: '人身安全',
  abuse: '言语不当',
  other: '其他',
};

export default function Reports() {
  const [rows, setRows] = useState<any[]>([]);
  const [noteMap, setNoteMap] = useState<Record<string, string>>({});

  const load = () =>
    listReports()
      .then(setRows)
      .catch(() => setRows([]));

  useEffect(() => {
    load();
  }, []);

  return (
    <>
      <Typography.Title level={5}>举报管理</Typography.Title>
      <Typography.Paragraph type="secondary">
        处理 OPEN / REVIEWING 举报；关闭时可写备注，并可禁用被举报用户。
      </Typography.Paragraph>
      <Table
        rowKey="id"
        dataSource={rows}
        columns={[
          {
            title: '时间',
            dataIndex: 'createdAt',
            width: 180,
            render: (v: string) => (v ? new Date(v).toLocaleString() : '-'),
          },
          {
            title: '类型',
            dataIndex: 'targetType',
            width: 140,
            render: (t: string) => zhLabel(TARGET_TYPE_ZH, t),
          },
          {
            title: '原因',
            dataIndex: 'reasonCode',
            width: 120,
            render: (c: string) => REASON_ZH[c] || c,
          },
          {
            title: '详情',
            dataIndex: 'detail',
            ellipsis: true,
          },
          {
            title: '举报人',
            render: (_, r) => r.reporter?.nickname || r.reporterId?.slice(0, 8),
          },
          {
            title: '被举报用户',
            render: (_, r) =>
              r.targetUser?.nickname ||
              (r.targetUserId ? r.targetUserId.slice(0, 8) : '-'),
          },
          {
            title: '状态',
            dataIndex: 'status',
            width: 110,
            render: (s: string) => (
              <Tag color={statusTagColor(s)}>
                {zhLabel(REPORT_STATUS_ZH, s)}
              </Tag>
            ),
          },
          {
            title: '操作',
            width: 320,
            render: (_, row) => (
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <Input.TextArea
                  rows={2}
                  placeholder="处理备注"
                  value={noteMap[row.id] || ''}
                  onChange={(e) =>
                    setNoteMap((m) => ({ ...m, [row.id]: e.target.value }))
                  }
                />
                <Space wrap>
                  <Button
                    size="small"
                    onClick={async () => {
                      await resolveReport(row.id, {
                        status: 'REVIEWING',
                        adminNote: noteMap[row.id],
                      });
                      message.success('已标记处理中');
                      load();
                    }}
                  >
                    处理中
                  </Button>
                  <Button
                    size="small"
                    type="primary"
                    onClick={async () => {
                      await resolveReport(row.id, {
                        status: 'CLOSED',
                        adminNote: noteMap[row.id],
                      });
                      message.success('已关闭');
                      load();
                    }}
                  >
                    关闭
                  </Button>
                  {row.targetUserId && (
                    <Button
                      size="small"
                      danger
                      onClick={async () => {
                        await resolveReport(row.id, {
                          status: 'CLOSED',
                          adminNote: noteMap[row.id] || '关闭并禁用用户',
                          banTargetUser: true,
                        });
                        message.success('已关闭并禁用用户');
                        load();
                      }}
                    >
                      关闭并禁用
                    </Button>
                  )}
                  {row.targetUserId && row.targetUser?.status !== 0 && (
                    <Button
                      size="small"
                      onClick={async () => {
                        await setUserStatus(row.targetUserId, 0);
                        message.success('已禁用用户');
                        load();
                      }}
                    >
                      仅禁用用户
                    </Button>
                  )}
                </Space>
              </Space>
            ),
          },
        ]}
      />
    </>
  );
}
