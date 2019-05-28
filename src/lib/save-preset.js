import { outputFile } from 'fs-extra'
import path from 'path'
import md5 from 'md5'
import { presetDir } from './consts.js'

export async function savePreset (srcRepo, data) {
  const presetFile = path.join(presetDir, md5(srcRepo) + '.json')
  console.log(`loading`, presetFile)
  return outputFile(presetFile, JSON.stringify(data))
}
