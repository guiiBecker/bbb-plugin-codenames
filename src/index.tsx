import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import CodenamesPlugin from './components/main/component';

const uuid = document.currentScript?.getAttribute('uuid') || 'root';

const pluginName = document.currentScript?.getAttribute('pluginName') || 'plugin';

const root = ReactDOM.createRoot(document.getElementById(uuid)!);
root.render(
  <CodenamesPlugin {...{
    pluginUuid: uuid,
    pluginName,
  }}
  />,
);
