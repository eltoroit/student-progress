import Utils from "c/utils";
import { LightningElement } from "lwc";

const PANEL_REPORT = "REPORT";
const PANEL_REGISTER = "REGISTER";

export default class Student extends LightningElement {
	studentId = null;
	deliveryId = null;
	filterKey = null;
	filterValue = null;
	apexManager = null;
	panel = PANEL_REGISTER;

	get ui() {
		const ui = {};

		ui.pnlReport = this.apexManager && this.panel === PANEL_REPORT;
		ui.pnlRegister = this.apexManager && this.panel === PANEL_REGISTER;

		return ui;
	}

	connectedCallback() {
		debugger;
		setTimeout(async () => {
			this.apexManager = this.template.querySelector("c-apex-manager");
			try {
				await Utils.validateStudentRegistration({ apexManager: this.apexManager, deliveryId: this.deliveryId, studentId: this.studentId });
				this.showReportPage();
			} catch (ex) {
				this.showRegistrationPage();
			}
		}, 0);
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
			this.readCookies();
			await Utils.validateStudentRegistration({ apexManager: this.apexManager, deliveryId: this.deliveryId, studentId: this.studentId });
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

	readCookies() {
		this.studentId = Utils.getCookie({ key: "studentId" });
		this.deliveryId = Utils.getCookie({ key: "deliveryId" });
	}
}
