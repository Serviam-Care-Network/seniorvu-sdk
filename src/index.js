import axios from 'axios';

const ENVIRONMENTS = {
  staging: 'https://api.staging.seniorvu.com',
  prod: 'https://api.seniorvu.com',
};
const DEFAULT_OPTS = {
  // baseUrl: ENVIRONMENTS.prod,
};

const PATHS = [
  'address',
  'amenities',
  'appointments',
  'archivedLeads',
  'assets',
  'available',
  'awsSettings',
  'batchCreate',
  'carers',
  'cartItems',
  'claimRequests',
  'communities',
  'deleteCreated',
  'deviceTokens',
  'events',
  'events',
  'forgotPassword',
  'hours',
  'image',
  'leads',
  'me',
  'neighborhoods',
  'password',
  'payment',
  'predict',
  'priorities',
  'proximity',
  'purchasedLeads',
  'reset',
  'reviews',
  'rooms',
  'statuses',
  'tours',
  'upload',
  'users',
  'video',
  'webhook',
];

// Check if the expiration time is within a day
export function expiresSoon(expireAt) {
  if (typeof expireAt === 'undefined') return true;
  return (new Date(expireAt) - new Date()) < 1000 * 60 * 60 * 24;
}

export default class SeniorVu {
  constructor(opts = {}, ax) {
    if (ax) this.ax = ax;
    else this.ax = axios.create();

    this.config(opts);

    // Create functions for each XHR verb
    ['get', 'post', 'put', 'delete'].forEach(verb => {
      this[verb] = body => {
        opts = {};
        opts.method = verb;

        const segments = this.chain && this.chain.segments ? this.chain.segments : [];
        opts.url = [this.opts.baseUrl].concat('api', segments).join('/');
        opts.params = this.chain.params;
        opts.data = body;

        // Clear chain for reuse
        this.chain = null;

        // Should we catch a possible expired token here or let consumer handle it??
        const refresh = expiresSoon(this.expireAt) ? this.refreshToken() : Promise.resolve();

        return refresh
          .then(() => this.ax(opts))
          .then(res => ((res && res.data) ? res.data : res));
      };
    });

    this._buildMethods();
  }

  config(opts = {}) {
    this.opts = this.opts || {};

    if (!opts.baseUrl && opts.env && opts.env.indexOf('staging') === 0) {
      this.opts.baseUrl = ENVIRONMENTS.staging;
    } else if (!opts.baseUrl && opts.env && opts.env.indexOf('prod') === 0) {
      this.opts.baseUrl = ENVIRONMENTS.prod;
    }

    // Delete any null props from the passed-in options
    for (const prop of Object.keys(opts)) {
      if (opts[prop] === null) {
        delete opts[prop];
      }
    }

    Object.assign(this.opts, DEFAULT_OPTS, opts);

    if (!this.opts.baseUrl) {
      this.opts.baseUrl = ENVIRONMENTS.prod;
    }

    // Handle incoming token
    if (this.opts.token) {
      this._updateToken(this.opts.token);
    }

    if (this.opts.expireAt) {
      this.expireAt = this.opts.expireAt;
    }

    return this;
  }

  authenticate(opts = {}) {
    opts = Object.assign({}, this.opts, opts);

    // Authenticate via one-time if we have one
    if (opts.oneTimeToken && this._isOneTimeToken(opts.oneTimeToken)) {
      return this.oneTimeTokenAuth(opts.oneTimeToken);
    }

    // Auth via username and password or apiKey
    if ((opts.email && opts.password) || opts.apiKey) {
      return axios.post(opts.baseUrl + '/auth/login', {
        email: opts.email,
        password: opts.password,
        apiKey: opts.apiKey,
      })
      .then(res => {
        if (res && res.data && res.data.token) {
          this.userId = res.data.userId;
          this._updateToken(res.data.token);

          return { token: this.token, userId: this.userId };
        }
        throw new Error('No token received from SeniorVu API');
      })
      .catch(err => this._handleError(err));
    }

    throw new Error('No authentication options provided');
  }

  register(opts) {
    return this.ax.post(this.opts.baseUrl + '/auth/registration', opts)
    .then(res => {
      if (res && res.data) return res.data;
      return res;
    })
    .catch(err => this._handleError(err));
  }

  oneTimeTokenAuth(token) {
    return this.ax(this.opts.baseUrl + '/auth/login', {
      token,
    })
    .then(res => {
      if (res && res.data.token) {
        this._updateToken(res.data.token);
      }
      if (res && res.data.userToken) {
        return {
          token: this.token,
          userToken: res.data.userToken,
        };
      }
    })
    .catch(err => {
      throw new Error(err); // maybe leave this off since it's not really adding anything to the error?
    });
  }

  refreshToken() {
    // If a token is needed then the following request will receive a 401
    if (!this.token) return Promise.resolve();

    return this.ax({
      url: `${this.opts.baseUrl}/auth/refresh`,
      method: 'post',
      headers: { Authorization: `Bearer ${this.token}` },
    })
    .then(res => {
      if (res && res.data && res.data.token) {
        this._updateToken(res.data.token);
        this.expireAt = res.data.expireAt;
      } else {
        const e = new Error('Problem refreshing jwt');
        e.response = res;
        throw e;
      }
    })
    .catch(err => this._handleError(err));
  }

  _updateToken(token) {
    this.token = token;
    this.ax.defaults.headers.Authorization = `Bearer ${token}`;
  }

  _buildMethods() {
    for (const path of PATHS) {
      this[path] = arg => {
        return this._chain(path, arg);
      };
    }
  }

  // TODO: fix when API method exists
  _isOneTimeToken(token) {
    return /srvu-.{12,}/.test(token);
  }

  _startChain() {
    return new SeniorVuChain(this.opts, this.ax); /* eslint no-use-before-define: "off" */
  }

  _chain(...segments) {
    let instance = this;
    if (!(instance instanceof SeniorVuChain)) instance = this._startChain();

    instance.chain = instance.chain || { segments: [] };

    for (const s of segments) {
      if (s === null || s === undefined) continue;

      if (typeof s === 'object') {
        instance.chain.params = s;
      } else {
        instance.chain.segments.push(s);
      }
    }

    return instance;
  }

  _handleError(err) {
    let ex = null;
    if (err.response) {
      if (err.response.data && err.response.data.errors && err.response.data.errors.length > 0) {
        const msg = err.response.data.errors[0].message || err.response.data.errors[0];
        ex = new Error(msg);
      } else if (err.response.data) {
        ex = new Error(err.response.data);
      } else {
        ex = new Error('Unknown issue');
        ex.err = err;
      }
    } else if (err.request) {
      ex = new Error('No response from SeniorVu API');
    } else {
      ex = err;
      // ex = new Error('Error setting up request');
    }

    ex.axios = err;

    throw ex;
  }
}

class SeniorVuChain extends SeniorVu {
  authenticate() {
    throw new Error('Cannot re-authenticate while chaining a request');
  }
}
