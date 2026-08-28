import { describe, it, expect, beforeEach } from 'vitest';
import { movieService } from './movie.service';
import { movieStore } from './movieStore.service';

describe('movie service (mock layer)', () => {
  beforeEach(() => {
    localStorage.clear();
    movieStore.resetToDefaults();
  });
  it('fetches trending movies', async () => {
    const movies = await movieService.getTrending();
    expect(movies).toBeDefined();
    expect(movies.length).toBeGreaterThan(0);
    expect(movies[0]).toHaveProperty('id');
    expect(movies[0]).toHaveProperty('title');
    expect(movies[0]).toHaveProperty('posterUrl');
  });

  it('searches movies by query', async () => {
    const results = await movieService.search('romance');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.title.toLowerCase()).toContain('romance');
  });

  it('gets movie details by id', async () => {
    const detail = await movieService.getById('1');
    expect(detail).toBeDefined();
    expect(detail.id).toBe('1');
    expect(detail.director).toBeDefined();
    expect(Array.isArray(detail.cast)).toBe(true);
  });
});
