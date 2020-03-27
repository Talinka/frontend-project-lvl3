import i18next from 'i18next';
import $ from 'jquery';
import 'bootstrap';

const renderFeedAdding = (elements, state, closeModalHandle) => {
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

const renderValidity = (elements, state) => {
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

const renderFeeds = (elements, state) => {
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

const renderer = {
  feeds: renderFeeds,
  validity: renderValidity,
  feedAdding: renderFeedAdding,
};

export default renderer;
