import app from '../src/application';

// test('init', () => app().then((result) => expect(result).toBeTruthy()));

test('ddd', async () => {
  const r = await app();
  expect(r).toBeTruthy();
});

test('main', () => expect(app().resolves.toBeTruthy()));
