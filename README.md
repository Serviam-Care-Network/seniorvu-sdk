[![Build Status](https://travis-ci.org/softvu/seniorvu-sdk.svg?branch=master)](https://travis-ci.org/softvu/seniorvu-sdk) [![Coverage Status](https://coveralls.io/repos/github/softvu/seniorvu-sdk/badge.svg?branch=master)](https://coveralls.io/github/softvu/seniorvu-sdk?branch=master) [![Dependency Status](https://dependencyci.com/github/softvu/seniorvu-sdk/badge)](https://dependencyci.com/github/softvu/seniorvu-sdk)

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [seniorvu-sdk](#seniorvu-sdk)
- [Install](#install)
- [Usage Standards](#usage-standards)
  - [Authentication](#authentication)
  - [Querying / Filtering](#querying--filtering)
  - [Sorting](#sorting)
  - [Paging](#paging)
- [API Endpoints](#api-endpoints)
  - [Constants](#constants)
    - [Statuses](#statuses)
  - [Leads](#leads)
    - [Sorting](#sorting-1)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

# seniorvu-sdk

JavaScript wrapper for the SeniorVu web API

    srvu.communities(123)
      .purchasedLeads({ q: 'brown, james', limit: 5 })
      .get();

# Install

    npm install --save seniorvu-sdk

In your code:

    import srvu from 'seniorvu-sdk';

Or:

    var srvu = require('seniorvu-sdk');

# Usage Standards

## Authentication

You must supply

srvu.config({
  apiKey: '<INSERT YOUR API KEY HERE>'
});
