public with sharing class StudentNotifier {
	public static void publishEvents(String entityName) {
		Map<Id, Integer> deliveryIds = new Map<Id, Integer>();
		List<SObject> sobjs = Trigger.isDelete ? Trigger.old : Trigger.new;

		for (Sobject sobj : sobjs) {
			String key = (String) sobj.get('Delivery__c');
			if (deliveryIds.containsKey(key)) {
				deliveryIds.put(key, deliveryIds.get(key) + 1);
			} else {
				deliveryIds.put(key, 1);
			}
		}

		List<NotifySocket__e> socketEvents = new List<NotifySocket__e>();
		for (Id key : deliveryIds.keySet()) {
			Integer count = deliveryIds.get(key);
			socketEvents.add(new NotifySocket__e(Delivery__c = key, EntityName__c = entityName, Records__c = count));
		}
		List<Database.SaveResult> results = EventBus.publish(socketEvents);
		for (Database.SaveResult sr : results) {
			if (!sr.isSuccess()) {
				String messages = 'Error returned: ';
				for (Database.Error err : sr.getErrors()) {
					messages += err.getStatusCode() + ' - ' + err.getMessage() + ' | ';
				}
				throw new CalloutException(messages);
			}
		}
	}
}
