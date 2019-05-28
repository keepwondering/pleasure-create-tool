import { outputFile, pathExists } from 'fs-extra'
import path from 'path'
import md5 from 'md5'
import { presetDir } from './consts.js'

export async function loadPreset (srcRepo) {
  const presetFile = path.join(presetDir, md5(srcRepo) + '.json')
  return await pathExists(presetFile) ? require(presetFile) : {}
}
