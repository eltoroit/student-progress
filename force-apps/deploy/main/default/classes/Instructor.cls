public without sharing class Instructor {
	@AuraEnabled(cacheable=true)
	public static List<Course_X_Delivery__c> getActiveCxDs() {
		return [
			SELECT Id, Name, Course__r.Name, Delivery__r.Name, Delivery__r.CurrentExercise__r.Name
			FROM Course_X_Delivery__c
			WHERE Delivery__r.IsActive__c = TRUE
			ORDER BY Delivery__r.Name ASC, Order__c ASC
		];
	}

	@AuraEnabled(cacheable=true)
	public static List<Exercise__c> getAllExercisesForCxD(String CxD) {
		List<Exercise__c> output = new List<Exercise__c>();

		if (CxD != '') {
			List<String> parts = CxD.split('\\|');
			String courseId = parts[0];
			String deliveryId = parts[1];

			output = [
				SELECT Id, Name, Course__c, Course__r.Name, ExpectedDuration__c, Order__c
				FROM Exercise__c
				WHERE Course__c = :courseId
				ORDER BY Order__c ASC
			];
		}

		return output;
	}

	@AuraEnabled(cacheable=true)
	public static Map<String, Object> getStudentsProgress(String CxD, String exerciseId) {
		Map<String, Object> output = new Map<String, Object>();

		if (CxD != '') {
			List<String> parts = CxD.split('\\|');
			String courseId = parts[0];
			String deliveryId = parts[1];

			output.put(
				'TABLE',
				[
					SELECT
						Id,
						Name,
						IsInstructor__c,
						(SELECT ID, Status__c, lastModifiedDate FROM Exercises_X_Students__r WHERE Exercise__c = :exerciseId)
					FROM Student__c
					WHERE Delivery__c = :deliveryId
					ORDER BY Name ASC
				]
			);
			output.put('EXERCISES', Instructor.getAllExercisesForCxD(CxD));
			output.put(
				'DELIVERY',
				[
					SELECT CurrentExercise__r.Name, CurrentExerciseStart__c, CurrentExerciseIsActive__c
					FROM Delivery__c
					WHERE Id = :deliveryId AND CurrentExercise__c != NULL
				]
			);
			// output.put('DTTM', Datetime.now());
		}

		return output;
	}

	@AuraEnabled(cacheable=true)
	public static Map<String, Object> getClassReport(String CxD) {
		Map<String, Object> output = null;

		if (CxD != '') {
			output = new Map<String, Object>();
			List<String> parts = CxD.split('\\|');
			String courseId = parts[0];
			String deliveryId = parts[1];

			List<Student__c> students = [
				SELECT Id, Name, IsInstructor__c
				FROM Student__c
				WHERE Delivery__c = :deliveryId
				ORDER BY Name
			];
			List<Exercise__c> exercises = [
				SELECT
					Id,
					Name,
					(
						SELECT ID, Student__c, Student__r.Name, Status__c, lastModifiedDate
						FROM Exercises_X_Students__r
						WHERE Student__c IN :students
						ORDER BY lastModifiedDate ASC
					)
				FROM Exercise__c
				WHERE
					Id IN (
						SELECT Exercise__c
						FROM Exercise_X_Student__c
						WHERE Student__r.Delivery__c = :deliveryId
					)
				ORDER BY Name
			];
			output.put('STUDENTS', students);
			output.put('EXERCISES', exercises);
		}

		return output;
	}

	@AuraEnabled
	public static Delivery__c startStopExercise(String CxD, String exerciseId, Boolean isStart) {
		Delivery__c output = null;

		if (CxD != '') {
			List<String> parts = CxD.split('\\|');
			String courseId = parts[0];
			String deliveryId = parts[1];

			try {
				if (isStart) {
					update new Delivery__c(
						Id = deliveryId,
						CurrentExercise__c = exerciseId,
						CurrentExerciseIsActive__c = true,
						CurrentExerciseStart__c = Datetime.now()
					);
				} else {
					update new Delivery__c(Id = deliveryId, CurrentExerciseIsActive__c = false);
				}
				output = [
					SELECT CurrentExercise__r.Name, CurrentExerciseIsActive__c, CurrentExerciseStart__c
					FROM Delivery__c
					WHERE Id = :deliveryId
				];
			} catch (Exception e) {
				throw new AuraHandledException(e.getMessage());
			}
		}

		return output;
	}

	@AuraEnabled
	public static void updateStudentStatus(String ExS, String exerciseId, String studentId, String status) {
		Exercise_X_Student__c record = new Exercise_X_Student__c(
			Student__c = studentId,
			Exercise__c = exerciseId,
			Status__c = status
		);
		if (String.isEmpty(ExS)) {
			insert record;
		} else {
			record.Id = ExS;
			update record;
		}
	}
}
