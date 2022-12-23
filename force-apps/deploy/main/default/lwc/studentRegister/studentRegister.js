import Utils from "c/utils";
import { LightningElement } from "lwc";
// import { refreshApex } from "@salesforce/apex";
import LightningPrompt from "lightning/prompt";
// import registerStudent from "@salesforce/apex/Student.registerStudent";
// import getActiveDeliveries from "@salesforce/apex/Student.getActiveDeliveries";
// import validateRegistration from "@salesforce/apex/Student.validateRegistration";
// import getStudentsForDelivery from "@salesforce/apex/Student.getStudentsForDelivery";

export default class StudentRegister extends LightningElement {
	// timer = null;
	// loading = true;
	// forceRefresh = 0;

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

	connectedCallback() {
		this.readCookies();
		this.validateRegistrationJS()
			.then(() => {})
			.catch(() => {});
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

	onDeliveryChange(event) {
		this.loading = true;
		const Id = event.target.value;
		const option = this.deliveries.find((delivery) => delivery.value === Id);
		this.delivery = option.delivery;
		Utils.setCookie({ key: "deliveryId", value: this.delivery.Id });
	}

	onStudentChange(event) {
		const Id = event.target.value;
		const option = this.students.find((student) => student.value === Id);
		if (option.student) {
			this.student = option.student;
			Utils.setCookie({ key: "studentId", value: this.student.Id });
		} else {
			this.student = { Id: option.value };
		}
	}

	onRegisterClick() {
		LightningPrompt.open({
			label: "Registration", // this is the header text
			message: "What's your name?",
			variant: "header",
			theme: "inverse",
			defaultValue: ""
		}).then((studentName) => {
			if (studentName) {
				registerStudent({ deliveryId: this.delivery.Id, studentName })
					.then((student) => {
						refreshApex(this.wiredStudents);
						this.student = student;
						Utils.setCookie({ key: "studentId", value: this.student.Id });
					})
					.catch((err) => {
						Utils.logger.log(err);
						debugger;
					});
			}
		});
	}

	onNextClick() {
		this.dispatchEvent(
			new CustomEvent("next", {
				detail: {
					deliveryId: this.delivery.Id,
					studentId: this.student.Id
				}
			})
		);
	}

	onRefreshClick() {
		this.loading = false;
		this.forceRefresh++;
	}

	async validateRegistrationJS() {
		// clearInterval(this.timer);
		// return new Promise((resolve, reject) => {
		// 	await Utils.validateStudentRegistration({ dataManager: this.dataManager, deliveryId: this.deliveryId, studentId: this.studentId });
		// 		.then((data) => {
		// 			this.student = data.student;
		// 			this.delivery = data.delivery;
		// 			Utils.setCookie({ key: "studentId", value: this.student.Id });
		// 			Utils.setCookie({ key: "deliveryId", value: this.delivery.Id });
		// 			resolve();
		// 		})
		// 		.catch((err) => {
		// 			this.student = {};
		// 			this.delivery = {};
		// 			Utils.deleteCookie({ key: "studentId" });
		// 			Utils.deleteCookie({ key: "deliveryId" });

		// 			// this.timer = setInterval(() => {
		// 			Utils.logger.log("***Interval deliveries");
		// 			if (this.delivery.Id === "") {
		// 				Utils.logger.log(`REFRESH ${this.delivery.Id}`);
		// 				this.onRefreshClick();
		// 			} else {
		// 				Utils.logger.log(`CLEAR ${this.delivery.Id}`);
		// 				clearInterval(this.timer);
		// 			}
		// 			// }, 5e3);

		// 			reject(err);
		// 		});
		// });
	}

	readCookies() {
		this.students.currentId = Utils.getCookie({ key: "studentId" });
		this.deliveries.currentId = Utils.getCookie({ key: "deliveryId" });
	}
}
