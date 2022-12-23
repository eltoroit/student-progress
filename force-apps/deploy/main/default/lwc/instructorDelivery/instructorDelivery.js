import Utils from "c/utils";
import { LightningElement } from "lwc";

const EXERCISE_PROGRESS_COLUMNS = [
	{
		label: "",
		type: "button",
		hideLabel: true,
		fixedWidth: 40,
		typeAttributes: { variant: "base", name: "button|emoji", title: { fieldName: "status" }, label: { fieldName: "emoji" } }
	},
	// { label: "Status2", fieldName: "status" },
	{ label: "Name", fieldName: "name" },
	{ label: "Duration", fieldName: "duration" },
	{
		type: "action",
		typeAttributes: {
			rowActions: [
				{ label: "I'm done", name: `Status|${Utils.STATES.DONE()}` },
				{ label: "I'm working", name: `Status|${Utils.STATES.WORKING()}` },
				{ label: "I'll finish later", name: `Status|${Utils.STATES.LATER()}` },
				{ label: "Reset", name: `Status|${Utils.STATES.START()}` }
			]
		}
	}
];

export default class InstructorDelivery extends LightningElement {
	filterKey = null;
	filterValue = null;

	// Controls
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

	// Exercise progress
	exProgSummary = "";
	exProgProgress = [];
	exProgColumns = EXERCISE_PROGRESS_COLUMNS;

	get ui() {
		const hasNext = () => {
			const size = this.exercises?.records?.length;
			if (isNaN(size)) return false;

			const currentIdx = this.exercises?.options?.findIndex((option) => option.value === this.exercises?.currentId);
			return currentIdx < size;
		};

		const isCurrentActive = () => {
			return (
				this.exercises?.currentId &&
				this.exercises?.activeId === this.exercises?.currentId &&
				this.findRecord({ list: this.deliveries?.records, Id: this.deliveries?.currentId })?.CurrentExerciseIsActive__c
			);
		};

		const ui = {};
		ui.btnRandom = {
			isVisible: this.courses?.currentId,
			isDisabled: !this.exercises?.currentId
		};
		ui.btnCurrent = {
			isVisible: this.courses?.currentId,
			isDisabled: !this.exercises?.activeId || isCurrentActive()
		};
		ui.btnNext = {
			isVisible: this.courses?.currentId,
			isDisabled: this.exercises?.activeId || !this.exercises?.currentId || isCurrentActive() || !hasNext()
		};
		ui.btnStart = {
			isVisible: this.courses?.currentId,
			isDisabled: this.exercises?.activeId || !this.exercises?.currentId || isCurrentActive()
		};
		ui.btnStop = {
			isVisible: this.courses?.currentId,
			isDisabled: !this.exercises?.activeId || !this.exercises?.currentId || !isCurrentActive()
		};
		ui.btnRefresh = {
			isVisible: true,
			isDisabled: false
		};

		ui.pnlSelectorDeliveries = true;
		ui.pnlSelectorCourses = this.deliveries?.currentId;
		ui.pnlSelectorExercises = this.courses?.currentId;
		ui.pnlActiveExerciseName = this.courses?.currentId && this.exercises?.activeId && !isCurrentActive();
		ui.pnlActiveExerciseData = isCurrentActive();
		ui.pnlCompletion = this.exercises?.currentId && !isNaN(this.exProgSummary);
		ui.pnlStudents = this.exercises?.currentId;

		return ui;
	}

