import { describe, expect, it } from 'vitest';
import en from '../../public/locales/en.json';
import ptBR from '../../public/locales/pt-BR.json';
import index from '../../public/locales/index.json';

type Messages = Record<string, Record<string, { id: string; defaultMessage: string }>>;

const modules = import.meta.glob('../../src/**/messages.ts', { eager: true }) as Record<string, Messages>;
const defined = Object.values(modules)
  .flatMap((module) => Object.values(module))
  .flatMap((group) => Object.values(group));

const placeholders = (text: string) => [...text.matchAll(/\{(\d)/g)].map((m) => m[1]).sort().join();

describe('locales', () => {
  it('index.json lists both files', () => {
    expect(index).toEqual(['en.json', 'pt-BR.json']);
  });

  it('every message used in the code exists in en and pt-BR', () => {
    expect(defined.length).toBeGreaterThan(100);
    defined.forEach(({ id }) => {
      expect(en, id).toHaveProperty([id]);
      expect(ptBR, id).toHaveProperty([id]);
    });
  });

  it('en and pt-BR have the same keys and placeholders', () => {
    expect(Object.keys(ptBR).sort()).toEqual(Object.keys(en).sort());
    Object.entries(en).forEach(([id, text]) => {
      expect(placeholders((ptBR as Record<string, string>)[id]), id).toBe(placeholders(text));
    });
  });

  it('en matches the default messages', () => {
    defined.forEach(({ id, defaultMessage }) => {
      expect((en as Record<string, string>)[id], id).toBe(defaultMessage);
    });
  });
});
