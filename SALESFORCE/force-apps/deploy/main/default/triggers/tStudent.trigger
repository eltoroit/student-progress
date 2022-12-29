trigger tStudent on Student__c(after insert, after update, after delete) {
	String keyFieldName = 'Delivery__c';
	Map<String, List<String>> mapRules = new Map<String, List<String>>();
	mapRules.put('IGNORE', new List<String>{ 'ChosenDTTM__c' });
	StudentNotifier.publishEvents('Student__c', keyFieldName, mapRules);
}
