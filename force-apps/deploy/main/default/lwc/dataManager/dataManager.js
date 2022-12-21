import Utils from "c/utils";
import { api, LightningElement, track, wire } from "lwc";
import getActiveDeliveries from "@salesforce/apex/Data.getActiveDeliveries";

export default class DataManager extends LightningElement {
	@api filterValue = null;
	@api filterKey = "Delivery__c";
	@track forceRefresh = {
		ActiveDeliveries: 0
	};

	@wire(getActiveDeliveries, { forceRefresh: "$forceRefresh.ActiveDeliveries" })
	wGetActiveDeliveries({ data, error }) {
		if (data) {
			this._notifyData({ obj: "ActiveDeliveries", data });
		} else if (error) {
			Utils.showNotification(this, {
				title: "Error Getting Data",
				message: `ActiveDeliveries: ${JSON.stringify(error)}`,
				variant: Utils.variants.error
			});
		}
	}

	onEventReceived(event) {
		const { entityName, recordIds } = event.detail;
		switch (entityName) {
			case "Delivery__c": {
				this.forceRefresh.ActiveDeliveries++;
				break;
			}
			default:
				console.log("***", JSON.parse(JSON.stringify(event.detail)), entityName, recordIds);
				debugger;
				break;
		}
	}

	onEventError(event) {
		Utils.showNotification(this, {
			title: "Error Getting Data",
			message: `EmpApi failed to get data: ${JSON.stringify(event.detail)}`,
			variant: Utils.variants.error
		});
		debugger;
	}

	_notifyData({ obj, data }) {
		this.dispatchEvent(new CustomEvent("data", { detail: { obj, data } }));
	}
}
