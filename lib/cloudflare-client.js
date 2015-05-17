'use strict'

var https = require('https')

var toDnsRecordData = function (hostname, ip) {
  return {
    type: 'A',
    name: hostname,
    content: ip
  }
}

var toDnsRecordUri = function (zoneId, recordId) {
  return '/client/v4/zones/' + zoneId + '/dns_records/' + recordId
}

var handleResponse = function (dataStr, cb) {
  var data = null
  try {
    data = JSON.parse(dataStr)
  } catch (err) {
    cb(new Error('Failed to parse response: ' + err.message))
    return
  }
  if (data === null || typeof data !== 'object') {
    cb(new Error('Invalid response'))
  } else if (!data.success) {
    if (Array.isArray(data.errors) && data.errors.length) {
      cb(new Error(data.errors[0].message))
    } else {
      cb(new Error('Unknown error'))
    }
  } else {
    cb(null, data.result)
  }
}

var CloudFlareClient = function (auth) {
  this._auth = auth
}

CloudFlareClient.prototype._put = function(uri, data, done) {
  var cb = function (err, result) {
    if (done) {
      done(err, result)
      done = null
    }
  }
  data = JSON.stringify(data)
  var options = {
    hostname: 'api.cloudflare.com',
    port: 443,
    path: uri,
    method: 'PUT',
    headers: {
      'X-Auth-Key': this._auth.key,
      'X-Auth-Email': this._auth.email,
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  }
  var req = https.request(options, function (res) {
    if (res.statusCode < 200 || res.statusCode >= 300) {
      cb(new Error('HTTP ' + res.statusCode))
      return
    }
    res.setEncoding('utf8')
    var body = ''
    res.on('data', function (chunk) {
      body += chunk
    })
    res.on('end', function () {
      handleResponse(body, cb)
    })
  })
  req.on('error', function (e) {
    cb(new Error('Request error: ' + e))
  })
  req.write(data)
  req.end()
}

CloudFlareClient.prototype.updateDnsRecord = function (
    zoneId, recordId, hostname, ip, cb) {
  var uri = toDnsRecordUri(zoneId, recordId)
  var data = toDnsRecordData(hostname, ip)
  this._put(uri, data, cb)
}

module.exports = CloudFlareClient
