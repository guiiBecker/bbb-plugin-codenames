import { useEffect, useMemo } from 'react';
import { PluginApi, pluginLogger } from 'bigbluebutton-html-plugin-sdk';
import { LOG_CODES } from '../commons/constants';
import { toMeetingUsers } from './service';
import { MeetingUsers } from './types';

/** Who is in the meeting, who moderates, and their names. */
export const useMeetingUsers = (pluginApi: PluginApi): MeetingUsers => {
  const { data, loading, error } = pluginApi.useUsersBasicInfo!();

  useEffect(() => {
    if (!error) return;
    pluginLogger.error(
      { logCode: LOG_CODES.USERS_ERROR, extraInfo: { error: error.message } },
      `Failed to read the user list in ${pluginApi.pluginName}`,
    );
  }, [error]);

  const list = data?.user;
  return useMemo(() => (
    loading || error || !list
      ? { presentUserIds: null, moderatorIds: null, names: {} }
      : toMeetingUsers(list)
  ), [list, loading, error]);
};
