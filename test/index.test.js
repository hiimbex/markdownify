const nock = require('nock')
const markdownify = require('..')
const { Probot } = require('probot')
const payload = require('./fixtures/pull_request.opened.json')
const prFiles = require('./fixtures/prFiles.json')
const payloadFail = require('./fixtures/payloadFail.json')
const prFilesFail = require('./fixtures/prFilesFail.json')

nock.disableNetConnect()

describe('markdownify', () => {
  let probot

  beforeEach(() => {
    probot = new Probot({})
    const app = probot.load(markdownify)

    // just return a test token
    app.app = () => 'test'
  })

  test('edits the pull request when markdown files are editted', async () => {
    nock('https://api.github.com')
      .post('/app/installations/321696/access_tokens')
      .reply(200, {token: 'test'})

    nock('https://api.github.com')
      .get('/repos/hiimbex/testing-things/pulls/112/files')
      .reply(200, prFiles.data)

    nock('https://api.github.com')
      .patch('/repos/hiimbex/testing-things/pulls/112', (body) => {
        expect(body).toMatchObject({body: '\n\n-----\n[View rendered README.md](https://github.com/hiimbex/testing-things/blob/hiimbex-patch-41/README.md)'})
        return true
      })
      .reply(200)

    await probot.receive({name: 'pull_request', payload})
  })

  test('does not edit the pull request when no markdown files are editted', async () => {
    nock('https://api.github.com')
      .post('/app/installations/321696/access_tokens')
      .reply(200, {token: 'test'})

    nock('https://api.github.com')
      .get('/repos/hiimbex/testing-things/pulls/114/files')
      .reply(200, prFilesFail.data)

    await probot.receive({name: 'pull_request', payload: payloadFail})
  })
})
