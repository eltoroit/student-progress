@IsTest
public with sharing class StudentNotifier_Test {
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
		delivery.Instructor__c = 'Andres Perez';
		delivery.IsActive__c = true;
		insert delivery;

		Note__c note = new Note__c();
		note.Delivery__c = delivery.Id;
		note.Note__c = 'Sample note';
		insert note;

		Student__c student = new Student__c();
		student.ChosenDTTM__c = DateTime.now();
		student.Delivery__c = delivery.Id;
		student.Email__c = 'aperez@salesforce.com';
		student.FirstName__c = 'Andres';
		student.IsInstructor__c = true;
		student.LastName__c = 'Perez';
		student.Nickname__c = 'ELTOROIT';
		student.Name = 'Test Name';
		insert student;

		Course_X_Delivery__c CxD = new Course_X_Delivery__c();
		CxD.Course__c = course.Id;
		CxD.Delivery__c = delivery.Id;
		CxD.Order__c = 1;
		insert CxD;

		Exercise_X_Student__c ExS = new Exercise_X_Student__c();
		ExS.Delivery__c = 'Test Value For Delivery Id';
		ExS.Exercise__c = exercise.Id;
		ExS.Status__c = '00-START';
		ExS.Student__c = student.Id;
		insert ExS;
	}
}
