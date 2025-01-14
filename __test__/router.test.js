'use strict';

const server = require('../src/server').app;
const supergoose = require('@code-fellows/supergoose');
const bearer = require('../src/auth/middleware/bearer.js');

const mockRequest = supergoose(server);

let users = {
  admin: { username: 'admin', password: 'password', role: 'admin' },
  editor: { username: 'editor', password: 'password', role: 'editor' },
  user: { username: 'user', password: 'password', role: 'user' },
};

describe('Auth Router', () => {
  Object.keys(users).forEach((userType, index) => {
    describe(`${userType} users`, () => {
      it('can create one', async () => {
        // console.log(users[userType], index)
        console.log(users[userType], index)
        const response = await mockRequest
          .post('/signup')
          .send(users[userType]);
        const userObject = response.body;
        expect(response.status).toBe(201);
        expect(userObject.token).toBeDefined();
        expect(userObject.user._id).toBeDefined();
        expect(userObject.user.username).toEqual(users[userType].username);
      });

      it('can signin with basic', async () => {
        console.log(users[userType], index)

        const response = await mockRequest
          .post('/signin')
          .auth(users[userType].username, users[userType].password);
        console.log(users[userType], index)

        const userObject = response.body;
        expect(response.status).toBe(200);
        expect(userObject.token).toBeDefined();
        expect(userObject.user._id).toBeDefined();
        expect(userObject.user.username).toEqual(users[userType].username);
      });

      it('can signin with bearer', async () => {
        // First, use basic to login to get a token
        const response = await mockRequest
          .post('/signin')
          .auth(users[userType].username, users[userType].password);
        // console.log('----cav--------', response.user);
        const token = response.body.token;
        // First, use basic to login to get a token
        const bearerResponse = await mockRequest
          .get('/secret')
          .set('Authorization', `Bearer ${token}`);

        // Not checking the value of the response, only that we "got in"
        expect(bearerResponse.status).toBe(200);
      });
    });

    describe('bad logins', () => {
      it('basic fails with known user and wrong password ', async () => {
        const response = await mockRequest.post('/signin').auth('admin', 'xyz');
        const userObject = response.body;

        expect(response.status).toBe(403);
        expect(userObject.user).not.toBeDefined();
        expect(userObject.token).not.toBeDefined();
      });

      it('basic fails with unknown user', async () => {
        const response = await mockRequest
          .post('/signin')
          .auth('nobody', 'xyz');
        const userObject = response.body;

        expect(response.status).toBe(403);
        expect(userObject.user).not.toBeDefined();
        expect(userObject.token).not.toBeDefined();
      });

      it('bearer fails with an invalid token', async () => {
        // First, use basic to login to get a token
        const bearerResponse = await mockRequest
          .get('/users')
          .set('Authorization', `Bearer foobar`);

        // Not checking the value of the response, only that we "got in"
        expect(bearerResponse.status).toBe(403);
      });
    });
  });
});
