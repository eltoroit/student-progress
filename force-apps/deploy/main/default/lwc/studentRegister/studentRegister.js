import Utils from "c/utils";
import { LightningElement, wire } from "lwc";
import { refreshApex } from "@salesforce/apex";
import LightningPrompt from "lightning/prompt";
import registerStudent from "@salesforce/apex/Student.registerStudent";
import getActiveDeliveries from "@salesforce/apex/Student.getActiveDeliveries";
import validateRegistration from "@salesforce/apex/Student.validateRegistration";
import getStudentsForDelivery from "@salesforce/apex/Student.getStudentsForDelivery";

export default class StudentRegister extends LightningElement {
	timer = null;
	loading = true;

	students = [];
	_studentId = "";
	wiredStudents = null;

	deliveries = [];
	_deliveryId = "";
	mapDeliveries = {};
	wiredDeliveries = null;

	get ui() {
		const ui = {};
		ui.btnRegister = {
			isVisible: true,
			isDisabled: this.deliveryId === "" || this.studentId !== "CREATE"
		};
		ui.btnNext = {
			isVisible: true,
			isDisabled: this.deliveryId === "" || this.studentId === "CREATE" || this.studentId === ""
		};
		ui.btnRefresh = {
			isVisible: true,
			isDisabled: false
		};
		ui.pnlStudent = this.deliveryId !== "";

		return ui;
	}

	get studentId() {
		return this._studentId;
	}

	set studentId(value) {
		if (!value) {
			value = "";
		}
		this._studentId = value;
	}

	get deliveryId() {
		return this._deliveryId;
	}

	set deliveryId(value) {
		if (!value) {
			value = "";
		}
		this._deliveryId = value;
	}

	connectedCallback() {
		this.studentId = Utils.getCookie({ key: "studentId" });
		this.deliveryId = Utils.getCookie({ key: "deliveryId" });
		this.validateRegistrationJS();
	}

	@wire(getActiveDeliveries)
	wired_GetActiveDeliveries(result) {
		this.wiredDeliveries = result;
		let { data, error } = result;
		if (data) {
			this.deliveries = [];
			this.mapDeliveries = new Map();
			data.forEach((delivery) => {
				this.deliveries.push({
					value: delivery.Id,
					label: `${delivery.Name} (${delivery.Instructor__c})`
				});
				this.mapDeliveries.set(delivery.Id, delivery);
			});
			if (data.length === 1) {
				this.deliveryId = data[0].Id;
				Utils.setCookie({ key: "deliveryId", value: this.deliveryId });
			}
			this.deliveries.unshift({ value: "", label: "Which class are you attending?" });
			this.loading = false;
		} else if (error) {
			Utils.showNotification(this, {
				title: "Error",
				message: "Error getting deliveries",
				variant: Utils.variants.error
			});
			console.log(error);
			this.loading = false;
		}
	}

	@wire(getStudentsForDelivery, { deliveryId: "$deliveryId" })
	wired_GetStudentsForDelivery(result) {
		this.wiredStudents = result;
		let { data, error } = result;
		if (data) {
			this.students = [];
			data.forEach((student) => {
				this.students.push({
					value: student.Id,
					label: student.Name
				});
			});
			this.students.unshift({ value: "", label: "What's your name?" });
			this.students.push({ value: "CREATE", label: "I'm not in your list" });
			this.loading = false;
		} else if (error) {
			Utils.showNotification(this, {
				title: "Error",
				message: "Error getting deliveries",
				variant: Utils.variants.error
			});
			console.log(error);
			this.loading = false;
		}
	}

	onDeliveryChange(event) {
		this.loading = true;
		this.deliveryId = event.target.value;
		Utils.setCookie({ key: "deliveryId", value: this.deliveryId });
	}

	onStudentChange(event) {
		this.studentId = event.target.value;
		Utils.setCookie({ key: "studentId", value: this.studentId });
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
				registerStudent({ deliveryId: this.deliveryId, studentName })
					.then((student) => {
						refreshApex(this.wiredStudents);
						this.studentId = student.Id;
						Utils.setCookie({ key: "studentId", value: this.studentId });
					})
					.catch((err) => {
						console.log(err);
						debugger;
					});
			}
		});
	}

	onNextClick() {
		this.dispatchEvent(
			new CustomEvent("next", {
				detail: {
					deliveryId: this.deliveryId,
					studentId: this.studentId
				}
			})
		);
	}

	onRefreshClick() {
		this.loading = false;
		setTimeout(() => {
			refreshApex(this.wiredDeliveries)
				.then(() => {
					this.loading = false;
				})
				.catch(() => {
					debugger;
				});
			refreshApex(this.wiredStudents)
				.then(() => {
					this.loading = false;
				})
				.catch(() => {
					debugger;
				});
		}, 5e2);
	}

	async validateRegistrationJS() {
		clearInterval(this.timer);
		return new Promise((resolve, reject) => {
			validateRegistration({ deliveryId: this.deliveryId, studentId: this.studentId })
				.then((data) => {
					this.studentId = data.studentId;
					this.deliveryId = data.deliveryId;
					Utils.setCookie({ key: "deliveryId", value: this.deliveryId });
					Utils.setCookie({ key: "studentId", value: this.studentId });
					resolve();
				})
				.catch((err) => {
					this.studentId = "";
					this.deliveryId = "";
					Utils.deleteCookie({ key: "deliveryId" });
					Utils.deleteCookie({ key: "studentId" });

					this.timer = setInterval(() => {
						console.log("*** Interval deliveries");
						if (this.deliveryId === "") {
							console.log(`*** REFRESH ${this.deliveryId}`);
							this.onRefreshClick();
						} else {
							console.log(`*** CLEAR ${this.deliveryId}`);
							clearInterval(this.timer);
						}
					}, 5e3);

					reject(err);
				});
		});
	}
}
