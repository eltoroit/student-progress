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

		Attendee__c instructor = new Attendee__c();
		instructor.ChosenDTTM__c = DateTime.now();
		instructor.Delivery__c = null;
		instructor.Email__c = 'aperez@salesforce.com';
		instructor.FirstName__c = 'Andres';
		instructor.IsInstructor__c = true;
		instructor.LastName__c = 'Perez';
		instructor.Nickname__c = 'ELTOROIT';
		instructor.Name = 'Test Name';
		insert instructor;

		Delivery__c delivery = new Delivery__c();
		delivery.CurrentExercise__c = exercise.Id;
		delivery.CurrentExerciseIsActive__c = true;
		delivery.CurrentExerciseStart__c = Datetime.now();
		delivery.Name = 'Test Delivery';
		delivery.InstructorLookup__c = instructor.Id;
		delivery.IsActive__c = true;
		insert delivery;

		Note__c note = new Note__c();
		note.Delivery__c = delivery.Id;
		note.Note__c = 'Sample note';
		insert note;

		Course_X_Delivery__c CxD = new Course_X_Delivery__c();
		CxD.Course__c = course.Id;
		CxD.Delivery__c = delivery.Id;
		CxD.Order__c = 1;
		insert CxD;

		Exercise_X_Attendee__c ExA = new Exercise_X_Attendee__c();
		ExA.Delivery__c = 'Test Value For Delivery Id';
		ExA.Exercise__c = exercise.Id;
		ExA.Status__c = '00-START';
		ExA.Attendee__c = instructor.Id;
		insert ExA;
	}
}
