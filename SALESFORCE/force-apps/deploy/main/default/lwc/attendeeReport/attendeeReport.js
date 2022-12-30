import Utils from "c/utils";
import { api, LightningElement, track } from "lwc";

export default class Attendee extends LightningElement {
	loading = true;
	@api apexManager = null;

	@track attendeeData = {
		errorMessage: "",
		attendeeId: null,
		attendee: null,
		deliveryId: null,
		delivery: null,
		exerciseId: null,
		exercise: null,
		exerciseStatus: null,
		get attendeeName() {
			return this.attendee?.Name__c;
		},
		get deliveryName() {
			return this.delivery?.Name;
		},
		get exerciseName() {
			return this.exercise?.Name;
		}
	};

	get ui() {
		const ui = {};

		ui.pnlDelivery = this.attendeeData?.deliveryId && this.attendeeData?.deliveryId === this.attendeeData?.delivery?.Id;
		ui.pnlAttendee = this.attendeeData?.attendeeId && this.attendeeData?.attendeeId === this.attendeeData?.attendee?.Id;
		ui.pnlExercise = this.attendeeData?.exerciseId && this.attendeeData?.exerciseId === this.attendeeData?.exercise?.Id;
		return ui;
	}

	//#region EVENTS
	@api
	onData({ obj, data }) {
		Utils.logger.log(`onData ${obj}`, JSON.parse(JSON.stringify(data)));
		switch (obj) {
			case "AttendeeDataByAttendeeId": {
				this.loadAttendeeDataByAttendeeId({ data });
				break;
			}
			case "EXERCISE":
			case "Delivery__c": {
				this.apexManager.fetchAttendeeDataByAttendeeId({ attendeeId: this.attendeeData.attendeeId });
				break;
			}
			case "Exercise_X_Attendee__c": {
				this.loading = false;
				break;
			}
			default: {
				debugger;
				break;
			}
		}
	}

	@api
	async onPanelLoad() {
		this.readCookies();
		const creds = await Utils.validateAttendeeRegistration({
			apexManager: this.apexManager,
			deliveryId: this.attendeeData.deliveryId,
			attendeeId: this.attendeeData.attendeeId
		});
		if (creds) {
			this.apexManager.fetchAttendeeDataByAttendeeId({ attendeeId: this.attendeeData.attendeeId });
		} else {
			this.onRegisterClick();
		}
	}

	onRegisterClick() {
		this.dispatchEvent(new CustomEvent("register"));
	}

	onDoneClick() {
		this.updateStatus(Utils.STATES.DONE());
	}
	onWorkingClick() {
		this.updateStatus(Utils.STATES.WORKING());
	}
	onLaterClick() {
		this.updateStatus(Utils.STATES.LATER());
	}
	updateStatus(status) {
		this.loading = true;
		this.apexManager.doUpdateAttendeeStatus({ exerciseId: this.attendeeData.exerciseId, attendeeId: this.attendeeData.attendeeId, status });
	}
	//#endregion

	//#region LOAD DATA
	loadAttendeeDataByAttendeeId({ data }) {
		// Object.assign(this.attendeeData, data);
		this.attendeeData.attendeeId = data.attendeeId;
		this.attendeeData.attendee = data.attendee;
		this.attendeeData.deliveryId = data.deliveryId;
		this.attendeeData.delivery = data.delivery;
		this.attendeeData.exerciseId = data.exerciseId;
		this.attendeeData.exercise = data.exercise;
		this.attendeeData.exerciseStatus = data.exerciseStatus;
		this.loading = false;
	}
	//#endregion

	readCookies() {
		this.attendeeData.attendeeId = Utils.getCookie({ key: "attendeeId" });
		this.attendeeData.deliveryId = Utils.getCookie({ key: "deliveryId" });
	}
}
