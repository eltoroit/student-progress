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
	}

	async renderedCallback() {
		if (!this.apexManager) {
			this.apexManager = this.template.querySelector("c-apex-manager");
			const creds = await Utils.validateStudentRegistration({
				apexManager: this.apexManager,
				deliveryId: this.deliveryId,
				studentId: this.studentId
			});
			if (creds) {
				this.showReportPage();
			} else {
				this.showRegistrationPage();
			}
		}
	}

	showRegistrationPage() {
		this.panel = PANEL_REGISTER;
	}

	onNext(event) {
		this.studentId = event.detail.studentId;
		this.deliveryId = event.detail.deliveryId;
		this.showReportPage();
	}

	onData(event) {
		const { obj, data } = event.detail;
		Utils.logger.log(`OnData: ${obj}`, JSON.parse(JSON.stringify(data)));
		const pnlRegister = this.template.querySelector("c-student-register");
		if (pnlRegister?.onData) {
			pnlRegister?.onData({ obj, data });
		}
	}

	async showReportPage() {
		this.readCookies();
		const creds = await Utils.validateStudentRegistration({
			apexManager: this.apexManager,
			deliveryId: this.deliveryId,
			studentId: this.studentId
		});
		if (creds) {
			this.panel = PANEL_REPORT;
			setTimeout(() => {
				// Timeout to show the next panel, before setting @api variables
				const studentReport = this.template.querySelector("c-student-report");
				studentReport.studentId = this.studentId;
				studentReport.deliveryId = this.deliveryId;
			}, 0);
		} else {
			this.showRegistrationPage();
		}
	}

	readCookies() {
		this.studentId = Utils.getCookie({ key: "studentId" });
		this.deliveryId = Utils.getCookie({ key: "deliveryId" });
	}
}
