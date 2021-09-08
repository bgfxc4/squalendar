import express from "express"
import * as fs from "fs"
import body_parser from "body-parser"
import {sha512} from "js-sha512"

const config = JSON.parse(fs.readFileSync("./configs/config.json", "utf-8"))

const app = express()

app.use(body_parser.json())


app.post("/get-appointments/:year", (req, res) => {
	if (!authorized(req.body))
		return res.status(401).send("You are not logged in or your credentials are wrong!\n")

	res.send("year\n")
})

app.post("/get-appointments/:year/:month", (req, res) => {
	if (!authorized(req.body))
		return res.status(401).send("You are not logged in or your credentials are wrong!\n")

	res.send("month\n")
})

function authorized(req_body:any) {
	if (req_body.login_hash === undefined) return false 
	for (var user of config.users) {
		if (sha512(req_body.login_hash) == user) {
			return true
		}
	}
	return false
}

app.listen(config.main_server_port, () => {
	console.log(`[express] The server is listening on port ${config.main_server_port}`)
})
