import { api, LightningElement } from "lwc";
import { FlowAttributeChangeEvent } from "lightning/flowSupport";

export default class FlowElement extends LightningElement {
	@api txtItem = "";

	timer = null;
	_intQuantity = 0;
	errorMessage = null;

	@api
	get intQuantity() {
		return this._intQuantity;
	}
	set intQuantity(value) {
		this._intQuantity = 0;
		if (isNaN(value)) {
			this.errorMessage = "Must be a number!";
		} else if (value < 0) {
			this.errorMessage = "Must be a positive number!";
		} else {
			this._intQuantity = value;
			this.errorMessage = null;
		}
	}

	get message() {
		let message = `You are ordering: ${this.intQuantity} ${this.txtItem}`;
		if (this.intQuantity < 0) {
			message = "Error, must be a positive quantity";
		} else if (this.intQuantity > 1) {
			message = `${message}s`;
		}
		return message;
	}

	plus1() {
		this.intQuantity++;
	}

	minus1() {
		this.intQuantity--;
	}

	onSave() {
		this.dispatchEvent(new FlowAttributeChangeEvent("txtItem", this.txtItem));
		this.dispatchEvent(new FlowAttributeChangeEvent("intQuantity", this.intQuantity));
	}

	updateQuantity(event) {
		const value = event.target.value;
		clearTimeout(this.timer);
		// eslint-disable-next-line @lwc/lwc/no-async-operation
		this.timer = setTimeout(() => {
			this.intQuantity = value;
		}, 500);
	}

	updateItem(event) {
		this.txtItem = event.target.value;
	}
}
