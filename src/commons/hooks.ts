import { PluginApi } from 'bigbluebutton-html-plugin-sdk';
import { useMemo } from 'react';
import { createIntl, createIntlCache } from 'react-intl';
import { devRequestHeaders, isDevelopment } from './utils';

const LOCALE_REQUEST_OBJECT = isDevelopment() ? { headers: devRequestHeaders() } : undefined;

export const useGetInternationalization = (pluginApi: PluginApi) => {
  const {
    messages: localeMessages,
    currentLocale,
    loading: localeMessagesLoading,
  } = pluginApi.useLocaleMessages!(LOCALE_REQUEST_OBJECT);

  // Memoized on purpose: `intl` is a dependency of the effects that register this plugin's
  // extensible-area items. A new identity on every render would re-register them in a loop.
  const intl = useMemo(() => {
    if (localeMessagesLoading || !localeMessages) return null;
    return createIntl({
      locale: currentLocale,
      messages: localeMessages,
      fallbackOnEmptyString: true,
    }, createIntlCache());
  }, [currentLocale, localeMessages, localeMessagesLoading]);

  return {
    intl,
    localeMessagesLoading,
  };
};
