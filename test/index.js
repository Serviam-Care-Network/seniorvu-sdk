/* eslint camelcase: 0 */

import test from 'ava';
import nock from 'nock';

// import SeniorVu from '../src';
import SeniorVu from '../src';

const HOSTNAME = 'http://foo.local';

function mock(verb, path, query, body) {
  let scope = nock(HOSTNAME).intercept('/api' + path, verb.toUpperCase(), body);

  if (query) scope = scope.query(query);

  return scope.reply(200, { ok: true });
}

test.beforeEach(async t => {
  nock.disableNetConnect();
  nock(HOSTNAME).post('/auth/login').reply(200, { token: 'foo' });

  t.context.srvu = new SeniorVu({
    baseUrl: HOSTNAME,
    email: 'foo@foo.com',
    password: 'password',
  });

  await t.context.srvu.authenticate();
  nock(HOSTNAME).post('/auth/refresh').reply(200, { token: 'bar', expireAt: 'future' });
});

test.afterEach(() => {
  nock.cleanAll();
});

test('Can specify staging environment', t => {
  const env = 'staging';
  t.context.srvu.config({ env });

  t.regex(t.context.srvu.opts.baseUrl, /staging/);
});

test('Null baseUrl does not reset env to prod', t => {
  const env = 'staging';
  t.context.srvu.config({ env, baseUrl: null });

  t.regex(t.context.srvu.opts.baseUrl, /staging/);
});

test('Can manually specify token', t => {
  const token = 'token-foo';
  t.context.srvu.config({ token });

  t.is(token, t.context.srvu.token);
  t.is(t.context.srvu.ax.defaults.headers.Authorization, `Bearer ${token}`);
});

// NOTE: nock barfs on this
// test('Authenticate does not reset baseUrl', t => {
//   const srvu = new SeniorVu();
//   srvu.config({ env: 'staging' });
//
//   t.regex(srvu.opts.baseUrl, /staging/);
//
//   nock('https://staging.seniorvu.com').post('/auth/login').reply(200, { token: 'foo' });
//   srvu.authenticate({
//     email: 'foo',
//     password: 'bar',
//   });
//
//   t.regex(srvu.opts.baseUrl, /staging/);
// });

test.serial('Can get communities', async t => {
  const scope = mock('get', '/communities');
  await t.context.srvu.communities().get();

  t.true(scope.isDone());
});

test.serial('Can use limit param on communities', async t => {
  const scope = mock('get', '/communities', { limit: 1 });
  await t.context.srvu.communities({ limit: 1 }).get();

  t.true(scope.isDone());
});

test.serial('Can use query param on communities', async t => {
  const scope = mock('get', '/communities', { q: 'brown' });
  await t.context.srvu.communities({ q: 'brown' }).get();

  t.true(scope.isDone());
});

test.serial('Can get purchased leads', async t => {
  const scope = mock('get', '/communities/1/purchasedLeads');
  await t.context.srvu.communities(1)
    .purchasedLeads()
    .get();

  t.true(scope.isDone());
});

test.serial('Can post purchased lead to community ', async t => {
  const lead = { name: 'foo' };
  const scope = mock('post', '/communities/1/purchasedLeads', null, lead);
  await t.context.srvu.communities(1)
    .purchasedLeads()
    .post(lead);

  t.true(scope.isDone());
});
