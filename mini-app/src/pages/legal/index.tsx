import { View, Text, ScrollView } from '@tarojs/components';
import { useRouter } from '@tarojs/taro';
import '../../styles/common.scss';
import './index.scss';

const SECTIONS = [
  {
    id: 'user',
    title: '一、用户协议（摘要）',
    body: [
      '您使用 egofind（本小程序）即表示理解：本平台为县域/同城顺风车信息撮合工具，帮助「车找人」与「人找车」互相发现。',
      '您应保证发布信息真实、合法，不得利用本服务从事违法或侵害他人权益的行为。',
      '我们可能根据运营与合规需要暂停、限制部分功能；严重违规可能禁用账号。',
    ],
  },
  {
    id: 'privacy',
    title: '二、隐私与手机号',
    body: [
      '登录可能使用微信标识；手机号需您主动授权后用于联系与安全。',
      '完整手机号经加密存储；乘客仅在确认同行后可获取司机电话，并记入访问日志。',
      '司机端不提供主动拨打乘客电话的入口，以降低骚扰风险。',
    ],
  },
  {
    id: 'platform',
    title: '三、平台定位声明（重要）',
    body: [
      '本平台定位为「顺风车 / 成本分摊信息撮合」，不是巡游网约车或运输承运平台。',
      '平台不提供运输服务、不代收运费分账、不承诺车辆与驾驶员承运责任。',
      '行程由用户自行协商、自行联络、自担风险；分摊价仅为信息展示，不构成交易结算。',
    ],
  },
  {
    id: 'safety',
    title: '四、安全与举报',
    body: [
      '请优先在公共场合见面，核对行程信息后再出行。',
      '遇骚扰、欺诈或安全风险，请使用应用内「举报」功能；紧急情况请联系当地警方。',
      '「无法同行」反馈与司机原因月额度用于治理恶意取消体验，详见产品规则。',
    ],
  },
];

export default function LegalPage() {
  const { section } = useRouter().params;
  const focus = section || '';

  return (
    <ScrollView scrollY className="legal__scroll">
      <Text className="fs-xl fw-700">用户协议与平台说明</Text>
      <View className="eg-muted mt-sm">版本 2026-07-29 · 正式上线前请由负责人/法务审定文案</View>
      {SECTIONS.map((s) => (
        <View
          key={s.id}
          className={`eg-card mt-lg ${focus === s.id ? 'legal__section--focused' : ''}`}
        >
          <Text className="eg-section-title">{s.title}</Text>
          {s.body.map((p, i) => (
            <View key={i} className="legal__body mt-sm">
              {p}
            </View>
          ))}
        </View>
      ))}
      <View className="legal__spacer" />
    </ScrollView>
  );
}
