const path = require('path')
const log4js = require('koa-log4')
log4js.configure({
  appenders: {
    // 访问级别
    access: {
      type: 'console',
    },
    out: {
      type: 'console',
    },
  },
  categories: {
    default: { appenders: ['out'], level: 'info' }
  },
})

module.exports = {
  accessLogger: () => { return log4js.koaLogger(log4js.getLogger('default')) },
  logger: log4js.getLogger('default'),
}
