import * as React from 'react';
import {
  describe, expect, it, vi,
} from 'vitest';
import {
  act, cleanup, fireEvent, render, screen, within,
} from '@testing-library/react';
import { createIntl } from 'react-intl';
import ptBR from '../../public/locales/pt-BR.json';
import GameView from '../../src/components/game-view/component';
import { createLobby } from '../../src/game/reducer';
import { GameAction, GameState } from '../../src/game/types';
import { toPublicGame } from '../../src/game/view';
import { createStore } from '../../src/store/service';
import { GameViewState } from '../../src/store/types';
import {
  ASSASSIN, HOST, KEY, ROSTER, playingState,
} from './helpers/game';

const intl = createIntl({ locale: 'pt-BR', messages: ptBR });

const NAMES = {
  [HOST]: 'Hana', w_red1: 'Rui', w_red2: 'Rosa', w_blue0: 'Bia', w_blue1: 'Beto', w_viewer: 'Vera',
};

const renderView = (state: GameState, viewer: string, overrides: Partial<GameViewState> = {}) => {
  const dispatch = vi.fn<(action: GameAction) => void>();
  const game = toPublicGame(state);
  const seat = state.roster[viewer];
  const store = createStore<GameViewState>({
    intl,
    pluginName: 'BbbPluginCodenames',
    currentUserId: viewer,
    isModerator: viewer === HOST,
    isHost: viewer === HOST,
    hostReady: true,
    hostPresent: true,
    game,
    // As the sync layer does: the key reaches the host and spymasters, everyone at the end.
    secretKey: game.key ?? (viewer === HOST || seat?.role === 'spymaster' ? state.key : null),
    names: NAMES,
    presentUserIds: new Set(Object.keys(NAMES)),
    pending: false,
    dispatch,
    closeGame: vi.fn(),
    openSidebar: null,
    ...overrides,
  });
  render(<GameView store={store} />);
  return { dispatch, store };
};

const cards = () => screen.getAllByRole('button', { name: /revelada|mapa-chave/ });

