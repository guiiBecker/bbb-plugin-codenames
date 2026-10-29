import * as React from 'react';
import { BBBModal, BBButton, BBBTypography } from '@bigbluebutton/bbb-ui-components-react';
import { DATA_TEST } from '../../commons/constants';
import { commonMessages } from '../../commons/messages';
import { getModalParent } from './constants';
import { intlMessages } from './messages';
import Styled from './styles';
import { AdminModalProps } from './types';

function AdminModal({
  intl, isOpen, onClose, game, isHost, hostName, hostPresent, hidden, onShow, onOpenGame,
  onCloseGame, dispatch,
}: AdminModalProps) {
  const title = intl.formatMessage(commonMessages.appName);
  const inPlay = game?.phase === 'clue' || game?.phase === 'guess';
  const run = (action: () => void) => () => {
    action();
    onClose();
  };

  return (
    <BBBModal
      isOpen={isOpen}
      onRequestClose={onClose}
      parentSelector={getModalParent}
      ariaHideApp={false}
      title={title}
      contentLabel={title}
      testId={DATA_TEST.ADMIN_MODAL}
      noFooter
    >
      <Styled.Body>
        <BBBTypography>{intl.formatMessage(intlMessages.description)}</BBBTypography>
        {game && (
          <BBBTypography variant="selected">
            {isHost
              ? intl.formatMessage(intlMessages.statusHost)
              : intl.formatMessage(intlMessages.statusOther, { 0: hostName })}
          </BBBTypography>
        )}
        {game && !isHost && (
          <Styled.Warning>
            {intl.formatMessage(hostPresent ? intlMessages.takeOverHint : intlMessages.hostAway)}
          </Styled.Warning>
        )}
        <Styled.Actions>
          {!game && (
            <BBButton
              label={intl.formatMessage(intlMessages.open)}
              dataTest={DATA_TEST.ADMIN_OPEN}
              onClick={run(() => onOpenGame(false))}
            />
          )}
          {game && (
            <BBButton
              variant="secondary"
              color="danger"
              label={intl.formatMessage(intlMessages.close)}
              dataTest={DATA_TEST.ADMIN_CLOSE}
              onClick={run(onCloseGame)}
            />
          )}
          {game && isHost && inPlay && (
            <BBButton
              variant="secondary"
              label={intl.formatMessage(intlMessages.abort)}
              dataTest={DATA_TEST.ABORT}
              onClick={run(() => dispatch({ type: 'abort' }))}
            />
          )}
          {game && !isHost && (
            <BBButton
              variant="secondary"
              label={intl.formatMessage(intlMessages.takeOver)}
              dataTest={DATA_TEST.ADMIN_TAKE_OVER}
              onClick={run(() => onOpenGame(true))}
            />
          )}
          {game && hidden && (
            <BBButton
              label={intl.formatMessage(intlMessages.show)}
              dataTest={DATA_TEST.ADMIN_SHOW}
              onClick={run(onShow)}
            />
          )}
        </Styled.Actions>
      </Styled.Body>
    </BBBModal>
  );
}

export default AdminModal;
