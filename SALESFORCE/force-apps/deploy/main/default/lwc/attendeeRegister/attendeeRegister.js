import Utils from "c/utils";
import { api, LightningElement, track } from "lwc";
// import LightningPrompt from "lightning/prompt";

export default class AttendeeRegister extends LightningElement {
	loading = true;
	@api apexManager = null;
	@api isWaitForUpdate = false;

	deliveries = {
		options: [],
		records: [],
		currentId: null
	};

	attendees = {
		options: [],
		records: [],
		currentId: null
	};

	@track attendeeData = {
		newId: null,
		currentId: null,
		firstName: null,
		lastName: null,
		nickname: null,
		email: null,
		isValid: false,
		isChanged: false,
		nicknameChanged: false
	};

	get ui() {
		const ui = {};

		ui.btnRegister = {
			label: this.attendees?.currentId === "CREATE" ? "Register" : "Update",
			isVisible:
				this.deliveries?.currentId && this.attendees?.currentId && (this.attendeeData.isChanged || this.attendees?.currentId === "CREATE"),
			isDisabled: !this.attendeeData.isValid
		};
		ui.btnNext = {
			isVisible: this.deliveries?.currentId && this.attendees?.currentId,
			isDisabled: !this.attendeeData.isValid || this.attendees?.currentId === "CREATE" || this.attendeeData.isChanged
		};
		ui.btnRefresh = {
			isVisible: true,
			isDisabled: false
		};

		ui.pnlDeliveries = true;
		ui.pnlRegister = this.attendees?.currentId;
		ui.pnlAttendees = this.deliveries?.currentId;

		return ui;
	}

	//#region EVENTS
	@api
	onData({ obj, data }) {
		switch (obj) {
			case "ActiveDeliveries": {
				this.loadActiveDeliveries({ data });
				break;
			}
			case "ActiveDeliveriesWithCourses": {
				// Ignore
				break;
			}
			case "AttendeesForDelivery": {
				this.loadAttendeesForDelivery({ data });
				break;
			}
			case "Delivery__c": {
				this.apexManager.fetchActiveDeliveries();
				break;
			}
			case "Attendee__c": {
				this.apexManager.fetchAttendeesForDelivery({ deliveryId: this.deliveries.currentId });
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
			deliveryId: this.deliveryId,
			attendeeId: this.attendeeId
		});
		if (creds) {
			this.onNextClick();
		} else {
			Utils.logger.log("User needs to register");
			this.apexManager.fetchActiveDeliveries();
		}
	}

	onAttendeeFirstNameChange(event) {
		this.attendeeData.isChanged = true;
		this.attendeeData.firstName = event.target.value;
		if (!this.attendeeData.nickname || !this.attendeeData.nicknameChanged) {
			this.attendeeData.nicknameChanged = false;
			this.attendeeData.nickname = this.attendeeData.firstName;
		}
		this.checkInputs({ isChanging: true });
	}
	onAttendeeFirstNameBlur() {
		this.checkInputs({ isChanging: false });
	}

	onAttendeeLastNameChange(event) {
		this.attendeeData.isChanged = true;
		this.attendeeData.lastName = event.target.value;
		this.checkInputs({ isChanging: true });
	}

	onAttendeeNicknameChange(event) {
		this.attendeeData.isChanged = true;
		this.attendeeData.nickname = event.target.value;
		this.attendeeData.nicknameChanged = true;
		this.checkInputs({ isChanging: true });
		event.target.reportValidity();
	}
	onAttendeeNicknameBlur() {
		if (!this.attendeeData.nickname) {
			this.attendeeData.nickname = this.attendeeData.firstName;
			this.attendeeData.nicknameChanged = false;
			setTimeout(() => {
				this.checkInputs({ isChanging: true });
			}, 0);
		}
	}

	onAttendeeEmailChange(event) {
		this.attendeeData.isChanged = true;
		this.attendeeData.email = event.target.value;
		this.checkInputs({ isChanging: true });
	}

	async onRegisterClick() {
		this.loading = true;
		const attendee = {
			Id: this.attendeeData.currentId === "CREATE" ? null : this.attendeeData.currentId,
			Name: `${this.attendeeData.firstName} ${this.attendeeData.lastName}`,
			Delivery__c: this.deliveries.currentId,
			FirstName__c: this.attendeeData.firstName,
			LastName__c: this.attendeeData.lastName,
			Nickname__c: this.attendeeData.nickname,
			Email__c: this.attendeeData.email
		};
		if (attendee.FirstName__c !== attendee.Nickname__c) {
			attendee.Name = `${attendee.Nickname__c} (${attendee.Name})`;
		}
		const newAttendeeData = await this.apexManager.doRegisterAttendee({ deliveryId: this.deliveries.currentId, attendee });
		this.attendeeData.newId = newAttendeeData.Id;
	}

	onNextClick() {
		this.dispatchEvent(new CustomEvent("next"));
	}

