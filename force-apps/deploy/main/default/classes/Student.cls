public without sharing class Student {
	@AuraEnabled(cacheable=true)
	public static List<Delivery__c> getActiveDeliveries() {
		return [
			SELECT Id, Name, CurrentExercise__r.Name, Instructor__c
			FROM Delivery__c
			WHERE IsActive__c = TRUE AND Id IN (SELECT Delivery__c FROM Course_X_Delivery__c)
			ORDER BY Name ASC
		];
	}

	@AuraEnabled(cacheable=true)
	public static List<Student__c> getStudentsForDelivery(String deliveryId) {
		return [SELECT Id, Name FROM Student__c WHERE Delivery__c = :deliveryId ORDER BY Name ASC];
	}

	@AuraEnabled(cacheable=true)
	public static Student__c getStudentById(String studentId) {
		return [SELECT Id, Name FROM Student__c WHERE Id = :studentId];
	}

	@AuraEnabled(cacheable=true)
	public static Delivery__c getDeliveryById(String deliveryId) {
		return [SELECT Id, Name, Instructor__c, CurrentExercise__c FROM Delivery__c WHERE Id = :deliveryId];
	}

	@AuraEnabled(cacheable=true)
	public static Exercise__c getExercisetById(String exerciseId) {
		return [SELECT Id, Name FROM Exercise__c WHERE Id = :exerciseId];
	}

	@AuraEnabled(cacheable=true)
	public static Exercise__c getActiveExercise(String deliveryId) {
		Exercise__c output = null;
		List<Exercise__c> exercises = [
			SELECT Id, Name
			FROM Exercise__c
			WHERE Id IN (SELECT CurrentExercise__c FROM Delivery__c WHERE Id = :deliveryId)
		];
		if (exercises.size() == 1) {
			output = exercises[0];
		}
		return output;
	}

	@AuraEnabled
	public static Student__c registerStudent(String deliveryId, String studentName) {
		Student__c student = new Student__c(Name = studentName, delivery__c = deliveryId);
		upsert student Name;
		return student;
	}

	@AuraEnabled(cacheable=true)
	public static Map<String, String> validateRegistration(String deliveryId, String studentId) {
		List<String> errors = new List<String>();
		Map<String, String> output = new Map<String, String>();
		output.put('deliveryId', '');
		output.put('studentId', '');

		List<Delivery__c> deliveries = [SELECT Id FROM Delivery__c WHERE IsActive__c = TRUE AND Id = :deliveryId];
		if (deliveries.size() == 1) {
			output.put('deliveryId', deliveryId);
		} else {
			errors.add('Invalid deliveryId');
		}

		List<Student__c> students = [SELECT Id FROM Student__c WHERE Delivery__c = :deliveryId AND Id = :studentId];
		if (students.size() == 1) {
			output.put('studentId', studentId);
		} else {
			errors.add('Invalid studentId');
		}

		if (errors.size() > 0) {
			throw new CalloutException('Registration data is not valid: ' + JSON.serialize(errors));
		}

		return output;
	}

	@AuraEnabled
	public static void updateStatus(String exerciseId, String studentId, String status) {
		List<Exercise_X_Student__c> ExSs = [
			SELECT Id, Name, Exercise__c, Student__c, Status__c
			FROM Exercise_X_Student__c
			WHERE Exercise__c = :exerciseId AND Student__c = :studentId
		];
		Exercise_X_Student__c ExS;
		if (ExSs.size() == 0) {
			ExS = new Exercise_X_Student__c(Exercise__c = exerciseId, Student__c = studentId);
		} else if (ExSs.size() == 1) {
			ExS = ExSs[0];
		} else {
			throw new AuraException('Multiple records per student');
		}
		ExS.Status__c = status;
		upsert ExS;
	}
}
