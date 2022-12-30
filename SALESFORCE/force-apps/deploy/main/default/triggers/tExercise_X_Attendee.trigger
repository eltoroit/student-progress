trigger tExercise_X_Attendee on Exercise_X_Attendee__c(after insert, after update, after delete) {
	String keyFieldName = 'Delivery__c';
	Map<String, List<String>> mapRules = new Map<String, List<String>>();
	AttendeeNotifier.publishEvents('Exercise_X_Attendee__c', keyFieldName, mapRules);
}
