import Utils from "c/utils";
import { api, LightningElement, track } from "lwc";
// import LightningPrompt from "lightning/prompt";

export default class StudentRegister extends LightningElement {
	loading = true;
	@api apexManager = null;
	@api isWaitForUpdate = false;

	deliveries = {
		options: [],
		records: [],
		currentId: null
	};

	students = {
		options: [],
		records: [],
		currentId: null
	};

	@track studentData = {
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
			label: this.students?.currentId === "CREATE" ? "Register" : "Update",
			isVisible:
				this.deliveries?.currentId && this.students?.currentId && (this.studentData.isChanged || this.students?.currentId === "CREATE"),
			isDisabled: !this.studentData.isValid
		};
		ui.btnNext = {
			isVisible: this.deliveries?.currentId && this.students?.currentId,
			isDisabled: !this.studentData.isValid || this.students?.currentId === "CREATE" || this.studentData.isChanged
		};
		ui.btnRefresh = {
			isVisible: true,
			isDisabled: false
		};

		ui.pnlDeliveries = true;
		ui.pnlRegister = this.students?.currentId;
		ui.pnlStudents = this.deliveries?.currentId;

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
			case "StudentsForDelivery": {
				this.loadStudentsForDelivery({ data });
				break;
			}
			case "Student__c": {
				this.apexManager.fetchStudentsForDelivery({ deliveryId: this.deliveries.currentId });
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
		const creds = await Utils.validateStudentRegistration({
			apexManager: this.apexManager,
			deliveryId: this.deliveryId,
			studentId: this.studentId
		});
		if (creds) {
			this.onNextClick();
		} else {
			Utils.logger.log("User needs to register");
			this.apexManager.fetchActiveDeliveries();
		}
	}

	onStudentFirstNameChange(event) {
		this.studentData.isChanged = true;
		this.studentData.firstName = event.target.value;
		if (!this.studentData.nickname || !this.studentData.nicknameChanged) {
			this.studentData.nicknameChanged = false;
			this.studentData.nickname = this.studentData.firstName;
		}
		this.checkInputs({ isChanging: true });
	}
	onStudentFirstNameBlur() {
		this.checkInputs({ isChanging: false });
	}

	onStudentLastNameChange(event) {
		this.studentData.isChanged = true;
		this.studentData.lastName = event.target.value;
		this.checkInputs({ isChanging: true });
	}

	onStudentNicknameChange(event) {
		this.studentData.isChanged = true;
		this.studentData.nickname = event.target.value;
		this.studentData.nicknameChanged = true;
		this.checkInputs({ isChanging: true });
		event.target.reportValidity();
	}
	onStudentNicknameBlur() {
		if (!this.studentData.nickname) {
			this.studentData.nickname = this.studentData.firstName;
			this.studentData.nicknameChanged = false;
			setTimeout(() => {
				this.checkInputs({ isChanging: true });
			}, 0);
		}
	}

	onStudentEmailChange(event) {
		this.studentData.isChanged = true;
		this.studentData.email = event.target.value;
		this.checkInputs({ isChanging: true });
	}

	async onRegisterClick() {
		this.loading = true;
		const student = {
			Id: this.studentData.currentId === "CREATE" ? null : this.studentData.currentId,
			Name: `${this.studentData.firstName} ${this.studentData.lastName}`,
			Delivery__c: this.deliveries.currentId,
			FirstName__c: this.studentData.firstName,
			LastName__c: this.studentData.lastName,
			Nickname__c: this.studentData.nickname,
			Email__c: this.studentData.email
		};
		if (student.FirstName__c !== student.Nickname__c) {
			student.Name = `${student.Nickname__c} (${student.Name})`;
		}
		const newStudentData = await this.apexManager.doRegisterStudent({ deliveryId: this.deliveries.currentId, student });
		this.studentData.newId = newStudentData.Id;
	}

	onNextClick() {
		this.dispatchEvent(new CustomEvent("next"));
	}

	checkInputs({ isChanging }) {
		const updateComponent = (cmp) => {
			cmp.focus();
			cmp.value = `${cmp.value}`;
			cmp.blur();
		};
		const cmps = Array.from(this.template.querySelectorAll(".validateMe"));

		if (!isChanging) {
			cmps.forEach((cmp) => updateComponent(cmp));
		}
		let isValid = cmps.every((cmp) => cmp.reportValidity());
		this.studentData.isValid = this.studentData.nickname && isValid;
	}
	//#endregion

	//#region OPTIONS
	onDeliveryChange(event) {
		this.selectDelivery({ currentId: event.target.value });
	}
	selectDelivery({ currentId }) {
		this.genericSelectOption({ currentId, objectName: "deliveries", cookieName: "deliveryId" });
		if (this.deliveries.currentId) {
			this.apexManager.fetchStudentsForDelivery({ deliveryId: this.deliveries.currentId });
		} else {
			this.students.currentId = null;
			this.selectStudent({ currentId: null });
			this.deliveries.currentId = null;
			// this.selectDelivery({ currentId: null });
		}
	}

	onStudentChange(event) {
		this.selectStudent({ currentId: event.target.value });
	}
	selectStudent({ currentId }) {
		const clearStudent = () => {
			this.studentData.currentId = null;
			this.studentData.firstName = null;
			this.studentData.lastName = null;
			this.studentData.nickname = null;
			this.studentData.email = null;
			this.studentData.isValid = false;
			this.studentData.isChanged = false;
			this.studentData.nicknameChanged = false;
		};

		this.genericSelectOption({ currentId, objectName: "students", cookieName: "studentId" });
		if (this.students.currentId === "CREATE") {
			clearStudent();
		} else {
			const studentRecord = Utils.findRecord({ list: this.students.records, Id: this.students.currentId });
			if (studentRecord) {
				this.studentData.currentId = studentRecord.Id;
				this.studentData.firstName = studentRecord.FirstName__c;
				this.studentData.lastName = studentRecord.LastName__c;
				this.studentData.nickname = studentRecord.Nickname__c;
				this.studentData.email = studentRecord.Email__c;
			} else {
				clearStudent();
			}
		}
		this.studentData.isChanged = false;
		this.studentData.nicknameChanged = this.studentData.firstName !== this.studentData.nickname;
		setTimeout(() => {
			this.checkInputs({ isChanging: false });
			if (!this.isWaitForUpdate && this.studentData.isValid) {
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
			debugger;
			this.students.currentId = null;
			this.selectStudent({ currentId: null });
			this.deliveries.currentId = null;
			this.selectDelivery({ currentId: null });
			this.loading = false;
		}
	}

	loadStudentsForDelivery({ data }) {
		let currentId = this.studentData.newId ? this.studentData.newId : this.students.currentId;
		this._loadData({
			objectName: "students",
			data,
			otherOptions: [{ value: "CREATE", label: "I'm not in your list" }]
		});
		if (Utils.findRecord({ list: this.students.records, Id: currentId })) {
			this.selectStudent({ currentId });
		} else {
			this.students.currentId = null;
			this.selectStudent({ currentId: null });
		}
		this.studentData.newId = null;
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
		this.students.currentId = Utils.getCookie({ key: "studentId" });
		this.deliveries.currentId = Utils.getCookie({ key: "deliveryId" });
	}
}
