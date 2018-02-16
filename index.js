let sqlite = require('better-sqlite3'),
  express = require('express'),
  ttn = require('ttn'),
  config = require(__dirname + '/config.json')

let db = new sqlite(__dirname + '/sense10.db');

db.prepare("CREATE TABLE IF NOT EXISTS measurements (id INTEGER UNIQUE PRIMARY KEY AUTOINCREMENT, gateways text, time timestamp, frequency double, modulation text, data_rate text, airtime integer, coding_rate text, counter integer, port integer, latitude double, longitude double, pm10 double, pm25 double, payload text)").run()

const appID = "sense10"
const accessKey = config.key

ttn.data(appID, accessKey)
  .then(function (client) {
    client.on("uplink", function (devID, payload) {

    	let params = [
    		payload.port,
    		payload.counter,
    		payload.metadata.time,
    		payload.payload_fields.latitude,
    		payload.payload_fields.longitude,
    		payload.payload_fields.pm10,
    		payload.payload_fields.pm25,
    		payload.metadata.frequency,
    		payload.metadata.modulation,
    		payload.metadata.data_rate,
    		payload.metadata.airtime,
    		payload.metadata.coding_rate,
    		JSON.stringify(payload.metadata.gateways)
    	]

  		db.prepare('INSERT INTO measurements (port, counter, time, latitude, longitude, pm10, pm25, frequency, modulation, data_rate, airtime, coding_rate, gateways) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)').run(params)

    })
  })
  .catch(function (err) {
    console.error(err)
    process.exit(1)
  })

let app = express()

app.all('/*', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Headers", "X-Requested-With")
  next()
})

app.get('/latest', function(req, res) {
	var rows = db.prepare("SELECT latitude, longitude, pm10, pm25, time FROM measurements ORDER BY id DESC LIMIT 20").all([])
  	res.json(rows)
})

console.log('Listening on port: ' + 1111)
app.listen(1111)