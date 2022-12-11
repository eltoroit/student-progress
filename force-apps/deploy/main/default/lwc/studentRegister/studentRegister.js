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

	student = {};
	students = [];
	wiredStudents = null;

	delivery = {};
	deliveries = [];
	wiredDeliveries = null;

	get ui() {
		const ui = {};
		ui.btnRegister = {
			isVisible: !(this.delivery.Id === "" || this.student.Id !== "CREATE"),
			isDisabled: this.delivery.Id === "" || this.student.Id !== "CREATE"
		};
		ui.btnNext = {
			isVisible: !(this.delivery.Id === "" || this.student.Id === "CREATE" || this.student.Id === ""),
			isDisabled: this.delivery.Id === "" || this.student.Id === "CREATE" || this.student.Id === ""
		};
		ui.btnRefresh = {
			isVisible: true,
			isDisabled: false
		};
		ui.pnlStudent = this.delivery.Id !== "" && this.deliveries.length > 1;

		return ui;
	}

	get studentId() {
		return this.student.Id;
	}

	get deliveryId() {
		return this.delivery.Id;
	}

	connectedCallback() {
		this.student.Id = Utils.getCookie({ key: "studentId" });
		this.delivery.Id = Utils.getCookie({ key: "deliveryId" });
		this.validateRegistrationJS();
	}

	@wire(getActiveDeliveries)
	wired_GetActiveDeliveries(result) {
		this.wiredDeliveries = result;
		let { data, error } = result;
		if (data) {
			this.deliveries = data.map((delivery) => ({
				delivery,
				value: delivery.Id,
				label: `${delivery.Name} (${delivery.Instructor__c})`
			}));
			if (data.length === 1) {
				this.delivery.Id = data[0].Id;
				Utils.setCookie({ key: "deliveryId", value: this.delivery.Id });
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

	// Can you use a getter?
	@wire(getStudentsForDelivery, { deliveryId: "$deliveryId" })
	wired_GetStudentsForDelivery(result) {
		this.wiredStudents = result;
		let { data, error } = result;
		if (data) {
			this.students = data.map((student) => ({
				student,
				value: student.Id,
				label: student.Name
			}));
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
					deliveryId: this.delivery.Id,
					studentId: this.student.Id
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
			validateRegistration({ deliveryId: this.delivery.Id, studentId: this.student.Id })
				.then((data) => {
					this.student = data.student;
					this.delivery = data.delivery;
					Utils.setCookie({ key: "studentId", value: this.student.Id });
					Utils.setCookie({ key: "deliveryId", value: this.delivery.Id });
					resolve();
				})
				.catch((err) => {
					this.student = {};
					this.delivery = {};
					Utils.deleteCookie({ key: "studentId" });
					Utils.deleteCookie({ key: "deliveryId" });

					this.timer = setInterval(() => {
						console.log("*** Interval deliveries");
						if (this.delivery.Id === "") {
							console.log(`*** REFRESH ${this.delivery.Id}`);
							this.onRefreshClick();
						} else {
							console.log(`*** CLEAR ${this.delivery.Id}`);
							clearInterval(this.timer);
						}
					}, 5e3);

					reject(err);
				});
		});
	}
}
