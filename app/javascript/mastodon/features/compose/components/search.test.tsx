import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';

import { updateSearchHistory } from '@/mastodon/actions/search';
import { rootReducer } from '@/mastodon/reducers';
import { defaultMiddleware } from '@/mastodon/store/store';
import { act, fireEvent, render, screen } from '@/testing/rendering';

import { Search } from './search';

const removeAliceLabel = 'Remove @alice from recent searches';

function renderSearch() {
  const store = configureStore({
    reducer: rootReducer,
    middleware(getDefaultMiddleware) {
      return getDefaultMiddleware(defaultMiddleware);
    },
  });

  store.dispatch(
    updateSearchHistory([
      { q: 'alice', type: 'account' },
      { q: 'cats', type: 'hashtag' },
    ]),
  );

  return render(
    <Provider store={store}>
      <Search singleColumn />
    </Provider>,
  );
}

describe('<Search />', () => {
  describe('recent searches', () => {
    it('renders each recent search as a button that is not nested in another control', () => {
      renderSearch();

      const entry = screen.getByRole('button', { name: '@alice' });

      expect(entry.tagName).toBe('BUTTON');
      expect(
        entry.parentElement?.closest('button, [role="button"]'),
      ).toBeNull();
    });

    it('gives the remove button an accessible name and does not nest it in another control', () => {
      renderSearch();

      const removeButton = screen.getByRole('button', {
        name: removeAliceLabel,
      });

      expect(removeButton.tagName).toBe('BUTTON');
      expect(
        removeButton.parentElement?.closest('button, [role="button"]'),
      ).toBeNull();
    });

    it('removes the recent search when the remove button is clicked', () => {
      renderSearch();

      fireEvent.mouseDown(
        screen.getByRole('button', { name: removeAliceLabel }),
      );

      expect(screen.queryByRole('button', { name: '@alice' })).toBeNull();
      expect(screen.getByRole('button', { name: '#cats' })).not.toBeNull();
    });

    it('removes the recent search when the remove button is activated with the keyboard', () => {
      renderSearch();

      const removeButton = screen.getByRole('button', {
        name: removeAliceLabel,
      });
      act(() => {
        removeButton.focus();
      });
      fireEvent.keyDown(removeButton, { key: 'Enter' });

      expect(screen.queryByRole('button', { name: '@alice' })).toBeNull();
      expect(screen.getByRole('button', { name: '#cats' })).not.toBeNull();
    });

    it('still removes the focused recent search with the Delete key', () => {
      renderSearch();

      const entry = screen.getByRole('button', { name: '@alice' });
      act(() => {
        entry.focus();
      });
      fireEvent.keyDown(entry, { key: 'Delete' });

      expect(screen.queryByRole('button', { name: '@alice' })).toBeNull();
      expect(screen.getByRole('button', { name: '#cats' })).not.toBeNull();
    });
  });
});
