import { watch } from 'melanke-watchjs';
import { get } from 'axios';
import parseRss from './parser';

const corsProxy = 'https://cors-anywhere.herokuapp.com/';

const loadFeed = (urlString) => {
  const url = new URL(urlString);
  const rssUrl = new URL(`${url.host}${url.pathname}`, corsProxy);
  return get(rssUrl)
    .then(({ data }) => data);
};

const addFeedHandle = (elements, state) => (e) => {
  e.preventDefault();
  const url = elements.feedInput.value;
  elements.form.reset();
  loadFeed(url)
    .then((data) => {
      const { feeds } = state;
      feeds.push(parseRss(data));
    })
    .catch((error) => console.error(error.message));
};

export default () => {
  const elements = {
    addButton: document.getElementById('addButton'),
    feedInput: document.getElementById('feedInput'),
    form: document.getElementById('feedForm'),
  };

  const state = {
    feeds: [],
    inputState: 'empty',
  };

  const render = () => {
    const feedContainer = document.getElementById('feedContainer');
    const postContainer = document.getElementById('postContainer');
    feedContainer.innerHTML = '';
    postContainer.innerHTML = '';
    const feedList = document.createElement('ul');
    feedList.classList.add('list-group');
    const postList = document.createElement('ul');
    postList.classList.add('list-group');
    const { feeds } = state;
    feeds.forEach(({ title, description, items }) => {
      const feedItem = document.createElement('li');
      const titleElement = document.createElement('h3');
      titleElement.textContent = title;
      const descElement = document.createElement('div');
      descElement.textContent = description;
      feedItem.append(titleElement, descElement);
      feedItem.classList.add('list-group-item');
      feedList.append(feedItem);
      items.forEach((item) => {
        const post = document.createElement('li');
        post.classList.add('list-group-item');
        post.innerHTML = `<a href=${item.link}>${item.title}</a>`;
        postList.appendChild(post);
      });
    });
    feedContainer.appendChild(feedList);
    postContainer.appendChild(postList);
  };

  const renderValid = () => {
  };

  elements.form.addEventListener('submit', addFeedHandle(elements, state));
  // elements.feedInput.addEventListener('input', inputChangeHandler(elements, state));

  watch(state, 'feeds', () => render(elements, state));
  watch(state, 'inputState', () => renderValid(elements, state.inputState));

  render(elements, state);
};
