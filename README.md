[![Build Status](https://travis-ci.org/softvu/seniorvu-sdk.svg?branch=master)](https://travis-ci.org/softvu/seniorvu-sdk) [![Coverage Status](https://coveralls.io/repos/github/softvu/seniorvu-sdk/badge.svg?branch=master)](https://coveralls.io/github/softvu/seniorvu-sdk?branch=master) [![Dependency Status](https://dependencyci.com/github/softvu/seniorvu-sdk/badge)](https://dependencyci.com/github/softvu/seniorvu-sdk) [![XO code style](https://img.shields.io/badge/code_style-XO-5ed9c7.svg)](https://github.com/sindresorhus/xo)

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [seniorvu-sdk](#seniorvu-sdk)
- [Install](#install)
- [Usage](#usage)
  - [Configuration](#configuration)
    - [Other Options](#other-options)
  - [Authentication](#authentication)
  - [Fetching Data](#fetching-data)
  - [Parameters](#parameters)
  - [Writing data](#writing-data)
- [Development](#development)
  - [Committing changes](#committing-changes)
  - [Testing](#testing)
  - [Linting](#linting)
  - [Releasing](#releasing)
- [TODO](#todo)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

# seniorvu-sdk

JavaScript wrapper for the SeniorVu web API

```javascript
srvu.communities(123)
  .purchasedLeads({ q: 'brown, james', limit: 5 })
  .get();
```

# Install

    npm install --save seniorvu-sdk

In your code:

```javascript
import SeniorVu from 'seniorvu-sdk';
```

# Usage

Create a new instance of the SDK:

```javascript
const srvu = new SeniorVu();
```

## Configuration

Configuration options can either be passed to the constructor or to the `config()` method:

```javascript
const srvu = new SeniorVu({
  apiKey: 'foobar'
});

srvu.config({
  apiKey: 'new-api-key'
});
```

### Other Options

* **baseUrl**: Set baseUrl for the api
* **token**: Set bearer token manually

## Authentication

You must supply an apiKey, username/password, or single-use token first to the `authenticate()` method first before using the SDK.

By default, `authenticate()` will use options already passed in the constructor or to `config()`. You can override these by passing an object to the method.

`authenticate()` returns a promise the token result. A bearer token is stored in the instance for further requests.

```javascript
// Use already-configured options
srvu.authenticate();

// API key
srvu.authenticate({
  apiKey: 'api-key-here'
});

// Email and password
srvu.authenticate({
  email: 'you@bar.baz',
  password: 'secret'
});

// One-time token
srvu.authenticate({
  oneTimeToken: 'one-time-token-here'
});
```

## Fetching Data

This SDK works by chaining method calls in order to build the URL to call at the API. Then a final "verb" method is called to execute the request.

The verb method returns a promise with the results of the call;

For example, to fetch back a list of communities you would call:

```javascript
srvu.communities().get()
.then(communities => {
  // communities available here
})
.catch(err => {
  // Any error that hapens
});
```

Parameters passed to methods are used as identifiers, so this will fetch the community with id `123`:

```javascript
srvu.communities(123).get();

// And this will fetch one of its purchased leads
srvu.communities(123).purchasedLeads(456).get();
```

## Parameters

Parameters can be passed as an object to the final method call:

```javascript
srvu.communities(123).purchasedLeads({ sortBy: 'lastName' }).get();
```

All possible parameters are listed in the SeniorVu API docs.

## Writing data

The verb methods that write data are `.put()`, `.post()`, and `.delete()`, as you might expect. Pass the new data to the verb method.

To update a community:

```javascript
srvu.communities(123).put({
  name: 'Some Fancy New Name'
});
```

To create a new lead

```javascript
srvu.leads().post({
  firstName: 'Some',
  lastName: 'Guy',
  dob: '1955-5-5',
});
```

To delete a community room

```javascript
srvu.communities(123).rooms(456).delete();
```

# Development

## Committing changes

Run `npm (run) start` to check that linting with XO and tests with ava pass.

Also, make sure you run `npm run build` and `npm run toc` before committing changes. A [pre-commit hook](https://gist.github.com/c0bra/8f631ba440f021def5bd0d803713ecc7) helps.

## Testing

*NOTE:* the tests run against the transpiled version, so if you use ava manually be sure that your changes are transpiled.

Run `npm (run) test` to run tests with ava.

## Linting

Run `npm run lint` to run linter with XO.

## Releasing

@sindresorhus's `np` package is great for doing releases. Just install it globally and run `np` in your directory. Choose the option you want; voila, you're done.

# TODO

- [ ] Re-authenticate when token expires.
