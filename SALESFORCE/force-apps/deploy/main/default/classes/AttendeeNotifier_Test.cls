@IsTest
public with sharing class AttendeeNotifier_Test {
	@IsTest
	private static void TestSimpleRecordCreation() {
		Course__c course = new Course__c();
		course.Name = 'Test Course';
		insert course;

		Exercise__c exercise = new Exercise__c();
		exercise.Course__c = course.Id;
		exercise.Name = 'Test Exercise';
		exercise.ExpectedDuration__c = '120 minutes';
		exercise.Order__c = 1;
		insert exercise;

		Delivery__c delivery = new Delivery__c();
		delivery.CurrentExercise__c = exercise.Id;
		delivery.CurrentExerciseIsActive__c = true;
		delivery.CurrentExerciseStart__c = Datetime.now();
		delivery.Name = 'Test Delivery';
		// delivery.Instructor__c = 'Andres Perez';
		delivery.IsActive__c = true;
		insert delivery;

		Note__c note = new Note__c();
		note.Delivery__c = delivery.Id;
		note.Note__c = 'Sample note';
		insert note;

		Attendee__c attendee = new Attendee__c();
		attendee.ChosenDTTM__c = DateTime.now();
		attendee.Delivery__c = delivery.Id;
		attendee.Email__c = 'aperez@salesforce.com';
		attendee.FirstName__c = 'Andres';
		attendee.IsInstructor__c = true;
		attendee.LastName__c = 'Perez';
		attendee.Nickname__c = 'ELTOROIT';
		attendee.Name = 'Test Name';
		insert attendee;

		Course_X_Delivery__c CxD = new Course_X_Delivery__c();
		CxD.Course__c = course.Id;
		CxD.Delivery__c = delivery.Id;
		CxD.Order__c = 1;
		insert CxD;

		Exercise_X_Attendee__c ExA = new Exercise_X_Attendee__c();
		ExA.Delivery__c = 'Test Value For Delivery Id';
		ExA.Exercise__c = exercise.Id;
		ExA.Status__c = '00-START';
		ExA.Attendee__c = attendee.Id;
		insert ExA;
	}
}
