import * as React from 'react';
import { useId, useState } from 'react';
import {
  BBButton, BBBTextInput, BBBTypography,
} from '@bigbluebutton/bbb-ui-components-react';
import { DATA_TEST } from '../../commons/constants';
import { countLabel, teamLabel, userLabel } from '../../commons/format';
import { errorMessages } from '../../commons/messages';
import { validateClue } from '../../game/clue';
import { CLUE_MAX_COUNT, CLUE_MAX_LENGTH } from '../../game/constants';
import { spymasterOf } from '../../game/roster';
import { ClueCount } from '../../game/types';
import {
  canEndTurn, canGiveClue, canGuess, visibleWords,
} from '../../game/view';
import { intlMessages } from './messages';
import Styled from './styles';
import { ClueFormProps, CluePanelProps } from './types';

const COUNTS: ClueCount[] = [
  ...Array.from({ length: CLUE_MAX_COUNT + 1 }, (_, i) => i),
  'unlimited',
];

function ClueForm({
  intl, game, pending, onSubmit,
}: ClueFormProps) {
  const [word, setWord] = useState('');
  const [count, setCount] = useState<ClueCount>(1);
  const [touched, setTouched] = useState(false);
  const countId = useId();
  const errorId = useId();
  const wordLabel = intl.formatMessage(intlMessages.clueWord);

  // The same validation the host applies, so a refused clue is explained right here.
  const problem = validateClue(word, count, visibleWords(game));
  const error = touched && problem
    ? intl.formatMessage(errorMessages[problem.error], { 0: problem.detail ?? '' })
    : undefined;

  // Also the button's click handler: preventDefault stops the form from submitting twice.
  const submit = (event: React.SyntheticEvent) => {
    event.preventDefault();
    setTouched(true);
    if (problem || pending) return;
    onSubmit(word.trim(), count);
  };

  return (
    <Styled.Form onSubmit={submit} noValidate>
      <Styled.WordField>
        <BBBTextInput
          label={wordLabel}
          value={word}
          error={!!error}
          placeholder={intl.formatMessage(intlMessages.clueWordHelp)}
          // The library does not tie its label to the input: name and describe it here.
          inputProps={{
            maxLength: CLUE_MAX_LENGTH,
            autoComplete: 'off',
            'aria-label': wordLabel,
            'aria-invalid': !!error,
            'aria-describedby': error ? errorId : undefined,
            'data-test': DATA_TEST.CLUE_WORD,
          }}
          onChange={(event) => setWord(event.target.value)}
          onBlur={() => { if (word) setTouched(true); }}
        />
      </Styled.WordField>
      <Styled.Field>
        <label htmlFor={countId}>{intl.formatMessage(intlMessages.clueCount)}</label>
        <Styled.Select
          id={countId}
          value={String(count)}
          data-test={DATA_TEST.CLUE_COUNT}
          onChange={(event) => {
            const { value } = event.target;
            setCount(value === 'unlimited' ? 'unlimited' : Number(value));
          }}
        >
          {COUNTS.map((option) => (
            <option key={option} value={String(option)}>{countLabel(intl, option)}</option>
          ))}
        </Styled.Select>
      </Styled.Field>
      <BBButton
        label={intl.formatMessage(intlMessages.sendClue)}
        dataTest={DATA_TEST.CLUE_SUBMIT}
        disabled={pending}
        onClick={submit}
      />
      {error && <Styled.Error id={errorId} role="alert">{error}</Styled.Error>}
    </Styled.Form>
  );
}

/** The bar above the board: the clue, the guesses left, and the turn's actions. */
function CluePanel({
  intl, game, currentUserId, users, pending, dispatch,
}: CluePanelProps) {
  const clueGiver = canGiveClue(game, currentUserId);
  const guesser = canGuess(game, currentUserId);
  const turn = game.turn ? teamLabel(intl, game.turn, true) : '';
  const spymaster = game.turn ? spymasterOf(game.roster, game.turn) : null;
  const title = (
    <Styled.Title id="codenames-clue-title">{intl.formatMessage(intlMessages.clueTitle)}</Styled.Title>
  );

  if (game.phase === 'clue') {
    return (
      <Styled.Bar aria-labelledby="codenames-clue-title" $team={game.turn}>
        {title}
        {clueGiver ? (
          <Styled.Grow>
            <BBBTypography variant="text2">{intl.formatMessage(intlMessages.yourClue)}</BBBTypography>
            <ClueForm
              intl={intl}
              game={game}
              pending={pending}
              onSubmit={(word, count) => dispatch({ type: 'giveClue', word, count })}
            />
          </Styled.Grow>
        ) : (
          <BBBTypography>
            {intl.formatMessage(intlMessages.waitingClue, {
              0: spymaster ? userLabel(intl, spymaster, users) : turn,
            })}
          </BBBTypography>
        )}
      </Styled.Bar>
    );
  }

  if (game.phase !== 'guess' || !game.clue) return null;
  const guessesLeft = game.guessesLeft === null
    ? intl.formatMessage(intlMessages.unlimitedGuesses)
    : intl.formatMessage(intlMessages.guessesLeft, { 0: game.guessesLeft });

  return (
    <Styled.Bar aria-labelledby="codenames-clue-title" $team={game.clue.team}>
      {title}
      <Styled.Clue aria-live="polite">
        <Styled.ClueWord>{game.clue.word}</Styled.ClueWord>
        <Styled.ClueCount>{countLabel(intl, game.clue.count)}</Styled.ClueCount>
      </Styled.Clue>
      <Styled.Guesses>{guessesLeft}</Styled.Guesses>
      {guesser && (
        <Styled.Actions>
          <BBBTypography variant="text2">{intl.formatMessage(intlMessages.pickCard)}</BBBTypography>
          <BBButton
            variant="secondary"
            label={intl.formatMessage(intlMessages.endTurn)}
            dataTest={DATA_TEST.END_TURN}
            disabled={pending || !canEndTurn(game, currentUserId)}
            tooltipLabel={canEndTurn(game, currentUserId)
              ? undefined : intl.formatMessage(intlMessages.endTurnHint)}
            onClick={() => dispatch({ type: 'endTurn' })}
          />
        </Styled.Actions>
      )}
    </Styled.Bar>
  );
}

export default CluePanel;
