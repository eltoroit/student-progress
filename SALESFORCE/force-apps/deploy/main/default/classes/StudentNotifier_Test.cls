@IsTest
public with sharing class StudentNotifier_Test {
	@IsTest
	private static void TestSimpleRecordCreation() {
		Course__c course = new Course__c();
		insert course;

		Exercise__c exercise = new Exercise__c();
		exercise.Course__c = course.Id;
		insert exercise;

		Delivery__c delivery = new Delivery__c();
		delivery.CurrentExercise__c = exercise.Id;
		insert delivery;

		Note__c note = new Note__c();
		note.Delivery__c = delivery.Id;
		insert note;

		Student__c student = new Student__c();
		student.Delivery__c = delivery.Id;
		insert student;

		Course_X_Delivery__c CxD = new Course_X_Delivery__c();
		CxD.Course__c = course.Id;
		CxD.Delivery__c = delivery.Id;
		insert CxD;

		Exercise_X_Student__c ExS = new Exercise_X_Student__c();
		ExS.Student__c = student.Id;
		ExS.Exercise__c = exercise.Id;
		insert ExS;
	}
}
