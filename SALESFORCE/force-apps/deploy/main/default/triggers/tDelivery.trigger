trigger tDelivery on DElivery__c(after insert, after update, after delete) {
	String keyFieldName = 'Id';
	Map<String, List<String>> mapRules = new Map<String, List<String>>();
	mapRules.put('IGNORE', new List<String>{ 'InstructorLookup__c' });
	mapRules.put('EXERCISE', new List<String>{ 'CurrentExercise__c', 'CurrentExerciseIsActive__c', 'CurrentExerciseStart__c' });
	AttendeeNotifier.publishEvents('Exercise_X_Attendee__c', keyFieldName, mapRules);
}
