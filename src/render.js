import { get } from 'axios';
import { string } from 'yup';
import _ from 'lodash';
import i18next from 'i18next';
import parseRss from './parser';

const corsProxy = 'https://cors-anywhere.herokuapp.com/';

const elements = {
  addButton: document.getElementById('addButton'),
  feedInput: document.getElementById('feedInput'),
  form: document.getElementById('feedForm'),
  formGroup: document.querySelector('.form-group'),
  feedBack: document.querySelector('.invalid-feedback'),
  errorAlert: document.getElementById('errorAlert'),
};

const loadFeed = (urlString) => {
  const url = new URL(urlString);
  const rssUrl = new URL(`${url.host}${url.pathname}`, corsProxy);
  return get(rssUrl)
    .then(({ data }) => data);
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

const addFeedHandle = (state) => (e) => {
  e.preventDefault();
  const url = elements.feedInput.value;
  elements.form.reset();
  state.inputState = 'empty';
  loadFeed(url)
    .then((data) => {
      const rssObject = parseRss(data);
      const newFeed = {
        id: _.uniqueId(),
        url,
        ...rssObject,
        posts: rssObject.posts
          .map((post) => ({ id: _.uniqueId, ...post })),
      };
      state.feeds = [newFeed, ...state.feeds];
      state.systemState = 'success';
    })
    .catch((error) => {
      console.error(error.message);
      state.systemError = error.message;
      state.systemState = 'error';
    });
};

const getUpdatePropmises = (state) => {
  const promises = state.feeds.map((feed) => loadFeed(feed.url)
    .then((data) => parseRss(data))
    .then((rssObj) => ({ result: 'success', feed, data: rssObj }))
    .catch((error) => ({ result: 'error', feed, error })));

  return Promise.all(promises);
};

const updateFeedsHandle = (state) => {
  setTimeout(() => getUpdatePropmises(state)
    .then((results) => {
      results.forEach(({
        result, feed, data, error,
      }) => {
        console.warn(result);
        if (result === 'error') {
          console.error(error.message);
          feed.error = error.message;
        } else {
          const newPosts = _.differenceBy(data.posts, feed.posts, 'link')
            .map((post) => ({ id: _.uniqueId, ...post }));
          feed.posts = [...newPosts, ...feed.posts];
        }
        feed.state = result;
      });
      updateFeedsHandle(state);
    }), 5000);
};

const renderAlert = (state) => {
  const { systemState, systemError } = state;
  if (systemState === 'error') {
    elements.errorAlert.textContent = systemError;
    elements.errorAlert.style.display = 'block';
  } else {
    elements.errorAlert.style.display = 'none';
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
  const { feeds } = state;
  feeds.forEach(({ title, description, posts }) => {
    const feedElement = document.createElement('li');
    const titleElement = document.createElement('h3');
    titleElement.textContent = title;
    const descElement = document.createElement('div');
    descElement.textContent = description;
    feedElement.append(titleElement, descElement);
    feedElement.classList.add('list-group-item');
    feedList.append(feedElement);
    posts.forEach((post) => {
      const postElement = document.createElement('li');
      postElement.classList.add('list-group-item');
      postElement.innerHTML = `<a href=${post.link}>${post.title}</a>`;
      postList.appendChild(postElement);
    });
  });
  feedContainer.appendChild(feedList);
  postContainer.appendChild(postList);
};

const renderer = {
  feeds: renderFeeds,
  validity: renderValidity,
  alert: renderAlert,
};

export {
  inputChangeHandle,
  addFeedHandle,
  updateFeedsHandle,
  renderer,
};
