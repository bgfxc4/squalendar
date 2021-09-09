import express from "express"
import cors from "cors"
import * as fs from "fs"
import body_parser from "body-parser"
import {sha512} from "js-sha512"
import {Db, MongoClient} from "mongodb"

const config = JSON.parse(fs.readFileSync("./configs/config.json", "utf-8"))

const app = express()
var db:Db;

app.use(body_parser.json())
app.use(cors())

interface appointment {
	name: string;
	type: string | undefined;
	description: string | undefined;
	time: {begin:string, end:string} | undefined;
}

interface day {
	index: number; // which day of month
	appointments: appointment[];
}

interface month {
	index: number; // which month, 0-11
	days: day[];
}

interface year {
	index: number; // which year
	months: month[]
}

app.post("/authorize", (req, res) => {
	if (!authorized(req.body))
		return res.status(401).send("Login credentials are wrong ore non existent!")	
	return res.send("Ok")
})

app.post("/get-appointments/:year", (req, res) => {
	if (!authorized(req.body))
		return res.status(401).send("You are not logged in or your credentials are wrong!\n")
	
	if (!is_valid_date(parseInt(req.params.year), undefined, undefined))
		return res.status(404).send("The date is not valid!")

	get_year_from_db(req.params.year, req.body.login_hash, year => {
		res.send(JSON.stringify(year))
	})
})

app.post("/get-appointments/:year/:month", (req, res) => {
	if (!authorized(req.body))
		return res.status(401).send("You are not logged in or your credentials are wrong!\n")
	
	if (!is_valid_date(parseInt(req.params.year), parseInt(req.params.month), undefined))
		return res.status(404).send("The date is not valid!")

	get_month_from_db(req.params.year, req.params.month, req.body.login_hash, month => {
		res.send(JSON.stringify(month))
	})
})

app.post("/delete-appointment/:year/:month/:day/:appointment", (req, res) => {
	if (!authorized(req.body))
		return res.status(401).send("You are not logged in or your credentials are wrong!\n")

	if (!is_valid_date(parseInt(req.params.year), parseInt(req.params.month), parseInt(req.params.day)))
		return res.status(404).send("The date is not valid!")
	
	delete_appointment_from_db(req.params.year, req.params.month, req.params.day, req.params.appointment,
							   req.body.login_hash, ret => {
		if (ret != 0) return res.status(404).send("The appointment you wanted to delete does not exist!")
		else return res.send("Ok")
	})
})

app.post("/delete-appointment/:year/:month/:day", (req, res) => {
	if (!authorized(req.body))
		return res.status(401).send("You are not logged in or your credentials are wrong!\n")

	if (!is_valid_date(parseInt(req.params.year), parseInt(req.params.month), parseInt(req.params.day)))
		return res.status(404).send("The date is not valid!")
	
	delete_day_from_db(req.params.year, req.params.month, req.params.day, req.body.login_hash, () => {
		res.send("Ok")
	})
})

app.post("/delete-appointment/:year/:month", (req, res) => {
	if (!authorized(req.body))
		return res.status(401).send("You are not logged in or your credentials are wrong!\n")

	if (!is_valid_date(parseInt(req.params.year), parseInt(req.params.month), undefined))
		return res.status(404).send("The date is not valid!")
	
	delete_month_from_db(req.params.year, req.params.month, req.body.login_hash, () => {
		res.send("Ok")
	})
})

app.post("/delete-appointment/:year", (req, res) => {
	if (!authorized(req.body))
		return res.status(401).send("You are not logged in or your credentials are wrong!\n")

	if (!is_valid_date(parseInt(req.params.year), undefined, undefined))
		return res.status(404).send("The date is not valid!")
	
	delete_year_from_db(req.params.year, req.body.login_hash, () => {
		res.send("Ok")
	})
})