	connectedCallback() {
		debugger;
		setTimeout(() => {
			this.dataManager = this.template.querySelector("c-data-manager");
			this.dataManager.fetchActiveDeliveriesWithCourses();
		}, 0);

		Utils.log("Connected Callback (read cookies)");
		this.exercises.currentId = Utils.getCookie({ key: "exerciseId" });
		this.deliveries.currentId = Utils.getCookie({ key: "deliveryId" });
		this.courses.currentId = Utils.getCookie({ key: "courseId" });
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

	//#region EVENTS
	onData(event) {
		const { obj, data } = event.detail;
		Utils.log(`Instructor Delivery (onData): ${obj}`, JSON.parse(JSON.stringify(data)));
		switch (obj) {
			case "ActiveDeliveriesWithCourses": {
				this.loadActiveDeliveriesWithCourses({ data });
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
			case "DeliveryProgress": {
				this.parseDeliveryProgress({ data });
				break;
			}
			case "ExerciseProgress": {
				this.parseExerciseProgress({ data });
				break;
			}
			case "Exercise_X_Student__c": {
				this.dataManager.fetchExerciseProgress({ deliveryId: this.deliveries.currentId, exerciseId: this.exercises.currentId });
				this.dataManager.fetchDeliveryProgress({ deliveryId: this.deliveries.currentId });
				break;
			}
			default: {
				debugger;
				break;
			}
		}
	}

	onRowAction(event) {
		const row = event.detail.row;
		const actionName = event.detail.action.name;
		const actionNameParts = actionName.split("|");
		const actionNameCommand = actionNameParts[0];
		const actionValue = actionNameParts[1];

		switch (actionNameCommand) {
			case "Status": {
				this.dataManager.doUpdateStudentStatus({
					deliveryId: this.deliveries.currentId,
					exerciseId: this.exercises.currentId,
					studentId: row.studentId,
					status: actionValue
				});
				break;
			}
			case "button": {
				switch (actionValue) {
					case "emoji": {
						// Ignore
						break;
					}
					default:
						debugger;
						break;
				}
				break;
			}
			default: {
				debugger;
			}
		}
	}

	onRandomClick() {
		/*
			Works with a quick solution, but not a good solution
			It's possible to choose A, B, C, A, D... Having a student be selected again soon after it was previously selected.
			Or a student that is not selected often enough
			Maintain a list of unselected students and randomize from there :-)
			This list should be in the server, since a page refresh would reset it.
			Have the random student be chosen via Apex where a field can be set
		*/
		const prevStudent = this.randomStudent;
		do {
			let students = this.exProgProgress.filter((row) => !row.isInstructor);
			students = students.map((row) => row.name);
			let idx = Math.floor(Math.random() * students.length);
			this.randomStudent = students[idx];
		} while (this.randomStudent === prevStudent);
		// eslint-disable-next-line no-alert
		alert(this.randomStudent);
	}

	onCurrentClick() {
		if (this.exercises.activeId) {
			this.selectExercise({ currentId: this.exercises.activeId });
		} else {
			this.selectExercise({ currentId: this.exercises.currentId });
		}
	}

	onNextClick() {
		const index = this.exercises.options.findIndex((exercise) => exercise.value === this.exercises.currentId);
		const nextOption = this.exercises.options[index + 1];
		this.selectExercise({ currentId: nextOption.value });
	}

	onStartClick() {
		this.dataManager.doStartStopExercise({ deliveryId: this.deliveries.currentId, exerciseId: this.exercises.currentId, isStart: true });
	}

	onStopClick() {
		this.dataManager.doStartStopExercise({ deliveryId: this.deliveries.currentId, exerciseId: this.exercises.currentId, isStart: false });
	}

	onRefreshClick() {
		debugger;
		console.log(this.ui);
	}
	//#endregion

	//#region OPTIONS
	onDeliveryChange(event) {
		this.selectDelivery({ currentId: event.target.value });
	}
	selectDelivery({ currentId }) {
		this.genericSelectOption({ currentId, objectName: "deliveries", cookieName: "deliveryId" });
		this.dataManager.fetchCoursesPerDelivery({ deliveryId: this.deliveries.currentId });
		this.parseActiveExerciseInformation();
		this.dataManager.fetchDeliveryProgress({ deliveryId: this.deliveries.currentId });
	}

	onCourseChange(event) {
		this.selectCourse({ currentId: event.target.value });
	}
	selectCourse({ currentId }) {
		this.genericSelectOption({ currentId, objectName: "courses", cookieName: "courseId" });
		this.dataManager.fetchAllExercisesForCourse({ courseId: this.courses.currentId });
		this.parseActiveExerciseInformation();
	}

	onExerciseChange(event) {
		this.selectExercise({ currentId: event.target.value });
	}
	selectExercise({ currentId }) {
		this.genericSelectOption({ currentId, objectName: "exercises", cookieName: "exerciseId" });
		this.parseActiveExerciseInformation();
		this.dataManager.fetchExerciseProgress({ deliveryId: this.deliveries.currentId, exerciseId: this.exercises.currentId });
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
	loadActiveDeliveriesWithCourses({ data }) {
		let currentId = this.deliveries.currentId;
		this._loadData({ objectName: "deliveries", data, placeholder: "Which Delivery?" });
		if (this.findRecord({ list: this.deliveries.records, Id: currentId })) {
			this.selectDelivery({ currentId });
		} else {
			this.courses.currentId = null;
			this.selectCourse({ currentId: null });

			this.exercises.activeId = null;
			this.exercises.currentId = null;
			this.selectExercise({ currentId: null });

			this.deliveries.currentId = null;
			this.selectDelivery({ currentId: null });

			this.loading = false;
		}
	}

	loadCoursesPerDelivery({ data }) {
		this._loadData({ objectName: "courses", data, placeholder: "Which Course?" });
		let currentId = this.courses.currentId;
		if (this.courses.records.length === 1) {
			// If there is only one course, then select it
			currentId = this.courses.records[0].Id;
		}
		if (this.findRecord({ list: this.courses.records, Id: currentId })) {
			this.selectCourse({ currentId });
		} else {
			this.courses.currentId = null;
			this.selectCourse({ currentId: null });

			this.exercises.activeId = null;
			this.exercises.currentId = null;
			this.selectExercise({ currentId: null });

			this.loading = false;
		}
	}

	loadExercisesForCourse({ data }) {
		let currentId = this.exercises.currentId;
		this._loadData({ objectName: "exercises", data, placeholder: "Which Exercise?" });
		if (this.findRecord({ list: this.exercises.records, Id: currentId })) {
			this.selectExercise({ currentId });
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

	//#region PARSERS
	parseActiveExerciseInformation() {
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
								variant: Utils.msgVariants.error,
								mode: Utils.msgModes.sticky
							});
							Utils.log(ex);
						}
					}, 5e2);
				}
			}
		}
	}

	parseDeliveryProgress({ data }) {
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
				if (ExS.Status__c === Utils.STATES.DONE()) {
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

	parseExerciseProgress({ data }) {
		const summary = {
			total: 0
		};

		this.exProgProgress = data.map((student) => {
			const row = {
				studentId: student.Id,
				name: student.Name,
				status: ""
			};
			if (student.IsInstructor__c) {
				row.name += ` 🧑‍🏫`;
				row.isInstructor = true;
			}
			if (student.Exercises_X_Students__r?.length > 0) {
				const rowData = student.Exercises_X_Students__r[0];
				row.exsId = rowData?.Id;
				row.status = rowData?.Status__c;
				row.emoji = Utils.getEmoji({ status: rowData?.Status__c });
				row.startAt = rowData.CreatedDate;
				row.endAt = rowData.LastModifiedDate;

				if (row.status === Utils.STATES.DONE()) {
					const duration = Utils.calculateDuration({
						startAt: row.startAt,
						endAt: row.endAt
					});
					row.durationObj = duration;
					row.duration = duration.minutes.toString();
				}

				// Summary
				if (!summary[row.status]) {
					summary[row.status] = 0;
				}
				summary.total++;
				summary[row.status]++;
			}
			return row;
		});

		let completed = summary.total;
		if (summary[Utils.STATES.START()]) completed -= summary[Utils.STATES.START()];
		if (summary[Utils.STATES.WORKING()]) completed -= summary[Utils.STATES.WORKING()];
		this.exProgSummary = Math.round((completed * 100) / summary.total);

		// Sort results
		this.exProgProgress = this.exProgProgress.sort((a, b) => {
			let output = 0;
			if (a.status < b.status) {
				output = -1;
			} else if (a.status === b.status) {
				if (a.durationObj?.seconds?.total < b.durationObj?.seconds?.total) {
					output = 1;
				} else if (a.durationObj?.seconds?.total === b.durationObj?.seconds?.total) {
					if (a.name < b.name) {
						output = -1;
					} else if (a.name === b.name) {
						output = 0;
					} else if (a.name > b.name) {
						output = 1;
					}
				} else if (a.durationObj?.seconds?.total > b.durationObj?.seconds?.total) {
					output = -1;
				}
			} else if (a.status > b.status) {
				output = 1;
			}

			return output;
		});
	}
	//#endregion
}
