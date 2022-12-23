import Utils from "c/utils";
import { api, LightningElement } from "lwc";
// import LightningPrompt from "lightning/prompt";

export default class StudentRegister extends LightningElement {
	// timer = null;
	// loading = true;
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

	get ui() {
		const ui = {};

		ui.btnRegister = {
			isVisible: this.deliveries?.currentId && this.students?.currentId === "CREATE",
			isDisabled: false
		};
		ui.btnNext = {
			isVisible: this.deliveries?.currentId && this.students?.currentId && this.students?.currentId !== "CREATE",
			isDisabled: false
		};
		ui.btnRefresh = {
			isVisible: true,
			isDisabled: false
		};

		ui.pnlDeliveries = true;
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
			this.apexManager.fetchActiveDeliveriesWithCourses();
		}
	}

	@api
	onData({ obj, data }) {
		switch (obj) {
			case "ActiveDeliveriesWithCourses": {
				this.loadActiveDeliveriesWithCourses({ data });
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

	onDeliveryChange(event) {
		this.selectDelivery({ currentId: event.target.value });
	}

	selectDelivery({ currentId }) {
		debugger;
		this.genericSelectOption({ currentId, objectName: "deliveries", cookieName: "deliveryId" });
		// this.apexManager.fetchCoursesPerDelivery({ deliveryId: this.deliveries.currentId });
		// this.parseActiveExerciseInformation();
		// this.apexManager.fetchDeliveryProgress({ deliveryId: this.deliveries.currentId });
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

	loadActiveDeliveriesWithCourses({ data }) {
		let currentId = this.deliveries.currentId;
		this._loadData({ objectName: "deliveries", data, placeholder: "Which class are you attending?" });
		if (Utils.findRecord({ list: this.deliveries.records, Id: currentId })) {
			// 	this.selectDelivery({ currentId });
		} else {
			// 	this.courses.currentId = null;
			// 	this.selectCourse({ currentId: null });
			// 	this.exercises.activeId = null;
			// 	this.exercises.currentId = null;
			// 	this.selectExercise({ currentId: null });
			// 	this.deliveries.currentId = null;
			// 	this.selectDelivery({ currentId: null });
			// 	this.loading = false;
		}
	}

	_loadData({ objectName, data, placeholder }) {
		this[objectName] = { ...this[objectName] };
		this[objectName].records = data;
		this[objectName].options = data.map((record) => ({
			value: record.Id,
			label: record.Name
		}));
		this[objectName].options.unshift({ value: "", label: placeholder });
	}

	// @wire(getActiveDeliveries, { forceRefresh: "$forceRefresh" })
	// wired_GetActiveDeliveries(result) {
	// 	this.wiredDeliveries = result;
	// 	let { data, error } = result;
	// 	if (data) {
	// 		this.deliveries = data.map((delivery) => ({
	// 			delivery,
	// 			value: delivery.Id,
	// 			label: `${delivery.Name} (${delivery.Instructor__c})`
	// 		}));
	// 		if (data.length === 1) {
	// 			this.delivery.Id = data[0].Id;
	// 			Utils.setCookie({ key: "deliveryId", value: this.delivery.Id });
	// 		}
	// 		this.deliveries.unshift({ value: "", label: "Which class are you attending?" });
	// 		this.loading = false;
	// 	} else if (error) {
	// 		Utils.showNotification(this, {
	// 			title: "Error",
	// 			message: "Error getting deliveries",
	// 			variant: Utils.variants.error
	// 		});
	// 		Utils.logger.log(error);
	// 		this.loading = false;
	// 	}
	// }

	// // Can you use a getter?
	// @wire(getStudentsForDelivery, { deliveryId: "$deliveryId", forceRefresh: "$forceRefresh" })
	// wired_GetStudentsForDelivery(result) {
	// 	this.wiredStudents = result;
	// 	let { data, error } = result;
	// 	if (data) {
	// 		this.students = data.map((student) => ({
	// 			student,
	// 			value: student.Id,
	// 			label: student.Name
	// 		}));
	// 		this.students.unshift({ value: "", label: "What's your name?" });
	// 		this.students.push({ value: "CREATE", label: "I'm not in your list" });
	// 		this.loading = false;
	// 	} else if (error) {
	// 		Utils.showNotification(this, {
	// 			title: "Error",
	// 			message: "Error getting deliveries",
	// 			variant: Utils.variants.error
	// 		});
	// 		Utils.logger.log(error);
	// 		this.loading = false;
	// 	}
	// }

	// onDeliveryChange(event) {
	// 	this.loading = true;
	// 	const Id = event.target.value;
	// 	const option = this.deliveries.find((delivery) => delivery.value === Id);
	// 	this.delivery = option.delivery;
	// 	Utils.setCookie({ key: "deliveryId", value: this.delivery.Id });
	// }

	// onStudentChange(event) {
	// 	const Id = event.target.value;
	// 	const option = this.students.find((student) => student.value === Id);
	// 	if (option.student) {
	// 		this.student = option.student;
	// 		Utils.setCookie({ key: "studentId", value: this.student.Id });
	// 	} else {
	// 		this.student = { Id: option.value };
	// 	}
	// }

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

	// onRefreshClick() {
	// 	this.loading = false;
	// 	this.forceRefresh++;
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
