import { api, LightningElement } from "lwc";
import AttendeesSR from "@salesforce/resourceUrl/Attendees";

export default class Image extends LightningElement {
	@api maxWidth;
	@api maxHeight;
	_pathInSr;
	counter = 0;
	url = "";

	@api
	get pathInSr() {
		return this._pathInSr;
	}
	set pathInSr(value) {
		this._pathInSr = value;
		this.computeUrl();
	}

	computeUrl() {
		this.url = `${AttendeesSR}/${this.pathInSr}?counter=${this.counter}`;
	}

	connectedCallback() {
		setInterval(() => {
			this.counter++;
			this.computeUrl();
		}, 5e3);
	}

	renderedCallback() {
		console.log("Image renderedCallback");
	}

	get style() {
		let output = "";
		if (this.maxWidth) {
			output += `width:${typeof this.maxWidth === "number" ? `${this.maxWidth}px` : this.maxWidth};`;
			output += `max-width:${typeof this.maxWidth === "number" ? `${this.maxWidth}px` : this.maxWidth};`;
		}
		if (this.maxHeight) {
			output += `height:${typeof this.maxHeight === "number" ? `${this.maxHeight}px` : this.maxHeight};`;
			output += `max-height:${typeof this.maxHeight === "number" ? `${this.maxHeight}px` : this.maxHeight};`;
		}
		return output;
	}
}
