/* eslint camelcase: 0 */

import test from 'ava';
import nock from 'nock';

import SeniorVu from '../dist/seniorvu.cjs';

const HOSTNAME = 'http://foo.local';

function mock(verb, path, query, body, noprefix) { // eslint-disable-line max-params
  let scope = nock(HOSTNAME).intercept((noprefix ? '' : '/api') + path, verb.toUpperCase(), body);

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

test.serial('Can use query param on get method', async t => {
  const scope = mock('get', '/communities', { q: 'brown' });
  await t.context.srvu.communities().get({ q: 'brown' });

  t.true(scope.isDone());
});

test.serial('Can get purchased leads', async t => {
  const scope = mock('get', '/communities/1/purchasedLeads');
  await t.context.srvu.communities(1)
    .purchasedLeads()
    .get();

  t.true(scope.isDone());
});

test.serial('Can post purchased lead to community', async t => {
  const lead = { name: 'foo' };
  const scope = mock('post', '/communities/1/purchasedLeads', null, lead);
  await t.context.srvu.communities(1)
    .purchasedLeads()
    .post(lead);

  t.true(scope.isDone());
});

test.serial('Can run simultaneous requests', t => {
  const one = t.context.srvu.statuses();
  const two = t.context.srvu.priorities();

  t.deepEqual(one.chain.segments, ['statuses']);
  t.deepEqual(two.chain.segments, ['priorities']);
});

test.serial('Register uses post verb', async t => {
  const scope = nock(HOSTNAME).post('/auth/registration').reply(200, 'domain matched');

  await t.context.srvu.register();

  t.true(scope.isDone());
});

test('expiresSoon handles undefined values', t => {
  t.true(t.context.srvu.expiresSoon(undefined));
});

test('Prod environment is used with no baseUrl and prod environment set', t => {
  const s = new SeniorVu({ env: 'prod' });

  t.is('https://api.seniorvu.com', s.opts.baseUrl);
});

test('With no baseUrl, environment defaults to prod', t => {
  const s = new SeniorVu();

  t.is('https://api.seniorvu.com', s.opts.baseUrl);
});

test('expireAt can be passed in as an option', t => {
  const d = new Date().toString();
  const s = new SeniorVu({ expireAt: d });

  t.is(d, s.expireAt);
});

test('config() allows empty param', t => {
  t.notThrows(() => {
    const s = new SeniorVu();
    s.config();
  });
});

test('authenticate() with no options throws', t => {
  t.throws(() => {
    const s = new SeniorVu();
    s.authenticate();
  });
});

test('refreshToken() with token set sends refresh request', async t => {
  const s = new SeniorVu({ baseUrl: HOSTNAME, token: 'foo' });

  const scope = nock(HOSTNAME).post('/auth/refresh').reply(200, { token: 'foo' });
  await s.refreshToken();

  t.true(scope.isDone());
});

test.serial('failing register() gets handled', async t => {
  nock(HOSTNAME).post('/auth/registration').reply(500, 'server error');

  try {
    await t.context.srvu.register();
  } catch (error) {
    t.is(error.message, 'server error');
  }
});

test('SeniorVuChain blocks use of authenticate() method', t => {
  t.throws(() => {
    t.context.srvu.communities(5).purchasedLeads().authenticate();
  }, null, 'Cannot re-authenticate while chaining a request');
});

test.serial('on failure, first error in list gets used as error message', async t => {
  nock(HOSTNAME).post('/auth/registration').reply(500, { errors: ['error one', 'error two'] });

  try {
    await t.context.srvu.register();
  } catch (error) {
    t.is(error.message, 'error one');
  }
});

test.serial('on failure with no body, an unknown error message is returned', async t => {
  nock(HOSTNAME).post('/auth/registration').reply(500);

  try {
    await t.context.srvu.register();
  } catch (error) {
    t.is(error.message, 'Unknown issue');
  }
});

test('expiresSoon properly checks for date less than 24 hours', t => {
  const d = new Date(2015, 1, 1).toString();
  const res = t.context.srvu.expiresSoon(d);

  t.is(true, res);

  // Date 1 year in future
  const d2 = new Date(new Date(new Date().getYear() + 1901, 1, 1)).toString();
  const res2 = t.context.srvu.expiresSoon(d2);

  t.is(false, res2);
});

test.serial('If no token is received on authenticate() an error is thrown', async t => {
  nock(HOSTNAME).post('/auth/login').reply(200, {});

  await t.throwsAsync(async () => t.context.srvu.authenticate());
});

test.serial('If no token is received on refreshToken() an error is thrown', async t => {
  nock(HOSTNAME).post('/auth/refresh').reply(200, {});

  const s = new SeniorVu({ token: 'foo' });

  await t.throwsAsync(async () => s.refreshToken());
});
