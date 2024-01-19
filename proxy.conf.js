/**
 * Used in local environment:
 *   Request proxy to rewrite URLs and prevent CORS errors
 */
const logFn = function (req, res) {
  //console.log(new Date().toISOString() + `: bypassing ${req.method} ${req.url} `)
}
const bypassFn = function (req, res) {
  logFn(req, res)
  if (req.method.toUpperCase() === 'OPTIONS') {
    res.setHeader('Allow', 'GET, POST, HEAD, PUT, DELETE, OPTIONS')
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', '*')
    res.setHeader('Access-Control-Allow-Headers', '*')
    return res.send('')
  }
}

const PROXY_CONFIG = {
  '/help-bff': {
    target: 'http://onecx-help-bff',
    secure: false,
    pathRewrite: {
      '^.*/help-bff': ''
    },
    changeOrigin: true,
    logLevel: 'debug',
    bypass: bypassFn
  }
}

module.exports = PROXY_CONFIG
