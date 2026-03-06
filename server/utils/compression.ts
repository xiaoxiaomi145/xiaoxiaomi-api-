import zlib from 'zlib';

export const compress = (str: string): string => {
  if (!str) return '';
  return zlib.deflateSync(str).toString('base64');
};

export const decompress = (str: string): string => {
  if (!str) return '';
  try {
    return zlib.inflateSync(Buffer.from(str, 'base64')).toString();
  } catch (e) {
    // If decompression fails, it might not be compressed, return as is
    return str;
  }
};
