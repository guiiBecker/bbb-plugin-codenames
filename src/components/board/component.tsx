import * as React from 'react';
import { useMemo } from 'react';
import { GRID_SIZE } from '../../game/constants';
import { hasVoted } from '../../game/votes';
import Card from '../card/component';
import { intlMessages } from './messages';
import Styled from './styles';
import { BoardProps } from './types';

function Board({
  intl, game, secretKey, currentUserId, tally, canVote, pending, size, onVote,
}: BoardProps) {
  const votable = canVote && !pending;
  const counts = useMemo(
    () => new Map(tally.map(({ index, voters }) => [index, voters.length])),
    [tally],
  );
  const leader = tally[0]?.index ?? null;

  return (
    <Styled.Grid
      role="group"
      aria-label={intl.formatMessage(intlMessages.boardLabel)}
      $columns={GRID_SIZE}
      $size={size}
    >
      {game.words.map((word, index) => {
        const revealed = game.revealed[index];
        return (
          <Card
            // Words are unique on a board, and a new match is a new board.
            key={`${game.matchId}-${word}`}
            intl={intl}
            index={index}
            word={word}
            revealed={revealed}
            secret={revealed ? null : secretKey?.[index] ?? null}
            votable={votable && revealed === null}
            myVote={hasVoted(game.votes, currentUserId, index)}
            voteCount={counts.get(index) ?? 0}
            leading={leader === index}
            size={size}
            onVote={onVote}
          />
        );
      })}
    </Styled.Grid>
  );
}

export default Board;
