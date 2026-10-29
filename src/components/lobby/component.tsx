import * as React from 'react';
import { BBButton, BBBTypography } from '@bigbluebutton/bbb-ui-components-react';
import { IntlShape } from 'react-intl';
import { DATA_TEST } from '../../commons/constants';
import { teamLabel, userLabel, wordListLabel } from '../../commons/format';
import { CardTypeIcon } from '../../commons/icons';
import { TEAMS } from '../../game/constants';
import {
  drawCandidates, membersOf, rosterProblems, spymasterOf,
} from '../../game/roster';
import { RosterProblem } from '../../game/types';
import { hasEnoughWords, resolveWordPool } from '../../words/service';
import { intlMessages } from './messages';
import RosterEditor from './roster-editor';
import Styled from './styles';
import { LobbyProps, TeamColumnProps } from './types';
import WordListPicker from './word-list';

const problemText = (intl: IntlShape, problem: RosterProblem): string => {
  const team = teamLabel(intl, problem.team, true);
  if (problem.type === 'noSpymaster') return intl.formatMessage(intlMessages.needSpymaster, { 0: team });
  if (problem.type === 'tooManySpymasters') {
    return intl.formatMessage(intlMessages.tooManySpymasters, { 0: team });
  }
  return intl.formatMessage(intlMessages.needAgent, { 0: team });
};

function TeamColumn({
  intl, game, team, users, dispatch,
}: TeamColumnProps) {
  const me = users.currentUserId;
  const mySeat = me ? game.roster[me] : undefined;
  const spymaster = spymasterOf(game.roster, team);
  const agents = membersOf(game.roster, team, 'agent');
  const inThisTeam = mySeat?.team === team;
  const iAmSpymaster = inThisTeam && mySeat?.role === 'spymaster';

  return (
    <Styled.TeamColumn $team={team} aria-labelledby={`codenames-team-${team}`}>
      <Styled.TeamTitle id={`codenames-team-${team}`}>
        <CardTypeIcon color={team} size={18} />
        {teamLabel(intl, team, true)}
      </Styled.TeamTitle>
      <Styled.Label>{intl.formatMessage(intlMessages.spymaster)}</Styled.Label>
      {spymaster
        ? <span>{userLabel(intl, spymaster, users)}</span>
        : <Styled.Empty>{intl.formatMessage(intlMessages.noSpymaster)}</Styled.Empty>}
      <Styled.Label>{intl.formatMessage(intlMessages.agents)}</Styled.Label>
      {agents.length ? (
        <Styled.Names>
          {agents.map((userId) => <li key={userId}>{userLabel(intl, userId, users)}</li>)}
        </Styled.Names>
      ) : <Styled.Empty>{intl.formatMessage(intlMessages.nobody)}</Styled.Empty>}
      {inThisTeam && (
        <Styled.Buttons>
          {!iAmSpymaster && (
            <BBButton
              size="sm"
              variant="secondary"
              label={intl.formatMessage(intlMessages.claimSpymaster)}
              dataTest={DATA_TEST.LOBBY_CLAIM_SPYMASTER}
              disabled={!!spymaster}
              tooltipLabel={spymaster ? intl.formatMessage(intlMessages.spymasterTaken) : undefined}
              onClick={() => dispatch({ type: 'claimSpymaster' })}
            />
          )}
          {iAmSpymaster && (
            <BBButton
              size="sm"
              variant="tertiary"
              label={intl.formatMessage(intlMessages.releaseSpymaster)}
              dataTest={DATA_TEST.LOBBY_RELEASE_SPYMASTER}
              onClick={() => dispatch({ type: 'releaseSpymaster' })}
            />
          )}
        </Styled.Buttons>
      )}
    </Styled.TeamColumn>
  );
}

