// Chart - Review this...
// https://salesforcelabs.github.io/LightningWebChartJS/docs/api/chart.html
// https://github.com/trailheadapps/lwc-recipes/blob/main/force-app/main/default/lwc/libsChartjs/libsChartjs.html

import Utils from "c/utils";
import { api, LightningElement } from "lwc";
import srAttendees from "@salesforce/resourceUrl/Attendees";
import { loadScript } from "lightning/platformResourceLoader";
import instructorDeliveryProgressTable from "c/instructorDeliveryProgressTable";

export default class InstructorDeliveryProgress extends LightningElement {
	_deliveryData;
	_chart = null;
	_ctxChart = null;
	_chartErrors = [];

	get ui() {
		const ui = {};
		ui.pnlCard = this.deliveryData?.length > 0;
		return ui;
	}

	@api
	get deliveryData() {
		return this._deliveryData;
	}
	set deliveryData(value) {
		if (Array.isArray(value) && value.length > 0) {
			this._deliveryData = value;
			this.makeChart();
		}
	}

	async makeChart() {
		if (!this._ctxChart) {
			try {
				await loadScript(this, `${srAttendees}/chartjs_v280.js`);
				const canvas = document.createElement("canvas");
				this.template.querySelector("div.chart").appendChild(canvas);
				this._ctxChart = canvas.getContext("2d");
			} catch (ex) {
				Utils.logger.error(ex);
				// eslint-disable-next-line no-alert
				alert("Can't initialize chart");
				debugger;
			}
		}

		if (this._ctxChart) {
			// Make chart data
			const labels = this.deliveryData.map((row) => row.Name);
			const data = this.deliveryData.map((row) => row.Points);
			try {
				this._chart = new window.Chart(this._ctxChart, {
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
				});
				this._chartErrors = [];
			} catch (ex) {
				this._chartErrors.push(ex);
				if (this._chartErrors.length > 5) {
					this._chartErrors.forEach((error) => {
						Utils.logger.log(error.message);
					});
					// eslint-disable-next-line
					alert(`Too many errors creating the chart have occurred. You will need to refresh the page!`);
					debugger;
				} else {
					setTimeout(() => {
						this.makeChart();
					}, 1e3);
				}
			}
		}
	}

	async onShowTable() {
		await instructorDeliveryProgressTable.open({
			size: "large",
			attendeesData: this.deliveryData
		});
	}
}
