trigger tExercise_X_Student on Exercise_X_Student__c(after insert, after update, after delete) {
	String keyFieldName = 'Delivery__c';
	Map<String, List<String>> mapRules = new Map<String, List<String>>();
	StudentNotifier.publishEvents('Exercise_X_Student__c', keyFieldName, mapRules);
}
