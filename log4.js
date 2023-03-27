const path = require('path')
const log4js = require('koa-log4')

const accessAppender = () => {
  const isSupported = process.env.LOG === 'file'
  if (isSupported) {
    return {
      type: "dateFile",//按日期分割
      filename: "logs/access.log",//存储的日志文件位置
      pattern: "yyyy-MM-dd.log",//日志文件的命名
      backups: 300,//最多保存的文件数量
      layout: {
        type: "pattern",
        pattern: "%d{yyyy-MM-dd hh:mm:ss} [%p] %m"//输出的内容样式
      }
    }
  } else {
    return {
      type: 'console'
    }
  }
}

log4js.configure({
  appenders: {
    // 访问级别
    access: accessAppender(),
    out: {
      type: 'console',
    },
  },
  categories: {
    access: { appenders: ['access'], level: 'info' },
    default: { appenders: ['out'], level: 'info' }
  },
})

module.exports = {
  createLogger: () => log4js.koaLogger(log4js.getLogger('access')),
  logger: log4js.getLogger('access')
}
