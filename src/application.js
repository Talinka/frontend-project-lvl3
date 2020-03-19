import { watch } from 'melanke-watchjs';
import i18next from 'i18next';
import resources from './locales';

const main = (render, addFeedHandle, inputChangeHandle, updateFeedsHandle) => {
  const state = {
    feeds: [],
    inputState: 'empty',
    systemState: 'ready',
    systemError: null,
  };

  document.getElementById('feedForm').addEventListener('submit', addFeedHandle(state));
  document.getElementById('feedInput').addEventListener('input', inputChangeHandle(state));

  watch(state, 'feeds', () => render.feeds(state));
  watch(state, 'inputState', () => render.validity(state));
  watch(state, 'systemState', () => render.alert(state));

  render.alert(state);
  render.validity(state);
  updateFeedsHandle(state);
};

export default function (render, addFeedHandle, inputChangeHandle, updateFeedsHandle) {
  i18next.init({
    lng: 'ru',
    debug: true,
    resources,
  }).then(() => {
    main(render, addFeedHandle, inputChangeHandle, updateFeedsHandle);
  });
}
