import { View, Text, Input, Button, Image } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import { useState } from 'react';
import {
  getDriverVerifyStatus,
  submitDriverVerification,
  uploadImage,
  type DriverVerifyStatus,
} from '../../services/trips';
import { PageShell } from '../../components/PageShell';

function statusLabel(st: DriverVerifyStatus | null): {
  text: string;
  color: string;
} {
  if (!st) return { text: '加载中…', color: '#8c8c8c' };
  switch (st.status) {
    case 'APPROVED':
      return { text: '已通过，可发布车找人', color: '#52c41a' };
    case 'PENDING':
      return { text: '审核中，请耐心等待', color: '#1677ff' };
    case 'REJECTED':
      return {
        text: `未通过：${st.rejectReason || '资料不全'}，可修改后重提`,
        color: '#ff4d4f',
      };
    default:
      return { text: '尚未提交司机认证', color: '#8c8c8c' };
  }
}

export default function DriverVerifyPage() {
  const [info, setInfo] = useState<DriverVerifyStatus | null>(null);
  const [realName, setRealName] = useState('');
  const [plateNo, setPlateNo] = useState('');
  const [carModel, setCarModel] = useState('');
  const [carColor, setCarColor] = useState('');
  const [idCardMask, setIdCardMask] = useState('');
  const [licenseImg, setLicenseImg] = useState('');
  const [previewLocal, setPreviewLocal] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    try {
      const st = await getDriverVerifyStatus();
      setInfo(st);
      const src = st.latest || st.profile;
      if (src) {
        if (st.latest?.realName) setRealName(st.latest.realName);
        if (src.plateNo) setPlateNo(src.plateNo);
        if (src.carModel) setCarModel(src.carModel || '');
        if (src.carColor) setCarColor(src.carColor || '');
        if (st.latest?.idCardMask) setIdCardMask(st.latest.idCardMask);
        if (st.latest?.licenseImg) {
          setLicenseImg(st.latest.licenseImg);
          setPreviewLocal(st.latest.licenseImg);
        }
      }
    } catch {
      setInfo(null);
    }
  };

  useDidShow(() => {
    load().catch(() => undefined);
  });

  const banner = statusLabel(info);
  const canEdit = !info || info.canSubmit;

  const pickLicense = async () => {
    if (!canEdit || uploading) return;
    try {
      const choose = await Taro.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
      });
      const path = choose.tempFilePaths?.[0];
      if (!path) return;
      setPreviewLocal(path);
      setUploading(true);
      const { url } = await uploadImage(path);
      setLicenseImg(url);
      Taro.showToast({ title: '已上传', icon: 'success' });
    } catch (e: any) {
      const msg = e?.message || '上传失败';
      if (!String(msg).includes('cancel')) {
        Taro.showToast({ title: String(msg).slice(0, 40), icon: 'none' });
      }
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async () => {
    if (!realName.trim() || !plateNo.trim()) {
      Taro.showToast({ title: '请填写姓名和车牌', icon: 'none' });
      return;
    }
    if (!licenseImg) {
      Taro.showToast({ title: '请上传证件照片', icon: 'none' });
      return;
    }
    setSubmitting(true);
    try {
      await submitDriverVerification({
        realName: realName.trim(),
        plateNo: plateNo.trim(),
        carModel: carModel.trim() || undefined,
        carColor: carColor.trim() || undefined,
        idCardMask: idCardMask.trim() || undefined,
        licenseImg: licenseImg.trim(),
      });
      Taro.showToast({ title: '已提交，等待审核' });
      await load();
    } catch {
      // toast from request
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageShell>
      <Text style={{ fontSize: 34, fontWeight: 600 }}>司机认证</Text>
      <View
        className="eg-card"
        style={{ marginTop: 16, color: banner.color, fontSize: 26 }}
      >
        {banner.text}
      </View>

      <View className="eg-card">
        <View style={{ fontWeight: 600 }}>真实姓名 *</View>
        <Input
          disabled={!canEdit}
          value={realName}
          placeholder="与证件一致"
          onInput={(e) => setRealName(e.detail.value)}
          style={{ background: '#f5f6f8', marginTop: 8, padding: 12 }}
        />

        <View style={{ marginTop: 16, fontWeight: 600 }}>车牌号 *</View>
        <Input
          disabled={!canEdit}
          value={plateNo}
          placeholder="如 冀A12345"
          onInput={(e) => setPlateNo(e.detail.value)}
          style={{ background: '#f5f6f8', marginTop: 8, padding: 12 }}
        />

        <View style={{ marginTop: 16, fontWeight: 600 }}>车型</View>
        <Input
          disabled={!canEdit}
          value={carModel}
          placeholder="如 轩逸"
          onInput={(e) => setCarModel(e.detail.value)}
          style={{ background: '#f5f6f8', marginTop: 8, padding: 12 }}
        />

        <View style={{ marginTop: 16, fontWeight: 600 }}>颜色</View>
        <Input
          disabled={!canEdit}
          value={carColor}
          placeholder="如 白色"
          onInput={(e) => setCarColor(e.detail.value)}
          style={{ background: '#f5f6f8', marginTop: 8, padding: 12 }}
        />

        <View style={{ marginTop: 16, fontWeight: 600 }}>身份证号掩码（选填）</View>
        <Input
          disabled={!canEdit}
          value={idCardMask}
          placeholder="如 1301**********1234"
          onInput={(e) => setIdCardMask(e.detail.value)}
          style={{ background: '#f5f6f8', marginTop: 8, padding: 12 }}
        />

        <View style={{ marginTop: 16, fontWeight: 600 }}>证件照片 *</View>
        <Text className="eg-muted" style={{ display: 'block', marginTop: 4 }}>
          驾驶证或行驶证清晰照片，单张不超过 2MB
        </Text>
        {previewLocal ? (
          <Image
            src={previewLocal}
            mode="aspectFill"
            style={{
              width: 200,
              height: 140,
              marginTop: 12,
              borderRadius: 8,
              background: '#eef0f3',
            }}
          />
        ) : null}
        {canEdit && (
          <View style={{ display: 'flex', gap: 12, marginTop: 12 }}>
            <Button
              className="eg-btn-secondary"
              loading={uploading}
              disabled={uploading}
              onClick={pickLicense}
            >
              {licenseImg ? '重新上传' : '选择并上传'}
            </Button>
            {licenseImg ? (
              <Button
                className="eg-btn-danger-text"
                onClick={() => {
                  setLicenseImg('');
                  setPreviewLocal('');
                }}
              >
                清除
              </Button>
            ) : null}
          </View>
        )}
      </View>

      {canEdit && (
        <Button
          className="eg-btn-primary"
          loading={submitting}
          disabled={submitting || uploading}
          onClick={onSubmit}
        >
          提交认证
        </Button>
      )}
      {!canEdit && info?.status === 'PENDING' && (
        <View className="eg-muted" style={{ marginTop: 16 }}>
          审核中不可修改，请等待管理员处理
        </View>
      )}
      {info?.status === 'APPROVED' && (
        <Button
          className="eg-btn-primary"
          style={{ marginTop: 16 }}
          onClick={() =>
            Taro.navigateTo({ url: '/pages/publish-driver/index' })
          }
        >
          去发布车找人
        </Button>
      )}
    </PageShell>
  );
}
