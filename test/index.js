/* eslint camelcase: 0 */

import test from 'ava';
import nock from 'nock';

// import SeniorVu from '../src';
import SeniorVu from '../dist/seniorvu';

const HOSTNAME = 'http://foo.local';

test.beforeEach(async t => {
  nock.disableNetConnect();
  nock(HOSTNAME).post('/auth/login').reply(200, { token: 'foo' });

  t.context.srvu = new SeniorVu({
    baseUrl: HOSTNAME,
    email: 'foo@foo.com',
    password: 'password',
  });
  await t.context.srvu.authenticate();
});

test.afterEach(() => {
  nock.cleanAll();
});

test('Can specify environment', t => {
  const env = 'staging';
  t.context.srvu.config({ env });

  t.regex(t.context.srvu.baseUrl, /staging/);
});

test('Can manually specify token', t => {
  const token = 'token-foo';
  t.context.srvu.config({ token });

  t.is(token, t.context.srvu.token);
  t.is(t.context.srvu.ax.defaults.headers.Authorization, `Bearer ${token}`);
});

test('Can get communities', async t => {
  const scope = mock('get', '/communities');
  await t.context.srvu.communities().get();

  t.true(scope.isDone());
});

test('Can use limit param on communities', async t => {
  const scope = mock('get', '/communities', { limit: 1 });
  await t.context.srvu.communities({ limit: 1 }).get();

  t.true(scope.isDone());
});

test('Can use query param on communities', async t => {
  const scope = mock('get', '/communities', { q: 'brown' });
  await t.context.srvu.communities({ q: 'brown' }).get();

  t.true(scope.isDone());
});

test('Can get purchased leads', async t => {
  const scope = mock('get', '/communities/1/purchasedLeads');
  await t.context.srvu.communities(1)
    .purchasedLeads()
    .get();

  t.true(scope.isDone());
});

test('Can post purchased lead to community ', async t => {
  const lead = { name: 'foo' };
  const scope = mock('post', '/communities/1/purchasedLeads', null, lead);
  await t.context.srvu.communities(1)
    .purchasedLeads()
    .post(lead);

  t.true(scope.isDone());
});

function mock(verb, path, query, body) {
  let scope = nock(HOSTNAME).intercept('/api' + path, verb.toUpperCase(), body);

  if (query) scope = scope.query(query);

  return scope.reply(200, { ok: true });
}
