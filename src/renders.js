import i18next from 'i18next';
import $ from 'jquery';
import 'bootstrap';

const renderValidity = (elements, state) => {
  const { inputValid, inputError } = state;
  if (inputValid) {
    elements.feedInput.classList.remove('is-invalid');
    elements.feedInput.classList.add('is-valid');
  } else {
    elements.feedInput.classList.remove('is-valid');
    if (inputError === 'required') {
      elements.feedInput.classList.remove('is-invalid');
    } else {
      const { feedBack, feedInput } = elements;
      feedBack.textContent = i18next.t(`validation.${inputError}`);
      feedInput.classList.add('is-invalid');
    }
  }
  const { addButton } = elements;
  addButton.disabled = !inputValid;
};

const renderFeedAdding = (elements, state, closeModalHandle) => {
  const { feedAddingState, feedAddingError } = state;
  if (feedAddingState === 'loading') {
    elements.form.reset();
    elements.loadingButton.classList.add('show');
    elements.addButton.classList.remove('show');
  } else {
    elements.loadingButton.classList.remove('show');
    elements.addButton.classList.add('show');
  }
  if (feedAddingState === 'error') {
    const { modalInfo } = elements;
    modalInfo.textContent = i18next.t(`feedAddingError.${feedAddingError}`);
    $('#errorModal').modal();
    $('#errorModal').on('hidden.bs.modal', closeModalHandle(state));
  }
};

const renderFeeds = (elements, state) => {
  const { feedContainer, postContainer } = elements;
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
