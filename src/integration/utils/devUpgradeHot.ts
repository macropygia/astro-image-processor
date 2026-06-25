export type DevUpgradeHot = {
  send: (payload: { type: 'full-reload' }) => void;
};

declare global {
  // eslint-disable-next-line no-var
  var __aipDevUpgradeHot: DevUpgradeHot | undefined;
}

const getDevUpgradeHot = () => globalThis.__aipDevUpgradeHot;

export const setDevUpgradeHot = (hot: DevUpgradeHot | undefined) => {
  globalThis.__aipDevUpgradeHot = hot;
};

export const isDevUpgradeHotConfigured = () => getDevUpgradeHot() !== undefined;

export const setDevUpgradeHotFromServer = (server: { hot: DevUpgradeHot }) => {
  setDevUpgradeHot(server.hot);
};

export const sendDevFullReload = () => {
  const hot = getDevUpgradeHot();
  if (!hot) {
    return;
  }

  hot.send({ type: 'full-reload' });
};
