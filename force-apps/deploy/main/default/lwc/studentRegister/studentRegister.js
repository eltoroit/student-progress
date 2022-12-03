import Utils from "c/utils";
import { LightningElement, wire } from "lwc";
import { refreshApex } from "@salesforce/apex";
import LightningPrompt from "lightning/prompt";
import registerStudent from "@salesforce/apex/Student.registerStudent";
import getActiveDeliveries from "@salesforce/apex/Student.getActiveDeliveries";
import getStudentsForDelivery from "@salesforce/apex/Student.getStudentsForDelivery";

export default class StudentRegister extends LightningElement {
	loading = true;

	students = [];
	wiredStudents = null;
	_selectedStudentId = "";

	deliveries = [];
	mapDeliveries = {};
	wiredDeliveries = null;
	_selectedDeliveryId = "";

	get ui() {
		const isDelivery = this.selectedDeliveryId;

		const ui = {};
		ui.btnRegister = {
			isVisible: true,
			isDisabled: !isDelivery || this.selectedStudentId !== "CREATE"
		};
		ui.btnNext = {
			isVisible: true,
			isDisabled: !isDelivery || this.selectedStudentId === "CREATE" || this.selectedStudentId === ""
		};
		ui.pnlStudent = isDelivery;

		return ui;
	}

	get selectedStudentId() {
		return this._selectedStudentId;
	}

	set selectedStudentId(value) {
		if (!value) {
			value = "";
		}
		this._selectedStudentId = value;
	}

	get selectedDeliveryId() {
		return this._selectedDeliveryId;
	}

	set selectedDeliveryId(value) {
		if (!value) {
			value = "";
		}
		this._selectedDeliveryId = value;
	}

	connectedCallback() {
		this.selectedStudentId = Utils.getCookie({ key: "selectedStudentId" });
		this.selectedDeliveryId = Utils.getCookie({ key: "selectedDeliveryId" });
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

	@wire(getStudentsForDelivery, { deliveryId: "$selectedDeliveryId" })
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
		this.selectedDeliveryId = event.target.value;
		Utils.setCookie({ key: "selectedDeliveryId", value: this.selectedDeliveryId });
	}

	onStudentChange(event) {
		this.selectedStudentId = event.target.value;
		Utils.setCookie({ key: "selectedStudentId", value: this.selectedStudentId });
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
				registerStudent({ deliveryId: this.selectedDeliveryId, studentName })
					.then((student) => {
						refreshApex(this.wiredStudents);
						this.selectedStudentId = student.Id;
						Utils.setCookie({ key: "selectedStudentId", value: this.selectedStudentId });
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
					deliveryId: this.selectedDeliveryId,
					studentId: this.selectedStudentId
				}
			})
		);
	}
}
