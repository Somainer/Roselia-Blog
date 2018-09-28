import _ from 'lodash'
import config from './config'
function ensureAPlayer(onload) {
  if (!window.APlayer) {
    let playerNode = document.createElement('script')
    let playerStyle = document.createElement('link')
    playerStyle.rel = 'stylesheet'
    playerStyle.href = 'https://cdn.bootcss.com/aplayer/1.10.1/APlayer.min.css'
    playerNode.async = true
    playerNode.onload = onload || null
    playerNode.src = 'https://cdn.bootcss.com/aplayer/1.10.1/APlayer.min.js'
    document.head.appendChild(playerStyle)
    document.body.appendChild(playerNode)
  }
}
function unescapeToHTML (str) {
  const d = document.createElement('div')
  d.innerHTML = str.replace(/<em>(.*?)<\/em>/, (_, expr) => `*${expr}*`)
  return d.innerText || d.textContent
}

class RenderResult {
  constructor (template, ret) {
    this.template = template
    this.returnValue = ret
  }
}

function render (template, context, delim) { // A not so naive template engine.
  const funcTemplate = expr => `with(data || {}) { with(data.functions) {return (${expr});}}`
  return template.replace(new RegExp((delim || ['{{', '}}']).join('\\s*?(.*?)\\s*?'), 'gms'), (_total, expr) => {
    try {
      const bigC = /([a-zA-Z_$]+[a-zA-Z_0-9]*){([\s\S]+)}/.exec(expr)
      let res
      if (bigC) {
        let [_inp, fn, ctx] = bigC
        res = (context[fn] || context.functions[fn])(unescapeToHTML(ctx))
      } else {
        expr = unescapeToHTML(expr)
        res = (new Function('data', funcTemplate(expr)))(context)
      }
      if (res instanceof RenderResult) {
        res = res.template
      }
      if (res instanceof HTMLElement) {
        return res.outerHTML
      }
      if (_.isNumber(res) || _.isString(res)) return res
      return ''
    } catch (e) {
      console.log('On rendering:', expr)
      console.error(e)
      return expr
    }
  })
}

function selfish (target, forbid) {
  const cache = new WeakMap()
  if (forbid) {
    const err = key => new Proxy({}, {
      get () {
        // console.error(`You are not allowed to access ${key} in this context`)
        return null
      }
    })
    forbid.forEach(k => target[k] = err(k))
  }

  const handler = {
    get (target, key) {
      const value = Reflect.get(target, key)
      if (!_.isFunction(value)) return value
      if (!cache.has(value)) {
        cache.set(value, value.bind(target))
      }
      return cache.get(value)
    }
  }
  return new Proxy(target, handler)
}
class RoseliaRenderer {
  constructor (app) {
    this.app = app
    this.context = selfish(new RoseliaScript(app), [
      'window', 'document', 'fetch'
    ])
  }
  render (template) {
    return render(template, this.context, ['(?:Roselia|roselia|r|R){{', '}}'])
  }
}
class RoseliaScript {
  constructor (app) {
    this.app = app
    this.customFunctions = {app: null}
    this.functions = selfish(this.customFunctions)
    this.app.$on('postUnload', () => {
      this.customFunctions = {app: null}
      this.functions = selfish(this.customFunctions)
    })
  }

  then (f) {
    this.app.$nextTick(f)
  }

  music (meta, autoplay = false, onPlayerReady = null) {
    ensureAPlayer(() => this.app.$emit('aPlayerLoaded'))
    let id = this.randomID()
    let player
    this.then(_ => {
      const addPlayer = () => {
        const element = document.getElementById(id)
        player = new window.APlayer({
          container: element,
          narrow: false,
          autoplay,
          mutex: true,
          theme: config.theme.accent,
          mode: 'circulation',
          showlrc: 1,
          preload: 'metadata',
          audio: meta
        })
        player.on('loadstart', () => {
          Array.from(element.getElementsByClassName('aplayer-title')).forEach(ev => {
            ev.style.color = config.theme.secondary
          })
          onPlayerReady && onPlayerReady(player)
        })
      }
      if (!window.APlayer) {
        this.app.$once('aPlayerLoaded', () => {
          this.then(addPlayer)
        })
      } else {
        this.then(addPlayer)
      }

      this.app.$once('postUnload', () => {
        player.destroy()
      })
    })
    return new RenderResult(`<div id="${id}"></div>`, player)
  }
  heimu (text) {
    const id = this.randomID()
    return new RenderResult(`<span class="heimu" id="${id}">${text}</span>`, id)
  }
  cite (text, pid) {
    return `<a href="post?p=${pid}">${text}</a>`
  }

