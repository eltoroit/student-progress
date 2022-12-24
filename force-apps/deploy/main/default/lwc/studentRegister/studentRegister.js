import Utils from "c/utils";
import { api, LightningElement, track } from "lwc";
// import LightningPrompt from "lightning/prompt";

export default class StudentRegister extends LightningElement {
	// timer = null;
	loading = true;
	// forceRefresh = 0;
	@api apexManager = null;

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

	@track student = {
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
			isVisible: this.deliveries?.currentId && this.students?.currentId,
			isDisabled: !this.student.isValid
		};
		ui.btnNext = {
			isVisible: this.deliveries?.currentId && this.students?.currentId && this.students?.currentId !== "CREATE",
			isDisabled: !this.student.isValid
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

	async connectedCallback() {
		this.readCookies();
		const creds = await Utils.validateStudentRegistration({
			apexManager: this.apexManager,
			deliveryId: this.deliveryId,
			studentId: this.studentId
		});
		if (creds) {
			// this.onNextClick();
		} else {
			Utils.logger.log("User needs to register");
			this.apexManager.fetchActiveDeliveries();
		}
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
			// case "CoursesPerDelivery": {
			// 	this.loadCoursesPerDelivery({ data });
			// 	break;
			// }
			// case "AllExercisesForCourse": {
			// 	this.loadExercisesForCourse({ data });
			// 	break;
			// }
			// case "DeliveryProgress": {
			// 	this.parseDeliveryProgress({ data });
			// 	break;
			// }
			// case "ExerciseProgress": {
			// 	this.parseExerciseProgress({ data });
			// 	break;
			// }
			// case "Exercise_X_Student__c": {
			// 	this.apexManager.fetchExerciseProgress({ deliveryId: this.deliveries.currentId, exerciseId: this.exercises.currentId });
			// 	this.apexManager.fetchDeliveryProgress({ deliveryId: this.deliveries.currentId });
			// 	break;
			// }
			default: {
				debugger;
				break;
			}
		}
	}

	onStudentFirstNameChange(event) {
		this.student.isChanged = true;
		this.student.firstName = event.target.value;
		if (!this.student.nickname || !this.student.nicknameChanged) {
			this.student.nicknameChanged = false;
			this.student.nickname = this.student.firstName;
		}
		this.checkInputs({ isChanging: true });
	}
	onStudentFirstNameBlur() {
		this.checkInputs({ isChanging: false });
	}

	onStudentLastNameChange(event) {
		this.student.isChanged = true;
		this.student.lastName = event.target.value;
		this.checkInputs({ isChanging: true });
	}

	onStudentNicknameChange(event) {
		this.student.isChanged = true;
		this.student.nickname = event.target.value;
		this.student.nicknameChanged = true;
		this.checkInputs({ isChanging: true });
		event.target.reportValidity();
	}

	onStudentEmailChange(event) {
		this.student.isChanged = true;
		this.student.email = event.target.value;
		this.checkInputs({ isChanging: true });
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
		this.student.isValid = this.student.nickname && isValid;
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
			this.student.currentId = null;
			this.student.firstName = null;
			this.student.lastName = null;
			this.student.nickname = null;
			this.student.email = null;
			this.student.isValid = false;
			this.student.isChanged = false;
			this.student.nicknameChanged = false;
		};

		this.genericSelectOption({ currentId, objectName: "students", cookieName: "studentId" });
		if (this.students.currentId === "CREATE") {
			clearStudent();
		} else {
			const studentRecord = Utils.findRecord({ list: this.students.records, Id: this.students.currentId });
			if (studentRecord) {
				this.student.currentId = studentRecord.Id;
				this.student.firstName = studentRecord.FirstName__c;
				this.student.lastName = studentRecord.LastName__c;
				this.student.nickname = studentRecord.Nickname__c;
				this.student.email = studentRecord.Email__c;
			} else {
				clearStudent();
			}
		}
		this.student.isChanged = false;
		this.student.nicknameChanged = false;
		setTimeout(() => {
			this.checkInputs({ isChanging: false });
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
		let currentId = this.students.currentId;
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

	// onRegisterClick() {
	// 	LightningPrompt.open({
	// 		label: "Registration", // this is the header text
	// 		message: "What's your name?",
	// 		variant: "header",
	// 		theme: "inverse",
	// 		defaultValue: ""
	// 	}).then((studentName) => {
	// 		if (studentName) {
	// 			registerStudent({ deliveryId: this.delivery.Id, studentName })
	// 				.then((student) => {
	// 					refreshApex(this.wiredStudents);
	// 					this.student = student;
	// 					Utils.setCookie({ key: "studentId", value: this.student.Id });
	// 				})
	// 				.catch((err) => {
	// 					Utils.logger.log(err);
	// 					debugger;
	// 				});
	// 		}
	// 	});
	// }

	// onNextClick() {
	// 	this.dispatchEvent(
	// 		new CustomEvent("next", {
	// 			detail: {
	// 				deliveryId: this.delivery.Id,
	// 				studentId: this.student.Id
	// 			}
	// 		})
	// 	);
	// }

	// async validateRegistrationJS() {
	// 	// clearInterval(this.timer);
	// 	// return new Promise((resolve, reject) => {
	// 	// 	await Utils.validateStudentRegistration({ apexManager: this.apexManager, deliveryId: this.deliveryId, studentId: this.studentId });
	// 	// 		.then((data) => {
	// 	// 			this.student = data.student;
	// 	// 			this.delivery = data.delivery;
	// 	// 			Utils.setCookie({ key: "studentId", value: this.student.Id });
	// 	// 			Utils.setCookie({ key: "deliveryId", value: this.delivery.Id });
	// 	// 			resolve();
	// 	// 		})
	// 	// 		.catch((err) => {
	// 	// 			this.student = {};
	// 	// 			this.delivery = {};
	// 	// 			Utils.deleteCookie({ key: "studentId" });
	// 	// 			Utils.deleteCookie({ key: "deliveryId" });

	// 	// 			// this.timer = setInterval(() => {
	// 	// 			Utils.logger.log("***Interval deliveries");
	// 	// 			if (this.delivery.Id === "") {
	// 	// 				Utils.logger.log(`REFRESH ${this.delivery.Id}`);
	// 	// 				this.onRefreshClick();
	// 	// 			} else {
	// 	// 				Utils.logger.log(`CLEAR ${this.delivery.Id}`);
	// 	// 				clearInterval(this.timer);
	// 	// 			}
	// 	// 			// }, 5e3);

	// 	// 			reject(err);
	// 	// 		});
	// 	// });
	// }

	readCookies() {
		this.students.currentId = Utils.getCookie({ key: "studentId" });
		this.deliveries.currentId = Utils.getCookie({ key: "deliveryId" });
	}
}
