export default {
  translation: {
    validation: {
      url: 'This url is not correct',
      notOneOf: 'This feed already is in your list',
    },
    feedState: {
      updated: 'Last updated at {{- time}}',
      error: 'Error then try to update: {{errorMsg}}',
    },
    feedAddingError: {
      base: 'This feed cannot be added:',
      networkError: '$t(feedAddingError.base) network error',
      parseError: '$t(feedAddingError.base) the url is not a valid rss-channel',
    },
  },
};
