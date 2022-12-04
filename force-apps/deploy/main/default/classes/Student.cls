public without sharing class Student {
	@AuraEnabled(cacheable=true)
	public static List<Delivery__c> getActiveDeliveries() {
		return [
			SELECT Id, Name, ActiveExercise__r.Name, Instructor__c
			FROM Delivery__c
			WHERE IsActive__c = TRUE
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
		return [SELECT Id, Name, Instructor__c, ActiveExercise__c FROM Delivery__c WHERE Id = :deliveryId];
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
			WHERE Id IN (SELECT ActiveExercise__c FROM Delivery__c WHERE Id = :deliveryId)
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

	//////////////////////////////

	// @AuraEnabled(cacheable=true)
	// public static List<Exercise__c> getActiveExercises() {
	// 	return [SELECT Id, Name, IsActive__c FROM Exercise__c WHERE IsActive__c = TRUE ORDER BY Name ASC];
	// }

	// @AuraEnabled
	// public static List<Exercise__c> activateExercise(String exerciseId, String courseId) {
	// 	List<Exercise__c> activeExercises = getActiveExercises();
	// 	for (Exercise__c active : activeExercises) {
	// 		active.IsActive__c = false;
	// 	}
	// 	update activeExercises;
	// 	update new Exercise__c(Id = exerciseId, IsActive__c = true); //, Start__c = Datetime.now()
	// 	return getAllExercisesForCourse(courseId);
	// }

	// @AuraEnabled(cacheable=true)
	// public static Map<String, Object> getClassReport() {
	// 	Map<String, Object> output = new Map<String, Object>();
	// 	output.put(
	// 		'STUDENTS',
	// 		[
	// 			SELECT Id, Name
	// 			FROM Student__c
	// 			ORDER BY Name
	// 		]
	// 	);
	// 	output.put(
	// 		'EXERCISES',
	// 		[
	// 			SELECT
	// 				Id,
	// 				Name,
	// 				(
	// 					SELECT ID, Student__r.Name, Status__c, lastModifiedDate
	// 					FROM Exercises_X_Students__r
	// 					ORDER BY lastModifiedDate ASC
	// 				)
	// 			FROM Exercise__c
	// 			WHERE Id IN (SELECT Exercise__c FROM Exercise_X_Student__c)
	// 			ORDER BY Name
	// 		]
	// 	);
	// 	return output;
	// }
}
