import test from 'ava';
// import SeniorVu from '../src';
import SeniorVu from '../dist/seniorvu';

test.beforeEach(async t => {
  t.context.srvu = new SeniorVu();
  await t.context.srvu.config({
    email: process.env.EMAIL,
    password: process.env.PASSWORD,
  })
  .authenticate();
});

test('Can get communities', async t => {
  // console.log(t.context.srvu);
  const communties = await t.context.srvu.communities().get();
  t.true(communties.length > 0);
});

test('Can use limit param on communities', async t => {
  const communties = await t.context.srvu.communities({ limit: 1 }).get();
  t.true(communties.length === 1);
});

test('Can use query param on communities', async t => {
  const communties = await t.context.srvu.communities({ q: 'brown' }).get();
  t.false(communties.some(c => !/brown/i.test(c.name)));
});

test('Can get purchased leads', async t => {
  // console.log(t.context.srvu);
  const leads = await t.context.srvu.communities(1)
    .purchasedLeads()
    .get();

  t.true(leads.length > 0);
});
