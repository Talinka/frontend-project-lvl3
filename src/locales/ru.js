export default {
  translation: {
    validation: {
      url: 'Введен некорректный url',
      notOneOf: 'Вы уже подписаны на этот источник',
    },
    feedState: {
      updated: 'Последнее обновление в {{- time}}',
      error: 'Ошибка при попытке обновить: {{errorMsg}}',
    },
    feedAddingError: {
      base: 'Не удалось добавить подписку: ',
      networkError: '$t(feedAddingError.base) oшибка сети.',
      parseError: '$t(feedAddingError.base) указанный url не является валидным rss-каналом.',
    },
  },
};
