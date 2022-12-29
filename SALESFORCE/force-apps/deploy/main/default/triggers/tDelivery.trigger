trigger tDelivery on DElivery__c(after insert, after update, after delete) {
	String keyFieldName = 'Id';
	Map<String, List<String>> mapRules = new Map<String, List<String>>();
	mapRules.put('IGNORE', new List<String>{ 'Instructor__c' });
	mapRules.put('EXERCISE', new List<String>{ 'CurrentExercise__c', 'CurrentExerciseIsActive__c', 'CurrentExerciseStart__c' });
	StudentNotifier.publishEvents('Exercise_X_Student__c', keyFieldName, mapRules);
}