  randomID (length) {
    return Number(Math.random().toString().substring(3, length) + Date.now()).toString(36)
  }

  onceLoad (fn) {
    this.app.$once('postLoaded', fn)
  }

  onceUnload (fn) {
    this.app.$once('postUnload', fn)
  }

  btn (text, onClick, externalClasses = '') {
    const id = this.randomID()
    if (_.isArray(externalClasses)) externalClasses = externalClasses.join(' ')
    onClick && this.then(() => {
      document.getElementById(id).addEventListener('click', onClick)
    })
    return new RenderResult(`<button id="${id}" class="v-btn ${externalClasses}">${text}</button>`, id)
  }

  toast (text, color) {
    this.app.showToast(text, color || 'info')
  }

  formula (expr) {
    return `$ ${expr} $`
  }

  formulation (expr) {
    return `$$ ${expr} $$`
  }

  formulationEscape () {
    const delims = [['$$', '$$'], ['$', '$'], ['\\(', '\\)']]
    delims.map(pat => pat.map(s => s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')).join('\\s*(.*?)\\s*')).map(p => new RegExp(p, 'gms')).forEach(pattern => {
      this.app.postData.content = this.app.postData.content.replace(pattern, (_sup, form) => {
        // console.log(form, '=>', unescapeToHTML(form))
        return unescapeToHTML(form)
      })
    })
  }

  static importJS (url, onComplete) {
    const jsNode = document.createElement('script')
    jsNode.onload = onComplete
    jsNode.async = true
    jsNode.src = url
    document.body.appendChild(jsNode)
  }

  def (name, func) {
    if (func instanceof RenderResult) {
      this.customFunctions[name] = func.returnValue
      return func.template
    }
    this.customFunctions[name] = func
    if (_.isString(func) || func instanceof HTMLElement) {
      return func
    }
  }

  audio (src) {
    const id = this.randomID()
    return new RenderResult(`<audio id='${id}' src='${src}' hidden='true'>`, id)
  }

  getElement (name) {
    if (name instanceof HTMLElement) {
      name = name.id
    }
    if (name instanceof RenderResult) {
      if (_.isString(name.returnValue)) name = name.returnValue
      else {
        name = name.template
      }
    }
    if (_.isString(name)) {
      const matchId = /id=['"]([a-zA-Z0-9-]+)['"]/.exec(name)
      if (matchId) {
        name = matchId[1]
      }
    }
    if (name instanceof HTMLElement) {
      name = name.id
    }
    const res = (name in this.functions) ? this.functions[name] : name
    return document.getElementById(res instanceof Element ? res.id : res)
  }

  raw (s) {
    // s = s.split('\n').map(x => `<p>${x}</p>`).join('\n')
    return `<pre>Roselia{{${s}}}</pre>`
  }

  previewColor (color) {
    const prevColor = this.app.preview.color
    this.app.preview.color = color
    this.onceUnload(() => {
      this.app.preview.color = prevColor
    })
  }

  element (name) {
    return new Promise(resolve => {
      this.then(_ => {
        resolve(this.getElement(name))
      })
    })
  }

  createElement (type) {
    const el = document.createElement(type)
    el.id = this.randomID()
    return el
  }

  setPreview (el, preview /* :{title, subtitle, img, color} */) {
    this.element(el).then(e => {
      e.addEventListener('mouseover', ev => {
        ev.preventDefault()
        this.app.preview.show = true
        this.app.preview.attach = e
        this.app.preview.cacheData = null
        this.app.preview.current = this.app.postData.id;
        ['title', 'subtitle', 'img', 'color'].forEach(attr => {
          const value = preview[attr]
          if (!_.isNil(value)) this.app.preview[attr] = value
        })
      })
      e.addEventListener('mouseout', ev => {
        ev.preventDefault()
        this.app.preview.show = false
      })
      if (!_.isNil(preview.goTo)) {
        e.addEventListener('click', ev => {
          ev.preventDefault()
          this.app.$vuetify.goTo(_.isNumber(preview.goTo) ? preview.goTo : this.getElement(preview.goTo), {offset: -200})
        })
      }
    })
  }

  previewed (el, preview) {
    this.setPreview(el, preview)
    return el
  }

  doTo (el, fn) {
    this.element(el).then(fn)
    return el
  }

  Y = fn => (u => u(u))(x => fn(s => x(x)(s)))

}

export default {
  RoseliaRenderer,
  createRenderer (app) {
    return new RoseliaRenderer(app)
  }
}
