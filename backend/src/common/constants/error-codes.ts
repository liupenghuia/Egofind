export const ErrorCode = {
  OK: 0,
  BAD_REQUEST: 40000,
  UNAUTHORIZED: 40100,
  TOKEN_EXPIRED: 40101,
  FORBIDDEN: 40300,
  /** 本月司机原因反馈已满，禁止发布 */
  DRIVER_RESTRICTED_PUBLISH: 40310,
  /** 本月司机原因反馈已满，禁止查找乘客 */
  DRIVER_RESTRICTED_SEARCH: 40311,
  /** 需先绑定手机号 */
  PHONE_REQUIRED: 40320,
  NOT_FOUND: 40400,
  CONFLICT: 40900,
  /** 已对该行程提交过无法同行反馈 */
  FEEDBACK_DUPLICATE: 40901,
  INTERNAL: 50000,
} as const;

export type ErrorCodeValue = (typeof ErrorCode)[keyof typeof ErrorCode];
