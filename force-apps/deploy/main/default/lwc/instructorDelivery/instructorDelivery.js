import Utils from "c/utils";
import { LightningElement } from "lwc";

const actions = [
	{ label: "I'm done", name: "Status|03-DONE" },
	{ label: "I'm working", name: "Status|01-WORKING" },
	{ label: "I'll finish later", name: "Status|02-LATER" },
	{ label: "Reset", name: "Status|00-START" }
];

const columns = [
	{ label: "Emoji", fieldName: "emoji", fixedWidth: 40 },
	// { label: "Status2", fieldName: "status" },
	{ label: "Name", fieldName: "name" },
	{ label: "Duration", fieldName: "duration" },
	{
		type: "action",
		typeAttributes: { rowActions: actions }
	}
];

export default class InstructorDelivery extends LightningElement {
	filterKey = null;
	filterValue = null;

	// Controls
	summary = "";
	loading = true;
	errorMessage = "";
	randomStudent = "";
	dataManager = null;
	timers = { screen: null };
	activeExerciseTimer = null;
	activeExerciseStartAt = null;

	// Lists
	deliveries = {
		options: [],
		records: [],
		currentId: null
	};
	courses = {
		options: [],
		records: [],
		currentId: null
	};
	exercises = {
		options: [],
		records: [],
		activeId: null,
		currentId: null
	};

	// Table
	progress = [];
	columns = columns;

	get ui() {
		const exCurrentId = this.exercises?.currentId;
		const currentCxDId = this.courses?.currentId;
		const exIsActive =
			this.exercises?.currentId &&
			this.exercises?.activeId === this.exercises?.currentId &&
			this.findRecord({ list: this.deliveries?.records, Id: this.deliveries?.currentId })?.CurrentExerciseIsActive__c;
		let exercises = {};
		if (this.exercises.options.length > 0) {
			exercises = {
				max: this.exercises.options.length - 1,
				activeIdx: this.findRecord({ list: this.exercises?.records, Id: this.exercises?.activeId }),
				currentIdx: this.findRecord({ list: this.exercises?.records, Id: this.exercises?.currentId })
			};
		}

		const ui = {};
		ui.btnCurrent = {
			isVisible: currentCxDId,
			isDisabled: !currentCxDId || exIsActive
		};
		ui.btnNext = {
			isVisible: currentCxDId,
			isDisabled: !exCurrentId || exIsActive || exercises.currentIdx === exercises.max
		};
		ui.btnStart = {
			isVisible: currentCxDId,
			isDisabled: !exCurrentId || exIsActive
		};
		ui.btnStop = {
			isVisible: currentCxDId,
			isDisabled: !exCurrentId || !exIsActive
		};
		ui.btnRefresh = {
			isVisible: true,
			isDisabled: false
		};

		ui.pnlSelectorDeliveries = true;
		ui.pnlSelectorCourses = this.deliveries?.currentId;
		ui.pnlSelectorExercises = this.courses?.currentId;
		ui.pnlActiveExerciseData = exIsActive;
		// ui.pnlStudents = exCurrentId;

		return ui;
	}

	findRecord({ list, Id }) {
		let output = list.filter((item) => item.Id === Id);
		if (output.length === 1) {
			output = output[0];
		} else {
			output = null;
		}
		return output;
	}

	connectedCallback() {
		debugger;
		setTimeout(() => {
			this.dataManager = this.template.querySelector("c-data-manager");
			this.dataManager.fetchActiveDeliveries();
		}, 0);

		console.log("*** *** *** Connected Callback (read cookies)");
		this.exercises.currentId = Utils.getCookie({ key: "exerciseId" });
		this.deliveries.currentId = Utils.getCookie({ key: "deliveryId" });
		this.courses.currentId = Utils.getCookie({ key: "courseId" });
	}

	onData(event) {
		const { obj, data } = event.detail;
		console.log(`*** obj: ${obj}`, JSON.parse(JSON.stringify(data)));
		switch (obj) {
			case "ActiveDeliveries": {
				this.loadActiveDeliveries({ data });
				break;
			}
			case "CoursesPerDelivery": {
				this.loadCoursesPerDelivery({ data });
				break;
			}
			case "AllExercisesForCourse": {
				this.loadExercisesForCourse({ data });
				break;
			}
			default: {
				debugger;
				break;
			}
		}
		this.loading = false;
	}

	onTestClick() {
		debugger;
		console.log(this.ui);
	}

	//#region options
	onDeliveryChange(event) {
		this._onOptionchange({ event, objectName: "deliveries", cookieName: "deliveryId" });
		this.dataManager.fetchCoursesPerDelivery({ deliveryId: this.deliveries.currentId });
		this._getActiveDelivery();
	}

	onCourseChange(event) {
		this._onOptionchange({ event, objectName: "courses", cookieName: "courseId" });
		this.dataManager.fetchAllExercisesForCourse({ courseId: this.courses.currentId });
	}

	onExerciseChange(event) {
		this._onOptionchange({ event, objectName: "exercises", cookieName: "exerciseId" });
		// this.dataManager.fetchAllExercisesForCourse({ courseId: this.courses.currentId });
	}

	_onOptionchange({ event, objectName, cookieName }) {
		let currentId = event.target.value;
		if (currentId === "") currentId = null;
		this[objectName] = { ...this[objectName] };
		this[objectName].currentId = currentId;
		if (currentId) {
			Utils.setCookie({ key: cookieName, value: currentId });
		}
	}
	//#endregion

	//#region loadData
	loadActiveDeliveries({ data }) {
		let currentId = this.deliveries.currentId;
		this._loadData({ objectName: "deliveries", data, placeholder: "Which Delivery?" });
		if (this.findRecord({ list: this.deliveries.records, Id: currentId })) {
			this.dataManager.fetchCoursesPerDelivery({ deliveryId: currentId });
			this._getActiveDelivery();
		} else {
			this.deliveries.currentId = null;
		}
	}

	loadCoursesPerDelivery({ data }) {
		let currentId = this.courses.currentId;
		this._loadData({ objectName: "courses", data, placeholder: "Which Course?" });
		if (this.findRecord({ list: this.courses.records, Id: currentId })) {
			this.dataManager.fetchAllExercisesForCourse({ courseId: currentId });
		} else {
			this.courses.currentId = null;
		}
	}

	loadExercisesForCourse({ data }) {
		let currentId = this.exercises.currentId;
		this._loadData({ objectName: "exercises", data, placeholder: "Which Exercise?" });
		if (this.findRecord({ list: this.exercises.records, Id: currentId })) {
			// this.dataManager.fetchAllExercisesForCourse({ deliveryId: currentId });
		} else {
			this.exercises.currentId = null;
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
	//#endregion

	_getActiveDelivery() {
		const currentDelivery = this.findRecord({ list: this.deliveries.records, Id: this.deliveries.currentId });
		// console.log(currentDelivery);
		// debugger;
		if (currentDelivery.CurrentExerciseIsActive__c) {
			this.exercises.activeId = currentDelivery.CurrentExercise__c;
		} else {
			this.exercises.activeId = null;
		}
	}
}
