import { LightningElement } from "lwc";

const PANEL_REPORT = "REPORT";
const PANEL_REGISTER = "REGISTER";

export default class Student extends LightningElement {
	panel = PANEL_REGISTER;

	get ui() {
		const ui = {};
		ui.pnlReport = this.panel === PANEL_REPORT;
		ui.pnlRegister = this.panel === PANEL_REGISTER;

		return ui;
	}

	onNext(event) {
		this.panel = PANEL_REPORT;
		setTimeout(() => {
			console.log(event.detail.deliveryId);
		}, 0);
	}
}
