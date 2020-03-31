export default function parse(rssData) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(rssData, 'text/xml');

  const channelTitleTag = doc.querySelector('channel > title');
  const channelDescriptionTag = doc.querySelector('channel > description');

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
}
