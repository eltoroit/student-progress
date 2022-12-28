import Utils from "c/utils";
import { api, LightningElement, track } from "lwc";
// import updateStatus from "@salesforce/apex/Student.updateStatus";
// import getStudentById from "@salesforce/apex/Student.getStudentById";
// import getDeliveryById from "@salesforce/apex/Student.getDeliveryById";
// import getExercisetById from "@salesforce/apex/Student.getExercisetById";

export default class Student extends LightningElement {
	loading = true;
	@api apexManager = null;

	@track studentData = {
		errorMessage: "",
		studentId: null,
		student: null,
		deliveryId: null,
		delivery: null,
		exerciseId: null,
		exercise: null,
		exerciseStatus: null,
		get studentName() {
			return this.student?.Name;
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

		ui.pnlDelivery = this.studentData?.deliveryId && this.studentData?.deliveryId === this.studentData?.delivery?.Id;
		ui.pnlStudent = this.studentData?.studentId && this.studentData?.studentId === this.studentData?.student?.Id;
		ui.pnlExercise = this.studentData?.exerciseId && this.studentData?.exerciseId === this.studentData?.exercise?.Id;
		return ui;
	}

	//#region EVENTS
	@api
	onData({ obj, data }) {
		Utils.logger.log(`onData ${obj}`, JSON.parse(JSON.stringify(data)));
		switch (obj) {
			case "StudentDataByStudentId": {
				this.loadStudentDataByStudentId({ data });
				break;
			}
			case "Delivery__c": {
				this.apexManager.fetchStudentDataByStudentId({ studentId: this.studentData.studentId });
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
			deliveryId: this.studentData.deliveryId,
			studentId: this.studentData.studentId
		});
		if (creds) {
			this.apexManager.fetchStudentDataByStudentId({ studentId: this.studentData.studentId });
		} else {
			this.onRegisterClick();
		}
	}

	onRegisterClick() {
		this.dispatchEvent(new CustomEvent("register"));
	}
	//#endregion

	//#region LOAD DATA
	loadStudentDataByStudentId({ data }) {
		// Object.assign(this.studentData, data);
		this.studentData.studentId = data.studentId;
		this.studentData.student = data.student;
		this.studentData.deliveryId = data.deliveryId;
		this.studentData.delivery = data.delivery;
		this.studentData.exerciseId = data.exerciseId;
		this.studentData.exercise = data.exercise;
		this.studentData.exerciseStatus = data.exerciseStatus;
		this.loading = false;
	}
	//#endregion

	readCookies() {
		this.studentData.studentId = Utils.getCookie({ key: "studentId" });
		this.studentData.deliveryId = Utils.getCookie({ key: "deliveryId" });
	}

	// @wire(getStudentById, { studentId: "$studentId" })
	// wired_GetStudentById(result) {
	// 	let { data, error } = result;
	// 	if (data) {
	// 		this.student = data;
	// 	} else if (error) {
	// 		this.student = {};
	// 	}
	// }

	// @wire(getDeliveryById, { deliveryId: "$deliveryId", forceRefresh: "$forceRefresh" })
	// wired_GetDeliveryById(result) {
	// 	this.wiredDeliver = result;
	// 	let { data, error } = result;
	// 	if (data) {
	// 		this.delivery = { ...data };
	// 		if (this.delivery) {
	// 			this.delivery.Name = `${data.Name} (${data.Instructor__c})`;
	// 		}
	// 		this.exercise = data.CurrentExercise__r;
	// 		this.exerciseId = data.CurrentExercise__c;
	// 		this.exerciseIsActive = data.CurrentExerciseIsActive__c;
	// 		if (!this.exerciseId) {
	// 			this.exercise = {};
	// 		}
	// 		this.loading = false;
	// 	} else if (error) {
	// 		this.delivery = {};
	// 		this.loading = false;
	// 	}
	// }

	// @wire(getExercisetById, { exerciseId: "$exerciseId" })
	// wired_GetExercisetById(result) {
	// 	let { data, error } = result;
	// 	if (data) {
	// 		this.exercise = data;
	// 		this.loading = false;
	// 	} else if (error) {
	// 		this.exercise = {};
	// 		this.loading = false;
	// 	}
	// }

	// onRefreshClick() {
	// 	this.forceRefresh++;
	// 	// refreshApex(this.wiredDeliver)
	// 	// 	.then(() => {
	// 	// 		this.errorMessage = "";
	// 	// 	})
	// 	// 	.catch((error) => {
	// 	// 		Utils.log(error);
	// 	// 		this.errorMessage = `Error refreshing data. ${error.statusText} ${error.body.message}`;
	// 	// 	});
	// }

	// onDoneClick() {
	// 	this.updateStatus("03-DONE");
	// }
	// onWorkingClick() {
	// 	this.updateStatus("01-WORKING");
	// }
	// onLaterClick() {
	// 	this.updateStatus("02-LATER");
	// }
	// updateStatus(status) {
	// 	this.loading = true;
	// 	updateStatus({ exerciseId: this.exerciseId, studentId: this.studentId, status })
	// 		.then(() => {
	// 			Utils.showNotification(this, { title: "Success", message: "Thanks for completing the exercise" });
	// 			setTimeout(() => {
	// 				this.loading = false;
	// 			}, 1e3);
	// 		})
	// 		.catch((error) => {
	// 			this.loading = false;
	// 			Utils.log(error);
	// 			Utils.showNotification(this, {
	// 				title: "Error",
	// 				message: "Error marking as done",
	// 				variant: Utils.variants.error
	// 			});
	// 		});
	// }
}
