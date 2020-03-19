export default function parse(rssString) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(rssString, 'text/xml');

  try {
    const channelTitleTag = doc.querySelector('channel title');
    const channelDescriptionTag = doc.querySelector('channel description');

    const posts = [...doc.querySelectorAll('item')]
      .map((post) => ({
        title: post.querySelector('title').textContent,
        link: post.querySelector('link').textContent,
        pubDate: post.querySelector('pubDate').textContent,
      }));

    const channelObject = {
      title: channelTitleTag.textContent,
      description: channelDescriptionTag.textContent,
      posts,
    };

    return channelObject;
  } catch (error) {
    throw new Error('Parsing error: this feed is not valid.');
  }
}
