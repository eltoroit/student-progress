public without sharing class Instructor {
    @AuraEnabled(cacheable=true)
	public static List<Course_X_Delivery__c> getActiveCxDs() {
		return [
			SELECT Id, Name, Course__r.Name, Delivery__r.Name, Delivery__r.ActiveExercise__r.Name
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
					SELECT ActiveExercise__r.Name, ActivatedDTTM__c
					FROM Delivery__c
					WHERE Id = :deliveryId AND ActiveExercise__c != NULL
				]
			);
			// output.put('DTTM', Datetime.now());
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
						ActiveExercise__c = exerciseId,
						ActivatedDTTM__c = Datetime.now()
					);
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
}
