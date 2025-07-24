import { AnalyticsBrowser } from '@segment/analytics-next';

export async function getSettings(wk) {
  let data = await fetch(`https://cdn.segment.build/v1/projects/${wk}/settings`);
  data = await data.json();
  return cleanSettings(data);
}

function cleanSettings(data) {
  Object.keys(data.integrations).forEach(i => {
    // setting the version of everything to latest
    data.integrations[i].versionSettings.version = 'latest';
    data.integrations[i].versionSettings.override = 'latest';
  });

  return data;
}

export async function loadAJS(writeKey, cdnSettings) {
  Object.keys(cdnSettings.integrations).forEach(i => {
    const name = i
      .toLowerCase()
      .replace('.', '')
      .replace(/\s+/g, '-');

    // we are not using common chunks for tester, so we can ignore the dependency resolution magic
    window[`${name}Deps`] = [];
    window[`${name}Loader`] = () => undefined;
  });

  const analytics = AnalyticsBrowser.load({
    writeKey,
    cdnURL: 'http://localhost:8080',
    cdnSettings: { ...cdnSettings }
  });

  analytics.identify('hello world');
  window.analytics = analytics;
}
