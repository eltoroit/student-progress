import { LightningElement } from "lwc";

export default class FlowInLwc extends LightningElement {
	get inputVariables() {
		return [
			{
				name: "intQuantity",
				type: "Number",
				value: 10
			},
			{
				name: "txtItem",
				type: "String",
				value: "Pizza"
			}
		];
	}

	handleStatusChange(event) {
        const detail = JSON.parse(JSON.stringify(event.detail));
		console.log(detail);
		debugger;
	}
}
