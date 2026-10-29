import styled from 'styled-components';
import { colorWarning } from '@bigbluebutton/bbb-ui-components-react';

const Body = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-width: min(28rem, 80vw);
`;

const Warning = styled.p`
  margin: 0;
  color: ${colorWarning};
  font-size: 0.875rem;
`;

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.5rem;
`;

export default { Body, Warning, Actions };
