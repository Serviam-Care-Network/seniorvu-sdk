import axios from 'axios';

const DEFAULT_OPTS = {
  baseUrl: 'https://staging.seniorvu.com',
};

const PATHS = [
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
  'webhook',
];

export default class SeniorVu {
  constructor(opts = {}) {
    this.token = '';
    this.opts = Object.assign({}, DEFAULT_OPTS, opts);
    this.ax = axios.create();

    // Create functions for each XHR verb
    ['get', 'post', 'put', 'delete'].map(verb => {
      this[verb] = body => {
        // Clear chain
        // const opts = Object.assign({}, this.opts);
        opts = {};
        opts.method = verb;

        const segments = this.chain && this.chain.segments ? this.chain.segments : [];
        opts.url = [this.opts.baseUrl].concat('api', segments).join('/');
        opts.params = this.chain.params;
        opts.data = body;

        this.chain = null;

        return this.ax(opts)
        .then(res => {
          return res.data;
        })
        .catch(err => {
          throw err;
        });
      };

      return null;
    });

    this._buildMethods();
  }

  config(opts = {}) {
    this.opts = Object.assign({}, DEFAULT_OPTS, opts);

    this.token = this.opts.token || '';

    return this;
  }

  authenticate(opts = {}) {
    opts = Object.assign({}, this.opts, opts);

    // Authenticate via one-time if we have one
    if (opts.token && this._isOneTimeToken(opts.token)) {
      return this.oneTimeTokenAuth(opts.token);
    }

    // Auth via username and password
    if (opts.email && opts.password) {
      return axios.post(opts.baseUrl + '/auth/login', {
        email: opts.email,
        password: opts.password,
      })
      .then(res => {
        if (res.data.token) {
          this.token = res.data.token;
          this.ax.defaults.headers.Authorization = `Bearer ${this.token}`;

          return this.token;
        }

        throw new Error('No token received from SeniorVu API');
      })
      .catch(err => {
        throw new Error(err);
      });
    }

    throw new Error('No authentication options provided');
  }

  oneTimeTokenAuth(token) {
    return axios.post(this.opts.baseUrl + '/auth/login', {
      token,
    })
    .then(res => {
      if (res.data.token) {
        this.token = res.data.token;
        this.ax.defaults.headers.Authorization = `Bearer ${this.token}`;
      }
    })
    .catch(err => {
      throw new Error(err);
    });
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
    // console.log('chain segments', segments);
    this.chain = this.chain || { segments: [] };

    for (const s of segments) {
      if (s === null || s === undefined) continue;

      if (typeof s === 'object') {
        this.chain.params = s;
      } else {
        this.chain.segments.push(s);
      }
    }
    // this.chain.segments = this.chain.segments.concat(segments.filter(x => x !== null && x !== undefined));
    // console.log('this.chain', this.chain);

    return this;
  }
}
