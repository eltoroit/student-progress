import { LightningElement } from "lwc";

export default class FlowInLwc extends LightningElement {
	get inputVariables() {
		return [
			{
				name: "intCounter",
				type: "Integer",
				value: 57
			},
			{
				name: "strCounter",
				type: "String",
				value: "Pizza"
			}
		];
	}

	handleStatusChange(event) {
		debugger;
		console.log(event.detail);
	}
}
