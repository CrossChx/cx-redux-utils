import { expect } from 'chai';
import { testIfExists, shouldBeAnObject } from 'how-the-test-was-won';
import { namedApiFetchWrapper } from '../src/index';

export function namedApiFetchTest(apiName) {
  const fetch = namedApiFetchWrapper(apiName);

  describe(`#${apiName}`, () => {
    const type = 'EFFECT_FETCH';
    const contentType = 'application/json';
    const accepts = `application/x.${apiName}-api.1+json`;
    const urlPrefix = `/api/${apiName}.api`;

    describe('when invoked with empty args', () => {
      const method = 'GET';
      const result = fetch('', {});
      const expected = {
        type,
        payload: {
          url: urlPrefix,
          params: {
            method,
            headers: { Accept: accepts, 'Content-Type': contentType },
          },
        },
      };

      testIfExists(result);
      shouldBeAnObject(result);

      it(`'type' should equal ${type}`, () => {
        expect(result.type).to.equal(type);
      });

      it(`'url' should equal ${urlPrefix}`, () => {
        expect(result.payload.url).to.equal(urlPrefix);
      });

      it(`'method' should equal ${method}`, () => {
        expect(result.payload.params.method).to.deep.equal(method);
      });

      it(`'Accept' header should equal ${accepts}`, () => {
        expect(result.payload.params.headers.Accept).to.equal(accepts);
      });

      it(`'Content-Type' header should equal ${contentType}`, () => {
        expect(result.payload.params.headers['Content-Type']).to.equal(contentType);
      });

      it('should return the overall expected result', () => {
        expect(result).to.deep.equal(expected);
      });
    });

    describe('when invoked with valid args', () => {
      const method = 'POST';
      const endpoint = '/testEndpoint/1/test';
      const url = `${urlPrefix}${endpoint}`;
      const body = {
        testKey1: 'testVal1',
        testKey2: 'testVal2',
        testKey3: 'testVal3',
      };

      const result = fetch(endpoint, { method, body });
      const expected = {
        type,
        payload: {
          url,
          params: {
            body,
            method,
            headers: { Accept: accepts, 'Content-Type': contentType },
          },
        },
      };

      testIfExists(result);
      shouldBeAnObject(result);

      it(`'type' should equal ${type}`, () => {
        expect(result.type).to.equal(type);
      });

      it(`'url' should equal ${url}`, () => {
        expect(result.payload.url).to.equal(url);
      });

      it(`'method' should equal ${method}`, () => {
        expect(result.payload.params.method).to.deep.equal(method);
      });

      it(`'Accept' header should equal ${accepts}`, () => {
        expect(result.payload.params.headers.Accept).to.equal(accepts);
      });

      it(`'Content-Type' header should equal ${contentType}`, () => {
        expect(result.payload.params.headers['Content-Type']).to.equal(contentType);
      });

      it('should return the overall expected result', () => {
        expect(result).to.deep.equal(expected);
      });
    });

    describe('when invoked with only a url', () => {
      const method = 'GET';
      const endpoint = '/testEndpoint/1/test';
      const url = `${urlPrefix}${endpoint}`;

      const result = fetch(endpoint);
      const expected = {
        type,
        payload: {
          url,
          params: {
            method,
            headers: { Accept: accepts, 'Content-Type': contentType },
          },
        },
      };

      testIfExists(result);
      shouldBeAnObject(result);

      it(`'type' should equal ${type}`, () => {
        expect(result.type).to.equal(type);
      });

      it(`'url' should equal ${url}`, () => {
        expect(result.payload.url).to.equal(url);
      });

      it(`'method' should equal ${method}`, () => {
        expect(result.payload.params.method).to.deep.equal(method);
      });

      it(`'Accept' header should equal ${accepts}`, () => {
        expect(result.payload.params.headers.Accept).to.equal(accepts);
      });

      it(`'Content-Type' header should equal ${contentType}`, () => {
        expect(result.payload.params.headers['Content-Type']).to.equal(contentType);
      });

      it('should return the overall expected result', () => {
        expect(result).to.deep.equal(expected);
      });
    });
  });
}
