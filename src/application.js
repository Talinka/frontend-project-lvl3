/* eslint no-param-reassign: ["error", { "props": false }] */

import _ from 'lodash';
import { watch } from 'melanke-watchjs';
import i18next from 'i18next';
import { get } from 'axios';
import { string } from 'yup';
import parseRss from './parser';
import resources from './locales';
import renderer from './renders';

const corsProxy = 'https://cors-anywhere.herokuapp.com/';

const timeout = 10000;

const loadFeed = (urlString) => {
  const proxiedUrl = `${corsProxy}${urlString}`;
  return get(proxiedUrl)
    .then((response) => response.data);
};

const getFeedData = (url) => loadFeed(url)
  .then((data) => {
    try {
      return parseRss(data);
    } catch (e) {
      throw new Error(i18next.t('parseError'));
    }
  })
  .then((rssObject) => ({ result: 'success', rssObject }))
  .catch((error) => ({ result: 'error', error }));

const getUpdatePropmises = (state) => {
  const promises = state.feeds.map((feed) => getFeedData(feed.url)
    .then((data) => ({ ...data, feed })));

  return Promise.all(promises);
};

const validate = (value, feeds) => {
  const schema = string().url();
  return schema.isValid(value)
    .then((valid) => {
      if (!value) {
        return 'empty';
      }
      if (!valid) {
        return 'incorrectUrl';
      }
      if (_.map(feeds, 'url').includes(value)) {
        return 'alreadyAdded';
      }
      return 'valid';
    });
};

const inputChangeHandle = (elements, state) => () => {
  state.inputText = elements.feedInput.value;
  const { feeds } = state;
  validate(state.inputText, feeds)
    .then((result) => {
      state.inputState = result;
    });
};

const getNewPosts = (state, feedId, posts) => {
  const oldPosts = state.posts.filter((post) => post.feedId === feedId);
  const newPosts = _.differenceBy(posts, oldPosts, 'link')
    .map((post) => ({ id: _.uniqueId, feedId, ...post }));
  return newPosts;
};

const getNewFeed = (url, rssObject) => {
  const { title, description } = rssObject;
  const newFeed = {
    id: _.uniqueId(),
    url,
    title,
    description,
    state: 'success',
    lastUpdateTime: new Date(),
  };
  return newFeed;
};

const addFeedHandle = (elements, state) => (e) => {
  e.preventDefault();
  const url = state.inputText;
  elements.form.reset();
  state.inputState = 'empty';
  state.feedAddingState = 'loading';

  getFeedData(url)
    .then(({ result, rssObject, error }) => {
      if (result === 'success') {
        const newFeed = getNewFeed(url, rssObject);
        const newPosts = getNewPosts(state, newFeed.id, rssObject.posts);
        state.feeds = [newFeed, ...state.feeds];
        state.posts = [...newPosts, ...state.posts];
        state.feedAddingState = 'ready';
      } else if (result === 'error') {
        console.error(error.message);
        state.feedAddingError = error.message;
        state.feedAddingState = 'error';
      }
    });
};

const updateFeedsHandle = (state) => {
  setTimeout(() => getUpdatePropmises(state)
    .then((results) => {
      results.forEach(({
        result, feed, rssObject, error,
      }) => {
        if (result === 'error') {
          console.error(error.message);
          feed.error = error.message;
        } else {
          const newPosts = getNewPosts(state, feed.id, rssObject.posts);
          state.posts = [...newPosts, ...state.posts];
        }
        feed.state = result;
        feed.lastUpdateTime = new Date();
      });
      updateFeedsHandle(state);
    }), timeout);
};

const completeAddingHandle = (state) => () => {
  state.feedAddingState = 'ready';
};

const main = () => {
  const state = {
    feeds: [],
    posts: [],
    inputText: '',
    inputState: 'empty',
    feedAddingState: 'ready',
    feedAddingError: null,
  };

  const elements = {
    addButton: document.getElementById('addButton'),
    loadingButton: document.getElementById('loadingButton'),
    feedInput: document.getElementById('feedInput'),
    form: document.getElementById('feedForm'),
    formGroup: document.querySelector('.form-group'),
    feedBack: document.querySelector('.invalid-feedback'),
    modalInfo: document.getElementById('modalInfo'),
  };

  elements.form.addEventListener('submit', addFeedHandle(elements, state));
  elements.feedInput.addEventListener('input', inputChangeHandle(elements, state));

  watch(state, 'feeds', () => renderer.feeds(elements, state));
  watch(state, 'inputState', () => renderer.validity(elements, state));
  watch(state, 'feedAddingState', () => renderer.feedAdding(elements, state, completeAddingHandle));

  updateFeedsHandle(state);
};

export default function () {
  i18next.init({
    lng: 'en',
    debug: true,
    resources,
  }).then(() => {
    main();
  });
}
