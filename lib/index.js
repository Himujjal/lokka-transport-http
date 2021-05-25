import LokkaTransport from 'lokka/transport';

// the default error handler
function handleErrors(errors, data) {
  const message = errors[0].message;
  const error = new Error(`GraphQL Error: ${message}`);
  error.rawError = errors;
  error.rawData = data;
  throw error;
}

export class Transport extends LokkaTransport {
  constructor(endpoint, options = {}) {
    if (!endpoint) {
      throw new Error('endpoint is required!');
    }

    super();
    this._httpOptions = {
      auth: options.auth,
      headers: options.headers || {},
      credentials: options.credentials,
    };
    this.endpoint = endpoint;
    this.handleErrors = options.handleErrors || handleErrors;
  }

  _buildOptions(payload) {
    const options = {
      method: 'post',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      // To pass cookies to the server. (supports CORS as well)
      credentials: 'include',
    };

    // use delete property for backward compatibility
    if (this._httpOptions.credentials === false) {
      delete options.credentials;
    }

    Object.assign(options.headers, this._httpOptions.headers);
    return options;
  }

  async send(query, variables, operationName) {
    const payload = { query, variables, operationName };
    const options = this._buildOptions(payload);

    const response = await window.fetch(this.endpoint, options);
    // 200 is for success
    // 400 is for bad request
    if (response.status !== 200 && response.status !== 400) {
      throw new Error(`Invalid status code: ${response.status}`);
    }
    const { data, errors } = await response.json();
    if (errors) {
      this.handleErrors(errors, data);
      return null;
    }
    return data;
  }
}

export default Transport;
