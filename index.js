const Koa = require('koa');
const request = require('postman-request');
const bodyParser = require('koa-bodyparser');
const app = new Koa();


process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

const proxyRequest = (url, method, data) => {
  const option = {
    url,
    method
  }
  if (data) {
    option.formData = data
  }
  return new Promise((resolve, reject) => {
    request(option, (error, response) => {
      if (error) reject(error)
      let _data = null;
      try {
        _data = JSON.parse(response.body);
      } catch (e) {
        _data = response?.body || null;
      }
      resolve(_data)
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
// 加载路由中间件
app.use(async (ctx) => {
  let url = ctx.originalUrl.slice(1)
  const method = ctx.method
  const bodyData = ctx.request.body
  const isUrl = url.startsWith('http:') || url.startsWith('https')
  if (!url || !isUrl) {
    ctx.body = "please provide a correct url to request"
  } else {
    url = modifyUrl(url)
    ctx.body = await proxyRequest(url, method, bodyData)
  }
})

app.listen(3008, () => {
  console.log('3008项目启动')
});
