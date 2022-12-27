import fs from "fs";
import http from "http";
import https from "https";
import express from "express";
import { Server } from "socket.io";

export default class Weberver {
	io;
	ios;
	app;
	httpServer;
	httpsServer;

	createServer() {
		this.app = express();
		this.app.set("view engine", "ejs");
		this.app.use(express.static("public"));
		this.allowCORS();

		this.makeHTTP();
		if (!process.env.DYNO) {
			this.makeHTTPS();
		}
		this.routes();
	}
	makeHTTP() {
		const HTTP_PORT = process.env.HTTP_PORT || process.env.HTTP_PORT_LOCAL;
		this.httpServer = http.createServer(this.app);
		this.io = new Server(this.httpServer, {
			/* options */
		});
		this.io.on("connection", this.ioconn);
		this.httpServer.listen(HTTP_PORT, () => {
			console.log(`HTTP Server running at: http://localhost:${HTTP_PORT}/`);
		});
	}
	makeHTTPS() {
		const certs = {
			key: fs.readFileSync("certs/server.key"),
			cert: fs.readFileSync("certs/server.cert"),
		};
		this.httpsServer = https.createServer(certs, this.app);
		this.ios = new Server(this.httpsServer, {
			/* options */
			cors: {
				// Access-Control-Allow-Origin
				origin: (origin, callback) => {
					const isValid = true;
					if (isValid) {
						// Valid Origin
						return callback(null, true);
					} else {
						// Invalid origin
						return callback(new Error("Invalid Origin"), false);
					}
				},
				// Access-Control-Allow-Methods
				methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
				// Access-Control-Allow-Headers
				allowedHeaders: "Accept, Authorization, Content-Type, X-Requested-With, Range",
				// Access-Control-Expose-Headers
				exposedHeaders: "Content-Length",
				// Access-Control-Allow-Credentials
				credentials: "true",
			},
		});
		this.ios.on("connection", (socket) => {
			this.ioconn(socket);
		});
		this.httpsServer.listen(process.env.HTTPS_PORT_LOCAL, () => {
			console.log(`HTTPS Server running at: https://localhost:${process.env.HTTPS_PORT_LOCAL}/`);
		});
	}

	allowCORS() {
		this.app.use((req, res, next) => {
			res.header("Access-Control-Allow-Origin", req.get("Origin") || "*");
			res.header("Access-Control-Allow-Credentials", "true");
			res.header("Access-Control-Allow-Methods", "GET,HEAD,PUT,PATCH,POST,DELETE");
			res.header("Access-Control-Expose-Headers", "Content-Length");
			res.header("Access-Control-Allow-Headers", "Accept, Authorization, Content-Type, X-Requested-With, Range");
			if (req.method === "OPTIONS") {
				return res.sendStatus(200);
			} else {
				return next();
			}
		});
	}

	ioconn(socket) {
		this.socket = socket;

		// receive a message from the client
		this.socket.on("PING", (data) => {
			data[data.length - 1].pong = new Date().toJSON();
			console.log(JSON.stringify(data));
			this.socket.emit("PONG", data);
		});
	}

	ionotify({ eventName, data }) {
		console.log(JSON.stringify({ eventName, data }));
		this.socket.emit(eventName, data);
	}

	routes() {
		this.app.get("/", (req, res) => {
			res.render("pages/socketio");
		});
	}
}
