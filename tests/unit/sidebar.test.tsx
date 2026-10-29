import * as React from 'react';
import {
  describe, expect, it, vi,
} from 'vitest';
import {
  fireEvent, render, screen, within,
} from '@testing-library/react';
import { createIntl } from 'react-intl';
import ptBR from '../../public/locales/pt-BR.json';
import GameView from '../../src/components/game-view/component';
import Sidebar from '../../src/components/sidebar/component';
import { createLobby } from '../../src/game/reducer';
import { GameAction, GameState } from '../../src/game/types';
import { toPublicGame } from '../../src/game/view';
import { createStore } from '../../src/store/service';
import { GameViewState } from '../../src/store/types';
import { HOST, ROSTER, playingState } from './helpers/game';

const intl = createIntl({ locale: 'pt-BR', messages: ptBR });

const NAMES = {
  [HOST]: 'Hana', w_red1: 'Rui', w_red2: 'Rosa', w_blue0: 'Bia', w_blue1: 'Beto', w_viewer: 'Vera',
};

const makeStore = (state: GameState, viewer: string, overrides: Partial<GameViewState> = {}) => {
  const dispatch = vi.fn<(action: GameAction) => void>();
  const closeGame = vi.fn();
  const store = createStore<GameViewState>({
    intl,
    pluginName: 'BbbPluginCodenames',
    currentUserId: viewer,
    isModerator: viewer === HOST,
    isHost: viewer === HOST,
    hostReady: true,
    hostPresent: true,
    game: toPublicGame(state),
    secretKey: null,
    names: NAMES,
    presentUserIds: new Set(Object.keys(NAMES)),
    pending: false,
    dispatch,
    closeGame,
    openSidebar: null,
    hidden: false,
    showBoard: vi.fn(),
    takeOver: vi.fn(),
    ...overrides,
  });
  return { store, dispatch, closeGame };
};

/** Two rounds: red guessed one card and passed; blue is guessing now. */
const twoRounds = (): GameState => playingState({
  phase: 'guess',
  turn: 'blue',
  clue: { team: 'blue', word: 'gelo', count: 1 },
  history: [
    {
      type: 'clue', team: 'red', word: 'oceano', count: 2, by: HOST,
    },
    {
      type: 'reveal', team: 'red', index: 0, word: 'mar', color: 'red', by: 'w_red1',
    },
    { type: 'pass', team: 'red', by: 'w_red2' },
    {
      type: 'clue', team: 'blue', word: 'gelo', count: 1, by: 'w_blue0',
    },
  ],
});

