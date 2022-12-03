public without sharing class Students {
	@AuraEnabled(cacheable=true)
	public static List<Delivery__c> getActiveDeliveries() {
		return [SELECT Id, Name, ActiveExercise__r.Name FROM Delivery__c WHERE IsActive__c = TRUE ORDER BY Name ASC];
	}

	@AuraEnabled(cacheable=true)
	public static Exercise__c getActiveExercise(String exerciseId) {
		Exercise__c output = null;
		List<Exercise__c> exercises = [SELECT Id, Name FROM Exercise__c WHERE Id = :exerciseId];
		if (exercises.size() == 1) {
			output = exercises[0];
		}
		return output;
	}

	@AuraEnabled(cacheable=true)
	public static List<Student__c> getStudents() {
		return [SELECT Id, Name FROM Student__c ORDER BY Name ASC];
	}

	@AuraEnabled(cacheable=true)
	public static List<Course_X_Delivery__c> getActiveCxDs() {
		return [SELECT Id, Name, Course__r.Name, Delivery__r.Name, Delivery__r.ActiveExercise__r.Name FROM Course_X_Delivery__c WHERE Delivery__r.IsActive__c = TRUE ORDER BY Delivery__r.Name ASC, Order__c ASC];
	}

	@AuraEnabled(cacheable=true)
	public static List<Exercise__c> getAllExercisesForCxD(String CxD) {
		List<Exercise__c> output = new List<Exercise__c>();

		if (CxD != null) {
			List<String> parts = CxD.split('\\|');
			String courseId = parts[0];
			String deliveryId = parts[1];

			output = [SELECT Id, Name, Course__c, Course__r.Name, ExpectedDuration__c, Order__c FROM Exercise__c WHERE Course__c = :courseId ORDER BY Order__c ASC];
		}

		return output;
	}

	@AuraEnabled
	public static Delivery__c startStopExercise(String CxD, String exerciseId, Boolean isStart) {
		Delivery__c output = null;

		if (CxD != null) {
			List<String> parts = CxD.split('\\|');
			String courseId = parts[0];
			String deliveryId = parts[1];

			try {
				if (isStart) {
					update new Delivery__c(Id = deliveryId, ActiveExercise__c = exerciseId, ActivatedDTTM__c = Datetime.now());
				} else {
					update new Delivery__c(Id = deliveryId, ActiveExercise__c = null, ActivatedDTTM__c = null);
				}
				output = [SELECT ActiveExercise__r.Name, ActivatedDTTM__c FROM Delivery__c WHERE Id = :deliveryId];
			} catch (Exception e) {
				throw new AuraHandledException(e.getMessage());
			}
		}

		return output;
	}

	@AuraEnabled(cacheable=true)
	public static Map<String, Object> getStudentsProgress(String CxD, String exerciseId) {
		Map<String, Object> output = new Map<String, Object>();

		if (CxD != null) {
			List<String> parts = CxD.split('\\|');
			String courseId = parts[0];
			String deliveryId = parts[1];

			output.put(
				'TABLE',
				[
					SELECT Id, Name, (SELECT ID, Status__c, lastModifiedDate FROM Exercises_X_Students__r WHERE Exercise__c = :exerciseId)
					FROM Student__c
					WHERE Delivery__c = :deliveryId
					ORDER BY Name ASC
				]
			);
			output.put('EXERCISES', Students.getAllExercisesForCxD(CxD));
			output.put('DELIVERY', [SELECT ActiveExercise__r.Name, ActivatedDTTM__c FROM Delivery__c WHERE Id = :deliveryId AND ActiveExercise__c != NULL]);
			// output.put('DTTM', Datetime.now());
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
