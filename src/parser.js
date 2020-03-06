export default function parse(rssString) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(rssString, 'text/xml');

  try {
    const channelTitleTag = doc.querySelector('channel title');
    const channelDescriptionTag = doc.querySelector('channel description');

    const items = [...doc.querySelectorAll('item')]
      .map((item) => ({
        title: item.querySelector('title').textContent,
        link: item.querySelector('link').textContent,
      }));

    const channelObject = {
      title: channelTitleTag.textContent,
      description: channelDescriptionTag.textContent,
      items,
    };

    return channelObject;
  } catch (error) {
    throw new Error('Parsing error: this feed is not valid.');
  }
}
