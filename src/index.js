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
      this.prototype[verb] = () => {
        // Clear chain
        this.chain = null;

        const opts = Object.assign({}, this.opts);
        opts.method = verb;
        opts.url = [this.opts.baseUrl].concat(this.chain.segments).join('/');
        return this.ax(opts);
      };

      return null;
    });
  }

  config(opts = {}) {
    this.opts = Object.assign({}, DEFAULT_OPTS, opts);

    this.token = this.opts.token || '';
  }

  authenticate(opts = {}) {
    opts = Object.assign({}, this.opts, opts);

    // Authenticate via one-time if we have one
    if (opts.token && this._isOneTimeToken(opts.token)) {
      return this.oneTimeTokenAuth(opts.token);
    }

    // Auth via username and password
    if (opts.email && opts.password) {
      return axios.post(opts.baseUrl + 'auth/login', {
        email: opts.email,
        password: opts.password,
      })
      .then(res => {
        if (res.data.token) {
          this.token = res.data.token;
          this.ax.defaults.headers.Authorization = `Bearer ${this.token}`;
        } else {
          throw new Error('No token received from SeniorVu API');
        }
      })
      .catch(err => {
        throw new Error(err);
      });
    }
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

  // request(req = {}) {
  //   req.headers = req.headers || {};
  //
  //   return this.ax({
  //     method: req.method || 'get',
  //     url: this.opts.baseUrl + '/' + req.path,
  //     data: req.data,
  //     params: req.params,
  //   });
  // }

  _buildMethods() {
    for (const path of PATHS) {
      this[path] = arg => {
        this._chain(path, arg);
      };
    }
  }

  _isOneTimeToken(token) {
    return /srvu-.{12,}/.test(token);
  }

  _chain(...segments) {
    (this.chain || this.chain = {}).segments.push(segments.filter(x => x !== null && x !== undefined));
  }
}
