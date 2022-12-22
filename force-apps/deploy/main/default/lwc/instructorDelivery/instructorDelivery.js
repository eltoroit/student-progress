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
	activeExercise = {
		name: null,
		timer: null,
		startAt: null
	};
	duration = "";

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
		ui.pnlActiveExerciseName = this.courses?.currentId && this.exercises?.activeId && !exIsActive;
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
	}

	onTestClick() {
		debugger;
		console.log(this.ui);
	}

	//#region options
	onDeliveryChange(event) {
		this.selectOption({ currentId: event.target.value, objectName: "deliveries", cookieName: "deliveryId" });
		this.dataManager.fetchCoursesPerDelivery({ deliveryId: this.deliveries.currentId });
		this.showActiveExerciseInformation();
		this.showDeliveryProgress();
	}

	onCourseChange(event) {
		this.selectOption({ currentId: event.target.value, objectName: "courses", cookieName: "courseId" });
		this.dataManager.fetchAllExercisesForCourse({ courseId: this.courses.currentId });
		this.showActiveExerciseInformation();
	}

	onExerciseChange(event) {
		this.selectOption({ currentId: event.target.value, objectName: "exercises", cookieName: "exerciseId" });
		// this.dataManager.fetchAllExercisesForCourse({ courseId: this.courses.currentId });
		this.showActiveExerciseInformation();
	}

	selectOption({ currentId, objectName, cookieName }) {
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
			this.showActiveExerciseInformation();
			this.showDeliveryProgress();
		} else {
			this.deliveries.currentId = null;
			this.loading = false;
		}
	}

	loadCoursesPerDelivery({ data }) {
		this._loadData({ objectName: "courses", data, placeholder: "Which Course?" });
		let currentId = this.courses.currentId;
		if (this.courses.records.length === 1) {
			// If there is only one course, then select it
			currentId = this.courses.records[0].Id;
			this.selectOption({ currentId, objectName: "courses", cookieName: "courseId" });
		}
		if (this.findRecord({ list: this.courses.records, Id: currentId })) {
			this.dataManager.fetchAllExercisesForCourse({ courseId: currentId });
		} else {
			this.courses.currentId = null;
			this.loading = false;
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
		this.loading = false;
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

	showActiveExerciseInformation() {
		clearInterval(this.activeExercise?.timer);
		this.exercises.activeId = null;
		this.activeExercise.record = null;
		this.activeExercise.startAt = null;
		if (this.deliveries.currentId) {
			const currentDelivery = this.findRecord({ list: this.deliveries.records, Id: this.deliveries.currentId });
			if (currentDelivery.CurrentExerciseIsActive__c) {
				this.exercises.activeId = currentDelivery.CurrentExercise__c;
				this.activeExercise = {
					record: currentDelivery.CurrentExercise__r,
					startAt: currentDelivery.CurrentExerciseStart__c
				};
				if (currentDelivery.CurrentExercise__c === this.exercises.currentId) {
					this.activeExercise.timer = setInterval(() => {
						try {
							console.log(`*** Update clock`);
							this.duration = Utils.calculateDuration({
								startAt: this.activeExercise.startAt,
								endAt: new Date()
							}).seconds.toString();
						} catch (ex) {
							Utils.showNotification(this, {
								title: "Error (Instructor)",
								message: "Error updating timer",
								variant: Utils.variants.error
							});
							console.log(`***`, ex);
						}
					}, 5e2);
				}
			}
		}
	}

	async showDeliveryProgress() {
		const data = await this.dataManager.retrieveDeliveryProgress({ deliveryId: this.deliveries.currentId });

		// Parse data
		const mapStudents = {};
		const exercises = data.EXERCISES.map((ex) => ({ Id: ex.Id, Name: ex.Name }));
		const students = data.STUDENTS.map((student) => {
			const output = {
				Id: student.Id,
				Name: student.Name,
				IsInstructor: student.IsInstructor__c,
				Points: 0,
				mExS: {}
			};
			mapStudents[student.Id] = output;
			return output;
		});

		// Calculate points
		data.EXERCISES.forEach((ex) => {
			let points = students.length;
			ex.Exercises_X_Students__r.forEach((ExS, index) => {
				const newExS = {
					ExerciseId: ExS.Exercise__c,
					StudentId: ExS.Student__c,
					Points: 0,
					Ranking: 0,
					Status: ExS.Status__c,
					DTTM: new Date(ExS.LastModifiedDate)
				};
				if (ExS.Status__c === "03-DONE") {
					newExS.Ranking = index + 1;
					newExS.Points = points--;
				}
				const student = mapStudents[ExS.Student__c];
				student.Points += newExS.Points;
				student.mExS[ExS.Exercise__c] = newExS;
			});
		});

		// Build the output data
		let tableAllData = students.map((student) => {
			const output = {
				StudentId: student.Id,
				Name: student.Name,
				Points: student.Points,
				IsInstructor: student.IsInstructor,
				EX: []
			};
			exercises.forEach((ex, index) => {
				const ExS = student.mExS[ex.Id];
				const paddedIndex = `${index}`.padStart(3, "0");
				const tmp = {
					index: paddedIndex,
					ranking: 0,
					points: 0,
					status: "?",
					emoji: ""
				};
				if (ExS) {
					tmp.ranking = ExS.Ranking;
					tmp.points = ExS.Points;
					tmp.status = ExS.Status;
					tmp.emoji = Utils.getEmoji({ status: ExS.Status });
				}
				output.EX.push(tmp);
			});
			return output;
		});

		// Only the students
		tableAllData = tableAllData.filter((row) => !row.IsInstructor);

		// Sort it :-)
		tableAllData = tableAllData.sort((a, b) => -(a.Points < b.Points ? -1 : 1));

		// Notify
		this.dispatchEvent(new CustomEvent("deliverydata", { detail: tableAllData }));
	}
}
