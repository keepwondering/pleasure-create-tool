/*!
 * pleasure-create-tool v1.0.0-beta
 * (c) 2018-2019 Martin Rafael Gonzalez <tin@devtin.io>
 * MIT
 */
import { remove, pathExists, outputFile } from 'fs-extra';
import path from 'path';
import { deepScanDir } from 'pleasure-utils';
import util from 'util';
import { prompt } from 'inquirer';
import fs from 'fs';
import Promise from 'bluebird';
import handlerbars from 'handlebars';
import md5 from 'md5';

async function cloneRepoAndClean (src, dst) {
  const { Clone } = require('nodegit');
  await Clone(src, dst);
  await remove(path.join(dst, '.git'));
  return { src, dst }
}

function getConfigFile (dir) {
  return path.join(dir, `pleasure-create.config.js`)
}

/**
 * @typedef {Object} ParserPlugin
 *
 * @property {Function} transform - Called with the `data` that's gonna be used to parse all of the `.hbs` files.
 * @property {Object} prompts - [inquirer.prompt](https://github.com/SBoudrias/Inquirer.js/) options
 * @property {Object} config - Additional configuration options
 * @property {Array|Boolean} [savePreset=true] - To save last default options introduced by the user. `true` for all,
 * `false` for none or and `String[]` of the values to save.
 */

const ParserPluginConfig = {
  savePreset: true
};

/**
 *
 * @param {String} dir - Directory from where to locate the file
 * @param {Boolean} remove - Optionally removes repo's config file
 * @return {Promise<any>}
 */
async function getConfig (dir, remove$1 = false) {
  const pleasureCreateConfigFile = getConfigFile(dir);
  if (await pathExists(pleasureCreateConfigFile)) {
    const config = require(pleasureCreateConfigFile);
    config.config = Object.assign(ParserPluginConfig, config.config);
    if (remove$1) {
      await remove(pleasureCreateConfigFile);
    }
    return config
  }
}

/**
 * Removes the configuration file give a directory
 * @param {String} dir - Directory from where to locate the file
 * @return {Promise<any>}
 */
async function removeConfig (dir) {
  return remove(getConfigFile(dir))
}

const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

/**
 * @typedef {Object} ParserPlugin
 *
 * @property {Function} transform - Called with the `data` that's gonna be used to parse all of the `.hbs` files.
 * @property {Object} prompts - [inquirer.prompt](https://github.com/SBoudrias/Inquirer.js/) options
 * @property {Object} config - Additional configuration options
 * @property {Array|Boolean} [savePreset=true] - To save last default options introduced by the user. `true` for all,
 * `false` for none or and `String[]` of the values to save.
 */

const ParserPluginConfig$1 = {
  savePreset: true
};

/**
 * Loads (if any) the `ParserPlugin` file called `pleasure-create.config.js` located at the main `dir`, then removes it.
 * Prompts, using [inquirer](https://github.com/SBoudrias/Inquirer.js/) any requests found at the `ParserPlugin.prompts`.
 * Renders `.hbs` files found in give `dir` with collected data retrieved using the configuration of `ParserPlugin.prompts`
 * Renames all `.hbs` files removing the suffix `.hbs`.
 * @param {String} dir - Directory to render
 * @param {Object} [defaultValues] - Optional initial data object to parse the handlebars templates
 * @return {Promise<void>}
 */
async function render (dir, defaultValues = {}) {
  let data = {};
  let transform;
  let prompts;
  let config = Object.assign({}, ParserPluginConfig$1);

  const PleasureParserPlugin = await getConfig(dir);

  if (PleasureParserPlugin) {
    const { config: addConfig } = PleasureParserPlugin;
    ({ transform, prompts } = PleasureParserPlugin);

    Object.assign(config, addConfig);
  }

  const files = await deepScanDir(dir, { only: [/\.hbs$/] });

  if (config.savePreset) {
    prompts = prompts.map((q) => {
      if (!defaultValues.hasOwnProperty(q.name)) {
        return q
      }
      q.default = defaultValues[q.name];
      return q
    });
  }

  if (prompts) {
    data = await prompt(prompts);
  }

  if (transform) {
    data = transform(data);
  }

  await Promise.each(files, async (src) => {
    const dst = src.replace(/\.hbs$/, '');
    const template = handlerbars.compile((await readFile(src)).toString());
    const parsed = template(data);
    await writeFile(dst, parsed);

    if (dst !== src) {
      await remove(src);
    }
  });

  return data
}

const presetDir = path.resolve(__dirname, '.presets');

async function loadPreset (srcRepo) {
  const presetFile = path.join(presetDir, md5(srcRepo) + '.json');
  return await pathExists(presetFile) ? require(presetFile) : {}
}

async function savePreset (srcRepo, data) {
  const presetFile = path.join(presetDir, md5(srcRepo) + '.json');
  console.log(`loading`, presetFile);
  return outputFile(presetFile, JSON.stringify(data))
}

/**
 * Clones given `repository` into the given `destination`. Parses all found handlebars templates (`.hbs`) in the repo
 * and optionally loads a file
 * @param {String} srcRepo - The git repository (local path or URL)
 * @param {String} destination - Local destination of the repo
 * @return {Promise}
 */
async function create (srcRepo, destination) {
  await cloneRepoAndClean(srcRepo, destination);
  const repo = await getConfig(destination);

  console.log({ repo });

  const enteredData = await render(destination, await loadPreset(srcRepo));

  if (repo.config.savePreset) {
    await savePreset(srcRepo, enteredData);
  }

  await removeConfig(srcRepo);
}

var index = {
  cloneRepoAndClean,
  create,
  render
};

export default index;
