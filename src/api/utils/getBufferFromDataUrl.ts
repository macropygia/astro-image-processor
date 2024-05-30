type GetBufferFromDataUrl = (dataUrl: string) => Buffer;

/**
 * Get `Buffer` from `data:image/*;base64,...`
 */
export const getBufferFromDataUrl: GetBufferFromDataUrl = (dataUrl) => {
  const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, "");
  return Buffer.from(base64, "base64");
};
