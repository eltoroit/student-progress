import Utils from "c/utils";
import { LightningElement } from "lwc";

const PANEL_REPORT = "REPORT";
const PANEL_REGISTER = "REGISTER";

export default class Attendee extends LightningElement {
	attendeeId = null;
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
			const creds = await Utils.validateAttendeeRegistration({
				apexManager: this.apexManager,
				deliveryId: this.deliveryId,
				attendeeId: this.attendeeId
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
			const pnlRegister = this.template.querySelector("c-attendee-register");
			if (pnlRegister?.onData) {
				pnlRegister?.onData({ obj, data });
			}
		}
		if (this.ui.pnlReport) {
			const pnlReport = this.template.querySelector("c-attendee-report");
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
		const creds = await Utils.validateAttendeeRegistration({
			apexManager: this.apexManager,
			deliveryId: this.deliveryId,
			attendeeId: this.attendeeId
		});
		if (creds) {
			this.panel = PANEL_REPORT;
			setTimeout(() => {
				this.template.querySelector("c-attendee-report").onPanelLoad();
			}, 0);
		} else {
			this.showRegistrationPage({ isWaitForUpdate: true });
		}
	}

	showRegistrationPage({ isWaitForUpdate }) {
		this.panel = PANEL_REGISTER;
		setTimeout(() => {
			const cmp = this.template.querySelector("c-attendee-register");
			cmp.onPanelLoad();
			cmp.isWaitForUpdate = isWaitForUpdate;
		}, 0);
	}

	readCookies() {
		this.attendeeId = Utils.getCookie({ key: "attendeeId" });
		this.deliveryId = Utils.getCookie({ key: "deliveryId" });
	}
}
