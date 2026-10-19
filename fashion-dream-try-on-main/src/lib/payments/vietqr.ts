export const VIETQR_CONFIG = {
  bankId: "MB",
  accountNo: "0123456789",
  accountName: "UPTHINK",
  template: "compact2",
};

export function createVietQrUrl(total: number, orderCode: string) {
  const params = new URLSearchParams({
    amount: String(total),
    addInfo: orderCode,
    accountName: VIETQR_CONFIG.accountName,
  });

  return `https://img.vietqr.io/image/${VIETQR_CONFIG.bankId}-${VIETQR_CONFIG.accountNo}-${VIETQR_CONFIG.template}.png?${params.toString()}`;
}