function Lobby({
  intl, game, users, isModerator, compact, dispatch,
}: LobbyProps) {
  const me = users.currentUserId;
  const spectators = [...(users.presentUserIds ?? [])].filter((userId) => !game.roster[userId]);
  const problems = rosterProblems(game.roster);
  const enoughWords = hasEnoughWords(resolveWordPool(game.wordList));
  const candidates = drawCandidates(game.roster, users.presentUserIds);
  const seated = Object.keys(game.roster).length > 0;

  return (
    <Styled.Lobby>
      <div>
        <BBBTypography variant="header" as="h2">{intl.formatMessage(intlMessages.title)}</BBBTypography>
        <BBBTypography>{intl.formatMessage(intlMessages.intro)}</BBBTypography>
        {me === game.hostId && (
          <BBBTypography variant="text2">{intl.formatMessage(intlMessages.hostNote)}</BBBTypography>
        )}
      </div>
      {seated ? (
        <Styled.Teams $compact={compact}>
          {TEAMS.map((team) => (
            <TeamColumn
              key={team}
              intl={intl}
              game={game}
              team={team}
              users={users}
              dispatch={dispatch}
            />
          ))}
        </Styled.Teams>
      ) : (
        <Styled.Empty>{intl.formatMessage(intlMessages.notDrawn)}</Styled.Empty>
      )}
      {me && game.roster[me] && (
        <Styled.Actions>
          <BBButton
            variant="tertiary"
            size="sm"
            label={intl.formatMessage(intlMessages.leave)}
            dataTest={DATA_TEST.LOBBY_LEAVE}
            onClick={() => dispatch({ type: 'leave' })}
          />
        </Styled.Actions>
      )}
      <Styled.Section aria-labelledby="codenames-spectators">
        <Styled.Label id="codenames-spectators">{intl.formatMessage(intlMessages.spectators)}</Styled.Label>
        {spectators.length
          ? <span>{spectators.map((userId) => userLabel(intl, userId, users)).join(', ')}</span>
          : <Styled.Empty>{intl.formatMessage(intlMessages.nobody)}</Styled.Empty>}
      </Styled.Section>
      {isModerator ? (
        <>
          <WordListPicker intl={intl} wordList={game.wordList} dispatch={dispatch} />
          <Styled.Section aria-labelledby="codenames-moderator-tools">
            <BBBTypography variant="selected" id="codenames-moderator-tools">
              {intl.formatMessage(intlMessages.moderatorTools)}
            </BBBTypography>
            <RosterEditor intl={intl} game={game} users={users} dispatch={dispatch} />
            {seated && problems.length > 0 && (
              <>
                <BBBTypography variant="text2">{intl.formatMessage(intlMessages.notReady)}</BBBTypography>
                <Styled.Problems>
                  {problems.map((problem) => (
                    <li key={`${problem.type}-${'team' in problem ? problem.team : ''}`}>
                      {problemText(intl, problem)}
                    </li>
                  ))}
                </Styled.Problems>
              </>
            )}
            <Styled.Actions>
              <BBButton
                variant={seated ? 'secondary' : 'primary'}
                label={intl.formatMessage(
                  seated ? intlMessages.shuffleAgain : intlMessages.shuffle,
                )}
                dataTest={DATA_TEST.LOBBY_SHUFFLE}
                disabled={candidates.length < 4}
                tooltipLabel={candidates.length < 4
                  ? intl.formatMessage(intlMessages.shuffleHint) : undefined}
                onClick={() => dispatch({ type: 'shuffleTeams' })}
              />
              <BBButton
                label={intl.formatMessage(intlMessages.start)}
                dataTest={DATA_TEST.LOBBY_START}
                disabled={problems.length > 0 || !enoughWords}
                onClick={() => dispatch({ type: 'start' })}
              />
            </Styled.Actions>
          </Styled.Section>
        </>
      ) : (
        <Styled.Section>
          <BBBTypography>
            {intl.formatMessage(seated ? intlMessages.waitingStart : intlMessages.waitingDraw)}
          </BBBTypography>
          <BBBTypography variant="text2">
            {intl.formatMessage(intlMessages.wordListCurrent, {
              0: wordListLabel(intl, game.wordList.id),
            })}
          </BBBTypography>
        </Styled.Section>
      )}
    </Styled.Lobby>
  );
}

export default Lobby;
