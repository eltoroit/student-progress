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
			case "Exercise_X_Student__c": {
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
		this.apexManager.doUpdateStudentStatus({ exerciseId: this.studentData.exerciseId, studentId: this.studentData.studentId, status });
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
}
