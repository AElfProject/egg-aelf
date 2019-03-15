'use strict';

const mock = require('egg-mock');

describe('test/aelf.test.js', () => {
  let app;
  before(() => {
    app = mock.app({
      baseDir: 'apps/aelf-test',
    });
    return app.ready();
  });

  after(() => app.close());
  afterEach(mock.restore);

  it('should GET /', () => {
    return app.httpRequest()
      .get('/')
      .expect('hi, aelf')
      .expect(200);
  });
});
