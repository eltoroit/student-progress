trigger tDelivery on Delivery__c(after insert, after update, after delete) {
	// Create instructor record in the delivery
	DeliveryTriggerHandler.CreateInstructorAsAttendee(Trigger.new, Trigger.oldMap);

	// Publish Events
	String keyFieldName = 'Id';
	Map<String, List<String>> mapRules = new Map<String, List<String>>();
	mapRules.put('IGNORE', new List<String>{ 'InstructorLookup__c' });
	mapRules.put('EXERCISE', new List<String>{ 'CurrentExercise__c', 'CurrentExerciseIsActive__c', 'CurrentExerciseStart__c' });
	AttendeeNotifier.publishEvents('Exercise_X_Attendee__c', keyFieldName, mapRules);
}
