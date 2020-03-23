import { watch } from 'melanke-watchjs';
import i18next from 'i18next';
import resources from './locales';

const main = (renders, addFeedHandle, inputChangeHandle, updateFeedsHandle) => {
  const state = {
    feeds: [],
    posts: [],
    inputState: 'empty',
    feedAddingState: 'ready',
    feedAddingError: null,
  };

  document.getElementById('feedForm').addEventListener('submit', addFeedHandle(state));
  document.getElementById('feedInput').addEventListener('input', inputChangeHandle(state));

  watch(state, 'feeds', () => renders.feeds(state));
  watch(state, 'inputState', () => renders.validity(state));
  watch(state, 'feedAddingState', () => renders.alert(state));

  renders.alert(state);
  renders.validity(state);
  updateFeedsHandle(state);
};

export default function (render, addFeedHandle, inputChangeHandle, updateFeedsHandle) {
  i18next.init({
    lng: 'en',
    debug: true,
    resources,
  }).then(() => {
    main(render, addFeedHandle, inputChangeHandle, updateFeedsHandle);
  });
}
