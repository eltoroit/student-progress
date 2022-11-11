import { LightningElement } from "lwc";

export default class FlowInLwc extends LightningElement {
	get inputVariables() {
		return [
			{
				name: "intQuantity",
				type: "Number",
				value: 57
			},
			{
				name: "txtItem",
				type: "String",
				value: "Shoe"
			}
		];
	}

	handleStatusChange(event) {
		debugger;
		console.log(event.detail);
	}
}
