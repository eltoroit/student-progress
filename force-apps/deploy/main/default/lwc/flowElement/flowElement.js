import { api, LightningElement } from "lwc";
import { FlowAttributeChangeEvent } from "lightning/flowSupport";

export default class FlowElement extends LightningElement {
	_counter = 0;
	errorCount = 0;
	errorMessage = "";
	timer = null;

	@api
	get txtCounter() {
		return `${this.counter}`;
	}
	set txtCounter(value) {
		this.counter = value.replaceAll('"', "").replaceAll("'", "");
	}

	@api
	get intCounter() {
		return `${this.counter}`;
	}
	set intCounter(value) {
		// this.counter = value;
	}

	get counter() {
		return this._counter;
	}
	set counter(value) {
		if (isNaN(value)) {
			this.errorCount++;
			this._counter = 0;
			this.errorMessage = "Must be a number!";
		} else if (value < 0) {
			this.errorCount++;
			this._counter = 0;
			this.errorMessage = "Must be a positive number!";
		} else {
			this.errorCount = 0;
			this._counter = value;
			this.errorMessage = "";
		}
	}

	plus1() {
		this.counter++;
	}

	onSave() {
		this.dispatchEvent(new FlowAttributeChangeEvent("intCounter", this.counter));
		this.dispatchEvent(new FlowAttributeChangeEvent("txtCounter", this.counter));
	}

	updateCounter(event) {
		const value = event.target.value;
		clearTimeout(this.timer);
		// eslint-disable-next-line @lwc/lwc/no-async-operation
		this.timer = setTimeout(() => {
			this.counter = value;
		}, 500);
	}
}
