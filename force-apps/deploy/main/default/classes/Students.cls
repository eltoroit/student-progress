public without sharing class Students {
	@AuraEnabled(cacheable=true)
	public static List<Student__c> getStudents() {
		return [SELECT Id, Name FROM Student__c ORDER BY Name ASC];
	}

	@AuraEnabled(cacheable=true)
	public static List<Exercise__c> getActiveExercises() {
		return [SELECT Id, Name, IsActive__c, Start__c, End__c FROM Exercise__c WHERE IsActive__c = TRUE ORDER BY Name ASC];
	}

	@AuraEnabled(cacheable=true)
	public static List<Exercise__c> getAllExercises() {
		return [SELECT Id, Name, IsActive__c, Start__c, End__c FROM Exercise__c ORDER BY Name ASC];
	}

	@AuraEnabled
	public static List<Exercise__c> activateExercise(String Id) {
		List<Exercise__c> activeExercises = getActiveExercises();
		for (Exercise__c active : activeExercises) {
			active.IsActive__c = false;
		}
		update activeExercises;
		update new Exercise__c(Id = Id, IsActive__c = true, Start__c = Datetime.now());
		return getAllExercises();
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

	@AuraEnabled(cacheable=true)
	public static Map<String, Object> getStudentsProgress(String exerciseId) {
		Map<String, Object> output = new Map<String, Object>();
		output.put(
			'TABLE',
			[
				SELECT Id, Name, (SELECT ID, Status__c, lastModifiedDate FROM Exercises_X_Students__r WHERE Exercise__c = :exerciseId)
				FROM Student__c
				ORDER BY Name
			]
		);
		output.put('EXERCISES', [SELECT Id, Name, IsActive__c, Start__c, End__c FROM Exercise__c WHERE Id = :exerciseId]);
		// output.put('DTTM', Datetime.now());
		return output;
	}

	@AuraEnabled(cacheable=true)
	public static Map<String, Object> getClassReport() {
		Map<String, Object> output = new Map<String, Object>();
		output.put(
			'STUDENTS',
			[
				SELECT Id, Name
				FROM Student__c
				ORDER BY Name
			]
		);
		output.put(
			'EXERCISES',
			[
				SELECT
					Id,
					Name,
					(
						SELECT ID, Student__r.Name, Status__c, lastModifiedDate
						FROM Exercises_X_Students__r
						ORDER BY lastModifiedDate ASC
					)
				FROM Exercise__c
				WHERE Id IN (SELECT Exercise__c FROM Exercise_X_Student__c)
				ORDER BY Name
			]
		);
		return output;
	}
}