describe('GameView', () => {
  it('an agent sees only words; the key map is nowhere in the page', () => {
    renderView(playingState(), 'w_red1');
    expect(cards()).toHaveLength(25);
    expect(screen.queryAllByRole('button', { name: /mapa-chave/ })).toHaveLength(0);
    expect(document.body.innerHTML).not.toMatch(/assassino/);
  });

  it('a spymaster sees the key map, the assassin included', () => {
    renderView(playingState(), 'w_blue0');
    expect(screen.getAllByRole('button', { name: /mapa-chave/ })).toHaveLength(25);
    expect(screen.getByRole('button', { name: 'bomba, não revelada, mapa-chave: assassino' }))
      .toBeInTheDocument();
  });

  it('shows the turn, the phase and the cards left', () => {
    renderView(playingState(), 'w_viewer');
    expect(screen.getByRole('status')).toHaveTextContent('Time Vermelho: aguardando a dica de Hana');
    expect(screen.getByText('faltam 9 cartas')).toBeInTheDocument();
    expect(screen.getByText('faltam 8 cartas')).toBeInTheDocument();
    expect(screen.getByText('Você: Espectador')).toBeInTheDocument();
  });

  it('the spymaster in turn gets the clue form, which refuses a board word', () => {
    const { dispatch } = renderView(playingState(), HOST);
    fireEvent.change(screen.getByLabelText('Palavra da dica'), { target: { value: 'PAO' } });
    fireEvent.click(screen.getByRole('button', { name: 'Dar a dica' }));
    expect(screen.getByText(/não pode ser, conter ou fazer parte .*\(pão\)/)).toBeInTheDocument();
    expect(dispatch).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText('Palavra da dica'), { target: { value: 'oceano' } });
    fireEvent.change(screen.getByLabelText('Número de cartas'), { target: { value: '3' } });
    fireEvent.click(screen.getByRole('button', { name: 'Dar a dica' }));
    expect(dispatch).toHaveBeenCalledWith({ type: 'giveClue', word: 'oceano', count: 3 });
  });

  const guessing = (votes: GameState['votes'] = []) => playingState({
    phase: 'guess', clue: { team: 'red', word: 'oceano', count: 2 }, guessesLeft: 3, votes,
  });

  it('agents vote by clicking cards; clicking a voted card takes the vote back', () => {
    const { dispatch } = renderView(guessing([{ userId: 'w_red1', index: 0 }]), 'w_red1');
    expect(screen.getByText('3 palpites restantes')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Encerrar a vez' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'gato, não revelada' }));
    expect(dispatch).toHaveBeenLastCalledWith({ type: 'vote', index: 5, on: true });
    const voted = screen.getByRole('button', { name: 'mar, não revelada, 1 voto' });
    expect(voted).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(voted);
    expect(dispatch).toHaveBeenLastCalledWith({ type: 'vote', index: 0, on: false });
  });

  it('lists the votes, most voted first, and "Guess" reveals the top card', () => {
    const { dispatch } = renderView(guessing([
      { userId: 'w_red1', index: 0 },
      { userId: 'w_red2', index: 5 },
      { userId: 'w_red1', index: 5 },
    ]), 'w_red2');
    const panel = screen.getByRole('region', { name: 'Votos do Time Vermelho' });
    const items = within(panel).getAllByRole('listitem');
    expect(items.map((item) => item.textContent)).toEqual([
      'gato2 votosRosa (você), RuiRevelada ao adivinhar',
      'mar1 votoRui',
    ]);
    expect(screen.getByRole('button', { name: 'gato, não revelada, 2 votos' })).toBeInTheDocument();
    fireEvent.click(within(panel).getByRole('button', { name: 'Adivinhar: gato' }));
    expect(dispatch).toHaveBeenCalledWith({ type: 'guess', index: 5 });
  });

  it('"Guess" is disabled until someone votes', () => {
    renderView(guessing(), 'w_red1');
    expect(screen.getByText('Nenhum voto ainda.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Adivinhar' })).toBeDisabled();
  });

  it('the other team and spectators see the votes but cannot vote or guess', () => {
    ['w_blue1', 'w_viewer'].forEach((viewer) => {
      const { dispatch } = renderView(guessing([{ userId: 'w_red1', index: 0 }]), viewer);
      fireEvent.click(screen.getByRole('button', { name: 'gato, não revelada' }));
      expect(dispatch).not.toHaveBeenCalled();
      const panel = screen.getByRole('region', { name: 'Votos do Time Vermelho' });
      expect(within(panel).getByText('mar')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Adivinhar/ })).not.toBeInTheDocument();
      cleanup();
    });
  });

  it('revealed cards carry their type in the name, not only in color', () => {
    const revealed = Array(25).fill(false);
    revealed[0] = true;
    renderView(playingState({ revealed }), 'w_red1');
    expect(screen.getByRole('button', { name: 'mar, revelada: carta do time Vermelho' }))
      .toBeInTheDocument();
  });

  it('the end screen names the winner and shows the whole key map to everyone', () => {
    const state = playingState({
      phase: 'ended',
      winner: 'blue',
      endReason: 'assassin',
      revealed: KEY.map((_, i) => i === ASSASSIN),
    });
    renderView(state, 'w_viewer');
    expect(screen.getByText('Time Azul venceu!')).toBeInTheDocument();
    expect(screen.getByText('O outro time revelou o assassino.')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /mapa-chave/ })).toHaveLength(24);
    expect(screen.queryByRole('button', { name: 'Nova partida, mesmos times' })).not.toBeInTheDocument();
  });

  it('moderators can start a new match with the same teams', () => {
    const { dispatch } = renderView(playingState({ phase: 'ended', winner: 'red', endReason: 'allFound' }), HOST);
    fireEvent.click(screen.getByRole('button', { name: 'Nova partida, mesmos times' }));
    expect(dispatch).toHaveBeenCalledWith({ type: 'start' });
  });

  it('tells everyone when the host left', () => {
    const present = new Set(Object.keys(NAMES).filter((userId) => userId !== HOST));
    renderView(playingState(), 'w_red1', { hostPresent: false, presentUserIds: present });
    expect(screen.getByText(/Hana \(ausente\), anfitrião do jogo, saiu da sala/)).toBeInTheDocument();
  });
});

