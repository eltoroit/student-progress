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

	// Display table of attendee status for exercise
	@AuraEnabled(cacheable=true)
	public static Map<String, Object> getAttendeesProgress(String CxD, String exerciseId) {
		// Map<String, Object> output = new Map<String, Object>();

		// System.debug('*' + CxD + '*');
		// if (CxD != null && CxD != '') {
		// 	List<String> parts = CxD.split('\\|');
		// 	String courseId = parts[0];
		// 	String deliveryId = parts[1];

		// 	List<Attendee__c> attendees = [
		// 		SELECT
		// 			Id,
		// 			Name,
		// 			IsInstructor__c,
		// 			(
		// 				SELECT ID, Status__c, CreatedDate, lastModifiedDate
		// 				FROM Exercises_X_Attendees__r
		// 				WHERE Exercise__c = :exerciseId
		// 			)
		// 		FROM Attendee__c
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
		// 	output.put('TABLE', attendees);
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

		// 	List<Attendee__c> attendees = [
		// 		SELECT Id, Name, IsInstructor__c
		// 		FROM Attendee__c
		// 		WHERE Delivery__c = :deliveryId
		// 		ORDER BY Name
		// 	];
		// 	List<Exercise__c> exercises = [
		// 		SELECT
		// 			Id,
		// 			Name,
		// 			(
		// 				SELECT ID, Attendee__c, Attendee__r.Name, Status__c, lastModifiedDate
		// 				FROM Exercises_X_Attendees__r
		// 				WHERE Attendee__c IN :attendees
		// 				ORDER BY lastModifiedDate ASC
		// 			)
		// 		FROM Exercise__c
		// 		WHERE
		// 			Id IN (
		// 				SELECT Exercise__c
		// 				FROM Exercise_X_Attendee__c
		// 				WHERE Attendee__r.Delivery__c = :deliveryId
		// 			)
		// 		ORDER BY Name
		// 	];
		// 	output.put('ATTENDEES', attendees);
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

		// 			List<Attendee__c> attendees = [
		// 				SELECT Id, Name
		// 				FROM Attendee__c
		// 				WHERE Delivery__c = :deliveryId
		// 				ORDER BY Name
		// 			];

		// 			List<Exercise_X_Attendee__c> existingExA = [
		// 				SELECT Attendee__c
		// 				FROM Exercise_X_Attendee__c
		// 				WHERE Attendee__r.Delivery__c = :deliveryId AND Exercise__c = :exerciseId
		// 			];

		// 			if (existingExA.size() < attendees.size()) {
		// 				// Must create missing ExA
		// 				Set<Id> missingAttendeeIds = new Set<Id>();
		// 				for (Attendee__c attendee : attendees) {
		// 					missingAttendeeIds.add(attendee.Id);
		// 				}
		// 				for (Exercise_X_Attendee__c ExA : existingExA) {
		// 					missingAttendeeIds.remove(ExA.Attendee__c);
		// 				}
		// 				if (missingAttendeeIds.size() > 0) {
		// 					List<Exercise_X_Attendee__c> newExA = new List<Exercise_X_Attendee__c>();
		// 					for (Id attendeeId : missingAttendeeIds) {
		// 						newExA.add(
		// 							new Exercise_X_Attendee__c(
		// 								Attendee__c = attendeeId,
		// 								Exercise__c = exerciseId,
		// 								Status__c = '00-START'
		// 							)
		// 						);
		// 					}
		// 					insert newExA;
		// 				} else {
		// 					throw new CalloutException('I thought you said we were missing records...');
		// 				}
		// 			} else if (attendees.size() == existingExA.size()) {
		// 				// Good to go
		// 			} else {
		// 				// Why?
		// 				throw new CalloutException(
		// 					'There are [' +
		// 					existingExA.size() +
		// 					'] ExA records, but only [' +
		// 					attendees.size() +
		// 					'] attendees'
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
	public static void updateAttendeeStatus(String ExA, String exerciseId, String attendeeId, String status) {
		// Exercise_X_Attendee__c record = new Exercise_X_Attendee__c(
		// 	Attendee__c = attendeeId,
		// 	Exercise__c = exerciseId,
		// 	Status__c = status
		// );
		// if (String.isEmpty(ExA)) {
		// 	insert record;
		// } else {
		// 	record.Id = ExA;
		// 	update record;
		// }
	}
}
