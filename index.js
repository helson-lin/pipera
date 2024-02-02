const Koa = require('koa');
const request = require('postman-request');
const bodyParser = require('koa-bodyparser');
const typeis = require('type-is')
const app = new Koa();
const { logger, createLogger } = require('./log4')
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

const isLocal = (host) => host.indexOf('localhost') !== -1 || host.indexOf('127.0.0.1') !== -1

const modifyHeader = (url, headers) => {
  const _headers = JSON.parse(JSON.stringify(headers))
  const _url = new URL(url)
  if (_headers['accept-encoding'].indexOf("gzip") !== -1) {
    delete _headers['accept-encoding'];
  }
  if (_headers['user-agent']) {
    _headers['user-agent'] = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.75 Safari/537.36"
  }
  if (_headers['connection'] === 'close') {
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
    encoding: null
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
        logger.error("error: " + error)
        reject(error)
      } else if (response.statusCode === 200 && response.body) {
        try {
          _data = JSON.parse(response.body);
        } catch (e) {
          _data = response?.body || null;
        }
        typeof _data === 'string' && _data.replaceAll(/https:\/\/github\.com/g, '/')
        resolve({
          body: _data,
          statusCode: response.statusCode,
          headers: response.headers
        })
      } else {
        logger.error("error: " + JSON.stringify(response))
        resolve({ statusCode: 500, body: '<h1>Server error</h1>', headers: {} })
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

const logRequest = (url, method, bodyData) => {
  logger.info("\n ------------------------------------------ \n Request url: " + url + "  \n Request method: " + method + "  \n Request body: " + JSON.stringify(bodyData) + "\n ------------------------------------------ \n ")
}


app.use(bodyParser())
app.use(createLogger())
// 加载路由中间件
app.use(async (ctx) => {
  let url = ctx.originalUrl.slice(1)
  const method = ctx.method
  const bodyData = ctx.request.body
  const headers = ctx.request.headers
  const isUrl = url.startsWith('http:') || url.startsWith('https')
  if (!url || !isUrl) {
    const piperaOrigin = ctx.cookies.get('pipera')
    if (!piperaOrigin) {
      ctx.body = "please provide a correct url to request"
    } else {
      url = modifyUrl(`${piperaOrigin}/${url}`)
      const originURL = new URL(url)
      ctx.cookies.set('pipera', originURL.origin)
      logRequest(url, method, bodyData)
      const res = await proxyRequest.bind(ctx)(url, method, headers, bodyData)
      ctx.set(res.headers);
      // 设置响应状态码
      ctx.status = res.statusCode;
      ctx.body = res.body
    }
  } else {
    url = modifyUrl(url)
    const originURL = new URL(url)
    ctx.cookies.set('pipera', originURL.origin)
    logRequest(url, method, bodyData)
    const res = await proxyRequest.bind(ctx)(url, method, headers, bodyData)
    ctx.set(res.headers);
    // 设置响应状态码
    ctx.status = res.statusCode;
    // 如果响应是二进制数据，直接发送Buffer
    ctx.body = res.body;  // ctx.body将适当处理Buffer
  }
})

app.listen(3008, () => {
  console.log('3008项目启动')
});
