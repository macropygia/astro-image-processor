import { green } from 'kleur/colors';

import type { ImgProcContext } from '../../types.js';
import { sendDevFullReload, isDevUpgradeHotConfigured } from './devUpgradeHot.js';

export const notifyDevCompressComplete = ({
  reload,
  elapsedMs,
}: {
  reload: boolean;
  elapsedMs?: number;
}) => {
  const duration = elapsedMs !== undefined ? ` in ${elapsedMs}ms` : '';
  const message = `${green('[aip]')} Dev compression complete${duration}`;

  const ctx = globalThis.imageProcessorContext as ImgProcContext | undefined;
  if (ctx?.logger) {
    ctx.logger.info(message);
  } else {
    console.info(message);
  }

  if (reload && isDevUpgradeHotConfigured()) {
    sendDevFullReload();
  }
};
