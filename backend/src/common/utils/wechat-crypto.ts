import * as crypto from 'crypto';

/**
 * Decrypt WeChat mini-program encryptedData (legacy phone / userinfo).
 * sessionKey from code2session.
 */
export function decryptWechatData(
  sessionKey: string,
  encryptedData: string,
  iv: string,
): Record<string, unknown> {
  const sessionKeyBuf = Buffer.from(sessionKey, 'base64');
  const encryptedBuf = Buffer.from(encryptedData, 'base64');
  const ivBuf = Buffer.from(iv, 'base64');
  const decipher = crypto.createDecipheriv('aes-128-cbc', sessionKeyBuf, ivBuf);
  decipher.setAutoPadding(true);
  const decoded = Buffer.concat([decipher.update(encryptedBuf), decipher.final()]).toString('utf8');
  return JSON.parse(decoded) as Record<string, unknown>;
}
