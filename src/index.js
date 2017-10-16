import axios from 'axios';
import moment from 'moment';

const ENVIRONMENTS = {
  staging: 'https://staging.seniorvu.com',
  prod: 'https://www.seniorvu.com',
};
const DEFAULT_OPTS = {
  // baseUrl: ENVIRONMENTS.prod,
};

const PATHS = [
  'available',
  'claimRequests',
  'communities',
  'address',
  'amenities',
  'appointments',
  'archivedLeads',
  'assets',
  'image',
  'video',
  'awsSettings',
  'cartItems',
  'hours',
  'leads',
  'neighborhoods',
  'payment',
  'purchasedLeads',
  'carers',
  'events',
  'reviews',
  'tours',
  'rooms',
  'upload',
  'predict',
  'proximity',
  'batchCreate',
  'deleteCreated',
  'users',
  'password',
  'forgotPassword',
  'me',
  'reset',
  'statuses',
  'events',
  'priorities',
  'webhook',
  'deviceTokens',
];

// Check if the expiration time is within a day
function expiresSoon(expireAt) {
  return (moment(expireAt) - moment()) < moment.duration({ day: 1 }).asMilliseconds();
}

export default class SeniorVu {
  constructor(opts = {}) {
    this.config(opts);
    this.ax = axios.create();

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
      this.updateToken(this.opts.token);
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
        if (res.data.token) {
          this.userId = res.data.userId;
          this.updateToken(this.data.token);

          return { token: this.token, userId: this.userId };
        }

        throw new Error('No token received from SeniorVu API');
      })
      .catch(err => {
        let ex = null;
        if (err.response) {
          if (err.response.data && err.response.data.errors && err.response.data.errors.length > 0) {
            const msg = err.response.data.errors[0].message || err.response.data.errors[0];
            ex = new Error(msg);
          }
        } else if (err.request) {
          ex = new Error('No response from SeniorVu API');
        } else {
          ex = new Error('Error settings up request');
        }

        ex.axios = err;

        throw ex;
      });
    }

    throw new Error('No authentication options provided');
  }

  register(opts) {
    return axios.post(this.opts.baseUrl + '/auth/registration', opts)
    .then(res => {
      if (res && res.data) return res.data;
      return res;
    })
    .catch(err => {
      this._handleError(err);
    });
  }

  oneTimeTokenAuth(token) {
    return axios.post(this.opts.baseUrl + '/auth/login', {
      token,
    })
    .then(res => {
      if (res.data.token) {
        this.updateToken(this.data.token);
      }
      if (res.data.userToken) {
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
    return axios.post(this.opts.baseUrl + '/auth/refresh', { token: this.token })
      .then(({ data }) => {
        this.updateToken(data.token);
        this.expireAt = data.expireAt;
      });
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

  _chain(...segments) {
    this.chain = this.chain || { segments: [] };

    for (const s of segments) {
      if (s === null || s === undefined) continue;

      if (typeof s === 'object') {
        this.chain.params = s;
      } else {
        this.chain.segments.push(s);
      }
    }

    return this;
  }

  _handleError(err) {
    let ex = null;
    if (err.response) {
      if (err.response.data && err.response.data.errors && err.response.data.errors.length > 0) {
        const msg = err.response.data.errors[0].message || err.response.data.errors[0];
        ex = new Error(msg);
      }
    } else if (err.request) {
      ex = new Error('No response from SeniorVu API');
    } else {
      ex = new Error('Error setting up request');
    }

    ex.axios = err;

    throw ex;
  }
}
