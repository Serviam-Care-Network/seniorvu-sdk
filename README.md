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

# Install

    npm install --save seniorvu-sdk

In your code:

    import srvu from 'seniorvu-sdk';

Or:

    var srvu = require('seniorvu-sdk');

# Usage Standards

## Authentication

## Querying / Filtering

## Sorting

## Paging

You must supply

srvu.config({
  apiKey: '<INSERT YOUR API KEY HERE>'
});

# API Endpoints

## Constants

### Statuses

  srvu.statuses()
  .then(statuses => {
    // Lead statuses
  });

## Leads

### Sorting
