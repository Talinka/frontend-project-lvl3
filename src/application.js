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
  .then((data) => parseRss(data));

const getUpdatePropmises = (state) => {
  const promises = state.feeds.map((feed) => getFeedData(feed.url)
    .then((rssObject) => ({ rssObject, feed }))
    .catch((error) => ({ error, feed })));

  return Promise.all(promises);
};

const validate = (value, feeds) => {
  const schema = string()
    .required()
    .url()
    .notOneOf(_.map(feeds, 'url'));

  return schema.validate((value));
};

const updateValidationState = (state) => {
  validate(state.inputText, state.feeds)
    .then(() => {
      state.inputError = null;
    })
    .catch((error) => {
      state.inputError = error.type;
    })
    .then(() => {
      state.inputValid = _.isNull(state.inputError);
    });
};


const handleInputChange = (elements, state) => () => {
  state.inputText = elements.feedInput.value;
  updateValidationState(state);
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
    state: 'updated',
    lastUpdateTime: new Date(),
  };
  return newFeed;
};

const handleFeedAdd = (elements, state) => (e) => {
  e.preventDefault();
  const url = state.inputText;
  state.feedAddingState = 'loading';

  getFeedData(url)
    .then((rssObject) => {
      const newFeed = getNewFeed(url, rssObject);
      const newPosts = getNewPosts(state, newFeed.id, rssObject.posts);
      state.feeds.unshift(newFeed);
      state.posts.unshift(...newPosts);
      state.feedAddingState = 'ready';
    })
    .catch((error) => {
      console.error(error.message);
      if (error instanceof TypeError) {
        state.feedAddingError = 'parseError';
      } else {
        state.feedAddingError = 'networkError';
      }
      state.feedAddingState = 'error';
    })
    .then(() => {
      state.inputText = elements.feedInput.value;
      updateValidationState(state);
    });
};

const handleFeedUpdate = (state) => {
  setTimeout(() => getUpdatePropmises(state)
    .then((results) => {
      results.forEach(({ feed, rssObject, error }) => {
        if (error) {
          console.error(error.message);
          feed.error = error.message;
        } else {
          const newPosts = getNewPosts(state, feed.id, rssObject.posts);
          state.posts.unshift(...newPosts);
        }
        feed.state = error ? 'error' : 'updated';
        feed.lastUpdateTime = new Date();
      });
      handleFeedUpdate(state);
    }), timeout);
};

const handleLoadComplete = (state) => () => {
  state.feedAddingState = 'ready';
};

export default function () {
  i18next.init({
    lng: 'en',
    debug: true,
    resources,
  })
    .then(() => {
      const state = {
        feeds: [],
        posts: [],
        inputText: '',
        inputValid: false,
        inputError: 'required',
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
        feedContainer: document.getElementById('feedContainer'),
        postContainer: document.getElementById('postContainer'),
        modalInfo: document.getElementById('modalInfo'),
      };

      elements.form.addEventListener('submit', handleFeedAdd(elements, state));
      elements.feedInput.addEventListener('input', handleInputChange(elements, state));

      watch(state, 'feeds', () => renderer.feeds(elements, state));
      watch(state, 'inputError', () => renderer.validity(elements, state));
      watch(state, 'feedAddingState', () => renderer.feedAdding(elements, state, handleLoadComplete));

      handleFeedUpdate(state);
    });
}
