/* eslint no-undef: "error" */
/* eslint-env browser */
import '@babel/polyfill'
import toposort from 'toposort'
import waterfall from 'async/waterfall'

// textile config API.HTTPHeaders.Access-Control-Allow-Origin '["*"]'
const HOST = 'http://127.0.0.1'
const API = `${HOST}:40600/api/v0`
const THREAD = '12D3KooWEyUT3VTkZVEmvYhYYfAVmwX9NQPD777DPLA55s1MZqCS'

const processDrop = function (event) {
  event.preventDefault()

  if (/Mobi|Android/i.test(navigator.userAgent)) {
    console.log('here!')
    for (const file of event.srcElement.files) {
      switch (true) {
        case file.type.startsWith('image'):
          processImage(file)
          break
        default:
          console.log(`Hmm, don't know what to do with '${file.type}' files yet...`)
      }
    }
  } else {
    if (event.dataTransfer.items) {
      // Use DataTransferItemList interface to access the file(s)
      for (const obj of event.dataTransfer.items) {
        // If dropped items aren't files, reject them
        if (obj.kind === 'file') {
          const file = obj.getAsFile()
          switch (true) {
            case file.type.startsWith('image'):
              processImage(file)
              break
            default:
              console.log(`Hmm, don't know what to do with '${file.type}' files yet...`)
          }
        }
      }
    } else {
      // Use DataTransfer interface to access the file(s)
      for (const file of event.dataTransfer.files) {
        switch (true) {
          case file.type.startsWith('image'):
            processImage(file)
            break
          default:
            console.log(`Hmm, don't know what to do with '${file.type}' files yet...`)
        }
      }
    }
    this.classList.remove('hover')
  }
}

const processImage = async (file) => {
  const out = await addFile(file, {
    thread: THREAD,
    caption: 'dropped file'
  }, result => console.log(`processed '${result.name}' file`))
  console.log(out)
  // Just add the json string
  var element = document.createElement('pre')
  var node = document.createTextNode(JSON.stringify(out, null, 2))
  element.appendChild(node)
  document.body.appendChild(element)
}

const getThreadInfo = async (thread) => {
  const threadId = thread || 'default'
  return executeJsonCmd('GET', `${API}/threads/${threadId}`, { ctype: 'application/json' })
}

const addFile = async (file, opts, output) => {
  if (!opts.schema) {
    const info = await getThreadInfo(opts.thread)
    opts.schema = info.schema
  }
  const payload = new FormData()
  payload.append('file', file, file.name)
  orderLinks(opts.schema.links)
  const milled = await millNode(payload, opts.schema, output)
  return executeJsonCmd('POST', `${API}/threads/${opts.thread}/files`,
    {
      opts: { caption: opts.caption },
      payload: JSON.stringify([milled]),
      ctype: 'application/json'
    })
}

const executeJsonCmd = async (method, url, pars) => {
  const headers = {}
  if (pars.opts) {
    const opts = Object.entries(pars.opts || {})
      .map(a => `${a[0]}=${a[1]}`)
      .join(',')
    headers['X-Textile-Opts'] = opts
  }
  if (pars.ctype) {
    headers['Content-Type'] = pars.ctype
  }
  if (pars.args) {
    headers['X-Textile-Args'] = (pars.args || []).join(',')
  }
  const params = {
    method: method,
    headers: headers
  }
  if (pars.payload) {
    params.body = pars.payload
  }
  try {
    const fetched = await fetch(url, params)
    return fetched.json()
  } catch (err) {
    throw err
  }
}

var orderLinks = (links) => {
  // Map of links and those links that depend on them
  var G = Object
    .entries(links)
    .map(([name, link]) => [name, link.use])
  return toposort(G).reverse()
}

const millNode = async (payload, node, output, name) => {
  if (node.links) {
    const sorted = orderLinks(node.links)
    const links = node.links
    const promises = sorted
      .filter(name => name !== ':file')
      .map((name, index) => {
        if (index === 0) {
          return async (cb) => {
            const res = await millNode(payload, links[name], output, name)
            const dir = {}
            dir[name] = res
            cb(null, dir)
          }
        }
        return async (dir, cb) => {
          let body = payload
          if (!links[name].opts) {
            links[name].opts = {}
          }
          // Check for top-level opts
          links[name].opts.plaintext = links[name].plaintext
          links[name].opts.pin = links[name].pin
          if (links[name].use !== ':file') {
            body = undefined
            links[name].opts.use = dir[links[name].use].hash
          }
          const res = await millNode(body, links[name], output, name)
          dir[name] = res
          cb(null, dir)
        }
      })
    return new Promise((resolve, reject) => {
      waterfall(promises, (err, result) => {
        if (err) {
          reject(err)
        } else {
          resolve(result)
        }
      })
    })
  } else { // We're just processing a single file
    const out = await executeJsonCmd('POST', `${API}/mills${node.mill}`, { opts: node.opts, payload })
    out.name = name
    console.log(out)
    output(out)
    return out
  }
}

const container = document.querySelector('#dropZone')

container.ondragover = function (event) {
  event.preventDefault()
  this.classList.add('hover')
}

container.ondragleave = function (event) {
  event.preventDefault()
  this.classList.remove('hover')
}

container.ondrop = processDrop
