type GetBufferFromDataUrl = (dataUrl: string) => Buffer;

const DATAIMAGE_RE = /^data:image\/\w+;base64,/;

/**
 * Get `Buffer` from `data:image/*;base64,...`
 */
export const getBufferFromDataUrl: GetBufferFromDataUrl = (dataUrl) => {
  const base64 = dataUrl.replace(DATAIMAGE_RE, '');
  return Buffer.from(base64, 'base64');
};
