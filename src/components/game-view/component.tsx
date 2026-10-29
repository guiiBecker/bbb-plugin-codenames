import * as React from 'react';
import { useCallback, useMemo } from 'react';
import {
  BBBHint, BBButton, BBBTypography,
} from '@bigbluebutton/bbb-ui-components-react';
import { DATA_TEST } from '../../commons/constants';
import { teamLabel, userLabel } from '../../commons/format';
import { commonMessages } from '../../commons/messages';
import { canGuess, seatOf, voteTally } from '../../game/view';
import { useStore } from '../../store/hooks';
import Board from '../board/component';
import { CardSize } from '../card/types';
import CluePanel from '../clue-panel/component';
import GameOver from '../game-over/component';
import Lobby from '../lobby/component';
import Scoreboard from '../scoreboard/component';
import { intlMessages as sidebarMessages } from '../sidebar/messages';
import VotePanel from '../votes/component';
import { useElementWidth } from './hooks';
import { intlMessages } from './messages';
import Styled from './styles';
import { GameViewProps } from './types';

const COMPACT_WIDTH = 640;
const WIDE_WIDTH = 980;

/** The game in the main area. Rendered in a React root owned by the client: reads the store. */
function GameView({ store }: GameViewProps) {
  const {
    intl, currentUserId, isModerator, isHost, hostReady, hostPresent, game, secretKey, names,
    presentUserIds, pending, dispatch, openSidebar,
  } = useStore(store);
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const compact = width > 0 && width < COMPACT_WIDTH;
  const wide = width >= WIDE_WIDTH;
  let cardSize: CardSize = 'medium';
  if (compact) cardSize = 'small';
  else if (wide) cardSize = 'large';

  const users = useMemo(
    () => ({ names, currentUserId, presentUserIds }),
    [names, currentUserId, presentUserIds],
  );
  const vote = useCallback(
    (index: number, on: boolean) => dispatch({ type: 'vote', index, on }),
    [dispatch],
  );
  const guess = useCallback((index: number) => dispatch({ type: 'guess', index }), [dispatch]);
  const tally = useMemo(() => (game ? voteTally(game) : []), [game]);

  if (!game) {
    return (
      <Styled.Container ref={ref}>
        <BBBTypography>{intl.formatMessage(intlMessages.noGame)}</BBBTypography>
      </Styled.Container>
    );
  }

  const seat = seatOf(game, currentUserId);
  let roleText = intl.formatMessage(commonMessages.roleSpectator);
  if (seat) {
    roleText = intl.formatMessage(intlMessages.roleInTeam, {
      0: intl.formatMessage(seat.role === 'spymaster' ? commonMessages.roleSpymaster : commonMessages.roleAgent),
      1: teamLabel(intl, seat.team, true),
    });
  }
  const inPlay = game.phase === 'clue' || game.phase === 'guess';
  const guesser = canGuess(game, currentUserId);
  const hostName = userLabel(intl, game.hostId, users);

  return (
    <Styled.Container ref={ref} aria-label={intl.formatMessage(commonMessages.appName)}>
      <Styled.Header>
        <BBBTypography variant="header" as="h1">{intl.formatMessage(commonMessages.appName)}</BBBTypography>
        <Styled.HeaderEnd>
          <Styled.Role $team={seat?.team ?? null}>
            {intl.formatMessage(intlMessages.you, { 0: roleText })}
          </Styled.Role>
          {openSidebar && game.phase !== 'lobby' && (
            // The rounds and the moderator controls live in the plugin's sidebar panel.
            <BBButton
              variant="tertiary"
              size="sm"
              label={intl.formatMessage(sidebarMessages.open)}
              dataTest={DATA_TEST.SIDEBAR_OPEN}
              onClick={openSidebar}
            />
          )}
        </Styled.HeaderEnd>
      </Styled.Header>

      {!hostPresent && (
        <BBBHint
          hideCloseButton
          title={intl.formatMessage(intlMessages.hostAwayTitle)}
          label={intl.formatMessage(
            isModerator ? intlMessages.hostAwayModerator : intlMessages.hostAway,
            { 0: hostName },
          )}
        />
      )}
      {isHost && !hostReady && (
        <BBBHint hideCloseButton label={intl.formatMessage(intlMessages.restoring)} />
      )}
      {isHost && !seat && inPlay && (
        <BBBTypography variant="text2">{intl.formatMessage(intlMessages.hostSeesKey)}</BBBTypography>
      )}

      {game.phase === 'lobby' ? (
        <Lobby
          intl={intl}
          game={game}
          users={users}
          isModerator={isModerator}
          compact={compact}
          dispatch={dispatch}
        />
      ) : (
        // A centered column: score and clue on top, then the board with the team's votes and
        // the guess button right under it. The rounds and moderator controls are in the sidebar.
        <Styled.Column>
          <Scoreboard intl={intl} game={game} users={users} />
          {game.phase === 'ended' && (
            <GameOver intl={intl} game={game} isModerator={isModerator} dispatch={dispatch} />
          )}
          <CluePanel
            intl={intl}
            game={game}
            currentUserId={currentUserId}
            users={users}
            pending={pending}
            dispatch={dispatch}
          />
          <Board
            intl={intl}
            game={game}
            // The host receives the key to run the game; drawn as an agent, it must not see it.
            secretKey={game.key ?? (seat?.role === 'agent' ? null : secretKey)}
            currentUserId={currentUserId}
            tally={tally}
            canVote={guesser}
            pending={pending}
            size={cardSize}
            onVote={vote}
          />
          <VotePanel
            intl={intl}
            game={game}
            tally={tally}
            users={users}
            canGuess={guesser}
            pending={pending}
            onGuess={guess}
          />
        </Styled.Column>
      )}
    </Styled.Container>
  );
}

export default GameView;