app.post("/new-appointment/:year/:month/:day", (req, res) => {
	if (!authorized(req.body))
		return res.status(401).send("You are not logged in or your credentials are wrong!\n")

	if (!is_valid_date(parseInt(req.params.year), parseInt(req.params.month), parseInt(req.params.day)))
		return res.status(404).send("The date is not valid!")
	
	if (req.body.name == undefined || req.body.name == "")
		return res.status(400).send("The name can't be empty!")

	var time;
	if (req.body.time != undefined) {
		if (req.body.time.begin == undefined || req.body.time.end == undefined)
			return res.status(400).send("The format of the time has to be {begin: \"string\", end: \"string\"}!")
	}

	var appmnt: appointment = {
		name: req.body.name,
		type: req.body.type,
		description: req.body.description,
		time: time,
	}

	add_appointment_to_db(appmnt, req.params.year, req.params.month, req.params.day, req.body.login_hash)
	res.send("Ok")
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

function delete_appointment_from_db(year: string, month: string, day: string, appointment: string, login_hash: string, callback: (ret: number) => void) {
	var query = {index: parseInt(year)}
	db.collection("A" + login_hash.slice(0, 100)).find(query).toArray((err, res) => { // find year in db
		if (err) throw err
		if (res == undefined) return
		if (res?.length == 0) return callback(1)
		if (res[0].months[month] == undefined) return callback(1)
		if (res[0].months[month].days[day] == undefined) return callback(1)
		var appointments = res[0].months[month].days[day].appointments
		if (appointments[appointment] == undefined) return callback(1)
		
		var delete_year = false
		if (appointments.length <= 1) {
			res[0].months[month].days[day] = undefined
			if (res[0].months[month].days.filter((val: any) => val != null).length == 0) { // all other days in month are empty
				res[0].months[month] = undefined // clear this month
				if (res[0].months.filter((val: any) => val != null).length == 0) { // all other months are empty
					delete_year = true
				}
			}
		} else {
			// remove appointment at index "appointment"
			res[0].months[month].days[day].appointments = appointments.slice(0, appointment).concat(appointments.slice(parseInt(appointment) + 1))
		}
		if (delete_year) {
			db.collection("A" + login_hash.slice(0, 100)).deleteOne(query, err => {
				if (err) throw err
				callback(0)
			})
		} else {
			db.collection("A" + login_hash.slice(0, 100)).updateOne(query, {$set: res[0]}, err => {
				if (err) throw err
				callback(0)
			})
		}
	})
}

function delete_day_from_db(year: string, month: string, day: string, login_hash: string, callback: () => void) {
	var query = {index: parseInt(year)}
	db.collection("A" + login_hash.slice(0, 100)).find(query).toArray((err, res) => { // find year in db
		if (err) throw err
		if (res == undefined) return
		if (res?.length == 0) return callback()
		if (res[0].months[month] == undefined) return callback()
		var days = res[0].months[month].days
		if (days[day] == undefined) return callback()
		
		var delete_year = false
		if (days.filter((val: any) => val != null).length <= 1) { // the only day in the month is the one to delete
			res[0].months[month] = undefined // delete entire month
			if (res[0].months.filter((val: any) => val != null).length == 0) { // all other months are empty
				delete_year = true
			}
		} else {
			// remove day at index "day"
			res[0].months[month].days[day] = undefined
		}
		if (delete_year) {
			db.collection("A" + login_hash.slice(0, 100)).deleteOne(query, err => {
				if (err) throw err
				callback()
			})
		} else {
			db.collection("A" + login_hash.slice(0, 100)).updateOne(query, {$set: res[0]}, err => {
				if (err) throw err
				callback()
			})
		}
	})
}

function delete_month_from_db(year: string, month: string, login_hash: string, callback: () => void) {
	var query = {index: parseInt(year)}
	db.collection("A" + login_hash.slice(0, 100)).find(query).toArray((err, res) => { // find year in db
		if (err) throw err
		if (res == undefined) return
		if (res?.length == 0) return callback()
		if (res[0].months[month] == undefined) return callback()

		var delete_year = false
		if (res[0].months.filter((val: any) => val != null).length <= 1) { // all other months are empty
			delete_year = true
		} else {
			// remove month at index "month"
			res[0].months[month] = undefined
		}
		if (delete_year) {
			db.collection("A" + login_hash.slice(0, 100)).deleteOne(query, err => {
				if (err) throw err
				callback()
			})
		} else {
			db.collection("A" + login_hash.slice(0, 100)).updateOne(query, {$set: res[0]}, err => {
				if (err) throw err
				callback()
			})
		}
	})
}

function delete_year_from_db(year: string, login_hash: string, callback: () => void) {
	var query = {index: parseInt(year)}
	db.collection("A" + login_hash.slice(0, 100)).find(query).toArray((err, res) => { // find year in db
		if (err) throw err
		if (res == undefined) return
		if (res?.length == 0) return callback()
			db.collection("A" + login_hash.slice(0, 100)).deleteOne(query, err => {
				if (err) throw err
				callback()
		})
	})
}


function add_appointment_to_db(appmnt: appointment, year: string, month: string, day: string, login_hash: string) {
	var query = {index: parseInt(year)}
	db.collection("A" + login_hash.slice(0, 100)).find(query).toArray((err, res) => { // find year in db
		if (err) throw err
		if (res == undefined) return
		
		var year_existed = res.length != 0
		if (!year_existed) { // year does not exist, insert new year
			var new_year: year = {
				index: parseInt(year),
				months: []
			}
			res.push(new_year)
		}

		if (res[0].months[month] == undefined) { // month does not exist, create new one
			var new_month: month = {
				index: parseInt(month),
				days: []
			}
			res[0].months[month] = new_month
		}

		if (res[0].months[month].days[day] == undefined) { // day does not exist, create one
			var new_day: day = {
				index: parseInt(day),
				appointments: []
			}
			res[0].months[month].days[day] = new_day
		}
		res[0].months[month].days[day].appointments.push(appmnt)
		if (year_existed) {
			db.collection("A" + login_hash.slice(0, 100)).updateOne(query, {$set: res[0]}, err => {
				if (err) throw err
			})
		} else {
			db.collection("A" + login_hash.slice(0, 100)).insertOne(res[0], err => {
				if (err) throw err
			})
		}
	})
}

function get_year_from_db(year: string | number, login_hash: string, callback: (year: any) => void) {

	var query = {index: parseInt(<any>year)}
	db.collection("A" + login_hash.slice(0, 100)).find(query).toArray((err, res) => { // find year in db
		if (err) throw err
		if (res == undefined) return
		callback(res[0] || {})
	})
}

function get_month_from_db(year: string | number, month: string | number, login_hash: string, callback: (month: any) => void) {
	get_year_from_db(year, login_hash, res => {
		callback((res.months && res.months[month]) ? res.months[month] : {})
	})
}

const days_of_month = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

function is_valid_date(year:number, month:number | undefined, day:number | undefined) {
	if (year == NaN || month == NaN || day == NaN) 
		return false
	if (year < 1970 || year > 3000) 
		return false

	if (month !== undefined && days_of_month[month] == undefined) 
		return false
	var d_of_m = days_of_month[month || 0]
	
	if (month == 1) { // month is february
		var is_leap_year = ((year % 4 == 0) && (year % 100 != 0)) || (year % 400 == 0)
		if (is_leap_year)
			d_of_m += 1
	}
	
	if (day !== undefined && (day < 0 || day >= d_of_m)) return false

	return true
}

setup_mongodb()
app.listen(config.main_server_port, () => {
	console.log(`[express] The server is listening on port ${config.main_server_port}`)
})

function setup_mongodb() {
	MongoClient.connect(config.mongo_url).then(client => {
		db = client.db("squalendar")
		console.log("[Database] connected to database!")
	})
}
