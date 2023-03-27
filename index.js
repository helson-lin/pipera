const Koa = require('koa');
const request = require('postman-request');
const bodyParser = require('koa-bodyparser');
const typeis = require('type-is')
const app = new Koa();
const { logger } = require('./log4')
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

const isLocal = (host) => host.indexOf('localhost') !== -1 || host.indexOf('127.0.0.1') !== -1

const modifyHeader = (url, headers) => {
  const _headers = JSON.parse(JSON.stringify(headers))
  const _url = new URL(url)
  if (_headers['accept-encoding'].indexOf("gzip") !== -1) {
    delete _headers['accept-encoding'];
  }
  if(_headers['user-agent']) {
    _headers['user-agent'] = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.75 Safari/537.36"
  }
  if(_headers['connection'] === 'close') {
    delete _headers['connection'];
  }
  _headers['host'] = _url.host
  return _headers;
}
function proxyRequest(url, method, headers, data) {
  const type = typeis(this.request, ['urlencoded', 'json', 'multipart'])
  let _headers = modifyHeader(url, headers);
  const option = {
    url,
    method,
    headers: { ..._headers },
  }
  if (data && method.toLocaleUpperCase() === 'POST' && type === 'json') {
    option.body = JSON.stringify(data)
  }
  logger.info("requesting:" + JSON.stringify(option))
  if (data && type === 'urlencoded') {
    data.formData = data
  }
  return new Promise((resolve, reject) => {
    request(option, (error, response) => {
      if (error) {
        reject(error)
      } else {
        // let _data = iconv.decode(response.body, 'gb2312');
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
// app.use(accessLogger())
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
