const Koa = require('koa');
const request = require('postman-request');
const bodyParser = require('koa-bodyparser');
const typeis = require('type-is')

const { logger, accessLogger } = require('./log4');
const app = new Koa();

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

function proxyRequest (url, method, headers, data) {
  const type = typeis(this.request, ['urlencoded', 'json', 'multipart'])
  const option = {
    url,
    method,
    headers
  }
  if (data && method.toLocaleUpperCase() === 'POST' && type === 'json') {
    option.data = data
  }
  if (data && type === 'urlencoded' && type === '') {
    data.formData = data
  }
  return new Promise((resolve, reject) => {
    request(option, (error, response) => {
      if (error) {
        logger.error(error)
        reject(error)
      } else {
        let _data = null;
        try {
          _data = JSON.parse(response.body);
        } catch (e) {
          _data = response?.body || null;
        }
        resolve(_data)
      }
    })
  })
}

const modifyUrl = (url) => {
  const isCorret = url.indexOf('//') !== -1;
  if (isCorret) return url;
  return url.split("/").map((i, index) => {
    if (index === 0) {
      return i + '/'
    }
    return i
  }).join("/")
}
app.use(bodyParser())
app.use(accessLogger())
// 加载路由中间件
app.use(async (ctx) => {
  let url = ctx.originalUrl.slice(1)
  const method = ctx.method
  const bodyData = ctx.request.body
  const headers = ctx.request.headers
  const isUrl = url.startsWith('http:') || url.startsWith('https')
  if (!url || !isUrl) {
    ctx.body = "please provide a correct url to request"
  } else {
    url = modifyUrl(url)
    logger.info("\n ------------------------------------------ \n Request url: " + url + "  \n Request method: " + method + "  \n Request body: " + JSON.stringify(bodyData) + "\n ------------------------------------------ \n ")
    ctx.body = await proxyRequest.bind(ctx)(url, method, headers, bodyData)
  }
})

app.listen(3008, () => {
  console.log('3008项目启动')
});
