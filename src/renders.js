import { get } from 'axios';
import { string } from 'yup';
import _ from 'lodash';
import i18next from 'i18next';
import $ from 'jquery';
import 'bootstrap';
import parseRss from './parser';

const corsProxy = 'https://cors-anywhere.herokuapp.com/';

const timeout = 10000;

const elements = {
  addButton: document.getElementById('addButton'),
  loadingButton: document.getElementById('loadingButton'),
  feedInput: document.getElementById('feedInput'),
  form: document.getElementById('feedForm'),
  formGroup: document.querySelector('.form-group'),
  feedBack: document.querySelector('.invalid-feedback'),
  modalInfo: document.getElementById('modalInfo'),
};

const loadFeed = (urlString) => {
  const url = new URL(urlString);
  const rssUrl = new URL(`${url.host}${url.pathname}`, corsProxy);
  return get(rssUrl)
    .then((response) => response.data);
};

const getUpdatePropmises = (state) => {
  const promises = state.feeds.map((feed) => loadFeed(feed.url)
    .then((data) => parseRss(data))
    .then((rssObject) => ({ result: 'success', feed, rssObject }))
    .catch((error) => ({ result: 'error', feed, error })));

  return Promise.all(promises);
};

const inputChangeHandle = (state) => () => {
  const { value } = elements.feedInput;
  const { feeds } = state;
  const schema = string().url();
  if (!value) {
    state.inputState = 'empty';
    return;
  }
  schema.isValid(value).then((valid) => {
    if (!valid) {
      state.inputState = 'incorrectUrl';
    } else if (_.map(feeds, 'url').includes(value)) {
      state.inputState = 'alreadyAdded';
    } else {
      state.inputState = 'valid';
    }
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

const addFeedHandle = (state) => (e) => {
  e.preventDefault();
  const url = elements.feedInput.value;
  elements.form.reset();
  state.inputState = 'empty';
  state.feedAddingState = 'loading';
  loadFeed(url)
    .then((data) => {
      const rssObject = parseRss(data);
      const newFeed = getNewFeed(url, rssObject);
      const newPosts = getNewPosts(state, newFeed.id, rssObject.posts);
      state.feeds = [newFeed, ...state.feeds];
      state.posts = [...newPosts, ...state.posts];
      state.feedAddingState = 'ready';
    })
    .catch((error) => {
      console.error(error.message);
      state.feedAddingError = error.message;
      state.feedAddingState = 'error';
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

const closeModalHandle = (state) => () => {
  state.feedAddingState = 'ready';
};

const renderFeedAdding = (state) => {
  const { feedAddingState, feedAddingError } = state;
  if (feedAddingState === 'loading') {
    elements.loadingButton.classList.add('show');
    elements.addButton.classList.remove('show');
  } else {
    elements.loadingButton.classList.remove('show');
    elements.addButton.classList.add('show');
  }
  if (feedAddingState === 'error') {
    elements.modalInfo.textContent = `${i18next.t('addError')} ${feedAddingError}`;
    $('#errorModal').modal();
    $('#errorModal').on('hidden.bs.modal', closeModalHandle(state));
  }
};

const renderValidity = (state) => {
  const { inputState } = state;
  if (inputState === 'valid') {
    elements.feedInput.classList.remove('is-invalid');
    elements.feedInput.classList.add('is-valid');
  } else {
    elements.feedInput.classList.remove('is-valid');
    if (inputState === 'empty') {
      elements.feedInput.classList.remove('is-invalid');
    } else {
      elements.feedBack.textContent = i18next.t(`validation.${inputState}`);
      elements.feedInput.classList.add('is-invalid');
    }
  }
  elements.addButton.disabled = inputState !== 'valid';
};

const renderFeeds = (state) => {
  const feedContainer = document.getElementById('feedContainer');
  const postContainer = document.getElementById('postContainer');
  feedContainer.innerHTML = '';
  postContainer.innerHTML = '';
  const feedList = document.createElement('ul');
  feedList.classList.add('list-group');
  const postList = document.createElement('ul');
  postList.classList.add('list-group');
  const { feeds, posts } = state;
  feeds.forEach((feed) => {
    const {
      title, description, lastUpdateTime, error,
    } = feed;
    const feedElement = document.createElement('li');
    const titleElement = document.createElement('h3');
    titleElement.textContent = title;
    const descElement = document.createElement('div');
    descElement.textContent = description;
    const stateElement = document.createElement('div');
    const time = lastUpdateTime.toLocaleString();
    const feedState = i18next.t(`feedState.${feed.state}`, {
      time,
      errorMsg: error,
    });
    stateElement.textContent = `${feedState}`;
    stateElement.classList.add('small');
    const fontClass = (feed.state === 'error') ? 'text-danger' : 'text-muted';
    stateElement.classList.add(fontClass);
    feedElement.append(titleElement, descElement, stateElement);
    feedElement.classList.add('list-group-item');
    feedList.append(feedElement);
  });
  posts.forEach((post) => {
    const postElement = document.createElement('li');
    postElement.classList.add('list-group-item');
    postElement.innerHTML = `<a href=${post.link}>${post.title}</a>`;
    postList.appendChild(postElement);
  });
  feedContainer.appendChild(feedList);
  postContainer.appendChild(postList);
};

const renders = {
  feeds: renderFeeds,
  validity: renderValidity,
  feedAdding: renderFeedAdding,
};

export {
  inputChangeHandle,
  addFeedHandle,
  updateFeedsHandle,
  renders as renderer,
};
