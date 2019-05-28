const path = require('path')
const { cloneRepoAndClean, render } = require('../')
const fs = require('fs')

const testingRepo = path.join(__dirname, '../../pleasure-boilerplate-default')
const testingSandboxPath = path.join(__dirname, `tmp`)

cloneRepoAndClean(testingRepo, testingSandboxPath)
  .then(async () => {
    await render(testingSandboxPath)
  })
  .catch(err => {
    console.error(err.message)
  })
