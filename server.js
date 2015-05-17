'use strict'

var express = require('express')
var CloudFlareClient = require('./lib/cloudflare-client')

var auth = require('./auth.json')
var config = require('./config.json')

var client = new CloudFlareClient(auth)

var app = express()
app.get('/', function (req, res, next) {
  var ip = req.query.ip
  if (!ip) {
    res.sendStatus(400)
    return
  }
  client.updateDnsRecord(config.zone_id, config.record_id, config.hostname, ip,
    function (err, data) {
      if (err) {
        res.status(500).json({error: err.message})
      } else {
        res.json(data)
      }
    })
})

var port = process.env.OPENSHIFT_IOJS_PORT ||
  process.env.OPENSHIFT_NODEJS_PORT ||
  process.env.PORT ||
  8080
var addr = process.env.OPENSHIFT_IOJS_IP ||
  process.env.OPENSHIFT_NODEJS_IP
app.listen(port, addr)
