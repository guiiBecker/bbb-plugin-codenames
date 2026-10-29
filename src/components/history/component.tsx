import * as React from 'react';
import { BBBTypography } from '@bigbluebutton/bbb-ui-components-react';
import { IntlShape } from 'react-intl';
import { DATA_TEST } from '../../commons/constants';
import {
  UserLabelContext, colorLabel, countLabel, teamLabel, userLabel,
} from '../../commons/format';
import { CardTypeIcon } from '../../commons/icons';
import { Round, groupRounds } from '../../game/rounds';
import { HistoryEvent } from '../../game/types';
import { intlMessages } from './messages';
import Styled from './styles';
import { HistoryProps } from './types';

const END_MESSAGES = {
  allFound: intlMessages.endAllFound,
  assassin: intlMessages.endAssassin,
  aborted: intlMessages.endAborted,
};

type Move = Round['moves'][number];
type EndEvent = Extract<HistoryEvent, { type: 'end' }>;

const describeMove = (intl: IntlShape, move: Move, users: UserLabelContext): string => (
  move.type === 'reveal'
    ? intl.formatMessage(intlMessages.reveal, {
      0: userLabel(intl, move.by, users), 1: move.word, 2: colorLabel(intl, move.color),
    })
    : intl.formatMessage(intlMessages.pass, { 0: userLabel(intl, move.by, users) })
);

const describeEnd = (intl: IntlShape, end: EndEvent): string => (
  intl.formatMessage(END_MESSAGES[end.reason], {
    0: end.winner ? teamLabel(intl, end.winner, true) : '',
  })
);

/** The match round by round, newest first: each clue, then the cards revealed with it. */
function History({
  intl, events, users, running,
}: HistoryProps) {
  const { rounds, end } = groupRounds(events);
  const newestFirst = [...rounds].reverse();

  return (
    <Styled.Section aria-labelledby="codenames-history-title" data-test={DATA_TEST.HISTORY}>
      <BBBTypography variant="selected" id="codenames-history-title">
        {intl.formatMessage(intlMessages.title)}
      </BBBTypography>
      {end && <Styled.End $team={end.winner}>{describeEnd(intl, end)}</Styled.End>}
      {rounds.length === 0 ? (
        <BBBTypography variant="text2">{intl.formatMessage(intlMessages.empty)}</BBBTypography>
      ) : (
        <Styled.Rounds>
          {newestFirst.map((round, position) => {
            const current = running && position === 0;
            return (
              <Styled.Round
                key={round.number}
                data-test={DATA_TEST.HISTORY_ROUND}
                aria-current={current ? 'step' : undefined}
                $team={round.team}
              >
                <Styled.RoundHeader>
                  <span>
                    {intl.formatMessage(intlMessages.round, {
                      0: round.number, 1: teamLabel(intl, round.team, true),
                    })}
                  </span>
                  {current && (
                    <Styled.Current>{intl.formatMessage(intlMessages.current)}</Styled.Current>
                  )}
                </Styled.RoundHeader>
                <Styled.Clue>
                  {intl.formatMessage(intlMessages.roundClue, {
                    0: userLabel(intl, round.clue.by, users),
                    1: round.clue.word,
                    2: countLabel(intl, round.clue.count),
                  })}
                </Styled.Clue>
                {round.moves.length === 0 ? (
                  <BBBTypography variant="text3">{intl.formatMessage(intlMessages.noMoves)}</BBBTypography>
                ) : (
                  <Styled.Moves>
                    {round.moves.map((move, index) => (
                      // Moves never change once recorded: the position is a stable key.
                      // eslint-disable-next-line react/no-array-index-key
                      <Styled.Move key={index}>
                        {move.type === 'reveal' && <CardTypeIcon color={move.color} size={14} />}
                        <span>{describeMove(intl, move, users)}</span>
                      </Styled.Move>
                    ))}
                  </Styled.Moves>
                )}
              </Styled.Round>
            );
          })}
        </Styled.Rounds>
      )}
    </Styled.Section>
  );
}

export default History;
