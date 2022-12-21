import Utils from "c/utils";
import { LightningElement } from "lwc";
import validateRegistration from "@salesforce/apex/Student.validateRegistration";

const PANEL_REPORT = "REPORT";
const PANEL_REGISTER = "REGISTER";

export default class Student extends LightningElement {
	panel = PANEL_REGISTER;

	_studentId = "";
	_deliveryId = "";

	get ui() {
		const ui = {};

		ui.pnlReport = this.panel === PANEL_REPORT;
		ui.pnlRegister = this.panel === PANEL_REGISTER;

		return ui;
	}

	get studentId() {
		return this._studentId;
	}

	set studentId(value) {
		if (!value) {
			value = "";
		}
		this._studentId = value;
	}

	get deliveryId() {
		return this._deliveryId;
	}

	set deliveryId(value) {
		if (!value) {
			value = "";
		}
		this._deliveryId = value;
	}

	async connectedCallback() {
		this.studentId = Utils.getCookie({ key: "studentId" });
		this.deliveryId = Utils.getCookie({ key: "deliveryId" });
		try {
			await this.validateRegistrationJS();
			this.showReportPage();
		} catch (ex) {
			this.showRegistrationPage();
		}
	}

	onNext(event) {
		this.studentId = event.detail.studentId;
		this.deliveryId = event.detail.deliveryId;
		this.showReportPage();
	}

	showRegistrationPage() {
		this.panel = PANEL_REGISTER;
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
		return new Promise((resolve, reject) => {
			validateRegistration({ deliveryId: this.deliveryId, studentId: this.studentId })
				.then((data) => {
					this.studentId = data.student.Id;
					this.deliveryId = data.delivery.Id;
					Utils.setCookie({ key: "deliveryId", value: this.deliveryId });
					Utils.setCookie({ key: "studentId", value: this.studentId });
					resolve();
				})
				.catch((err) => {
					this.studentId = "";
					this.deliveryId = "";
					Utils.setCookie({ key: "deliveryId", value: this.deliveryId });
					Utils.setCookie({ key: "studentId", value: this.studentId });
					reject(err);
				});
		});
	}
}
