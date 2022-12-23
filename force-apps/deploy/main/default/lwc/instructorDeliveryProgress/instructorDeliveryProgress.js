// Chart - Review this...
// https://salesforcelabs.github.io/LightningWebChartJS/docs/api/chart.html
// https://github.com/trailheadapps/lwc-recipes/blob/main/force-app/main/default/lwc/libsChartjs/libsChartjs.html

import { api, LightningElement } from "lwc";
import ChartJS from "@salesforce/resourceUrl/chartjs_v280";
import { loadScript } from "lightning/platformResourceLoader";
import instructorDeliveryProgressTable from "c/instructorDeliveryProgressTable";

export default class InstructorDeliveryProgress extends LightningElement {
	_deliveryData;
	_chart = null;
	_ctxChart = null;
	_chartErrors = [];
	_chartjsInitialized = false;

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
			})
			.catch((error) => {
				this.error = error;
			});
	}

	makeChart() {
		// Make chart data
		const labels = this.deliveryData.map((row) => row.Name);
		const data = this.deliveryData.map((row) => row.Points);
		const config = {
			type: "horizontalBar",
			data: {
				labels,
				datasets: [
					{
						backgroundColor: "#639dff",
						label: "Students",
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

	async onShowTable() {
		await instructorDeliveryProgressTable.open({
			size: "large",
			studentsData: this.deliveryData
		});
	}
}
