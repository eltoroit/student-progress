@isTest
public without sharing class TestValidateData {
	@testSetup
	static void makeSingleRecords() {
		Course__c course = new Course__c();
		course.Name = 'Test Course';
		insert course;

		Exercise__c exercise = new Exercise__c();
		exercise.Course__c = course.Id;
		exercise.ExpectedDuration__c = '120 minutes';
		exercise.Name = 'Test Exercise';
		exercise.Order__c = 1;
		insert exercise;

		Attendee__c instructor = new Attendee__c();
		instructor.ChosenDTTM__c = null;
		instructor.Delivery__c = null;
		instructor.Email__c = 'aperez@salesforce.com';
		instructor.FirstName__c = 'Andres';
		instructor.IsInstructor__c = false;
		instructor.LastName__c = 'Perez';
		instructor.Name__c = 'Test Name';
		instructor.Nickname__c = 'ELTOROIT';
		instructor.RecordTypeId = Schema.SObjectType.Attendee__c.getRecordTypeInfosByName().get('Instructor').getRecordTypeId();
		insert instructor;

		Delivery__c delivery = new Delivery__c();
		delivery.CurrentExercise__c = exercise.Id;
		delivery.CurrentExerciseIsActive__c = true;
		delivery.CurrentExerciseStart__c = Datetime.now();
		delivery.InstructorLookup__c = instructor.Id;
		delivery.IsActive__c = true;
		delivery.Name = 'Test Delivery';
		insert delivery;

		Attendee__c student = new Attendee__c();
		student.ChosenDTTM__c = DateTime.now();
		student.Delivery__c = delivery.Id;
		student.Email__c = 'aperez@salesforce.com';
		student.FirstName__c = 'Student';
		student.IsInstructor__c = false;
		student.LastName__c = 'Pizza';
		student.Nickname__c = 'Smarty';
		student.Name__c = 'Test Name';
		instructor.RecordTypeId = Schema.SObjectType.Attendee__c.getRecordTypeInfosByName().get('Attendee').getRecordTypeId();
		insert student;

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
		ExA.Attendee__c = instructor.Id;
		ExA.Delivery__c = 'Test Value 4 De...';
		ExA.Exercise__c = exercise.Id;
		ExA.Status__c = '00-START';
		insert ExA;
	}

	@IsTest
	private static void validateRequiredFields() {
		// Salesforce that if a field is required, it has a value. Here we are checking that the administrator has not made the field not required
		validateRequiredFields('Attendee__c', 'FirstName__c');
		validateRequiredFields('Attendee__c', 'LastName__c');
		validateRequiredFields('Course_X_Delivery__c', 'Order__c');
		validateRequiredFields('Delivery__c', 'InstructorLookup__c');
		validateRequiredFields('Exercise__c', 'Order__c');
		validateRequiredFields('Exercise_X_Attendee__c', 'Status__c');
	}

	@IsTest
	private static void validateAttendeeRequiresDelivery() {
		Attendee__c student = (Attendee__c) clone(getFullRecords('Attendee__c', 'RecordType.Name = \'Attendee\'', 'RecordType.Name')[0]);
		System.assertEquals('Attendee', student.RecordType.Name);

		try {
			student.Delivery__c = null;
			insert student;
			System.assert(false, 'Students do require a delivery');
		} catch (Exception ex) {
			List<String> expectedMessages = new List<String>{ 'Insert failed', 'FIELD_CUSTOM_VALIDATION_EXCEPTION', 'Attendees require a delivery' };
			System.assertEquals('System.DmlException', ex.getTypeName(), 'Expecting: System.DmlException');
			for (String expectedMessage : expectedMessages) {
				System.assert(ex.getMessage().contains(expectedMessage), 'Expecting: ' + expectedMessage);
			}
		}
	}

	@IsTest
	private static void validateInstructorsCanNotHaveDelivery() {
		Attendee__c instructor = (Attendee__c) clone(getFullRecords('Attendee__c', 'RecordType.Name = \'Instructor\'', 'RecordType.Name')[0]);
		System.assertEquals('Instructor', instructor.RecordType.Name);

		Delivery__c delivery = [SELECT Id FROM Delivery__c];

		try {
			instructor.Delivery__c = delivery.Id;
			insert instructor;
			System.assert(false, 'Instructors can not have deliveries');
		} catch (Exception ex) {
			List<String> expectedMessages = new List<String>{
				'Insert failed',
				'FIELD_CUSTOM_VALIDATION_EXCEPTION',
				'Instructors can\'t have delivery'
			};
			System.assertEquals('System.DmlException', ex.getTypeName(), 'Expecting: System.DmlException');
			for (String expectedMessage : expectedMessages) {
				System.assert(ex.getMessage().contains(expectedMessage), 'Expecting: ' + expectedMessage);
			}
		}
	}

	private static void validateRequiredFields(String SObjectName, String FieldName) {
		SObject record = getFullRecords(SObjectName)[0];
		SObject newRecord = clone(record);
		newRecord.put(FieldName, null);
		try {
			insert newRecord;
			System.assert(false);
		} catch (Exception ex) {
			List<String> expectedMessages = new List<String>{ 'Insert failed', 'REQUIRED_FIELD_MISSING', fieldName };
			System.assertEquals('System.DmlException', ex.getTypeName(), 'Expecting: System.DmlException');
			for (String expectedMessage : expectedMessages) {
				System.assert(ex.getMessage().contains(expectedMessage), 'Expecting: ' + expectedMessage);
			}
		}
	}

	private static List<sObject> getFullRecords(String SObjectName) {
		return getFullRecords(SObjectName, null, null);
	}
	private static List<sObject> getFullRecords(String SObjectName, String filter) {
		return getFullRecords(SObjectName, filter, null);
	}
	private static List<sObject> getFullRecords(String SObjectName, String filter, String extraFields) {
		String SOQL = '';
		for (String field : Schema.getGlobalDescribe().get(SObjectName).getDescribe().fields.getMap().keySet()) {
			if (SOQL != '')
				SOQL += ', ';
			SOQL += field;
		}
		if (extraFields != null) {
			SOQL += ', ' + extraFields;
		}
		SOQL = 'SELECT ' + SOQL + ' FROM ' + SObjectName;
		if (filter != null) {
			SOQL += ' WHERE ' + filter;
		}
		return Database.query(SOQL);
	}

	private static sObject clone(Sobject original) {
		Boolean preserveId = false;
		Boolean isDeepClone = true;
		Sobject newRecord = original.clone(preserveId, isDeepClone);
		return newRecord;
	}
}
