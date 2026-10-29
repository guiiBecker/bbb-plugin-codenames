import styled from 'styled-components';
import { CardSize } from '../card/types';

const GAPS = { small: '0.3rem', medium: '0.5rem', large: '0.65rem' };

const Grid = styled.div<{ $columns: number; $size: CardSize }>`
  display: grid;
  grid-template-columns: repeat(${({ $columns }) => $columns}, minmax(0, 1fr));
  gap: ${({ $size }) => GAPS[$size]};
  min-width: 0;
`;

export default { Grid };
