import { ShowToastEvent } from "lightning/platformShowToastEvent";

export default class Util {
	static variants = {
		error: "error",
		warning: "warning",
		success: "success",
		info: "info"
	};
	static showNotification(cmp, { title = "", message = "", variant = "success" }) {
		cmp.dispatchEvent(
			new ShowToastEvent({
				title,
				message,
				variant
			})
		);
	}

	static calculateDuration({ startAt, endAt }) {
		const toString = (withLeadingZeroes, params) => {
			let { factor, rounding } = params;
			let { days, hours, minutes, seconds, milliseconds } = params.diff;

			// let output = `${days > 0 ? days + "d " : ""}${("00" + hours).slice(-2)}h ${("00" + minutes).slice(-2)}m ${("00" + seconds).slice(-2)}s`;
			let output = "";

			let strDays = "";
			let strHours = "";
			let strMinutes = "";
			let strSeconds = "";
			let strMilliseconds = "";
			if (withLeadingZeroes) {
				if (days > 0) {
					strDays = `${days}d`;
				}
				if (hours > 0 || days > 0) {
					strHours = `${("00" + hours).slice(-2)}h`;
				}
				strMinutes = `${("00" + minutes).slice(-2)}m`;
				strSeconds = `${("00" + seconds).slice(-2)}s`;
				strMilliseconds = `${("000" + milliseconds).slice(-3)}ms`;
			} else {
				if (days > 0) {
					strDays = `${days}d`;
				}
				if (hours > 0 || days > 0) {
					strHours = `${hours}h`;
				}
				strMinutes = `${minutes}m`;
				strSeconds = `${seconds}s`;
				strMilliseconds = `${milliseconds}ms`;
			}
			switch (rounding) {
				case "MILLIS": {
					output = `${strDays} ${strHours} ${strMinutes} ${strSeconds} ${strMilliseconds}`;
					break;
				}
				case "SEC": {
					output = `${strDays} ${strHours} ${strMinutes} ${strSeconds}`;
					break;
				}
				case "MIN": {
					output = `${strDays} ${strHours} ${strMinutes}`;
					break;
				}
				case "HOUR": {
					output = `${strDays} ${strHours}`;
					break;
				}
				case "DAY": {
					output = `${strDays}`;
					break;
				}
				default:
					break;
			}

			if (days + hours + minutes + seconds > 0 && factor < 0) {
				output = `- ${output}`;
			}
			return output.trim();
		};

		const parse = ({ start, end, rounding }) => {
			let output = {
				total: 0,
				diff: {},
				rounding,
				values: {},
				factor: start <= end ? 1 : -1
			};

			switch (rounding) {
				case "MILLIS": {
					rounding = 1 / 1000;
					break;
				}
				case "SEC": {
					rounding = 1;
					break;
				}
				case "MIN": {
					rounding = 1 * 60;
					break;
				}
				case "HOUR": {
					rounding = 1 * 60 * 60;
					break;
				}
				case "DAY": {
					rounding = 1 * 60 * 60 * 24;
					break;
				}
				default:
					break;
			}

			// Substracting 2 dates returns number of milliseconds
			let delta = Math.abs(start - end) / 1000;

			// Apply rounding
			delta = Math.round(delta / rounding) * rounding;
			output.total = delta;

			// calculate (and subtract) whole days
			output.diff.days = Math.floor(delta / 86400);
			delta -= output.diff.days * 86400;

			// calculate (and subtract) whole hours
			output.diff.hours = Math.floor(delta / 3600) % 24;
			delta -= output.diff.hours * 3600;

			// calculate (and subtract) whole minutes
			output.diff.minutes = Math.floor(delta / 60) % 60;
			delta -= output.diff.minutes * 60;

			// calculate whole seconds and subtract for milliseconds
			output.diff.seconds = Math.floor(delta);
			output.diff.milliseconds = Math.round((delta - Math.floor(delta)) * 1000);

			// Values
			output.values.seconds = output.total;
			output.values.minutes = output.values.seconds / 60;
			output.values.hours = output.values.minutes / 60;
			output.values.days = output.values.hours / 24;

			// Make string
			output.toString = function (withLeadingZeroes = false) {
				let string = toString(withLeadingZeroes, this);
				return string;
			};

			return output;
		};

		let output = null;
		startAt = new Date(startAt);
		endAt = new Date(endAt);
		if (!isNaN(startAt.getTime()) && !isNaN(endAt.getTime())) {
			output = {
				milliseconds: {},
				seconds: {},
				minutes: {},
				hours: {},
				days: {}
			};

			output.milliseconds = parse({ start: startAt, end: endAt, rounding: "MILLIS" });
			output.seconds = parse({ start: startAt, end: endAt, rounding: "SEC" });
			output.minutes = parse({ start: startAt, end: endAt, rounding: "MIN" });
			output.hours = parse({ start: startAt, end: endAt, rounding: "HOUR" });
			output.days = parse({ start: startAt, end: endAt, rounding: "DAY" });
		}

		return output;
	}

	static setCookie({ key, value }) {
		document.cookie = `${key}=${value}`;
	}

	static getCookie({ key }) {
		let output = null;

		document.cookie.split(";").find((cookie) => {
			let isFound = cookie.trim().startsWith(key + "=");
			if (isFound) {
				output = cookie.split("=")[1];
			}
			return isFound;
		});
		return output;
	}
}
