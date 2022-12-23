public without sharing class Instructor {
	@AuraEnabled(cacheable=true)
	public static List<Course_X_Delivery__c> getActiveCxDs() {
		// return [
		// 	SELECT
		// 		Id,
		// 		Name,
		// 		Course__r.Name,
		// 		Delivery__r.Name,
		// 		Delivery__r.CurrentExercise__r.Name,
		// 		Delivery__r.CurrentExerciseStart__c,
		// 		Delivery__r.CurrentExerciseIsActive__c
		// 	FROM Course_X_Delivery__c
		// 	WHERE Delivery__r.IsActive__c = TRUE
		// 	ORDER BY Delivery__r.Name ASC, Order__c ASC
		// ];
		return null;
	}

	@AuraEnabled(cacheable=true)
	public static List<Exercise__c> getAllExercisesForCxD(String CxD) {
		// List<Exercise__c> output = new List<Exercise__c>();

		// System.debug('*' + CxD + '*');
		// if (CxD != null && CxD != '') {
		// 	List<String> parts = CxD.split('\\|');
		// 	String courseId = parts[0];
		// 	String deliveryId = parts[1];

		// 	output = [
		// 		SELECT Id, Name, Course__c, Course__r.Name, ExpectedDuration__c, Order__c
		// 		FROM Exercise__c
		// 		WHERE Course__c = :courseId
		// 		ORDER BY Order__c ASC
		// 	];
		// }

		// return output;
		return null;
	}

	// Display table of student status for exercise
	@AuraEnabled(cacheable=true)
	public static Map<String, Object> getStudentsProgress(String CxD, String exerciseId) {
		// Map<String, Object> output = new Map<String, Object>();

		// System.debug('*' + CxD + '*');
		// if (CxD != null && CxD != '') {
		// 	List<String> parts = CxD.split('\\|');
		// 	String courseId = parts[0];
		// 	String deliveryId = parts[1];

		// 	List<Student__c> students = [
		// 		SELECT
		// 			Id,
		// 			Name,
		// 			IsInstructor__c,
		// 			(
		// 				SELECT ID, Status__c, CreatedDate, lastModifiedDate
		// 				FROM Exercises_X_Students__r
		// 				WHERE Exercise__c = :exerciseId
		// 			)
		// 		FROM Student__c
		// 		WHERE Delivery__c = :deliveryId
		// 		ORDER BY Name ASC
		// 	];
		// 	Delivery__c delivery = null;
		// 	try {
		// 		delivery = [
		// 			SELECT CurrentExercise__r.Name, CurrentExerciseStart__c, CurrentExerciseIsActive__c
		// 			FROM Delivery__c
		// 			WHERE Id = :deliveryId AND CurrentExercise__c != NULL
		// 		];
		// 	} catch (Exception ex) {
		// 		// Do not handle this, just ignore it.
		// 	}
		// 	output.put('TABLE', students);
		// 	output.put('DELIVERY', delivery);
		// 	output.put('EXERCISES', Instructor.getAllExercisesForCxD(CxD));
		// }

		// return output;
		return null;
	}

	// Display chart with data for entire delivery
	@AuraEnabled(cacheable=true)
	public static Map<String, Object> getClassReport(String CxD) {
		// Map<String, Object> output = null;

		// System.debug('*' + CxD + '*');
		// if (CxD != null && CxD != '') {
		// 	output = new Map<String, Object>();
		// 	List<String> parts = CxD.split('\\|');
		// 	String courseId = parts[0];
		// 	String deliveryId = parts[1];

		// 	List<Student__c> students = [
		// 		SELECT Id, Name, IsInstructor__c
		// 		FROM Student__c
		// 		WHERE Delivery__c = :deliveryId
		// 		ORDER BY Name
		// 	];
		// 	List<Exercise__c> exercises = [
		// 		SELECT
		// 			Id,
		// 			Name,
		// 			(
		// 				SELECT ID, Student__c, Student__r.Name, Status__c, lastModifiedDate
		// 				FROM Exercises_X_Students__r
		// 				WHERE Student__c IN :students
		// 				ORDER BY lastModifiedDate ASC
		// 			)
		// 		FROM Exercise__c
		// 		WHERE
		// 			Id IN (
		// 				SELECT Exercise__c
		// 				FROM Exercise_X_Student__c
		// 				WHERE Student__r.Delivery__c = :deliveryId
		// 			)
		// 		ORDER BY Name
		// 	];
		// 	output.put('STUDENTS', students);
		// 	output.put('EXERCISES', exercises);
		// }

		// return output;
		return null;
	}

	@AuraEnabled
	public static Delivery__c startStopExercise(String CxD, String exerciseId, Boolean isStart) {
		// Delivery__c output = null;

		// System.debug('*' + CxD + '*');
		// if (CxD != null && CxD != '') {
		// 	List<String> parts = CxD.split('\\|');
		// 	String courseId = parts[0];
		// 	String deliveryId = parts[1];

		// 	try {
		// 		if (isStart) {
		// 			update new Delivery__c(
		// 				Id = deliveryId,
		// 				CurrentExercise__c = exerciseId,
		// 				CurrentExerciseIsActive__c = true,
		// 				CurrentExerciseStart__c = Datetime.now()
		// 			);

		// 			List<Student__c> students = [
		// 				SELECT Id, Name
		// 				FROM Student__c
		// 				WHERE Delivery__c = :deliveryId
		// 				ORDER BY Name
		// 			];

		// 			List<Exercise_X_Student__c> existingExS = [
		// 				SELECT Student__c
		// 				FROM Exercise_X_Student__c
		// 				WHERE Student__r.Delivery__c = :deliveryId AND Exercise__c = :exerciseId
		// 			];

		// 			if (existingExS.size() < students.size()) {
		// 				// Must create missing ExS
		// 				Set<Id> missingStudentIds = new Set<Id>();
		// 				for (Student__c student : students) {
		// 					missingStudentIds.add(student.Id);
		// 				}
		// 				for (Exercise_X_Student__c ExS : existingExS) {
		// 					missingStudentIds.remove(ExS.Student__c);
		// 				}
		// 				if (missingStudentIds.size() > 0) {
		// 					List<Exercise_X_Student__c> newExS = new List<Exercise_X_Student__c>();
		// 					for (Id studentId : missingStudentIds) {
		// 						newExS.add(
		// 							new Exercise_X_Student__c(
		// 								Student__c = studentId,
		// 								Exercise__c = exerciseId,
		// 								Status__c = '00-START'
		// 							)
		// 						);
		// 					}
		// 					insert newExS;
		// 				} else {
		// 					throw new CalloutException('I thought you said we were missing records...');
		// 				}
		// 			} else if (students.size() == existingExS.size()) {
		// 				// Good to go
		// 			} else {
		// 				// Why?
		// 				throw new CalloutException(
		// 					'There are [' +
		// 					existingExS.size() +
		// 					'] ExS records, but only [' +
		// 					students.size() +
		// 					'] students'
		// 				);
		// 			}
		// 		} else {
		// 			update new Delivery__c(Id = deliveryId, CurrentExerciseIsActive__c = false);
		// 		}
		// 		output = [
		// 			SELECT CurrentExercise__r.Name, CurrentExerciseIsActive__c, CurrentExerciseStart__c
		// 			FROM Delivery__c
		// 			WHERE Id = :deliveryId
		// 		];
		// 	} catch (Exception e) {
		// 		throw new AuraHandledException(e.getMessage());
		// 	}
		// }

		// return output;
		return null;
	}

	@AuraEnabled
	public static void updateStudentStatus(String ExS, String exerciseId, String studentId, String status) {
		// Exercise_X_Student__c record = new Exercise_X_Student__c(
		// 	Student__c = studentId,
		// 	Exercise__c = exerciseId,
		// 	Status__c = status
		// );
		// if (String.isEmpty(ExS)) {
		// 	insert record;
		// } else {
		// 	record.Id = ExS;
		// 	update record;
		// }
	}
}
