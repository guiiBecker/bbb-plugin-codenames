import * as React from 'react';
import { useEffect, useId, useState } from 'react';
import { BBButton, BBBTypography } from '@bigbluebutton/bbb-ui-components-react';
import { DATA_TEST } from '../../commons/constants';
import { wordListLabel } from '../../commons/format';
import { BOARD_SIZE } from '../../game/constants';
import { WordListId } from '../../game/types';
import { WORD_LIST_IDS } from '../../words/constants';
import { parseCustomWords } from '../../words/service';
import { intlMessages } from './messages';
import Styled from './styles';
import { WordListPickerProps } from './types';

function WordListPicker({ intl, wordList, dispatch }: WordListPickerProps) {
  const [choice, setChoice] = useState<WordListId>(wordList.id);
  const [text, setText] = useState(wordList.customWords.join('\n'));
  const name = useId();
  const textId = useId();

  useEffect(() => { setChoice(wordList.id); }, [wordList.id]);

  const parsed = parseCustomWords(text);
  const enough = parsed.words.length >= BOARD_SIZE;
  const inUse = wordList.id === 'custom'
    && parsed.words.join('\n') === wordList.customWords.join('\n');

  const pick = (id: WordListId) => {
    setChoice(id);
    // The built-in lists apply at once; a custom list waits for "Use this list".
    if (id !== 'custom') dispatch({ type: 'setWordList', wordList: { id, customWords: [] } });
  };

  return (
    <Styled.Section aria-labelledby={`${name}-title`}>
      <BBBTypography variant="selected" id={`${name}-title`}>
        {intl.formatMessage(intlMessages.wordListTitle)}
      </BBBTypography>
      <Styled.Radios role="radiogroup" aria-labelledby={`${name}-title`}>
        {WORD_LIST_IDS.map((id) => (
          <label key={id} htmlFor={`${name}-${id}`}>
            <input
              type="radio"
              id={`${name}-${id}`}
              name={name}
              value={id}
              checked={choice === id}
              data-test={DATA_TEST.WORD_LIST_OPTION}
              onChange={() => pick(id)}
            />
            {wordListLabel(intl, id)}
          </label>
        ))}
      </Styled.Radios>
      {choice === 'custom' && (
        <>
          <label htmlFor={textId}>{intl.formatMessage(intlMessages.customLabel)}</label>
          <Styled.TextArea
            id={textId}
            value={text}
            placeholder={intl.formatMessage(intlMessages.customPlaceholder)}
            data-test={DATA_TEST.WORD_LIST_CUSTOM}
            onChange={(event) => setText(event.target.value)}
          />
          <BBBTypography variant="text2" aria-live="polite">
            {intl.formatMessage(intlMessages.customCount, {
              0: parsed.words.length, 1: parsed.duplicates,
            })}
            {!enough && ` ${intl.formatMessage(intlMessages.customTooFew)}`}
          </BBBTypography>
          <Styled.Actions>
            <BBButton
              variant="secondary"
              label={intl.formatMessage(
                inUse ? intlMessages.customInUse : intlMessages.customApply,
              )}
              disabled={!enough || inUse}
              onClick={() => dispatch({
                type: 'setWordList', wordList: { id: 'custom', customWords: parsed.words },
              })}
            />
          </Styled.Actions>
        </>
      )}
    </Styled.Section>
  );
}

export default WordListPicker;