	checkInputs({ isChanging }) {
		const updateComponent = (cmp) => {
			const cmpValue = cmp.value ? cmp.value : null;
			const storedValue = this.attendeeData[cmp.name] ? this.attendeeData[cmp.name] : null;
			if (cmpValue !== storedValue) {
				cmp.focus();
				cmp.value = `${cmp.value}`;
				cmp.blur();
			}
		};
		const cmps = Array.from(this.template.querySelectorAll(".validateMe"));

		if (!isChanging) {
			cmps.forEach((cmp) => updateComponent(cmp));
		}
		let isValid = cmps.every((cmp) => cmp.reportValidity());
		this.attendeeData.isValid = this.attendeeData.nickname && isValid;
	}
	//#endregion

	//#region OPTIONS
	onDeliveryChange(event) {
		const currentId = event.target.value;
		if (currentId !== this.deliveries.currentId) {
			this.selectDelivery({ currentId });
		}
	}
	selectDelivery({ currentId }) {
		this.genericSelectOption({ currentId, objectName: "deliveries", cookieName: "deliveryId" });
		if (this.deliveries.currentId) {
			this.apexManager.fetchAttendeesForDelivery({ deliveryId: this.deliveries.currentId });
		} else {
			this.attendees.currentId = null;
			this.selectAttendee({ currentId: null });
			this.deliveries.currentId = null;
			// this.selectDelivery({ currentId: null });
		}
	}

	onAttendeeChange(event) {
		const currentId = event.target.value;
		if (currentId !== this.attendees.currentId) {
			this.selectAttendee({ currentId });
		}
	}
	selectAttendee({ currentId }) {
		const clearAttendee = () => {
			this.attendeeData.currentId = null;
			this.attendeeData.firstName = null;
			this.attendeeData.lastName = null;
			this.attendeeData.nickname = null;
			this.attendeeData.email = null;
			this.attendeeData.isValid = false;
			this.attendeeData.isChanged = false;
			this.attendeeData.nicknameChanged = false;
		};

		this.genericSelectOption({ currentId, objectName: "attendees", cookieName: "attendeeId" });
		if (this.attendees.currentId === "CREATE") {
			clearAttendee();
		} else {
			const attendeeRecord = Utils.findRecord({ list: this.attendees.records, Id: this.attendees.currentId });
			if (attendeeRecord) {
				this.attendeeData.currentId = attendeeRecord.Id;
				this.attendeeData.firstName = attendeeRecord.FirstName__c;
				this.attendeeData.lastName = attendeeRecord.LastName__c;
				this.attendeeData.nickname = attendeeRecord.Nickname__c;
				this.attendeeData.email = attendeeRecord.Email__c;
			} else {
				clearAttendee();
			}
		}
		this.attendeeData.isChanged = false;
		this.attendeeData.nicknameChanged = this.attendeeData.firstName !== this.attendeeData.nickname;
		setTimeout(() => {
			this.checkInputs({ isChanging: false });
			if (!this.isWaitForUpdate && this.attendeeData.isValid) {
				this.onNextClick();
			}
		}, 0);
	}

	genericSelectOption({ currentId, objectName, cookieName }) {
		if (currentId === "") currentId = null;
		this[objectName] = { ...this[objectName] };
		this[objectName].currentId = currentId;
		if (currentId) {
			Utils.setCookie({ key: cookieName, value: currentId });
		} else {
			Utils.deleteCookie({ key: cookieName });
		}
	}
	//#endregion

	//#region LOAD DATA
	loadActiveDeliveries({ data }) {
		let currentId = this.deliveries.currentId;
		this._loadData({
			objectName: "deliveries",
			data,
			otherOptions: [{ value: "", label: "Which class are you attending?" }],
			formatter: (record) => `${record.Name} (${record.Instructor__c})`
		});
		if (Utils.findRecord({ list: this.deliveries.records, Id: currentId })) {
			this.selectDelivery({ currentId });
		} else {
			this.attendees.currentId = null;
			this.selectAttendee({ currentId: null });
			this.deliveries.currentId = null;
			this.selectDelivery({ currentId: null });
			this.loading = false;
		}
	}

	loadAttendeesForDelivery({ data }) {
		let currentId = this.attendeeData.newId ? this.attendeeData.newId : this.attendees.currentId;
		this._loadData({
			objectName: "attendees",
			data,
			otherOptions: [{ value: "CREATE", label: "I'm not in your list" }]
		});
		if (Utils.findRecord({ list: this.attendees.records, Id: currentId })) {
			this.selectAttendee({ currentId });
		} else {
			this.attendees.currentId = null;
			this.selectAttendee({ currentId: null });
		}
		this.attendeeData.newId = null;
		this.loading = false;
	}

	_loadData({ objectName, data, otherOptions, formatter }) {
		this[objectName] = { ...this[objectName] };
		this[objectName].records = data;
		this[objectName].options = data.map((record) => {
			let option = {
				value: record.Id,
				label: record.Name
			};
			if (formatter) {
				option.label = formatter(record);
			}
			return option;
		});
		otherOptions.forEach((option) => this[objectName].options.unshift(option));
	}
	//#endregion

	readCookies() {
		this.attendees.currentId = Utils.getCookie({ key: "attendeeId" });
		this.deliveries.currentId = Utils.getCookie({ key: "deliveryId" });
	}
}
