const fs = require('fs');
const path = require('path');
const readlineSync = require('readline-sync');
const chalk = require('chalk');


function getCliArg(argName) {
  let args = process.argv.slice(2);
  for (let arg of args) {
    if (arg.match(/^--(\w+?)=(.+)$/) && RegExp.$1 === argName) {
      return RegExp.$2;
    }
  }
}

/**
 * saved values for config
 * used to prevent several input from console while option is already entered
 * @type {Object.<string, string>}
 */
const savedValues = {};

/**
 *
 * @type {Object.<string, number>}
 */
const defaultValues = {
  port: '3000'
};


function getOption(name, prompt) {
  // 1. may be cached
  const savedValue = savedValues[name];
  if (savedValue) return savedValue;

  // 2. read from cli args:
  // ex:
  //   npm run pull -- --option=value
  const cliValue = getCliArg(name);
  if (cliValue) return (savedValues[name] = cliValue);

  // 3. read value from ENV
  // (must be uppercase)
  // ex:
  //   BI_SERVER=http://127.0.0.1 npm run pull
  const envValue = process.env['BI_' + name.toUpperCase()];
  if (envValue) return (savedValues[name] = envValue);

  // 4. read from config
  // two config files:
  //   config.json - for server and other options
  //   authConfig  - only for username and password
  const jsonConfigFileName = (name === 'username' || name === 'password') ? 'authConfig.json': 'config.json';
  try {
    const jsonConfig = JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', '..', jsonConfigFileName), 'utf8'));
    const jsonConfigValue = jsonConfig[name];
    if (jsonConfigValue) return (savedValues[name] = jsonConfigValue);
  } catch (err) {
    // file might not exists or invalid...
    // skip
  }

  // 5. default value for option
  const defaultValue = defaultValues[name];
  if (defaultValue) return (savedValues[name] = defaultValue);

  // 6. read from keyboard
  const kbdValue = readlineSync.question(prompt || `Enter ${name}: `, {
    hideEchoBack: name === 'password'
  });
  return (savedValues[name] = kbdValue);
}

function getServer() {
  return getOption('server', 'Enter server URL: ');
}

/**
 * get port for local to open with 'npm start' from config
 * @returns {number}
 */
function getPort() {
  return +getOption('port');
}


/**
 * get server, username and password values from config
 * if none exists, will ask to enter from keyboard
 * and will log values to console
 * @returns {{SERVER: string, PASSWORD: string, USERNAME: string}}
 */
function getSUPConfig() {
  const SERVER = getServer();
  const USERNAME = getOption('username');
  const PASSWORD = getOption('password')
  return {SERVER, USERNAME, PASSWORD};
}

function getSUPConfigAndLog() {
  const {SERVER, USERNAME, PASSWORD} = getSUPConfig();
  console.log();
  console.log('SERVER  :', chalk.yellowBright(SERVER));
  console.log('USERNAME:', chalk.yellowBright(USERNAME));
  console.log('PASSWORD:', chalk.yellowBright(PASSWORD.split('').map(_ => '*').join('')), '\n');
  return {SERVER, USERNAME, PASSWORD};
}


module.exports = {
  getServer,
  getPort,
  getSUPConfig,
  getSUPConfigAndLog,
}