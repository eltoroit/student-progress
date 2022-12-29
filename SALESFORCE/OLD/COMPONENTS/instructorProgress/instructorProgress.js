// Chart - Review this...
// https://salesforcelabs.github.io/LightningWebChartJS/docs/api/chart.html
// https://github.com/trailheadapps/lwc-recipes/blob/main/force-app/main/default/lwc/libsChartjs/libsChartjs.html

import Utils from "c/utils";
import { refreshApex } from "@salesforce/apex";
import { api, LightningElement, wire } from "lwc";
import ChartJS from "@salesforce/resourceUrl/chartjs_v280";
import { loadScript } from "lightning/platformResourceLoader";
// import instructorProgressTable from "c/instructorProgressTable";
import getClassReport from "@salesforce/apex/Instructor.getClassReport";

export default class ClassProgress extends LightningElement {
	@api currentCourseDeliveryKey = "";

	attendees = [];
	exercises = [];
	loading = false;
	tableAllData = [];
	wiredGetClassReport = null;

	_chart = null;
	_ctxChart = null;
	_chartjsInitialized = false;

	@wire(getClassReport, { CxD: "$currentCourseDeliveryKey" })
	wired_getClassReport(result) {
		// this.wiredGetClassReport = result;
		// let { data, error } = result;
		// if (data) {
		// 	const mapAttendees = {};
		// 	this.exercises = data.EXERCISES.map((ex) => ({ Id: ex.Id, Name: ex.Name }));
		// 	this.attendees = data.ATTENDEES.map((attendee) => {
		// 		const output = {
		// 			Id: attendee.Id,
		// 			Name: attendee.Name,
		// 			IsInstructor: attendee.IsInstructor__c,
		// 			Points: 0,
		// 			mExA: {}
		// 		};
		// 		mapAttendees[attendee.Id] = output;
		// 		return output;
		// 	});
		// 	// Calculate points
		// 	data.EXERCISES.forEach((ex) => {
		// 		let points = this.attendees.length;
		// 		ex.Exercises_X_Attendees__r.forEach((ExA, index) => {
		// 			const newExA = {
		// 				ExerciseId: ExA.Exercise__c,
		// 				AttendeeId: ExA.Attendee__c,
		// 				Points: 0,
		// 				Ranking: 0,
		// 				Status: ExA.Status__c,
		// 				DTTM: new Date(ExA.LastModifiedDate)
		// 			};
		// 			if (ExA.Status__c === "03-DONE") {
		// 				newExA.Ranking = index + 1;
		// 				newExA.Points = points--;
		// 			}
		// 			const attendee = mapAttendees[ExA.Attendee__c];
		// 			attendee.Points += newExA.Points;
		// 			attendee.mExA[ExA.Exercise__c] = newExA;
		// 		});
		// 	});
		// 	// Build the output data
		// 	this.tableAllData = this.attendees.map((attendee) => {
		// 		const output = {
		// 			AttendeeId: attendee.Id,
		// 			Name: attendee.Name,
		// 			Points: attendee.Points,
		// 			IsInstructor: attendee.IsInstructor,
		// 			EX: []
		// 		};
		// 		this.exercises.forEach((ex, index) => {
		// 			const ExA = attendee.mExA[ex.Id];
		// 			const paddedIndex = `${index}`.padStart(3, "0");
		// 			const tmp = {
		// 				index: paddedIndex,
		// 				ranking: 0,
		// 				points: 0,
		// 				status: "?",
		// 				emoji: ""
		// 			};
		// 			if (ExA) {
		// 				tmp.ranking = ExA.Ranking;
		// 				tmp.points = ExA.Points;
		// 				tmp.status = ExA.Status;
		// 				tmp.emoji = Utils.getEmoji({ status: ExA.Status });
		// 			}
		// 			output.EX.push(tmp);
		// 		});
		// 		return output;
		// 	});
		// 	// Only the attendees
		// 	this.tableAllData = this.tableAllData.filter((row) => !row.IsInstructor);
		// 	// Sort it :-)
		// 	this.tableAllData = this.tableAllData.sort((a, b) => -(a.Points < b.Points ? -1 : 1));
		// 	setTimeout(() => {
		// 		this.makeChart();
		// 	}, 0);
		// 	this.loading = false;
		// } else if (error) {
		// 	Utils.showNotification(this, {
		// 		title: "Error (Instructor)",
		// 		message: "Error getting class report",
		// 		variant: Utils.variants.error
		// 	});
		// 	Utils.log(error);
		// 	this.loading = false;
		// }
	}

	renderedCallback() {
		if (this._chartjsInitialized) {
			return;
		}
		this._chartjsInitialized = true;
		loadScript(this, ChartJS)
			.then(() => {
				const canvas = document.createElement("canvas");
				this.template.querySelector("div.chart").appendChild(canvas);
				this._ctxChart = canvas.getContext("2d");
				// this._ctxChart = this.template.querySelector("canvas.certBarChart").getContext("2d");
			})
			.catch((error) => {
				this.error = error;
			});
	}

	makeChart() {
		// Make chart data
		const labels = this.tableAllData.map((row) => row.Name);
		const data = this.tableAllData.map((row) => row.Points);
		const config = {
			type: "horizontalBar",
			data: {
				labels,
				datasets: [
					{
						backgroundColor: "#639dff",
						label: "Attendees",
						data
					}
				]
			},
			options: {
				responsive: true,
				legend: { display: false },
				title: { display: false },
				animation: {
					animateScale: true
				}
			}
		};
		try {
			this._chart = new window.Chart(this._ctxChart, config);
		} catch (ex) {
			Utils.log(ex);
			// eslint-disable-next-line
			alert("An error creating the chart has occurred. You will need to refresh the page.");
		}
	}

	onRefresh() {
		let tmp = this.currentCourseDeliveryKey;
		this.currentCourseDeliveryKey = "";
		// setTimeout(() => {
		this.currentCourseDeliveryKey = tmp;
		refreshApex(this.wiredGetClassReport);
		// }, 0);
	}

	async onShowTable() {
		await instructorProgressTable.open({
			size: "large",
			attendeesData: this.tableAllData
		});
	}
}
