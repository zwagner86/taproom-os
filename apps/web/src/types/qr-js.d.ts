declare module "qr.js" {
  type QrCode = {
    getModuleCount(): number;
    isDark(row: number, col: number): boolean;
  };

  type QrFactory = {
    (data: string, options?: { errorCorrectLevel?: number; typeNumber?: number }): QrCode;
    ErrorCorrectLevel: {
      H: number;
      L: number;
      M: number;
      Q: number;
    };
  };

  const qrcode: QrFactory;

  export default qrcode;
}
