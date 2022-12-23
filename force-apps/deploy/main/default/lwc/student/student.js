import Utils from "c/utils";
import { LightningElement } from "lwc";

const PANEL_REPORT = "REPORT";
const PANEL_REGISTER = "REGISTER";

export default class Student extends LightningElement {
	studentId = null;
	deliveryId = null;
	filterKey = null;
	filterValue = null;
	dataManager = null;
	panel = PANEL_REGISTER;

	get ui() {
		const ui = {};

		ui.pnlReport = this.dataManager && this.panel === PANEL_REPORT;
		ui.pnlRegister = this.dataManager && this.panel === PANEL_REGISTER;

		return ui;
	}

	connectedCallback() {
		debugger;
		setTimeout(async () => {
			this.dataManager = this.template.querySelector("c-data-manager");
			try {
				await this.validateRegistrationJS();
				this.showReportPage();
			} catch (ex) {
				this.showRegistrationPage();
			}
		}, 0);
		this.studentId = Utils.getCookie({ key: "studentId" });
		this.deliveryId = Utils.getCookie({ key: "deliveryId" });
	}

	showRegistrationPage() {
		this.panel = PANEL_REGISTER;
	}

	onNext(event) {
		this.studentId = event.detail.studentId;
		this.deliveryId = event.detail.deliveryId;
		this.showReportPage();
	}

	async showReportPage() {
		try {
			await this.validateRegistrationJS();
			this.panel = PANEL_REPORT;
			setTimeout(() => {
				// Timeout to show the next panel, before setting @api variables
				const studentReport = this.template.querySelector("c-student-report");
				studentReport.studentId = this.studentId;
				studentReport.deliveryId = this.deliveryId;
			}, 0);
		} catch (ex) {
			this.showRegistrationPage();
		}
	}

	async validateRegistrationJS() {
		debugger;
		try {
			if (this.deliveryId == null && this.studentId == null) {
				throw new Error("No registration information available");
			}

			const data = await this.dataManager.doValidateRegistration({ deliveryId: this.deliveryId, studentId: this.studentId });
			this.studentId = data.student.Id;
			this.deliveryId = data.delivery.Id;
			Utils.setCookie({ key: "deliveryId", value: this.deliveryId });
			Utils.setCookie({ key: "studentId", value: this.studentId });
		} catch (ex) {
			this.studentId = null;
			this.deliveryId = null;
			Utils.deleteCookie({ key: "deliveryId" });
			Utils.deleteCookie({ key: "studentId" });
			throw new Error(ex.body.message);
		}
	}
}
