let bodyPool = []
let headerPool = []

function saveRequestBody(detail) {
  if (isAvailableRequest(detail)) {
    bodyPool.push(detail)
  }
}

function saveRequestHeader(detail) {
  if (isAvailableRequest(detail)) {    
    headerPool.push(detail)
  }
}

function isAvailableRequest(detail) {
  const { url, method } = detail
  if (
    !url
    || method == 'OPTIONS'
    || !url.startsWith('https://')
  ) {
    return false
  }
  return true
}

function pickQueryParams(paramsStr) {
  const params = {}
  if (paramsStr) {
    paramsStr.split('&').forEach((str) => {
      const entry = str.split('=')
      params[entry[0]] = entry[1]
    })
  }
  return params
}

/**
 * intercept condition
 *  {
 *   url: api/?=?/123/@nullifier@, //?=? will be ignore and @nullifier@ gen hash buy sha256
 *   method: GET|POST,   
 *   query: [
 *      {
 *        "aaa": "?=?",
 *        "verify": true
 *      }
 *    ],
 *    header: [
 *      {
 *        "aaa": "?=?",
 *        "verify": true
 *      }
 *    ],
 *    body: [
 *      {
 *        "aaa": "?=?",
 *        "verify": true
 *      }
 *    ],
 *  }       
 */
const placeholder = '?=?'

function checkMatchedRequest(condition, header, body) {
  if (!condition) return

  const { method, url, requestHeaders } = header

  let { url: targetUrl, method: targetMethod, query: targetQuery, header: targetHeader, body: targetBody } = condition

  if (!targetUrl || (targetMethod && targetMethod !== method)) {
    return false
  }

  const end = url.indexOf('?') > -1 ? url.indexOf('?') : url.length
  const query = pickQueryParams(url.substring(end + 1))

  const url_arr = url.substring(8, end).split('/').slice(1) //exclude domain

  const transitionUrl = targetUrl.replaceAll('?=?', '@=@').replaceAll('?nullifier?', '@=@')

  const targetEnd
    = transitionUrl.indexOf('?') > -1 ? transitionUrl.indexOf('?') : targetUrl.length

  const target_arr = targetUrl.substring(0, targetEnd).split('/')

  if (url_arr.length !== target_arr.length) {
    return false
  }

  for (let i = 0; i < target_arr.length; i++) {
    if (url_arr[i] !== target_arr[i] && !target_arr[i].includes('?')) {
      return false
    }
  }

  if (targetQuery) {
    let transitionQuery = {}
    targetQuery.forEach((item) => {
      transitionQuery = { ...transitionQuery, ...item }
    })

    delete transitionQuery.verify

    for (let key of Object.keys(transitionQuery)) {
      if (transitionQuery[key] != placeholder && query[key] != transitionQuery[key]) {
        return false
      } else if (transitionQuery[key] == placeholder && typeof query[key] == 'undefined') {
        return false
      }
    }
  }

  if (targetHeader) {
    let transitionHeader = {}
    targetHeader.forEach((item) => {
      transitionHeader = { ...transitionHeader, ...item }
    })

    delete transitionHeader.verify

    for (let key of Object.keys(transitionHeader)) {
      const _h = requestHeaders.find(v => v.name.toLowerCase() === key.toLowerCase())
      if (!_h) {
        return false
      }
      if (transitionHeader[key] != placeholder && transitionHeader[key] != _h.value) {
        return false
      } else if (transitionHeader[key] == placeholder && typeof _h.value == 'undefined') {
        return false
      }
    }
  }

  if (targetBody) {
    body = getRequestBodyObject(body.requestBody)    
    let transitionBody = {}
    targetBody.forEach((item) => {
      transitionBody = { ...transitionBody, ...item }
    })

    delete transitionBody.verify

    for (let key of Object.keys(transitionBody)) {
      if (transitionBody[key] != placeholder && body[key] != transitionBody[key]) {
        return false
      } else if (transitionBody[key] == placeholder && typeof body[key] == 'undefined') {
        return false
      }
    }
  }
  return true
}

function getRequestBodyObject(requestBody, parse = true) {
  if (requestBody?.raw) {
    if (parse) {
      return JSON.parse(requestBody.raw[0].body)
    }
    return requestBody.raw[0].body
  }
  if (requestBody?.formData) {
    return requestBody.formData
  }
  return {}
}