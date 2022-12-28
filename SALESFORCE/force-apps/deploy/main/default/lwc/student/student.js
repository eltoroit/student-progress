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
	iostatusEventData = null;

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
				this.showRegistrationPage({ isWaitForUpdate: false });
			}
		}
	}

	onShowRegistrationPage() {
		this.showRegistrationPage({ isWaitForUpdate: true });
	}

	onNext() {
		this.showReportPage();
	}

	onData(event) {
		const { obj, data } = event.detail;
		Utils.logger.log(`OnData: ${obj}`, JSON.parse(JSON.stringify(data)));
		if (this.ui.pnlRegister) {
			const pnlRegister = this.template.querySelector("c-student-register");
			if (pnlRegister?.onData) {
				pnlRegister?.onData({ obj, data });
			}
		}
		if (this.ui.pnlReport) {
			const pnlReport = this.template.querySelector("c-student-report");
			if (pnlReport?.onData) {
				pnlReport?.onData({ obj, data });
			}
		}
	}

	onIOStatus(event) {
		this.iostatusEventData = event.detail;
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
				this.template.querySelector("c-student-report").onPanelLoad();
			}, 0);
		} else {
			this.showRegistrationPage({ isWaitForUpdate: true });
		}
	}

	showRegistrationPage({ isWaitForUpdate }) {
		this.panel = PANEL_REGISTER;
		setTimeout(() => {
			const cmp = this.template.querySelector("c-student-register");
			cmp.onPanelLoad();
			cmp.isWaitForUpdate = isWaitForUpdate;
		}, 0);
	}

	readCookies() {
		this.studentId = Utils.getCookie({ key: "studentId" });
		this.deliveryId = Utils.getCookie({ key: "deliveryId" });
	}
}
