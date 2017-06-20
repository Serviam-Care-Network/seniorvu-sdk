import test from 'ava';
import srvu from '../dist/seniorvu';

test(t => {
  srvu.config({
    email: process.env.EMAIL,
    password: process.env.PASSWORD,
  });
});
