const {promisify} = require('util')
const find = require('find')
const {dirname, basename, extname, join} = require('path')
const rimraf = promisify(require('rimraf'))
const {writeFile, readFile, exists} = require('mz/fs')

async function executePatches(workingFolder) {
  const patchesToExecute = await new Promise(res => {
    find.file(/.patch-execute$/, workingFolder, files => res(files))
  })
  for (let i = 0; i < patchesToExecute.length; i++) {
    const patch = patchesToExecute[i]
    const postExecute = join(dirname(patch), basename(patch, extname(patch)))
    let output
    try {
      output = require(patch)
    } catch(error) {
      error.message = "The following error occured while trying to require a .patch-execute file:\n" + error.message
      throw error
    }
    let input = null
    if (await exists(postExecute)) {
      input = (await readFile(postExecute)).toString()
    }
    if (typeof output == 'function') output = output(input)
    if (output instanceof Promise) output = await output
    if (typeof output != 'string' && output !== null) throw new Error("The file did not output null or a string")
    if (output === null) output = ""
    await rimraf(postExecute)
    await writeFile(postExecute, output)
    await rimraf(patch)
  }
}

module.exports = executePatches
