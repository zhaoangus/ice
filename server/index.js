const Koa = require('koa')
const consola = require('consola')
const { Nuxt, Builder } = require('nuxt')
import R from 'ramda'
import { resolve } from 'path'

// const app = new Koa()
const host = process.env.HOST || '127.0.0.1'
const port = process.env.PORT || 3000
const r = path => resolve(__dirname, path)

// Import and Set Nuxt.js options
let config = require('../nuxt.config.js')
config.dev = !(process.env === 'production')

const MIDDLEWARES = ['router']

class Server {
  constructor () {
    this.app = new Koa()
    this.useMiddleWares(this.app)(MIDDLEWARES)
  }

  useMiddleWares (app) {
    return R.map(R.compose(
      R.map(i => i(app)),
      require,
      i => `${r('./middleware')}/$(i)`
    ))
  }

  async start () {
    const nuxt = new Nuxt(config)

  // Build in development
    if (config.dev) {
      const builder = new Builder(nuxt)
      await builder.build()
    }

    this.app.use(ctx => {
      ctx.status = 200 // koa defaults to 404 when it sees that status is unset

      return new Promise((resolve, reject) => {
        ctx.res.on('close', resolve)
        ctx.res.on('finish', resolve)
        nuxt.render(ctx.req, ctx.res, promise => {
          // nuxt.render passes a rejected promise into callback on error.
          promise.then(resolve).catch(reject)
        })
      })
    })

    this.app.listen(port, host)
    console.ready({
      message: `Server listening on http://${host}:${port}`,
      badge: true
    })
  }

}

const app = new Server()

app.start()
