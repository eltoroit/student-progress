public with sharing class Notifier {
	public enum BASIC_RULES {
		IGNORE
	}

	public static List<NotifySocket__e> publishEvents(String entityName, String keyFieldName, Map<String, List<String>> mapRules) {
		List<NotifySocket__e> socketEvents = processRecords(entityName, keyFieldName, mapRules);
		publishEvents(socketEvents);
		return socketEvents;
	}

	@TestVisible
	private static List<NotifySocket__e> processRecords(String entityName, String keyFieldName, Map<String, List<String>> mapRules) {
		List<NotifySocket__e> socketEvents = new List<NotifySocket__e>();
		List<SObject> sobjs = Trigger.isDelete ? Trigger.old : Trigger.new;
		Map<Id, Map<String, Integer>> data = new Map<Id, Map<String, Integer>>();

		// Add system fields to ignore
		List<String> ignorefields = new List<String>();
		if (mapRules.containsKey(String.valueOf(NOTIFIER.BASIC_RULES.IGNORE))) {
			ignorefields = mapRules.get(String.valueOf(NOTIFIER.BASIC_RULES.IGNORE));
		}
		ignorefields.addAll(new List<String>{ 'LastModifiedDate', 'SystemModstamp' });

		// Process all records, grouping changes by rules
		for (SObject sobj : sobjs) {
			Id deliveryId = (Id) sobj.get(keyFieldName);
			if (deliveryId != null) {
				SObject sobjOld = null;
				if (Trigger.isUpdate) {
					sobjOld = Trigger.oldMap.get(sobj.Id);
				}

				Map<String, List<String>> fieldsChangedGroupedByRule = findFieldsChangedGroupedByRule(sobj, sobjOld, entityName, mapRules);
				for (String ruleName : fieldsChangedGroupedByRule.keySet()) {
					Map<String, Integer> dataByDeliveryId = new Map<String, Integer>();
					if (data.containsKey(deliveryId)) {
						dataByDeliveryId = data.get(deliveryId);
					}
					Integer count = 0;
					if (dataByDeliveryId.containsKey(ruleName)) {
						count = dataByDeliveryId.get(ruleName);
					}
					dataByDeliveryId.put(ruleName, ++count);
					data.put(deliveryId, dataByDeliveryId);
				}
			}
		}

		// If there is a rule that is not entityName, then delete entityName to avoid reporting that.
		// If there are multiple "special" rules, then report on all
		for (Id deliveryId : data.keySet()) {
			Map<String, Integer> dataByDeliveryId = data.get(deliveryId);
			if (dataByDeliveryId.size() > 1) {
				dataByDeliveryId.remove(entityName);
				data.put(deliveryId, dataByDeliveryId);
			}
		}

		// Create events
		for (Id deliveryId : data.keySet()) {
			Map<String, Integer> dataByDeliveryId = data.get(deliveryId);
			for (String ruleName : dataByDeliveryId.keySet()) {
				Integer count = dataByDeliveryId.get(ruleName);
				socketEvents.add(new NotifySocket__e(Delivery__c = deliveryId, EntityName__c = ruleName, Records__c = count));
			}
		}

		System.debug('processRecords: ' + socketEvents);
		return socketEvents;
	}

	@TestVisible
	private static Map<String, List<String>> findFieldsChangedGroupedByRule(
		SObject sobjNew,
		SObject sobjOld,
		String entityName,
		Map<String, List<String>> mapRules
	) {
		Map<String, List<String>> output = new Map<String, List<String>>();
		Map<String, String> parsedRules = new Map<String, String>();

		// Parse rules
		for (String ruleName : mapRules.keySet()) {
			for (String fieldName : mapRules.get(ruleName)) {
				if (parsedRules.containsKey(fieldName)) {
					String sobjName = sobjNew.getsObjectType().getDescribe().getName();
					throw new CalloutException('FieldName [' + fieldName + '] already included in mapRules. Processing [' + sobjName + ']');
				} else {
					parsedRules.put(fieldName, ruleName);
				}
			}
		}

		// Process record
		Set<String> fieldNames = new Set<String>();
		Map<String, Object> oldValues = new Map<String, Object>();
		Map<String, Object> newValues = new Map<String, Object>();

		newValues = sobjNew.getPopulatedFieldsAsMap();
		fieldNames.addAll(newValues.keySet());
		
		if (sobjOld != null) {
			oldValues = sobjOld?.getPopulatedFieldsAsMap();
			fieldNames.addAll(oldValues.keySet());
		}
		
		for (String fieldName : fieldNames) {
			if (parsedRules.get(fieldName) == String.valueOf(NOTIFIER.BASIC_RULES.IGNORE)) {
				// Skip field
			} else {
				Boolean isChanged = true;
				if (sobjOld != null) {
					isChanged = newValues.get(fieldName) != oldValues.get(fieldName);
				}
				if (isChanged) {
					String ruleName = entityName;
					if (parsedRules.containsKey(fieldName)) {
						ruleName = parsedRules.get(fieldName);
					}
					List<String> fieldsForRule = new List<String>();
					if (output.containsKey(ruleName)) {
						fieldsForRule = output.get(ruleName);
					}
					fieldsForRule.add(fieldName);
					output.put(ruleName, fieldsForRule);
				}
			}
		}

		System.debug('findFieldsChangedGroupedByRule: ' + output);
		return output;
	}

	private static void publishEvents(List<NotifySocket__e> socketEvents) {
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
