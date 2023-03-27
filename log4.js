const path = require('path')
const log4js = require('koa-log4')
log4js.configure({
  appenders: {
    // 访问级别
    access: {
      type: 'dateFile',
      // 生成文件的规则
      pattern: '-yyyy-MM-dd.log',
      // 文件名始终以日期区分
      alwaysIncludePattern: true,
      encoding: 'utf-8',
      // 生成文件路径和文件名
      filename: path.join(__dirname, 'logs', 'access'),
    },
    // 应用级别
    application: {
      type: 'dateFile',
      pattern: '-yyyy-MM-dd.log',
      // 文件名始终以日期区分
      alwaysIncludePattern: true,
      encoding: 'utf-8',
      filename: path.join(__dirname, 'logs', 'application'),
    },
    out: {
      type: 'console',
    },
  },
  categories: {
    default: { appenders: ['out'], level: 'info' },
    access: { appenders: ['access'], level: 'info' },
    application: { appenders: ['application'], level: 'info' },
  },
})

module.exports = {
  accessLogger: () => { return log4js.koaLogger(log4js.getLogger('access')) },
  logger: log4js.getLogger('application'),
}