describe('Sidebar', () => {
  it('lists the rounds newest first, the current one marked', () => {
    const { store } = makeStore(twoRounds(), 'w_viewer');
    render(<Sidebar store={store} />);
    expect(screen.getByText('Histórico das rodadas')).toBeInTheDocument();
    const rounds = screen.getAllByRole('listitem').filter((li) => li.hasAttribute('data-test'));
    expect(rounds.map((round) => round.textContent)).toEqual([
      'Rodada 2 · Time AzulagoraDica de Bia: gelo · 1Nenhum palpite ainda.',
      'Rodada 1 · Time VermelhoDica de Hana: oceano · 2Rui revelou mar: carta do time VermelhoRosa encerrou a vez',
    ]);
    expect(rounds[0]).toHaveAttribute('aria-current', 'step');
  });

  it('once the turn has passed, no round is marked as current until the next clue', () => {
    const { store } = makeStore({
      ...twoRounds(), phase: 'clue', turn: 'red', clue: null,
    }, 'w_viewer');
    render(<Sidebar store={store} />);
    expect(screen.queryByText('agora')).not.toBeInTheDocument();
  });

  it('lists both teams for everyone, the team in turn marked', () => {
    const { store } = makeStore(twoRounds(), 'w_red1');
    render(<Sidebar store={store} />);
    const teams = screen.getByRole('region', { name: 'Times' });
    expect(teams).toHaveTextContent('Time Vermelhofaltam 9 cartasEspião-mestreHanaAgentesRui (você), Rosa');
    expect(teams).toHaveTextContent('Time Azulfaltam 8 cartasEspião-mestreBiaAgentesBeto');
    const current = teams.querySelector('[aria-current]');
    expect(current).toHaveTextContent('Time Azul');
  });

  it('no team list before the draw', () => {
    const { store } = makeStore(createLobby(HOST, { id: 'pt-BR', customWords: [] }), HOST);
    render(<Sidebar store={store} />);
    expect(screen.queryByRole('region', { name: 'Times' })).not.toBeInTheDocument();
  });

  it('shows who won once the match ended', () => {
    const state = twoRounds();
    const ended = {
      ...state,
      phase: 'ended' as const,
      winner: 'red' as const,
      endReason: 'assassin' as const,
      history: [...state.history, { type: 'end' as const, winner: 'red' as const, reason: 'assassin' as const }],
    };
    const { store } = makeStore(ended, 'w_viewer');
    render(<Sidebar store={store} />);
    expect(screen.getByText('Time Vermelho venceu: o assassino foi revelado')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem').some((li) => li.hasAttribute('aria-current'))).toBe(false);
  });

  it('participants get only the rounds: no moderator controls', () => {
    const { store } = makeStore(twoRounds(), 'w_red1');
    render(<Sidebar store={store} />);
    expect(screen.getByText('Histórico das rodadas')).toBeInTheDocument();
    expect(screen.queryAllByRole('button')).toHaveLength(0);
    expect(screen.queryByText('Controles do moderador')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Encerrar partida' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Fechar o jogo para todos' })).not.toBeInTheDocument();
  });

  it('moderators end the match, or close the game after confirming', () => {
    const { store, dispatch, closeGame } = makeStore(twoRounds(), HOST);
    render(<Sidebar store={store} />);
    fireEvent.click(screen.getByRole('button', { name: 'Encerrar partida' }));
    expect(dispatch).toHaveBeenCalledWith({ type: 'abort' });

    fireEvent.click(screen.getByRole('button', { name: 'Fechar o jogo para todos' }));
    expect(closeGame).not.toHaveBeenCalled();
    const confirm = screen.getByRole('group', { name: 'Fechar o jogo para todos' });
    fireEvent.click(within(confirm).getByRole('button', { name: 'Cancelar' }));
    expect(screen.queryByRole('group', { name: 'Fechar o jogo para todos' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Fechar o jogo para todos' }));
    fireEvent.click(screen.getByRole('button', { name: 'Fechar o jogo' }));
    expect(closeGame).toHaveBeenCalledTimes(1);
  });

  it('in the lobby: no rounds yet, and moderators can still close the game', () => {
    const lobby = createLobby(HOST, { id: 'pt-BR', customWords: [] }, ROSTER);
    const { store } = makeStore(lobby, HOST);
    render(<Sidebar store={store} />);
    expect(screen.getByText('As rodadas aparecem aqui quando a partida começar.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Encerrar partida' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Fechar o jogo para todos' })).toBeInTheDocument();
  });
});

describe('Sidebar extras', () => {
  it('a viewer who hid the board can bring it back from the panel', () => {
    const showBoard = vi.fn();
    const { store } = makeStore(twoRounds(), 'w_red1', { hidden: true, showBoard });
    render(<Sidebar store={store} />);
    fireEvent.click(screen.getByRole('button', { name: 'Mostrar o tabuleiro' }));
    expect(showBoard).toHaveBeenCalledTimes(1);
  });

  it('a moderator who is not the host can take over', () => {
    const takeOver = vi.fn();
    const { store } = makeStore(twoRounds(), 'w_mod2', { isModerator: true, takeOver });
    render(<Sidebar store={store} />);
    fireEvent.click(screen.getByRole('button', { name: 'Assumir como anfitrião' }));
    expect(takeOver).toHaveBeenCalledTimes(1);
  });
});

describe('GameView and the sidebar', () => {
  it('the board no longer carries the history or the moderator controls', () => {
    const { store } = makeStore(twoRounds(), HOST);
    render(<GameView store={store} />);
    expect(screen.queryByText('Histórico das rodadas')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Encerrar partida' })).not.toBeInTheDocument();
  });

  it('a button above the board opens the sidebar panel', () => {
    const openSidebar = vi.fn();
    const { store } = makeStore(twoRounds(), 'w_viewer', { openSidebar });
    render(<GameView store={store} />);
    fireEvent.click(screen.getByRole('button', { name: 'Rodadas e controles' }));
    expect(openSidebar).toHaveBeenCalledTimes(1);
  });

  it('no button while the panel is not registered', () => {
    const { store } = makeStore(twoRounds(), 'w_viewer');
    render(<GameView store={store} />);
    expect(screen.queryByRole('button', { name: 'Rodadas e controles' })).not.toBeInTheDocument();
  });
});
