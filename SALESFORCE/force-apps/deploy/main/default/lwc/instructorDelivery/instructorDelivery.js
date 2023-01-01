import Utils from "c/utils";
import { LightningElement } from "lwc";
import LightningAlert from "lightning/alert";

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
	{ label: "Username", fieldName: "username" },
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
	randomAttendee = "";
	apexManager = null;
	timers = { screen: null };
	activeExercise = {
		name: null,
		timer: null,
		startAt: null
	};
	iostatusEventData = null;
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
		currentId: null,
		lastActiveId: null
	};

	// Exercise progress
	exProgSummary = "";
	exProgProgress = [];
	exProgColumns = EXERCISE_PROGRESS_COLUMNS;

	get ui() {
		const hasNext = () => {
			const size = this.exercises?.records?.length;
			if (isNaN(size)) return false;

			const currentIdx = this.exercises?.options?.findIndex((option) => option.value === this.exercises?.lastActiveId);
			return currentIdx < size;
		};

		const isCurrentActive = () => {
			return (
				this.exercises?.currentId &&
				this.exercises?.activeId === this.exercises?.currentId &&
				Utils.findRecord({ list: this.deliveries?.records, Id: this.deliveries?.currentId })?.CurrentExerciseIsActive__c
			);
		};

		const isCurrentDifferentLastActive = () => {
			return (
				this.exercises?.lastActiveId &&
				this.exercises?.lastActiveId !== this.exercises?.currentId &&
				Utils.findRecord({ list: this.exercises?.records, Id: this.exercises?.lastActiveId })
			);
		};

		const ui = {};
		ui.btnRandom = {
			isVisible: this.courses?.currentId,
			isDisabled: false
		};
		ui.btnCurrent = {
			isVisible: this.courses?.currentId && this.exercises?.lastActiveId && isCurrentDifferentLastActive(),
			isDisabled: false
		};
		ui.btnNext = {
			isVisible: false,
			isDisabled: false
		};
		ui.btnStart = {
			isVisible: this.courses?.currentId && !this.exercises?.activeId && this.exercises?.currentId && !isCurrentActive(),
			isDisabled: false
		};
		ui.btnStop = {
			isVisible: this.courses?.currentId && this.exercises?.activeId && isCurrentActive(),
			isDisabled: false
		};

		ui.btnMenuOrgs = this.courses?.currentId;
		ui.btnOrgsView = {
			isVisible: this.courses?.currentId,
			isDisabled: false
		};
		ui.btnOrgsAssign = {
			isVisible: this.courses?.currentId,
			isDisabled: false
		};
		ui.btnOrgsReset = {
			isVisible: this.courses?.currentId,
			isDisabled: false
		};

		ui.pnlSelectorDeliveries = true;
		ui.pnlSelectorCourses = this.deliveries?.currentId;
		ui.pnlSelectorExercises = this.courses?.currentId;
		ui.pnlActiveExerciseName = this.courses?.currentId && this.exercises?.activeId && !isCurrentActive();
		ui.pnlActiveExerciseData = isCurrentActive();
		ui.pnlCompletion = this.exercises?.currentId && !isNaN(this.exProgSummary);
		ui.pnlAttendees = this.exercises?.currentId;

		return ui;
	}

	connectedCallback() {
		// debugger;
	}

	renderedCallback() {
		if (!this.apexManager) {
			this.apexManager = this.template.querySelector("c-apex-manager");
			this.apexManager.fetchActiveDeliveriesWithCourses();

			Utils.logger.log("Connected Callback (read cookies)");
			this.deliveries.currentId = Utils.getCookie({ key: "deliveryId" });
			this.courses.currentId = Utils.getCookie({ key: "courseId" });
			this.exercises.currentId = Utils.getCookie({ key: "exerciseId" });
			this.selectDelivery({ currentId: this.deliveries.currentId });
			this.selectCourse({ currentId: this.courses.currentId });
			this.selectExercise({ currentId: this.exercises.currentId });
		}
	}

	//#region EVENTS
	onData(event) {
		const { obj, data } = event.detail;
		Utils.logger.log(`OnData: ${obj}`, JSON.parse(JSON.stringify(data)));
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
			case "EXERCISE":
			case "Delivery__c": {
				this.apexManager.fetchActiveDeliveriesWithCourses();
				break;
			}
			case "Attendee__c":
			case "Exercise_X_Attendee__c": {
				this.apexManager.fetchExerciseProgress({ deliveryId: this.deliveries.currentId, exerciseId: this.exercises.currentId });
				this.apexManager.fetchDeliveryProgress({ deliveryId: this.deliveries.currentId });
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
				this.apexManager.doUpdateAttendeeStatus({
					deliveryId: this.deliveries.currentId,
					exerciseId: this.exercises.currentId,
					attendeeId: row.attendeeId,
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

	async onRandomClick() {
		this.loading = true;
		const attendee = await this.apexManager.doPickRandomAttendee({ deliveryId: this.deliveries.currentId });
		Utils.logger.log(`${attendee.Name__c} | ${attendee.ChosenDTTM__c}`);
		setTimeout(async () => {
			this.loading = false;
			await LightningAlert.open({
				message: attendee.Name__c,
				variant: "header",
				label: "Your turn!",
				theme: "inverse"
			});
		}, 1e3);
	}

	onCurrentClick() {
		if (this.exercises.activeId) {
			this.selectExercise({ currentId: this.exercises.activeId });
		} else if (this.exercises.lastActiveId) {
			this.selectExercise({ currentId: this.exercises.lastActiveId });
		} else {
			this.selectExercise({ currentId: this.exercises.currentId });
		}
	}

	onNextClick() {
		const index = this.exercises.options.findIndex((exercise) => exercise.value === this.exercises.lastActiveId);
		const nextOption = this.exercises.options[index + 1];
		this.selectExercise({ currentId: nextOption.value });
	}

	onStartClick() {
		this.apexManager.doStartStopExercise({ deliveryId: this.deliveries.currentId, exerciseId: this.exercises.currentId, isStart: true });
	}

	onStopClick() {
		if (this.exercises.activeId) {
			this.apexManager.doStartStopExercise({ deliveryId: this.deliveries.currentId, exerciseId: this.exercises.currentId, isStart: false });
		}
	}

	onOrgViewClick() {
		debugger;
		// this.apexManager.
	}
	onOrgAssignClick() {
		this.apexManager.doAssignOrgNumbers({ deliveryId: this.deliveries.currentId, courseId: this.courses.currentId });
	}
	onOrgResetClick() {
		this.apexManager.doResetOrgNumbers({ deliveryId: this.deliveries.currentId, courseId: this.courses.currentId });
	}

	onIOStatus(event) {
		this.iostatusEventData = event.detail;
	}
	//#endregion

	//#region OPTIONS
	onDeliveryChange(event) {
		this.selectDelivery({ currentId: event.target.value });
	}
	selectDelivery({ currentId }) {
		if (this.deliveries?.records?.length > 0) {
			this.genericSelectOption({ currentId, objectName: "deliveries", cookieName: "deliveryId" });
			this.apexManager.fetchCoursesPerDelivery({ deliveryId: this.deliveries.currentId });
			this.parseActiveExerciseInformation();
			this.apexManager.fetchDeliveryProgress({ deliveryId: this.deliveries.currentId });
		}
	}

	onCourseChange(event) {
		this.selectCourse({ currentId: event.target.value });
	}
	selectCourse({ currentId }) {
		if (this.courses?.records?.length > 0) {
			this.genericSelectOption({ currentId, objectName: "courses", cookieName: "courseId" });
			this.apexManager.fetchAllExercisesForCourse({ courseId: this.courses.currentId });
			this.parseActiveExerciseInformation();
		}
	}

	onExerciseChange(event) {
		this.selectExercise({ currentId: event.target.value });
	}
	selectExercise({ currentId }) {
		if (this.exercises?.records?.length > 0) {
			this.genericSelectOption({ currentId, objectName: "exercises", cookieName: "exerciseId" });
			this.parseActiveExerciseInformation();
			this.apexManager.fetchExerciseProgress({ deliveryId: this.deliveries.currentId, exerciseId: this.exercises.currentId });
		}
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
		if (Utils.findRecord({ list: this.deliveries.records, Id: currentId })) {
			this.selectDelivery({ currentId });
		} else {
			this.courses.currentId = null;
			this.selectCourse({ currentId: null });

			this.exercises.currentId = null;
			this.exercises.activeId = null;
			this.exercises.lastActiveId = null;
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
		if (Utils.findRecord({ list: this.courses.records, Id: currentId })) {
			this.selectCourse({ currentId });
		} else {
			this.courses.currentId = null;
			this.selectCourse({ currentId: null });

			this.exercises.currentId = null;
			this.exercises.activeId = null;
			this.exercises.lastActiveId = null;
			this.selectExercise({ currentId: null });

			this.loading = false;
		}
	}

	loadExercisesForCourse({ data }) {
		let currentId = this.exercises.currentId;
		this._loadData({ objectName: "exercises", data, placeholder: "Which Exercise?" });
		if (Utils.findRecord({ list: this.exercises.records, Id: currentId })) {
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
		// this.exercises.lastActiveId = null;
		this.activeExercise.record = null;
		this.activeExercise.startAt = null;
		if (this.deliveries.currentId) {
			const currentDelivery = Utils.findRecord({ list: this.deliveries.records, Id: this.deliveries.currentId });
			if (currentDelivery.CurrentExercise__c) {
				this.exercises.lastActiveId = currentDelivery.CurrentExercise__c;
			}
			if (currentDelivery?.CurrentExerciseIsActive__c) {
				this.exercises.activeId = currentDelivery.CurrentExercise__c;
				this.activeExercise = {
					record: currentDelivery.CurrentExercise__r,
					startAt: currentDelivery.CurrentExerciseStart__c
				};
				if (currentDelivery.CurrentExercise__c === this.exercises.currentId) {
					this.activeExercise.timer = setInterval(() => {
						try {
							// Leave this on the console, do not show time or source, that way the inspector can group them and show a counter.
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
							Utils.logger.log(ex);
						}
					}, 5e2);
				}
			}
		}
	}

	parseDeliveryProgress({ data }) {
		// Parse data
		const mapAttendees = {};
		const exercises = data.EXERCISES.map((ex) => ({ Id: ex.Id, Name: ex.Name }));
		const attendees = data.ATTENDEES.map((attendee) => {
			const output = {
				Id: attendee.Id,
				Name: attendee.Name__c,
				IsInstructor: attendee.IsInstructor__c,
				Points: 0,
				mExA: {}
			};
			mapAttendees[attendee.Id] = output;
			return output;
		});

		// Calculate points
		data.EXERCISES.forEach((ex) => {
			let points = attendees.length;
			ex.Exercises_X_Attendees__r.forEach((ExA, index) => {
				const newExA = {
					ExerciseId: ExA.Exercise__c,
					AttendeeId: ExA.Attendee__c,
					Points: 0,
					Ranking: 0,
					Status: ExA.Status__c,
					DTTM: new Date(ExA.LastModifiedDate)
				};
				if (ExA.Status__c === Utils.STATES.DONE()) {
					newExA.Ranking = index + 1;
					newExA.Points = points--;
				}
				const attendee = mapAttendees[ExA.Attendee__c];
				attendee.Points += newExA.Points;
				attendee.mExA[ExA.Exercise__c] = newExA;
			});
		});

		// Build the output data
		let tableAllData = attendees.map((attendee) => {
			const output = {
				AttendeeId: attendee.Id,
				Name: attendee.Name,
				Points: attendee.Points,
				IsInstructor: attendee.IsInstructor,
				EX: []
			};
			exercises.forEach((ex, index) => {
				const ExA = attendee.mExA[ex.Id];
				const paddedIndex = `${index}`.padStart(3, "0");
				const tmp = {
					index: paddedIndex,
					ranking: 0,
					points: 0,
					status: "?",
					emoji: ""
				};
				if (ExA) {
					tmp.ranking = ExA.Ranking;
					tmp.points = ExA.Points;
					tmp.status = ExA.Status;
					tmp.emoji = Utils.getEmoji({ status: ExA.Status });
				}
				output.EX.push(tmp);
			});
			return output;
		});

		// Only the attendees
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

		this.exProgProgress = data.map((attendee) => {
			const row = {
				attendeeId: attendee.Id,
				name: attendee.Name__c,
				status: ""
			};
			if (attendee.IsInstructor__c) {
				row.name += ` 🧑‍🏫`;
				row.isInstructor = true;
			}
			row.username = attendee.OrgUsername__c;
			if (attendee.Exercises_X_Attendees__r?.length > 0) {
				const rowData = attendee.Exercises_X_Attendees__r[0];
				row.ExAId = rowData?.Id;
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
		if (completed === summary.total) {
			this.onStopClick();
			Utils.showNotification(this, {
				title: "Exercise completed",
				message: "All students have reported completion of this exercise",
				variant: Utils.msgVariants.success,
				mode: Utils.msgModes.dismissible
			});
		}

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
