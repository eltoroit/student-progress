import Utils from "c/utils";
import { LightningElement } from "lwc";

const PANEL_REPORT = "REPORT";
const PANEL_REGISTER = "REGISTER";

export default class Student extends LightningElement {
	panel = PANEL_REGISTER;

	selectedStudentId;
	selectedDeliveryId;

	get ui() {
		const ui = {};
		
		ui.pnlReport = this.panel === PANEL_REPORT;
		ui.pnlRegister = this.panel === PANEL_REGISTER;

		return ui;
	}

	connectedCallback() {
		this.selectedStudentId = Utils.getCookie({ key: "selectedStudentId" });
		this.selectedDeliveryId = Utils.getCookie({ key: "selectedDeliveryId" });
		if (this.selectedStudentId && this.selectedDeliveryId) {
			this.showReportPage();
		}
	}

	onNext(event) {
		this.panel = PANEL_REPORT;
		this.selectedStudentId = event.detail.studentId;
		this.selectedDeliveryId = event.detail.deliveryId;
		this.showReportPage();
	}

	onRegister() {
		this.panel = PANEL_REGISTER;
	}

	showReportPage() {
		this.panel = PANEL_REPORT;
		setTimeout(() => {
			const studentReport = this.template.querySelector("c-student-report");
			studentReport.studentId = this.selectedStudentId;
			studentReport.deliveryId = this.selectedDeliveryId;
		}, 0);
	}
}