describe('Lobby', () => {
  const lobby = (roster = {}) => createLobby(HOST, { id: 'pt-BR', customWords: [] }, roster);

  it('before the draw nobody picks a team: participants wait for the moderator', () => {
    renderView(lobby(), 'w_red1');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByText('Os times ainda não foram sorteados.')).toBeInTheDocument();
    expect(screen.getByText('Aguardando um moderador sortear os times.')).toBeInTheDocument();
  });

  it('the moderator draws the teams once four participants, the host included, are in the meeting', () => {
    const present = (ids: string[]) => ({ presentUserIds: new Set(ids) });
    const view = renderView(lobby(), HOST, present([HOST, 'w_red1', 'w_red2']));
    expect(screen.getByRole('button', { name: 'Sortear os times' })).toBeDisabled();
    act(() => view.store.setState(present([HOST, 'w_red1', 'w_red2', 'w_blue1'])));
    fireEvent.click(screen.getByRole('button', { name: 'Sortear os times' }));
    expect(view.dispatch).toHaveBeenCalledWith({ type: 'shuffleTeams' });
  });

  it('after the draw, a team member offers to be the spymaster', () => {
    const drawn = lobby({ w_red1: { team: 'red', role: 'agent' }, w_red2: { team: 'red', role: 'agent' } });
    const { dispatch } = renderView(drawn, 'w_red1');
    const red = screen.getByRole('region', { name: 'Time Vermelho' });
    expect(red).toHaveTextContent('Ninguém ainda: alguém do time pode se oferecer');
    fireEvent.click(within(red).getByRole('button', { name: 'Quero ser o espião-mestre' }));
    expect(dispatch).toHaveBeenCalledWith({ type: 'claimSpymaster' });
    // Only in your own team.
    const blue = screen.getByRole('region', { name: 'Time Azul' });
    expect(within(blue).queryByRole('button')).not.toBeInTheDocument();
  });

  it('the seat taken, others cannot offer; the spymaster can step down', () => {
    const drawn = lobby({ w_red1: { team: 'red', role: 'spymaster' }, w_red2: { team: 'red', role: 'agent' } });
    renderView(drawn, 'w_red2');
    expect(screen.getByRole('button', { name: 'Quero ser o espião-mestre' })).toBeDisabled();
    cleanup();
    const { dispatch } = renderView(drawn, 'w_red1');
    fireEvent.click(screen.getByRole('button', { name: 'Deixar de ser espião-mestre' }));
    expect(dispatch).toHaveBeenCalledWith({ type: 'releaseSpymaster' });
  });

  it('the host spymaster can step down too', () => {
    const { dispatch } = renderView(lobby(ROSTER), HOST);
    fireEvent.click(screen.getByRole('button', { name: 'Deixar de ser espião-mestre' }));
    expect(dispatch).toHaveBeenCalledWith({ type: 'releaseSpymaster' });
  });

  it('a host drawn as an agent does not see the key map', () => {
    const roster = { ...ROSTER, [HOST]: { team: 'red' as const, role: 'agent' as const } };
    renderView(playingState({ roster: { ...roster, w_red1: { team: 'red', role: 'spymaster' } } }), HOST);
    expect(screen.queryAllByRole('button', { name: /mapa-chave/ })).toHaveLength(0);
    expect(document.body.innerHTML).not.toMatch(/assassino/);
  });

  it('the moderator can start only once the teams are ready', () => {
    renderView(lobby({ w_red1: { team: 'red', role: 'agent' } }), HOST);
    expect(screen.getByRole('button', { name: 'Iniciar partida' })).toBeDisabled();
    expect(screen.getByText('Time Vermelho precisa de um espião-mestre: alguém do time pode se oferecer.'))
      .toBeInTheDocument();
  });

  it('starts when ready, and offers a custom word list', () => {
    const { dispatch } = renderView(lobby(ROSTER), HOST);
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar partida' }));
    expect(dispatch).toHaveBeenCalledWith({ type: 'start' });
    fireEvent.click(screen.getByLabelText('Lista personalizada'));
    const words = Array.from({ length: 30 }, (_, i) => `palavra${i}`).join('\n');
    fireEvent.change(screen.getByLabelText('Suas palavras'), { target: { value: `${words}\npalavra1` } });
    expect(screen.getByText(/30 palavras \(1 repetidas ignoradas\)/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Usar esta lista' }));
    expect(dispatch).toHaveBeenLastCalledWith({
      type: 'setWordList',
      wordList: { id: 'custom', customWords: Array.from({ length: 30 }, (_, i) => `palavra${i}`) },
    });
  });

  it('moderators seat anyone through the organizer', () => {
    const { dispatch } = renderView(lobby(), HOST);
    fireEvent.change(screen.getByLabelText('Lugar de Vera'), { target: { value: 'blue:spymaster' } });
    expect(dispatch).toHaveBeenCalledWith({
      type: 'assign', userId: 'w_viewer', seat: { team: 'blue', role: 'spymaster' },
    });
  });
});
