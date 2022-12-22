public without sharing class Data {
	@AuraEnabled
	public static List<Delivery__c> getActiveDeliveries() {
		List<Delivery__c> output = new List<Delivery__c>();

		output = [
			SELECT Id, Name, Instructor__c, CurrentExercise__r.Name, CurrentExerciseStart__c, CurrentExerciseIsActive__c
			FROM Delivery__c
			WHERE IsActive__c = TRUE
			ORDER BY Name ASC
		];

		return output;
	}

	@AuraEnabled
	public static List<Course__c> getCoursesPerDelivery(Id deliveryId) {
		List<Course__c> output = new List<Course__c>();
		List<Course_X_Delivery__c> CxDs = [
			SELECT Id, Name, Course__r.Name
			FROM Course_X_Delivery__c
			WHERE Delivery__r.IsActive__c = TRUE AND Delivery__c = :deliveryId
			ORDER BY Delivery__r.Name ASC, Order__c ASC
		];

		for (Course_X_Delivery__c CxD : CxDs) {
			output.add(CxD.Course__r);
		}

		return output;
	}

	@AuraEnabled
	public static List<Exercise__c> getAllExercisesForCourse(Id courseId) {
		List<Exercise__c> output = new List<Exercise__c>();

		output = [
			SELECT Id, Name, Course__c, Course__r.Name, ExpectedDuration__c, Order__c
			FROM Exercise__c
			WHERE Course__c = :courseId
			ORDER BY Order__c ASC
		];

		return output;
	}

	@AuraEnabled
	public static Map<String, Object> getDeliveryProgress(Id deliveryId) {
		Map<String, Object> output = new Map<String, Object>();

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

		return output;
	}

	@AuraEnabled
	public static List<Student__c> getExerciseProgress(Id deliveryId, Id exerciseId) {
		List<Student__c> output = new List<Student__c>();

		output = [
			SELECT
				Id,
				Name,
				IsInstructor__c,
				(
					SELECT Id, Status__c, CreatedDate, lastModifiedDate
					FROM Exercises_X_Students__r
					WHERE Exercise__c = :exerciseId
				)
			FROM Student__c
			WHERE Delivery__c = :deliveryId
			ORDER BY Name ASC
		];

		return output;
	}

	@AuraEnabled
	public static void updateStudentStatus(Id exerciseId, Id studentId, Id status) {
		List<Exercise_X_Student__c> ExSs = [
			SELECT Id, Name, Exercise__c, Student__c, Status__c
			FROM Exercise_X_Student__c
			WHERE Student__c = :studentId AND Exercise__c = :exerciseId
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

	@AuraEnabled
	public static Delivery__c startStopExercise(Id courseId, Id deliveryId, String exerciseId, Boolean isStart) {
		Delivery__c output = null;

		try {
			if (isStart) {
				// Update delivery
				Delivery__c delivery = [
					SELECT CurrentExercise__c, CurrentExerciseIsActive__c, CurrentExerciseStart__c
					FROM Delivery__c
					WHERE Id = :deliveryId
				];
				if (delivery.CurrentExercise__c != exerciseId) {
					delivery.CurrentExercise__c = exerciseId;
					delivery.CurrentExerciseStart__c = Datetime.now();
				}
				delivery.CurrentExerciseIsActive__c = true;
				update delivery;

				// Create ExS records
				List<Student__c> students = [
					SELECT Id, Name
					FROM Student__c
					WHERE Delivery__c = :deliveryId
					ORDER BY Name
				];

				List<Exercise_X_Student__c> existingExS = [
					SELECT Student__c
					FROM Exercise_X_Student__c
					WHERE Student__r.Delivery__c = :deliveryId AND Exercise__c = :exerciseId
				];

				if (existingExS.size() < students.size()) {
					Set<Id> missingStudentIds = new Set<Id>();
					for (Student__c student : students) {
						missingStudentIds.add(student.Id);
					}
					for (Exercise_X_Student__c ExS : existingExS) {
						missingStudentIds.remove(ExS.Student__c);
					}
					if (missingStudentIds.size() > 0) {
						List<Exercise_X_Student__c> newExS = new List<Exercise_X_Student__c>();
						for (Id studentId : missingStudentIds) {
							newExS.add(new Exercise_X_Student__c(Student__c = studentId, Exercise__c = exerciseId, Status__c = '00-START'));
						}
						insert newExS;
					} else {
						throw new CalloutException('I thought you said we were missing records...');
					}
				} else if (students.size() == existingExS.size()) {
					// Good to go
				} else {
					// Why?
					String msg = 'There are [' + existingExS.size() + '] ExS records, but only [' + students.size() + '] students';
					throw new CalloutException(msg);
				}
			} else {
				update new Delivery__c(Id = deliveryId, CurrentExerciseIsActive__c = false);
			}
		} catch (Exception e) {
			throw new AuraHandledException(e.getMessage());
		}
		output = [
			SELECT CurrentExercise__r.Name, CurrentExerciseIsActive__c, CurrentExerciseStart__c
			FROM Delivery__c
			WHERE Id = :deliveryId
		];

		return output;
	}

	@AuraEnabled
	public static Student__c registerStudent(Id deliveryId, String studentName) {
		Student__c student = new Student__c();

		student = new Student__c(Name = studentName, delivery__c = deliveryId, Key__c = deliveryId + '|' + studentName);
		upsert student Key__c;

		return student;
	}

	@AuraEnabled
	public static Map<String, Object> validateRegistration(Id deliveryId, Id studentId) {
		Map<String, Object> output = new Map<String, Object>();
		List<String> errors = new List<String>();

		output.put('student', '');
		output.put('delivery', '');
		List<Student__c> students = [SELECT Id, Name FROM Student__c WHERE Id = :studentId AND Delivery__c = :deliveryId];
		if (students.size() == 1) {
			output.put('student', students[0]);
		} else {
			errors.add('Invalid studentId');
		}
		List<Delivery__c> deliveries = [SELECT Id, Name FROM Delivery__c WHERE Id = :deliveryId AND IsActive__c = TRUE];
		if (deliveries.size() == 1) {
			output.put('delivery', deliveries[0]);
		} else {
			errors.add('Invalid deliveryId');
		}
		if (errors.size() > 0) {
			throw new CalloutException('Registration data is not valid: ' + JSON.serialize(errors));
		}

		return output;
	}

	// Other
	@AuraEnabled(cacheable=true)
	public static Exercise__c getActiveExercise(Id deliveryId) {
		Exercise__c output = null;

		List<Exercise__c> exercises = [
			SELECT Id, Name
			FROM Exercise__c
			WHERE
				Id IN (
					SELECT CurrentExercise__c
					FROM Delivery__c
					WHERE Id = :deliveryId AND CurrentExerciseIsActive__c = TRUE
				)
		];
		if (exercises.size() == 1) {
			output = exercises[0];
		}

		return output;
	}

	@AuraEnabled(cacheable=true)
	public static Student__c getStudentById(Id studentId) {
		Student__c output = new Student__c();

		output = [SELECT Id, Name FROM Student__c WHERE Id = :studentId];

		return output;
	}

	@AuraEnabled(cacheable=true)
	public static Delivery__c getDeliveryById(Id deliveryId) {
		Delivery__c output = new Delivery__c();

		output = [
			SELECT Id, Name, Instructor__c, CurrentExercise__r.Name, CurrentExerciseIsActive__c
			FROM Delivery__c
			WHERE Id = :deliveryId
		];

		return output;
	}

	@AuraEnabled(cacheable=true)
	public static Exercise__c getExercisetById(Id exerciseId) {
		Exercise__c output = new Exercise__c();

		output = [SELECT Id, Name FROM Exercise__c WHERE Id = :exerciseId];

		return output;
	}

	@AuraEnabled(cacheable=true)
	public static List<Student__c> getStudentsForDelivery(Id deliveryId) {
		List<Student__c> output = new List<Student__c>();

		output = [SELECT Id, Name FROM Student__c WHERE Delivery__c = :deliveryId ORDER BY Name ASC];

		return output;
	}
}
